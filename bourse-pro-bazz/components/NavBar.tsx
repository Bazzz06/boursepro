'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Home, Briefcase, Filter, Eye, BarChart3, Search, LogOut } from 'lucide-react';

export default function NavBar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const tabs = [
    { href: '/', label: 'Terminal', Icon: Home },
    { href: '/portfolio', label: 'Portefeuille', Icon: Briefcase },
    { href: '/screener', label: 'Screener', Icon: Filter },
    { href: '/watchlist', label: 'Watchlist', Icon: Eye },
    { href: '/benchmark', label: 'Benchmark', Icon: BarChart3 },
  ];

  // Recherche avec debounce
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-[12px]">
            B°
          </div>
          <div>
            <div className="text-[14px] font-semibold text-neutral-900 leading-none">Bourse Terminal</div>
            <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">
              {userName ? `${userName} · ` : ''}Tech buy-and-hold
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  active ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <tab.Icon className="w-3.5 h-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex items-center gap-2 bg-neutral-100 rounded-md px-3 py-1.5 w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Rechercher un ticker..."
              className="flex-1 bg-transparent outline-none text-[12px]"
            />
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 w-full bg-white border border-neutral-200 rounded-md shadow-lg overflow-hidden z-50">
              {results.map((r) => (
                <button
                  key={r.symbol}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    router.push(`/stock/${r.symbol}`);
                    setQuery('');
                    setShowResults(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-neutral-100 text-neutral-900 px-1.5 py-0.5 rounded font-mono">
                      {r.displaySymbol}
                    </span>
                    <span className="text-[12px] text-neutral-700 truncate">{r.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors px-2 py-1.5"
          title="Déconnexion"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
