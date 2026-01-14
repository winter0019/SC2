
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
    <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 max-w-2xl mx-auto mb-12 md:mb-20 relative text-left">
      {!isAuthReady && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 sm:p-8 text-center">
           <ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-amber-500 mb-4" />
           <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Connecting to Cloud Server...</p>
        </div>
      )}
      
      <div className="bg-nysc-green p-8 md:p-10 text-white text-center">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-xl md:rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 md:mb-6 backdrop-blur-md">
          <Heart className="w-6 h-6 md:w-8 md:h-8 text-amber-400 fill-amber-400" />
        </div>
        <h3 className="text-xl md:text-2xl font-black font-serif italic mb-1 md:mb-2">Goodwill Message</h3>
        <p className="text-green-100 text-[10px] md:text-sm opacity-80 uppercase tracking-widest font-medium">Leave your heartfelt wishes</p>
      </div>
      
      <div className="p-6 md:p-10 space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3 ml-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-nysc-green focus:bg-white outline-none transition-all font-bold text-sm"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3 ml-1">Relationship</label>
            <input 
              type="text" 
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-nysc-green focus:bg-white outline-none transition-all font-bold text-sm"
              placeholder="e.g. Former Colleague"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3 ml-1">Your Tribute / Message</label>
          <textarea 
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-nysc-green focus:bg-white outline-none transition-all font-medium italic text-sm"
            placeholder="Write your well wishes here..."
          />
        </div>

        <button 
          onClick={handlePost}
          disabled={posting || !name || !relation || !message || !isAuthReady}
          className="w-full bg-nysc-green text-white py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:bg-gray-100 text-[10px] md:text-xs"
        >
          {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          Post Tribute
        </button>

        {success && (
          <p className="text-center text-green-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
            Thank you! Your message has been posted.
          </p>
        )}
      </div>
    </div>
  );
};

export default TributeGenerator;
