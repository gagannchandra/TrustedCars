import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Camera, ChevronRight, ChevronLeft, Shield, Award, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import VehicleDetailsForm from './components/VehicleDetailsForm';
import ConditionReportForm from './components/ConditionReportForm';
import PhotoUploadForm from './components/PhotoUploadForm';
import PricingForm from './components/PricingForm';
import ContactForm from './components/ContactForm';

const sellSchema = z.object({
  // Step 1
  reg: z.string().optional(),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  variant: z.string().optional(),
  year: z.string().min(1, 'Year is required'),
  body_type: z.enum(['sedan', 'suv', 'hatchback', 'mpv', 'coupe', 'pickup']),
  
  // Step 2
  odometer: z.string().min(1, 'Odometer is required'),
  fuel: z.enum(['petrol', 'diesel', 'cng', 'electric', 'hybrid']),
  transmission: z.enum(['manual', 'automatic', 'amt']),
  owners: z.string().min(1, 'Number of owners is required'),
  accident: z.string().min(1, 'Accident history is required'),
  color: z.string().optional(),
  
  // Step 4
  price: z.string().min(1, 'Expected price is required'),
  negotiable: z.boolean(),
  hasService: z.boolean(),
  hasInvoice: z.boolean(),
  hasInsurance: z.boolean(),
  
  // Step 5
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  contactTime: z.string(),
});

type SellFormValues = z.infer<typeof sellSchema>;

const STEPS = ['Car Details', 'Condition', 'Photos', 'Pricing', 'Contact'];

export default function Sell() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isEditMode = !!id;
  const [started, setStarted] = useState(isEditMode);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [photos, setPhotos] = useState<{file: File; url: string}[]>([]);
  
  const photosRef = useRef(photos);
  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => {
    return () => photosRef.current.forEach(p => URL.revokeObjectURL(p.url));
  }, []);

  const methods = useForm<SellFormValues>({
    resolver: zodResolver(sellSchema),
    defaultValues: {
      reg: '', make: '', model: '', variant: '', year: '', body_type: 'sedan',
      odometer: '', fuel: 'petrol', transmission: 'manual', owners: '1', accident: 'no', color: '',
      price: '', negotiable: true, hasService: false, hasInvoice: false, hasInsurance: false,
      name: user?.full_name || '', phone: user?.phone || '', city: user?.city || '', state: user?.state || '', contactTime: 'anytime',
    },
    mode: 'onChange'
  });

  const { data: existingCar, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: async () => {
      const { carsApi } = await import('../../shared/api/client');
      return carsApi.getCarById(id!);
    },
    enabled: isEditMode
  });

  useEffect(() => {
    if (existingCar) {
      methods.reset({
        reg: existingCar.registration_number || '',
        make: existingCar.make || '',
        model: existingCar.model || '',
        variant: existingCar.variant || '',
        year: String(existingCar.year) || '',
        body_type: existingCar.body_type as any || 'sedan',
        odometer: String(existingCar.odometer_km) || '',
        fuel: existingCar.fuel_type as any || 'petrol',
        transmission: existingCar.transmission as any || 'manual',
        owners: String(existingCar.ownership_count) || '1',
        accident: existingCar.accident_history ? 'yes' : 'no',
        color: existingCar.color || '',
        price: String(existingCar.asking_price) || '',
        negotiable: existingCar.is_negotiable || false,
        hasService: existingCar.has_service_history || false,
        hasInvoice: existingCar.has_invoice || false,
        hasInsurance: existingCar.has_insurance || false,
        name: user?.full_name || '',
        phone: user?.phone || '',
        city: existingCar.city || user?.city || '',
        state: existingCar.state || user?.state || '',
        contactTime: 'anytime'
      });
    }
  }, [existingCar, methods, user]);

  const { trigger, handleSubmit } = methods;

  const handleNext = async () => {
    let fieldsToValidate: (keyof SellFormValues)[] = [];
    if (step === 0) fieldsToValidate = ['make', 'model', 'year', 'body_type'];
    if (step === 1) fieldsToValidate = ['odometer', 'fuel', 'transmission', 'owners', 'accident'];
    if (step === 3) fieldsToValidate = ['price'];
    
    if (step === 2) {
      if (photos.length === 0) {
        toast.error("Please upload at least one photo.");
        return;
      }
      setStep(s => s + 1);
      return;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(s => s + 1);
    }
  };

  const onSubmit = async (data: SellFormValues) => {
    try {
      // Map SellFormValues to CarCreateRequest/CarUpdateRequest
      const payload = {
        make: data.make,
        model: data.model,
        variant: data.variant || '',
        year: parseInt(data.year),
        fuel_type: data.fuel,
        transmission: data.transmission,
        body_type: data.body_type,
        odometer_km: parseInt(data.odometer.replace(/,/g, '')),
        ownership_count: parseInt(data.owners),
        asking_price: parseFloat(data.price.replace(/,/g, '')),
        city: data.city || 'Unknown',
        state: data.state || 'Unknown',
        registration_number: data.reg || undefined,
        color: data.color || undefined,
        has_service_history: data.hasService,
        has_invoice: data.hasInvoice,
        has_insurance: data.hasInsurance,
        is_negotiable: data.negotiable,
        accident_history: data.accident === 'yes'
      };

      const { carsApi } = await import('../../shared/api/client');
      let carId = id;
      if (isEditMode && id) {
        await carsApi.updateCar(id, payload);
      } else {
        const newCar = await carsApi.createCar(payload);
        carId = carId!;
      }

      // Upload photos sequentially
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i].file;
        await carsApi.uploadCarImagesDirect(carId!, file);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit listing:', err);
      toast.error('Failed to submit listing. Please try again.');
    }
  };

  if (isLoading) return <div className="min-h-screen pt-24 text-center">Loading...</div>;

  if (!started) {
    return (
      <div className="min-h-screen bg-surface">
        {/* Hero */}
        <section className="relative min-h-[85vh] flex items-center bg-primary overflow-hidden pt-16">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1920&q=80" alt="Sell Car bg" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/95 to-slate-900/80" />
          </div>
          
          <div className="relative w-full max-w-4xl mx-auto px-4 text-center z-10">
            <div className="inline-flex items-center gap-2 bg-success/20 border border-success/30 text-success text-sm font-bold px-5 py-2.5 rounded-full mb-8 backdrop-blur-sm uppercase tracking-wide">
              <Zap className="w-4 h-4" /> Sell Your Vehicle in 3 Easy Steps
            </div>
            <h1 className="font-display font-bold text-5xl sm:text-6xl text-white mb-6 leading-[1.1] tracking-tight">
              Get the <span className="text-transparent bg-clip-text bg-gradient-to-r from-success to-teal-200">Maximum Value</span><br />for Your Premium Car
            </h1>
            <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto font-medium">Free 200-point inspection · Data-driven valuation · Connect directly with verified enterprise buyers in under 72 hours.</p>
            <button onClick={() => { if (!isAuthenticated) navigate('/register'); else setStarted(true); }}
              className="bg-success hover:bg-green-600 text-white font-bold text-xl px-12 py-5 rounded-full transition-all shadow-lg hover:shadow-success/30 hover:-translate-y-1">
              Start Evaluation — It's Free
            </button>
            <p className="text-white/60 text-sm font-medium mt-6">No hidden fees · Zero broker commissions · 12,000+ successful transactions</p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-primary font-bold tracking-wide text-sm mb-2 uppercase">The Enterprise Process</p>
              <h2 className="font-display font-bold text-4xl text-slate-900 tracking-tight">How Selling Works</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: '01', icon: <Camera className="w-8 h-8 text-primary" />, title: 'List Your Vehicle', desc: 'Provide details and upload high-quality photos in under 10 minutes.' },
                { step: '02', icon: <Shield className="w-8 h-8 text-success" />, title: 'Free Inspection', desc: 'Our certified engineers visit and comprehensively inspect your vehicle.' },
                { step: '03', icon: <TrendingUp className="w-8 h-8 text-blue-500" />, title: 'Receive Offers', desc: 'Get direct inquiries from our network of verified premium buyers.' },
                { step: '04', icon: <Award className="w-8 h-8 text-amber-500" />, title: 'Secure Transfer', desc: 'Complete the sale with enterprise-grade RC transfer assistance.' },
              ].map((item, i) => (
                <div key={i} className="text-center p-6 rounded-3xl bg-surface border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 group-hover:border-primary/20 transition-colors">{item.icon}</div>
                  <div className="text-primary text-xs font-bold mb-2 uppercase tracking-widest">{item.step}</div>
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-base text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-24 bg-surface">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '72 Hrs', label: 'Average Time to Sell' },
                { value: '₹0', label: 'Platform Listing Fees' },
                { value: '99%', label: 'Satisfied Enterprise Sellers' },
                { value: '150+', label: 'Verified Cities Covered' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="font-display font-bold text-5xl text-primary mb-3 tracking-tighter">{stat.value}</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="text-center py-20 bg-white">
          <h2 className="font-display font-bold text-4xl text-slate-900 mb-8 tracking-tight">Ready to sell your premium vehicle?</h2>
          <button onClick={() => { if (!isAuthenticated) navigate('/register'); else setStarted(true); }}
            className="bg-primary hover:bg-blue-800 text-white font-bold px-12 py-5 rounded-full transition-all shadow-lg hover:shadow-primary/30 text-lg hover:-translate-y-1">
            Create Your Listing Now
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 pt-24">
        <div className="bg-white rounded-[32px] p-12 max-w-lg w-full text-center shadow-2xl border border-slate-100">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-success/20">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h2 className="font-display font-bold text-4xl text-slate-900 mb-4 tracking-tight">Listing Submitted!</h2>
          <p className="text-slate-600 font-medium text-lg mb-4">Your vehicle has been submitted for enterprise review.</p>
          <div className="bg-slate-50 p-4 rounded-2xl mb-10 text-sm font-medium text-slate-500 border border-slate-100">
            Our team will review your submission and schedule the 200-point inspection. You will receive a confirmation email shortly.
          </div>
          <div className="space-y-4">
            <button onClick={() => navigate('/dashboard')} className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-blue-800 shadow-md transition-colors text-base">Go to Seller Dashboard</button>
            <button onClick={() => navigate('/cars')} className="w-full bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors text-base">Browse Inventory</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-12 pt-28">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-primary uppercase tracking-wide">Step {step + 1} of {STEPS.length}</span>
            <span className="text-sm font-bold text-slate-900">{STEPS[step]}</span>
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-3 px-1">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-[10px] font-bold uppercase tracking-wider ${i <= step ? 'text-primary' : 'text-slate-400'}`}>{s}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 sm:p-12">
          <h2 className="font-display font-bold text-3xl text-slate-900 mb-8 tracking-tight">{STEPS[step]}</h2>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 0 && <VehicleDetailsForm />}
              {step === 1 && <ConditionReportForm />}
              {step === 2 && <PhotoUploadForm photos={photos} setPhotos={setPhotos} />}
              {step === 3 && <PricingForm />}
              {step === 4 && <ContactForm />}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors uppercase tracking-wide px-4 py-2">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={handleNext}
                    className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-md">
                    Next Step <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button type="submit"
                    className="flex items-center gap-3 bg-primary hover:bg-blue-800 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg hover:shadow-primary/30">
                    <CheckCircle className="w-5 h-5" /> Submit for Inspection
                  </button>
                )}
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
