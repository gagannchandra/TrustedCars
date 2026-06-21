import { MessageSquare, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Inquiry } from '../../../types';
import { formatPrice, timeAgo } from '../../../shared/utils/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inquiriesApi } from '../../../shared/api/client';

interface InquiriesTabProps {
  sentInquiries: Inquiry[];
  receivedInquiries: Inquiry[];
}

export default function InquiriesTab({ sentInquiries, receivedInquiries }: InquiriesTabProps) {
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string, message: string }) => inquiriesApi.replyInquiry(id, message),
    onSuccess: () => {
      toast.success('Reply sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['myInquiries'] });
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => inquiriesApi.closeInquiry(id),
    onSuccess: () => {
      toast.success('Inquiry closed.');
      queryClient.invalidateQueries({ queryKey: ['myInquiries'] });
    },
    onError: () => toast.error('Failed to close inquiry'),
  });
  return (
    <div>
      <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight mb-8">Messages & Inquiries</h2>
      
      {sentInquiries.length === 0 && receivedInquiries.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900 mb-2">No messages yet</h3>
          <p className="text-slate-500 font-medium mb-8">When you contact a seller or a buyer contacts you, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Sent Inquiries */}
          {sentInquiries.length > 0 && (
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 mb-6">Sent Inquiries</h3>
              <div className="space-y-6">
                {sentInquiries.map(inq => (
                  <div key={inq.id} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-full sm:w-48 h-32 rounded-2xl overflow-hidden shrink-0 bg-slate-100 relative">
                        <img src={inq.car?.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold px-2 py-1 rounded-lg">
                          {inq.car?.year}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-display font-bold text-xl text-slate-900 tracking-tight">{inq.car?.make} {inq.car?.model}</h4>
                            <p className="text-base font-bold text-primary mt-1">{formatPrice(inq.car?.asking_price || 0)}</p>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border ${inq.status === 'open' ? 'bg-primary/10 text-primary border-primary/20' : inq.status === 'responded' ? 'bg-success/10 text-success border-success/20' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {inq.status}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 mb-4">
                          <p className="text-sm font-medium text-slate-600 line-clamp-2 italic">"{inq.initial_message}"</p>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{timeAgo(inq.created_at)}</span>
                          <button onClick={() => toast.success('Conversation opened.')} className="text-sm font-bold text-primary hover:text-blue-800 flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl transition-colors">
                            View Conversation <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Received Inquiries */}
          {receivedInquiries.length > 0 && (
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 mb-6">Received Inquiries</h3>
              <div className="space-y-6">
                {receivedInquiries.map(inq => (
                  <div key={inq.id} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 transition-all hover:shadow-md">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <img src={inq.car?.images?.[0]?.url} alt="" className="w-full sm:w-48 h-32 rounded-2xl object-cover bg-slate-100 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-display font-bold text-xl text-slate-900 tracking-tight">{inq.car?.year} {inq.car?.make} {inq.car?.model}</h4>
                            <div className="flex items-center gap-2.5 mt-2 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                              <img src={inq.buyer?.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                              <span className="text-sm font-bold text-slate-700">{inq.buyer?.full_name}</span>
                              {inq.buyer_phone && <span className="text-xs font-bold text-slate-400">· {inq.buyer_phone}</span>}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border shrink-0 ${inq.status === 'responded' ? 'bg-success/10 text-success border-success/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                            {inq.status}
                          </span>
                        </div>
                        
                        <div className="mt-4 mb-4">
                          <p className="text-sm font-medium text-slate-600 italic">"{inq.initial_message}"</p>
                          {inq.preferred_visit_date && (
                            <p className="text-xs font-bold text-warning mt-2 flex items-center gap-1.5 bg-warning/10 w-fit px-2.5 py-1 rounded-md">
                              📅 Preferred visit: {new Date(inq.preferred_visit_date).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{timeAgo(inq.created_at)}</p>
                          <div className="flex gap-2">
                            <button 
                              disabled={replyMutation.isPending || closeMutation.isPending}
                              onClick={() => {
                                const msg = window.prompt("Enter your reply:");
                                if (msg) replyMutation.mutate({ id: inq.id, message: msg });
                              }} 
                              className="text-sm bg-primary text-white px-5 py-2 rounded-xl hover:bg-blue-800 font-bold shadow-md transition-colors disabled:opacity-50">Reply</button>
                            <button 
                              disabled={closeMutation.isPending || replyMutation.isPending}
                              onClick={() => closeMutation.mutate(inq.id)} 
                              className="text-sm border-2 border-slate-200 text-slate-600 px-5 py-2 rounded-xl hover:bg-slate-50 font-bold transition-colors disabled:opacity-50">Close</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
