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
    return <div className="text-[#f4d03f] uppercase tracking-widest font-bold">Loading verses...</div>;
  }

  if (error || !song) {
    return (
      <div className="text-center space-y-6">
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 inline-block">
          {error || "Song not found."}
        </div>
        <div>
          <Link to="/" className="text-[#f4d03f] font-bold uppercase tracking-widest hover:underline">
            &larr; Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-between items-start">
        <Link to="/" className="text-gray-400 font-bold uppercase tracking-widest hover:text-[#f4d03f] transition-colors text-sm">
          &larr; Back
        </Link>
        <button 
          onClick={handleDelete}
          className="text-red-500 font-bold uppercase tracking-widest hover:text-red-400 transition-colors text-sm"
        >
          Delete Song
        </button>
      </div>

      <div className="border-b border-[#f4d03f]/20 pb-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase text-[#f4d03f] mb-6">
          {song.coreEmotion}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm mb-8">
          <div>
            <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-1">Producer</h3>
            <p className="text-gray-200">{song.producer}</p>
          </div>
          <div>
            <h3 className="text-gray-500 font-bold uppercase tracking-widest mb-1">Vocalist</h3>
            <p className="text-gray-200">{song.vocalist}</p>
          </div>
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
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleCopy(getStyleTags(song.lyrics), 'tags')}
            className="flex items-center gap-2 bg-[#0a1128] border border-[#f4d03f]/50 text-[#f4d03f] px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-[#f4d03f]/10 transition-colors"
          >
            {copiedField === 'tags' ? <Check size={16} /> : <Copy size={16} />}
            Copy Style Tags
          </button>
          <button
            onClick={() => handleCopy(getTitle(song.lyrics, song.storySource), 'title')}
            className="flex items-center gap-2 bg-[#0a1128] border border-[#f4d03f]/50 text-[#f4d03f] px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-[#f4d03f]/10 transition-colors"
          >
            {copiedField === 'title' ? <Check size={16} /> : <Copy size={16} />}
            Copy Title
          </button>
          <button
            onClick={() => handleCopy(getLyrics(song.lyrics), 'lyrics')}
            className="flex items-center gap-2 bg-[#f4d03f] text-[#0a1128] px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-yellow-500 transition-colors"
          >
            {copiedField === 'lyrics' ? <Check size={16} /> : <Copy size={16} />}
            Copy Lyrics
          </button>
        </div>
      </div>

      <div className="prose prose-invert prose-yellow max-w-none">
        <div className="markdown-body font-mono text-lg leading-relaxed whitespace-pre-wrap text-gray-300">
          <Markdown>{song.lyrics}</Markdown>
        </div>
      </div>
    </div>
  );
}
