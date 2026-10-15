export interface Seat {
  id: string;
  number: number;
  isFree: boolean;
}

export interface BookingRequest {
  clubId: string;
  zoneId: string;
  seatIds: string[];
  date: string;
  startTime: string;
  tariffId: string;
  hours: number;
  total: number;
  customerName: string;
  customerPhone: string;
}

export interface Booking extends BookingRequest {
  id: string;
  status: "pending_payment" | "confirmed";
  createdAt: string;
}
