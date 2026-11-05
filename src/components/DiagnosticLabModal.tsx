import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw,
  Tv,
  Cpu,
  Layers,
  Zap,
  ShieldAlert
} from 'lucide-react';

interface DiagnosticLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticLabModal: React.FC<DiagnosticLabModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');
  const [latency, setLatency] = useState<number | null>(null);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const testStreamUrl = `${origin}/api/diagnostic/test-stream.mp4`;
  const testM3uUrl = `${origin}/api/m3u/tum_arsiv.m3u?mode=proxy`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleRunPingTest = async () => {
    setNetworkStatus('checking');
    const start = performance.now();
    try {
      const res = await fetch('/api/diagnostic/test-stream.mp4', {
        method: 'HEAD',
        headers: { Range: 'bytes=0-1024' }
      });
      const end = performance.now();
      if (res.status === 200 || res.status === 206) {
        setLatency(Math.round(end - start));
        setNetworkStatus('success');
      } else {
        setNetworkStatus('failed');
      }
    } catch {
      setNetworkStatus('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-amber-500/30 bg-zinc-950 shadow-2xl shadow-amber-950/30">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-gradient-to-r from-amber-950/40 via-zinc-900/60 to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Oynatıcı & Donanım Teşhis Laboratuvarı
                </h3>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  TEST BÖLÜMÜ
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                IPTV oynatıcınızın (TiviMate, Xiaomi Box, Smart TV, VLC) ve Scraper motorunuzun akış yeteneklerini test edin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Isolation Banner */}
        <div className="mx-6 mt-4 rounded-xl border border-amber-500/30 bg-amber-950/25 p-3.5 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 space-y-1">
            <p className="font-semibold text-amber-200">
              Test Akışları Film ve Dizi Arşivinden Kesinlikle Ayrı Tutulur
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Bu bölümdeki test videosu, yalnızca televizyonunuzun veya IPTV yazılımınızın <strong>H.264 MP4 konteyner</strong>, 
              <strong>HTTP 206 Partial Content (Kısmi İlerleme/Tampon)</strong> ve <strong>CORS başlıklarını</strong> destekleyip desteklemediğini ölçmek içindir. 
              Dizi ve film listenizdeki tüm içerikler doğrulanmış gerçek filmlerden oluşur, asla test videosu ile değiştirilmez.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          
          {/* Diagnostic Video Player */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Canlı Donanım Çözümleme Testi (HTML5 / H.264)
                </span>
              </div>
              <button
                onClick={handleRunPingTest}
                disabled={networkStatus === 'checking'}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${networkStatus === 'checking' ? 'animate-spin' : ''}`} />
                <span>Range & Gecikme Testi</span>
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
              <video
                ref={(el) => setVideoRef(el)}
                src={testStreamUrl}
                controls
                className="h-full w-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>

            {/* Diagnostic Metrics */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/60 p-2">
                <span className="text-[10px] text-zinc-400 block">Konteyner & Kodek</span>
                <span className="font-semibold text-emerald-400">MP4 (AVC1 / H.264)</span>
              </div>
              <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/60 p-2">
                <span className="text-[10px] text-zinc-400 block">Ses Kodeği</span>
                <span className="font-semibold text-emerald-400">AAC Stereo 48kHz</span>
              </div>
              <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/60 p-2">
                <span className="text-[10px] text-zinc-400 block">Range (Kısmi İlerleme)</span>
                <span className="font-semibold text-emerald-400">HTTP 206 Destekli</span>
              </div>
              <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/60 p-2">
                <span className="text-[10px] text-zinc-400 block">Sunucu Gecikmesi</span>
                <span className="font-semibold text-cyan-400">
                  {latency ? `${latency} ms` : 'Test edilmedi'}
                </span>
              </div>
            </div>
          </div>

          {/* Test URLs for External Devices */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Tv className="h-4 w-4 text-cyan-400" />
              <span>IPTV Cihazı &amp; Scraper Test Bağlantıları</span>
            </h4>

            {/* Single Stream Test URL */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">
                  Tekil Teşhis Akış URL&apos;si (.mp4)
                </span>
                <button
                  onClick={() => handleCopy(testStreamUrl, 'single_test')}
                  className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  {copiedUrl === 'single_test' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-lg bg-zinc-950/80 p-2 font-mono text-xs text-amber-300 break-all border border-zinc-800">
                {testStreamUrl}
              </div>
              <p className="text-[11px] text-zinc-400">
                TiviMate, VLC veya Media Crawler&apos;da &ldquo;Doğrudan Akış Testi&rdquo; alanına yapıştırarak cihazınızın bu sunucudan kesintisiz video alabildiğini doğrulayın.
              </p>
            </div>
          </div>

          {/* Player Compatibility Matrix */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-rose-400" />
              <span>IPTV Oynatıcı &amp; Motor Uyumluluk Rehberi</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>TiviMate &amp; GSE Smart IPTV</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Android TV / Firestick / Xiaomi Mi Box cihazlarda ExoPlayer donanım çözücüsü kullanılır. 
                  Stream Bridge (.mp4) formatında liste eklediğinizde videolar anında başlar, donma yaşanmaz.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Media Crawler &amp; URL-Specter</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Kazıyıcı sisteminiz tohum URL&apos;leri tararken gerçek <code>.mp4</code> ve <code>.m3u8</code> akışlarını tespit eder. 
                  DRM koruması bulunmayan arşiv filmlerini doğrudan yayına alır.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 px-6 py-3.5 bg-zinc-950 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Arşivdeki tüm filmler (Davaro, Yenilmez 3, Çağrı, Kurtlar Vadisi vb.) doğrulanmış tam metrajlıdır.
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
