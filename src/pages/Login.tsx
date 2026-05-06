import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Panchayat } from '../types';
import { motion } from 'motion/react';
import { cn } from '../utils';
import { ShieldCheck, User as UserIcon, Mail, Lock, Building } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    panchayatId: '',
    role: 'citizen'
  });
  const [fetchError, setFetchError] = useState(false);

  const fetchPanchayats = () => {
    setFetchError(false);
    axios.get('/api/panchayats')
      .then(res => {
        if (typeof res.data === 'string' && res.data.includes('<!doctype html>')) {
          setTimeout(fetchPanchayats, 3000);
          return;
        }
        if (Array.isArray(res.data)) {
          setPanchayats(res.data);
          if (res.data.length === 0) setFetchError(true);
        } else {
          setFetchError(true);
        }
      })
      .catch(err => {
        console.error("Failed to fetch panchayats:", err);
        setFetchError(true);
      });
  };

  useEffect(() => {
    fetchPanchayats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!isLogin) {
      if (!formData.name) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      if (formData.role !== 'dm' && !formData.panchayatId) {
        setError('Please select your village/panchayat');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await axios.post(endpoint, formData);
      login(res.data.token, res.data.user);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-stone-50 font-sans">
      <div className="hidden lg:flex flex-col justify-center px-12 bg-emerald-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-700 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-6xl font-black tracking-tight leading-none italic">
            DIGITAL<br />PANCHAYAT.
          </h1>
          <p className="text-lg text-emerald-100 font-medium opacity-80 leading-relaxed">
            Empowering rural governance through direct citizen engagement, transparent grievance tracking, and AI-driven validation.
          </p>
          <div className="grid grid-cols-2 gap-8 pt-12 text-stone-200">
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm opacity-60 uppercase tracking-widest">Transparency</p>
            </div>
            <div>
              <p className="text-3xl font-bold">Real-time</p>
              <p className="text-sm opacity-60 uppercase tracking-widest">Resolution</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-stone-100"
        >
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-stone-800">
              {isLogin ? 'Welcome Back' : 'Join GramSwaraj'}
            </h2>
            <p className="text-stone-500 mt-2">
              {isLogin ? 'Sign in to access your local dashboard' : 'Register to start improving your community'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Aditya Verma"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none bg-stone-50"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none bg-stone-50"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none bg-stone-50"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {!isLogin && (
              <>
                {formData.role !== 'dm' && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-stone-700">Select Panchayat</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                      <select
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 focus:border-emerald-500 outline-none bg-stone-50 appearance-none text-stone-800 font-medium transition-all"
                        value={formData.panchayatId}
                        onChange={(e) => setFormData({...formData, panchayatId: e.target.value})}
                        required={formData.role !== 'dm'}
                      >
                        <option value="" className="text-stone-400 italic">--- Click to select your village ---</option>
                        {panchayats.length > 0 ? (
                          panchayats.map(p => (
                            <option key={p._id} value={p._id} className="text-stone-800 py-2">
                              {p.name} ({p.district})
                            </option>
                          ))
                        ) : fetchError ? (
                          <option disabled className="text-red-500 font-bold">⚠️ Connection unstable. Using fallback list...</option>
                        ) : (
                          <option disabled>Loading Village Census...</option>
                        )}
                      </select>
                      {fetchError && (
                        <button 
                          type="button"
                          onClick={() => fetchPanchayats()}
                          className="absolute -bottom-6 left-0 text-[10px] text-emerald-600 font-bold uppercase tracking-tighter hover:underline"
                        >
                          ↻ Tap to Retry Village Sync
                        </button>
                      )}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { id: 'citizen', label: 'Citizen' },
                    { id: 'sachiv', label: 'Sachiv' },
                    { id: 'dm', label: 'DM' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormData({...formData, role: r.id})}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border flex flex-col items-center justify-center gap-1",
                        formData.role === r.id 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                          : "border-stone-200 text-stone-400 hover:border-stone-300"
                      )}
                    >
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

            <button
              type="submit"
              disabled={loading || (!isLogin && formData.role !== 'dm' && !formData.panchayatId)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:bg-stone-300 mt-4 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                isLogin ? 'Sign In Now' : (formData.role !== 'dm' && !formData.panchayatId ? 'Select Village' : 'Create Account')
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-stone-500 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
