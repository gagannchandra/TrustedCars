export function calculateFraudScore(car, seller, existingCars = []) {
  let score = 0;
  const reasons = [];

  if (!seller?.is_verified || seller?.kyc_status !== "approved") {
    score += 20;
    reasons.push("Seller KYC is not approved");
  }

  const sellerRecentListings = existingCars.filter((item) => item.seller_id === car.seller_id).length;
  if (sellerRecentListings >= 5) {
    score += 25;
    reasons.push("High listing velocity for seller");
  }

  const currentYear = new Date().getFullYear();
  if (car.year > currentYear + 1 || car.year < 2005) {
    score += 20;
    reasons.push("Manufacturing year is outside expected range");
  }

  if (car.price_paise < 250000 * 100 || car.price_paise > 9000000 * 100) {
    score += 15;
    reasons.push("Price is outside normal marketplace range");
  }

  if (car.km_driven < 100 || car.km_driven > 250000) {
    score += 15;
    reasons.push("Odometer reading is unusual");
  }

  if (!car.primary_image_url) {
    score += 20;
    reasons.push("Listing has no primary image");
  }

  return { score: Math.min(score, 100), reasons };
}

export function riskLabel(score) {
  if (score >= 75) return "high";
  if (score >= 40) return "medium";
  return "low";
}