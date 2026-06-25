# Guía de Integración — NOTAM Countdown Bundle

Cómo incorporar estos archivos a un proyecto Next.js existente.

## Paso 0 — Requisitos previos

Asegúrate de que tu proyecto tiene:

- Next.js 14+ con App Router
- React 18+
- TypeScript
- shadcn/ui configurado (si no, ejecuta `npx shadcn@latest init`)
- `lucide-react` instalado

Instala la dependencia crítica:

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

## Paso 1 — Configurar `next.config.ts`

Para que Next.js no intente procesar `better-sqlite3` con webpack (es un binding C++ nativo):

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
```

## Paso 2 — Copiar archivos

Copia los archivos del bundle a las rutas correspondientes de tu proyecto:

```bash
# Lib (lógica de negocio)
cp src/lib/aviation/notams-sqlite.ts  tu-proyecto/src/lib/aviation/
cp src/lib/aviation/notam-parser.ts   tu-proyecto/src/lib/aviation/
cp src/lib/aviation/notam.ts          tu-proyecto/src/lib/aviation/
cp src/lib/aviation/use-polling.ts    tu-proyecto/src/lib/aviation/

# Componentes UI (sobrescriben los de shadcn/ui)
cp src/components/ui/input.tsx        tu-proyecto/src/components/ui/
cp src/components/ui/textarea.tsx     tu-proyecto/src/components/ui/

# Componente de aviación
cp src/components/aviation/StationDetail.tsx  tu-proyecto/src/components/aviation/

# Scripts Python (opcional, solo si vas a usar el pipeline IMAP)
cp scripts/notam-email-parser.py           tu-proyecto/scripts/
cp scripts/clean-inter-notam-metadata.py   tu-proyecto/scripts/
```

## Paso 3 — Ajustar imports

### `notam-parser.ts`

El parser importa `PERUVIAN_STATIONS` desde `./peru-stations`. Tienes dos opciones:

**Opción A** (recomendada si tu proyecto es para Perú):
- Crear `src/lib/aviation/peru-stations.ts` con tu lista de estaciones, exportando `PERUVIAN_STATIONS` como array de objetos `{ icao: string, ... }`.

**Opción B** (otro país o sin lista de estaciones):
- Reemplazar la línea:
  ```typescript
  import { PERUVIAN_ICAOS } from './peru-stations';
  const PERUVIAN_ICAOS = new Set(PERUVIAN_STATIONS.map((s) => s.icao));
  ```
  por una lista hardcodeada:
  ```typescript
  const PERUVIAN_ICAOS = new Set(['SPJC', 'SPZO', 'SPHI', /* ... */]);
  ```
  Y renombrar `PERUVIAN_ICAOS` a algo apropiado para tu región.

### `notam.ts`

Si no usas Next.js, elimina la dependencia de `NextResponse`:

```typescript
// Eliminar:
import { NextResponse } from 'next/server';
// Eliminar la función notamApiOk o reemplazarla por:
export function notamApiOk(payload: NotamResponse) {
  return { ok: true, data: payload, meta: { generatedAt: new Date().toISOString() } };
}
```

Si no quieres los fallbacks AVWX/FAA, deja solo `trySqlite()`:

```typescript
export async function getNotams(icao: string): Promise<NotamResponse> {
  const upper = icao.toUpperCase();
  return trySqlite(upper) ?? { icao: upper, count: 0, items: [], source: 'NONE' };
}
```

### `StationDetail.tsx`

Este componente importa:

```typescript
import type { PeruvianStation } from '@/lib/aviation/peru-stations';
import { formatNumber as fmt } from '@/lib/aviation/peru-stations';
import { NotamIngestDialog } from './NotamIngestDialog';
import { NotamDeleteButton } from './NotamDeleteButton';
```

- `PeruvianStation`: interfaz que describe una estación (icao, iata, name, city, lat, lon, etc.). Adáptala a tu tipo de estación.
- `formatNumber`: helper para formatear números (elevación, etc.). Puedes reemplazarlo por `Intl.NumberFormat` o eliminarlo.
- `NotamIngestDialog` y `NotamDeleteButton`: componentes auxiliares para ingesta manual y borrado. Si no los necesitas, elimina sus imports y usos.

## Paso 4 — Crear la API route

Si tu proyecto no tiene un endpoint `/api/aviation/all/[icao]`, créalo:

```typescript
// src/app/api/aviation/all/[icao]/route.ts
import { NextResponse } from 'next/server';
import { getNotams } from '@/lib/aviation/notam';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ icao: string }> },
) {
  const { icao } = await params;
  const notam = await getNotams(icao);
  return NextResponse.json({
    ok: true,
    data: {
      notam,
      // metar, taf: agrega aquí tus fuentes
    },
  });
}
```

## Paso 5 — Probar el reloj de cuenta regresiva

Inserta un NOTAM de prueba en la BD para verificar que el reloj funciona:

```typescript
import { insertNotams } from '@/lib/aviation/notams-sqlite';

// NOTAM que expira en 10 minutos
const inTenMin = new Date(Date.now() + 10 * 60 * 1000).toISOString();
const now = new Date().toISOString();

insertNotams([{
  icao: 'SPJC',
  notam_id: 'A9999/26',
  notam_type: 'NOTAMN',
  ref_notam_id: null,
  message: 'A9999/26 NOTAMN\nQ) SPIM/QFALC/IV/NBO/A/000/999/SPJC\nA) SPJC\nB) 2606250100\nC) 2606250110\nE) TEST NOTAM PARA RELOJ',
  summary: 'TEST NOTAM PARA RELOJ',
  filed: now,
  valid_from: now,
  valid_to: inTenMin,
  classification: 'FALC',
  source_email_id: 'test',
}]);
```

Abre tu dashboard, selecciona la estación SPJC, y deberías ver:
- El NOTAM A9999/26 con un reloj en **azul negrita** mostrando `00:09:59`, `00:09:58`, ...
- Cuando falten ≤ 5 minutos, el reloj cambia a **rojo negrita con pulso**.
- Al expirar, muestra "EXPIRADO" en rojo.

## Paso 6 — Pipeline email IMAP (opcional)

Si quieres poblar la BD automáticamente desde emails de AIS Perú:

1. **Suscríbete** al servicio de NOTAMs de AIS Perú (ais@corpac.gob.pe).
2. **Crea una cuenta Gmail** dedicada y genera un App Password.
3. **Configura `.env`** con las credenciales IMAP.
4. **Ejecuta manualmente** la primera vez:
   ```bash
   python scripts/notam-email-parser.py
   ```
5. **Configura un cron** cada 5 minutos:
   ```bash
   */5 * * * * cd /ruta/a/tu/proyecto && python scripts/notam-email-parser.py >> logs/notam-email.log 2>&1
   ```

## Paso 7 — Limpieza de datos existentes (opcional)

Si ya tenías NOTAMs en la BD y quieres limpiar metadata del portal AIS pegada al final de los mensajes:

```bash
python scripts/clean-inter-notam-metadata.py
```

Esto re-procesa todos los NOTAMs existentes y trunca cualquier línea de metadata inter-NOTAM.

## Verificación final

Lista de comprobación tras la integración:

- [ ] `npx tsc --noEmit` no reporta errores en `src/`
- [ ] El endpoint `/api/aviation/all/[ICAO]` devuelve NOTAMs con campos `effectiveStart`, `effectiveEnd`
- [ ] El componente `StationDetail` muestra el reloj de cuenta regresiva junto a cada NOTAM
- [ ] El reloj cambia de azul a rojo en los últimos 5 minutos
- [ ] No hay errores de hidratación en consola del navegador
- [ ] El polling cada 30s refresca los datos automáticamente

## Troubleshooting

### "Cannot find module 'better-sqlite3'"

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

Si el error persiste en dev mode, asegúrate de que `next.config.ts` tiene `serverExternalPackages: ['better-sqlite3']`.

### "database is locked"

Cierre de BD pendiente. Llama a `resetDbConnection()` antes de operaciones críticas, o reinicia el proceso de Next.js.

### Hydration mismatch en `<textarea>` o `<input>`

Ya está resuelto por `suppressHydrationWarning` en los componentes `Textarea` e `Input` del bundle. Si el error persiste en otros elementos, añade `suppressHydrationWarning` directamente al elemento afectado.

### El reloj no aparece

Verifica que el NOTAM tenga `valid_to` no nulo y distinto de `"PERM"`. Los NOTAMs permanentes muestran "PERM" en verde en lugar del reloj.

### El reloj muestra "EXPIRADO" inmediatamente

Comprueba que `valid_to` esté en formato ISO 8601 con `Z` (UTC): `2026-06-25T12:00:00Z`. Si falta la `Z`, el parser de fechas interpreta la hora como local y puede haber desfase.
