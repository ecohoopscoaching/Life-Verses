import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Song } from '../types';
import { SEASON_1_EPISODES } from '../data/seasons';

export default function Home({ user }: { user: User }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'songs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSongs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Song[];
      setSongs(fetchedSongs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching songs:", err);
      setError("Failed to load your songs. Please try again.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  if (loading) {
    return <div className="text-[#f4d03f] uppercase tracking-widest font-bold">Loading your verses...</div>;
  }

  // Filter out custom songs (songs not in Season 1)
  const season1Titles = SEASON_1_EPISODES.map(ep => ep.title);
  const customSongs = songs.filter(song => !season1Titles.includes(song.storySource));

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] mb-2">Your Catalog</h1>
          <p className="text-gray-400 text-lg">The stories you've told. The lessons you've learned.</p>
        </div>
        <Link
          to="/create"
          className="inline-block bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold py-3 px-8 rounded-full uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-300 text-center"
        >
          Write New Song
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4">
          {error}
        </div>
      )}

      {/* SEASONS SECTION */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-widest uppercase border-b border-white/10 pb-2 text-gray-200">Seasons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/season/1"
            className="block bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:border-yellow-400/50 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              15 Episodes
            </div>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-2 group-hover:scale-105 transition-transform origin-left drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">SEASON ONE</h2>
            <p className="text-gray-300 text-lg mb-4">Aesop's Fables</p>
            <div className="text-sm text-yellow-400/80 uppercase tracking-wider font-bold group-hover:text-yellow-400 transition-colors">
              Explore Episodes &rarr;
            </div>
          </Link>
        </div>
      </div>

      {/* CUSTOM SONGS SECTION */}
      <div className="space-y-6 pt-8">
        <h2 className="text-2xl font-bold tracking-widest uppercase border-b border-white/10 pb-2 text-gray-200">Custom Tracks</h2>
        
        {customSongs.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
            <p className="text-gray-400 text-xl mb-6">No custom tracks yet.</p>
            <Link
              to="/create"
              className="text-yellow-400 font-bold uppercase tracking-widest hover:text-yellow-300 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all"
            >
              Write a custom song
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customSongs.map(song => (
              <Link
                key={song.id}
                to={`/song/${song.id}`}
                className="block bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-yellow-400/40 hover:shadow-[0_0_20px_rgba(251,191,36,0.1)] hover:-translate-y-1 transition-all duration-300 group"
              >
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-2 truncate group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">{song.coreEmotion}</h2>
                <p className="text-gray-300 mb-4 line-clamp-2">
                  {song.creationMode === 'pasted' ? song.storySource : song.modernTranslation || "Original Concept"}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 uppercase tracking-wider font-bold">
                  <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">{song.producer}</span>
                  <span>{new Date(song.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
