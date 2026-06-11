export interface Airport {
  id: string;
  icaoCode: string;
  name: string;
  city: string;
  department: string;
  region?: string;
  elevation: string; // e.g. "157 m / 516 ft"
  fireCategory: string;
  authorizedTraffic: string;
}

export interface AirportDetail extends Airport {
  province?: string;
  district?: string;
  country: string;
  arpLatitude?: string;
  arpLongitude?: string;
  temperature?: string;
  geoidalUndulation?: string;
  magneticDeclination?: string;
  annualChange?: string;
  distanceFromCity?: string;
  administrationType?: string;
  address?: string;
  phone?: string;
  fax?: string;
  aftn?: string;
  email?: string;
  remarks?: string;
  operatingHours?: Record<string, string>;
  cargoHandlingFacilities?: string;
  fuelTypes?: string;
  lubricantTypes?: string;
  refuelingFacilities?: { tipo?: string; capacidad?: string } | string;
  deIcingFacilities?: string;
  hangarSpace?: string;
  repairFacilities?: string;
  scaleRemarks?: string;
  hotels?: string;
  restaurants?: string;
  transport?: string;
  medicalFacilities?: string;
  bankingPost?: string;
  tourismOffice?: string;
  passengerRemarks?: string;
  rescueEquipment?: string;
  aircraftRemovalCapacity?: string;
  rescueRemarks?: string;
  platformData?: { superficie?: string; resistencia?: string } | string;
  taxiwayData?: { ancho?: string; superficie?: string; resistencia?: string } | string;
  checkpointData?: { altimetro?: string; ins?: string; vordme?: string } | string;
  platformRemarks?: string;
  surfaceGuidance?: string;
  runwaySigns?: string;
  taxiwaySigns?: string;
  stopBars?: string;
  guidanceRemarks?: string;
  metOffice?: string;
  metHours?: string;
  metForecastOffice?: string;
  metValidity?: string;
  metLandingForecast?: string;
  metTrendInterval?: string;
  metBriefing?: string;
  metConsultation?: string;
  metDocumentation?: string;
  metLanguage?: string;
  metCharts?: string;
  metSupplementary?: string;
  metAtsDependencies?: string;
  metAdditionalInfo?: string;
  runways?: Runway[];
  declaredDistances?: DeclaredDistance[];
  obstacles?: Obstacle[];
  radioNavAids?: RadioNavAid[];
  communications?: Communication[];
}

export interface Runway {
  designator: string;
  brgGeo?: string;
  brgMag?: string;
  dimensions?: string;
  pcn?: string;
  surface?: string;
  thrCoords?: string;
  thrElevation?: string;
  swyDimensions?: string;
  cwyDimensions?: string;
  stripDimensions?: string;
  ofz?: string;
  resa?: string;
}

export interface DeclaredDistance {
  rwy: string;
  tora: number;
  toda: number;
  asda: number;
  lda: number;
  remarks?: string;
}

export interface Obstacle {
  id: string;
  airportId: string;
  runwayArea?: string;
  obstacleType?: string;
  elevation?: string;
  markingLighting?: string;
  coordinates?: string | null;
  remarks?: string | null;
}

export interface RadioNavAid {
  id: string;
  airportId: string;
  type?: string;
  identifier?: string;
  frequency?: string;
  coordinates?: string;
  elevation?: string;
  remarks?: string;
}

export interface Communication {
  id: string;
  airportId: string;
  service?: string;
  frequency?: string;
  callsign?: string;
  hours?: string;
  remarks?: string;
}
