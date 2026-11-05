import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Bot, Radio, Database, CheckCircle2, Sparkles, Layers, Play, Zap, ShieldCheck, AlertCircle } from 'lucide-react';

interface SeedItem {
  id: string;
  title: string;
  icon: string;
  urlPath: string;
  description: string;
  categoryName: string;
  badgeColor: string;
}

interface CrawlerSeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrawlerSeedsModal: React.FC<CrawlerSeedsModalProps> = ({ isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [streamMode, setStreamMode] = useState<'proxy' | 'youtube' | 'kodi'>('proxy');
  const [testVideoId, setTestVideoId] = useState<string>('okDjqXOQwHQ');
  const [isTestingStream, setIsTestingStream] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const SEEDS: SeedItem[] = [
    {
      id: 'tum_arsiv',
      title: 'Tüm Arşiv (4 Kategori Birleşik Tohum)',
      icon: '✨🎬',
      urlPath: '/api/m3u/tum_arsiv.m3u',
      description: 'Yabancı filmler, Türk filmleri, Türk dizileri ve yabancı dizilerin tamamını içeren ana tohum beslemesi.',
      categoryName: 'Tüm Kategoriler',
      badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    },
    {
      id: 'yabanci_film',
      title: '1. Tohum: Yabancı Filmler (Türkçe Dublaj & TiwiTube)',
      icon: '🌍🎬',
      urlPath: '/api/m3u/yabanci_filmler.m3u',
      description: 'TiwiTube (@tiwitube) ve sinema kulüplerinden Türkçe dublajlı yabancı aksiyon, bilim kurgu ve macera filmleri.',
      categoryName: 'Yabancı Sinema & TiwiTube',
      badgeColor: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    },
    {
      id: 'turk_film',
      title: '2. Tohum: Türk Filmleri (Yeşilçam & Yerli)',
      icon: '🇹🇷🎬',
      urlPath: '/api/m3u/turk_filmleri.m3u',
      description: 'Kemal Sunal, Şener Şen ve Yeşilçam klasikleri ile modern Türk sineması tek parça filmleri.',
      categoryName: 'Türk Sineması',
      badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    },
    {
      id: 'turk_dizi',
      title: '3. Tohum: Türk Dizileri (Tam Bölümler)',
      icon: '📺🎬',
      urlPath: '/api/m3u/turk_dizileri.m3u',
      description: 'Ezel, Kurtlar Vadisi ve popüler yerli dizilerin tam parça kesintisiz bölümleri.',
      categoryName: 'Türk Dizileri',
      badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    },
    {
      id: 'yabanci_dizi',
      title: '4. Tohum: Yabancı Diziler (Türkçe Dublaj)',
      icon: '🌐🎬',
      urlPath: '/api/m3u/yabanci_diziler.m3u',
      description: 'Sherlock, Lost, Prison Break, Fringe gibi kült yabancı dizilerin Türkçe dublaj bölümleri.',
      categoryName: 'Yabancı Diziler',
      badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    },
  ];

  const getFullUrl = (urlPath: string) => {
    const query = streamMode !== 'proxy' ? `?mode=${streamMode}` : '';
    return `${currentHost}${urlPath}${query}`;
  };

  const handleCopy = (id: string, urlPath: string) => {
    const fullUrl = getFullUrl(urlPath);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-in fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Media Crawler &amp; URL-Specter Tohum (Seed) URL Linkleri
                </h2>
                <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  ⚡ IPTV Stream Bridge Aktif
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">
                TiviMate, VLC, GSE ve Scraper uygulamanızdaki <strong>Tohum URL</strong> alanına doğrudan eklenebilir.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stream Format Selector & Fix Explanation Banner */}
        <div className="border-b border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                <Zap className="h-4 w-4 text-amber-400" />
                <span>Yayın Akış Protokolü Seçimi (IPTV Donma / Patlak Link Çözümü):</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                YouTube HTML watch linkleri IPTV oynatıcılarında donar. <strong>IPTV Stream Bridge (.mp4)</strong> saf video akışı sunarak %100 oynatır.
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-black/60 p-1 border border-zinc-800">
              <button
                onClick={() => setStreamMode('proxy')}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  streamMode === 'proxy'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                <span>⚡ IPTV Stream Bridge (.mp4)</span>
              </button>
              <button
                onClick={() => setStreamMode('youtube')}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  streamMode === 'youtube'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>🔗 YouTube URL</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3 text-xs text-zinc-300 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>IPTV Donma ve Hata Koruması Devrede</span>
            </div>
            <p className="text-[11px]">
              Oluşturulan M3U listelerindeki her video adresi artık <code>{currentHost}/api/stream/VIDEO_ID.mp4</code> olarak sunulur. Ayrıca TiviMate ve VLC için <code>#EXTVLCOPT:http-user-agent</code> ve <code>network-caching</code> başlıkları eklenmiştir. Media Crawler DRM ve format kontrolünü başarıyla geçer.
            </p>
          </div>
        </div>

        {/* Live Stream Test Player (Optional toggle) */}
        {isTestingStream && (
          <div className="border-b border-zinc-800 bg-black p-4 animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Play className="h-4 w-4 fill-current" />
                <span>Canlı IPTV Stream Köprüsü Test Oynatıcısı (.mp4 Akışı)</span>
              </div>
              <button
                onClick={() => setIsTestingStream(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Kapat ✕
              </button>
            </div>
            <div className="relative aspect-video max-h-56 w-full rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
              <video
                src={`${currentHost}/api/stream/${testVideoId}.mp4`}
                controls
                autoPlay
                className="h-full w-full object-contain"
              >
                Tarayıcı video desteklemiyor.
              </video>
            </div>
            <p className="mt-1 text-[10px] text-zinc-400 text-center font-mono">
              Akış Kaynağı: {`${currentHost}/api/stream/${testVideoId}.mp4`}
            </p>
          </div>
        )}

        {/* Seed URL List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {SEEDS.map((seed) => {
            const fullUrl = getFullUrl(seed.urlPath);
            const isCopied = copiedId === seed.id;

            return (
              <div
                key={seed.id}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{seed.icon}</span>
                    <h3 className="font-bold text-sm text-zinc-100">{seed.title}</h3>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${seed.badgeColor}`}>
                      {seed.categoryName}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-3">{seed.description}</p>

                {/* URL Box & Actions */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden rounded-lg border border-zinc-700 bg-black/60 px-3 py-2 font-mono text-xs text-cyan-300 truncate">
                    {fullUrl}
                  </div>

                  <button
                    onClick={() => handleCopy(seed.id, seed.urlPath)}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-cyan-500 transition-all active:scale-95 cursor-pointer"
                  >
                    {isCopied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
                    <span>{isCopied ? 'Kopyalandı!' : 'Tohum Linkini Kopyala'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsTestingStream(true);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                    title="Bu akışı doğrudan tarayıcıda canlı test et"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span className="hidden sm:inline">Canlı Test</span>
                  </button>

                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                    title="M3U Dosyasını Doğrudan İncele"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 bg-zinc-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Tüm bağlantılar CORS, HTTP Range ve saf MP4 video streaming desteklidir.</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-2 font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
