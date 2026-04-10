import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Song } from '../types';

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

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter uppercase text-[#f4d03f] mb-2">Your Catalog</h1>
          <p className="text-gray-400 text-lg">The stories you've told. The lessons you've learned.</p>
        </div>
        <Link
          to="/create"
          className="inline-block bg-[#f4d03f] text-[#0a1128] font-bold py-3 px-8 rounded-none uppercase tracking-widest hover:bg-yellow-500 transition-colors text-center"
        >
          Write New Song
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4">
          {error}
        </div>
      )}

      {songs.length === 0 && !error ? (
        <div className="border border-[#f4d03f]/20 p-12 text-center">
          <p className="text-gray-400 text-xl mb-6">Your catalog is empty.</p>
          <Link
            to="/create"
            className="text-[#f4d03f] font-bold uppercase tracking-widest hover:underline"
          >
            Start writing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {songs.map(song => (
            <Link
              key={song.id}
              to={`/song/${song.id}`}
              className="block border border-[#f4d03f]/20 p-6 hover:border-[#f4d03f] transition-colors bg-[#0a1128]/50"
            >
              <h2 className="text-2xl font-bold text-[#f4d03f] mb-2 truncate">{song.coreEmotion}</h2>
              <p className="text-gray-300 mb-4 line-clamp-2">{song.modernTranslation}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 uppercase tracking-wider font-bold">
                <span>{song.producer}</span>
                <span>{new Date(song.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
