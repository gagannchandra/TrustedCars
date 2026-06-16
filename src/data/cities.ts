export type City = {
  slug: string;
  name: string;
  state: string;
  active: boolean;
  inspectionCenters: number;
  carCount: number;
  avgPrice: number;
  growth: number;
  coordinates: { lat: number; lng: number };
};

export const CITIES: City[] = [
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra", active: true, inspectionCenters: 4, carCount: 2842, avgPrice: 12.8, growth: 8.4, coordinates: { lat: 19.076, lng: 72.8777 } },
  { slug: "delhi", name: "Delhi", state: "NCR", active: true, inspectionCenters: 5, carCount: 3214, avgPrice: 13.4, growth: 6.2, coordinates: { lat: 28.7041, lng: 77.1025 } },
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka", active: true, inspectionCenters: 4, carCount: 2687, avgPrice: 14.1, growth: 11.2, coordinates: { lat: 12.9716, lng: 77.5946 } },
  { slug: "pune", name: "Pune", state: "Maharashtra", active: true, inspectionCenters: 3, carCount: 1842, avgPrice: 12.2, growth: 9.1, coordinates: { lat: 18.5204, lng: 73.8567 } },
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana", active: true, inspectionCenters: 3, carCount: 1624, avgPrice: 13.8, growth: 14.5, coordinates: { lat: 17.385, lng: 78.4867 } },
  { slug: "chennai", name: "Chennai", state: "Tamil Nadu", active: true, inspectionCenters: 3, carCount: 1482, avgPrice: 12.4, growth: 7.8, coordinates: { lat: 13.0827, lng: 80.2707 } },
  { slug: "kolkata", name: "Kolkata", state: "West Bengal", active: true, inspectionCenters: 2, carCount: 1108, avgPrice: 10.6, growth: 5.4, coordinates: { lat: 22.5726, lng: 88.3639 } },
  { slug: "ahmedabad", name: "Ahmedabad", state: "Gujarat", active: true, inspectionCenters: 2, carCount: 1284, avgPrice: 11.8, growth: 8.9, coordinates: { lat: 23.0225, lng: 72.5714 } },
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan", active: true, inspectionCenters: 2, carCount: 942, avgPrice: 10.2, growth: 6.7, coordinates: { lat: 26.9124, lng: 75.7873 } },
  { slug: "kochi", name: "Kochi", state: "Kerala", active: true, inspectionCenters: 1, carCount: 612, avgPrice: 12.8, growth: 9.4, coordinates: { lat: 9.9312, lng: 76.2673 } },
  { slug: "chandigarh", name: "Chandigarh", state: "Punjab", active: true, inspectionCenters: 1, carCount: 482, avgPrice: 11.4, growth: 7.1, coordinates: { lat: 30.7333, lng: 76.7794 } },
  { slug: "lucknow", name: "Lucknow", state: "Uttar Pradesh", active: true, inspectionCenters: 1, carCount: 528, avgPrice: 9.8, growth: 6.2, coordinates: { lat: 26.8467, lng: 80.9462 } },
  { slug: "indore", name: "Indore", state: "Madhya Pradesh", active: false, inspectionCenters: 0, carCount: 0, avgPrice: 0, growth: 0, coordinates: { lat: 22.7196, lng: 75.8577 } },
  { slug: "nagpur", name: "Nagpur", state: "Maharashtra", active: false, inspectionCenters: 0, carCount: 0, avgPrice: 0, growth: 0, coordinates: { lat: 21.1458, lng: 79.0882 } },
  { slug: "coimbatore", name: "Coimbatore", state: "Tamil Nadu", active: false, inspectionCenters: 0, carCount: 0, avgPrice: 0, growth: 0, coordinates: { lat: 11.0168, lng: 76.9558 } },
];

export const getCity = (slug: string) => CITIES.find((c) => c.slug === slug);
