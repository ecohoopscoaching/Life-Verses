import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateSong } from '../services/geminiService';
import { PRODUCERS, VOCALISTS } from '../data/personas';
import { SEASON_1_EPISODES } from '../data/seasons';

const CORE_EMOTIONS = [
  "Surprise Me",
  "Pain",
  "Pride",
  "Grief",
  "Hope",
  "Rage",
  "Love",
  "Exhaustion",
  "Regret",
  "Panic",
  "Arrogance",
  "Betrayal",
  "Loneliness",
  "Fear",
  "Envy",
  "Gratitude",
  "Ambition",
  "Despair"
];

export default function CreateSong({ user }: { user: User }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    producer: PRODUCERS[0],
    vocalist: VOCALISTS[0],
    creationMode: 'structured',
    storySource: '',
    useOriginalForm: false,
    modernTranslation: '',
    coreEmotion: CORE_EMOTIONS[1],
    hiddenLesson: ''
  });

  const handleModeChange = (mode: string) => {
    setFormData(prev => ({ 
      ...prev, 
      creationMode: mode,
      coreEmotion: mode === 'ai_decide' ? 'Surprise Me' : (prev.coreEmotion === 'Surprise Me' ? CORE_EMOTIONS[1] : prev.coreEmotion)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEpisodeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value);
    if (isNaN(index)) return; // Custom / none selected
    
    const ep = SEASON_1_EPISODES[index];
    setFormData(prev => ({
      ...prev,
      storySource: ep.title,
      modernTranslation: ep.moment,
      hiddenLesson: ep.theme,
      coreEmotion: CORE_EMOTIONS[0] // Reset to first option
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Generate lyrics via Gemini
      const generatedLyrics = await generateSong(
        formData.producer,
        formData.vocalist,
        formData.creationMode,
        formData.storySource,
        formData.useOriginalForm,
        formData.modernTranslation,
        formData.coreEmotion,
        formData.hiddenLesson
      );

      // 2. Save to Firestore
      const songData = {
        userId: user.uid,
        producer: formData.producer.split(':')[0], // Just save the name
        vocalist: formData.vocalist.split(':')[0], // Just save the name
        creationMode: formData.creationMode,
        storySource: formData.creationMode === 'ai_decide' ? 'AI Generated Concept' : formData.storySource,
        useOriginalForm: formData.useOriginalForm,
        modernTranslation: formData.useOriginalForm ? '' : formData.modernTranslation,
        coreEmotion: formData.coreEmotion,
        hiddenLesson: formData.hiddenLesson,
        lyrics: generatedLyrics,
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'songs'), songData);
      
      // 3. Navigate to the new song
      navigate(`/song/${docRef.id}`);
    } catch (err) {
      console.error("Error creating song:", err);
      setError("Failed to generate song. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto relative">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full h-64 bg-yellow-500/5 blur-[100px] pointer-events-none"></div>
      
      <h1 className="text-5xl font-bold tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] mb-8">Write a New Song</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 mb-8 rounded-2xl backdrop-blur-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        {/* THE SOUND */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg space-y-6">
          <h2 className="text-2xl font-bold tracking-widest uppercase border-b border-white/10 pb-2 text-gray-200">1. The Sound</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Producer Persona</label>
              <select
                name="producer"
                value={formData.producer}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 backdrop-blur-md transition-all appearance-none mb-3"
                required
              >
                {PRODUCERS.map(p => (
                  <option key={p} value={p} className="bg-slate-900">{p.split(':')[0]}</option>
                ))}
              </select>
              <div className="text-xs text-yellow-400/80 bg-yellow-400/10 p-4 rounded-2xl border border-yellow-400/20 backdrop-blur-md">
                <span className="font-bold uppercase tracking-widest block mb-1 text-yellow-400">Style Tags:</span>
                {formData.producer.split(':')[1]?.trim()}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Vocalist Persona</label>
              <select
                name="vocalist"
                value={formData.vocalist}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 backdrop-blur-md transition-all appearance-none mb-3"
                required
              >
                {VOCALISTS.map(v => (
                  <option key={v} value={v} className="bg-slate-900">{v.split(':')[0]}</option>
                ))}
              </select>
              <div className="text-xs text-yellow-400/80 bg-yellow-400/10 p-4 rounded-2xl border border-yellow-400/20 backdrop-blur-md">
                <span className="font-bold uppercase tracking-widest block mb-1 text-yellow-400">Style Tags:</span>
                {formData.vocalist.split(':')[1]?.trim()}
              </div>
            </div>
          </div>
        </div>

        {/* THE VIBE AND HEART */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="text-2xl font-bold tracking-widest uppercase text-gray-200">2. The Vibe & Heart</h2>
          </div>

          <div className="flex flex-wrap gap-3 mb-6 bg-white/5 p-2 rounded-full border border-white/10 backdrop-blur-md w-fit">
            <button
              type="button"
              onClick={() => handleModeChange('structured')}
              className={`px-6 py-2.5 text-sm font-bold uppercase tracking-widest transition-all duration-300 rounded-full ${formData.creationMode === 'structured' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5'}`}
            >
              Guided Form
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('pasted')}
              className={`px-6 py-2.5 text-sm font-bold uppercase tracking-widest transition-all duration-300 rounded-full ${formData.creationMode === 'pasted' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5'}`}
            >
              Paste a Story
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('ai_decide')}
              className={`px-6 py-2.5 text-sm font-bold uppercase tracking-widest transition-all duration-300 rounded-full ${formData.creationMode === 'ai_decide' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5'}`}
            >
              Surprise Me
            </button>
          </div>
          
          {formData.creationMode === 'structured' && (
            <>
              <div className="bg-yellow-400/10 border border-yellow-400/20 p-6 rounded-2xl mb-6 backdrop-blur-md">
                <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">Season 1: Aesop's Fables (Quick Fill)</label>
                <select
                  onChange={handleEpisodeSelect}
                  defaultValue="custom"
                  className="w-full bg-black/40 border border-white/10 text-white p-4 rounded-xl focus:outline-none focus:border-yellow-400/50 appearance-none"
                >
                  <option value="custom" className="bg-slate-900">-- Select an Episode to Auto-Fill --</option>
                  {SEASON_1_EPISODES.map((ep, idx) => (
                    <option key={idx} value={idx} className="bg-slate-900">{ep.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Story Source</label>
                <p className="text-xs text-gray-500 mb-2">The raw situation or fable (e.g., The Boy Who Cried Wolf, Icarus, a bad breakup).</p>
                <input
                  type="text"
                  name="storySource"
                  value={formData.storySource}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 backdrop-blur-md transition-all"
                  required={formData.creationMode === 'structured'}
                  placeholder="e.g., The Tortoise and the Hare"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="useOriginalForm"
                  name="useOriginalForm"
                  checked={formData.useOriginalForm}
                  onChange={handleChange}
                  className="w-5 h-5 accent-yellow-400 bg-white/5 border-white/10 rounded"
                />
                <label htmlFor="useOriginalForm" className="text-sm font-bold uppercase tracking-widest text-yellow-400 cursor-pointer hover:text-yellow-300 transition-colors">
                  Use Original Story Setting (No Modernization)
                </label>
              </div>

              {!formData.useOriginalForm && (
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Modern Translation</label>
                  <p className="text-xs text-gray-500 mb-2">How this looks in the real world today.</p>
                  <textarea
                    name="modernTranslation"
                    value={formData.modernTranslation}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 backdrop-blur-md transition-all"
                    required={formData.creationMode === 'structured' && !formData.useOriginalForm}
                    placeholder="e.g., A hustler burning out trying to get rich quick vs. someone building slow wealth."
                  />
                </div>
              )}
            </>
          )}

          {formData.creationMode === 'pasted' && (
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Paste Your Story</label>
              <p className="text-xs text-gray-500 mb-2">Paste any story, article, or text here. The AI will adapt it into a song.</p>
              <textarea
                name="storySource"
                value={formData.storySource}
                onChange={handleChange}
                rows={6}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 backdrop-blur-md transition-all"
                required={formData.creationMode === 'pasted'}
                placeholder="Paste your story here..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Core Emotion</label>
            <p className="text-xs text-gray-500 mb-2">One driving word (e.g., pain, pride, grief, hope, rage, love).</p>
            <select
              name="coreEmotion"
              value={formData.coreEmotion}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 backdrop-blur-md transition-all appearance-none"
              required
            >
              {CORE_EMOTIONS.map(e => (
                <option key={e} value={e} disabled={formData.creationMode !== 'ai_decide' && e === 'Surprise Me'} className="bg-slate-900">{e}</option>
              ))}
            </select>
          </div>

          {formData.creationMode === 'structured' && (
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">The Hidden Lesson</label>
              <p className="text-xs text-gray-500 mb-2">What the listener should realize on their own.</p>
              <textarea
                name="hiddenLesson"
                value={formData.hiddenLesson}
                onChange={handleChange}
                rows={2}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 backdrop-blur-md transition-all"
                required={formData.creationMode === 'structured'}
                placeholder="e.g., Speed without direction is just a faster way to crash."
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold py-5 px-8 rounded-full uppercase tracking-widest hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-8 text-lg"
        >
          {loading ? 'Writing Verses...' : 'Generate Song'}
        </button>
      </form>
    </div>
  );
}
