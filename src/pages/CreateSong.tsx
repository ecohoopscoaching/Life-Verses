import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateSong } from '../services/geminiService';
import { PRODUCERS, VOCALISTS } from '../data/personas';

const SEASON_1_EPISODES = [
  {
    title: "Episode 1: The Tortoise and the Hare",
    theme: "Discipline beats arrogance.",
    moment: "You’re so far ahead… you stop taking it serious. Then someone you ignored starts getting closer."
  },
  {
    title: "Episode 2: The Boy Who Cried Wolf",
    theme: "Lies destroy trust.",
    moment: "You joke too many times… people stop believing you. Now something real happens… and nobody moves."
  },
  {
    title: "Episode 3: The Fox and the Crow",
    theme: "Flattery can manipulate you.",
    moment: "Someone tells you exactly what you want to hear. And for a second… you forget to think."
  },
  {
    title: "Episode 4: The Ant and the Grasshopper",
    theme: "Work now, enjoy later.",
    moment: "You’re having fun while someone else is locked in. Right now it feels like you’re winning."
  },
  {
    title: "Episode 5: The Lion and the Mouse",
    theme: "Even the small can help the powerful.",
    moment: "You look at someone and think they don’t matter. Later… you might need them."
  },
  {
    title: "Episode 6: The Fox and the Grapes",
    theme: "People often dismiss what they cannot have.",
    moment: "You want something bad… but can’t get it. So you start telling yourself you didn’t want it anyway."
  },
  {
    title: "Episode 7: The Crow and the Pitcher",
    theme: "Intelligence and persistence solve problems.",
    moment: "Nothing is working… no matter how hard you try. So you stop forcing it… and try something different."
  },
  {
    title: "Episode 8: The Dog and the Shadow",
    theme: "Greed can make you lose everything.",
    moment: "You already have something good. Then you see something that looks better… and it messes with your head."
  },
  {
    title: "Episode 9: The Goose That Laid the Golden Eggs",
    theme: "Greed destroys blessings.",
    moment: "You’ve got something steady. But patience feels too slow… and you want it all now."
  },
  {
    title: "Episode 10: The Town Mouse and the Country Mouse",
    theme: "Peaceful life vs luxury with danger.",
    moment: "One life looks safe but boring. The other looks exciting… but something feels off."
  },
  {
    title: "Episode 11: The Wolf in Sheep’s Clothing",
    theme: "Appearances can deceive.",
    moment: "Everything looks normal. But something about it doesn’t feel right."
  },
  {
    title: "Episode 12: The Bundle of Sticks",
    theme: "Strength in unity.",
    moment: "Alone, things feel heavy. Together… it’s different."
  },
  {
    title: "Episode 13: The Milkmaid and Her Pail",
    theme: "Don’t count your chickens before they hatch.",
    moment: "You start planning your future off something that hasn’t even happened yet. In your head… it’s already real."
  },
  {
    title: "Episode 14: The Fox and the Stork",
    theme: "Treat others the way you want to be treated.",
    moment: "You treat someone a certain way… thinking it’s nothing. Then it comes back around."
  },
  {
    title: "Episode 15: The Eagle and the Tortoise",
    theme: "Know your limits.",
    moment: "You try something you were never built for. And it feels exciting… until it doesn’t."
  }
];

const CORE_EMOTIONS = [
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
    storySource: '',
    useOriginalForm: false,
    modernTranslation: '',
    coreEmotion: CORE_EMOTIONS[0],
    hiddenLesson: ''
  });

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
        storySource: formData.storySource,
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-5xl font-bold tracking-tighter uppercase text-[#f4d03f] mb-8">Write a New Song</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 mb-8">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* THE SOUND */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-widest uppercase border-b border-[#f4d03f]/20 pb-2">1. The Sound</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Producer Persona</label>
              <select
                name="producer"
                value={formData.producer}
                onChange={handleChange}
                className="w-full bg-[#0a1128] border border-[#f4d03f]/50 text-white p-4 focus:outline-none focus:border-[#f4d03f] appearance-none mb-2"
                required
              >
                {PRODUCERS.map(p => (
                  <option key={p} value={p}>{p.split(':')[0]}</option>
                ))}
              </select>
              <div className="text-xs text-[#f4d03f]/80 bg-[#f4d03f]/10 p-3 border border-[#f4d03f]/20">
                <span className="font-bold uppercase tracking-widest block mb-1">Style Tags:</span>
                {formData.producer.split(':')[1]?.trim()}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Vocalist Persona</label>
              <select
                name="vocalist"
                value={formData.vocalist}
                onChange={handleChange}
                className="w-full bg-[#0a1128] border border-[#f4d03f]/50 text-white p-4 focus:outline-none focus:border-[#f4d03f] appearance-none mb-2"
                required
              >
                {VOCALISTS.map(v => (
                  <option key={v} value={v}>{v.split(':')[0]}</option>
                ))}
              </select>
              <div className="text-xs text-[#f4d03f]/80 bg-[#f4d03f]/10 p-3 border border-[#f4d03f]/20">
                <span className="font-bold uppercase tracking-widest block mb-1">Style Tags:</span>
                {formData.vocalist.split(':')[1]?.trim()}
              </div>
            </div>
          </div>
        </div>

        {/* THE VIBE AND HEART */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#f4d03f]/20 pb-2">
            <h2 className="text-2xl font-bold tracking-widest uppercase">2. The Vibe & Heart</h2>
          </div>
          
          <div className="bg-[#f4d03f]/10 border border-[#f4d03f]/30 p-4 mb-6">
            <label className="block text-sm font-bold uppercase tracking-widest text-[#f4d03f] mb-2">Season 1: Aesop's Fables (Quick Fill)</label>
            <select
              onChange={handleEpisodeSelect}
              defaultValue="custom"
              className="w-full bg-[#0a1128] border border-[#f4d03f]/50 text-white p-3 focus:outline-none focus:border-[#f4d03f] appearance-none"
            >
              <option value="custom">-- Select an Episode to Auto-Fill --</option>
              {SEASON_1_EPISODES.map((ep, idx) => (
                <option key={idx} value={idx}>{ep.title}</option>
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
              className="w-full bg-[#0a1128] border border-[#f4d03f]/50 text-white p-4 focus:outline-none focus:border-[#f4d03f]"
              required
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
              className="w-5 h-5 accent-[#f4d03f] bg-[#0a1128] border-[#f4d03f]"
            />
            <label htmlFor="useOriginalForm" className="text-sm font-bold uppercase tracking-widest text-[#f4d03f] cursor-pointer">
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
                className="w-full bg-[#0a1128] border border-[#f4d03f]/50 text-white p-4 focus:outline-none focus:border-[#f4d03f]"
                required={!formData.useOriginalForm}
                placeholder="e.g., A hustler burning out trying to get rich quick vs. someone building slow wealth."
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
              className="w-full bg-[#0a1128] border border-[#f4d03f]/50 text-white p-4 focus:outline-none focus:border-[#f4d03f] appearance-none"
              required
            >
              {CORE_EMOTIONS.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">The Hidden Lesson</label>
            <p className="text-xs text-gray-500 mb-2">What the listener should realize on their own.</p>
            <textarea
              name="hiddenLesson"
              value={formData.hiddenLesson}
              onChange={handleChange}
              rows={2}
              className="w-full bg-[#0a1128] border border-[#f4d03f]/50 text-white p-4 focus:outline-none focus:border-[#f4d03f]"
              required
              placeholder="e.g., Speed without direction is just a faster way to crash."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#f4d03f] text-[#0a1128] font-bold py-4 px-8 rounded-none uppercase tracking-widest hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
        >
          {loading ? 'Writing Verses...' : 'Generate Song'}
        </button>
      </form>
    </div>
  );
}
