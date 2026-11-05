import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { CatalogView } from './components/CatalogView';
import { SeriesLibraryView } from './components/SeriesLibraryView';
import { PythonScriptView } from './components/PythonScriptView';
import { RegexPlayground } from './components/RegexPlayground';
import { M3uModal } from './components/M3uModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { RAW_CATALOG_DATABASE, OFFICIAL_CHANNELS } from './data/catalog';
import { VideoItem, FilterOptions } from './types';
import { evaluateTitle, generateM3U } from './utils/filterEngine';
import { CrawlerSeedsModal } from './components/CrawlerSeedsModal';
import { DiagnosticLabModal } from './components/DiagnosticLabModal';
import { TgDiziFilmModal } from './components/TgDiziFilmModal';
import { ContinuousScannerBar } from './components/ContinuousScannerBar';
import { CheckCircle2, ShieldCheck, Terminal, Tv } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'series' | 'python' | 'regex' | 'channels'>('catalog');
  const [isM3uModalOpen, setIsM3uModalOpen] = useState<boolean>(false);
  const [isSeedsModalOpen, setIsSeedsModalOpen] = useState<boolean>(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState<boolean>(false);
  const [isTgModalOpen, setIsTgModalOpen] = useState<boolean>(false);
  const [activePlayingVideo, setActivePlayingVideo] = useState<VideoItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    minDurationMinutes: 40,
    enableRegexBlacklist: true,
    enableInflectionMatching: true,
    boostPositiveKeywords: true,
    excludeSubtitles: true,
    activeModule: 'all',
    customBlacklistWords: [],
  });

  // Calculate filtered / approved items
  const evaluatedStats = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    const approvedItems: VideoItem[] = [];

    RAW_CATALOG_DATABASE.forEach((item) => {
      const res = evaluateTitle(item.title, item.duration, filterOptions);
      if (res.passed) {
        approved++;
        approvedItems.push(item);
      } else {
        rejected++;
      }
    });

    return { approved, rejected, approvedItems };
  }, [filterOptions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopySingleM3U = (video: VideoItem) => {
    const host = typeof window !== 'undefined' ? window.location.origin : '';
    const singleM3u = generateM3U([video], { streamUrlMode: 'iptv_proxy', baseUrl: host });
    navigator.clipboard.writeText(singleM3u);
    showToast(`"${video.cleanTitle}" IPTV Stream (.mp4) satırı kopyalandı!`);
  };

  const handleDownloadM3U = () => {
    const host = typeof window !== 'undefined' ? window.location.origin : '';
    const m3uContent = generateM3U(evaluatedStats.approvedItems, { streamUrlMode: 'iptv_proxy', baseUrl: host });
    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'yerli_ve_yabanci_sinema_dizi_iptv.m3u';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('IPTV Stream Bridge (.mp4) uyumlu M3U listesi başarıyla indirildi!');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-600/40">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        approvedCount={evaluatedStats.approved}
        rejectedCount={evaluatedStats.rejected}
        onOpenM3U={() => setIsM3uModalOpen(true)}
        onDownloadM3U={handleDownloadM3U}
        onOpenSeedsModal={() => setIsSeedsModalOpen(true)}
        onOpenDiagnosticModal={() => setIsDiagnosticModalOpen(true)}
        onOpenTgModal={() => setIsTgModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {/* TG. Dizi Film Direct Integration Hero Alert */}
        <div className="mb-4 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/70 via-zinc-900/90 to-purple-950/50 p-4 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/30 border border-purple-500/50 text-purple-300">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  TG. Dizi Film (1268a13e) İçe Aktarma Köprüsü
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Yayına Hazır
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                TG. Dizi Film portalınızdaki <strong>&ldquo;Filmler (0 Başlık)&rdquo;</strong> ve <strong>&ldquo;Diziler&rdquo;</strong> sayfalarını tek tıkla canlı doldurun.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsTgModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-950/40 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95"
            >
              <Tv className="h-4 w-4" />
              <span>✨ TG. Dizi Film&apos;e Aktar</span>
            </button>
            <button
              onClick={() => setIsDiagnosticModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              <span>🧪 Test Laboratuvarı</span>
            </button>
          </div>
        </div>

        {/* Continuous Autonomous Scanner Bar */}
        <ContinuousScannerBar
          onOpenSeedsModal={() => setIsSeedsModalOpen(true)}
          onScanCompleted={(msg) => showToast(msg)}
        />

        {activeTab === 'catalog' && (
          <CatalogView
            items={RAW_CATALOG_DATABASE}
            filterOptions={filterOptions}
            setFilterOptions={setFilterOptions}
            onPlayVideo={(video) => setActivePlayingVideo(video)}
            onCopySingleM3U={handleCopySingleM3U}
            onOpenSeedsModal={() => setIsSeedsModalOpen(true)}
          />
        )}

        {activeTab === 'series' && (
          <SeriesLibraryView
            items={RAW_CATALOG_DATABASE}
            onPlayVideo={(video) => setActivePlayingVideo(video)}
            onCopySingleM3U={handleCopySingleM3U}
            onShowToast={showToast}
            onOpenTgModal={() => setIsTgModalOpen(true)}
          />
        )}

        {activeTab === 'python' && <PythonScriptView />}

        {activeTab === 'regex' && <RegexPlayground />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-6 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>
              Yerli &amp; Yabancı Sinema/Dizi M3U8 Generator | TiwiTube &amp; Otonom Scraper Tohumu
            </span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>TiwiTube (@tiwitube) Entegre</span>
            <span>•</span>
            <span>4 Ayrık Kategori (Yapay Zeka Destekli)</span>
            <span>•</span>
            <span>Media Crawler &amp; URL-Specter Uyumlu</span>
          </div>
        </div>
      </footer>

      {/* TG. Dizi Film Integration Modal */}
      <TgDiziFilmModal
        isOpen={isTgModalOpen}
        onClose={() => setIsTgModalOpen(false)}
        items={evaluatedStats.approvedItems}
      />

      {/* M3U Modal */}
      <M3uModal
        isOpen={isM3uModalOpen}
        onClose={() => setIsM3uModalOpen(false)}
        items={evaluatedStats.approvedItems}
      />

      {/* Crawler Seeds Modal (Media Crawler & URL-Specter) */}
      <CrawlerSeedsModal
        isOpen={isSeedsModalOpen}
        onClose={() => setIsSeedsModalOpen(false)}
      />

      {/* Dedicated Diagnostic & Hardware Test Lab Modal */}
      <DiagnosticLabModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
      />

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={activePlayingVideo}
        onClose={() => setActivePlayingVideo(null)}
        onCopySingleM3U={handleCopySingleM3U}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-zinc-900/95 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
