import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Complaint } from '../types';
import { 
  Clock, 
  MapPin, 
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  ShieldCheck,
  TrendingUp,
  Filter
} from 'lucide-react';
import { cn, formatDate } from '../utils';
import { motion } from 'motion/react';

interface DashboardProps {
  onSelectComplaint: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectComplaint }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    axios.get('/api/complaints')
      .then(res => {
        if (Array.isArray(res.data)) {
          setComplaints(res.data);
        } else {
          setComplaints([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
        setComplaints([]);
        setLoading(false);
      });
  }, []);

  const getSLAStatus = (deadline: string | undefined) => {
    if (!deadline) return null;
    const now = new Date();
    const due = new Date(deadline);
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' };
    if (days <= 2) return { label: `${days}d left`, color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { label: `${days}d left`, color: 'bg-blue-100 text-blue-700 border-blue-200' };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Low': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-stone-50 text-stone-600 border-stone-100';
    }
  };

  const voteResolution = async (complaintId: string, vote: 'resolved' | 'unresolved') => {
    try {
      await axios.patch(`/api/complaints/${complaintId}`, { vote });
      // Update local state
      setComplaints(prev => prev.map(c => 
        c._id === complaintId 
          ? { 
              ...c, 
              resolutionVotes: { 
                resolved: vote === 'resolved' 
                  ? [...(c.resolutionVotes?.resolved || []), user?.id || ''] 
                  : (c.resolutionVotes?.resolved || []).filter(id => id !== user?.id),
                unresolved: vote === 'unresolved'
                  ? [...(c.resolutionVotes?.unresolved || []), user?.id || '']
                  : (c.resolutionVotes?.unresolved || []).filter(id => id !== user?.id)
              }
            } 
          : c
      ));
    } catch (err) {
      console.error("Voting failed:", err);
    }
  };

  const stats = [
    { label: 'Total Complaints', value: complaints.length, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Action', value: complaints.filter(c => c.status === 'Submitted' || c.status === 'Verified').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Resolved Cases', value: complaints.filter(c => c.status === 'Resolved').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Resolution', value: '4.2 Days', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const filteredComplaints = filter === 'All' 
    ? complaints 
    : complaints.filter(c => c.category === filter);

  const categories = ['All', 'Water', 'Electricity', 'Roads', 'Sanitation', 'Education', 'Health'];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {user?.role === 'dm' ? 'District Oversight Panel' : 
             user?.role === 'sachiv' ? 'Sachiv Management Dashboard' : 
             'Citizen Governance Portal'}
          </h2>
          <p className="text-slate-500">
            {user?.role === 'dm' ? 'Monitoring performance across all Nagar Panchayats' :
             user?.role === 'sachiv' ? `Managing local issues for ${user?.panchayat?.name || 'Nagar Panchayat'}` :
             'Report local issues and track development in your area'}
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg self-start">
          <button className="px-4 py-2 bg-white rounded shadow-sm text-sm font-semibold flex items-center gap-2">
            <Filter size={14} />
            Filter View
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-lg", stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Community Verification Strip */}
        {user?.role === 'citizen' && complaints.some(c => c.status === 'Resolved') && (
          <div className="lg:col-span-12 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-600" />
                Community Resolution Audit
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Vote to certify local fixes</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {complaints.filter(c => c.status === 'Resolved').map((complaint) => (
                <div key={complaint._id} className="min-w-[320px] bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{complaint.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">Resolved on {formatDate(complaint.createdAt)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 italic line-clamp-2">
                    "{complaint.description}"
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        voteResolution(complaint._id, 'resolved');
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2",
                        complaint.resolutionVotes?.resolved.includes(user?.id || '')
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      )}
                    >
                      <CheckCircle2 size={12} />
                      Satisfied ({complaint.resolutionVotes?.resolved.length || 0})
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        voteResolution(complaint._id, 'unresolved');
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2",
                        complaint.resolutionVotes?.unresolved.includes(user?.id || '')
                          ? "bg-rose-600 text-white"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      )}
                    >
                      <AlertCircle size={12} />
                      Dispute ({complaint.resolutionVotes?.unresolved.length || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <AlertCircle size={20} className="text-indigo-600" />
              {user?.role === 'citizen' ? 'My Reported Issues' : 'Recent Complaints'}
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['All', 'Pending', 'High Priority'].map(f => (
                <button key={f} className="px-3 py-1 text-xs font-bold rounded-full border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors whitespace-nowrap">
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-xl p-16 text-center border-2 border-dashed border-slate-200">
              <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No complaints found. System is healthy.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredComplaints.map((complaint, i) => {
                const sla = getSLAStatus(complaint.slaDeadline);
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={complaint._id}
                    onClick={() => onSelectComplaint(complaint._id)}
                    className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md tracking-wider">
                          {complaint.category}
                        </span>
                        <span className={cn(
                          "px-3 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider border",
                          getPriorityColor(complaint.priority)
                        )}>
                          {complaint.priority} Priority
                        </span>
                        <span className={cn(
                          "px-3 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider",
                          complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 
                          complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                          'bg-amber-100 text-amber-700'
                        )}>
                          {complaint.status}
                        </span>
                      </div>
                      
                      {sla && (
                        <div className={cn("px-3 py-1 text-[10px] font-bold rounded-md border flex items-center gap-1", sla.color)}>
                          <Clock size={10} />
                          SLA: {sla.label}
                        </div>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {complaint.title}
                    </h4>
                    <p className="text-slate-500 text-sm line-clamp-1 mt-1">
                      {complaint.description}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <MapPin size={14} />
                          <span>{complaint.location.address || 'Location Shared'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Users size={14} />
                          <span>{typeof complaint.citizenId === 'object' ? complaint.citizenId.name : 'Unknown Citizen'}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        {formatDate(complaint.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-indigo-900 rounded-xl p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <ShieldCheck size={32} className="mb-4 text-indigo-300" />
            <h3 className="text-lg font-bold mb-2">Platform Policy</h3>
            <p className="text-indigo-100/70 text-xs leading-relaxed mb-6 font-medium">
              Every submission is auto-analyzed for duplication. Please provide clear photographic proof for faster resolution by Sachiv.
            </p>
            <button className="w-full py-3 bg-white text-indigo-900 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors">
              User Handbook
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-600" />
              SLA Compliance
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Electricity', value: 92, color: 'bg-indigo-500' },
                { label: 'Water Supply', value: 78, color: 'bg-amber-500' },
                { label: 'Waste Collection', value: 85, color: 'bg-emerald-500' }
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-900">{item.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className={cn("h-full", item.color)} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[10px] text-slate-400 text-center font-medium">
              Data refreshed every 15 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
