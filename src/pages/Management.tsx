import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Complaint } from '../types';
import { 
  ShieldCheck, 
  Users, 
  MapPin,
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  FileText,
  AlertCircle,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate } from '../utils';

const Management: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('/api/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, updates: any) => {
    try {
      await axios.patch(`/api/complaints/${id}`, updates);
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved': return <CheckCircle2 size={12} className="text-emerald-500" />;
      case 'In Progress': return <Clock size={12} className="text-blue-500" />;
      case 'Submitted': return <AlertCircle size={12} className="text-amber-500" />;
      default: return null;
    }
  };

  const overdueCount = complaints.filter(c => {
    if (c.status === 'Resolved' || c.status === 'Closed') return false;
    if (!c.slaDeadline) return false;
    return new Date(c.slaDeadline) < new Date();
  }).length;

  const disputedCount = complaints.filter(c => 
    c.status === 'Resolved' && 
    (c.resolutionVotes?.unresolved.length || 0) > (c.resolutionVotes?.resolved.length || 0)
  ).length;

  const stats = user?.role === 'dm' ? [
    { label: 'District Pulse (Total)', value: complaints.length, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Direct DM Reports', value: complaints.filter(c => c.isDirectToDM).length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Disputed Resolutions', value: disputedCount, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Panchayats', value: Array.from(new Set(complaints.map(c => c.panchayatId))).length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
  ] : [
    { label: 'Pending Local Action', value: complaints.filter(c => c.status === 'Submitted').length, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active In-Progress', value: complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Successful Resolutions', value: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'SLA At-Risk', value: overdueCount, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" />
            {user?.role === 'dm' ? 'District Magistrate Oversight' : 'Nagar Panchayat Administration'}
          </h2>
          <p className="text-slate-500">
            {user?.role === 'dm' 
              ? 'Monitoring governance performance and delayed resolutions district-wide' 
              : `Operational management for ${user?.panchayat?.name || 'Local'} Council`}
          </p>
        </div>
        <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <FileText size={18} />
          Grievance Audit Report
        </button>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
          >
            <div className={cn("inline-flex p-3 rounded-lg mb-4", stat.bg, stat.color)}>
              <stat.icon size={20} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Governance Workflow Queue</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider">All</button>
              <button className="px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors uppercase tracking-wider">High Priority</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Complaint / Status</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4">Responsible</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.length > 0 ? complaints.map((complaint) => {
                  const isOverdue = complaint.status !== 'Resolved' && complaint.status !== 'Closed' && complaint.slaDeadline && new Date(complaint.slaDeadline) < new Date();
                  return (
                    <tr key={complaint._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-bold tracking-tight">
                              {complaint.title}
                            </span>
                            {isOverdue && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[8px] font-black uppercase rounded border border-rose-200">
                                Escalated
                              </span>
                            )}
                            {complaint.isDirectToDM && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase rounded border border-indigo-200">
                                Direct DM
                              </span>
                            )}
                            {complaint.isFlagged && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded border border-amber-200">
                                Auditing
                              </span>
                            )}
                            {complaint.status === 'Resolved' && (complaint.resolutionVotes?.unresolved.length || 0) >= 3 && (
                               <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[8px] font-black uppercase rounded border border-rose-200">
                                 Disputed Fix
                               </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5">by {typeof complaint.citizenId === 'object' ? complaint.citizenId.name : 'Citizen'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-xs font-bold",
                            isOverdue ? "text-rose-600" : "text-slate-600"
                          )}>
                            {complaint.slaDeadline ? formatDate(complaint.slaDeadline) : 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">SLA Target</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <Users size={10} />
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{complaint.assignedTo || 'Pending'}</span>
                          </div>
                          {user?.role === 'sachiv' && complaint.status === 'Submitted' && (
                            <button 
                              onClick={() => updateStatus(complaint._id, { assignedTo: 'Field Worker 1', status: 'Assigned' })}
                              className="text-[9px] text-indigo-600 font-bold hover:underline text-left uppercase"
                            >
                              Assign Now
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm inline-block",
                          complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' :
                          complaint.status === 'Assigned' ? 'bg-blue-50 text-blue-600' : 
                          'bg-amber-50 text-amber-600'
                        )}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 text-xs font-bold">
                          {user?.role === 'sachiv' && (
                            <>
                              {complaint.status === 'Assigned' && (
                                <button 
                                  onClick={() => updateStatus(complaint._id, { status: 'In Progress' })}
                                  className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                                >
                                  Start
                                </button>
                              )}
                              {(complaint.status === 'In Progress' || complaint.status === 'Assigned') && (
                                <button 
                                  onClick={() => updateStatus(complaint._id, { status: 'Resolved' })}
                                  className="text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded"
                                >
                                  Resolve
                                </button>
                              )}
                            </>
                          )}
                          {user?.role === 'dm' && (
                            <button 
                              onClick={() => updateStatus(complaint._id, { isFlagged: !complaint.isFlagged })}
                              className={cn(
                                "px-2 py-1 rounded transition-colors",
                                complaint.isFlagged ? "bg-amber-100 text-amber-700" : "text-amber-600 hover:bg-amber-50"
                              )}
                            >
                              {complaint.isFlagged ? 'Unflag' : 'Flag'}
                            </button>
                          )}
                          <button 
                            className="text-slate-400 hover:text-slate-600 px-2 py-1"
                            onClick={() => {/* View Details logic already existing via props or state in App */}}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                      Zero pending issues in local administration dashboard.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              Response Quality
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Citizen Satisfaction', value: 88, color: 'bg-emerald-500' },
                { label: 'Overdue Compliance', value: 94, color: 'bg-indigo-500' },
                { label: 'Audit Readiness', value: 72, color: 'bg-amber-500' }
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-900">{item.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1.5, delay: i * 0.2 }}
                      className={cn("h-full", item.color)} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Audit Alert</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">3 Departments flagged for delays</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-lg font-bold mb-2">DM Directives</h3>
            <p className="text-indigo-100/60 text-xs leading-relaxed mb-6 font-medium">
              Priority should be given to Water and Electricity grievances during the summer peak. Auto-escalation is active for delays over 10 days.
            </p>
            <button className="w-full py-3 bg-white text-indigo-900 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors shadow-lg">
              Post Administrative Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Management;
