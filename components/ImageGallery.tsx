
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Maximize2, Check, Trash2, Image as ImageIcon, Upload, Edit2, RefreshCw, ShieldCheck, AlertCircle, ChevronDown } from 'lucide-react';
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
    if (!tempCaption.trim()) return setValidationError('Please add a description.');
    setIsSyncing(true);
    try {
      const payload = { url: uploadingFile!.url, caption: tempCaption, category: tempCategory, timestamp: serverTimestamp() };
      if (uploadingFile!.id) {
        await setDoc(doc(db, 'gallery', uploadingFile!.id), payload, { merge: true });
      } else {
        await addDoc(collection(db, 'gallery'), payload);
      }
      setUploadingFile(null);
      setTempCaption('');
    } catch (err) { console.error(err); }
    finally { setIsSyncing(false); }
  };

  const filteredImages = activeCategory === 'All' 
    ? images 
    : images.filter(img => img.category === activeCategory);

  return (
    <div className="space-y-16">
      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-8">
        {['All', ...GALLERY_CATEGORIES].map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeCategory === cat 
                ? 'bg-[#022c22] text-white shadow-xl scale-105' 
                : 'bg-white text-gray-400 hover:text-[#022c22] border border-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
        {isAdmin && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="ml-auto flex items-center gap-3 bg-amber-500 text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all"
          >
            <Upload size={16} /> New Entry
          </button>
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFilePick} accept="image/*" />

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredImages.map((image) => (
          <div 
            key={image.id} 
            className="group relative aspect-square overflow-hidden rounded-[3rem] bg-gray-50 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-700"
            onClick={() => setSelectedImage(image)}
          >
            <img src={image.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#022c22] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-10">
              <span className="text-amber-400 text-[8px] font-black uppercase tracking-[0.4em] mb-2">{image.category}</span>
              <p className="text-white text-base font-black font-serif italic">{image.caption}</p>
            </div>
            {isAdmin && (
              <button 
                onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'gallery', image.id)); }} 
                className="absolute top-6 right-6 p-3 bg-red-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {uploadingFile && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 bg-[#022c22]/98 backdrop-blur-2xl animate-in fade-in">
          <div className="bg-white rounded-[4rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="bg-[#022c22] p-12 text-white flex justify-between items-center">
              <h3 className="text-3xl font-black font-serif italic">Add to Archive</h3>
              <button onClick={() => setUploadingFile(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
            </div>
            <div className="p-12 space-y-10">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-inner border border-gray-100">
                <img src={uploadingFile.url} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Event Description</label>
                  <input value={tempCaption} onChange={e => setTempCaption(e.target.value)} className="w-full px-8 py-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white font-bold" placeholder="E.g. NYSC Katsina Camp Opening Ceremony" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Category Tag</label>
                  <div className="relative">
                    <select value={tempCategory} onChange={e => setTempCategory(e.target.value)} className="w-full px-8 py-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none appearance-none font-black uppercase text-[10px] tracking-widest">
                      {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>
              </div>
              <button onClick={handleConfirmUpload} disabled={isSyncing} className="w-full bg-[#022c22] text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-3">
                {isSyncing ? <RefreshCw className="animate-spin" /> : <><Check size={20} className="text-amber-400" /> Save to Cloud</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[2200] bg-black/98 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-10 right-10 text-white/40 hover:text-white"><X size={48} /></button>
          <div className="max-w-6xl w-full flex flex-col items-center gap-12" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.url} className="max-h-[75vh] w-auto object-contain rounded-[3rem] shadow-2xl border-4 border-white/5" />
            <div className="text-center">
              <p className="text-amber-500 font-black text-[10px] uppercase tracking-[0.5em] mb-4">{selectedImage.category}</p>
              <p className="text-white text-4xl font-serif italic max-w-2xl">{selectedImage.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
