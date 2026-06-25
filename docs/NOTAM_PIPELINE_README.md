# NOTAM Countdown Bundle

Paquete de código para incorporar **reloj de cuenta regresiva en NOTAMs** + **parser OACI** + **cliente SQLite** + **hook de polling** a otro proyecto Next.js / React.

## Origen

Estos archivos fueron desarrollados y probados en un dashboard de aviación para FIR Lima (SPIM) que consume NOTAMs desde el portal AIS Perú vía email IMAP → SQLite. El reloj de cuenta regresiva muestra cuánto tiempo falta para que cada NOTAM expire, con código de color:

- 🔵 **Azul negrita** (`text-blue-600 font-bold`) — faltan más de 5 minutos
- 🔴 **Rojo negrita con pulso** (`text-red-600 font-bold animate-pulse`) — últimos 5 minutos
- 🟢 **Verde "PERM"** — NOTAM permanente
- 🟡 **Ámbar "PRÓXIMO"** — NOTAM aún no vigente
- 🔴 **Rojo "EXPIRADO"** — fecha C) ya pasó

## Contenido

```
notam-countdown-bundle/
├── README.md                                  ← este archivo
├── src/
│   ├── components/
│   │   ├── aviation/
│   │   │   └── StationDetail.tsx              ← componente con reloj + vista de NOTAMs
│   │   └── ui/
│   │       ├── input.tsx                       ← Input con suppressHydrationWarning
│   │       └── textarea.tsx                    ← Textarea con suppressHydrationWarning
│   └── lib/
│       └── aviation/
│           ├── notams-sqlite.ts                ← cliente SQLite (lectura + escritura)
│           ├── notam-parser.ts                 ← parser OACI en TypeScript
│           ├── notam.ts                        ← lógica multi-fuente (SQLite → AVWX → FAA)
│           └── use-polling.ts                  ← hook de polling determinista
├── scripts/
│   ├── notam-email-parser.py                  ← parser IMAP → SQLite (Python)
│   └── clean-inter-notam-metadata.py          ← limpieza masiva de metadata AIS
└── docs/
    └── INTEGRATION.md                          ← guía de integración paso a paso
```

## Funcionalidades clave

### 1. Reloj de cuenta regresiva (`StationDetail.tsx`)

Componente React `<NotamCountdown>` que:
- Recibe `validFrom` y `validTo` (ISO 8601 o `"PERM"`)
- Se actualiza cada segundo con `useCountdown` hook
- Renderiza el tiempo restante en formato `DDd HH:MM:SS` o `HH:MM:SS`
- Cambia de color automáticamente en los últimos 5 minutos
- Maneja estados especiales: PERM, PRÓXIMO, EXPIRADO

Hook interno `useCountdown(validTo)`:
```typescript
const { remainingMs, critical, expired } = useCountdown(validTo);
// remainingMs: number | null  (null si PERM o sin fecha)
// critical: true si faltan ≤ 5 minutos
// expired: true si ya expiró
```

### 2. Parser OACI (`notam-parser.ts`)

Extrae NOTAMs en formato OACI de texto plano:
- Reconoce headers `A1234/25 NOTAMN | NOTAMR | NOTAMC`
- Parsea campos Q) A) B) C) D) E) F) G)
- Convierte fechas `YYMMDDHHmm` → ISO 8601
- Soporta `PERM` y `EST`
- **Limpia metadata inter-NOTAM del portal AIS Perú** (líneas `SPXX - CIUDAD\nDD/MM/YYYY HH:MM:SS`) que el portal inserta entre NOTAMs y que NO es parte del mensaje OACI

### 3. Cliente SQLite (`notams-sqlite.ts`)

Operaciones CRUD sobre la tabla `notams`:
- `queryNotamsByIcao(icao, { onlyActive, includeUpcoming, limit })`
  - `includeUpcoming: true` incluye NOTAMs cuyo `valid_from` es futuro pero no han expirado — relevante para planificación de vuelo
- `countActiveNotamsByIcao()` — para snapshots FIR
- `insertNotams(rows)` — con `INSERT OR IGNORE` para idempotencia
- `deleteNotam(notamId)` — limpieza
- `notamDbStats()` — diagnóstico

### 4. Lógica multi-fuente (`notam.ts`)

`getNotams(icao)` con fallback en cascada:
1. **SQLite local** (primaria, datos AIS Perú)
2. **AVWX NOTAM addon** (fallback, requiere token)
3. **FAA NOTAM Search HTML** (último recurso)

### 5. Hook de polling (`use-polling.ts`)

`usePolling({ fetcher, intervalMs, enabled })` — polling determinista (sin `Date.now()` en render para evitar mismatches de hidratación):
- `secondsToNext` — cuenta regresiva visible
- `isFetching` — indicador de carga
- `refreshNow()` — disparo manual

### 6. Corrección de hidratación (`input.tsx`, `textarea.tsx`)

Añadido `suppressHydrationWarning` a los componentes shadcn/ui `Input` y `Textarea` para silenciar el error causado por extensiones del navegador (gestores de contraseñas, "Google Chrome Reader") que inyectan atributos como `__gcruniqueid` en campos de formulario antes de que React hidrate.

### 7. Parser IMAP en Python (`notam-email-parser.py`)

Script para cron que:
- Lee emails no leídos de Gmail vía IMAP (App Password)
- Extrae NOTAMs del cuerpo del email
- Filtra solo NOTAMs peruanos (lista de 65 ICAOs)
- Inserta en SQLite con `INSERT OR IGNORE`
- Marca emails como leídos tras procesarlos

### 8. Script de limpieza (`clean-inter-notam-metadata.py`)

Limpia metadata del portal AIS Perú pegada al final de los mensajes de NOTAMs ya insertados en la BD. Útil para reparar datos históricos tras añadir la corrección del parser.

## Requisitos

- **Next.js 14+** (probado con 16.1.3 Turbopack)
- **React 18+**
- **TypeScript 5+**
- **better-sqlite3** (`npm install better-sqlite3`)
- **shadcn/ui** (componentes `Card`, `Badge`, `Button`, `Tabs`, `ScrollArea`, `Switch`, `Label`, `Separator`, `Textarea`, `Input`)
- **lucide-react** (iconos)
- **Python 3.9+** con `imaplib` (stdlib) para el parser de email

## Configuración

### `next.config.ts`

Para que `better-sqlite3` funcione en Next.js:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
```

### Variables de entorno (`.env`)

```bash
# SQLite (opcional, default: /home/z/my-project/data/notams.db)
NOTAMS_DB_PATH=/ruta/a/notams.db

# IMAP para parser Python (solo si usas el pipeline email)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=tu_correo@gmail.com
IMAP_PASSWORD=tu_app_password_de_16_caracteres
IMAP_FOLDER=INBOX

# Fallback AVWX (opcional)
AVWX_TOKEN=
```

## Esquema SQLite

```sql
CREATE TABLE notams (
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

CREATE INDEX idx_notams_icao  ON notams(icao);
CREATE INDEX idx_notams_valid ON notams(valid_from, valid_to);
CREATE INDEX idx_notams_filed ON notams(filed);
```

El esquema se crea automáticamente al primer insert (`getWriteDb()` en `notams-sqlite.ts`).

## Documentación adicional

- `docs/INTEGRATION.md` — guía paso a paso para integrar en un proyecto nuevo
- Comentarios en cada archivo explican el diseño y los trade-offs

## Notas

- El polling recomendado es **30 segundos** (no 5s) para no agotar cuotas de APIs externas.
- El reloj de cuenta regresiva se actualiza **cada 1 segundo** — es puramente cliente, no genera tráfico de red.
- El parser Python y el parser TS están sincronizados: cualquier cambio en uno debe reflejarse en el otro.
- La lista de ICAOs peruanos vive en `peru-stations.ts` (no incluido en este bundle porque es específica de Perú). Para otro país, reemplazar la lista en `notam-parser.ts` y `notam-email-parser.py`.
