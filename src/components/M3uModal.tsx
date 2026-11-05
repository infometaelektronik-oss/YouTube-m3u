import React, { useState } from 'react';
import { X, Copy, Download, Check, Tv, Settings2, FileCode, ExternalLink } from 'lucide-react';
import { VideoItem, M3UGenerationOptions } from '../types';
import { generateM3U } from '../utils/filterEngine';

interface M3uModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: VideoItem[];
}

export const M3uModal: React.FC<M3uModalProps> = ({ isOpen, onClose, items }) => {
  const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
  const [options, setOptions] = useState<M3UGenerationOptions>({
    groupTitleMode: 'category',
    customGroupTitle: 'Yerli & Yabancı Sinema/Dizi',
    streamUrlMode: 'iptv_proxy',
    baseUrl: currentHost,
    includeEpg: true,
    includeLogos: true,
  });

  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const m3uContent = generateM3U(items, { ...options, baseUrl: currentHost });

  const handleCopy = () => {
    navigator.clipboard.writeText(m3uContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'yerli_sinema_dizi.m3u8';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600/10 text-rose-500 border border-rose-500/20">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">M3U / M3U8 Oynatma Listesi</h2>
              <p className="text-xs text-zinc-400">
                Toplam {items.length} adet filtrelenmiş yerli sinema ve dizi eseri
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900 bg-zinc-900/50 px-6 py-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-zinc-300">
              <span className="text-zinc-500 font-medium">Grup Başlığı:</span>
              <select
                value={options.groupTitleMode}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    groupTitleMode: e.target.value as any,
                  }))
                }
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200"
              >
                <option value="category">Kategoriye Göre (Komedi, Klasik, Dizi)</option>
                <option value="channel">Resmi Kanala Göre (Arzu Film, Fanatik)</option>
                <option value="custom">Tekil Özel Başlık</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-zinc-300">
              <span className="text-zinc-500 font-medium">Akış Formatı:</span>
              <select
                value={options.streamUrlMode}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    streamUrlMode: e.target.value as any,
                  }))
                }
                className="rounded border border-emerald-500/40 bg-zinc-900 px-2 py-1 text-emerald-300 font-semibold"
              >
                <option value="iptv_proxy">⚡ IPTV Stream (.mp4) [Önerilen / Donmasız]</option>
                <option value="youtube">🔗 YouTube Orijinal URL</option>
                <option value="kodi">📺 Kodi YouTube Eklentisi</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeLogos}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, includeLogos: e.target.checked }))
                }
                className="accent-rose-500"
              />
              <span>Afiş Logoları (tvg-logo)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Kopyalandı' : 'Tümünü Kopyala'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 font-bold text-white shadow hover:bg-rose-500 transition-all active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>.m3u8 İndir</span>
            </button>
          </div>
        </div>

        {/* Textarea Code Preview */}
        <div className="flex-1 overflow-hidden p-6">
          <textarea
            readOnly
            value={m3uContent}
            rows={15}
            className="h-full min-h-[300px] w-full resize-none rounded-xl border border-zinc-800 bg-black/80 p-4 font-mono text-xs text-zinc-300 focus:outline-none selection:bg-rose-600/40"
          />
        </div>

        {/* Footer / Instructions */}
        <div className="border-t border-zinc-900 bg-zinc-950 px-6 py-3 text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            💡 <strong>TiviMate</strong>, <strong>VLC</strong>, <strong>OTT Navigator</strong> veya <strong>Kodi</strong> içine yerel dosya olarak aktarabilirsiniz.
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-1.5 font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
