/**
 * Datos de espacio aéreo peruano (AIP Perú ENR 2.x, ENR 5.x).
 *   - TMA / CTR poligonales
 *   - Sectores ATC
 *   - Zonas restringidas/prohibidas/peligrosas
 *   - Clases de espacio aéreo (FIR/TMA/CTR)
 *
 * Generado por scripts/generate-static-data.mjs
 */

export interface TmaSector {
  id: string
  name: string
  cls: string
  lo: string
  hi: string
  polygon: { lat: number; lon: number }[]
}

export interface AtcSector {
  id: string
  name: string
  freq: string
  sec: string
  vertLo: string
  vertHi: string
  geo: string
}

export interface RestrictedAirspace {
  designator: string
  type: "P" | "R" | "D"
  name: string
  lower: string
  upper: string
  activity: string
  period: string
  entry: string
}

export const TMA_SECTORS_DATA: TmaSector[] = [
  {
    "id": "TMA_LIMA",
    "name": "TMA Lima",
    "cls": "D",
    "lo": "GND",
    "hi": "FL245",
    "polygon": [
      {
        "lat": -11,
        "lon": -78.5
      },
      {
        "lat": -11,
        "lon": -76
      },
      {
        "lat": -13.5,
        "lon": -76
      },
      {
        "lat": -13.5,
        "lon": -78.5
      }
    ]
  },
  {
    "id": "CTR_LIMA",
    "name": "CTR Lima",
    "cls": "D",
    "lo": "GND",
    "hi": "6000ft",
    "polygon": [
      {
        "lat": -11.8,
        "lon": -77.5
      },
      {
        "lat": -11.8,
        "lon": -76.5
      },
      {
        "lat": -12.5,
        "lon": -76.5
      },
      {
        "lat": -12.5,
        "lon": -77.5
      }
    ]
  },
  {
    "id": "TMA_CUSCO",
    "name": "TMA Cusco",
    "cls": "D",
    "lo": "GND",
    "hi": "FL245",
    "polygon": [
      {
        "lat": -12.8,
        "lon": -72.5
      },
      {
        "lat": -12.8,
        "lon": -71
      },
      {
        "lat": -14.5,
        "lon": -71
      },
      {
        "lat": -14.5,
        "lon": -72.5
      }
    ]
  },
  {
    "id": "CTR_CUSCO",
    "name": "CTR Cusco",
    "cls": "D",
    "lo": "GND",
    "hi": "5000ft",
    "polygon": [
      {
        "lat": -13.2,
        "lon": -72.3
      },
      {
        "lat": -13.2,
        "lon": -71.4
      },
      {
        "lat": -14,
        "lon": -71.4
      },
      {
        "lat": -14,
        "lon": -72.3
      }
    ]
  },
  {
    "id": "TMA_AREQUIPA",
    "name": "TMA Arequipa",
    "cls": "D",
    "lo": "GND",
    "hi": "FL245",
    "polygon": [
      {
        "lat": -15.5,
        "lon": -72.5
      },
      {
        "lat": -15.5,
        "lon": -70.5
      },
      {
        "lat": -17.5,
        "lon": -70.5
      },
      {
        "lat": -17.5,
        "lon": -72.5
      }
    ]
  },
  {
    "id": "TMA_IQUITOS",
    "name": "TMA Iquitos",
    "cls": "D",
    "lo": "GND",
    "hi": "FL245",
    "polygon": [
      {
        "lat": -2.8,
        "lon": -74.5
      },
      {
        "lat": -2.8,
        "lon": -72
      },
      {
        "lat": -4.8,
        "lon": -72
      },
      {
        "lat": -4.8,
        "lon": -74.5
      }
    ]
  },
  {
    "id": "TMA_CHICLAYO",
    "name": "TMA Chiclayo",
    "cls": "D",
    "lo": "GND",
    "hi": "FL245",
    "polygon": [
      {
        "lat": -6,
        "lon": -80.5
      },
      {
        "lat": -6,
        "lon": -78.5
      },
      {
        "lat": -7.5,
        "lon": -78.5
      },
      {
        "lat": -7.5,
        "lon": -80.5
      }
    ]
  },
  {
    "id": "TMA_TRUJILLO",
    "name": "TMA Trujillo",
    "cls": "D",
    "lo": "GND",
    "hi": "FL245",
    "polygon": [
      {
        "lat": -7.5,
        "lon": -80.3
      },
      {
        "lat": -7.5,
        "lon": -78
      },
      {
        "lat": -9,
        "lon": -78
      },
      {
        "lat": -9,
        "lon": -80.3
      }
    ]
  },
  {
    "id": "TMA_JULIACA",
    "name": "TMA Juliaca",
    "cls": "D",
    "lo": "GND",
    "hi": "FL245",
    "polygon": [
      {
        "lat": -14.5,
        "lon": -71.5
      },
      {
        "lat": -14.5,
        "lon": -69
      },
      {
        "lat": -16.5,
        "lon": -69
      },
      {
        "lat": -16.5,
        "lon": -71.5
      }
    ]
  }
]

export const ATC_SECTORS_DATA: AtcSector[] = [
  { id: "LIMA_CTR", name: "Lima Control", freq: "119.70", sec: "124.30", vertLo: "GND", vertHi: "FL245", geo: "TMA Lima" },
  { id: "LIMA_RAD", name: "Lima Radar", freq: "128.70", sec: "", vertLo: "GND", vertHi: "FL245", geo: "TMA Lima" },
  { id: "LIMA_DEP", name: "Lima Salidas", freq: "119.40", sec: "", vertLo: "GND", vertHi: "FL100", geo: "TMA Lima" },
  { id: "LIMA_APP", name: "Lima Aproximacion", freq: "119.10", sec: "", vertLo: "GND", vertHi: "FL100", geo: "TMA Lima" },
  { id: "FIC_LIMA", name: "Lima Radio FIC", freq: "127.90", sec: "", vertLo: "GND", vertHi: "UNL", geo: "FIR Lima completo" },
  { id: "ACC_NORTE", name: "Lima ACC Norte", freq: "132.50", sec: "", vertLo: "FL245", vertHi: "UNL", geo: "Sector norte FL245+" },
  { id: "ACC_SUR", name: "Lima ACC Sur", freq: "133.40", sec: "", vertLo: "FL245", vertHi: "UNL", geo: "Sector sur FL245+" },
  { id: "ACC_ORIENTE", name: "Lima ACC Oriente", freq: "131.10", sec: "", vertLo: "FL245", vertHi: "UNL", geo: "Sector oriente/Iquitos" },
  { id: "ACC_CENTRO", name: "Lima ACC Centro", freq: "130.60", sec: "", vertLo: "FL245", vertHi: "UNL", geo: "Sector central" },
  { id: "GUARD_VHF", name: "Emergencia VHF", freq: "121.50", sec: "", vertLo: "GND", vertHi: "UNL", geo: "H24 todo FIR" },
  { id: "GUARD_UHF", name: "Emergencia UHF", freq: "243.00", sec: "", vertLo: "GND", vertHi: "UNL", geo: "H24 militar" },
]

export const RESTRICTED_AIRSPACE: RestrictedAirspace[] = [
  { designator: "EP-204", type: "P" as "P"|"R"|"D", name: "Zona Prohibida Palacio de Gobierno", lower: "SFC", upper: "UNL", activity: "Seguridad del Estado", period: "H24", entry: "FAP/PNP" },
  { designator: "ER-201", type: "R" as "P"|"R"|"D", name: "Zona Restringida Callao Norte", lower: "SFC", upper: "FL150", activity: "Operaciones militares", period: "LUN-VIE 0600-1800", entry: "FAP" },
  { designator: "ER-207", type: "R" as "P"|"R"|"D", name: "Zona Restringida La Libertad", lower: "FL100", upper: "FL450", activity: "Ejercicios militares", period: "Activada por NOTAM", entry: "FAP" },
  { designator: "ED-301", type: "D" as "P"|"R"|"D", name: "Zona Peligrosa Punta Lobos", lower: "SFC", upper: "8000ft AMSL", activity: "Tiro de artillería", period: "Activada por NOTAM", entry: "Ejército del Perú" },
  { designator: "ED-302", type: "D" as "P"|"R"|"D", name: "Zona Peligrosa Pampa de la Joya", lower: "SFC", upper: "FL150", activity: "Ejercicios militares", period: "Activada por NOTAM", entry: "FAP Arequipa" },
]
