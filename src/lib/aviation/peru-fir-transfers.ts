/**
 * Puntos de transferencia entre FIR Lima y FIRs adyacentes (AIP Perú ENR 2.x).
 * Cada registro enumera los waypoint(s) por donde se transfiere el control
 * entre el ACC Lima y el ACC vecino, con sus frecuencias.
 *
 * Generado por scripts/generate-static-data.mjs
 */

export interface FirTransfer {
  firFrom: string
  firTo: string
  points: string[]
  accFrom: string
  accTo: string
  freqLima: string
  freqAdjacent: string
  remark: string
}

export const FIR_TRANSFERS: FirTransfer[] = [
  {
    firFrom: "LIMA", firTo: "GUAYAQUIL",
    points: ["OSAKI","AMERO","ANPAL","ARNEL"],
    accFrom: "ACC/FIC LIMA", accTo: "ACC GUAYAQUIL",
    freqLima: "127.9", freqAdjacent: "125.3",
    remark: "FIR norte-occidental. Frec Lima Control: 119.7/128.7",
  },
  {
    firFrom: "LIMA", firTo: "BOGOTÁ",
    points: ["TERAS","ANDID","ROLUS","ILMUX","PUPAS","REMEX"],
    accFrom: "ACC/FIC LIMA", accTo: "ACC BOGOTÁ",
    freqLima: "127.9", freqAdjacent: "126.3",
    remark: "FIR norte-oriental Colombia/Perú",
  },
  {
    firFrom: "LIMA", firTo: "AMAZÓNICA",
    points: ["DAMDU","ISIDI","POSKA","SURIX"],
    accFrom: "ACC/FIC LIMA", accTo: "CINDACTA III",
    freqLima: "127.9", freqAdjacent: "125.3",
    remark: "FIR oriental Brasil/Perú",
  },
  {
    firFrom: "LIMA", firTo: "LA PAZ",
    points: ["ELAKO","OBLIR","RAXUN","OPKUL","OGMAS","VAGUR","LOLES"],
    accFrom: "ACC/FIC LIMA", accTo: "FIC LA PAZ",
    freqLima: "127.9", freqAdjacent: "129.9",
    remark: "FIR sur-oriental Bolivia/Perú",
  },
  {
    firFrom: "LIMA", firTo: "ANTOFAGASTA",
    points: ["SORTA","IREMI","ALDAX"],
    accFrom: "ACC/FIC LIMA", accTo: "ACC ANTOFAGASTA",
    freqLima: "127.9", freqAdjacent: "124.7",
    remark: "FIR sur Chile/Perú",
  },
]

/** Conjunto de IDs de waypoints que son puntos de transferencia FIR. */
export const TRANSFER_POINT_IDS: Set<string> = new Set(
  FIR_TRANSFERS.flatMap(t => t.points)
)
