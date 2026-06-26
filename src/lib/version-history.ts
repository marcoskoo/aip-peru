// ─── Historial de Versiones del Aplicativo AIP PERÚ ────────────────────
//
// Registro cronológico de cambios del aplicativo. Cada entrada tiene:
//  - version: etiqueta de versión (vX.Y)
//  - date: fecha ISO (YYYY-MM-DD)
//  - title: resumen corto
//  - changes: lista de cambios detallados
//  - tag: categoría (feature, fix, improvement, etc.)

export interface VersionEntry {
  version: string
  date: string // YYYY-MM-DD
  title: string
  tag: "feature" | "fix" | "improvement" | "data" | "ui"
  changes: string[]
}

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "v1.4.0",
    date: "2026-06-26",
    title: "Corrección de scroll en panel de preview",
    tag: "fix",
    changes: [
      "Corregido el problema de scroll vertical dentro del iframe del panel de preview (overflow-y: auto + overscroll-behavior: none en <html>)",
      "Habilitado momentum scroll en dispositivos iOS (-webkit-overflow-scrolling: touch)",
      "Verificación end-to-end del briefing multi-estación con NOTAMs en formato crudo ordenados por vencimiento",
    ],
  },
  {
    version: "v1.3.0",
    date: "2026-06-25",
    title: "INFO SPIM, Briefing Múltiple y ordenamiento de NOTAMs PERM",
    tag: "feature",
    changes: [
      "Renombrado 'Agente SPIM' → 'INFO SPIM' en toda la navegación y títulos",
      "Nueva pestaña 'Briefing Múltiple' en INFO SPIM: consulta METAR, TAF y NOTAMs de varias estaciones a la vez (ej: SPHI, SPRU, SPEO con o sin comas)",
      "Bloque 1: METAR y TAF de todas las estaciones solicitadas en formato crudo",
      "Bloque 2: NOTAMs de todas las estaciones solicitadas en formato crudo OACI, ordenados por fin de vigencia (más próximo a vencer primero)",
      "NOTAMs permanentes (PERM en campo C) movidos al FINAL de la lista de prioridad — no compiten temporalmente con los que tienen vencimiento",
      "Relojes de cuenta regresiva (countdown timers) en vivo: azul normal > 30 min, rojo pulsante ≤ 30 min, verde PERM, ámbar PRÓXIMO",
      "Fix del error 'fetcherRef.current is not a function' en hook usePolling (API reescrita a argumentos posicionales)",
      "Botón de descarga del proyecto completo (.zip) en el header — streaming con Content-Disposition: attachment",
      "Endpoint /api/download para servir el zip del proyecto",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-06-25",
    title: "Integración del bundle NOTAM Countdown",
    tag: "feature",
    changes: [
      "Integrado el bundle 'NOTAM Countdown' en la sección INFO SPIM (adaptado a Prisma + PostgreSQL)",
      "Reloj de cuenta regresiva en cada NOTAM con colores críticos (azul > 5min, rojo pulsante ≤ 5min, PERM verde, EXPIRADO rojo, PRÓXIMO ámbar)",
      "Auto-polling cada 30s con switch toggle + countdown 'próxima consulta en Ns'",
      "Ingesta manual de NOTAMs (NotamIngestDialog) — pega texto del portal AIS Perú, parser OACI extrae cada NOTAM, upsert idempotente en Prisma",
      "Sort por urgencia: NOTAMs ordenados por expiración más próxima primero, PERM al final, expirados filtrados",
      "Parser OACI en TypeScript (notam-parser.ts) — espejo del script Python",
      "suppressHydrationWarning en Input/Textarea (fix de extensiones de navegador)",
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-06-25",
    title: "Rediseño de INFO SPIM con dashboard y vista de estación",
    tag: "ui",
    changes: [
      "Dashboard con header estilo agente (icono verde, Live·30s, stats cards, tabs)",
      "Lista de 65 estaciones peruanas con búsqueda por ICAO/IATA/ciudad",
      "Vista de detalle de estación con tabs METAR/TAF/NOTAM",
      "Versiones legibles + crudas + JSON toggle para METAR y TAF",
      "NOTAMs con campos OACI estructurados (Q/A/B/C/D/E/F/G) y countdown timers",
      "Endpoint GET /api/spim-agent/stats (dashboard) y GET /api/spim-agent/station/[icao] (detalle)",
      "Pegado masivo de NOTAMs con clasificación automática por aeródromo",
      "Agente IA (LLM) con briefing operacional + chat interactivo",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-06-22",
    title: "Lanzamiento inicial de AIP PERÚ",
    tag: "feature",
    changes: [
      "Publicación de Información Aeronáutica de la República del Perú",
      "32 aeródromos integrados (11 internacionales + 21 nacionales) con datos de AIP",
      "Carta aeronáutica interactiva con aerovías, waypoints y radioayudas",
      "Calculadora aeronáutica (altitud de densidad, viento, QNH, amanecer/atardecer, conversión)",
      "Plan de vuelo con generación de FPL OACI",
      "Buscador global (Ctrl+K / Cmd+K)",
      "Zonas de espacio aéreo restringido",
      "Helipuertos",
      "Navegador de publicaciones AIP (GEN, ENR, AD)",
      "Soporte de tema claro/oscuro",
      "Diseño responsive con shadcn/ui",
    ],
  },
]

// Helper para obtener la versión actual (la más reciente)
export const CURRENT_VERSION = VERSION_HISTORY[0]

// Helper para formatear fecha ISO → DD/MM/YYYY
export function formatVersionDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}
