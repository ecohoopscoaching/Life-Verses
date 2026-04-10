import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Song } from '../types';
import { SEASON_1_EPISODES } from '../data/seasons';

export default function SeasonView({ user }: { user: User }) {
  const { seasonId } = useParams<{ seasonId: string }>();
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
    return <div className="text-yellow-400 uppercase tracking-widest font-bold animate-pulse">Loading episodes...</div>;
  }

  // Currently only supporting Season 1
  if (seasonId !== '1') {
    return (
      <div className="text-center space-y-6">
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 inline-block rounded-2xl backdrop-blur-md">
          Season not found.
        </div>
        <div>
          <Link to="/" className="text-yellow-400 font-bold uppercase tracking-widest hover:text-yellow-300 transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <Link to="/" className="text-gray-400 font-bold uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-5xl font-bold tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] mb-2">Season 1</h1>
          <p className="text-gray-400 text-lg">Aesop's Fables</p>
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

      <div className="space-y-12">
        {SEASON_1_EPISODES.map((episode, index) => {
          // Find all songs that match this episode's title
          const episodeSongs = songs.filter(song => song.storySource === episode.title);

          return (
            <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-2">{episode.title}</h2>
                <p className="text-yellow-400/80 font-bold uppercase tracking-widest text-sm mb-2">Theme: {episode.theme}</p>
                <p className="text-gray-300 italic">"{episode.moment}"</p>
              </div>

              {episodeSongs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {episodeSongs.map(song => (
                    <Link
                      key={song.id}
                      to={`/song/${song.id}`}
                      className="block bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-yellow-400/40 hover:shadow-[0_0_20px_rgba(251,191,36,0.1)] hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-1 truncate group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">{song.coreEmotion}</h3>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-1">{song.modernTranslation || "Original Form"}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider font-bold">
                        <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">{song.producer}</span>
                        <span>{new Date(song.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-white/20 rounded-2xl bg-white/5">
                  <p className="text-gray-400 mb-4">No songs written for this episode yet.</p>
                  <Link
                    to="/create"
                    className="text-yellow-400 font-bold uppercase tracking-widest hover:text-yellow-300 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all text-sm"
                  >
                    Write a song for {episode.title.split(':')[0]}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
