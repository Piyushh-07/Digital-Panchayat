import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Map as MapIcon, 
  Settings, 
  LogOut, 
  AlertTriangle,
  Users,
  Building2,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import NewComplaint from './pages/NewComplaint';
import ComplaintDetails from './pages/ComplaintDetails';
import MapView from './pages/MapView';
import Management from './pages/Management';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-stone-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  );

  if (!user) return <Login />;

  const renderContent = () => {
    if (selectedComplaintId) {
      return <ComplaintDetails id={selectedComplaintId} onBack={() => setSelectedComplaintId(null)} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard onSelectComplaint={setSelectedComplaintId} />;
      case 'new': return <NewComplaint onSuccess={() => setActiveTab('dashboard')} onCancel={() => setActiveTab('dashboard')} />;
      case 'map': return <MapView onSelectComplaint={setSelectedComplaintId} />;
      case 'management': return <Management />;
      default: return <Dashboard onSelectComplaint={setSelectedComplaintId} />;
    }
  };

  return (
    <div className="flex h-screen bg-stone-50 text-stone-900 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        setSelectedComplaintId(null);
      }} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-stone-200 bg-white flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Smart<span className="text-indigo-600">Governance</span>
            </h1>
            <div className="h-4 w-[1px] bg-slate-300 mx-2" />
            <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">
              {user.panchayat?.name || 'District Portal'}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            {user.role === 'citizen' && (
              <button 
                onClick={() => setActiveTab('new')}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                <PlusCircle size={18} />
                File Grievance
              </button>
            )}
            <button className="relative p-2 text-slate-500 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {user.role === 'dm' ? 'District Magistrate' : 
                   user.role === 'sachiv' ? `${user.panchayat?.name || 'Local'} Sachiv` : 
                   'Citizen'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedComplaintId || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
