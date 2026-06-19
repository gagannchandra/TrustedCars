import { useFormContext } from 'react-hook-form';
import { MAKES } from '../../../data/mockData';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';

export default function VehicleDetailsForm() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input 
            label="Registration Number" 
            placeholder="MH01AB1234" 
            {...register('reg')} 
            error={errors.reg?.message as string} 
            className="uppercase"
          />
        </div>
        <button type="button" className="px-6 py-3.5 bg-primary/10 text-primary text-sm font-bold rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors whitespace-nowrap h-[54px] mb-[0.5px]">
          Auto-Fetch
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Select 
          label="Make *" 
          {...register('make')} 
          error={errors.make?.message as string}
          options={[
            { value: '', label: 'Select Make' },
            ...MAKES.map(m => ({ value: m, label: m }))
          ]}
        />
        <Input 
          label="Model *" 
          placeholder="e.g. Swift, City" 
          {...register('model')} 
          error={errors.model?.message as string} 
        />
        <Input 
          label="Variant" 
          placeholder="e.g. VXI, ZXi+" 
          {...register('variant')} 
          error={errors.variant?.message as string} 
        />
        <Select 
          label="Year *" 
          {...register('year')} 
          error={errors.year?.message as string}
          options={[
            { value: '', label: 'Select Year' },
            ...Array.from({ length: 15 }, (_, i) => 2024 - i).map(y => ({ value: y.toString(), label: y.toString() }))
          ]}
        />
      </div>
    </div>
  );
}
