
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Maximize2, Check, Trash2, Image as ImageIcon, PlusCircle, RefreshCw, ChevronDown, AlertTriangle } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { GALLERY_CATEGORIES } from '../constants';

interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  category: string;
}

const ImageGallery: React.FC<{ isAdmin: boolean; isAuthReady: boolean }> = ({ isAdmin, isAuthReady }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [uploadingFile, setUploadingFile] = useState<{url: string, file: File | null} | null>(null);
  const [tempCaption, setTempCaption] = useState('');
  const [tempCategory, setTempCategory] = useState(GALLERY_CATEGORIES[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryImage[]);
    }, (err) => {
      console.error("Gallery Sync Error:", err);
    });
    return () => unsubscribe();
  }, []);

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadingFile({ url: reader.result as string, file });
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (!tempCaption.trim()) return setErrorMsg('A description is required.');
    setIsSyncing(true);
    setErrorMsg('');
    try {
      await addDoc(collection(db, 'gallery'), { 
        url: uploadingFile!.url, 
        caption: tempCaption, 
        category: tempCategory, 
        timestamp: serverTimestamp() 
      });
      setUploadingFile(null);
      setTempCaption('');
    } catch (err: any) { 
      console.error("Gallery Write Error:", err);
      setErrorMsg("Cloud Permission Denied. Ensure you are an Admin.");
    } finally { setIsSyncing(false); }
  };

  const filteredImages = activeCategory === 'All' 
    ? images 
    : images.filter(img => img.category === activeCategory);

  return (
    <div className="space-y-6 md:space-y-12">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 border-b border-gray-100 pb-6 md:pb-10">
        <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
          {['All', ...GALLERY_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 sm:px-6 md:px-8 py-2.5 sm:py-3.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-[#012616] text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:text-[#012616]'}`}>
              {cat}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button onClick={() => fileInputRef.current?.click()} className="md:ml-auto flex items-center justify-center gap-2 bg-amber-500 text-black px-6 md:px-8 py-3.5 rounded-2xl font-black uppercase text-[8px] md:text-[9px] tracking-widest hover:bg-amber-400 shadow-xl transition-all w-full md:w-auto">
            <PlusCircle size={14} /> Add Entry
          </button>
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFilePick} accept="image/*" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 md:gap-8">
        {filteredImages.length === 0 ? (
          <div className="col-span-full py-12 md:py-16 text-center text-gray-300 font-black uppercase tracking-widest text-[9px] md:text-[11px]">No entries found in this archive.</div>
        ) : (
          filteredImages.map((image) => (
            <div key={image.id} className="group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] md:rounded-[2.5rem] bg-gray-50 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-700 border-4 md:border-[6px] border-white" onClick={() => setSelectedImage(image)}>
              <img src={image.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#012616] via-[#012616]/20 to-transparent opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 md:p-8">
                <span className="text-amber-400 text-[6px] md:text-[7px] font-black uppercase tracking-[0.4em] mb-1.5 md:mb-2">{image.category}</span>
                <p className="text-white text-sm md:text-base font-black font-serif italic leading-tight line-clamp-2">{image.caption}</p>
              </div>
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete entry?")) deleteDoc(doc(db, 'gallery', image.id)); }} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 shadow-2xl">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {uploadingFile && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-[#012616]/98 backdrop-blur-3xl">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 space-y-8 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button onClick={() => setUploadingFile(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            <h3 className="text-2xl font-black font-serif italic text-[#012616] text-center">New Entry</h3>
            {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase flex items-center gap-2"><AlertTriangle size={12} /> {errorMsg}</div>}
            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl border-2 border-slate-50">
              <img src={uploadingFile.url} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-5">
              <input value={tempCaption} onChange={e => setTempCaption(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs" placeholder="Context/Description..." />
              <select value={tempCategory} onChange={e => setTempCategory(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-black uppercase text-[9px] appearance-none">
                {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleConfirmUpload} disabled={isSyncing} className="w-full bg-[#012616] text-white py-5 rounded-xl font-black uppercase text-[10px] shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-all">
                {isSyncing ? <RefreshCw className="animate-spin" /> : <><Check size={16} className="text-amber-400" /> Save to Archive</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-[2600] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-8" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 sm:top-10 sm:right-10 text-white/40 hover:text-white p-2"><X size={28} /></button>
          <div className="max-w-6xl w-full flex flex-col items-center gap-6 md:gap-10 max-h-screen overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.url} className="w-auto max-h-[50vh] md:max-h-[65vh] rounded-[1.5rem] md:rounded-[3rem] shadow-2xl border-4 md:border-8 border-white/5 object-contain" />
            <div className="text-center px-4">
              <div className="inline-block px-4 py-1.5 bg-amber-500 rounded-full text-black text-[7px] md:text-[9px] font-black uppercase mb-3 md:mb-5">{selectedImage.category}</div>
              <p className="text-white text-lg md:text-2xl font-serif italic max-w-3xl leading-snug tracking-tight">"{selectedImage.caption}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
