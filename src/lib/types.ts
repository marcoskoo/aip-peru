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
  category?: string; // INTERNACIONAL or NACIONAL
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
  taxiwayData?: { ancho?: string; superficie?: string; resistencia?: string } | { nombre?: string; ancho?: string; superficie?: string; resistencia?: string }[] | string;
  checkpointData?: { altimetro?: string; ins?: string; vordme?: string } | string;
  platformRemarks?: string;
  surfaceGuidance?: string | Record<string, unknown>;
  runwaySigns?: string;
  taxiwaySigns?: string;
  stopBars?: string;
  guidanceRemarks?: string;
  metOffice?: string | Record<string, unknown>;
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

// Airways & Navigation Types

export interface Coord {
  lat: number;
  lon: number;
}

export interface Navaid {
  id: string;
  name: string;
  type: string; // VOR/DME, NDB, VOR, DME, TACAN
  frequency: string;
  lat: number;
  lon: number;
  elevation?: number;
}

export interface Waypoint {
  id: string;
  name: string;
  type: string; // WAYPOINT, NAVAID, AIRPORT
  lat: number;
  lon: number;
  description?: string;
}

export interface AirwaySegment {
  from: string;
  to: string;
  distance: number; // NM
  bearing: number; // degrees true
  minFL?: number;
  maxFL?: number;
  trackTrue?: number;
  reverseTrack?: number;
  navaid?: string;
  level?: string;
}

export interface Airway {
  designator: string;
  type: "CONVENTIONAL" | "RNAV";
  level: "LOWER" | "UPPER" | "BOTH";
  segments: AirwaySegment[];
}

export interface FIRBoundary {
  name: string;
  type: string;
  center: Coord;
  polygon: Coord[];
}

export interface AdjacentFIR {
  icao: string;
  name: string;
  country: string;
  borderPoints?: Coord[];
}

export interface AirwaysData {
  firBoundaries: Record<string, FIRBoundary>;
  adjacentFirs: AdjacentFIR[];
  navaids: Navaid[];
  waypoints: Waypoint[];
  airways: {
    conventional: Airway[];
    rnav: Airway[];
  };
}

// Heliport Types

export interface Heliport {
  id: string
  icaoCode: string
  name: string
  city: string
  department?: string
  province?: string
  district?: string
  country: string
  latitude?: string
  longitude?: string
  elevation?: string
  lat?: number
  lon?: number
  type?: string
  surface?: string
  dimensions?: string
  markings?: string
  lighting?: string
  status: string
  operatingHours?: string
  authorizedTraffic?: string
  restrictions?: string
  communications?: string // JSON string
  operator?: string
  phone?: string
  remarks?: string
}

// Route Calculator Types

export interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: "WAYPOINT" | "NAVAID" | "AIRPORT";
  airwayUsed?: string;
  distanceFromPrev?: number; // NM
  bearingFromPrev?: number;
  cumulativeDistance?: number; // NM
}

export interface RouteSummary {
  totalDistance: number; // NM
  totalSegments: number;
  waypoints: number;
  navaids: number;
  estimatedTime: number; // minutes at given speed
  flightLevels: { min: number; max: number };
  trajectory: RoutePoint[];
}

// ICAO Flight Plan Types

export interface ICAOFlightPlan {
  // Field 7 - Aircraft Identification
  aircraftIdentification: string;
  // Field 8 - Flight Rules and Type
  flightRules: "I" | "V" | "Y" | "Z";
  typeOfFlight: "S" | "N" | "G" | "M" | "X";
  // Field 9 - Number and Type of Aircraft and Wake Turbulence Category
  numberOfAircraft: string;
  typeOfAircraft: string;
  wakeTurbulenceCat: "H" | "M" | "L";
  // Field 10 - Equipment and Capabilities
  equipment: string;
  transponder: string;
  // Field 13 - Departure Aerodrome and Time
  departureAerodrome: string;
  estimatedOffBlockTime: string;
  // Field 15 - Route
  cruisingSpeed: string;
  level: string;
  route: string;
  // Field 16 - Destination Aerodrome and Total Estimated Elapsed Time
  destinationAerodrome: string;
  totalEET: string;
  alternateAerodrome1: string;
  alternateAerodrome2: string;
  // Field 18 - Other Information
  otherInformation: string;
  // Field 19 - Supplementary Information
  endurance: string;
  personsOnBoard: string;
  emergencyRadio: "U" | "V" | "E";
  survivalEquipment: string;
  jackets: string;
  dinghies: string;
  aircraftColorAndMarkings: string;
  pilotInCommand: string;
  remarks: string;
}
