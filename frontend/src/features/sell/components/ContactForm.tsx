import { CheckCircle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';

export default function ContactForm() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      <Input 
        label="Your Full Name *" 
        placeholder="Full name" 
        {...register('name')} 
        error={errors.name?.message as string} 
      />
      <Input 
        label="Mobile Number *" 
        placeholder="+91 98765 43210" 
        {...register('phone')} 
        error={errors.phone?.message as string} 
      />
      <Input 
        label="City of Inspection" 
        placeholder="Your city" 
        {...register('city')} 
        error={errors.city?.message as string} 
      />
      <Input 
        label="State" 
        placeholder="Your state" 
        {...register('state')} 
        error={errors.state?.message as string} 
      />
      <Select 
        label="Preferred Contact Window" 
        {...register('contactTime')} 
        error={errors.contactTime?.message as string}
        options={[
          { value: 'anytime', label: 'Anytime' },
          { value: 'morning', label: 'Morning (9 AM – 12 PM)' },
          { value: 'afternoon', label: 'Afternoon (12 PM – 4 PM)' },
          { value: 'evening', label: 'Evening (4 PM – 8 PM)' }
        ]}
      />
      <div className="bg-success/10 border border-success/20 rounded-2xl p-5 text-sm font-medium text-success flex items-start gap-3">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <span>By submitting this listing, you agree to receive communications from TrustedCars enterprise agents regarding your vehicle evaluation.</span>
      </div>
    </div>
  );
}
