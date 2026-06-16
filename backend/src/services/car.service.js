import { store } from "../db.js";
import { badRequest, forbidden, notFound } from "../errors.js";
import { id } from "../utils/id.js";
import { calculateFraudScore } from "./fraud.service.js";

export function hydrateCar(car) {
  if (!car) return null;
  const city = store.cities.find((item) => item.id === car.city_id);
  const seller = store.users.find((item) => item.id === car.seller_id);
  const images = store.carImages.filter((item) => item.car_id === car.id).sort((a, b) => a.position - b.position);
  const inspection = store.inspections.find((item) => item.car_id === car.id);
  return {
    ...car,
    price_lakh: Number((car.price_paise / 10000000).toFixed(2)),
    city,
    seller: seller ? { id: seller.id, name: seller.name, role: seller.role, is_verified: seller.is_verified, kyc_status: seller.kyc_status } : null,
    images,
    inspection,
  };
}

export function searchCars(query) {
  const {
    q,
    city,
    make,
    model,
    fuel_type,
    transmission,
    body_type,
    min_price,
    max_price,
    min_year,
    max_year,
    owner_count,
    status = "active",
    sort = "quality_desc",
    page = 1,
    limit = 12,
  } = query;

  let rows = [...store.cars];
  if (status !== "all") rows = rows.filter((car) => car.status === status);
  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter((car) => `${car.make} ${car.model} ${car.variant} ${car.registration_number}`.toLowerCase().includes(needle));
  }
  if (city) {
    const cityRecord = store.cities.find((item) => item.slug === city || item.name.toLowerCase() === String(city).toLowerCase());
    if (cityRecord) rows = rows.filter((car) => car.city_id === cityRecord.id);
  }
  if (make) rows = rows.filter((car) => listIncludes(make, car.make));
  if (model) rows = rows.filter((car) => listIncludes(model, car.model));
  if (fuel_type) rows = rows.filter((car) => listIncludes(fuel_type, car.fuel_type));
  if (transmission) rows = rows.filter((car) => listIncludes(transmission, car.transmission));
  if (body_type) rows = rows.filter((car) => listIncludes(body_type, car.body_type));
  if (owner_count) rows = rows.filter((car) => Number(car.owner_count) === Number(owner_count));
  if (min_price) rows = rows.filter((car) => car.price_paise >= Number(min_price) * 10000000);
  if (max_price) rows = rows.filter((car) => car.price_paise <= Number(max_price) * 10000000);
  if (min_year) rows = rows.filter((car) => car.year >= Number(min_year));
  if (max_year) rows = rows.filter((car) => car.year <= Number(max_year));

  rows.sort(sorter(sort));

  const total = rows.length;
  const start = (Number(page) - 1) * Number(limit);
  const items = rows.slice(start, start + Number(limit)).map(hydrateCar);
  return {
    items,
    facets: buildFacets(rows),
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  };
}

export function getCar(idOrRegistration) {
  const car = store.cars.find((item) => item.id === idOrRegistration || item.registration_number === idOrRegistration);
  if (!car) throw notFound("Car not found");
  return hydrateCar(car);
}

export function createListing(user, payload) {
  if (!user || !["seller", "admin"].includes(user.role)) throw forbidden("Only sellers can create listings");
  const seller = store.users.find((item) => item.id === user.id);
  const city = store.cities.find((item) => item.id === payload.city_id || item.slug === payload.city_slug) || store.cities[0];
  const car = {
    id: id("car"),
    seller_id: user.id,
    city_id: city.id,
    make: payload.make,
    model: payload.model,
    variant: payload.variant || "Standard",
    year: Number(payload.year),
    price_paise: Number(payload.price_lakh) * 10000000,
    km_driven: Number(payload.km_driven || 0),
    fuel_type: payload.fuel_type,
    transmission: payload.transmission,
    owner_count: Number(payload.owner_count || 1),
    body_type: payload.body_type || "SUV",
    color: payload.color || "White",
    registration_number: payload.registration_number,
    status: "pending",
    quality_score: 0,
    fraud_score: 0,
    description: payload.description || `${payload.year} ${payload.make} ${payload.model} listed for TrustedCars certification.`,
    primary_image_url: payload.primary_image_url || null,
    created_at: new Date().toISOString(),
  };
  const fraud = calculateFraudScore(car, seller, store.cars);
  car.fraud_score = fraud.score;
  store.cars.unshift(car);
  if (payload.images?.length) {
    payload.images.forEach((url, index) => store.carImages.push({ id: id("img"), car_id: car.id, url, position: index + 1, is_primary: index === 0 }));
    car.primary_image_url = payload.images[0];
  }
  return { car: hydrateCar(car), fraud };
}

export function addCarImage(user, carId, file) {
  const car = store.cars.find((item) => item.id === carId);
  if (!car) throw notFound("Car not found");
  if (user.role !== "admin" && car.seller_id !== user.id) throw forbidden("You do not own this listing");
  const position = store.carImages.filter((item) => item.car_id === carId).length + 1;
  const url = `https://res.cloudinary.com/trustedcars-demo/image/upload/c_fill,w_1200,h_900,q_auto/${carId}_${position}_${encodeURIComponent(file.originalname || "car.jpg")}`;
  const image = { id: id("img"), car_id: carId, url, position, is_primary: position === 1 };
  store.carImages.push(image);
  if (!car.primary_image_url) car.primary_image_url = url;
  return image;
}

export function moderateListing(admin, carId, action, reason = null) {
  if (admin.role !== "admin") throw forbidden("Admin access required");
  const car = store.cars.find((item) => item.id === carId);
  if (!car) throw notFound("Car not found");
  if (!["approve", "reject"].includes(action)) throw badRequest("Action must be approve or reject");
  car.status = action === "approve" ? "active" : "rejected";
  car.moderation_reason = reason;
  car.moderated_at = new Date().toISOString();
  return hydrateCar(car);
}

function listIncludes(list, value) {
  return String(list).split(",").map((x) => x.trim().toLowerCase()).includes(String(value).toLowerCase());
}

function sorter(sort) {
  const sorters = {
    price_asc: (a, b) => a.price_paise - b.price_paise,
    price_desc: (a, b) => b.price_paise - a.price_paise,
    year_desc: (a, b) => b.year - a.year,
    km_asc: (a, b) => a.km_driven - b.km_driven,
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    quality_desc: (a, b) => b.quality_score - a.quality_score,
  };
  return sorters[sort] || sorters.quality_desc;
}

function buildFacets(rows) {
  const facet = (field) => rows.reduce((acc, car) => ({ ...acc, [car[field]]: (acc[car[field]] || 0) + 1 }), {});
  return {
    make: facet("make"),
    model: facet("model"),
    fuel_type: facet("fuel_type"),
    transmission: facet("transmission"),
    body_type: facet("body_type"),
    owner_count: facet("owner_count"),
  };
}