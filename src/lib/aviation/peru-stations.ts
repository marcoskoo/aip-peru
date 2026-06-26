/**
 * Lista de estaciones peruanas (FIR SPIM).
 *
 * Usada por:
 *  - notam-parser.ts (para validar que un NOTAM es de FIR SPIM)
 *  - scripts/notam-email-parser.py (espejo Python de esta lista)
 *  - StationDetail/SpimBriefing (para mostrar metadata de la estación)
 *
 * Mantener sincronizado con:
 *  - PERUVIAN_ICAOS en scripts/notam-email-parser.py
 *  - seed data en prisma/seed.ts
 */

export interface PeruvianStation {
  icao: string
  iata?: string
  name: string
  city: string
  region?: string
  type: 'INTERNACIONAL' | 'NACIONAL' | 'MILITAR' | 'HELIPUERTO'
  elevationFt?: number
  lat: number
  lon: number
  frequencies?: string
}

// Lista canónica de ICAOs peruanos — espejo de scripts/notam-email-parser.py.
// Cualquier ICAO SP** que falte aquí debe agregarse también en el script Python.
export const PERUVIAN_ICAOS = new Set<string>([
  'SPAL', 'SPAS', 'SPAY', 'SPBC', 'SPCL', 'SPCM', 'SPCV', 'SPDR',
  'SPDT', 'SPEE', 'SPEO', 'SPEP', 'SPGB', 'SPGM', 'SPGP', 'SPHI',
  'SPHO', 'SPHY', 'SPHZ', 'SPIM', 'SPIN', 'SPIR', 'SPJA', 'SPJC',
  'SPJE', 'SPJI', 'SPJJ', 'SPJL', 'SPJR', 'SPKI', 'SPLA', 'SPLB',
  'SPLH', 'SPLN', 'SPLO', 'SPLP', 'SPLX', 'SPME', 'SPMF', 'SPMS',
  'SPNC', 'SPNM', 'SPOA', 'SPON', 'SPPH', 'SPPY', 'SPQM', 'SPQT',
  'SPQU', 'SPRU', 'SPSE', 'SPSO', 'SPST', 'SPTN', 'SPTU', 'SPUC',
  'SPUI', 'SPUR', 'SPVN', 'SPWB', 'SPWT', 'SPYL', 'SPYO', 'SPZA',
  'SPZO',
])

// Estaciones principales con metadata completa.
// Las demás (SPAL, SPAS, etc.) se resuelven solo por ICAO en el frontend.
export const PERUVIAN_STATIONS: PeruvianStation[] = [
  {
    icao: 'SPJC',
    iata: 'LIM',
    name: 'AEROPUERTO INTERNACIONAL JORGE CHÁVEZ',
    city: 'Lima',
    region: 'LIMA',
    type: 'INTERNACIONAL',
    elevationFt: 113,
    lat: -12.0216,
    lon: -77.1143,
    frequencies: 'TWR 118.30 · APP 119.70 · GND 121.90',
  },
  {
    icao: 'SPZO',
    iata: 'CUZ',
    name: 'AEROPUERTO INTERNACIONAL VELASCO ASTETE',
    city: 'Cusco',
    region: 'CUSCO',
    type: 'INTERNACIONAL',
    elevationFt: 10857,
    lat: -13.5357,
    lon: -71.9388,
    frequencies: 'TWR 118.30 · APP 119.70',
  },
  {
    icao: 'SPQT',
    iata: 'IQT',
    name: 'AEROPUERTO INTERNACIONAL CORONEL FAP FRANCISCO SECADA VIGNETTA',
    city: 'Iquitos',
    region: 'LORETO',
    type: 'INTERNACIONAL',
    elevationFt: 409,
    lat: -3.7847,
    lon: -73.3088,
    frequencies: 'TWR 118.30 · APP 119.70',
  },
  {
    // SPHI / CIX = Chiclayo (Lambayeque).
    // Cap. FAP José Abelardo Quiñones Gonzáles.
    // Datos sincronizados con prisma/seed.ts y prisma/seed-additional-data.ts.
    // Coords ARP: 06°47'24"S / 079°49'34"W  ·  VOR CIX 114.5 · NDB HIC 305
    icao: 'SPHI',
    iata: 'CIX',
    name: 'AEROPUERTO INTERNACIONAL CAP. FAP JOSÉ ABELARDO QUIÑONES GONZALES',
    city: 'Chiclayo',
    region: 'LAMBAYEQUE',
    type: 'INTERNACIONAL',
    elevationFt: 95,
    lat: -6.79,
    lon: -79.8261,
    frequencies: 'TWR 118.30 · APP 119.10 · GND 121.90 · ATIS 127.60',
  },
  {
    // SPRU / TRU = Trujillo (La Libertad).
    // Cap. FAP Carlos Martínez de Pinillos.
    // Datos sincronizados con prisma/seed.ts y prisma/seed-additional-data.ts.
    // Coords ARP: 08°04'54"S / 079°06'31"W  ·  VOR TRU 116.3
    icao: 'SPRU',
    iata: 'TRU',
    name: 'AEROPUERTO INTERNACIONAL CAP. FAP CARLOS MARTÍNEZ DE PINILLOS',
    city: 'Trujillo',
    region: 'LA LIBERTAD',
    type: 'INTERNACIONAL',
    elevationFt: 128,
    lat: -8.0817,
    lon: -79.1086,
    frequencies: 'TWR 118.70 · APP 119.30 · GND 121.90 · ATIS 132.60',
  },
  {
    icao: 'SPQU',
    iata: 'AQP',
    name: 'AEROPUERTO INTERNACIONAL ALFREDO RODRÍGUEZ BALLÓN',
    city: 'Arequipa',
    region: 'AREQUIPA',
    type: 'INTERNACIONAL',
    elevationFt: 8405,
    lat: -16.3411,
    lon: -71.5830,
    frequencies: 'TWR 118.30 · APP 119.70',
  },
  {
    // SPCL / PCL = Pucallpa (Ucayali).
    // Cap. FAP David Abensur Ríos.
    // Datos sincronizados con prisma/seed-additional-data.ts.
    // Coords ARP: 08°22'39"S / 074°34'29"W  ·  VOR PUL 116.7
    icao: 'SPCL',
    iata: 'PCL',
    name: 'AEROPUERTO INTERNACIONAL CAP. FAP DAVID ABENSUR RÍOS',
    city: 'Pucallpa',
    region: 'UCAYALI',
    type: 'INTERNACIONAL',
    elevationFt: 515,
    lat: -8.3775,
    lon: -74.5747,
    frequencies: 'TWR 126.90 · APP 118.10 · FIS 126.90',
  },
  {
    icao: 'SPIM',
    name: 'CENTRO DE CONTROL DE ÁREA — FIR LIMA',
    city: 'Lima',
    region: 'LIMA',
    type: 'NACIONAL',
    lat: -12.0216,
    lon: -77.1143,
    frequencies: 'ACC 126.30 · 128.30',
  },
]

/**
 * Mapa rápido ICAO → PeruvianStation, solo para las estaciones principales.
 */
export const PERUVIAN_STATIONS_BY_ICAO = new Map<string, PeruvianStation>(
  PERUVIAN_STATIONS.map((s) => [s.icao, s]),
)

/**
 * Devuelve la estación conocida por ICAO, o null si no está en la lista de
 * metadata (aunque siga siendo un ICAO peruano válido).
 */
export function getStation(icao: string): PeruvianStation | null {
  return PERUVIAN_STATIONS_BY_ICAO.get(icao.toUpperCase()) ?? null
}

/**
 * Formatea un número (ej. elevación en pies) con separador de miles.
 */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-PE').format(n)
}
