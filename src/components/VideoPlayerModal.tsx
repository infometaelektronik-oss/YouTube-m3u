import React, { useState } from 'react';
import { X, Play, Clock, Film, ExternalLink, Copy, Check, AlertCircle, RefreshCw, Volume2, Maximize2 } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoPlayerModalProps {
  video: VideoItem | null;
  onClose: () => void;
  onCopySingleM3U: (video: VideoItem) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onCopySingleM3U,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedVlc, setCopiedVlc] = useState(false);
  const [copiedStreamUrl, setCopiedStreamUrl] = useState(false);
  const [playerMode, setPlayerMode] = useState<'iptv_stream' | 'embed'>('iptv_stream');
  const [embedMode, setEmbedMode] = useState<'standard' | 'nocookie'>('standard');

  if (!video) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
  const streamEndpoint = video.streamUrl || `${currentHost}/api/stream/${video.id}.mp4`;

  const handleCopy = () => {
    onCopySingleM3U(video);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyStreamUrl = () => {
    navigator.clipboard.writeText(streamEndpoint);
    setCopiedStreamUrl(true);
    setTimeout(() => setCopiedStreamUrl(false), 2000);
  };

  const handleCopyVlcCommand = () => {
    const vlcCmd = `vlc "${streamEndpoint}"`;
    navigator.clipboard.writeText(vlcCmd);
    setCopiedVlc(true);
    setTimeout(() => setCopiedVlc(false), 2000);
  };

  // YouTube embed URL'si
  const embedBase = embedMode === 'standard' 
    ? 'https://www.youtube.com/embed/' 
    : 'https://www.youtube-nocookie.com/embed/';
  const embedUrl = `${embedBase}${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-5 backdrop-blur-md animate-in fade-in">
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 sm:px-6 py-3.5 bg-zinc-900/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
            <h2 className="text-sm font-bold text-white truncate max-w-md sm:max-w-lg">
              {video.cleanTitle}
            </h2>
            <div className="hidden sm:flex items-center gap-1 rounded-lg bg-zinc-800/80 p-0.5 border border-zinc-700 text-xs">
              <button
                onClick={() => setPlayerMode('iptv_stream')}
                className={`rounded px-2 py-0.5 font-semibold transition-all ${
                  playerMode === 'iptv_stream'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ⚡ IPTV Stream (.mp4)
              </button>
              <button
                onClick={() => setPlayerMode('embed')}
                className={`rounded px-2 py-0.5 font-semibold transition-all ${
                  playerMode === 'embed'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                📺 YouTube Embed
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyStreamUrl}
              className="flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
              title="IPTV Doğrudan MP4 Akış Linkini Kopyala"
            >
              {copiedStreamUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedStreamUrl ? 'MP4 Linki Alındı' : '⚡ MP4 Akış Linki'}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {playerMode === 'iptv_stream' ? (
            <video
              key={video.streamUrl || streamEndpoint}
              src={video.streamUrl || streamEndpoint}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-contain"
            >
              Tarayıcınız HTML5 video etiketini desteklemiyor.
            </video>
          ) : (
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={video.cleanTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0"
            />
          )}
        </div>

        {/* Playback Assistance Notice (Eğer video sahibi gömülü oynatmayı kısıtlamışsa) */}
        <div className="border-t border-zinc-800/60 bg-amber-950/20 px-4 sm:px-6 py-2.5 text-[11px] text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              Eğer video <strong>&quot;Oynatılamıyor&quot;</strong> veya <strong>&quot;YouTube&apos;da İzleyin&quot;</strong> uyarısı verirse (bazı resmi kanalların telif/reklam politikası gereği), doğrudan YouTube üzerinden açabilirsiniz.
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setEmbedMode((prev) => (prev === 'standard' ? 'nocookie' : 'standard'))}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 underline mr-2"
              title="Alternatif embed sunucusunu dene"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Alternatif Sunucu</span>
            </button>
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>YouTube&apos;da Kesintisiz İzle</span>
            </a>
          </div>
        </div>

        {/* Info & Metadata Footer (CSS Selector 4) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-900 bg-zinc-950 p-4 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100">{video.channel}</span>
              {video.year && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                  {video.year}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Süre: <strong className="text-amber-400">{video.durationFormatted}</strong> | IPTV Grubu: <span className="text-zinc-300">{video.groupTitle}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyVlcCommand}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
              title="VLC için çalıştırma komutunu kopyala"
            >
              {copiedVlc ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Play className="h-3.5 w-3.5 text-amber-400" />}
              <span>{copiedVlc ? 'VLC Komutu Kopyalandı' : 'VLC / MPV Komutu'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-emerald-400" />}
              <span>{copied ? 'M3U Kopyalandı' : 'M3U Satırı Al'}</span>
            </button>

            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 font-bold text-white hover:bg-rose-500 transition-all shadow-sm shadow-rose-950/40"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>YouTube&apos;da İzle</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
