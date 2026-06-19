import { CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PRICE_HISTORY } from '../../../data/mockData';
import type { Car } from '../../../types';

interface PriceHistoryChartProps {
  car: Car;
  priceDiff: number;
}

export default function PriceHistoryChart({ car, priceDiff }: PriceHistoryChartProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
      <h2 className="font-display font-bold text-2xl text-slate-900 mb-6 tracking-tight">Market Price Analysis</h2>
      {priceDiff >= 5 && (
        <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 text-success text-sm font-bold px-4 py-2.5 rounded-xl mb-6 shadow-sm">
          <CheckCircle className="w-5 h-5" />
          Excellent Value: Priced {priceDiff}% below market average
        </div>
      )}
      <p className="text-sm font-medium text-slate-500 mb-6">Historical price trend for {car.make} {car.model} variants over the last 6 months.</p>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={PRICE_HISTORY} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              formatter={(v) => [`₹${(Number(v) / 100000).toFixed(2)}L`, 'Market Average']} 
            />
            <Line type="monotone" dataKey="avg_price" stroke="#0F4C81" strokeWidth={3} dot={{ fill: '#0F4C81', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} name="Avg Market Price" />
            <ReferenceLine y={car.asking_price} stroke="#10B981" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'This Vehicle', position: 'insideTopRight', fill: '#10B981', fontSize: 12, fontWeight: 'bold' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
