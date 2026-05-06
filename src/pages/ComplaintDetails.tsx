import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Complaint, ComplaintStatus, PriorityLevel } from '../types';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Camera,
  Star,
  Users,
  Briefcase,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { cn, formatDate } from '../utils';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const ComplaintDetails: React.FC<{ id: string; onBack: () => void }> = ({ id, onBack }) => {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const res = await axios.get('/api/complaints');
      if (Array.isArray(res.data)) {
        const found = res.data.find((c: any) => c._id === id);
        setComplaint(found || null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Details fetch error:", err);
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<Complaint>) => {
    setUpdating(true);
    try {
      const res = await axios.patch(`/api/complaints/${id}`, updates);
      setComplaint(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const submitFeedback = async () => {
    if (feedbackRating === 0) return;
    await handleUpdate({
      feedback: { rating: feedbackRating, comment: feedbackComment },
      status: 'Closed'
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-slate-500 font-medium animate-pulse">Loading grievance details...</p>
    </div>
  );

  if (!complaint) return <div className="text-center py-20 text-slate-500">Grievance not found.</div>;

  const isSachiv = user?.role === 'sachiv';
  const isDM = user?.role === 'dm';
  const isCitizenOwner = user?.role === 'citizen' && (typeof complaint.citizenId === 'object' ? complaint.citizenId._id : complaint.citizenId) === user.id;

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-6 transition-all group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        BACK TO DASHBOARD
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md tracking-wider">
                  {complaint.category}
                </span>
                <span className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider border",
                  complaint.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                  complaint.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                  'bg-emerald-50 text-emerald-700 border-emerald-100'
                )}>
                  {complaint.priority} Priority
                </span>
                <span className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider",
                  complaint.status === 'Resolved' ? 'bg-emerald-600 text-white shadow-sm' : 
                  complaint.status === 'In Progress' ? 'bg-indigo-600 text-white shadow-sm' : 
                  'bg-slate-100 text-slate-600'
                )}>
                  {complaint.status}
                </span>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">{complaint.title}</h2>
              
              <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Users size={16} />
                  </div>
                  <span className="font-semibold text-slate-700">
                    {typeof complaint.citizenId === 'object' ? complaint.citizenId.name : 'Citizen'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Submitted on {formatDate(complaint.createdAt)}</span>
                </div>
                {complaint.location.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{complaint.location.address}</span>
                  </div>
                )}
              </div>

              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>

              {/* Media Gallery */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {complaint.mediaUrls && complaint.mediaUrls.length > 0 ? (
                  complaint.mediaUrls.map((url, i) => (
                    <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <img src={url} alt="Proof" className="w-full h-full object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="aspect-[4/3] col-span-full bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
                    <Camera size={40} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">No media attached</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SLA Counter */}
          <div className="bg-indigo-900 rounded-2xl p-8 text-white flex items-center justify-between shadow-xl shadow-indigo-100 overflow-hidden relative">
            <div className="absolute left-0 top-0 w-1 h-full bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
            <div className="space-y-1">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">SLA Deadline</p>
              <p className="text-2xl font-bold">
                {complaint.slaDeadline ? formatDate(complaint.slaDeadline) : 'No specified deadline'}
              </p>
            </div>
            <div className="text-right">
              <Clock size={40} className="text-indigo-400/30 mb-2 ml-auto" />
              {complaint.status === 'Resolved' || complaint.status === 'Closed' ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                  MET ON TIME
                </span>
              ) : (
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-xs font-bold border border-rose-500/30">
                  ACTION REQUIRED
                </span>
              )}
            </div>
          </div>

          {/* Feedback Section */}
          <AnimatePresence>
            {complaint.status === 'Resolved' && isCitizenOwner && !complaint.feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Star className="text-emerald-500" fill="currentColor" />
                  <h3 className="text-xl font-bold text-emerald-900">Your Feedback Matters</h3>
                </div>
                <p className="text-emerald-700 text-sm mb-6 font-medium">Issue marked as resolved by Sachiv. How would you rate the experience?</p>
                
                <div className="flex gap-4 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setFeedbackRating(star)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        feedbackRating >= star ? "text-emerald-500 scale-110" : "text-emerald-200"
                      )}
                    >
                      <Star size={32} fill={feedbackRating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>

                <textarea
                  className="w-full bg-white border border-emerald-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
                  placeholder="Additional comments (optional)..."
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />

                <button 
                  onClick={submitFeedback}
                  disabled={feedbackRating === 0}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  SUBMIT FEEDBACK & CLOSE TICKET
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          {/* Status Updates (Sachiv/DM) */}
          {(isSachiv || isDM) && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert size={18} className="text-slate-400" />
                Administrative Actions
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">Update Status</label>
                  <select 
                    value={complaint.status}
                    onChange={(e) => handleUpdate({ status: e.target.value as ComplaintStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    disabled={updating}
                  >
                    <option value="Submitted">Submitted (Reviewing)</option>
                    <option value="Verified">Verified (Validated)</option>
                    <option value="Rejected">Reject (Fake/Duplicate)</option>
                    <option value="Assigned">Assigned to Worker</option>
                    <option value="In Progress">Work in Progress</option>
                    <option value="Resolved">Resolved (Pending Feedback)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">Assign Worker</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Worker Name/ID"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 text-sm font-semibold"
                      value={complaint.assignedTo || ''}
                      onChange={(e) => handleUpdate({ assignedTo: e.target.value })}
                      onBlur={() => handleUpdate({ status: 'Assigned' })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">Adjust Priority</label>
                  <div className="flex gap-2">
                    {(['Low', 'Medium', 'High'] as PriorityLevel[]).map(p => (
                      <button
                        key={p}
                        onClick={() => handleUpdate({ priority: p })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all",
                          complaint.priority === p 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Timeline */}
          <div className="bg-slate-900 rounded-2xl p-8 text-white">
            <h3 className="text-sm font-bold mb-6 text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UserCheck size={18} />
              Redressal Trail
            </h3>
            <div className="space-y-8 relative">
              <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-slate-800" />
              
              <div className="flex gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.4)]">
                  <Users size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold">Reported</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{formatDate(complaint.createdAt)}</p>
                </div>
              </div>

              <div className={cn("flex gap-4 relative z-10 transition-opacity", complaint.status === 'Submitted' ? 'opacity-30' : 'opacity-100')}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                  complaint.status !== 'Submitted' ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-slate-800 border-slate-700'
                )}>
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold">Verified</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                    {complaint.status !== 'Submitted' ? 'Sachiv Checked' : 'Pending Verification'}
                  </p>
                </div>
              </div>

              <div className={cn("flex gap-4 relative z-10 transition-opacity", ['Submitted', 'Verified', 'Rejected'].includes(complaint.status) ? 'opacity-30' : 'opacity-100')}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                  !['Submitted', 'Verified', 'Rejected'].includes(complaint.status) ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-slate-800 border-slate-700'
                )}>
                  <Briefcase size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold">In Resolution</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                    {complaint.assignedTo ? `Worker: ${complaint.assignedTo}` : 'Awaiting Assignment'}
                  </p>
                </div>
              </div>

              <div className={cn("flex gap-4 relative z-10 transition-opacity", complaint.status !== 'Resolved' && complaint.status !== 'Closed' ? 'opacity-30' : 'opacity-100')}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                  (complaint.status === 'Resolved' || complaint.status === 'Closed') ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-800 border-slate-700'
                )}>
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold">Closed</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                    {(complaint.status === 'Resolved' || complaint.status === 'Closed') ? 'Resolution Complete' : 'Follow Progress'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetails;
