/**
 * ENR Data Seed Script — AIP PERU
 *
 * Populates the database with real data from:
 *   - ENR 4.1-1  (Navaids: VOR/DME/NDB)
 *   - ENR 4.4-1  (Waypoints / Significant Points)
 *   - ENR 5.1-1  (Airspace Restrictions: Prohibited / Restricted)
 *
 * Strategy:
 *   - Navaids  → upsert by `id`
 *   - Waypoints → upsert by `id`
 *   - Airspace Restrictions → delete all then re-create (ensures clean slate)
 *
 * Usage:
 *   bun run prisma/seed-enr-data.ts
 */

import { db } from '@/lib/db'

// ════════════════════════════════════════════════════════════════════
// 1. NAVALDS — ENR 4.1-1
// ════════════════════════════════════════════════════════════════════

const navaids = [
  { id: 'AND',  name: 'ANDAHUAYLAS',       type: 'VOR/DME',  frequency: '114.30 MHz', lat: -13.25139, lon: -73.37778, elevation: 0 },
  { id: 'OAS',  name: 'ANDOAS NDB',        type: 'NDB',      frequency: '360.00 kHz', lat: -2.80694,  lon: -76.45500, elevation: null },
  { id: 'OAS2', name: 'ANDOAS VOR',        type: 'VOR/DME',  frequency: '116.80 MHz', lat: -2.78944,  lon: -76.47750, elevation: null },
  { id: 'EQU',  name: 'AREQUIPA',          type: 'VOR/DME',  frequency: '113.70 MHz', lat: -16.33917, lon: -71.59722, elevation: 12 },
  { id: 'ARI',  name: 'ARICA',             type: 'VOR/DME',  frequency: '116.50 MHz', lat: -18.36944, lon: -70.34639, elevation: null },
  { id: 'POY',  name: 'CHACHAPOYAS',       type: 'VOR/DME',  frequency: '115.10 MHz', lat: -6.20056,  lon: -77.85417, elevation: null },
  { id: 'CLA',  name: 'CHICLAYO',          type: 'VOR/DME',  frequency: '114.90 MHz', lat: -6.71722,  lon: -79.81917, elevation: 37 },
  { id: 'BTE',  name: 'CHIMBOTE',          type: 'VOR',      frequency: '112.50 MHz', lat: -9.14750,  lon: -78.52194, elevation: null },
  { id: 'ZCO',  name: 'CUSCO',             type: 'VOR/DME',  frequency: '114.90 MHz', lat: -13.51917, lon: -72.00111, elevation: null },
  { id: 'ILO',  name: 'ILO',               type: 'VOR',      frequency: '112.50 MHz', lat: -17.69111, lon: -71.35056, elevation: null },
  { id: 'IQT',  name: 'IQUITOS',           type: 'VOR/DME',  frequency: '116.50 MHz', lat: -3.79250,  lon: -73.31778, elevation: 102 },
  { id: 'JCL',  name: 'JORGE CHAVEZ DVOR', type: 'DVOR/DME', frequency: '116.90 MHz', lat: -12.03972, lon: -77.10556, elevation: 35 },
  { id: 'JUL',  name: 'JULIACA',           type: 'VOR/DME',  frequency: '115.50 MHz', lat: -15.46806, lon: -70.15111, elevation: null },
  { id: 'LPA',  name: 'LAS PALMAS',        type: 'DVOR/DME', frequency: '113.30 MHz', lat: -12.15583, lon: -76.99944, elevation: null },
  { id: 'LET',  name: 'LETICIA',           type: 'DVOR/DME', frequency: '117.50 MHz', lat: -4.19500,  lon: -69.94000, elevation: 87 },
  { id: 'MLV',  name: 'MALVINAS',          type: 'VOR/DME',  frequency: '117.20 MHz', lat: -11.85833, lon: -72.93778, elevation: null },
  { id: 'SCO',  name: 'PISCO',             type: 'VOR/DME',  frequency: '114.10 MHz', lat: -13.73861, lon: -76.20778, elevation: 30 },
  { id: 'URA',  name: 'PIURA',             type: 'VOR/DME',  frequency: '117.70 MHz', lat: -5.21000,  lon: -80.61611, elevation: null },
  { id: 'PZA',  name: 'PTO ESPERANZA',     type: 'VOR',      frequency: '113.90 MHz', lat: -9.76917,  lon: -70.70500, elevation: null },
  { id: 'PUL',  name: 'PUCALLPA',          type: 'VOR/DME',  frequency: '116.70 MHz', lat: -8.37583,  lon: -74.57222, elevation: 164 },
  { id: 'PLG',  name: 'PUERTO LEGUÍZAMO',  type: 'VOR/DME',  frequency: '112.80 MHz', lat: 0.01786,   lon: -74.77556, elevation: 203 },
  { id: 'PDO',  name: 'PUERTO MALDONADO',  type: 'VOR/DME',  frequency: '116.10 MHz', lat: -12.60778, lon: -69.22722, elevation: null },
  { id: 'SLS',  name: 'SALINAS',           type: 'DVOR/DME', frequency: '114.70 MHz', lat: -11.28750, lon: -77.55972, elevation: null },
  { id: 'SRV',  name: 'SANTA ROSA',        type: 'VOR',      frequency: '116.60 MHz', lat: -3.44722,  lon: -80.00944, elevation: null },
  { id: 'UAS',  name: 'SIHUAS',            type: 'VOR',      frequency: '113.50 MHz', lat: -16.37111, lon: -72.13361, elevation: null },
  { id: 'TCA',  name: 'TACNA',             type: 'VOR/DME',  frequency: '116.80 MHz', lat: -18.05778, lon: -70.27639, elevation: 389 },
  { id: 'TAL',  name: 'TALARA',            type: 'VOR',      frequency: '116.10 MHz', lat: -4.58028,  lon: -81.19750, elevation: null },
  { id: 'TAP',  name: 'TARAPOTO',          type: 'VOR/DME',  frequency: '115.50 MHz', lat: -6.65806,  lon: -76.35111, elevation: null },
  { id: 'TRO',  name: 'TROMPETEROS',       type: 'VOR/DME',  frequency: '114.80 MHz', lat: -3.80278,  lon: -75.05083, elevation: null },
  { id: 'TRU',  name: 'TRUJILLO',          type: 'DVOR/DME', frequency: '116.30 MHz', lat: -8.08750,  lon: -79.11250, elevation: null },
  { id: 'BES',  name: 'TUMBES',            type: 'VOR/DME',  frequency: '112.90 MHz', lat: -3.54444,  lon: -80.38917, elevation: null },
  { id: 'URC',  name: 'URCOS',             type: 'VOR/DME',  frequency: '115.60 MHz', lat: -13.64944, lon: -71.58639, elevation: 4293 },
]

// ════════════════════════════════════════════════════════════════════
// 2. WAYPOINTS — ENR 4.4-1
// ════════════════════════════════════════════════════════════════════

const waypoints = [
  { id: 'AKSOL',   lat: -13.32972, lon: -75.76250, desc: 'UM548, UM793, UT222' },
  { id: 'AKTUK',   lat: -6.86528,  lon: -80.11139, desc: 'UM542' },
  { id: 'ALDAL',   lat: -11.77611, lon: -76.24722, desc: 'T226, UT226' },
  { id: 'AMERO',   lat: -3.40000,  lon: -83.76667, desc: 'UL344' },
  { id: 'AMVEX',   lat: -10.80056, lon: -76.80333, desc: 'UL305, UM414' },
  { id: 'ANBIS',   lat: -10.21833, lon: -76.20306, desc: 'T325' },
  { id: 'ANBON',   lat: -12.54667, lon: -70.01028, desc: 'T218, UT218' },
  { id: 'ANDID',   lat: -2.43056,  lon: -75.31889, desc: 'UL342, UM776' },
  { id: 'ANKUG',   lat: -12.38361, lon: -72.16000, desc: 'T218, T335, UT218, UT335' },
  { id: 'AROTI',   lat: -3.66278,  lon: -70.58444, desc: 'R567' },
  { id: 'ARPEN',   lat: -2.38861,  lon: -72.12000, desc: 'R567 - Boundary Point' },
  { id: 'ASOXI',   lat: -12.76056, lon: -76.60639, desc: 'L525, T336, UL550, UM415, UM548, UM793, UT224, UT336' },
  { id: 'ASUPA',   lat: -15.87694, lon: -72.54056, desc: 'UT222' },
  { id: 'ATATU',   lat: -10.19694, lon: -78.01056, desc: 'UL308, UL312, UL344, UM674, UV1' },
  { id: 'BOBUG',   lat: -8.15611,  lon: -78.11278, desc: 'UM674' },
  { id: 'BODET',   lat: -12.23528, lon: -73.90083, desc: 'T218, UT218' },
  { id: 'BOLIM',   lat: -2.94139,  lon: -76.00111, desc: 'T230' },
  { id: 'BOMEL',   lat: -14.52639, lon: -73.96167, desc: 'UM548, UM793' },
  { id: 'BORLA',   lat: -7.73722,  lon: -75.23639, desc: 'T216, UM414, UV4, V4' },
  { id: 'CHIRA',   lat: -4.93528,  lon: -80.89389, desc: 'V1' },
  { id: 'DADIL',   lat: -2.41806,  lon: -70.58333, desc: 'A301 - Boundary Point' },
  { id: 'DALGI',   lat: -9.70750,  lon: -75.31417, desc: 'T315, UT315' },
  { id: 'DANKI',   lat: -18.30667, lon: -70.27500, desc: 'A568, UM664' },
  { id: 'DARKI',   lat: -13.45139, lon: -72.87306, desc: 'T319, UM668' },
  { id: 'DOMVO',   lat: -4.25000,  lon: -81.33333, desc: 'UV1, V1' },
  { id: 'DORAN',   lat: -4.18556,  lon: -74.05361, desc: 'UV3, V3' },
  { id: 'EGASI',   lat: -4.20806,  lon: -80.47944, desc: 'V2' },
  { id: 'ELAKO',   lat: -15.92667, lon: -69.30500, desc: 'A304, UM657' },
  { id: 'EKUVA',   lat: -13.73333, lon: -75.15972, desc: 'T333, UM548, UM793, UT333' },
  { id: 'ESDIN',   lat: -18.35000, lon: -80.20333, desc: 'UL401' },
  { id: 'ESMIL',   lat: -8.81972,  lon: -78.70472, desc: 'G675, V1' },
  { id: 'FANES',   lat: -7.48778,  lon: -74.32750, desc: 'T335, UT335, UV9, V9' },
  { id: 'GAVAR',   lat: -16.97250, lon: -71.11417, desc: 'UV12, V12' },
  { id: 'IBARE',   lat: -9.29639,  lon: -76.00472, desc: 'T216, T325, T327, UM414, UT327' },
  { id: 'IKARO',   lat: -6.25722,  lon: -75.92400, desc: 'UV5, V5' },
  { id: 'ILMAR',   lat: -14.27472, lon: -76.51333, desc: 'L302, UL302, UM542' },
  { id: 'ISAPA',   lat: -3.65389,  lon: -74.13944, desc: 'A566' },
  { id: 'KALOR',   lat: -4.09583,  lon: -70.76694, desc: 'A566' },
  { id: 'KEBOM',   lat: -8.00000,  lon: -73.67778, desc: 'B552 - Boundary Point' },
  { id: 'KIBAN',   lat: -6.89389,  lon: -80.01722, desc: 'G675' },
  { id: 'KORBO',   lat: -3.01833,  lon: -77.85778, desc: 'A566' },
  { id: 'LETICIA', lat: -4.19500,  lon: -69.94000, desc: 'VOR/DME LET' },
  { id: 'LOLES',   lat: -17.90000, lon: -69.78333, desc: 'A568, UM664 - Boundary Point' },
  { id: 'OGTAM',   lat: -6.05250,  lon: -80.35278, desc: 'G675' },
  { id: 'ORALO',   lat: -17.29611, lon: -69.62500, desc: 'A573, UM548, UP673' },
  { id: 'OSUBU',   lat: -3.32889,  lon: -76.05194, desc: 'A566, T234, UT234' },
  { id: 'PABAM',   lat: -3.40361,  lon: -75.61361, desc: 'A566, T232' },
  { id: 'PAGUR',   lat: -4.47639,  lon: -80.36361, desc: 'G675 - Boundary Point' },
  { id: 'PALOP',   lat: -7.46167,  lon: -79.43556, desc: 'V1' },
  { id: 'PAPEM',   lat: -3.17806,  lon: -70.30472, desc: 'A301 - Boundary Point' },
  { id: 'PIURA',   lat: -5.21000,  lon: -80.61611, desc: 'VOR/DME URA' },
  { id: 'REPIB',   lat: -7.53333,  lon: -79.56667, desc: 'G675' },
  { id: 'ROKOL',   lat: -5.97722,  lon: -80.21083, desc: 'V1' },
  { id: 'SURIX',   lat: -3.89139,  lon: -72.48944, desc: 'A566, UM665' },
  { id: 'MULMA',   lat: -8.83944,  lon: -73.73583, desc: 'T335, UM527, UT335' },
  { id: 'MIPAS',   lat: -8.24250,  lon: -79.41833, desc: 'UM542' },
  { id: 'MOXOM',   lat: -3.50083,  lon: -80.21861, desc: 'UM659, V1 - Boundary Point' },
  { id: 'NENER',   lat: -8.44778,  lon: -76.78778, desc: 'UL342' },
  { id: 'NILSA',   lat: -9.64694,  lon: -73.81500, desc: 'UL306, UP408' },
  { id: 'OGMAS',   lat: -16.38556, lon: -70.77111, desc: 'UL300, UM793' },
  { id: 'OPROS',   lat: -11.39472, lon: -76.47917, desc: 'T315, T317, T325, UL306, UM527' },
  { id: 'PUGUP',   lat: -7.43694,  lon: -75.08917, desc: 'UM414, UP408' },
  { id: 'REBAN',   lat: -8.44694,  lon: -79.70611, desc: 'UL312, UL344' },
  { id: 'ROBIG',   lat: -6.69250,  lon: -78.18528, desc: 'UM674, UT330, UV4' },
  { id: 'SIGIX',   lat: -7.18528,  lon: -71.99889, desc: 'UM776' },
  { id: 'TAPIR',   lat: -4.60028,  lon: -73.55306, desc: 'UV9, V9' },
  { id: 'TOKAN',   lat: -9.33806,  lon: -76.63417, desc: 'T311, UL305, UP776' },
  { id: 'ISREN',   lat: -9.45056,  lon: -78.67667, desc: 'UL308, UL312, UL344, UL780, UM542' },
  { id: 'KALAR',   lat: -11.24611, lon: -77.49722, desc: 'T311, T327, UL308, UL342, UM674, UP776, UV1' },
  { id: 'KOSKO',   lat: -13.54194, lon: -75.53250, desc: 'T334, UT222, UT334' },
  { id: 'LIVAT',   lat: -10.58333, lon: -73.76972, desc: 'T242, T244' },
  { id: 'LODIN',   lat: -7.40722,  lon: -75.57333, desc: 'T311, UP776, UV4' },
  { id: 'LOMOL',   lat: -12.75083, lon: -71.21972, desc: 'T332, UL300, UT332' },
  { id: 'MELIX',   lat: -6.50444,  lon: -79.00917, desc: 'V3' },
  { id: 'MEXUR',   lat: -13.16750, lon: -75.67028, desc: 'UM415' },
  { id: 'MUBIN',   lat: -13.40639, lon: -69.48278, desc: 'UV14, V14' },
  { id: 'NUXON',   lat: -15.06417, lon: -70.90611, desc: 'UV18' },
  { id: 'OPKUL',   lat: -15.10944, lon: -71.17361, desc: 'UL300, UM415' },
  { id: 'PADIS',   lat: -11.18778, lon: -76.58139, desc: 'T313, UT313' },
  { id: 'POSKA',   lat: -5.10639,  lon: -72.81194, desc: 'UM776 - Boundary Point' },
  { id: 'PUMAS',   lat: -11.35694, lon: -73.30778, desc: 'T242, T317, UT317' },
  { id: 'REKEM',   lat: -13.05500, lon: -75.62722, desc: 'T246, T336, UT336' },
  { id: 'RAXUN',   lat: -14.44833, lon: -69.08472, desc: 'UM776' },
  { id: 'SIMEL',   lat: -16.33861, lon: -72.38111, desc: 'T337, UT323, UT337' },
  { id: 'TEMOR',   lat: -7.41306,  lon: -72.54722, desc: 'UL300' },
  { id: 'TITVU',   lat: -12.09056, lon: -69.89611, desc: 'T240' },
]

// ════════════════════════════════════════════════════════════════════
// 3. AIRSPACE RESTRICTIONS — ENR 5.1-1
// ════════════════════════════════════════════════════════════════════

const airspaceRestrictions = [
  {
    designator: 'SPP01',
    name: 'EL SALTO - TUMBES',
    type: 'PROHIBITED',
    centerLat: -3.4167,
    centerLon: -80.3250,
    lowerLimit: 'GND',
    upperLimit: '1500 FT AGL',
    radius: null,
    polygon: '[{"lat":-3.4000,"lon":-80.3500},{"lat":-3.4000,"lon":-80.2944},{"lat":-3.4108,"lon":-80.2667},{"lat":-3.4667,"lon":-80.2667},{"lat":-3.4667,"lon":-80.3500}]',
    restrictions: 'Zona activada de manera permanente',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: 'Permanently activated zone',
  },
  {
    designator: 'SPP02',
    name: 'ESTERO SANTA TERESA - IQUITOS',
    type: 'PROHIBITED',
    centerLat: -3.4167,
    centerLon: -72.8667,
    lowerLimit: 'GND',
    upperLimit: '1500 FT AGL',
    radius: null,
    polygon: '[{"lat":-3.3667,"lon":-72.8500},{"lat":-3.3667,"lon":-72.8667},{"lat":-3.4667,"lon":-72.9667},{"lat":-3.4667,"lon":-72.8667}]',
    restrictions: 'Zona activada de manera permanente',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP03',
    name: 'PAMPAS DE HUARANGAL',
    type: 'PROHIBITED',
    centerLat: -12.2622,
    centerLon: -76.8539,
    lowerLimit: 'GND',
    upperLimit: '3000 FT AGL',
    radius: 1,
    polygon: null,
    restrictions: 'Zona activada de manera permanente a 20 NM al Sureste del JCL DVOR',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP04',
    name: 'PLANTA MELCHORITA',
    type: 'PROHIBITED',
    centerLat: -13.2464,
    centerLon: -76.2989,
    lowerLimit: 'GND',
    upperLimit: '1500 FT AGL',
    radius: 2,
    polygon: null,
    restrictions: 'Zona permanentemente activada a 55 km al norte de AD PISCO',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP05',
    name: 'PLANTA LA LOBERA',
    type: 'PROHIBITED',
    centerLat: -13.7742,
    centerLon: -76.2264,
    lowerLimit: 'GND',
    upperLimit: '1500 FT AGL',
    radius: 1,
    polygon: null,
    restrictions: 'Zona permanentemente activada a 5 km al Sur de AD PISCO',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP69',
    name: 'PISCO',
    type: 'PROHIBITED',
    centerLat: -13.9333,
    centerLon: -76.2000,
    lowerLimit: 'GND',
    upperLimit: '2500 FT AMSL',
    radius: null,
    polygon: '[{"lat":-13.7811,"lon":-76.5000},{"lat":-13.7811,"lon":-76.2944},{"lat":-13.7889,"lon":-76.2944},{"lat":-13.8167,"lon":-76.3069},{"lat":-13.8550,"lon":-76.2486},{"lat":-13.8453,"lon":-76.2431},{"lat":-13.8950,"lon":-76.1786},{"lat":-13.9011,"lon":-76.1792},{"lat":-14.1047,"lon":-76.0069},{"lat":-14.3333,"lon":-76.0000},{"lat":-14.4450,"lon":-76.0000},{"lat":-14.4450,"lon":-76.5000}]',
    restrictions: 'Reserva Natural de Paracas, Concentración de aves y protección para la fauna sensible',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP72',
    name: 'PAMPAS DE LA JOYA',
    type: 'PROHIBITED',
    centerLat: -16.8000,
    centerLon: -71.6000,
    lowerLimit: 'GND',
    upperLimit: 'UNL',
    radius: null,
    polygon: '[{"lat":-16.5333,"lon":-71.6833},{"lat":-17.1083,"lon":-71.2750},{"lat":-17.5333,"lon":-71.4000},{"lat":-16.8333,"lon":-72.4667}]',
    restrictions: 'Zona permanentemente activada',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP74',
    name: 'MAZO CRUZ',
    type: 'PROHIBITED',
    centerLat: -16.8000,
    centerLon: -69.6000,
    lowerLimit: 'GND',
    upperLimit: 'FL150',
    radius: null,
    polygon: '[{"lat":-16.6000,"lon":-70.2333},{"lat":-16.6667,"lon":-69.0333},{"lat":-17.2167,"lon":-69.6167}]',
    restrictions: 'Zona permanentemente activada',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP75',
    name: 'ILAVE',
    type: 'PROHIBITED',
    centerLat: -16.3000,
    centerLon: -69.5000,
    lowerLimit: 'GND',
    upperLimit: 'FL150',
    radius: null,
    polygon: '[{"lat":-15.6500,"lon":-70.1000},{"lat":-16.0500,"lon":-70.7667},{"lat":-16.2500,"lon":-70.5833},{"lat":-16.3500,"lon":-68.7667},{"lat":-16.1500,"lon":-69.2500}]',
    restrictions: 'Zona permanentemente activada',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP81',
    name: 'QUERECOTILLO',
    type: 'PROHIBITED',
    centerLat: -4.5000,
    centerLon: -80.3500,
    lowerLimit: 'GND',
    upperLimit: 'FL070',
    radius: null,
    polygon: '[{"lat":-4.3333,"lon":-80.6000},{"lat":-4.6667,"lon":-80.1667},{"lat":-4.9167,"lon":-80.1667},{"lat":-4.9167,"lon":-80.7500}]',
    restrictions: 'Zona permanentemente activada',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP82',
    name: 'PAITA',
    type: 'PROHIBITED',
    centerLat: -5.0000,
    centerLon: -80.9000,
    lowerLimit: 'GND',
    upperLimit: 'FL080',
    radius: null,
    polygon: '[{"lat":-4.9000,"lon":-81.4167},{"lat":-4.9000,"lon":-81.1500},{"lat":-5.2667,"lon":-80.7833},{"lat":-6.0000,"lon":-80.8333},{"lat":-6.0000,"lon":-81.4167}]',
    restrictions: 'Polígono FAP',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP83',
    name: 'BAYOVAR',
    type: 'PROHIBITED',
    centerLat: -5.8000,
    centerLon: -80.4000,
    lowerLimit: 'GND',
    upperLimit: '2000 FT AGL',
    radius: null,
    polygon: '[{"lat":-5.5833,"lon":-80.7000},{"lat":-5.8500,"lon":-80.8167},{"lat":-6.3333,"lon":-80.4333},{"lat":-6.3333,"lon":-80.2778}]',
    restrictions: 'Zona permanentemente activada',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP88',
    name: 'LIMA',
    type: 'PROHIBITED',
    centerLat: -12.0500,
    centerLon: -77.0500,
    lowerLimit: 'GND',
    upperLimit: '4000 FT AMSL',
    radius: null,
    polygon: null,
    restrictions: 'Zona permanentemente activada. Gobierno Central',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP92',
    name: 'CNOIS',
    type: 'PROHIBITED',
    centerLat: -12.5167,
    centerLon: -76.8000,
    lowerLimit: 'GND',
    upperLimit: '3000 FT AMSL',
    radius: null,
    polygon: '[{"lat":-12.49528,"lon":-76.80472},{"lat":-12.49444,"lon":-76.78694},{"lat":-12.51528,"lon":-76.78694},{"lat":-12.50806,"lon":-76.80250}]',
    restrictions: 'Centro Nacional de Operaciones de Imágenes Satelitales y Base Militar FAP. Prohibido actividades aéreas',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPP93',
    name: 'ZED ILO',
    type: 'PROHIBITED',
    centerLat: -17.6833,
    centerLon: -71.3333,
    lowerLimit: 'GND',
    upperLimit: '1500 FT AMSL',
    radius: null,
    polygon: null,
    restrictions: 'Prohibido sobrevuelo de aeronaves y aeronaves pilotadas a distancia',
    operatingHours: 'H24',
    authority: 'FAP',
    remarks: null,
  },
  {
    designator: 'SPR40',
    name: 'LAMBAYEQUE - PICSI',
    type: 'RESTRICTED',
    centerLat: -6.71861,
    centerLon: -79.76111,
    lowerLimit: 'GND',
    upperLimit: '1500 FT AGL',
    radius: 1,
    polygon: null,
    restrictions: 'Establecimiento Penitenciario. Prohibido actividades aéreas, excepto para aeronaves de Estado',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: null,
  },
  {
    designator: 'SPR41',
    name: 'CAJAMARCA - HUACARIZ',
    type: 'RESTRICTED',
    centerLat: -7.18972,
    centerLon: -78.48611,
    lowerLimit: 'GND',
    upperLimit: '1500 FT AGL',
    radius: 1,
    polygon: null,
    restrictions: 'Establecimiento penitenciario. Prohibido actividades aéreas excepto sobrevuelo RWY 34/16 AD SPJR',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: null,
  },
  {
    designator: 'SPR42',
    name: 'HUANCAYO - HUAMANCACA',
    type: 'RESTRICTED',
    centerLat: -12.08833,
    centerLon: -75.23111,
    lowerLimit: 'GND',
    upperLimit: '1500 FT AGL',
    radius: 1,
    polygon: null,
    restrictions: 'Establecimiento Penitenciario. Prohibido actividades aéreas, excepto para aeronaves de Estado',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: null,
  },
  {
    designator: 'SPR43',
    name: 'CUSCO - QUENCORO',
    type: 'RESTRICTED',
    centerLat: -13.54222,
    centerLon: -71.89278,
    lowerLimit: 'GND',
    upperLimit: '1500 FT AGL',
    radius: 1,
    polygon: null,
    restrictions: 'Establecimiento Penitenciario. Prohibido actividades aéreas, excepto para aeronaves de Estado',
    operatingHours: 'H24',
    authority: 'DIRCORA',
    remarks: null,
  },
]

// ─── Color helper ───────────────────────────────────────────────────

function getColorForType(type: string): string {
  switch (type) {
    case 'PROHIBITED':
      return '#DC2626'
    case 'RESTRICTED':
      return '#F59E0B'
    default:
      return '#8B5CF6'
  }
}

// ════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════

async function main() {
  console.log('━'.repeat(60))
  console.log('  ENR Data Seed — AIP PERÚ')
  console.log('━'.repeat(60))

  // ── 1. Navaids (upsert) ───────────────────────────────────────────
  console.log(`\n📡 Upserting ${navaids.length} navaids (ENR 4.1-1)...`)
  let navaidUpserted = 0
  let navaidErrors = 0

  for (const n of navaids) {
    try {
      await db.navaid.upsert({
        where: { id: n.id },
        update: {
          name: n.name,
          type: n.type,
          frequency: n.frequency,
          lat: n.lat,
          lon: n.lon,
          elevation: n.elevation,
        },
        create: {
          id: n.id,
          name: n.name,
          type: n.type,
          frequency: n.frequency,
          lat: n.lat,
          lon: n.lon,
          elevation: n.elevation,
        },
      })
      navaidUpserted++
    } catch (err) {
      navaidErrors++
      console.error(`  ✗ Error upserting navaid ${n.id}:`, err)
    }
  }
  console.log(`  ✓ Navaids: ${navaidUpserted} upserted, ${navaidErrors} errors`)

  // ── 2. Waypoints (upsert) ─────────────────────────────────────────
  console.log(`\n📍 Upserting ${waypoints.length} waypoints (ENR 4.4-1)...`)
  let wpUpserted = 0
  let wpErrors = 0

  for (const w of waypoints) {
    try {
      await db.waypoint.upsert({
        where: { id: w.id },
        update: {
          name: w.id,
          type: 'WAYPOINT',
          lat: w.lat,
          lon: w.lon,
          description: w.desc,
        },
        create: {
          id: w.id,
          name: w.id,
          type: 'WAYPOINT',
          lat: w.lat,
          lon: w.lon,
          description: w.desc,
        },
      })
      wpUpserted++
    } catch (err) {
      wpErrors++
      console.error(`  ✗ Error upserting waypoint ${w.id}:`, err)
    }
  }
  console.log(`  ✓ Waypoints: ${wpUpserted} upserted, ${wpErrors} errors`)

  // ── 3. Airspace Restrictions (delete + recreate) ──────────────────
  console.log(`\n🚫 Re-seeding ${airspaceRestrictions.length} airspace restrictions (ENR 5.1-1)...`)

  // Delete all existing
  const deleted = await db.airspaceRestriction.deleteMany({})
  console.log(`  → Deleted ${deleted.count} existing restrictions`)

  let arCreated = 0
  let arErrors = 0

  for (const r of airspaceRestrictions) {
    try {
      await db.airspaceRestriction.create({
        data: {
          designator: r.designator,
          name: r.name,
          type: r.type,
          status: 'ACTIVO',
          centerLat: r.centerLat,
          centerLon: r.centerLon,
          lowerLimit: r.lowerLimit,
          upperLimit: r.upperLimit,
          radius: r.radius,
          polygon: r.polygon,
          restrictions: r.restrictions,
          operatingHours: r.operatingHours,
          authority: r.authority,
          remarks: r.remarks,
          color: getColorForType(r.type),
        },
      })
      arCreated++
    } catch (err) {
      arErrors++
      console.error(`  ✗ Error creating restriction ${r.designator}:`, err)
    }
  }
  console.log(`  ✓ Airspace Restrictions: ${arCreated} created, ${arErrors} errors`)

  // ── Summary ───────────────────────────────────────────────────────
  console.log('\n' + '━'.repeat(60))
  console.log('  Seed Complete!')
  console.log(`  Navaids:              ${navaidUpserted} upserted`)
  console.log(`  Waypoints:            ${wpUpserted} upserted`)
  console.log(`  Airspace Restrictions: ${arCreated} created (${deleted.count} replaced)`)
  if (navaidErrors + wpErrors + arErrors > 0) {
    console.log(`  ⚠  Errors: ${navaidErrors + wpErrors + arErrors} total`)
  }
  console.log('━'.repeat(60))
}

main()
  .catch((e) => {
    console.error('Fatal seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
