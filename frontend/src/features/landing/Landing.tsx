import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';
import FeaturedCars from './components/FeaturedCars';
import HowItWorks from './components/HowItWorks';
import PopularBrands from './components/PopularBrands';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Hero />
      <TrustStrip />
      <FeaturedCars />
      <HowItWorks />
      <PopularBrands />
      <Testimonials />
      <CTA />
    </div>
  );
}
