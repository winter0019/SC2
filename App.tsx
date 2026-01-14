
import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle
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

  // Auth Initialization
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
      // If user is authenticated and not anonymous, they are admin
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
      // Attempt real Firebase login to satisfy "isAdmin" security rules
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
          alert("Unauthorized access to Cloud Storage. Please login as Admin.");
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
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#012616] text-white z-[1000] flex items-center justify-between px-6 border-b border-white/10 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">Control Panel Active</span>
            </div>
            <button onClick={() => setIsRegistryOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-amber-400 transition-colors">
              <Settings size={14} /> Site Config
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-amber-400 transition-colors">
              <Camera size={14} /> Portrait
            </button>
          </div>
          <button onClick={handleLogout} className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2 hover:text-red-300">
            <LogOut size={14} /> Log Out
          </button>
        </div>
      )}

      {/* Cloud Status Indicator */}
      {connectionStatus === 'error' && (
        <div className="fixed bottom-10 right-10 z-[3000] flex items-center gap-3 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce">
          <AlertTriangle size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Permission Denied: Check Cloud Rules</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-[#012616] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1517245318773-27276537b08d?auto=format&fit=crop&q=80&w=2000" alt="Ceremonial" className="w-full h-full object-cover opacity-10 mix-blend-overlay scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#012616]/60 via-transparent to-[#012616]"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-6xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="inline-flex items-center gap-4 px-8 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full text-amber-400 text-[10px] font-black tracking-[0.5em] uppercase mb-12 shadow-2xl">
            <Award size={16} /> Meritorious Service Archive
          </div>
          <h1 className="text-6xl md:text-[10rem] font-black text-white mb-10 leading-[0.8] tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            Alhaji <br/> <span className="text-amber-500 font-serif italic font-normal text-6xl md:text-[8rem]">Ibrahim Saidu</span>
          </h1>
          <p className="text-xl md:text-3xl text-emerald-50/70 mb-16 font-serif italic max-w-3xl mx-auto leading-relaxed font-light px-4">
            "{config.heroQuote}"
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#tribute" className="w-full md:w-auto bg-amber-500 text-black px-14 py-7 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-amber-400 transition-all hover:-translate-y-2 active:scale-95 text-[11px]">
              Leave a Tribute
            </a>
            <a href="#biography" className="w-full md:w-auto text-white px-14 py-7 rounded-full font-black uppercase tracking-widest border border-white/20 hover:bg-white/10 transition-all text-[11px] backdrop-blur-md">
              Career History
            </a>
          </div>
        </div>
      </section>

      {/* Countdown Bar */}
      <section className="relative z-20 -mt-32 px-4 md:px-12">
        <div className="max-w-6xl mx-auto bg-white rounded-[5rem] p-16 shadow-[0_50px_100px_-20px_rgba(1,38,22,0.15)] border border-gray-100 flex flex-col items-center">
           <div className="w-16 h-1.5 bg-amber-500 rounded-full mb-12"></div>
           <p className="text-[11px] font-black text-amber-600 uppercase tracking-[0.6em] mb-6">Milestone: 30th April, 2026</p>
           <h2 className="text-4xl md:text-5xl font-black text-[#012616] mb-12 font-serif italic text-center text-balance">Counting Down to a New Chapter</h2>
           <Countdown targetDate={config.retirementDate} />
        </div>
      </section>

      {/* Biography Section */}
      <section id="biography" className="py-40 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-24 items-center">
          <div className="lg:col-span-7 space-y-12">
             <div className="flex items-center gap-6 mb-8">
               <div className="p-5 bg-emerald-50 rounded-[2rem] text-[#012616]">
                 <Milestone size={32} />
               </div>
               <h2 className="text-5xl md:text-7xl font-black text-[#012616] font-serif italic tracking-tight leading-tight">
                 The 20th <br/>State Coordinator
               </h2>
             </div>
             <div className="space-y-10 text-xl text-gray-600 leading-relaxed font-medium max-w-2xl">
                <p>Alhaji Ibrahim Saidu stands as a paragon of administrative excellence. From his early days in 1998 to his current pivotal role, his career has been a masterclass in dedication.</p>
                <div className="grid md:grid-cols-2 gap-8 py-4">
                  <div className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-sm">
                    <CheckCircle2 className="text-amber-500 mb-6" size={32} />
                    <h4 className="font-black text-xs text-[#012616] uppercase tracking-widest mb-4">Integrity</h4>
                    <p className="text-sm text-gray-500">Known for his uncompromising stance on transparency and accountability in all scheme operations.</p>
                  </div>
                  <div className="p-10 bg-[#012616] text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <Award className="text-amber-400 mb-6 relative z-10" size={32} />
                    <h4 className="font-black text-xs text-amber-400 uppercase tracking-widest mb-4 relative z-10">Legacy</h4>
                    <p className="text-sm text-emerald-100/70 relative z-10">Transforming NYSC Katsina into a center of administrative discipline and staff motivation.</p>
                  </div>
                </div>
             </div>
          </div>
          <div className="lg:col-span-5 relative">
             <div className="relative aspect-[4/5] rounded-[4.5rem] overflow-hidden border-[20px] border-white shadow-2xl">
                <img src={profilePic} alt="Portrait" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#012616]/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-12 left-10 right-10">
                   <p className="font-black text-2xl text-white font-serif italic mb-1">Alh. Ibrahim Saidu</p>
                   <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.4em]">Distinguished State Coordinator</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Planning Committee Section */}
      <section className="py-40 bg-[#012616] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-32">
            <h2 className="text-5xl md:text-7xl font-black font-serif italic mb-6">The Planning Committee</h2>
            <p className="text-emerald-200/60 text-lg font-medium tracking-wide">Architects of this Grand Celebration</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {COMMITTEE.map((member, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-[3.5rem] p-12 group hover:bg-white/10 transition-all">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-[#012616] mb-10">
                  <User size={24} />
                </div>
                <h4 className="text-2xl font-black font-serif italic mb-4 text-white">{member.name}</h4>
                <div className="space-y-1 mb-8">
                  <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">{member.role}</p>
                  <p className="text-emerald-200/40 text-[9px] font-bold uppercase tracking-[0.2em]">{member.subtext}</p>
                </div>
                {member.phone && (
                  <div className="pt-8 border-t border-white/10">
                    <a href={`tel:${member.phone}`} className="inline-flex items-center gap-4 text-white hover:text-amber-400 transition-colors">
                      <Phone size={14} className="opacity-70" />
                      <span className="text-xs font-bold tracking-widest">{member.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legacy Gallery */}
      <section className="py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <p className="text-amber-600 font-black text-[11px] uppercase tracking-[0.6em] mb-6">Archived Memories</p>
            <h2 className="text-5xl md:text-7xl font-black text-[#012616] font-serif italic tracking-tighter">A Visual Journey of Impact</h2>
          </div>
          <ImageGallery isAdmin={isAdmin} isAuthReady={isAuthReady} />
        </div>
      </section>

      {/* Tribute Wall */}
      <section id="tribute" className="py-40 bg-[#fafaf9] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-24">
            <div className="lg:col-span-5">
               <div className="sticky top-32">
                  <h2 className="text-5xl md:text-7xl font-black text-[#012616] mb-10 font-serif italic leading-tight">Goodwill & <br/>Tributes</h2>
                  <p className="text-gray-500 text-lg mb-16">Share your message of appreciation for Alhaji Saidu's exemplary leadership.</p>
                  <TributeGenerator isAuthReady={isAuthReady} />
               </div>
            </div>
            <div className="lg:col-span-7 space-y-10">
               {tributes.length === 0 ? (
                 <div className="p-20 text-center border-2 border-dashed border-gray-200 rounded-[4rem]">
                    <Heart className="mx-auto mb-6 text-gray-200" size={48} />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No tributes posted yet. Be the first!</p>
                 </div>
               ) : (
                 tributes.map((t) => (
                  <div key={t.id} className="bg-white p-14 rounded-[4rem] shadow-sm border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {isAdmin && (
                      <button onClick={() => deleteTribute(t.id)} className="absolute top-10 right-10 p-4 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20} /></button>
                    )}
                    <div className="mb-12">
                      <p className="font-black text-3xl text-[#012616] font-serif italic mb-2">{t.name}</p>
                      <p className="text-[10px] text-amber-700 font-black uppercase tracking-[0.2em]">{t.relationship}</p>
                    </div>
                    <p className="text-gray-600 italic leading-relaxed text-xl font-medium font-serif mb-12">"{t.message}"</p>
                    <div className="flex items-center gap-4 text-gray-300 border-t border-gray-50 pt-8">
                      <Calendar size={14} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t.date}</span>
                    </div>
                  </div>
                ))
               )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#012616] text-white py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center gap-12">
             <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center font-black text-3xl text-[#012616]">NYSC</div>
             <div className="space-y-4">
                <h4 className="text-3xl font-black uppercase tracking-tighter">Alhaji Saidu Ibrahim</h4>
                <p className="text-xs text-emerald-100/40 font-medium">© 2024 Planning Committee. All rights reserved.</p>
             </div>
             {!isAdmin && (
               <button onClick={() => setIsLoginModalOpen(true)} className="px-12 py-6 bg-white/5 border border-white/10 rounded-full text-emerald-500/50 hover:text-amber-400 text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-4 transition-all">
                 <Lock size={16} /> Restricted Admin Access
               </button>
             )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isRegistryOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#012616]/98 backdrop-blur-2xl">
          <div className="bg-white rounded-[5rem] w-full max-w-2xl shadow-2xl p-20 relative">
            <button onClick={() => setIsRegistryOpen(false)} className="absolute top-12 right-12 p-5 hover:bg-gray-100 rounded-full"><X size={32} /></button>
            <h3 className="text-5xl font-black text-[#012616] font-serif italic mb-12">Site Registry</h3>
            <form onSubmit={saveConfig} className="space-y-12">
              <div className="grid md:grid-cols-2 gap-10">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Retirement Date</label>
                  <input type="date" value={config.retirementDate} onChange={e => setConfig({...config, retirementDate: e.target.value})} className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 bg-slate-50 font-black outline-none" />
                </div>
                <div className="px-10 py-6 rounded-[2rem] bg-green-50 text-green-700 font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-green-100"><ShieldCheck size={20} /> Active Session</div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Hero Quote</label>
                <textarea value={config.heroQuote} onChange={e => setConfig({...config, heroQuote: e.target.value})} rows={4} className="w-full px-10 py-8 rounded-[3rem] border border-slate-100 bg-slate-50 italic text-xl outline-none resize-none" />
              </div>
              <button type="submit" disabled={isSyncing} className="w-full py-8 bg-[#012616] text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-[11px]">
                {isSyncing ? <RefreshCw className="animate-spin" /> : <><Save size={24} /> Commit Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#012616]/98 backdrop-blur-3xl">
          <div className="bg-white rounded-[4rem] w-full max-w-md shadow-2xl overflow-hidden relative">
            <div className="bg-[#012616] p-16 text-center">
              <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-10 right-10 text-white/30 hover:text-white"><X size={24} /></button>
              <Lock size={40} className="text-amber-400 mx-auto mb-10" />
              <h3 className="text-4xl font-black font-serif italic text-white mb-2">Admin Portal</h3>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.6em] opacity-80">Requires Cloud Auth</p>
            </div>
            <form onSubmit={handleLogin} className="p-16 space-y-8">
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{loginError}</p>}
              <div className="space-y-6">
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email ID" className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold" />
                <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Secret Key" className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold" />
              </div>
              <button type="submit" disabled={isSyncing} className="w-full bg-[#012616] text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:bg-black transition-all">
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
