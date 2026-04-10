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
      <div className="min-h-screen bg-[#0a1128] text-[#f4d03f] flex items-center justify-center font-sans">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Loading...</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a1128] text-[#f4d03f] flex flex-col items-center justify-center font-sans p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tighter uppercase mb-4">Life Verses</h1>
          <p className="text-gray-300 text-lg mb-8">
            Turn timeless fables and real life struggles into high quality hip hop and R&B songs.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full bg-[#f4d03f] text-[#0a1128] font-bold py-4 px-8 rounded-none uppercase tracking-widest hover:bg-yellow-500 transition-colors"
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
