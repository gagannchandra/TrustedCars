import bcrypt from "bcryptjs";

const passwordHash = bcrypt.hashSync("demo1234", 10);

export const cities = [
  { id: "city_mumbai", name: "Mumbai", slug: "mumbai", state: "Maharashtra", active: true, car_count: 2842, inspection_centers: 4, avg_price_lakh: 12.8, lat: 19.076, lng: 72.8777 },
  { id: "city_delhi", name: "Delhi", slug: "delhi", state: "NCR", active: true, car_count: 3214, inspection_centers: 5, avg_price_lakh: 13.4, lat: 28.7041, lng: 77.1025 },
  { id: "city_bengaluru", name: "Bengaluru", slug: "bengaluru", state: "Karnataka", active: true, car_count: 2687, inspection_centers: 4, avg_price_lakh: 14.1, lat: 12.9716, lng: 77.5946 },
  { id: "city_pune", name: "Pune", slug: "pune", state: "Maharashtra", active: true, car_count: 1842, inspection_centers: 3, avg_price_lakh: 12.2, lat: 18.5204, lng: 73.8567 },
  { id: "city_hyderabad", name: "Hyderabad", slug: "hyderabad", state: "Telangana", active: true, car_count: 1624, inspection_centers: 3, avg_price_lakh: 13.8, lat: 17.385, lng: 78.4867 },
  { id: "city_chennai", name: "Chennai", slug: "chennai", state: "Tamil Nadu", active: true, car_count: 1482, inspection_centers: 3, avg_price_lakh: 12.4, lat: 13.0827, lng: 80.2707 },
  { id: "city_indore", name: "Indore", slug: "indore", state: "Madhya Pradesh", active: false, car_count: 0, inspection_centers: 0, avg_price_lakh: 0, lat: 22.7196, lng: 75.8577 },
];

export const users = [
  { id: "usr_buyer", name: "Arjun Sharma", email: "arjun.sharma@email.com", phone: "+919876543210", password_hash: passwordHash, role: "buyer", kyc_status: "approved", city_id: "city_mumbai", avatar_url: null, is_verified: true, wallet_balance_paise: 0, created_at: new Date("2024-01-15").toISOString() },
  { id: "usr_seller", name: "Priya Nair", email: "priya.nair@email.com", phone: "+919876543211", password_hash: passwordHash, role: "seller", kyc_status: "approved", city_id: "city_bengaluru", avatar_url: null, is_verified: true, wallet_balance_paise: 4280000, created_at: new Date("2023-08-20").toISOString() },
  { id: "usr_admin", name: "Admin User", email: "admin@trustedcars.in", phone: "+919876543212", password_hash: passwordHash, role: "admin", kyc_status: "approved", city_id: "city_bengaluru", avatar_url: null, is_verified: true, wallet_balance_paise: 0, created_at: new Date("2023-01-01").toISOString() },
  { id: "usr_dealer_1", name: "TrustedCars Powai", email: "powai@trustedcars.in", phone: "+919876543213", password_hash: passwordHash, role: "seller", kyc_status: "approved", city_id: "city_mumbai", avatar_url: null, is_verified: true, wallet_balance_paise: 0, created_at: new Date("2023-04-11").toISOString() },
];

const img = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200`;

export const cars = [
  { id: "car_creta_2022", seller_id: "usr_seller", city_id: "city_bengaluru", make: "Hyundai", model: "Creta", variant: "SX(O) 1.5 Diesel AT", year: 2022, price_paise: 1645000 * 100, km_driven: 18420, fuel_type: "Diesel", transmission: "Automatic", owner_count: 1, body_type: "SUV", color: "Phantom Black", registration_number: "KA03TC2022", status: "active", quality_score: 94, fraud_score: 8, description: "Top-spec Creta with sunroof, ventilated seats, Bose audio and full Hyundai service history.", primary_image_url: img(31040132), created_at: new Date("2026-01-12").toISOString() },
  { id: "car_swift_2023", seller_id: "usr_dealer_1", city_id: "city_mumbai", make: "Maruti Suzuki", model: "Swift", variant: "ZXi+ AMT", year: 2023, price_paise: 785000 * 100, km_driven: 9120, fuel_type: "Petrol", transmission: "Automatic", owner_count: 1, body_type: "Hatchback", color: "Pearl Arctic White", registration_number: "MH02TC2023", status: "active", quality_score: 96, fraud_score: 4, description: "Almost-new Swift ZXi+ with cruise control, touchscreen, and full NEXA service records.", primary_image_url: img(33686091), created_at: new Date("2026-01-15").toISOString() },
  { id: "car_nexon_ev_2024", seller_id: "usr_dealer_1", city_id: "city_delhi", make: "Tata", model: "Nexon EV", variant: "Max XZ+ Lux", year: 2024, price_paise: 1799000 * 100, km_driven: 6430, fuel_type: "Electric", transmission: "Automatic", owner_count: 1, body_type: "SUV", color: "Intensi-Teal", registration_number: "DL10TC2024", status: "active", quality_score: 98, fraud_score: 3, description: "Flagship Nexon EV Max with 437 km range, ventilated seats and excellent battery health.", primary_image_url: img(29810714), created_at: new Date("2026-01-10").toISOString() },
  { id: "car_city_2021", seller_id: "usr_seller", city_id: "city_pune", make: "Honda", model: "City", variant: "ZX CVT", year: 2021, price_paise: 1325000 * 100, km_driven: 34210, fuel_type: "Petrol", transmission: "Automatic", owner_count: 1, body_type: "Sedan", color: "Platinum White Pearl", registration_number: "MH12TC2021", status: "pending", quality_score: 91, fraud_score: 12, description: "Flagship Honda City with Honda Sensing, lane watch camera and mature single owner history.", primary_image_url: img(34562593), created_at: new Date("2026-01-14").toISOString() },
  { id: "car_bmw_330li_2022", seller_id: "usr_dealer_1", city_id: "city_bengaluru", make: "BMW", model: "3 Series", variant: "330Li M Sport", year: 2022, price_paise: 4250000 * 100, km_driven: 21340, fuel_type: "Petrol", transmission: "Automatic", owner_count: 1, body_type: "Sedan", color: "Black Sapphire Metallic", registration_number: "KA05TC2022", status: "active", quality_score: 95, fraud_score: 6, description: "Long-wheelbase 330Li M Sport with Harman Kardon, digital cluster and active BMW BSI.", primary_image_url: img(11877375), created_at: new Date("2026-01-13").toISOString() },
];

export const carImages = cars.flatMap((car, index) => [
  { id: `img_${car.id}_1`, car_id: car.id, url: car.primary_image_url, position: 1, is_primary: true },
  { id: `img_${car.id}_2`, car_id: car.id, url: img([31040128, 34562593, 16545859, 33686091, 29810714][index] || 31040128), position: 2, is_primary: false },
]);

export const inspections = cars.map((car) => ({
  id: `insp_${car.id}`,
  car_id: car.id,
  inspector_id: "usr_admin",
  status: "completed",
  scheduled_at: new Date("2026-01-16T11:00:00.000Z").toISOString(),
  completed_at: new Date("2026-01-16T11:33:00.000Z").toISOString(),
  score: car.quality_score,
  summary: `${car.make} ${car.model} passed TrustedCars certification with a ${car.quality_score}/100 quality score.`,
  share_token: `share_${car.id}`,
}));

export const checklistItems = ["Engine compression", "Engine oil leaks", "Gearbox operation", "Suspension noise", "Brake pads", "Tyre tread", "Battery health", "AC cooling", "Infotainment", "Body paint depth", "Frame damage", "Interior wear"].flatMap((item, index) =>
  inspections.map((insp) => ({
    id: `chk_${insp.id}_${index}`,
    inspection_id: insp.id,
    category: index < 3 ? "engine" : index < 6 ? "tyres" : index < 9 ? "interior" : "body",
    item_name: item,
    condition: index % 5 === 0 ? "minor" : "pass",
    notes: index % 5 === 0 ? "Minor wear noted, no immediate action required." : "Passed inspection standard.",
    photo_url: index % 5 === 0 ? img(31040128) : null,
  }))
);

export const reviews = [
  { id: "rev_1", buyer_id: "usr_buyer", car_id: "car_city_2021", seller_id: "usr_seller", rating: 5, text: "Detailed inspection report and clean RC transfer. The process felt safe.", created_at: new Date("2026-01-05").toISOString() },
];

export const dbState = {
  users,
  cities,
  cars,
  carImages,
  inspections,
  checklistItems,
  bookings: [],
  payments: [],
  orders: [],
  reviews,
  wishlists: [{ id: "wish_1", buyer_id: "usr_buyer", car_id: "car_creta_2022" }],
  savedSearches: [],
  notifications: [],
  supportTickets: [],
  chatRooms: [],
  chatMessages: [],
  otpCodes: new Map(),
  refreshTokens: new Map(),
};