import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Complaint, Panchayat } from '../types';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, MapPin, Navigation } from 'lucide-react';
import { cn } from '../utils';

import L from 'leaflet';
// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  onSelectComplaint: (id: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ onSelectComplaint }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error("Map fetch error:", err);
        setComplaints([]);
        setLoading(false);
      });
  }, []);

  const center = user?.panchayat?.boundary?.coordinates[0][0][0] || [77.2090, 28.6139]; // Default to Delhi if empty, but expected to be panchayat center
  // Note: Mongo uses [lng, lat], Leaflet uses [lat, lng]

  if (loading) return (
    <div className="h-[70vh] flex items-center justify-center bg-white rounded-[2.5rem] border border-stone-200">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-8 h-[80vh] flex flex-col">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-stone-800 tracking-tight uppercase">VILLAGE LIVE MAP</h2>
          <p className="text-stone-500 font-medium">Visualizing spatial distribution of active grievances.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-stone-700">{complaints.length} Total Points</span>
        </div>
      </header>

      <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-stone-200 shadow-xl z-0 relative">
        <MapContainer 
          center={[28.6139, 77.2090]} // Just a fallback
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {complaints.map(complaint => (
            <Marker 
              key={complaint._id} 
              position={[complaint.location.coordinates[1], complaint.location.coordinates[0]]}
            >
              <Popup className="rounded-2xl overflow-hidden p-0">
                <div className="p-4 min-w-[200px]">
                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {complaint.category}
                  </span>
                  <h4 className="font-bold text-stone-800 text-sm mb-1">{complaint.title}</h4>
                  <p className="text-stone-500 text-xs line-clamp-2 mb-3 leading-relaxed">
                    {complaint.description}
                  </p>
                  <button 
                    onClick={() => onSelectComplaint(complaint._id)}
                    className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-100"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-6 left-6 z-[1000] space-y-2">
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-stone-100 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-stone-400">Legend</h4>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-xs font-bold text-stone-700">Urgent Grievance</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-xs font-bold text-stone-700">Resolved Area</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
