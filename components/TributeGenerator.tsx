
import React, { useState } from 'react';
import { Send, Loader2, Heart, ShieldAlert } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface TributeGeneratorProps {
  isAuthReady: boolean;
}

const TributeGenerator: React.FC<TributeGeneratorProps> = ({ isAuthReady }) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePost = async () => {
    if (!name || !relation || !message || !isAuthReady) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'achievements'), {
        name,
        relationship: relation,
        message: message,
        date: new Date().toLocaleDateString(),
        timestamp: serverTimestamp()
      });
      setName('');
      setRelation('');
      setMessage('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error("Error posting tribute:", error);
      alert("Failed to post. Check your connection.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 max-w-md mx-auto mb-8 md:mb-12 relative text-left">
      {!isAuthReady && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-4 text-center">
           <ShieldAlert className="w-8 h-8 text-amber-500 mb-2" />
           <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Connecting...</p>
        </div>
      )}
      
      <div className="bg-nysc-green p-5 md:p-6 text-white text-center">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
          <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
        </div>
        <h3 className="text-lg font-black font-serif italic mb-0.5">Goodwill Message</h3>
        <p className="text-green-100 text-[9px] opacity-70 uppercase tracking-widest font-medium">Leave your wishes</p>
      </div>
      
      <div className="p-5 md:p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-nysc-green focus:bg-white outline-none transition-all font-bold text-xs"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Relationship</label>
            <input 
              type="text" 
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-nysc-green focus:bg-white outline-none transition-all font-bold text-xs"
              placeholder="e.g. Former Colleague"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Message</label>
          <textarea 
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-nysc-green focus:bg-white outline-none transition-all font-medium italic text-xs resize-none"
            placeholder="Write your wishes..."
          />
        </div>

        <button 
          onClick={handlePost}
          disabled={posting || !name || !relation || !message || !isAuthReady}
          className="w-full bg-nysc-green text-white py-3.5 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.98] transition-all disabled:bg-gray-100 text-[9px]"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Post Tribute
        </button>

        {success && (
          <p className="text-center text-green-600 text-[8px] font-black uppercase tracking-widest animate-pulse">
            Message posted successfully.
          </p>
        )}
      </div>
    </div>
  );
};

export default TributeGenerator;
