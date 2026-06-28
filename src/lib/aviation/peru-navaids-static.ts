/**
 * Radioayudas peruanas (VOR/DME/NDB) con coordenadas precisas.
 * Fuente: AIP PERÚ ENR 4.1 (extraído del sistema de referencia).
 * Usado como fallback del mapa interactivo.
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
    "name": "ANDAHUAYLAS VOR/DME",
    "type": "VORDME",
    "frequency": "114.30 MHz",
    "lat": -13.7142,
    "lon": -73.3778,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPHI"
  },
  {
    "id": "EQU",
    "name": "AREQUIPA VOR/DME",
    "type": "VORDME",
    "frequency": "113.70 MHz",
    "lat": -16.3392,
    "lon": -71.5972,
    "elevation": 39,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPQU"
  },
  {
    "id": "CLA",
    "name": "CHICLAYO VOR/DME",
    "type": "VORDME",
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
    "lon": -78.5197,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "ZCO",
    "name": "CUSCO VOR/DME",
    "type": "VORDME",
    "frequency": "114.90 MHz",
    "lat": -13.5192,
    "lon": -72.01,
    "elevation": null,
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
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPLO"
  },
  {
    "id": "IQT",
    "name": "IQUITOS VOR/DME",
    "type": "VORDME",
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
    "name": "JORGE CHAVEZ DVOR/DME",
    "type": "DVORDME",
    "frequency": "116.90 MHz",
    "lat": -12.0397,
    "lon": -77.1056,
    "elevation": 115,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPIM"
  },
  {
    "id": "JUL",
    "name": "JULIACA VOR/DME",
    "type": "VORDME",
    "frequency": "115.50 MHz",
    "lat": -15.4681,
    "lon": -70.1511,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPJL"
  },
  {
    "id": "LPA",
    "name": "LAS PALMAS DVOR/DME",
    "type": "DVORDME",
    "frequency": "113.30 MHz",
    "lat": -12.1558,
    "lon": -76.9994,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPAL"
  },
  {
    "id": "LET",
    "name": "LETICIA DVOR/DME",
    "type": "DVORDME",
    "frequency": "117.50 MHz",
    "lat": -4.195,
    "lon": -69.9406,
    "elevation": 285,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "MLV",
    "name": "MALVINAS VOR/DME",
    "type": "VORDME",
    "frequency": "117.20 MHz",
    "lat": -11.8583,
    "lon": -72.9378,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "SCO",
    "name": "PISCO VOR/DME",
    "type": "VORDME",
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
    "name": "PIURA VOR/DME",
    "type": "VORDME",
    "frequency": "117.70 MHz",
    "lat": -5.21,
    "lon": -80.6161,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPUR"
  },
  {
    "id": "PZA",
    "name": "PUERTO ESPERANZA VOR",
    "type": "VOR",
    "frequency": "113.90 MHz",
    "lat": -9.7692,
    "lon": -70.705,
    "elevation": null,
    "class": "HJ",
    "hours": "HJ",
    "associatedAD": ""
  },
  {
    "id": "PUL",
    "name": "PUCALLPA VOR/DME",
    "type": "VORDME",
    "frequency": "116.70 MHz",
    "lat": -8.3758,
    "lon": -74.5722,
    "elevation": 537,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPBL"
  },
  {
    "id": "PLG",
    "name": "PUERTO LEGUIZAMO VOR/DME",
    "type": "VORDME",
    "frequency": "112.80 MHz",
    "lat": -0.1786,
    "lon": -74.7753,
    "elevation": 665,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "PDO",
    "name": "PUERTO MALDONADO VOR/DME",
    "type": "VORDME",
    "frequency": "116.10 MHz",
    "lat": -12.6078,
    "lon": -69.2228,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPTU"
  },
  {
    "id": "SLS",
    "name": "SALINAS DVOR/DME",
    "type": "DVORDME",
    "frequency": "114.70 MHz",
    "lat": -11.2875,
    "lon": -77.5625,
    "elevation": null,
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
    "name": "TACNA VOR/DME",
    "type": "VORDME",
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
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPYL"
  },
  {
    "id": "TAP",
    "name": "TARAPOTO VOR/DME",
    "type": "VORDME",
    "frequency": "115.50 MHz",
    "lat": -6.6581,
    "lon": -76.3511,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPST"
  },
  {
    "id": "TRO",
    "name": "TROMPETEROS VOR/DME",
    "type": "VORDME",
    "frequency": "114.80 MHz",
    "lat": -3.8028,
    "lon": -75.0508,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "TRU",
    "name": "TRUJILLO DVOR/DME",
    "type": "DVORDME",
    "frequency": "116.30 MHz",
    "lat": -8.0875,
    "lon": -79.1125,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPRU"
  },
  {
    "id": "BES",
    "name": "TUMBES VOR/DME",
    "type": "VORDME",
    "frequency": "112.90 MHz",
    "lat": -3.5444,
    "lon": -80.3892,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPME"
  },
  {
    "id": "URC",
    "name": "URCOS VOR/DME",
    "type": "VORDME",
    "frequency": "115.60 MHz",
    "lat": -13.6494,
    "lon": -71.5864,
    "elevation": 14086,
    "class": "H24",
    "hours": "H24",
    "associatedAD": ""
  },
  {
    "id": "POY",
    "name": "CHACHAPOYAS VOR/DME",
    "type": "VORDME",
    "frequency": "115.10 MHz",
    "lat": -6.2006,
    "lon": -77.8597,
    "elevation": null,
    "class": "H24",
    "hours": "H24",
    "associatedAD": "SPPY"
  }
]
