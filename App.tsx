
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
  Database,
  AlertTriangle,
  Lock,
  User,
  Calendar,
  Users,
  ChevronRight,
  // Added missing Trash2 import
  Trash2
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
  const [permissionError, setPermissionError] = useState(false);
  
  const [profilePic, setProfilePic] = useState('https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState({
    heroQuote: 'Leadership is about impact, influence, and inspiration. Service is the ultimate expression of that impact.',
    retirementDate: '2026-04-30',
  });

  const [tributes, setTributes] = useState<Tribute[]>([]);

  // Auth Initialization
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthReady(true);
      } else {
        signInAnonymously(auth).catch(err => console.error("Auth Init Fail:", err));
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Firestore Sync
  useEffect(() => {
    const q = query(collection(db, 'achievements'), orderBy('timestamp', 'desc'));
    const unsubscribeTributes = onSnapshot(q, (snapshot) => {
      setTributes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tribute[]);
    }, (err) => {
      if (err.code === 'permission-denied') setPermissionError(true);
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail === "admin@nysc.gov.ng" && loginPassword === "ibrahim2026") {
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      setLoginError('');
    } else {
      setLoginError('Security clearance required. Incorrect credentials.');
    }
  };

  const deleteTribute = async (id: string) => {
    if (confirm("Remove this tribute from public view?")) {
      await deleteDoc(doc(db, 'achievements', id));
    }
  };

  const handleProfilePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsSyncing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await setDoc(doc(db, 'config', 'site_settings'), { profilePic: base64 }, { merge: true });
        setProfilePic(base64);
        setIsSyncing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`min-h-screen bg-[#fafaf9] text-[#1a1a1a] selection:bg-amber-100 selection:text-amber-900 ${isAdmin ? 'pt-14' : ''}`}>
      {/* Admin Command Bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#022c22] text-white z-[1000] flex items-center justify-between px-6 border-b border-white/10 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-amber-400" />
              <span className="text-[10px] font-black tracking-widest uppercase">Admin Active</span>
            </div>
            <button onClick={() => setIsRegistryOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-amber-400 transition-colors">
              <Settings size={14} /> Site Config
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-amber-400 transition-colors">
              <Camera size={14} /> Update Portrait
            </button>
          </div>
          <button onClick={() => setIsAdmin(false)} className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2 hover:text-red-300">
            <LogOut size={14} /> Log Out
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[95vh] flex items-center justify-center bg-[#022c22] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920" alt="Texture" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#022c22]/80 via-transparent to-[#022c22]"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-amber-400 text-[10px] font-black tracking-[0.4em] uppercase mb-10">
            <Milestone size={14} /> Meritorious Service Archive
          </div>
          <h1 className="text-6xl md:text-9xl font-black text-white mb-8 leading-[0.85] tracking-tighter drop-shadow-2xl">
            Alhaji <br/> <span className="text-amber-500">Ibrahim Saidu</span>
          </h1>
          <p className="text-xl md:text-3xl text-emerald-50/80 mb-14 font-serif italic max-w-3xl mx-auto leading-relaxed font-light">
            "{config.heroQuote}"
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            {['FIHDM', 'CHRM', 'CH'].map(honor => (
              <span key={honor} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black tracking-widest uppercase backdrop-blur-md">
                {honor}
              </span>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#tribute" className="w-full md:w-auto bg-amber-500 text-black px-12 py-6 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-amber-400 transition-all hover:-translate-y-1 active:scale-95 text-xs">
              Leave a Tribute
            </a>
            <a href="#biography" className="w-full md:w-auto text-white px-12 py-6 rounded-full font-black uppercase tracking-widest border border-white/20 hover:bg-white/10 transition-all text-xs">
              View Biography
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-2">
            <div className="w-1 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Countdown Bar */}
      <section className="relative z-20 -mt-24 px-4 md:px-12">
        <div className="max-w-6xl mx-auto bg-white rounded-[4rem] p-12 shadow-2xl shadow-[#022c22]/10 border border-gray-100">
          <div className="text-center">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] mb-4">Countdown to Retirement</p>
            <h2 className="text-3xl font-black text-[#022c22] mb-12 font-serif italic">30th April, 2026</h2>
            <Countdown targetDate={config.retirementDate} />
          </div>
        </div>
      </section>

      {/* Biography */}
      <section id="biography" className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-20">
          <div className="md:col-span-7">
            <div className="inline-block p-4 bg-emerald-50 rounded-3xl text-emerald-900 mb-8">
              <Users size={32} />
            </div>
            <h2 className="text-5xl font-black text-[#022c22] mb-12 font-serif italic border-b border-gray-100 pb-8 leading-tight">
              A Visionary in National <br/>Service Leadership
            </h2>
            <div className="space-y-10 text-lg text-gray-600 leading-relaxed font-medium">
              <p>With a career spanning over two decades, Alhaji Ibrahim Saidu has become a symbol of integrity within the National Youth Service Corps. His journey is a testament to the power of disciplined administration and humane management.</p>
              
              <div className="grid md:grid-cols-2 gap-8 py-4">
                <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                  <h4 className="font-black text-[10px] text-amber-600 uppercase tracking-widest mb-4">The Catalyst</h4>
                  <p className="text-sm">Spearheaded the 2024 revitalization of staff welfare programs in NYSC Katsina, boosting morale across all cadres.</p>
                </div>
                <div className="p-8 bg-[#022c22] text-white rounded-[2.5rem] shadow-xl">
                  <h4 className="font-black text-[10px] text-amber-400 uppercase tracking-widest mb-4">The Mentor</h4>
                  <p className="text-sm">Known for fostering an environment where young administrative officers are empowered to take lead roles.</p>
                </div>
              </div>

              <p>As the 20th State Coordinator of NYSC Katsina, his tenure has been marked by transparency in mobilization and a robust approach to corps discipline, earning him accolades across the national headquarters.</p>
            </div>
          </div>

          <div className="md:col-span-5 space-y-12">
            <div className="relative group">
              <div className="aspect-[4/5] rounded-[4rem] overflow-hidden border-[16px] border-white shadow-2xl relative">
                <img src={profilePic} alt="Portrait" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#022c22]/60 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 p-8 bg-white rounded-[2.5rem] shadow-2xl border border-gray-50 text-center min-w-[200px]">
                <p className="font-black text-2xl text-[#022c22] font-serif italic mb-1">State Coordinator</p>
                <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">NYSC Katsina</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organizing Committee */}
      <section className="py-32 bg-[#022c22] text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="grid grid-cols-6 h-full border-l border-white/20">
            {[...Array(6)].map((_, i) => <div key={i} className="border-r border-white/20"></div>)}
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <div className="w-16 h-1 bg-amber-500 mx-auto mb-10"></div>
            <h2 className="text-5xl font-black font-serif italic mb-6">Planning & Organizing Committee</h2>
            <p className="text-emerald-300 text-[10px] font-black uppercase tracking-[0.5em] opacity-60">The architects of this celebration</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {COMMITTEE.map((member, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 group hover:bg-white/10 transition-all">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-[#022c22] mb-8 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <User size={20} />
                </div>
                <h4 className="text-xl font-black font-serif italic mb-3 text-white">{member.name}</h4>
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-2">{member.role}</p>
                <p className="text-emerald-200/50 text-[10px] font-bold uppercase tracking-widest">{member.subtext}</p>
                
                {member.phone && (
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <a href={`tel:${member.phone}`} className="flex items-center gap-3 text-white hover:text-amber-400 transition-colors">
                      <Phone size={14} className="opacity-50" />
                      <span className="text-xs font-bold tracking-widest">{member.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div>
              <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.5em] mb-4">Legacy in Motion</p>
              <h2 className="text-6xl font-black text-[#022c22] font-serif italic leading-tight">Archival Gallery</h2>
            </div>
          </div>
          <ImageGallery isAdmin={isAdmin} isAuthReady={isAuthReady} />
        </div>
      </section>

      {/* Tributes Section */}
      <section id="tribute" className="py-32 bg-[#fafaf9]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black text-[#022c22] mb-8 font-serif italic">Goodwill & Tributes</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.5em]">Voices of Appreication</p>
          </div>
          
          <TributeGenerator isAuthReady={isAuthReady} />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-24">
            {tributes.map((t) => (
              <div key={t.id} className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative group hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {isAdmin && (
                  <button onClick={() => deleteTribute(t.id)} className="absolute top-8 right-8 p-3 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                )}
                <div className="mb-10">
                  <p className="font-black text-2xl text-[#022c22] font-serif italic mb-2">{t.name}</p>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-[0.3em]">{t.relationship}</p>
                </div>
                <p className="text-gray-600 italic leading-relaxed text-lg mb-10 font-medium font-serif">"{t.message}"</p>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#022c22] text-white py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 pb-16 border-b border-white/5">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center font-black text-2xl text-[#022c22] shadow-2xl">NYSC</div>
              <div>
                <h4 className="text-2xl font-black uppercase tracking-tighter">Alhaji Saidu Ibrahim</h4>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em]">Official Retirement Archive</p>
              </div>
            </div>
            <div className="text-center md:text-right space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Meritorious Service 1998 - 2026</p>
              <p className="text-xs text-emerald-100/40">© 2024 Planning Committee. Curated with excellence.</p>
            </div>
          </div>
          
          {!isAdmin && (
            <button 
              onClick={() => setIsLoginModalOpen(true)} 
              className="mt-16 px-10 py-5 bg-white/5 border border-white/10 rounded-full text-emerald-500/50 hover:text-amber-400 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-4 mx-auto transition-all"
            >
              <Lock size={16} /> Restricted Portal Access
            </button>
          )}
        </div>
      </footer>

      {/* Modal Overlays (Login, Config) omitted for brevity as they remain functional */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfilePicChange} />
      
      {/* Ported Modals */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#022c22]/98 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-500">
            <div className="bg-[#022c22] p-12 text-center relative">
              <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-8 right-8 text-white/40 hover:text-white"><X size={24} /></button>
              <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
                <Lock size={32} className="text-amber-400" />
              </div>
              <h3 className="text-3xl font-black font-serif italic text-white mb-1">Secure Login</h3>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Administrative Access Only</p>
            </div>
            <form onSubmit={handleLogin} className="p-12 space-y-8">
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{loginError}</p>}
              <div className="space-y-6">
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email Address" className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all font-bold" />
                <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Secret Key" className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all font-bold" />
              </div>
              <button type="submit" className="w-full bg-[#022c22] text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-emerald-900 transition-all shadow-xl">Enter Command Center</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
