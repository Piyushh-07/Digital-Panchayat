import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Camera, AlertCircle, Sparkles, Send, Map as MapIcon, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeComplaint } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const NewComplaint: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [spamWarning, setSpamWarning] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    isAnonymous: false,
    isDirectToDM: false,
    location: {
      address: '',
      coordinates: [77.2090, 28.6139] as [number, number] // [lng, lat] - Default Delhi
    },
    mediaUrls: [] as string[]
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(prev => ({
          ...prev,
          location: { ...prev.location, coordinates: [pos.coords.longitude, pos.coords.latitude] }
        }));
      });
    }
  }, []);

  const analyzeWithAI = async () => {
    if (formData.description.length < 20) return;
    setAiAnalyzing(true);
    setSpamWarning('');
    try {
      const result = await analyzeComplaint(`${formData.title}. ${formData.description}`);
      
      if (result.isSpam) {
        setSpamWarning(result.reason);
      } else {
        setFormData(prev => ({ 
          ...prev, 
          category: result.suggestedCategory,
          priority: result.suggestedPriority
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/complaints', formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={onCancel} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-4">
            <ArrowLeft size={18} />
            CANCEL SUBMISSION
          </button>
          <h2 className="text-3xl font-bold text-slate-900">File a New Grievance</h2>
          <p className="text-slate-500 font-medium">Your report triggers immediate administrative workflow.</p>
        </div>
        <div className="hidden md:block">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
            <Sparkles className="text-indigo-600 animate-pulse" />
            <div className="text-xs">
              <p className="font-bold text-indigo-900">AI-Powered System</p>
              <p className="text-indigo-700/70">Automatic categorization enabled</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Issue Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief title of the problem"
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-slate-50 transition-all font-semibold"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Issue Category</label>
                  <select
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-slate-50 appearance-none font-semibold text-slate-700"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {['Water', 'Electricity', 'Roads', 'Sanitation', 'Education', 'Health', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Describe the situation</label>
                  {aiAnalyzing && <span className="text-[10px] text-indigo-600 font-bold animate-pulse italic">AI is analyzing context...</span>}
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us what's happening. More details result in faster resolution."
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-slate-50 transition-all font-semibold resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  onBlur={analyzeWithAI}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} className="text-indigo-600" />
                      Pinpoint Accuracy
                    </label>
                  </div>
                  <div className="h-[250px] rounded-2xl overflow-hidden border border-slate-200 relative">
                    <MapContainer 
                      center={[formData.location.coordinates[1], formData.location.coordinates[0]] as [number, number]} 
                      zoom={14} 
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[formData.location.coordinates[1], formData.location.coordinates[0]] as [number, number]} />
                      <LocationPicker onLocationSelect={(lat, lng) => setFormData(p => ({...p, location: { ...p.location, coordinates: [lng, lat] }}))} />
                    </MapContainer>
                    <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur p-2 rounded-lg text-[10px] font-bold shadow-sm border border-slate-200">
                      Lat: {formData.location.coordinates[1].toFixed(4)}, Lng: {formData.location.coordinates[0].toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Manual Address (Optional)</label>
                    <input
                      type="text"
                      placeholder="Street, Landmark, Ward No."
                      className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-slate-50 font-semibold"
                      value={formData.location.address}
                      onChange={(e) => setFormData({...formData, location: { ...formData.location, address: e.target.value }})}
                    />
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 group cursor-pointer hover:border-indigo-400 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <Camera size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Attach Proof</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Accepted: JPG, PNG, MP4</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Submission Preferences</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 accent-indigo-600 rounded"
                          checked={formData.isAnonymous}
                          onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800">Post Anonymously</p>
                          <p className="text-[10px] text-slate-400 font-medium">Identity hidden from other citizens</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl cursor-pointer hover:bg-indigo-100 transition-colors">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 accent-indigo-600 rounded"
                          checked={formData.isDirectToDM}
                          onChange={(e) => setFormData({...formData, isDirectToDM: e.target.checked})}
                        />
                        <div>
                          <p className="text-sm font-bold text-indigo-900">Direct DM Report</p>
                          <p className="text-[10px] text-indigo-700/60 font-medium italic">Bypasses local queue - For urgent village issues</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Priority (Self-Assessment)</label>
                    <div className="flex gap-2">
                      {['Low', 'Medium', 'High'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({...formData, priority: p as any})}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-xs font-bold border transition-all",
                            formData.priority === p 
                              ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
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

              <AnimatePresence>
                {spamWarning && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Precision Alert: Potential System Rejection</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed font-medium">{spamWarning}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-3 max-w-md">
                <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  By submitting, you agree to provide truthful information. Providing false grievances may lead to account suspension as per Nagar Panchayat digital guidelines.
                </p>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : (
                  <>
                    <Send size={18} />
                    SUBMIT FORM
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewComplaint;
