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
    <div className="min-h-screen bg-[#0a1128] text-gray-100 font-sans flex flex-col">
      <header className="border-b border-[#f4d03f]/20 bg-[#0a1128] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-[#f4d03f] text-2xl font-bold tracking-tighter uppercase">
            Life Verses
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-400 hidden sm:inline-block">{user.email}</span>
            <button
              onClick={onLogout}
              className="text-sm font-bold uppercase tracking-widest text-[#f4d03f] hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {children}
      </main>
    </div>
  );
}
