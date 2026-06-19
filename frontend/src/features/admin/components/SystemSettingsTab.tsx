import { Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SystemSettingsTab() {
  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 sm:p-12">
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
          <Settings className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">System Configuration</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage global platform parameters and rules</p>
        </div>
      </div>

      <div className="space-y-8 max-w-2xl">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-4 text-base">Transaction Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700">Platform Fee %</p>
                <p className="text-xs text-slate-500 mt-0.5">Commission charged on completed sales</p>
              </div>
              <input type="number" defaultValue={2.5} className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-right text-sm font-bold bg-white" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div>
                <p className="text-sm font-bold text-slate-700">Auto-Approve High Score</p>
                <p className="text-xs text-slate-500 mt-0.5">Bypass manual QC for scores &gt;= 9.0</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button onClick={() => toast.success('Configuration saved.')} className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl text-base font-bold shadow-md transition-all hover:-translate-y-0.5">
            Apply Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
