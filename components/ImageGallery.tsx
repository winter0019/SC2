
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Maximize2, Check, Trash2, Image as ImageIcon, Upload, Edit2, RefreshCw, ShieldCheck, AlertCircle, ChevronDown, PlusCircle } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { GALLERY_CATEGORIES } from '../constants';

interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  category: string;
}

interface ImageGalleryProps {
  isAdmin: boolean;
  isAuthReady: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ isAdmin, isAuthReady }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [uploadingFile, setUploadingFile] = useState<{url: string, file: File | null, id?: string} | null>(null);
  const [tempCaption, setTempCaption] = useState('');
  const [tempCategory, setTempCategory] = useState(GALLERY_CATEGORIES[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryImage[]);
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
    event.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!tempCaption.trim()) {
      setValidationError('A caption is required for historical context.');
      return;
    }
    setIsSyncing(true);
    try {
      const payload = { 
        url: uploadingFile!.url, 
        caption: tempCaption, 
        category: tempCategory, 
        timestamp: serverTimestamp() 
      };
      if (uploadingFile!.id) {
        await setDoc(doc(db, 'gallery', uploadingFile!.id), payload, { merge: true });
      } else {
        await addDoc(collection(db, 'gallery'), payload);
      }
      setUploadingFile(null);
      setTempCaption('');
      setValidationError('');
    } catch (err) { 
      console.error(err); 
      setValidationError('Upload failed. Check cloud rules.');
    }
    finally { setIsSyncing(false); }
  };

  const filteredImages = activeCategory === 'All' 
    ? images 
    : images.filter(img => img.category === activeCategory);

  return (
    <div className="space-y-20">
      {/* Category Navigation */}
      <div className="flex flex-col md:flex-row items-center gap-8 border-b border-gray-100 pb-12">
        <div className="flex flex-wrap justify-center md:justify-start gap-3">
          {['All', ...GALLERY_CATEGORIES].map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
                activeCategory === cat 
                  ? 'bg-[#012616] text-white shadow-[0_20px_40px_-10px_rgba(1,38,22,0.3)] scale-105' 
                  : 'bg-white text-gray-400 hover:text-[#012616] border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="md:ml-auto group flex items-center gap-4 bg-amber-500 text-black px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10"
          >
            <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" /> Add Historical Photo
          </button>
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFilePick} accept="image/*" />

      {/* Modern Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
        {filteredImages.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200">
             <ImageIcon className="mx-auto mb-6 text-gray-300" size={64} />
             <p className="text-gray-400 font-black uppercase tracking-widest text-xs">The archive is currently empty for this category.</p>
          </div>
        ) : (
          filteredImages.map((image) => (
            <div 
              key={image.id} 
              className="group relative aspect-[4/5] overflow-hidden rounded-[4rem] bg-gray-50 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-1000 border-8 border-white"
              onClick={() => setSelectedImage(image)}
            >
              <img src={image.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#012616] via-[#012616]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-12 duration-500">
                <span className="text-amber-400 text-[8px] font-black uppercase tracking-[0.5em] mb-3">{image.category}</span>
                <p className="text-white text-xl font-black font-serif italic leading-tight">{image.caption}</p>
                <div className="mt-6 flex items-center gap-2 text-white/50">
                  <Maximize2 size={12} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Enlarge Preview</span>
                </div>
              </div>
              {isAdmin && (
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm("Remove from archive?")) deleteDoc(doc(db, 'gallery', image.id)); }} 
                  className="absolute top-8 right-8 p-4 bg-red-600/90 backdrop-blur-md text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 shadow-2xl"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Admin Upload Overlay */}
      {uploadingFile && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 bg-[#012616]/98 backdrop-blur-3xl animate-in fade-in">
          <div className="bg-white rounded-[5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in relative">
            <div className="bg-[#012616] p-16 text-white text-center">
              <h3 className="text-4xl font-black font-serif italic mb-2">New Archival Entry</h3>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] opacity-80">Syncing to Global Database</p>
              <button onClick={() => setUploadingFile(null)} className="absolute top-12 right-12 p-4 text-white/40 hover:text-white transition-colors"><X size={32} /></button>
            </div>
            <div className="p-16 space-y-12">
              <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-50 relative group">
                <img src={uploadingFile.url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              </div>
              
              <div className="space-y-8">
                {validationError && (
                  <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse">
                    <AlertCircle size={16} /> {validationError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 ml-1">Event Description</label>
                  <input 
                    value={tempCaption} 
                    onChange={e => setTempCaption(e.target.value)} 
                    className="w-full px-8 py-6 bg-slate-50 rounded-3xl border border-slate-100 outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white font-bold transition-all" 
                    placeholder="Describe this moment..." 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 ml-1">Archive Category</label>
                  <div className="relative">
                    <select 
                      value={tempCategory} 
                      onChange={e => setTempCategory(e.target.value)} 
                      className="w-full px-8 py-6 bg-slate-50 rounded-3xl border border-slate-100 outline-none appearance-none font-black uppercase text-[11px] tracking-[0.3em] cursor-pointer"
                    >
                      {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleConfirmUpload} 
                disabled={isSyncing} 
                className="w-full bg-[#012616] text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isSyncing ? <RefreshCw className="animate-spin" /> : <><Check size={24} className="text-amber-400" /> Confirm Archive Addition</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 z-[2200] bg-[#012616]/98 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-12 right-12 text-white/40 hover:text-white transition-transform hover:scale-110 active:scale-90"><X size={64} /></button>
          <div className="max-w-7xl w-full flex flex-col items-center gap-16" onClick={e => e.stopPropagation()}>
            <div className="relative w-full flex justify-center">
              <img src={selectedImage.url} className="max-h-[70vh] w-auto object-contain rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-8 border-white/5" />
            </div>
            <div className="text-center animate-in slide-in-from-bottom-8 duration-700">
              <div className="inline-block px-6 py-2 bg-amber-500 rounded-full text-black text-[10px] font-black uppercase tracking-widest mb-6">{selectedImage.category}</div>
              <p className="text-white text-4xl md:text-6xl font-serif italic max-w-4xl tracking-tight leading-tight">"{selectedImage.caption}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
