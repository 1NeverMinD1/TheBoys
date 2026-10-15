// Формат данных в моках фронта (совпадает с типом Club из src/types/club.ts)
export interface SeedClub {
  id: string;
  name: string;
  city: string;
  address: string;
  coords: { lat: number; lng: number };
  phone: string;
  workingHours: { open: string; close: string; is24h: boolean };
  photos: string[];
  rating: number;
  reviewsCount: number;
  description: string;
  equipment: string[];
  zones: {
    id: string;
    name: string;
    type: 'standard' | 'vip' | 'bootcamp' | 'console';
    seatsTotal: number;
    seatsFree: number;
    pcSpec: { cpu: string; gpu: string; ramGb: number; monitor: string; refreshRateHz: number } | null;
    peripherals: string[];
    tariffs: {
      id: string;
      name: string;
      kind: 'hourly' | 'package' | 'night';
      hours: number | null;
      price: number;
      timeFrom: string | null;
      timeTo: string | null;
    }[];
  }[];
}
