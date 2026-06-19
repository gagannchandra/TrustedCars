import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import type { InspectionReport as InspectionReportType } from '../../../types';

function getScoreColorEnterprise(score: number) {
  return score >= 8 ? '#10B981' : score >= 6 ? '#0F4C81' : '#F59E0B';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = getScoreColorEnterprise(score);
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-bold text-slate-700 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div className="h-full rounded-full transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]" style={{ width: `${score * 10}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold text-slate-900 w-8 text-right">{score}</span>
    </div>
  );
}

interface InspectionReportProps {
  inspection: InspectionReportType;
  expandedFinding: string | null;
  setExpandedFinding: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function InspectionReport({ inspection, expandedFinding, setExpandedFinding }: InspectionReportProps) {
  const SCORE_ITEMS = [
    { label: 'Engine', score: inspection.engine_score },
    { label: 'Transmission', score: inspection.transmission_score },
    { label: 'Suspension', score: inspection.suspension_score },
    { label: 'Brakes', score: inspection.brakes_score },
    { label: 'Electricals', score: inspection.electricals_score },
    { label: 'AC / Climate', score: inspection.ac_score },
    { label: 'Interior', score: inspection.interior_score },
    { label: 'Exterior', score: inspection.exterior_score },
    { label: 'Tyres', score: inspection.tyre_score },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Enterprise Inspection</h2>
          <p className="text-sm font-medium text-slate-500">200-point rigorous quality check</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-12 mb-10">
        {/* Score Gauge */}
        <div className="relative w-44 h-44 shrink-0">
          <svg viewBox="0 0 120 120" className="w-44 h-44 -rotate-90 drop-shadow-md">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#F1F5F9" strokeWidth="12" />
            <circle cx="60" cy="60" r="52" fill="none" strokeWidth="12" strokeLinecap="round"
              stroke={getScoreColorEnterprise(inspection.overall_score)}
              strokeDasharray={`${(inspection.overall_score / 100) * 326.7} 326.7`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className="font-display font-bold text-5xl text-slate-900 tracking-tighter">{inspection.overall_score}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score</span>
          </div>
        </div>

        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
          <div className="space-y-5">
            {SCORE_ITEMS.slice(0, 5).map(item => (
              <ScoreBar key={item.label} label={item.label} score={item.score} />
            ))}
          </div>
          <div className="space-y-5">
            {SCORE_ITEMS.slice(5).map(item => (
              <ScoreBar key={item.label} label={item.label} score={item.score} />
            ))}
          </div>
        </div>
      </div>

      {/* Key Findings */}
      <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Key Findings Summary</h3>
        {[
          { key: 'accident', icon: inspection.findings.accident_history ? <AlertTriangle className="w-5 h-5 text-warning" /> : <CheckCircle className="w-5 h-5 text-success" />, label: 'Accident History', value: inspection.findings.accident_history ? 'Minor accidents reported' : 'No accident history' },
          { key: 'flood', icon: <CheckCircle className="w-5 h-5 text-success" />, label: 'Flood Damage', value: inspection.findings.flood_damage ? 'Flood damage detected' : 'No flood damage' },
          { key: 'odometer', icon: <CheckCircle className="w-5 h-5 text-success" />, label: 'Odometer', value: inspection.findings.odometer_genuine ? 'Genuine odometer reading' : 'Tampered odometer suspected' },
          { key: 'engine', icon: <CheckCircle className="w-5 h-5 text-success" />, label: 'Engine Health', value: inspection.findings.engine.notes },
        ].map(f => (
          <button key={f.key} onClick={() => setExpandedFinding(expandedFinding === f.key ? null : f.key)}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-100 transition-all text-left shadow-sm">
            <div className="bg-slate-50 p-2 rounded-lg">{f.icon}</div>
            <span className="text-sm font-bold text-slate-900 w-36">{f.label}</span>
            <span className="text-sm font-medium text-slate-600 flex-1">{f.value}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 tracking-wide uppercase">
        <Shield className="w-4 h-4 text-primary shrink-0" />
        Inspected by TrustedCars Certified Engineer · {inspection.inspector_name}
      </div>
    </div>
  );
}
