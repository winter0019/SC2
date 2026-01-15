
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, 
  Award, 
  Phone, 
  Milestone,
  CheckCircle2,
  Camera,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  Save,
  RefreshCw,
  Lock,
  User,
  Calendar,
  Users,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Menu
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import Countdown from './components/Countdown';
import TributeGenerator from './components/TributeGenerator';
import ImageGallery from './components/ImageGallery';
import { COMMITTEE } from './constants';
import { Tribute } from './types';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'error'>('online');
  
  const [profilePic, setProfilePic] = useState('https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState({
    heroQuote: 'Service to humanity is the rent we pay for our room here on earth. Leadership is the legacy we leave behind.',
    retirementDate: '2026-04-30',
  });

  const [tributes, setTributes] = useState<Tribute[]>([]);

  // Function to retry authentication
  const retryConnection = useCallback(async () => {
    setConnectionStatus('online');
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (err) {
      console.error("Manual Auth Retry Fail:", err);
      setConnectionStatus('error');
    }
  }, []);

  // Auth Initialization
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
      if (user && !user.isAnonymous) {
        setIsAdmin(true);
      } else if (!user) {
        signInAnonymously(auth).catch(err => {
          console.error("Auth Init Fail:", err);
          setConnectionStatus('error');
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Firestore Sync
  useEffect(() => {
    const q = query(collection(db, 'achievements'), orderBy('timestamp', 'desc'));
    const unsubscribeTributes = onSnapshot(q, (snapshot) => {
      setTributes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tribute[]);
      setConnectionStatus('online');
    }, (err) => {
      console.error("Sync Error:", err);
      if (err.code === 'permission-denied') setConnectionStatus('error');
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'config', 'site_settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig(prev => ({ ...prev, ...data }));
        if (data.profilePic) setProfilePic(data.profilePic);
      }
    });

    return () => {
      unsubscribeTributes();
      unsubscribeConfig();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSyncing(true);
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setIsAdmin(true);
      setIsLoginModalOpen(false);
    } catch (err: any) {
      console.error("Login Failed:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setLoginError('Security clearance required. Incorrect credentials.');
      } else {
        setLoginError('Cloud connection error. Try again later.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
  };

  const deleteTribute = async (id: string) => {
    if (confirm("Permanently remove this tribute?")) {
      try {
        await deleteDoc(doc(db, 'achievements', id));
      } catch (err) {
        alert("Permission denied. Ensure you are signed into a verified admin session.");
      }
    }
  };

  const handleProfilePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsSyncing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          await setDoc(doc(db, 'config', 'site_settings'), { profilePic: base64 }, { merge: true });
          setProfilePic(base64);
        } catch (err) {
          alert("Unauthorized access. Please login as Admin.");
        } finally {
          setIsSyncing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      await setDoc(doc(db, 'config', 'site_settings'), config, { merge: true });
      setIsRegistryOpen(false);
    } catch (err) {
      alert("Permission Error: Failed to commit changes to cloud.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#fafaf9] text-[#0c2d1c] selection:bg-amber-100 selection:text-amber-900 ${isAdmin ? 'pt-14' : ''}`}>
      {/* Admin Command Bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#012616] text-white z-[1000] flex items-center justify-between px-4 md:px-6 border-b border-white/10 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] uppercase">Control Active</span>
            </div>
            <button onClick={() => setIsRegistryOpen(true)} className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-bold uppercase tracking-widest hover:text-amber-400 transition-colors">
              <Settings size={12} className="md:w-3.5 md:h-3.5" /> <span className="hidden xs:inline">Config</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-bold uppercase tracking-widest hover:text-amber-400 transition-colors">
              <Camera size={12} className="md:w-3.5 md:h-3.5" /> <span className="hidden xs:inline">Portrait</span>
            </button>
          </div>
          <button onClick={handleLogout} className="text-[8px] md:text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1 md:gap-2 hover:text-red-300">
            <LogOut size={12} className="md:w-3.5 md:h-3.5" /> <span className="hidden xs:inline">Log Out</span>
          </button>
        </div>
      )}

      {/* Cloud Status Indicator */}
      {connectionStatus === 'error' && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[3000] flex flex-col items-end gap-2">
          <button 
            onClick={retryConnection}
            className="flex items-center gap-3 bg-red-600 text-white px-5 py-3 md:px-6 md:py-3 rounded-full shadow-2xl group transition-all hover:bg-red-700"
          >
            <AlertTriangle size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Retry Connection</span>
          </button>
          <p className="text-[7px] text-red-600/60 font-black uppercase pr-4">Auth/Network Request Failed</p>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-[#012616] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1517245318773-27276537b08d?auto=format&fit=crop&q=80&w=2000" alt="Ceremonial" className="w-full h-full object-cover opacity-10 mix-blend-overlay scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#012616]/60 via-transparent to-[#012616]"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 md:px-6 max-w-6xl animate-in fade-in slide-in-from-bottom-12 duration-1000 py-16">
          <div className="inline-flex items-center gap-2 md:gap-4 px-5 md:px-6 py-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full text-amber-400 text-[8px] md:text-[9px] font-black tracking-[0.3em] uppercase mb-6 md:mb-10 shadow-2xl">
            <Award size={12} className="md:w-3 md:h-3" /> Meritorious Service Archive
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            Alhaji <br/> <span className="text-amber-500 font-serif italic font-normal text-2xl sm:text-3xl md:text-4xl">Ibrahim Saidu</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-emerald-50/70 mb-10 md:mb-12 font-serif italic max-w-xl mx-auto leading-relaxed font-light px-4">
            "{config.heroQuote}"
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-5">
            <a href="#tribute" className="w-full sm:w-auto bg-amber-500 text-black px-8 md:px-10 py-3 md:py-3.5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-amber-400 transition-all hover:-translate-y-1 active:scale-95 text-[9px] md:text-[10px] text-center">
              Leave a Tribute
            </a>
            <a href="#biography" className="w-full sm:w-auto text-white px-8 md:px-10 py-3 md:py-3.5 rounded-full font-black uppercase tracking-widest border border-white/20 hover:bg-white/10 transition-all text-[9px] md:text-[10px] backdrop-blur-md text-center">
              Career History
            </a>
          </div>
        </div>
      </section>

      {/* Countdown Bar */}
      <section className="relative z-20 -mt-10 md:-mt-16 px-4 md:px-12">
        <div className="max-w-3xl mx-auto bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-[0_30px_60px_-15px_rgba(1,38,22,0.15)] border border-gray-100 flex flex-col items-center">
           <div className="w-10 md:w-12 h-1 bg-amber-500 rounded-full mb-4 md:mb-6"></div>
           <p className="text-[8px] md:text-[9px] font-black text-amber-600 uppercase tracking-[0.4em] mb-2 md:mb-4 text-center">Milestone: 30th April, 2026</p>
           <h2 className="text-lg md:text-2xl font-black text-[#012616] mb-4 md:mb-6 font-serif italic text-center text-balance px-2">Counting Down to a New Chapter</h2>
           <Countdown targetDate={config.retirementDate} />
        </div>
      </section>

      {/* Biography Section */}
      <section id="biography" className="py-12 md:py-20 px-4 md:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 md:gap-12 items-center">
          <div className="lg:col-span-9 space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-2">
               <div className="p-2.5 md:p-3 bg-emerald-50 rounded-xl text-[#012616]">
                 <Milestone size={18} />
               </div>
               <h2 className="text-2xl md:text-3xl font-black text-[#012616] font-serif italic tracking-tight leading-tight">
                 The 20th <br/>State Coordinator
               </h2>
             </div>
             <div className="space-y-4 text-xs md:text-sm text-gray-600 leading-relaxed font-medium max-w-2xl">
                <p>Alhaji Ibrahim Saidu stands as a paragon of administrative excellence. From his early days in 1998 to his current pivotal role, his career has been a masterclass in dedication.</p>
                <div className="grid sm:grid-cols-2 gap-4 md:gap-5 py-2">
                  <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <CheckCircle2 className="text-amber-500 mb-3" size={16} />
                    <h4 className="font-black text-[8px] text-[#012616] uppercase tracking-widest mb-1.5">Integrity First</h4>
                    <p className="text-[10px] text-gray-500">Known for his uncompromising stance on transparency and accountability in all scheme operations.</p>
                  </div>
                  <div className="p-4 md:p-6 bg-[#012616] text-white rounded-xl shadow-2xl relative overflow-hidden">
                    <Award className="text-amber-400 mb-3 relative z-10" size={16} />
                    <h4 className="font-black text-[8px] text-amber-400 uppercase tracking-widest mb-1.5 relative z-10">Legacy Builder</h4>
                    <p className="text-[10px] text-emerald-100/70 relative z-10">Transforming NYSC Katsina into a center of administrative discipline and staff motivation.</p>
                  </div>
                </div>
             </div>
          </div>
          <div className="lg:col-span-3 relative flex justify-center lg:justify-end">
             <div className="max-w-[180px] sm:max-w-[220px] lg:max-w-full w-full relative aspect-[4/5] rounded-[1.25rem] md:rounded-[1.75rem] overflow-hidden border-4 md:border-6 border-white shadow-2xl">
                <img src={profilePic} alt="Portrait" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#012616]/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                   <p className="font-black text-xs md:text-sm text-white font-serif italic mb-0.5">Alh. Ibrahim Saidu</p>
                   <p className="text-[6px] text-amber-400 font-black uppercase tracking-[0.2em]">Distinguished State Coordinator</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Planning Committee Section */}
      <section className="py-12 md:py-20 bg-[#012616] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-black font-serif italic mb-2">The Planning Committee</h2>
            <p className="text-emerald-200/60 text-[10px] md:text-xs font-medium tracking-wide">Architects of this Grand Celebration</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {COMMITTEE.map((member, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 group hover:bg-white/10 transition-all flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-[#012616] mb-4">
                  <User size={14} />
                </div>
                <h4 className="text-sm md:text-base font-black font-serif italic mb-1 text-white">{member.name}</h4>
                <div className="space-y-1 mb-4 md:mb-5">
                  <p className="text-amber-400 text-[7px] font-black uppercase tracking-widest">{member.role}</p>
                  <p className="text-emerald-200/40 text-[6px] font-bold uppercase tracking-[0.2em]">{member.subtext}</p>
                </div>
                {member.phone && (
                  <div className="pt-4 border-t border-white/10 w-full mt-auto">
                    <a href={`tel:${member.phone}`} className="inline-flex items-center gap-2 text-white hover:text-amber-400 transition-colors">
                      <Phone size={8} className="opacity-70" />
                      <span className="text-[8px] font-bold tracking-widest">{member.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legacy Gallery */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-10">
            <p className="text-amber-600 font-black text-[7px] uppercase tracking-[0.4em] mb-2">Archived Memories</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#012616] font-serif italic tracking-tighter">A Visual Journey of Impact</h2>
          </div>
          <ImageGallery isAdmin={isAdmin} isAuthReady={isAuthReady} />
        </div>
      </section>

      {/* Tribute Wall */}
      <section id="tribute" className="py-12 md:py-20 bg-[#fafaf9] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-10 md:gap-12">
            <div className="lg:col-span-5">
               <div className="lg:sticky lg:top-32 text-center lg:text-left">
                  <h2 className="text-2xl md:text-3xl font-black text-[#012616] mb-3 font-serif italic leading-tight">Goodwill & <br/>Tributes</h2>
                  <p className="text-gray-500 text-[10px] md:text-xs mb-8">Share your message of appreciation for Alhaji Saidu's exemplary leadership.</p>
                  <TributeGenerator isAuthReady={isAuthReady} />
               </div>
            </div>
            <div className="lg:col-span-7 space-y-4 md:space-y-5">
               {tributes.length === 0 ? (
                 <div className="py-10 md:py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                    <Heart className="mx-auto mb-3 text-gray-200" size={20} />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[7px] md:text-[8px]">No tributes posted yet. Be the first!</p>
                 </div>
               ) : (
                 tributes.map((t) => (
                  <div key={t.id} className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {isAdmin && (
                      <button onClick={() => deleteTribute(t.id)} className="absolute top-4 right-4 p-1.5 text-red-200 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                    )}
                    <div className="mb-4">
                      <p className="font-black text-base md:text-lg text-[#012616] font-serif italic mb-0.5">{t.name}</p>
                      <p className="text-[6px] text-amber-700 font-black uppercase tracking-[0.2em]">{t.relationship}</p>
                    </div>
                    <p className="text-gray-600 italic leading-relaxed text-xs md:text-sm font-medium font-serif mb-4">"{t.message}"</p>
                    <div className="flex items-center gap-2 text-gray-300 border-t border-gray-50 pt-4">
                      <Calendar size={8} />
                      <span className="text-[6px] font-black uppercase tracking-[0.3em]">{t.date}</span>
                    </div>
                  </div>
                ))
               )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#012616] text-white py-10 md:py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center gap-6">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-lg text-[#012616]">NYSC</div>
             <div className="space-y-1">
                <h4 className="text-base md:text-lg font-black uppercase tracking-tighter">Alhaji Saidu Ibrahim</h4>
                <p className="text-[7px] md:text-[8px] text-emerald-100/40 font-medium">© 2024 Planning Committee. All rights reserved.</p>
             </div>
             {!isAdmin && (
               <button onClick={() => setIsLoginModalOpen(true)} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-emerald-500/50 hover:text-amber-400 text-[7px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-all">
                 <Lock size={9} /> Restricted Admin Access
               </button>
             )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isRegistryOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#012616]/98 backdrop-blur-2xl">
          <div className="bg-white rounded-[1.5rem] w-full max-w-lg shadow-2xl p-6 sm:p-10 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button onClick={() => setIsRegistryOpen(false)} className="absolute top-5 right-5 p-1.5 hover:bg-gray-100 rounded-full"><X size={18} /></button>
            <h3 className="text-xl sm:text-2xl font-black text-[#012616] font-serif italic mb-6 sm:mb-8">Site Registry</h3>
            <form onSubmit={saveConfig} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1.5">Retirement Date</label>
                  <input type="date" value={config.retirementDate} onChange={e => setConfig({...config, retirementDate: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-100 bg-slate-50 font-black outline-none text-[11px]" />
                </div>
                <div className="px-4 py-2.5 rounded-lg bg-green-50 text-green-700 font-black text-[7px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-green-100"><ShieldCheck size={10} /> Active Session</div>
              </div>
              <div>
                <label className="block text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1.5">Hero Quote</label>
                <textarea value={config.heroQuote} onChange={e => setConfig({...config, heroQuote: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-lg border border-slate-100 bg-slate-50 italic text-[11px] outline-none resize-none" />
              </div>
              <button type="submit" disabled={isSyncing} className="w-full py-3.5 bg-[#012616] text-white rounded-lg font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all text-[8px] flex items-center justify-center gap-2">
                {isSyncing ? <RefreshCw className="animate-spin" size={12} /> : <><Save size={12} /> Commit Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#012616]/98 backdrop-blur-3xl">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
            <div className="bg-[#012616] p-6 text-center">
              <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-white/30 hover:text-white"><X size={14} /></button>
              <Lock size={20} className="text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-black font-serif italic text-white mb-0.5">Admin Portal</h3>
              <p className="text-emerald-400 text-[6px] font-black uppercase tracking-[0.4em] opacity-80">Requires Cloud Auth</p>
            </div>
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {loginError && <p className="text-red-500 text-[7px] font-black uppercase tracking-widest text-center">{loginError}</p>}
              <div className="space-y-2.5">
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email ID" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-[11px]" />
                <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Secret Key" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-[11px]" />
              </div>
              <button type="submit" disabled={isSyncing} className="w-full bg-[#012616] text-white py-3.5 rounded-lg font-black uppercase tracking-[0.3em] text-[8px] shadow-2xl hover:bg-black transition-all">
                {isSyncing ? 'Authenticating...' : 'Establish Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfilePicChange} />
    </div>
  );
};

export default App;
