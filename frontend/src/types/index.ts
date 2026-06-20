export type UserRole = 'user' | 'admin' | 'dealer';
export type CarStatus = 'pending' | 'active' | 'sold' | 'rejected' | 'archived';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'cng' | 'hybrid';
export type Transmission = 'manual' | 'automatic' | 'amt';
export type BodyType = 'sedan' | 'suv' | 'hatchback' | 'mpv' | 'coupe' | 'pickup';
export type QualityBadge = 'excellent' | 'good' | 'fair' | 'below_average';
export type InquiryStatus = 'open' | 'responded' | 'closed';

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  is_verified: boolean;
  city?: string;
  state?: string;
  created_at: string;
  rating?: number;
  review_count?: number;
}

export interface CarImage {
  id: string;
  car_id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface InspectionReport {
  id: string;
  car_id: string;
  inspector_name?: string;
  inspected_at?: string;
  engine_score: number;
  transmission_score: number;
  suspension_score: number;
  brakes_score: number;
  electricals_score: number;
  ac_score: number;
  interior_score: number;
  exterior_score: number;
  tyre_score: number;
  overall_score: number;
  findings: {
    engine: { status: string; notes: string };
    tyres: { front_left: number; front_right: number; rear_left: number; rear_right: number };
    paint: { touched_up: string[]; original: string[] };
    accident_history: boolean;
    flood_damage: boolean;
    odometer_genuine: boolean;
  };
}

export interface ServiceRecord {
  id: string;
  car_id: string;
  service_date: string;
  odometer_at_service: number;
  service_center: string;
  service_type: string;
  notes?: string;
}

export interface Car {
  id: string;
  seller_id: string;
  seller?: User;
  make: string;
  model: string;
  variant?: string;
  year: number;
  registration_number?: string;
  fuel_type: FuelType;
  transmission: Transmission;
  body_type?: BodyType;
  color?: string;
  engine_cc?: number;
  mileage_kmpl?: number;
  seating_capacity?: number;
  odometer_km: number;
  ownership_count: number;
  asking_price: number;
  market_value?: number;
  price_negotiable: boolean;
  city: string;
  state: string;
  title?: string;
  description?: string;
  highlights?: string[];
  inspection_score?: number;
  quality_badge?: QualityBadge;
  status: CarStatus;
  is_featured: boolean;
  view_count: number;
  wishlist_count: number;
  listed_at?: string;
  created_at: string;
  images?: CarImage[];
  inspection?: InspectionReport;
  service_records?: ServiceRecord[];
}

export interface Inquiry {
  id: string;
  car_id: string;
  car?: Car;
  buyer_id: string;
  buyer?: User;
  seller_id: string;
  seller?: User;
  status: InquiryStatus;
  initial_message: string;
  buyer_phone?: string;
  preferred_visit_date?: string;
  created_at: string;
  messages?: InquiryMessage[];
}

export interface InquiryMessage {
  id: string;
  inquiry_id: string;
  sender_id: string;
  sender?: User;
  message: string;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewer?: User;
  seller_id: string;
  car_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface PriceHistory {
  month: string;
  avg_price: number;
  min_price: number;
  max_price: number;
}

export interface FilterState {
  q?: string;
  make?: string;
  model?: string;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  fuel_type?: FuelType;
  transmission?: Transmission;
  city?: string;
  km_max?: number;
  body_type?: BodyType;
  ownership?: number;
  sort?: string;
  page?: number;
}
