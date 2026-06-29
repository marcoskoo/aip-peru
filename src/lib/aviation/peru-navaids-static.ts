/**
 * Radioayudas peruanas (VOR DME / DVOR DME / NDB / VOR) con coordenadas precisas.
 * Fuente: AIP PERÚ ENR 4.1 (Radio Navigation Aids).
 * Coordenadas verificadas contra ENR 4.1-1 (formato DMS → decimal).
 * Usado como fallback del mapa interactivo.
 *
 * NOTA: El campo `type` usa el formato canónico "VOR DME" / "DVOR DME" (con espacio,
 * sin barra) según el requisito del usuario. La función normalizeNavaidType() del
 * componente mapa normaliza cualquier variante proveniente de la BD al mismo formato.
 */

export interface PeruvianNavaid {
  id: string
  name: string
  type: string
  frequency: string
  lat: number
  lon: number
  elevation?: number | null
  class?: string
  hours?: string
  associatedAD?: string
}

export const PERUVIAN_NAVAIDS: PeruvianNavaid[] = [
  {
    "id": "AND",
    "name": "ANDAHUAYLAS VOR DME",
    "type": "VOR DME",
    "frequency": "114.30 MHz",
    "lat": -13.7142,
    "lon": -73.3778,
    "elevation": 11997,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPHY"
  },
  {
    "id": "OAS",
    "name": "ANDOAS VOR DME",
    "type": "VOR DME",
    "frequency": "116.80 MHz",
    "lat": -2.7894,
    "lon": -76.4775,
    "elevation": 700,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "EQU",
    "name": "AREQUIPA VOR DME",
    "type": "VOR DME",
    "frequency": "113.70 MHz",
    "lat": -16.3392,
    "lon": -71.5972,
    "elevation": 8405,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPQU"
  },
  {
    "id": "ARI",
    "name": "ARICA VOR DME",
    "type": "VOR DME",
    "frequency": "116.50 MHz",
    "lat": -18.3694,
    "lon": -70.3464,
    "elevation": 164,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "POY",
    "name": "CHACHAPOYAS VOR DME",
    "type": "VOR DME",
    "frequency": "115.10 MHz",
    "lat": -6.2006,
    "lon": -77.8597,
    "elevation": 8294,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPPY"
  },
  {
    "id": "CLA",
    "name": "CHICLAYO VOR DME",
    "type": "VOR DME",
    "frequency": "114.90 MHz",
    "lat": -6.7172,
    "lon": -79.8192,
    "elevation": 121,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPHI"
  },
  {
    "id": "BTE",
    "name": "CHIMBOTE VOR",
    "type": "VOR",
    "frequency": "112.50 MHz",
    "lat": -9.1475,
    "lon": -78.5219,
    "elevation": 70,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "ZCO",
    "name": "CUSCO VOR DME",
    "type": "VOR DME",
    "frequency": "114.90 MHz",
    "lat": -13.5192,
    "lon": -72.0100,
    "elevation": 12745,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPZO"
  },
  {
    "id": "ILO",
    "name": "ILO VOR",
    "type": "VOR",
    "frequency": "112.50 MHz",
    "lat": -17.6911,
    "lon": -71.3506,
    "elevation": 72,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPLO"
  },
  {
    "id": "IQT",
    "name": "IQUITOS VOR DME",
    "type": "VOR DME",
    "frequency": "116.50 MHz",
    "lat": -3.7925,
    "lon": -73.3178,
    "elevation": 335,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPQT"
  },
  {
    "id": "JCL",
    "name": "JORGE CHAVEZ DVOR DME",
    "type": "DVOR DME",
    "frequency": "116.90 MHz",
    "lat": -12.0397,
    "lon": -77.1056,
    "elevation": 115,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPJC"
  },
  {
    "id": "JUL",
    "name": "JULIACA VOR DME",
    "type": "VOR DME",
    "frequency": "115.50 MHz",
    "lat": -15.4681,
    "lon": -70.1511,
    "elevation": 12552,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPJL"
  },
  {
    "id": "LPA",
    "name": "LAS PALMAS DVOR DME",
    "type": "DVOR DME",
    "frequency": "113.30 MHz",
    "lat": -12.1558,
    "lon": -76.9994,
    "elevation": 233,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPAL"
  },
  {
    "id": "LET",
    "name": "LETICIA DVOR DME",
    "type": "DVOR DME",
    "frequency": "117.50 MHz",
    "lat": -4.1950,
    "lon": -69.9400,
    "elevation": 285,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "MLV",
    "name": "MALVINAS VOR DME",
    "type": "VOR DME",
    "frequency": "117.20 MHz",
    "lat": -11.8583,
    "lon": -72.9378,
    "elevation": 350,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "SCO",
    "name": "PISCO VOR DME",
    "type": "VOR DME",
    "frequency": "114.10 MHz",
    "lat": -13.7386,
    "lon": -76.2128,
    "elevation": 100,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPSO"
  },
  {
    "id": "URA",
    "name": "PIURA VOR DME",
    "type": "VOR DME",
    "frequency": "117.70 MHz",
    "lat": -5.2100,
    "lon": -80.6161,
    "elevation": 116,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPUR"
  },
  {
    "id": "PZA",
    "name": "PTO ESPERANZA VOR",
    "type": "VOR",
    "frequency": "113.90 MHz",
    "lat": -9.7692,
    "lon": -70.7050,
    "elevation": 800,
    "class": "HJ",
    "hours": "HJ",
    "associatedAD": ""
  },
  {
    "id": "PUL",
    "name": "PUCALLPA VOR DME",
    "type": "VOR DME",
    "frequency": "116.70 MHz",
    "lat": -8.3758,
    "lon": -74.5722,
    "elevation": 537,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPCL"
  },
  {
    "id": "PLG",
    "name": "PUERTO LEGUIZAMO VOR DME",
    "type": "VOR DME",
    "frequency": "112.80 MHz",
    "lat": -0.1786,
    "lon": -74.7756,
    "elevation": 665,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "PDO",
    "name": "PTO MALDONADO VOR DME",
    "type": "VOR DME",
    "frequency": "116.10 MHz",
    "lat": -12.6078,
    "lon": -69.2272,
    "elevation": 659,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPTU"
  },
  {
    "id": "SLS",
    "name": "SALINAS DVOR DME",
    "type": "DVOR DME",
    "frequency": "114.70 MHz",
    "lat": -11.2875,
    "lon": -77.5625,
    "elevation": 324,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "SRV",
    "name": "SANTA ROSA VOR",
    "type": "VOR",
    "frequency": "116.60 MHz",
    "lat": -3.4472,
    "lon": -80.0094,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "UAS",
    "name": "SIHUAS VOR",
    "type": "VOR",
    "frequency": "113.50 MHz",
    "lat": -16.3711,
    "lon": -72.1336,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "TCA",
    "name": "TACNA VOR DME",
    "type": "VOR DME",
    "frequency": "116.80 MHz",
    "lat": -18.0578,
    "lon": -70.2764,
    "elevation": 1277,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPTN"
  },
  {
    "id": "TAL",
    "name": "TALARA VOR",
    "type": "VOR",
    "frequency": "116.10 MHz",
    "lat": -4.5803,
    "lon": -81.2525,
    "elevation": 282,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPYL"
  },
  {
    "id": "TAP",
    "name": "TARAPOTO VOR DME",
    "type": "VOR DME",
    "frequency": "115.50 MHz",
    "lat": -6.6581,
    "lon": -76.3511,
    "elevation": 869,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPST"
  },
  {
    "id": "TRO",
    "name": "TROMPETEROS VOR DME",
    "type": "VOR DME",
    "frequency": "114.80 MHz",
    "lat": -3.8028,
    "lon": -75.0508,
    "elevation": 427,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "TRU",
    "name": "TRUJILLO DVOR DME",
    "type": "DVOR DME",
    "frequency": "116.30 MHz",
    "lat": -8.0875,
    "lon": -79.1125,
    "elevation": 100,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPRU"
  },
  {
    "id": "BES",
    "name": "TUMBES VOR DME",
    "type": "VOR DME",
    "frequency": "112.90 MHz",
    "lat": -3.5444,
    "lon": -80.3892,
    "elevation": 82,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPME"
  },
  {
    "id": "URC",
    "name": "URCOS VOR DME",
    "type": "VOR DME",
    "frequency": "115.60 MHz",
    "lat": -13.6494,
    "lon": -71.5864,
    "elevation": 14086,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  }
]

/**
 * Normaliza cualquier variante de tipo de radioayuda al formato canónico
 * "VOR DME" / "DVOR DME" (con espacio, sin barra).
 * Maneja variantes de la BD: "VORDME", "VOR/DME", "DVORDME", "DVOR/DME",
 * "vor dme", etc.
 */
export function normalizeNavaidType(type: string | undefined | null): string {
  if (!type) return ""
  const t = type.trim().toUpperCase()
  // Orden importante: DVOR antes que VOR
  if (t === "DVORDME" || t === "DVOR/DME" || t === "DVOR DME" || t === "DVOR-DME") return "DVOR DME"
  if (t === "VORDME" || t === "VOR/DME" || t === "VOR DME" || t === "VOR-DME") return "VOR DME"
  if (t === "DME") return "DME"
  if (t === "TACAN") return "TACAN"
  if (t === "NDB") return "NDB"
  if (t === "VOR") return "VOR"
  // Si no coincide con ningún patrón conocido, devolver limpio (sin barras)
  return t.replace(/\s*\/\s*/g, " ").replace(/\s+/g, " ").trim()
}
