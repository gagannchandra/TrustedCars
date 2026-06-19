import { useFormContext } from 'react-hook-form';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';

export default function ConditionReportForm() {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const fuel = watch('fuel');
  const transmission = watch('transmission');

  return (
    <div className="space-y-8">
      <Input 
        label="Odometer Reading (km) *" 
        type="number" 
        placeholder="e.g. 32000" 
        {...register('odometer')} 
        error={errors.odometer?.message as string} 
      />
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-3">Fuel Type *</label>
        <div className="flex flex-wrap gap-3">
          {['petrol', 'diesel', 'cng', 'electric', 'hybrid'].map(f => (
            <button key={f} type="button" onClick={() => setValue('fuel', f, { shouldValidate: true })}
              className={`px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide border-2 transition-all ${fuel === f ? 'border-primary bg-primary text-white shadow-md shadow-primary/20' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-3">Transmission</label>
        <div className="flex gap-3">
          {['manual', 'automatic', 'amt'].map(t => (
            <button key={t} type="button" onClick={() => setValue('transmission', t, { shouldValidate: true })}
              className={`flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wide border-2 transition-all ${transmission === t ? 'border-primary bg-primary text-white shadow-md shadow-primary/20' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Select 
          label="Number of Owners" 
          {...register('owners')} 
          error={errors.owners?.message as string}
          options={[
            { value: '1', label: '1st Owner' },
            { value: '2', label: '2nd Owner' },
            { value: '3', label: '3rd+ Owner' }
          ]}
        />
        <Select 
          label="Accident History" 
          {...register('accident')} 
          error={errors.accident?.message as string}
          options={[
            { value: 'no', label: 'No Accidents' },
            { value: 'minor', label: 'Minor Damage' },
            { value: 'major', label: 'Major Accident' }
          ]}
        />
      </div>
      <Input 
        label="Exterior Color" 
        placeholder="e.g. Pearl White, Phantom Black" 
        {...register('color')} 
        error={errors.color?.message as string} 
      />
    </div>
  );
}
