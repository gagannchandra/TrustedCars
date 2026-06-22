import { Link } from 'react-router-dom';
import { Car, Phone, Mail, MapPin, Shield, Award } from 'lucide-react';

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com/people/Trusted-Carz/100091499334919/', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { label: 'Twitter', href: '/coming-soon', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg> },
  { label: 'Instagram', href: 'https://www.instagram.com/trustedcarz/', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
  { label: 'YouTube', href: 'https://www.youtube.com/@TrustedcarZ1', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg> },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">TrustedCars</span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-xs">
              India's most trusted used car marketplace. Every car undergoes a 200-point inspection so you can buy with confidence.
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label}
                  className="w-9 h-9 bg-white/10 hover:bg-white rounded-lg flex items-center justify-center hover:text-primary transition-all">
                  {social.icon}
                </a>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
                <Shield className="w-4 h-4 text-success" />
                SSL Secured
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
                <Award className="w-4 h-4 text-blue-300" />
                ISO Certified
              </div>
            </div>
          </div>

          {/* Buy a Car */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Buy a Car</h4>
            <ul className="space-y-2.5">
              {['Browse All Cars', 'Cars Under ₹3 Lakh', 'Electric Cars', 'SUVs & Crossovers', 'Sedans', 'Hatchbacks', 'First Owner Cars'].map(item => (
                <li key={item}><Link to="/cars" className="text-sm text-white/60 hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* Sell a Car */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Sell a Car</h4>
            <ul className="space-y-2.5">
              {['Free Inspection', 'Get Best Price', 'Sell in 3 Days', 'Price Calculator', 'Seller Guide', 'Dealer Program'].map(item => (
                <li key={item}><Link to="/sell" className="text-sm text-white/60 hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Company</h4>
            <ul className="space-y-2.5">
              {['About TrustedCars', 'How It Works', 'Trust & Safety', 'Inspection Process', 'Careers', 'Press Room', 'Blog'].map(item => (
                <li key={item}><Link to="/coming-soon" className="text-sm text-white/60 hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/80"><Phone className="w-4 h-4 text-blue-300" /> 1800-123-CARS</div>
              <div className="flex items-center gap-2 text-sm text-white/80"><Mail className="w-4 h-4 text-blue-300" /> support@trustedcars.in</div>
              <div className="flex items-center gap-2 text-sm text-white/80"><MapPin className="w-4 h-4 text-blue-300" /> New Delhi, India</div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">© 2026 TrustedCars Enterprise. All rights reserved.</p>
          <div className="flex flex-wrap gap-6 justify-center">
            {['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Cookie Policy'].map(item => (
              <Link key={item} to="/coming-soon" className="text-xs text-white/50 hover:text-white transition-colors">{item}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
