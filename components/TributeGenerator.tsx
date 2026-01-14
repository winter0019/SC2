
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { Sparkles, Send, Loader2, Wand2, ShieldAlert } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface TributeGeneratorProps {
  isAuthReady: boolean;
}

const TributeGenerator: React.FC<TributeGeneratorProps> = ({ isAuthReady }) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [memory, setMemory] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [generatedTribute, setGeneratedTribute] = useState('');

  const handleGenerate = async () => {
    if (!name || !relation || !memory) return;
    setLoading(true);
    const tribute = await geminiService.generateTribute(name, relation, memory);
    setGeneratedTribute(tribute);
    setLoading(false);
  };

  const handlePost = async () => {
    if (!generatedTribute || !isAuthReady) return;
    setPosting(true);
    try {
      // Changed collection to 'achievements' as defined in security rules
      await addDoc(collection(db, 'achievements'), {
        name,
        relationship: relation,
        message: generatedTribute,
        date: new Date().toLocaleDateString(),
        timestamp: serverTimestamp()
      });
      // Reset form
      setName('');
      setRelation('');
      setMemory('');
      setGeneratedTribute('');
    } catch (error) {
      console.error("Error posting achievement:", error);
      alert("Cloud connection issues. Ensure you have configured your Firestore security rules correctly.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 max-w-2xl mx-auto mb-20 relative">
      {!isAuthReady && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center">
           <ShieldAlert className="w-12 h-12 text-amber-500 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Awaiting Secure Cloud Link...</p>
        </div>
      )}
      
      <div className="bg-nysc-green p-10 text-white text-center">
        <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
          <Wand2 className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-2xl font-black font-serif italic mb-2">AI Memory Assistant</h3>
        <p className="text-green-100 text-sm opacity-80 uppercase tracking-widest font-medium">Craft a heartfelt message</p>
      </div>
      
      <div className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Your Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-nysc-green focus:bg-white outline-none transition-all font-bold"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Relationship</label>
            <input 
              type="text" 
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-nysc-green focus:bg-white outline-none transition-all font-bold"
              placeholder="e.g. Former Colleague"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Your Message or Shared Memory</label>
          <textarea 
            rows={4}
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-nysc-green focus:bg-white outline-none transition-all font-medium italic"
            placeholder="Share a brief memory or quality you admire..."
          />
        </div>

        {!generatedTribute ? (
          <button 
            onClick={handleGenerate}
            disabled={loading || !name || !relation || !memory || !isAuthReady}
            className="w-full bg-nysc-green text-white py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-200 text-xs"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-400" />}
            Generate Polished Tribute
          </button>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 italic text-gray-800 leading-relaxed text-lg shadow-inner">
              "{generatedTribute}"
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setGeneratedTribute('')}
                className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-gray-600 transition-all"
              >
                Start Over
              </button>
              <button 
                onClick={handlePost}
                disabled={posting || !isAuthReady}
                className="flex-[2] bg-nysc-green text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-2xl transition-all shadow-xl shadow-green-900/20 text-[10px]"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post to Tribute Wall
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TributeGenerator;
