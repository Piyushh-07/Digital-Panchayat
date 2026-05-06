import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Map as MapIcon, 
  Settings, 
  LogOut,
  Users,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../utils';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'History & Updates', icon: LayoutDashboard },
    ...(user?.role === 'citizen' ? [{ id: 'new', label: 'File Grievance', icon: PlusCircle }] : []),
    { id: 'map', label: 'District Insight', icon: MapIcon },
  ];

  if (user?.role === 'dm' || user?.role === 'sachiv') {
    menuItems.push({ 
      id: 'management', 
      label: user.role === 'dm' ? 'District Oversight' : 'Panchayat Control', 
      icon: ShieldCheck 
    });
  }

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shadow-sm">
      <div className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === item.id 
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100" 
                  : "text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm"
              )}
            >
              <Icon size={20} />
              <span className="text-sm">{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1 h-4 bg-white/40 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-stone-100 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors">
          <Settings size={20} />
          <span className="text-sm">Account Settings</span>
        </button>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
