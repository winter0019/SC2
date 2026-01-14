
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
        
        <div className="relative z-10 text-center px-4 md:px-6 max-w-6xl animate-in fade-in slide-in-from-bottom-12 duration-1000 py-20">
          <div className="inline-flex items-center gap-2 md:gap-4 px-6 md:px-8 py-2 md:py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full text-amber-400 text-[8px] md:text-[10px] font-black tracking-[0.3em] md:tracking-[0.5em] uppercase mb-8 md:mb-12 shadow-2xl">
            <Award size={14} className="md:w-4 md:h-4" /> Meritorious Service Archive
          </div>
          <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-[10rem] font-black text-white mb-6 md:mb-10 leading-[0.9] md:leading-[0.8] tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            Alhaji <br/> <span className="text-amber-500 font-serif italic font-normal text-4xl xs:text-5xl sm:text-7xl md:text-[8rem]">Ibrahim Saidu</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-3xl text-emerald-50/70 mb-10 md:mb-16 font-serif italic max-w-3xl mx-auto leading-relaxed font-light px-4">
            "{config.heroQuote}"
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <a href="#tribute" className="w-full sm:w-auto bg-amber-500 text-black px-10 md:px-14 py-5 md:py-7 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-amber-400 transition-all hover:-translate-y-1 active:scale-95 text-[10px] md:text-[11px] text-center">
              Leave a Tribute
            </a>
            <a href="#biography" className="w-full sm:w-auto text-white px-10 md:px-14 py-5 md:py-7 rounded-full font-black uppercase tracking-widest border border-white/20 hover:bg-white/10 transition-all text-[10px] md:text-[11px] backdrop-blur-md text-center">
              Career History
            </a>
          </div>
        </div>
      </section>

      {/* Countdown Bar */}
      <section className="relative z-20 -mt-16 md:-mt-32 px-4 md:px-12">
        <div className="max-w-6xl mx-auto bg-white rounded-[3rem] md:rounded-[5rem] p-8 md:p-16 shadow-[0_30px_60px_-15px_rgba(1,38,22,0.15)] border border-gray-100 flex flex-col items-center">
           <div className="w-12 md:w-16 h-1 md:h-1.5 bg-amber-500 rounded-full mb-8 md:mb-12"></div>
           <p className="text-[9px] md:text-[11px] font-black text-amber-600 uppercase tracking-[0.4em] md:tracking-[0.6em] mb-4 md:mb-6 text-center">Milestone: 30th April, 2026</p>
           <h2 className="text-2xl md:text-5xl font-black text-[#012616] mb-8 md:mb-12 font-serif italic text-center text-balance px-2">Counting Down to a New Chapter</h2>
           <Countdown targetDate={config.retirementDate} />
        </div>
      </section>

      {/* Biography Section */}
      <section id="biography" className="py-20 md:py-40 px-4 md:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 md:gap-24 items-center">
          <div className="lg:col-span-7 space-y-8 md:space-y-12">
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 mb-4 md:mb-8">
               <div className="p-4 md:p-5 bg-emerald-50 rounded-[1.5rem] md:rounded-[2rem] text-[#012616]">
                 <Milestone size={24} className="md:w-8 md:h-8" />
               </div>
               <h2 className="text-4xl md:text-7xl font-black text-[#012616] font-serif italic tracking-tight leading-tight">
                 The 20th <br/>State Coordinator
               </h2>
             </div>
             <div className="space-y-8 md:space-y-10 text-lg md:text-xl text-gray-600 leading-relaxed font-medium max-w-2xl">
                <p>Alhaji Ibrahim Saidu stands as a paragon of administrative excellence. From his early days in 1998 to his current pivotal role, his career has been a masterclass in dedication.</p>
                <div className="grid sm:grid-cols-2 gap-6 md:gap-8 py-4">
                  <div className="p-8 md:p-10 bg-white border border-gray-100 rounded-[2rem] md:rounded-[3rem] shadow-sm">
                    <CheckCircle2 className="text-amber-500 mb-4 md:mb-6 md:w-8 md:h-8" size={24} />
                    <h4 className="font-black text-[10px] md:text-xs text-[#012616] uppercase tracking-widest mb-3 md:mb-4">Integrity First</h4>
                    <p className="text-xs md:text-sm text-gray-500">Known for his uncompromising stance on transparency and accountability in all scheme operations.</p>
                  </div>
                  <div className="p-8 md:p-10 bg-[#012616] text-white rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <Award className="text-amber-400 mb-4 md:mb-6 relative z-10 md:w-8 md:h-8" size={24} />
                    <h4 className="font-black text-[10px] md:text-xs text-amber-400 uppercase tracking-widest mb-3 md:mb-4 relative z-10">Legacy Builder</h4>
                    <p className="text-xs md:text-sm text-emerald-100/70 relative z-10">Transforming NYSC Katsina into a center of administrative discipline and staff motivation.</p>
                  </div>
                </div>
             </div>
          </div>
          <div className="lg:col-span-5 relative">
             <div className="relative aspect-[4/5] rounded-[3rem] md:rounded-[4.5rem] overflow-hidden border-[10px] md:border-[20px] border-white shadow-2xl">
                <img src={profilePic} alt="Portrait" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#012616]/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 md:bottom-12 left-6 md:left-10 right-6 md:right-10">
                   <p className="font-black text-xl md:text-2xl text-white font-serif italic mb-1">Alh. Ibrahim Saidu</p>
                   <p className="text-[8px] md:text-[10px] text-amber-400 font-black uppercase tracking-[0.2em] md:tracking-[0.4em]">Distinguished State Coordinator</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Planning Committee Section */}
      <section className="py-20 md:py-40 bg-[#012616] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 md:mb-32">
            <h2 className="text-4xl md:text-7xl font-black font-serif italic mb-4 md:mb-6">The Planning Committee</h2>
            <p className="text-emerald-200/60 text-base md:text-lg font-medium tracking-wide">Architects of this Grand Celebration</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {COMMITTEE.map((member, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 group hover:bg-white/10 transition-all flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center text-[#012616] mb-6 md:mb-10">
                  <User size={20} className="md:w-6 md:h-6" />
                </div>
                <h4 className="text-xl md:text-2xl font-black font-serif italic mb-3 md:mb-4 text-white">{member.name}</h4>
                <div className="space-y-1 mb-6 md:mb-8">
                  <p className="text-amber-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest">{member.role}</p>
                  <p className="text-emerald-200/40 text-[7px] md:text-[9px] font-bold uppercase tracking-[0.2em]">{member.subtext}</p>
                </div>
                {member.phone && (
                  <div className="pt-6 md:pt-8 border-t border-white/10 w-full mt-auto">
                    <a href={`tel:${member.phone}`} className="inline-flex items-center gap-3 md:gap-4 text-white hover:text-amber-400 transition-colors">
                      <Phone size={12} className="opacity-70" />
                      <span className="text-[10px] md:text-xs font-bold tracking-widest">{member.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legacy Gallery */}
      <section className="py-20 md:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-24">
            <p className="text-amber-600 font-black text-[9px] md:text-[11px] uppercase tracking-[0.4em] md:tracking-[0.6em] mb-4 md:mb-6">Archived Memories</p>
            <h2 className="text-4xl md:text-7xl font-black text-[#012616] font-serif italic tracking-tighter">A Visual Journey of Impact</h2>
          </div>
          <ImageGallery isAdmin={isAdmin} isAuthReady={isAuthReady} />
        </div>
      </section>

      {/* Tribute Wall */}
      <section id="tribute" className="py-20 md:py-40 bg-[#fafaf9] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-16 md:gap-24">
            <div className="lg:col-span-5">
               <div className="lg:sticky lg:top-32 text-center lg:text-left">
                  <h2 className="text-4xl md:text-7xl font-black text-[#012616] mb-6 md:mb-10 font-serif italic leading-tight">Goodwill & <br/>Tributes</h2>
                  <p className="text-gray-500 text-base md:text-lg mb-10 md:mb-16">Share your message of appreciation for Alhaji Saidu's exemplary leadership.</p>
                  <TributeGenerator isAuthReady={isAuthReady} />
               </div>
            </div>
            <div className="lg:col-span-7 space-y-6 md:space-y-10">
               {tributes.length === 0 ? (
                 <div className="py-16 md:py-20 text-center border-2 border-dashed border-gray-200 rounded-[2.5rem] md:rounded-[4rem]">
                    <Heart className="mx-auto mb-4 md:mb-6 text-gray-200 md:w-12 md:h-12" size={32} />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[9px] md:text-xs">No tributes posted yet. Be the first!</p>
                 </div>
               ) : (
                 tributes.map((t) => (
                  <div key={t.id} className="bg-white p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {isAdmin && (
                      <button onClick={() => deleteTribute(t.id)} className="absolute top-6 right-6 md:top-10 md:right-10 p-3 md:p-4 text-red-200 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} className="md:w-5 md:h-5" /></button>
                    )}
                    <div className="mb-8 md:mb-12">
                      <p className="font-black text-2xl md:text-3xl text-[#012616] font-serif italic mb-1 md:mb-2">{t.name}</p>
                      <p className="text-[8px] md:text-[10px] text-amber-700 font-black uppercase tracking-[0.2em]">{t.relationship}</p>
                    </div>
                    <p className="text-gray-600 italic leading-relaxed text-lg md:text-xl font-medium font-serif mb-8 md:mb-12">"{t.message}"</p>
                    <div className="flex items-center gap-3 md:gap-4 text-gray-300 border-t border-gray-50 pt-6 md:pt-8">
                      <Calendar size={12} className="md:w-3.5 md:h-3.5" />
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">{t.date}</span>
                    </div>
                  </div>
                ))
               )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#012616] text-white py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center gap-8 md:gap-12">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center font-black text-2xl md:text-3xl text-[#012616]">NYSC</div>
             <div className="space-y-3 md:space-y-4">
                <h4 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Alhaji Saidu Ibrahim</h4>
                <p className="text-[10px] md:text-xs text-emerald-100/40 font-medium">© 2024 Planning Committee. All rights reserved.</p>
             </div>
             {!isAdmin && (
               <button onClick={() => setIsLoginModalOpen(true)} className="px-8 md:px-12 py-4 md:py-6 bg-white/5 border border-white/10 rounded-full text-emerald-500/50 hover:text-amber-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] flex items-center gap-3 md:gap-4 transition-all">
                 <Lock size={14} className="md:w-4 md:h-4" /> Restricted Admin Access
               </button>
             )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isRegistryOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 bg-[#012616]/98 backdrop-blur-2xl">
          <div className="bg-white rounded-[2.5rem] sm:rounded-[5rem] w-full max-w-2xl shadow-2xl p-8 sm:p-20 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button onClick={() => setIsRegistryOpen(false)} className="absolute top-6 right-6 sm:top-12 sm:right-12 p-3 sm:p-5 hover:bg-gray-100 rounded-full"><X size={24} className="sm:w-8 sm:h-8" /></button>
            <h3 className="text-3xl sm:text-5xl font-black text-[#012616] font-serif italic mb-8 sm:mb-12">Site Registry</h3>
            <form onSubmit={saveConfig} className="space-y-8 sm:space-y-12">
              <div className="grid md:grid-cols-2 gap-6 sm:gap-10">
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 sm:mb-4">Retirement Date</label>
                  <input type="date" value={config.retirementDate} onChange={e => setConfig({...config, retirementDate: e.target.value})} className="w-full px-6 sm:px-10 py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 bg-slate-50 font-black outline-none text-sm" />
                </div>
                <div className="px-6 sm:px-10 py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] bg-green-50 text-green-700 font-black text-[9px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center justify-center gap-2 sm:gap-3 border border-green-100"><ShieldCheck size={16} className="sm:w-5 sm:h-5" /> Active Session</div>
              </div>
              <div>
                <label className="block text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 sm:mb-4">Hero Quote</label>
                <textarea value={config.heroQuote} onChange={e => setConfig({...config, heroQuote: e.target.value})} rows={4} className="w-full px-6 sm:px-10 py-6 sm:py-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 bg-slate-50 italic text-lg sm:text-xl outline-none resize-none" />
              </div>
              <button type="submit" disabled={isSyncing} className="w-full py-6 sm:py-8 bg-[#012616] text-white rounded-[1.5rem] sm:rounded-[2.5rem] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-[10px] sm:text-[11px] flex items-center justify-center gap-3">
                {isSyncing ? <RefreshCw className="animate-spin" size={20} /> : <><Save size={20} className="sm:w-6 sm:h-6" /> Commit Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#012616]/98 backdrop-blur-3xl">
          <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] w-full max-w-md shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="bg-[#012616] p-10 sm:p-16 text-center">
              <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={20} /></button>
              <Lock size={32} className="text-amber-400 mx-auto mb-6 sm:mb-10 sm:w-10 sm:h-10" />
              <h3 className="text-3xl sm:text-4xl font-black font-serif italic text-white mb-2">Admin Portal</h3>
              <p className="text-emerald-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] opacity-80">Requires Cloud Auth</p>
            </div>
            <form onSubmit={handleLogin} className="p-8 sm:p-16 space-y-6 sm:space-y-8">
              {loginError && <p className="text-red-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center">{loginError}</p>}
              <div className="space-y-4 sm:space-y-6">
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email ID" className="w-full px-6 sm:px-8 py-4 sm:py-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] sm:rounded-3xl outline-none font-bold text-sm" />
                <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Secret Key" className="w-full px-6 sm:px-8 py-4 sm:py-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] sm:rounded-3xl outline-none font-bold text-sm" />
              </div>
              <button type="submit" disabled={isSyncing} className="w-full bg-[#012616] text-white py-6 sm:py-8 rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-[11px] shadow-2xl hover:bg-black transition-all">
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
