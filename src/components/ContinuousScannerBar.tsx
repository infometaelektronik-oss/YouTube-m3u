import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Play, Pause, Bot, CheckCircle2, Clock, ExternalLink, Zap } from 'lucide-react';

interface ContinuousScannerBarProps {
  onOpenSeedsModal: () => void;
  onScanCompleted?: (message: string) => void;
}

export const ContinuousScannerBar: React.FC<ContinuousScannerBarProps> = ({
  onOpenSeedsModal,
  onScanCompleted,
}) => {
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(true);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(15);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [isScanningNow, setIsScanningNow] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<string>(new Date().toLocaleTimeString());
  const [discoveredCount, setDiscoveredCount] = useState<number>(48);

  // Countdown timer effect
  useEffect(() => {
    if (!isAutoEnabled) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Trigger scan when countdown hits 0
          triggerScan();
          return intervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoEnabled, intervalMinutes]);

  const triggerScan = async () => {
    try {
      setIsScanningNow(true);
      const res = await fetch('/api/crawler/trigger-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setLastScanTime(new Date().toLocaleTimeString());
      setDiscoveredCount((prev) => prev + 1);
      if (onScanCompleted) {
        onScanCompleted(data.message || 'TiwiTube ve tohum kanalları tarandı!');
      }
    } catch (e) {
      console.error('Trigger scan error:', e);
    } finally {
      setIsScanningNow(false);
      setSecondsRemaining(intervalMinutes * 60);
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-zinc-900/90 to-zinc-950 p-4 shadow-xl mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Status & Target Channel Info */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="h-5 w-5" />
            {isAutoEnabled && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white tracking-tight">
                Otonom Canlı Tarayıcı (Devamlı Tarama Motoru)
              </span>
              <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                URL-Specter &amp; TiwiTube
              </span>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                ⚡ Stream Bridge: .mp4 Aktif
              </span>
              <a
                href="https://youtube.com/@tiwitube?si=h6LGI7QESSIK3Xhd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 transition-colors"
                title="TiwiTube Resmi Kanalını Aç"
              >
                <span>@tiwitube</span>
                <ExternalLink className="h-2.5 w-2.5 text-zinc-400" />
              </a>
            </div>

            <p className="mt-0.5 text-xs text-zinc-400">
              {isAutoEnabled ? (
                <span>
                  🟢 <strong>Aktif:</strong> Sistem her {intervalMinutes} dakikada bir TiwiTube ve 4 kategoriyi tarayıp M3U tohumlarını günceller.
                </span>
              ) : (
                <span>⏸️ Otomatik periyodik tarama duraklatıldı.</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Controls: Timer, Interval, Trigger button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Countdown timer pill */}
          {isAutoEnabled && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-black/60 px-3 py-1.5 text-xs font-mono text-cyan-300">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sonraki Tarama:</span>
              <strong className="text-white text-sm">{formatCountdown(secondsRemaining)}</strong>
            </div>
          )}

          {/* Interval selector */}
          <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-900 p-1 text-xs">
            {[
              { val: 5, label: '5 dk' },
              { val: 15, label: '15 dk' },
              { val: 30, label: '30 dk' },
            ].map((it) => (
              <button
                key={it.val}
                onClick={() => {
                  setIntervalMinutes(it.val);
                  setSecondsRemaining(it.val * 60);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  intervalMinutes === it.val
                    ? 'bg-cyan-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {it.label}
              </button>
            ))}
          </div>

          {/* Auto toggle */}
          <button
            onClick={() => setIsAutoEnabled(!isAutoEnabled)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
              isAutoEnabled
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {isAutoEnabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isAutoEnabled ? 'Durdur' : 'Devamlı Başlat'}</span>
          </button>

          {/* Manual Trigger Button */}
          <button
            onClick={triggerScan}
            disabled={isScanningNow}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-950/40 hover:from-cyan-500 hover:to-blue-500 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanningNow ? 'animate-spin' : ''}`} />
            <span>{isScanningNow ? 'Taranıyor...' : '🔄 Şimdi Tara'}</span>
          </button>

          {/* Seed Links Button */}
          <button
            onClick={onOpenSeedsModal}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <Bot className="h-3.5 w-3.5 text-cyan-400" />
            <span>Tohum URL&apos;leri</span>
          </button>
        </div>
      </div>
    </div>
  );
};
