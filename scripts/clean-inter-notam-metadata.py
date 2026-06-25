#!/usr/bin/env python3
"""
Limpieza masiva de metadata inter-NOTAM pegada en todos los NOTAMs de la BD.

El portal AIS Perú inserta, antes de cada NOTAM, líneas como:
    "SPEO - CHIMBOTE"
    "18/06/2026 01:04:00"

Que el parser antiguo pegaba al final del mensaje del NOTAM anterior. Este
script recorre todos los NOTAMs de la BD, detecta esa metadata con el regex
INTER_NOTAM_META_RE (corregido) y trunca el mensaje + summary antes de ella.

Idempotente: si se ejecuta varias veces, no hace nada en la segunda pasada.
"""
import sqlite3
import re
import importlib.util
from pathlib import Path

# Cargar el módulo Python con el regex
spec = importlib.util.spec_from_file_location(
    'np', '/home/z/my-project/scripts/notam-email-parser.py'
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
INTER_NOTAM_META_RE = mod.INTER_NOTAM_META_RE

DB = Path('/home/z/my-project/data/notams.db')
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row

print(f'=== Limpieza masiva de metadata inter-NOTAM en {DB} ===')
print()

rows = conn.execute(
    'SELECT id, notam_id, icao, message, summary FROM notams ORDER BY icao, notam_id'
).fetchall()
print(f'Total NOTAMs en BD: {len(rows)}')

updated = 0
skipped = 0
for row in rows:
    msg = row['message']
    summary = row['summary'] or ''

    # Buscar metadata en el mensaje
    m = INTER_NOTAM_META_RE.search(msg)
    if not m or m.start() < 30:
        skipped += 1
        continue

    before = msg[:m.start()].rstrip()
    if len(before) < 30:
        skipped += 1
        continue

    # Truncar también el summary si contiene rastros de la metadata
    # Buscar la primera ocurrencia de patrón tipo "ICAO -" o fecha sola al final
    new_summary = summary
    # Caso a: summary contiene "SPXX - CIUDAD" o fecha pegada
    sm = re.search(
        r'\s+(?:'
        rf'(?:{"|".join(mod.PERUVIAN_ICAOS)})\s*-\s*[A-Z]'
        r'|\d{{1,2}}/\d{{1,2}}/\d{{4}}\s+\d{{1,2}}:\d{{2}}'
        r')',
        summary,
    )
    if sm:
        new_summary = summary[:sm.start()].rstrip()

    # Solo actualizar si algo cambió
    if before != msg or new_summary != summary:
        conn.execute(
            'UPDATE notams SET message = ?, summary = ? WHERE id = ?',
            (before, new_summary, row['id']),
        )
        updated += 1
    else:
        skipped += 1

conn.commit()
print(f'NOTAMs actualizados (limpiados): {updated}')
print(f'NOTAMs sin cambios:              {skipped}')
print()

# Verificación post-limpieza
print('=== Verificación post-limpieza ===')
remaining = 0
rows2 = conn.execute('SELECT message FROM notams').fetchall()
for row in rows2:
    m = INTER_NOTAM_META_RE.search(row['message'])
    if m and m.start() > 30:
        remaining += 1
print(f'NOTAMs con metadata restante: {remaining}')

# Mostrar algunos ejemplos limpiados
print()
print('=== Ejemplos de verificación ===')
for notam_id in ['A2217/26', 'A1690/26', 'A2194/26', 'C2152/26']:
    row = conn.execute(
        'SELECT message, summary FROM notams WHERE notam_id = ?',
        (notam_id,),
    ).fetchone()
    if row:
        print(f'\n--- {notam_id} ---')
        print(f'message (últimos 100): ...{row["message"][-100:]!r}')
        print(f'summary (últimos 100): ...{row["summary"][-100:]!r}')

conn.close()
print()
print('=== Limpieza completada ===')
