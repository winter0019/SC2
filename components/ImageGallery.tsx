
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
    <div className="space-y-16">
      <div className="flex flex-col md:flex-row items-center gap-8 border-b border-gray-100 pb-12">
        <div className="flex flex-wrap justify-center gap-3">
          {['All', ...GALLERY_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-[#012616] text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:text-[#012616]'}`}>
              {cat}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button onClick={() => fileInputRef.current?.click()} className="md:ml-auto flex items-center gap-4 bg-amber-500 text-black px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 shadow-xl transition-all">
            <PlusCircle size={20} /> Add to Archive
          </button>
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFilePick} accept="image/*" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {filteredImages.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs">No entries found.</div>
        ) : (
          filteredImages.map((image) => (
            <div key={image.id} className="group relative aspect-[4/5] overflow-hidden rounded-[4rem] bg-gray-50 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-700 border-8 border-white" onClick={() => setSelectedImage(image)}>
              <img src={image.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#012616] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-12">
                <span className="text-amber-400 text-[8px] font-black uppercase tracking-[0.5em] mb-3">{image.category}</span>
                <p className="text-white text-xl font-black font-serif italic leading-tight">{image.caption}</p>
              </div>
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete entry?")) deleteDoc(doc(db, 'gallery', image.id)); }} className="absolute top-8 right-8 p-4 bg-red-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 shadow-2xl">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {uploadingFile && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-6 bg-[#012616]/98 backdrop-blur-3xl">
          <div className="bg-white rounded-[5rem] w-full max-w-xl shadow-2xl p-16 space-y-12 relative">
            <button onClick={() => setUploadingFile(null)} className="absolute top-10 right-10 p-3 hover:bg-gray-100 rounded-full"><X size={32} /></button>
            <h3 className="text-4xl font-black font-serif italic text-[#012616] text-center">New Entry</h3>
            {errorMsg && <div className="p-5 bg-red-50 text-red-600 rounded-3xl text-[10px] font-black uppercase flex items-center gap-3"><AlertTriangle size={16} /> {errorMsg}</div>}
            <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-50">
              <img src={uploadingFile.url} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-8">
              <input value={tempCaption} onChange={e => setTempCaption(e.target.value)} className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold" placeholder="Context/Description..." />
              <select value={tempCategory} onChange={e => setTempCategory(e.target.value)} className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black uppercase text-[11px]">
                {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleConfirmUpload} disabled={isSyncing} className="w-full bg-[#012616] text-white py-8 rounded-[2.5rem] font-black uppercase text-[11px] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all">
                {isSyncing ? <RefreshCw className="animate-spin" /> : <><Check size={24} className="text-amber-400" /> Save to Archive</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-[2600] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-12 right-12 text-white/40 hover:text-white"><X size={64} /></button>
          <div className="max-w-7xl w-full flex flex-col items-center gap-16" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.url} className="max-h-[70vh] rounded-[4rem] shadow-2xl border-8 border-white/5" />
            <div className="text-center">
              <div className="px-6 py-2 bg-amber-500 rounded-full text-black text-[10px] font-black uppercase mb-6">{selectedImage.category}</div>
              <p className="text-white text-4xl font-serif italic max-w-4xl leading-tight tracking-tight">"{selectedImage.caption}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
