/**
 * Procedimientos SID/STAR por aeródromo (AIP Perú AD 2.x).
 *
 * Generado por scripts/generate-static-data.mjs
 */

export interface SidStarProc {
  ad: string
  type: "SID" | "STAR"
  ident: string
  rwy: string
  navaid: string
  trk: number
  alt: string
  dist: number
  remark: string
}

export const SIDSTAR_PROCEDURES: SidStarProc[] = [
  { ad: "SPZO", type: "SID" as "SID"|"STAR", ident: "TAUJA THREE.CEMIL", rwy: "10", navaid: "CEMIL", trk: 316, alt: "13500ft", dist: 28, remark: "RNAV → UV11/V11 (NW)" },
  { ad: "SPZO", type: "SID" as "SID"|"STAR", ident: "TAUJA THREE.ILMOX", rwy: "10", navaid: "ILMOX", trk: 330, alt: "13500ft", dist: 35, remark: "RNAV → UV11 (N)" },
  { ad: "SPZO", type: "SID" as "SID"|"STAR", ident: "TAUJA THREE.LITOT", rwy: "10", navaid: "LITOT", trk: 196, alt: "13500ft", dist: 32, remark: "RNAV → UV15/V15 (S)" },
  { ad: "SPZO", type: "SID" as "SID"|"STAR", ident: "TAUJA THREE.TILPA", rwy: "10", navaid: "TILPA", trk: 315, alt: "13500ft", dist: 30, remark: "RNAV → UV11 (NE)" },
  { ad: "SPZO", type: "SID" as "SID"|"STAR", ident: "GAXUN 1B (RNP AR)", rwy: "10", navaid: "GAXUN", trk: 100, alt: "13000ft", dist: 12, remark: "RNP/AR — solo operadores certificados" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "CEMIL 3A", rwy: "28", navaid: "CEMIL", trk: 116, alt: "17000ft", dist: 60, remark: "RNAV desde UV11/V11 (NW)" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "CEMIL 3B", rwy: "28", navaid: "CEMIL", trk: 116, alt: "17000ft", dist: 60, remark: "RNAV desde UV11/V11" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "CEMIL 3F", rwy: "28", navaid: "CEMIL", trk: 116, alt: "17000ft", dist: 60, remark: "RNAV desde UV11" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "CEMIL 3G", rwy: "28", navaid: "CEMIL", trk: 116, alt: "17000ft", dist: 60, remark: "RNAV desde UV11" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "ILMOX 3A", rwy: "28", navaid: "ILMOX", trk: 149, alt: "17500ft", dist: 66, remark: "RNAV desde N (UV11/V11)" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "ILMOX 3B", rwy: "28", navaid: "ILMOX", trk: 149, alt: "17500ft", dist: 66, remark: "RNAV desde N" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "LITOT 2A", rwy: "28", navaid: "LITOT", trk: 17, alt: "16000ft", dist: 54, remark: "RNAV desde S (UV15/V15)" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "LITOT 2B", rwy: "28", navaid: "LITOT", trk: 17, alt: "16000ft", dist: 54, remark: "RNAV desde S" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "DARKI 1A", rwy: "28", navaid: "DARKI", trk: 270, alt: "16000ft", dist: 50, remark: "RNAV desde E (UL300/T334)" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "DARKI 1B", rwy: "28", navaid: "DARKI", trk: 270, alt: "16000ft", dist: 50, remark: "RNAV desde E" },
  { ad: "SPZO", type: "STAR" as "SID"|"STAR", ident: "DARKI 1C (RNAV)", rwy: "28", navaid: "DARKI", trk: 270, alt: "16000ft", dist: 50, remark: "RNAV desde E — variante RNAV" },
  { ad: "SPZO", type: "IAC" as "SID"|"STAR", ident: "RNP RWY 10 (AR) GAXUN 1B", rwy: "10", navaid: "GAXUN", trk: 100, alt: "OCA 13500ft", dist: 0, remark: "RNP/AR — solo operadores certificados DGAC" },
  { ad: "SPZO", type: "IAC" as "SID"|"STAR", ident: "RNP RWY 28 (AR)", rwy: "28", navaid: "ZCO", trk: 280, alt: "OCA 11900ft", dist: 0, remark: "RNP/AR — solo operadores certificados DGAC" },
  { ad: "SPZO", type: "IAC" as "SID"|"STAR", ident: "RNP RWY 28 (AR) URCOS", rwy: "28", navaid: "URC", trk: 280, alt: "OCA 11900ft", dist: 0, remark: "RNP/AR via URC — solo operadores certificados DGAC" },
  { ad: "SPIM", type: "SID" as "SID"|"STAR", ident: "ARBOM 2C", rwy: "15", navaid: "JCL", trk: 167, alt: "5000ft", dist: 18, remark: "SID RNAV RWY15 → UV1 Norte/Costa" },
  { ad: "SPIM", type: "SID" as "SID"|"STAR", ident: "ARBOM 2D", rwy: "33", navaid: "JCL", trk: 337, alt: "5000ft", dist: 12, remark: "SID RNAV RWY33 → UV1 Norte/Costa" },
  { ad: "SPIM", type: "SID" as "SID"|"STAR", ident: "TOLPA 2A", rwy: "15", navaid: "JCL", trk: 68, alt: "4000ft", dist: 22, remark: "SID RNAV RWY15 → Oriente/UL305" },
  { ad: "SPIM", type: "SID" as "SID"|"STAR", ident: "TOLPA 2B", rwy: "33", navaid: "JCL", trk: 337, alt: "4000ft", dist: 14, remark: "SID RNAV RWY33 → Oriente" },
  { ad: "SPIM", type: "SID" as "SID"|"STAR", ident: "KALAR 2A", rwy: "15", navaid: "JCL", trk: 155, alt: "5000ft", dist: 52, remark: "SID RNAV RWY15 → UL344 Norte" },
  { ad: "SPIM", type: "SID" as "SID"|"STAR", ident: "KALAR 2B", rwy: "33", navaid: "JCL", trk: 340, alt: "5000ft", dist: 52, remark: "SID RNAV RWY33 → UL344 Norte" },
  { ad: "SPIM", type: "SID" as "SID"|"STAR", ident: "ILROL 2A", rwy: "15", navaid: "JCL", trk: 335, alt: "4000ft", dist: 38, remark: "SID RNAV RWY15 → UM542/UL342" },
  { ad: "SPIM", type: "SID" as "SID"|"STAR", ident: "ILROL 2B", rwy: "33", navaid: "JCL", trk: 339, alt: "4000ft", dist: 38, remark: "SID RNAV RWY33 → UM542/UL342" },
  { ad: "SPIM", type: "STAR" as "SID"|"STAR", ident: "KALAR 2F", rwy: "15", navaid: "KALAR", trk: 155, alt: "FL140", dist: 52, remark: "STAR RNAV desde UL344 (Norte)" },
  { ad: "SPIM", type: "STAR" as "SID"|"STAR", ident: "KALAR 2G", rwy: "33", navaid: "KALAR", trk: 155, alt: "FL140", dist: 52, remark: "STAR RNAV desde UL344" },
  { ad: "SPIM", type: "STAR" as "SID"|"STAR", ident: "ILROL 2F", rwy: "15", navaid: "ILROL", trk: 160, alt: "FL130", dist: 38, remark: "STAR RNAV desde UM542" },
  { ad: "SPIM", type: "STAR" as "SID"|"STAR", ident: "ILROL 2G", rwy: "33", navaid: "ILROL", trk: 165, alt: "FL130", dist: 38, remark: "STAR RNAV desde UM542" },
  { ad: "SPIM", type: "IAC" as "SID"|"STAR", ident: "ILS RWY 15", rwy: "15", navaid: "JCL", trk: 152, alt: "OCA 1060ft", dist: 0, remark: "ILS/DME RWY15 — mínimos CAT I/II/III" },
  { ad: "SPIM", type: "IAC" as "SID"|"STAR", ident: "ILS RWY 33", rwy: "33", navaid: "JCL", trk: 332, alt: "OCA 1040ft", dist: 0, remark: "ILS/DME RWY33 — mínimos CAT I" },
  { ad: "SPIM", type: "IAC" as "SID"|"STAR", ident: "RNAV (RNP) RWY 15", rwy: "15", navaid: "JCL", trk: 152, alt: "OCA 1080ft", dist: 0, remark: "RNP AR — solo operadores certificados" },
  { ad: "SPJL", type: "SID" as "SID"|"STAR", ident: "ELAKO 1A", rwy: "08", navaid: "JUL", trk: 80, alt: "FL155", dist: 56, remark: "SID → A304 Boliva/La Paz (ELAKO)" },
  { ad: "SPJL", type: "SID" as "SID"|"STAR", ident: "ILMOX 1A", rwy: "26", navaid: "JUL", trk: 260, alt: "FL155", dist: 66, remark: "SID → UV11/V11 Cusco" },
  { ad: "SPJL", type: "SID" as "SID"|"STAR", ident: "KEVES 1A", rwy: "26", navaid: "JUL", trk: 207, alt: "FL155", dist: 50, remark: "SID → UV14/V14 Pto Maldonado" },
  { ad: "SPJL", type: "STAR" as "SID"|"STAR", ident: "ELAKO 1A", rwy: "26", navaid: "ELAKO", trk: 307, alt: "FL180", dist: 56, remark: "STAR desde A304 Bolivia" },
  { ad: "SPJL", type: "STAR" as "SID"|"STAR", ident: "ILMOX 1A", rwy: "26", navaid: "ILMOX", trk: 329, alt: "FL180", dist: 66, remark: "STAR desde UV11/V11 Cusco" },
  { ad: "SPJL", type: "STAR" as "SID"|"STAR", ident: "KEVES 1A", rwy: "08", navaid: "KEVES", trk: 25, alt: "FL180", dist: 50, remark: "STAR desde UV14/V14" },
  { ad: "SPJL", type: "IAC" as "SID"|"STAR", ident: "ILS/LOC RWY 26", rwy: "26", navaid: "JUL", trk: 260, alt: "OCA 13200ft", dist: 0, remark: "ILS RWY26 — mínimos NPA" },
  { ad: "SPJL", type: "IAC" as "SID"|"STAR", ident: "RNAV (RNP) RWY 26", rwy: "26", navaid: "JUL", trk: 260, alt: "OCA 13000ft", dist: 0, remark: "RNP AR RWY26" },
  { ad: "SPQU", type: "SID" as "SID"|"STAR", ident: "SIHUAS 1A", rwy: "28", navaid: "EQU", trk: 288, alt: "FL120", dist: 31, remark: "SID → V14/UV14 Norte (UAS VOR)" },
  { ad: "SPQU", type: "SID" as "SID"|"STAR", ident: "GAVAR 1A", rwy: "28", navaid: "EQU", trk: 329, alt: "FL120", dist: 47, remark: "SID → V12/UV12 Sur (Tacna)" },
  { ad: "SPQU", type: "STAR" as "SID"|"STAR", ident: "SIHUAS 1A", rwy: "28", navaid: "UAS", trk: 108, alt: "FL140", dist: 31, remark: "STAR desde V14/UV14" },
  { ad: "SPQU", type: "STAR" as "SID"|"STAR", ident: "GAVAR 1A", rwy: "28", navaid: "GAVAR", trk: 149, alt: "FL140", dist: 47, remark: "STAR desde V12/UV12 (Norte)" },
  { ad: "SPQU", type: "IAC" as "SID"|"STAR", ident: "ILS RWY 28", rwy: "28", navaid: "EQU", trk: 282, alt: "OCA 8950ft", dist: 0, remark: "ILS RWY28 — mínimos CAT I" },
  { ad: "SPQU", type: "IAC" as "SID"|"STAR", ident: "VOR RWY 28", rwy: "28", navaid: "EQU", trk: 282, alt: "OCA 9300ft", dist: 0, remark: "VOR/DME RWY28" },
  { ad: "SPQU", type: "IAC" as "SID"|"STAR", ident: "RNAV (RNP) RWY 28", rwy: "28", navaid: "EQU", trk: 282, alt: "OCA 9100ft", dist: 0, remark: "RNP AR RWY28" },
  { ad: "SPRU", type: "SID" as "SID"|"STAR", ident: "REPIB 1A", rwy: "04", navaid: "TRU", trk: 38, alt: "5000ft", dist: 49, remark: "SID → G675/UV1 (Norte/SPHI)" },
  { ad: "SPRU", type: "SID" as "SID"|"STAR", ident: "ESMIL 1A", rwy: "22", navaid: "TRU", trk: 218, alt: "5000ft", dist: 50, remark: "SID → V1/G675 (Sur/SPIM)" },
  { ad: "SPRU", type: "SID" as "SID"|"STAR", ident: "VATES 1A", rwy: "04", navaid: "TRU", trk: 65, alt: "5000ft", dist: 50, remark: "SID → UV5/V5 (Este/Tarapoto)" },
  { ad: "SPRU", type: "STAR" as "SID"|"STAR", ident: "REPIB 1A", rwy: "22", navaid: "REPIB", trk: 218, alt: "FL100", dist: 49, remark: "STAR desde G675/UV1 Sur" },
  { ad: "SPRU", type: "STAR" as "SID"|"STAR", ident: "ESMIL 1A", rwy: "04", navaid: "ESMIL", trk: 38, alt: "FL100", dist: 50, remark: "STAR desde V1/G675 Norte" },
  { ad: "SPRU", type: "IAC" as "SID"|"STAR", ident: "VOR RWY 04", rwy: "04", navaid: "TRU", trk: 38, alt: "OCA 600ft", dist: 0, remark: "VOR/DME DVOR TRU RWY04" },
  { ad: "SPRU", type: "IAC" as "SID"|"STAR", ident: "VOR RWY 22", rwy: "22", navaid: "TRU", trk: 218, alt: "OCA 650ft", dist: 0, remark: "VOR/DME DVOR TRU RWY22" },
  { ad: "SPRU", type: "IAC" as "SID"|"STAR", ident: "RNAV (RNP) RWY 22", rwy: "22", navaid: "TRU", trk: 218, alt: "OCA 580ft", dist: 0, remark: "RNP AR RWY22" },
  { ad: "SPTN", type: "SID" as "SID"|"STAR", ident: "GAVAR 1A", rwy: "02", navaid: "TCA", trk: 18, alt: "FL130", dist: 81, remark: "SID → V12/UV12 Norte (Arequipa)" },
  { ad: "SPTN", type: "SID" as "SID"|"STAR", ident: "ORALO 1A", rwy: "20", navaid: "TCA", trk: 198, alt: "FL130", dist: 0, remark: "SID → A573 (Sur/Frontera Bolivia)" },
  { ad: "SPTN", type: "STAR" as "SID"|"STAR", ident: "GAVAR 1A", rwy: "20", navaid: "GAVAR", trk: 149, alt: "FL150", dist: 81, remark: "STAR desde V12/UV12 Sur" },
  { ad: "SPTN", type: "IAC" as "SID"|"STAR", ident: "ILS/LOC RWY 20", rwy: "20", navaid: "TCA", trk: 198, alt: "OCA 1950ft", dist: 0, remark: "ILS RWY20 — mínimos CAT I. SPR73 activa" },
  { ad: "SPTN", type: "IAC" as "SID"|"STAR", ident: "VOR RWY 02", rwy: "02", navaid: "TCA", trk: 18, alt: "OCA 2200ft", dist: 0, remark: "VOR/DME TCA RWY02" },
]

export function getSids(ad: string): SidStarProc[] {
  return SIDSTAR_PROCEDURES.filter(p => p.ad === ad && p.type === "SID")
}

export function getStars(ad: string): SidStarProc[] {
  return SIDSTAR_PROCEDURES.filter(p => p.ad === ad && p.type === "STAR")
}
