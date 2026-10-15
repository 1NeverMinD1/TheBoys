export type ZoneType = "standard" | "vip" | "bootcamp" | "console";

export type TariffKind = "hourly" | "package" | "night";

export interface Coords {
  lat: number;
  lng: number;
}

export interface WorkingHours {
  open: string;
  close: string;
  is24h: boolean;
}

export interface PcSpec {
  cpu: string;
  gpu: string;
  ramGb: number;
  monitor: string;
  refreshRateHz: number;
}

export interface Tariff {
  id: string;
  name: string;
  kind: TariffKind;
  hours: number | null;
  price: number;
  timeFrom: string | null;
  timeTo: string | null;
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  seatsTotal: number;
  seatsFree: number;
  pcSpec: PcSpec | null;
  peripherals: string[];
  tariffs: Tariff[];
}

export interface Club {
  id: string;
  name: string;
  city: string;
  address: string;
  coords: Coords;
  phone: string;
  workingHours: WorkingHours;
  photos: string[];
  rating: number;
  reviewsCount: number;
  description: string;
  equipment: string[];
  zones: Zone[];
}

export interface ClubSummary {
  id: string;
  name: string;
  city: string;
  address: string;
  coords: Coords;
  photo: string | null;
  rating: number;
  reviewsCount: number;
  is24h: boolean;
  minPricePerHour: number;
  seatsFree: number;
  seatsTotal: number;
  zoneTypes: ZoneType[];
  topGpu: string | null;
  maxRefreshRateHz: number;
}
