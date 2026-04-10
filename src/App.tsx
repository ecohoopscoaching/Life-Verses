/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './firebase';
import Home from './pages/Home';
import CreateSong from './pages/CreateSong';
import SongView from './pages/SongView';
import SeasonView from './pages/SeasonView';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a1128] to-black flex items-center justify-center font-sans">
        <h1 className="text-2xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 animate-pulse">Loading...</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a1128] to-black flex flex-col items-center justify-center font-sans p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none"></div>
        
        <div className="max-w-md w-full text-center space-y-8 relative z-10 bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
          <h1 className="text-5xl font-bold tracking-tighter uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">Life Verses</h1>
          <p className="text-gray-300 text-lg mb-8 font-medium">
            Turn timeless fables and real life struggles into high quality hip hop and R&B songs.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold py-4 px-8 rounded-full uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(251,191,36,0.6)] transition-all duration-300"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/create" element={<CreateSong user={user} />} />
          <Route path="/song/:id" element={<SongView user={user} />} />
          <Route path="/season/:seasonId" element={<SeasonView user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
