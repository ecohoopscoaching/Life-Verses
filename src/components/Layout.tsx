import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a1128] to-black text-gray-100 font-sans flex flex-col relative">
      {/* Global decorative glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
            Life Verses
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-400 hidden sm:inline-block bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">{user.email}</span>
            <button
              onClick={onLogout}
              className="text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-yellow-400 transition-colors bg-white/5 hover:bg-white/10 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 relative z-10">
        {children}
      </main>
    </div>
  );
}
