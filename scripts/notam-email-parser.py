#!/usr/bin/env python3
"""
NOTAM Email Parser — AIS Perú → SQLite
=======================================

Lee correos del boletín NOTAM enviado por CORPAC AIS Perú desde un buzón
IMAP (Gmail recomendado), extrae los NOTAMs en formato OACI y los inserta
en una base SQLite local para que la API de Next.js los sirva.

USO:
    python3 notam-email-parser.py

VARIABLES DE ENTORNO (leer desde .env o exportar):
    NOTAM_IMAP_HOST       Ej: imap.gmail.com
    NOTAM_IMAP_PORT       Ej: 993
    NOTAM_IMAP_USER       correo@gmail.com
    NOTAM_IMAP_PASS       app password (NO la contraseña normal de Gmail)
    NOTAM_IMAP_FOLDER     Opcional, default "INBOX"
    NOTAM_SENDER_FILTER   Opcional, ej: "ais@corpac.gob.pe"
    NOTAMS_DB_PATH        Default: /home/z/my-project/data/notams.db

CRON (cada 5 minutos):
    */5 * * * * cd /home/z/my-project && /usr/bin/env $(cat .env | xargs) \
        python3 scripts/notam-email-parser.py >> /var/log/notam-parser.log 2>&1

El script es idempotente: usa la PRIMARY KEY UNIQUE de notam_id para
evitar duplicados entre corridas.
"""

from __future__ import annotations

import os
import re
import sys
import json
import email
import imaplib
import sqlite3
import hashlib
from datetime import datetime, timezone
from email.header import decode_header
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Iterable, Optional

# ----------------------------------------------------------------------------
# Configuración
# ----------------------------------------------------------------------------

DB_PATH = os.environ.get("NOTAMS_DB_PATH", "/home/z/my-project/data/notams.db")
IMAP_HOST = os.environ.get("NOTAM_IMAP_HOST", "imap.gmail.com")
IMAP_PORT = int(os.environ.get("NOTAM_IMAP_PORT", "993"))
IMAP_USER = os.environ.get("NOTAM_IMAP_USER", "")
IMAP_PASS = os.environ.get("NOTAM_IMAP_PASS", "")
IMAP_FOLDER = os.environ.get("NOTAM_IMAP_FOLDER", "INBOX")
SENDER_FILTER = os.environ.get("NOTAM_SENDER_FILTER", "").lower()
MARK_AS_READ = os.environ.get("NOTAM_MARK_AS_READ", "1") == "1"  # default True

# Lista de ICAOs peruanos (FIR SPIM). Solo insertamos NOTAMs cuyo ICAO
# matches uno de estos. Se carga desde peru-stations.ts via JSON auxiliar
# generado por el script, o se hardcodea como fallback.
# Mantener sincronizado con src/lib/aviation/peru-stations.ts.
PERUVIAN_ICAOS = {
    "SPAL", "SPAS", "SPAY", "SPBC", "SPCL", "SPCM", "SPCV", "SPDR",
    "SPDT", "SPEE", "SPEO", "SPEP", "SPGB", "SPGM", "SPGP", "SPHI",
    "SPHO", "SPHY", "SPHZ", "SPIM", "SPIN", "SPIR", "SPJA", "SPJC",
    "SPJE", "SPJI", "SPJJ", "SPJL", "SPJR", "SPKI", "SPLA", "SPLB",
    "SPLH", "SPLN", "SPLO", "SPLP", "SPLX", "SPME", "SPMF", "SPMS",
    "SPNC", "SPNM", "SPOA", "SPON", "SPPH", "SPPY", "SPQM", "SPQT",
    "SPQU", "SPRU", "SPSE", "SPSO", "SPST", "SPTN", "SPTU", "SPUC",
    "SPUI", "SPUR", "SPVN", "SPWB", "SPWT", "SPYL", "SPYO", "SPZA",
    "SPZO",
}

# ----------------------------------------------------------------------------
# Esquema SQLite
# ----------------------------------------------------------------------------

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS notams (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    icao            TEXT NOT NULL,
    notam_id        TEXT NOT NULL UNIQUE,
    notam_type      TEXT,
    ref_notam_id    TEXT,
    message         TEXT NOT NULL,
    summary         TEXT,
    filed           TEXT,
    valid_from      TEXT,
    valid_to        TEXT,
    classification  TEXT,
    source_email_id TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notams_icao  ON notams(icao);
CREATE INDEX IF NOT EXISTS idx_notams_valid ON notams(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_notams_filed ON notams(filed);
"""

# ----------------------------------------------------------------------------
# Parser de NOTAM (formato OACI)
# ----------------------------------------------------------------------------

# Pattern OACI: A1234/25 NOTAMN/N/R/C
NOTAM_HEADER_RE = re.compile(
    r"\b([A-Z]\d{3,4})\s*/\s*(\d{2})\s+NOTAM([NRCA]?)\b",
    re.IGNORECASE,
)
# Q-line: Q)SPIM/QXXXX/...
Q_LINE_RE = re.compile(
    r"Q\)\s*([A-Z]{4})\s*/\s*([A-Z]+)",
    re.IGNORECASE,
)
# A-line: A) SPJC
A_LINE_RE = re.compile(r"A\)\s*([A-Z]{4})\b", re.IGNORECASE)
# B-line: B) 2501151200
DATE_LINE_RE = re.compile(
    r"([BC])\)\s*(\d{6})(\d{4})?",
    re.IGNORECASE,
)
# C-line: optional PERM
PERM_RE = re.compile(r"C\)\s*PERM\b", re.IGNORECASE)

# Para NOTAMR/NOTAMC: el NOTAM referenciado aparece tras el tipo
REF_RE = re.compile(
    r"NOTAM[RC]\s+([A-Z]\d{3,4}/\d{2})",
    re.IGNORECASE,
)

# Metadata inter-NOTAM del portal AIS Perú.
# El portal inserta, antes de cada NOTAM, una línea con el formato:
#     "SPEO - CHIMBOTE"
#     "18/06/2026 01:04:00"
# (o variantes como "SPEO - CHIMBOTE  18/06/2026 01:04:00" en una sola línea,
#  o con línea en blanco entre la ciudad y la fecha).
# Esta metadata NO es parte del NOTAM anterior — el parser la corta del mensaje.
#
# Para no romper mensajes que casualmente contengan "SPXX - Something", exigimos:
#   - ICAO debe ser peruano (conjunto PERUVIAN_ICAOS).
#   - La fecha debe tener formato DD/MM/YYYY HH:MM:SS o DD/MM/YYYY.
_PERUVIAN_ICAOS_ALT = "|".join(sorted(PERUVIAN_ICAOS))
INTER_NOTAM_META_RE = re.compile(
    r"(?:"
    # Patrón 1: "SPXX - CIUDAD\nDD/MM/YYYY HH:MM:SS" (salto directo)
    rf"(?:\b(?:{_PERUVIAN_ICAOS_ALT})\b\s*-\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{{1,40}}\s*\n\s*\d{{1,2}}/\d{{1,2}}/\d{{4}}(?:\s+\d{{1,2}}:\d{{2}}(?::\d{{2}})?)?)"
    # Patrón 1b: "SPXX - CIUDAD\n\nDD/MM/YYYY HH:MM:SS" (con línea en blanco)
    rf"|(?:\b(?:{_PERUVIAN_ICAOS_ALT})\b\s*-\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{{1,40}}\s*\n\s*\n\s*\d{{1,2}}/\d{{1,2}}/\d{{4}}(?:\s+\d{{1,2}}:\d{{2}}(?::\d{{2}})?)?)"
    # Patrón 2: "SPXX - CIUDAD  DD/MM/YYYY HH:MM:SS" (una sola línea, 2+ espacios o tab)
    rf"|(?:\b(?:{_PERUVIAN_ICAOS_ALT})\b\s*-\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{{1,40}}\s{{2,}}\d{{1,2}}/\d{{1,2}}/\d{{4}}(?:\s+\d{{1,2}}:\d{{2}}(?::\d{{2}})?)?)"
    # Patrón 3: línea aislada con fecha sola, SOLO si va después de una línea en blanco o es la última del chunk
    r"|(?:\n\s*\n\s*\d{1,2}/\d{1,2}/\d{4}\s+\d{1,2}:\d{2}(?::\d{2})?\s*$)"
    r")",
    re.IGNORECASE,
)


def _parse_notam_date(yyMMdd: str, HHmm: str = "0000") -> str:
    """Convierte '250115' + '1200' → ISO 8601 '2025-01-15T12:00:00Z'."""
    if not yyMMdd or len(yyMMdd) != 6:
        return ""
    yy = int(yyMMdd[:2])
    year = 2000 + yy if yy < 80 else 1900 + yy
    mm = int(yyMMdd[2:4])
    dd = int(yyMMdd[4:6])
    if len(HHmm) < 4:
        HHmm = HHmm.ljust(4, "0")
    h = int(HHmm[:2])
    mi = int(HHmm[2:4])
    try:
        return datetime(year, mm, dd, h, mi, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    except ValueError:
        return ""


def _extract_icao_from_message(msg: str) -> Optional[str]:
    """Extrae el ICAO del A) line o del notam_id."""
    # 1. A) line
    m = A_LINE_RE.search(msg)
    if m:
        icao = m.group(1).upper()
        if icao in PERUVIAN_ICAOS:
            return icao
    # 2. Si A) no está o no es peruano, intentamos ver si el notam_id empieza con SP
    # (no es estándar, pero algunos países lo hacen)
    return None


def parse_notams(text: str, source_email_id: str = "") -> list[dict]:
    """
    Extrae todos los NOTAMs del texto plano de un email.

    Cada NOTAM OACI tiene la estructura:
        A1234/25 NOTAMN
        Q) SPIM/QFALC/IV/NBO/A/000/999/...
        A) SPJC
        B) 2501151200
        C) 2501161200
        E) RWY 15/33 CLOSED FOR MAINTENANCE
        ...

    Algunos boletines traen varios NOTAMs concatenados, separados por
    líneas en blanco o por cabecera repetida.
    """
    items: list[dict] = []

    # Normalizamos: convertimos =XX quoted-printable a texto, colapsamos
    # saltos de línea suaves dentro de un mismo NOTAM.
    text = text.replace("=\r\n", "").replace("=\n", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Trocear por cabeceras "A1234/25 NOTAM"
    # Usamos finditer para detectar el inicio de cada NOTAM
    starts = [m.start() for m in NOTAM_HEADER_RE.finditer(text)]
    starts.append(len(text))

    for i in range(len(starts) - 1):
        chunk = text[starts[i] : starts[i + 1]]
        m = NOTAM_HEADER_RE.search(chunk)
        if not m:
            continue

        notam_seq = m.group(1).upper()
        notam_year = m.group(2)
        notam_kind_raw = m.group(3).upper() if m.group(3) else ""
        notam_id = f"{notam_seq}/{notam_year}"

        # Tipo: NOTAMN (new), NOTAMR (replace), NOTAMC (cancel)
        # Si no trae letra, asumimos NOTAMN
        if notam_kind_raw == "N":
            notam_type = "NOTAMN"
        elif notam_kind_raw == "R":
            notam_type = "NOTAMR"
        elif notam_kind_raw == "C":
            notam_type = "NOTAMC"
        elif notam_kind_raw == "A":
            notam_type = "NOTAMA"  # very rare
        else:
            notam_type = "NOTAMN"

        # NOTAM referenciado (para R y C)
        ref_notam_id = None
        if notam_type in ("NOTAMR", "NOTAMC"):
            rm = REF_RE.search(chunk)
            if rm:
                ref_notam_id = rm.group(1).upper()

        # Q) → clasificación / FIR
        classification = None
        qm = Q_LINE_RE.search(chunk)
        if qm:
            classification = qm.group(2).upper()

        # A) → ICAO
        icao = _extract_icao_from_message(chunk)

        # B) y C) → fechas
        valid_from = None
        valid_to = None
        for bm in DATE_LINE_RE.finditer(chunk):
            if bm.group(1).upper() == "B":
                valid_from = _parse_notam_date(bm.group(2), bm.group(3) or "")
            elif bm.group(1).upper() == "C":
                if PERM_RE.search(chunk):
                    valid_to = "PERM"
                else:
                    valid_to = _parse_notam_date(bm.group(2), bm.group(3) or "")

        # Si el NOTAM menciona PERM en C)
        if PERM_RE.search(chunk):
            valid_to = "PERM"

        # El mensaje completo, limpio
        message = chunk.strip()

        # ── Cortar metadata inter-NOTAM del portal AIS Perú ──────────
        # El portal inserta entre NOTAMs líneas como:
        #   "SPEO - CHIMBOTE"
        #   "18/06/2026 01:04:00"
        # que NO son parte del NOTAM actual sino el encabezado del siguiente.
        # Las detectamos y truncamos el mensaje antes de esa línea.
        meta_match = INTER_NOTAM_META_RE.search(message)
        if meta_match and meta_match.start() > 0:
            before_meta = message[: meta_match.start()].rstrip()
            if len(before_meta) >= 30:
                message = before_meta

        # Quitamos cabeceras duplicadas al final del chunk (si se pegó con el siguiente)
        message = re.sub(r"\n{3,}", "\n\n", message)

        # Summary: primeras 200 chars del E) o del mensaje
        summary = ""
        e_match = re.search(r"E\)\s*(.+?)(?:\n[A-Z]\)|\Z)", message, re.DOTALL)
        if e_match:
            summary = re.sub(r"\s+", " ", e_match.group(1)).strip()[:200]
        else:
            summary = message[:200]

        # Si no encontramos ICAO en A), pero el mensaje menciona alguno de
        # los SP** peruanos, lo asociamos. Si no, descartamos el NOTAM.
        if not icao:
            for sp in PERUVIAN_ICAOS:
                if re.search(rf"\b{sp}\b", message):
                    icao = sp
                    break

        if not icao:
            # No es un NOTAM de FIR SPIM — lo ignoramos.
            continue

        items.append(
            {
                "icao": icao,
                "notam_id": notam_id,
                "notam_type": notam_type,
                "ref_notam_id": ref_notam_id,
                "message": message[:8000],
                "summary": summary,
                "filed": None,  # se setea abajo desde la fecha del email
                "valid_from": valid_from,
                "valid_to": valid_to,
                "classification": classification,
                "source_email_id": source_email_id,
            }
        )

    return items


# ----------------------------------------------------------------------------
# IMAP
# ----------------------------------------------------------------------------

def _decode_header(value: str) -> str:
    if not value:
        return ""
    parts = decode_header(value)
    out = []
    for text, enc in parts:
        if isinstance(text, bytes):
            out.append(text.decode(enc or "utf-8", errors="replace"))
        else:
            out.append(text)
    return "".join(out)


def _iter_emails() -> Iterable[tuple[str, str, str, str, str]]:
    """
    Genera tuplas (message_id, subject, sender, body_text, date_iso) para
    cada email NO leído del buzón IMAP.
    """
    if not IMAP_USER or not IMAP_PASS:
        print("[ERROR] NOTAM_IMAP_USER / NOTAM_IMAP_PASS no configurados.")
        return

    print(f"[imap] conectando a {IMAP_HOST}:{IMAP_PORT} como {IMAP_USER}")
    imap = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
    try:
        imap.login(IMAP_USER, IMAP_PASS)
        imap.select(IMAP_FOLDER)

        typ, data = imap.search(None, "(UNSEEN)")
        if typ != "OK":
            print(f"[imap] search error: {typ}")
            return

        uids = data[0].split()
        print(f"[imap] {len(uids)} mensajes no leídos")

        for uid in uids:
            # Usar BODY.PEEK[] en lugar de RFC822 para NO marcar como leído
            # automáticamente. Solo marcamos como leído después de procesar,
            # y solo si el sender pasa el filtro.
            typ, msg_data = imap.fetch(uid, "(BODY.PEEK[])")
            if typ != "OK" or not msg_data or not msg_data[0]:
                continue
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)

            subject = _decode_header(msg.get("Subject", ""))
            sender = _decode_header(msg.get("From", ""))
            message_id = msg.get("Message-ID", "")
            date_raw = msg.get("Date", "")

            if SENDER_FILTER and SENDER_FILTER not in sender.lower():
                print(f"[imap] saltando {message_id[:60]} (sender no filtrado)")
                continue

            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    ctype = part.get_content_type()
                    if ctype == "text/plain":
                        try:
                            payload = part.get_payload(decode=True)
                            if payload:
                                charset = part.get_content_charset() or "utf-8"
                                body += payload.decode(charset, errors="replace")
                        except Exception:
                            pass
                    elif ctype == "text/html" and not body:
                        try:
                            payload = part.get_payload(decode=True)
                            if payload:
                                charset = part.get_content_charset() or "utf-8"
                                body += _html_to_text(payload.decode(charset, errors="replace"))
                        except Exception:
                            pass
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    charset = msg.get_content_charset() or "utf-8"
                    body = payload.decode(charset, errors="replace")

            if not body:
                continue

            if MARK_AS_READ:
                imap.store(uid, "+FLAGS", "\\Seen")

            # Parsear fecha del email → ISO 8601
            date_iso = ""
            if date_raw:
                try:
                    dt = parsedate_to_datetime(date_raw)
                    if dt:
                        date_iso = dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
                except Exception:
                    pass

            yield (message_id, subject, sender, body, date_iso)

    finally:
        try:
            imap.logout()
        except Exception:
            pass


def _html_to_text(html: str) -> str:
    """Conversión HTML→texto muy básica (suficiente para NOTAMs)."""
    # Quitar tags
    text = re.sub(r"<[^>]+>", " ", html)
    # Decodificar entidades comunes
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    return text


# ----------------------------------------------------------------------------
# SQLite
# ----------------------------------------------------------------------------

def _open_db() -> sqlite3.Connection:
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA_SQL)
    return conn


def _insert_notams(conn: sqlite3.Connection, notams: list[dict]) -> tuple[int, int]:
    """Inserta NOTAMs. Devuelve (insertados, saltados_por_duplicado)."""
    insert_sql = """
        INSERT OR IGNORE INTO notams
        (icao, notam_id, notam_type, ref_notam_id, message, summary,
         filed, valid_from, valid_to, classification, source_email_id)
        VALUES (:icao, :notam_id, :notam_type, :ref_notam_id, :message, :summary,
                :filed, :valid_from, :valid_to, :classification, :source_email_id)
    """
    inserted = 0
    skipped = 0
    for n in notams:
        cur = conn.execute(insert_sql, n)
        if cur.rowcount > 0:
            inserted += 1
        else:
            skipped += 1
    conn.commit()
    return inserted, skipped


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main() -> int:
    print(f"[{datetime.now(timezone.utc).isoformat()}] inicio notam-email-parser")
    print(f"[db] {DB_PATH}")

    conn = _open_db()
    total_inserted = 0
    total_skipped = 0
    emails_processed = 0

    for message_id, subject, sender, body, date_iso in _iter_emails():
        emails_processed += 1
        print(f"[email] {message_id[:60]}…  asunto={subject[:60]}")

        notams = parse_notams(body, source_email_id=message_id)
        print(f"[parser] {len(notams)} NOTAMs peruanos encontrados")

        # Si el NOTAM no trae su propia fecha de emisión, usamos la del email
        for n in notams:
            if not n["filed"] and date_iso:
                n["filed"] = date_iso

        inserted, skipped = _insert_notams(conn, notams)
        total_inserted += inserted
        total_skipped += skipped

    conn.close()

    print(
        f"[fin] emails={emails_processed}  "
        f"notams_insertados={total_inserted}  duplicados={total_skipped}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
