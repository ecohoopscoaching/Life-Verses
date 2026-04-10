import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Song } from '../types';
import Markdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';

export default function SongView({ user }: { user: User }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStyleTags = (text: string) => {
    const firstBracketIndex = text.indexOf('[');
    const searchArea = firstBracketIndex !== -1 ? text.substring(0, firstBracketIndex) : text;
    const lines = searchArea.split('\n').map(l => l.trim()).filter(l => l);
    const tagsLine = lines.find(l => !l.match(/^(Sound|Story|Emotion|Hidden Lesson|Title):/i));
    return tagsLine || '';
  };

  const getTitle = (text: string, fallback: string) => {
    const match = text.match(/^Title:\s*(.+)$/im);
    if (match) return match[1].trim();
    return fallback;
  };

  const getLyrics = (text: string) => {
    const firstBracketIndex = text.indexOf('[');
    if (firstBracketIndex !== -1) {
      return text.substring(firstBracketIndex).trim();
    }
    return text;
  };

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'songs', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Song;
          if (data.userId !== user.uid) {
            setError("You don't have permission to view this song.");
          } else {
            setSong({ id: docSnap.id, ...data });
          }
        } else {
          setError("Song not found.");
        }
      } catch (err) {
        console.error("Error fetching song:", err);
        setError("Failed to load song.");
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [id, user.uid]);

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this song?")) return;
    
    try {
      await deleteDoc(doc(db, 'songs', id));
      navigate('/');
    } catch (err) {
      console.error("Error deleting song:", err);
      alert("Failed to delete song.");
    }
  };

  if (loading) {
    return <div className="text-yellow-400 uppercase tracking-widest font-bold animate-pulse">Loading verses...</div>;
  }

  if (error || !song) {
    return (
      <div className="text-center space-y-6">
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 inline-block rounded-2xl backdrop-blur-md">
          {error || "Song not found."}
        </div>
        <div>
          <Link to="/" className="text-yellow-400 font-bold uppercase tracking-widest hover:text-yellow-300 transition-colors">
            &larr; Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-yellow-500/5 blur-[100px] pointer-events-none"></div>

      <div className="flex justify-between items-start relative z-10">
        <Link to="/" className="text-gray-400 font-bold uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
          &larr; Back
        </Link>
        <button 
          onClick={handleDelete}
          className="text-red-400 font-bold uppercase tracking-widest hover:text-red-300 transition-colors text-sm bg-white/5 hover:bg-red-500/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md"
        >
          Delete Song
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] mb-8">
          {song.coreEmotion}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm mb-10 bg-black/20 p-6 rounded-2xl border border-white/5">
          <div>
            <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-1">Producer</h3>
            <p className="text-gray-200">{song.producer}</p>
          </div>
          <div>
            <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-1">Vocalist</h3>
            <p className="text-gray-200">{song.vocalist}</p>
          </div>
          <div>
            <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-1">Creation Mode</h3>
            <p className="text-gray-200">
              {song.creationMode === 'structured' ? 'Guided Form' : song.creationMode === 'pasted' ? 'Pasted Story' : 'AI Decided'}
            </p>
          </div>
          
          {song.creationMode === 'structured' && (
            <>
              <div>
                <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-1">Story Source</h3>
                <p className="text-gray-200">{song.storySource}</p>
              </div>
              <div>
                <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-1">Setting</h3>
                <p className="text-gray-200">{song.useOriginalForm ? "Original Story Form" : song.modernTranslation}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-1">Hidden Lesson</h3>
                <p className="text-gray-200">{song.hiddenLesson}</p>
              </div>
            </>
          )}

          {song.creationMode === 'pasted' && (
            <div className="md:col-span-2">
              <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-1">Pasted Story</h3>
              <p className="text-gray-200 whitespace-pre-wrap line-clamp-3">{song.storySource}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleCopy(getStyleTags(song.lyrics), 'tags')}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-yellow-400 font-bold py-3 px-6 rounded-full uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(251,191,36,0.2)] text-sm backdrop-blur-md"
          >
            {copiedField === 'tags' ? <Check size={16} /> : <Copy size={16} />}
            Copy Style Tags
          </button>
          <button
            onClick={() => handleCopy(getTitle(song.lyrics, song.storySource), 'title')}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-yellow-400 font-bold py-3 px-6 rounded-full uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(251,191,36,0.2)] text-sm backdrop-blur-md"
          >
            {copiedField === 'title' ? <Check size={16} /> : <Copy size={16} />}
            Copy Title
          </button>
          <button
            onClick={() => handleCopy(getLyrics(song.lyrics), 'lyrics')}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold py-3 px-6 rounded-full uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-300 text-sm"
          >
            {copiedField === 'lyrics' ? <Check size={16} /> : <Copy size={16} />}
            Copy Lyrics
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10">
        <div className="prose prose-invert prose-yellow max-w-none">
          <div className="markdown-body font-mono text-lg leading-relaxed whitespace-pre-wrap text-gray-300">
            <Markdown>{song.lyrics}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
