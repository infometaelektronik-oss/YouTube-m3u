import React from 'react';
import { Film, Terminal, ShieldCheck, Tv, Download, Copy, Play, Bot, Radio, Activity, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab: 'catalog' | 'series' | 'python' | 'regex' | 'channels';
  setActiveTab: (tab: 'catalog' | 'series' | 'python' | 'regex' | 'channels') => void;
  approvedCount: number;
  rejectedCount: number;
  onOpenM3U: () => void;
  onDownloadM3U: () => void;
  onOpenSeedsModal?: () => void;
  onOpenDiagnosticModal?: () => void;
  onOpenTgModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  approvedCount,
  rejectedCount,
  onOpenM3U,
  onDownloadM3U,
  onOpenSeedsModal,
  onOpenDiagnosticModal,
  onOpenTgModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 shadow-lg shadow-rose-950/50">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                Yerli <span className="text-rose-500">&amp; Türkçe Dublaj</span> M3U8
              </span>
              <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-rose-400">
                🌐 Modül 2
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Türkçe Dublaj Yabancı + Yerli Film &amp; Dizi IPTV Tarayıcısı
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'catalog'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Playlist &amp; Arşiv</span>
            <span className="ml-1 rounded-full bg-black/30 px-1.5 py-0.2 text-[10px] font-bold">
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('series')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'series'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-purple-400" />
            <span>Dizi Kütüphanesi</span>
            <span className="ml-1 rounded-full bg-purple-500/30 text-purple-200 px-1.5 py-0.2 text-[10px] font-bold">
              Sezonlar
            </span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'python'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Python Betikleri (Termux/PC)</span>
          </button>

          <button
            onClick={() => setActiveTab('regex')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'regex'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Filtre Laboratuvarı</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenTgModal && (
            <button
              onClick={onOpenTgModal}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/50 bg-gradient-to-r from-purple-950/80 to-purple-900/60 px-3 py-1.5 text-xs font-bold text-purple-200 shadow-md shadow-purple-950/50 hover:border-purple-400 hover:text-white transition-all active:scale-95"
              title="TG. Dizi Film (1268a13e) Portalına Film ve Dizi Aktar"
            >
              <Tv className="h-3.5 w-3.5 text-purple-400" />
              <span>✨ TG. Dizi Film Aktar</span>
            </button>
          )}

          {onOpenSeedsModal && (
            <button
              onClick={onOpenSeedsModal}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-900/60"
              title="Media Crawler ve URL-Specter Tohum Linkleri"
            >
              <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Tohum URL&apos;leri</span>
            </button>
          )}

          {onOpenDiagnosticModal && (
            <button
              onClick={onOpenDiagnosticModal}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-900/60"
              title="IPTV Oynatıcı ve Donanım Teşhis Laboratuvarı (Ayrı Test Bölümü)"
            >
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Test Laboratuvarı</span>
            </button>
          )}

          <button
            onClick={onOpenM3U}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
            title="M3U8 Listesini Görüntüle"
          >
            <Copy className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">M3U8 İncele</span>
          </button>

          <button
            onClick={onDownloadM3U}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-950/40 transition-transform active:scale-95 hover:bg-rose-500"
            title="Tüm Listeyi M3U8 Formatında İndir"
          >
            <Download className="h-3.5 w-3.5" />
            <span>M3U8 İndir</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="flex border-t border-zinc-900 px-4 py-2 md:hidden overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
            activeTab === 'catalog' ? 'bg-rose-600 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <Tv className="h-3.5 w-3.5" />
          <span>Arşiv ({approvedCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
            activeTab === 'series' ? 'bg-purple-600 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Dizi Kütüphanesi</span>
        </button>
        <button
          onClick={() => setActiveTab('python')}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
            activeTab === 'python' ? 'bg-rose-600 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Python Betikleri</span>
        </button>
        <button
          onClick={() => setActiveTab('regex')}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
            activeTab === 'regex' ? 'bg-rose-600 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Filtre Testi</span>
        </button>
      </div>
    </header>
  );
};
