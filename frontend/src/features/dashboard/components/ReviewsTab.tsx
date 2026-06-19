import { Star } from 'lucide-react';
import type { Review } from '../../../types';
import { timeAgo } from '../../../shared/utils/utils';

interface ReviewsTabProps {
  myReviews: Review[];
}

export default function ReviewsTab({ myReviews }: ReviewsTabProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight mb-8">Seller Ratings & Reviews</h2>
      {myReviews.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900 mb-2">No reviews yet</h3>
          <p className="text-slate-500 font-medium">Complete a sale to collect buyer feedback!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myReviews.map(review => (
            <div key={review.id} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6">
              <div className="flex items-start gap-4">
                <img src={review.reviewer?.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-base">{review.reviewer?.full_name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm font-medium text-slate-600 leading-relaxed mb-3">"{review.comment}"</p>}
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{timeAgo(review.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
