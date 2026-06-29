/**
 * Radioayudas de países fronterizos (extraídas del AIP Perú v2.0).
 * Incluye VOR/DME de Ecuador, Colombia, Brasil, Bolivia, Chile — visibles
 * en el mapa interactivo para construcción de rutas internacionales.
 *
 * Generado por scripts/generate-static-data.mjs
 */

export interface IntlNavaid {
  id: string
  name: string
  type: string
  frequency: string
  lat: number
  lon: number
  country: string
  fir: string
}

export const INTERNATIONAL_NAVAIDS: IntlNavaid[] = [
  { id: "GYE", name: "GUAYAQUIL VOR/DME", type: "VOR DME", frequency: "116.30 MHz", lat: -2.154, lon: -79.8836, country: "EC", fir: "GUAYAQUIL" },
  { id: "LOH", name: "LOJA VOR", type: "VOR", frequency: "115.30 MHz", lat: -3.9959, lon: -79.372, country: "EC", fir: "GUAYAQUIL" },
  { id: "BOG", name: "BOGOTÁ VORDME", type: "VOR DME", frequency: "115.70 MHz", lat: 4.7016, lon: -74.1469, country: "CO", fir: "BOGOTÁ" },
  { id: "CLO", name: "CALI VORDME", type: "VOR DME", frequency: "116.90 MHz", lat: 3.5432, lon: -76.3816, country: "CO", fir: "BOGOTÁ" },
  { id: "LET", name: "LETICIA DVOR/DME", type: "VOR DME", frequency: "117.50 MHz", lat: -4.195, lon: -69.9406, country: "CO", fir: "BOGOTÁ" },
  { id: "LPB", name: "LA PAZ VOR/DME", type: "VOR DME", frequency: "116.50 MHz", lat: -16.5133, lon: -68.1922, country: "BO", fir: "LA PAZ" },
  { id: "COB", name: "COCHABAMBA VOR/DME", type: "VOR DME", frequency: "113.30 MHz", lat: -17.4211, lon: -66.1771, country: "BO", fir: "LA PAZ" },
  { id: "MAO", name: "MANAUS VOR/DME", type: "VOR DME", frequency: "113.90 MHz", lat: -3.0386, lon: -60.0498, country: "BR", fir: "AMAZÓNICA" },
  { id: "CZS", name: "CRUZEIRO DO SUL VOR", type: "VOR", frequency: "117.50 MHz", lat: -7.5997, lon: -72.7695, country: "BR", fir: "AMAZÓNICA" },
  { id: "ARI", name: "ARICA VOR/DME", type: "VOR DME", frequency: "116.50 MHz", lat: -18.3485, lon: -70.3387, country: "CL", fir: "ANTOFAGASTA" },
  { id: "ANF", name: "ANTOFAGASTA VOR/DME", type: "VOR DME", frequency: "114.80 MHz", lat: -23.4445, lon: -70.4451, country: "CL", fir: "ANTOFAGASTA" },
]
