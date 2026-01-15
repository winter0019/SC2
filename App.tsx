
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
  Menu,
  TrendingUp,
  FileText,
  Shield,
  Layers,
  MapPin,
  Clock
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
  
  // Start with null to prevent "async data flash" of old content
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState({
    heroQuote: 'Service to humanity is the rent we pay for our room here on earth. Leadership is the legacy we leave behind.',
    retirementDate: '2026-04-30',
  });

  const [tributes, setTributes] = useState<Tribute[]>([]);

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

  useEffect(() => {
    const q = query(collection(db, 'achievements'), orderBy('timestamp', 'desc'));
    const unsubscribeTributes = onSnapshot(q, (snapshot) => {
      setTributes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tribute[]);
      setConnectionStatus('online');
    }, (err) => {
      console.error("Sync Error:", err);
      if (err.code === 'permission-denied') setConnectionStatus('error');
    });

    // Authority source: Firestore Config
    const unsubscribeConfig = onSnapshot(doc(db, 'config', 'site_settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig(prev => ({ ...prev, ...data }));
        if (data.profilePic) setProfilePic(data.profilePic);
      }
      setIsConfigLoading(false);
    }, (err) => {
      console.error("Config Sync Error:", err);
      setIsConfigLoading(false);
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
      setLoginError('Cloud connection error. Try again later.');
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

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    await setDoc(doc(db, 'config', 'site_settings'), config, { merge: true });
    setIsRegistryOpen(false);
    setIsSyncing(false);
  };

  const careerMilestones = [
    { year: '1998', title: 'Career Genesis', location: 'NYSC HEADQUARTERS', text: 'Began the journey of selfless service as a young officer dedicated to the National Youth Service Corps.' },
    { year: '2005-2012', title: 'Zonal Leadership', location: 'ZAMFARA & KADUNA', text: 'Served as Zonal Inspector and Local Government Inspector, directly overseeing the welfare of thousands of corps members.' },
    { year: '2015', title: 'Mobilization Expert', location: 'ABUJA HQ', text: 'Appointed to critical roles in the Mobilization Department, ensuring the integrity of graduate calls to service across Nigeria.' },
    { year: '2022', title: 'Deputy Director Rank', location: 'NATIONAL DIRECTORATE', text: 'Promoted to Deputy Director in recognition of exemplary discipline, administrative prowess, and loyalty to the scheme.' },
    { year: '2024', title: 'State Coordinator Appointment', location: 'KATSINA STATE', text: 'Appointed as the 20th State Coordinator, initiating the "Golden Era" of infrastructure and staff welfare in Katsina.' }
  ];

  const metrics = [
    { label: 'Mobilization', value: '98%', color: 'bg-emerald-500' },
    { label: 'SAED Success', value: '92%', color: 'bg-amber-500' },
    { label: 'Staff Welfare', value: '95%', color: 'bg-blue-500' },
    { label: 'Infrastructure', value: '88%', color: 'bg-emerald-600' }
  ];

  return (
    <div className={`min-h-screen bg-[#fafaf9] text-[#012616] selection:bg-amber-100 selection:text-amber-900 ${isAdmin ? 'pt-14' : ''}`}>
      {/* Admin Command Bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#012616] text-white z-[1000] flex items-center justify-between px-6 border-b border-white/10 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black tracking-widest uppercase">Admin Control Panel</span>
            </div>
            <button onClick={() => setIsRegistryOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-amber-400">
              <Settings size={14} /> Site Config
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-amber-400">
              <Camera size={14} /> Update Portrait
            </button>
          </div>
          <button onClick={handleLogout} className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
            <LogOut size={14} /> End Session
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center bg-[#012616] overflow-hidden text-white pt-20">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl">
          <div className="inline-flex items-center gap-2 mb-8 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
             <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
             <span className="text-[9px] font-black tracking-[0.4em] uppercase text-amber-500">Legacy of Distinction</span>
          </div>

          <div className="mb-10 relative">
            <div className="w-40 h-40 md:w-56 md:h-56 mx-auto rounded-full border-[10px] border-white/5 p-2 bg-gradient-to-tr from-[#012616] to-[#0c4028] shadow-2xl relative overflow-hidden">
              {isConfigLoading ? (
                <div className="w-full h-full bg-white/10 animate-pulse rounded-full" />
              ) : (
                <img 
                  src={profilePic || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600'} 
                  className="w-full h-full object-cover rounded-full shadow-inner grayscale-[30%] hover:grayscale-0 transition-all duration-700" 
                  alt="Alhaji Saidu"
                />
              )}
              {!isConfigLoading && (
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black w-10 h-10 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#012616]">
                  <Award size={18} fill="currentColor" />
                </div>
              )}
            </div>
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-4 tracking-tighter leading-none">
            Alhaji <span className="text-amber-500 font-serif italic font-normal">Saidu</span><br/>
            Ibrahim
          </h1>
          
          <div className="flex items-center justify-center gap-6 mt-8 mb-12">
            <div className="h-[1px] w-12 bg-white/20"></div>
            <p className="text-[10px] font-black tracking-[0.5em] uppercase text-emerald-100 opacity-60">20th State Coordinator</p>
            <div className="h-[1px] w-12 bg-white/20"></div>
          </div>

          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto mb-16">
            <Countdown targetDate={config.retirementDate} />
          </div>

          <div className="max-w-2xl mx-auto mb-16">
            <p className="text-lg md:text-2xl font-serif italic text-emerald-50/80 leading-relaxed font-light">
              "{config.heroQuote}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <a href="#biography" className="group bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all shadow-2xl">
               The Journey <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
             </a>
             <a href="#tribute" className="bg-white/5 hover:bg-white/10 text-white border border-white/20 px-10 py-4 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all">
               <Heart size={14} className="text-red-400" /> Tributes
             </a>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-6 max-w-7xl mx-auto -mt-10 relative z-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <TrendingUp className="text-amber-500" />, title: 'Discipline', text: 'A hallmark of his 28-year career in the scheme.' },
            { icon: <Shield className="text-emerald-500" />, title: 'Integrity', text: 'Unwavering commitment to organizational transparency.' },
            { icon: <Heart className="text-red-500" />, title: 'Empathy', text: 'A father figure to thousands of Nigerian graduates.' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 text-center hover:translate-y-[-5px] transition-all">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">{item.icon}</div>
               <h3 className="text-xl font-black mb-3">{item.title}</h3>
               <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Career Timeline Section */}
      <section id="biography" className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-20 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-32">
             <div className="mb-10">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] block mb-4">Milestone Tracker</span>
               <h2 className="text-5xl font-black tracking-tighter leading-none mb-6">
                 Road to<br/>Katsina<br/><span className="text-emerald-600">2024</span>
               </h2>
             </div>
             <div className="bg-[#012616] p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="text-6xl font-black mb-2 leading-none">1998</div>
                  <div className="text-[10px] font-black tracking-widest uppercase opacity-40 mb-8">Commissioned into Service</div>
                  <div className="h-[1px] bg-white/10 w-full mb-8"></div>
                  <div className="text-5xl font-black mb-2 leading-none">2026</div>
                  <div className="text-[10px] font-black tracking-widest uppercase opacity-40">The Final Bow</div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-8 relative">
             <div className="absolute left-0 lg:left-8 top-0 bottom-0 w-[2px] bg-slate-100"></div>
             <div className="space-y-20 relative">
               {careerMilestones.map((ms, i) => (
                 <div key={i} className="relative pl-12 lg:pl-24 group">
                    <div className="absolute left-[-5px] lg:left-[27px] top-0 w-3 h-3 rounded-full border-2 border-emerald-600 bg-white group-hover:bg-emerald-600 transition-colors duration-500"></div>
                    <div className="bg-slate-50 p-10 rounded-[2.5rem] group-hover:bg-white group-hover:shadow-2xl transition-all duration-500 border border-transparent group-hover:border-slate-100">
                       <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                         <div className="text-4xl font-black text-slate-300 group-hover:text-emerald-600 transition-colors font-serif">{ms.year}</div>
                         <div className="px-4 py-1 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-full">{ms.location}</div>
                       </div>
                       <h4 className="text-2xl font-black mb-4">{ms.title}</h4>
                       <p className="text-slate-500 leading-relaxed font-medium">{ms.text}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* Performance Metrics Section */}
      <section className="py-32 bg-[#0c1410] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] block mb-4">Efficiency Analytics</span>
              <h2 className="text-5xl font-black tracking-tighter mb-8 leading-none">Performance Metrics</h2>
              <p className="text-emerald-100/60 text-lg mb-12 font-medium">A data-driven view of excellence synced from the central repository.</p>
              
              <div className="grid grid-cols-2 gap-8">
                {metrics.map((m, i) => (
                  <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/10">
                    <div className="text-4xl font-black mb-2">{m.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#012616] p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="space-y-8">
                  {metrics.map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                        <span className="text-xs font-black">{m.value}</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${m.color} rounded-full`} style={{ width: m.value }}></div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="py-32 bg-[#f8faf9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
            <div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.5em] block mb-4">Cloud Archive</span>
              <h2 className="text-5xl font-black tracking-tighter leading-none">Tenure in Pictures</h2>
            </div>
            {isAdmin ? (
               <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Admin Archive Access</span>
               </div>
            ) : null}
          </div>
          <ImageGallery isAdmin={isAdmin} isAuthReady={isAuthReady} />
        </div>
      </section>

      {/* Tribute Section */}
      <section id="tribute" className="py-32 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-20">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.5em] block mb-4">Synchronized Legacy Wall</span>
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-6">Well Wishes & Global Tributes</h2>
              <p className="text-slate-400 font-medium max-w-xl mx-auto">Your words are part of his permanent service record. Post a message to honor his 28-year journey.</p>
           </div>
           
           <div className="grid lg:grid-cols-12 gap-20">
             <div className="lg:col-span-4">
                <TributeGenerator isAuthReady={isAuthReady} />
             </div>
             <div className="lg:col-span-8">
                <div className="space-y-6">
                   {tributes.length === 0 ? (
                     <div className="bg-slate-50 p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl">
                          <Users size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">The registry is open. Be the first to sign.</p>
                     </div>
                   ) : (
                     tributes.map((t) => (
                        <div key={t.id} className="bg-slate-50 p-10 rounded-[2.5rem] relative group border border-transparent hover:border-slate-200 transition-all hover:bg-white hover:shadow-2xl">
                           {isAdmin && (
                             <button onClick={() => deleteTribute(t.id)} className="absolute top-10 right-10 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                           )}
                           <div className="flex items-center gap-6 mb-8">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-emerald-600 shadow-xl">{t.name[0]}</div>
                              <div>
                                 <h4 className="text-xl font-black leading-none mb-2">{t.name}</h4>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 opacity-60">{t.relationship}</span>
                              </div>
                           </div>
                           <p className="text-lg font-serif italic text-slate-600 leading-relaxed">"{t.message}"</p>
                           <div className="mt-8 pt-8 border-t border-slate-200/50 flex items-center gap-3">
                              <Clock size={12} className="text-slate-300" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{t.date}</span>
                           </div>
                        </div>
                     ))
                   )}
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* Administrative Dossier (Biography Expanded) */}
      <section className="py-32 bg-[#012616] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
             <div className="relative">
                <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white/5 relative">
                   {isConfigLoading ? (
                     <div className="w-full h-full bg-white/10 animate-pulse" />
                   ) : (
                     <img 
                       src={profilePic || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600'} 
                       className="w-full h-full object-cover grayscale-[50%]" 
                       alt="Alhaji Saidu"
                     />
                   )}
                </div>
                {!isConfigLoading && (
                  <div className="absolute -bottom-10 -right-10 bg-amber-500 w-40 h-40 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-6">
                    <Award size={64} className="text-[#012616]" fill="currentColor" />
                  </div>
                )}
             </div>
             
             <div>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.5em] block mb-4">Administrative Dossier</span>
                <h2 className="text-6xl font-black tracking-tighter leading-none mb-10 font-serif">Carved in <br/><span className="text-emerald-400">Service</span></h2>
                
                <div className="space-y-8 text-lg font-medium text-emerald-50/70 leading-relaxed">
                   <p><span className="text-6xl font-black float-left mr-4 mt-2 text-amber-500 font-serif">A</span>lhaji Ibrahim Saidu, the distinguished 20th State Coordinator of NYSC Katsina State, is a paragon of administrative excellence. His journey within the National Youth Service Corps began in 1998, a path defined by integrity and passion.</p>
                   <p><span className="text-5xl font-black text-amber-500 font-serif">H</span>e has navigated the complexities of the Scheme across Zamfara, Katsina, and Kaduna States, as well as the National Directorate Headquarters in Abuja. His contributions to the Mobilization Department are legendary, having streamlined processes that ensure the transparency and credibility of the mobilization of thousands of Nigerian graduates annually.</p>
                </div>
                
                <div className="mt-16 grid grid-cols-4 gap-8">
                   {[
                     { label: 'Inducted', val: '1998' },
                     { label: 'Tenure', val: '28 Years' },
                     { label: 'Rank', val: 'Deputy Director' },
                     { label: 'Fellow', val: 'FIHDM' }
                   ].map((item, i) => (
                     <div key={i}>
                        <div className="text-xs font-black uppercase tracking-widest text-emerald-400 opacity-40 mb-2">{item.label}</div>
                        <div className="text-xl font-black">{item.val}</div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Valedictory Committee */}
      <section className="py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black tracking-tighter leading-none mb-6">The Valedictory Committee</h2>
            <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Honoring 28 Years of Excellence</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {COMMITTEE.map((m, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-12 rounded-[2.5rem] group hover:bg-white/10 transition-all">
                <h4 className="text-2xl font-black mb-2 group-hover:text-emerald-400 transition-colors">{m.name}</h4>
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 opacity-80 mb-4">{m.role} - {m.subtext}</div>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="mt-8 pt-8 border-t border-white/5 flex items-center gap-3 text-white/40 hover:text-white transition-colors">
                    <Phone size={14} />
                    <span className="text-sm font-black tracking-widest">{m.phone}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 py-20 px-6 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
           <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-black shadow-2xl">NYSC</div>
                 <div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase mb-1">Alhaji Saidu Ibrahim</h3>
                    <p className="text-[8px] font-black uppercase tracking-[0.5em] text-emerald-500">The Golden Era Coordinator • 1998 - 2026</p>
                 </div>
              </div>
              
              <div className="text-center md:text-right">
                 <div className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">Digital Legacy Archive</div>
                 <div className="text-xs font-medium text-white/60 mb-6">Documenting the 20th Coordinator of NYSC Katsina.</div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-white/20">© 2025 NYSC Katsina Secretariat</div>
              </div>
           </div>
           {!isAdmin && (
             <div className="mt-20 pt-10 border-t border-white/5 flex justify-center">
               <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-3 text-white/20 hover:text-emerald-500 transition-all text-[10px] font-black uppercase tracking-[0.4em]">
                 <Lock size={12} /> Restricted Admin Archive Access
               </button>
             </div>
           )}
        </div>
      </footer>

      {/* Modals */}
      {isRegistryOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#012616]/98 backdrop-blur-2xl">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl p-12 relative">
            <button onClick={() => setIsRegistryOpen(false)} className="absolute top-10 right-10 p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            <h3 className="text-3xl font-black mb-10 tracking-tighter">Site Config</h3>
            <form onSubmit={saveConfig} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Retirement Timeline</label>
                <input type="date" value={config.retirementDate} onChange={e => setConfig({...config, retirementDate: e.target.value})} className="w-full px-8 py-5 rounded-2xl bg-slate-50 border border-slate-100 font-black outline-none" />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Legacy Quote</label>
                <textarea value={config.heroQuote} onChange={e => setConfig({...config, heroQuote: e.target.value})} rows={4} className="w-full px-8 py-5 rounded-2xl bg-slate-50 border border-slate-100 font-serif italic text-lg outline-none resize-none" />
              </div>
              <button type="submit" disabled={isSyncing} className="w-full bg-[#012616] text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-4">
                {isSyncing ? <RefreshCw className="animate-spin" /> : <><Save size={18} /> Update Archive</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#012616]/98 backdrop-blur-3xl">
          <div className="bg-white rounded-[3rem] w-full max-w-sm shadow-2xl overflow-hidden text-center p-12">
            <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-black"><X size={20} /></button>
            <div className="w-16 h-16 bg-[#012616] text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
               <Lock size={28} />
            </div>
            <h3 className="text-3xl font-black tracking-tighter mb-2">Admin Portal</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-10">Cloud Authorization Required</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Access ID" className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-center" />
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Secret Token" className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-center" />
              <button type="submit" disabled={isSyncing} className="w-full bg-[#012616] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-[1.02] transition-all">
                {isSyncing ? 'Authenticating...' : 'Enter Registry'}
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
