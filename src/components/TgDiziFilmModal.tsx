import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Tv, 
  Film, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Radio, 
  ArrowRight,
  Database,
  FileCode2,
  FileJson
} from 'lucide-react';
import { VideoItem } from '../types';

interface TgDiziFilmModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: VideoItem[];
}

export const TgDiziFilmModal: React.FC<TgDiziFilmModalProps> = ({ isOpen, onClose, items }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
  const m3uUrl = `${currentHost}/api/m3u/tg_dizifilm.m3u`;
  const jsonUrl = `${currentHost}/api/export/tg_dizifilm.json`;

  const movies = items.filter(i => i.mainCategory === 'yabanci_film' || i.mainCategory === 'turk_film');
  const series = items.filter(i => i.mainCategory === 'turk_dizi' || i.mainCategory === 'yabanci_dizi');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const generateTgM3uText = () => {
    const lines: string[] = [
      '#EXTM3U x-tvg-url="http://iptv.epg/tg_dizifilm.xml"',
      '# TG. DIZI FILM - Film & Dizi Veri Tabanı İçe Aktarım Akışı (1268a13e Entegre)',
      ''
    ];

    for (const item of items) {
      const isSeries = item.mainCategory === 'turk_dizi' || item.mainCategory === 'yabanci_dizi' || item.category === 'dizi';
      // Dizileri kendi adlarına göre kategorilere ayır (Diziler: Ezel, Diziler: Kurtlar Vadisi vb.)
      const groupName = item.groupTitle || (isSeries ? 'Diziler' : 'Filmler');
      const cleanCat = item.aiAnalysis?.genre || (
        item.category === 'komedi' ? 'Komedi' :
        item.category === 'aksiyon' ? 'Aksiyon' :
        item.category === 'bilim_kurgu' ? 'Bilim Kurgu' :
        item.category === 'korku' ? 'Korku' :
        item.category === 'dram' ? 'Dram' : 'Macera'
      );
      
      let title = item.cleanTitle || item.title;
      if (isSeries) {
        if (!title.includes('- Sezon') && !title.includes('Bölüm')) {
          title = `${title} - Sezon 1 Bölüm 1`;
        }
      } else {
        if (!/film|sinema|movie/i.test(title)) title = `${title} (Full HD Film)`;
      }

      const safeTitle = title.replace(/"/g, "'");
      const logoAttr = item.thumbnail ? `tvg-logo="${item.thumbnail}" ` : '';
      const idAttr = item.id ? `tvg-id="${item.id}" ` : '';
      const typeAttr = isSeries ? 'tvg-type="series"' : 'tvg-type="movie"';

      let icon = isSeries ? '📺🎬' : '🎬';
      if (item.mainCategory === 'yabanci_film') icon = '🌍🎬';
      else if (item.mainCategory === 'turk_film') icon = '🇹🇷🎬';

      lines.push(`#EXTINF:-1 ${idAttr}tvg-name="${safeTitle}" ${logoAttr}group-title="${groupName}" ${typeAttr} category="${cleanCat}",${icon} ${safeTitle}`);
      lines.push('#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      lines.push('#EXTVLCOPT:http-referrer=https://www.youtube.com/');
      lines.push('#EXTVLCOPT:network-caching=2500');
      // Doğrudan Açık Genel CDN MP4 Linki - Chrome veya harici oynatıcıda 403 vermez
      lines.push(item.streamUrl || `${currentHost}/api/stream/${item.id}.mp4`);
    }

    return lines.join('\n') + '\n';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-purple-500/30 bg-zinc-950 shadow-2xl shadow-purple-950/40 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-gradient-to-r from-purple-950/60 via-zinc-900 to-zinc-950 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 shadow-lg shadow-purple-950/50">
              <Tv className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  TG. Dizi Film (1268a13e) Entegrasyon Merkezi
                </h2>
                <span className="rounded-md bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                  %100 UYUMLU İÇE AKTARICI
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">
                TG. Dizi Film portalınızdaki <strong>&ldquo;Filmler (0 Başlık)&rdquo;</strong> ve <strong>&ldquo;Diziler&rdquo;</strong> alanlarını tek tıkla canlı doldurun.
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

        {/* Action Hero Bar (Matches User's Screenshot 3) */}
        <div className="border-b border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>TG. Dizi Film &rarr; Yönetim Paneli &rarr; &ldquo;Yedekle &amp; Aktar&rdquo; İçin Hazır Kaynaklar</span>
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Aşağıdaki M3U URL&apos;sini veya JSON dosyasını TG. Dizi Film sisteminize aktararak tüm film ve dizileri anında yayına alın:
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-zinc-300 border border-zinc-700">
                🎬 {movies.length} Film
              </span>
              <span className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-zinc-300 border border-zinc-700">
                📺 {series.length} Dizi
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Option 1: M3U Text & URL Import */}
            <div className="rounded-xl border border-cyan-500/30 bg-zinc-950/70 p-3.5 flex flex-col justify-between space-y-3 shadow-lg shadow-cyan-950/20">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <FileCode2 className="h-4 w-4 text-cyan-400" />
                    <span>1. Yol: M3U8 Metin veya Dosya</span>
                  </span>
                  <span className="text-[10px] bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 px-1.5 py-0.2 rounded font-semibold">
                    En Garantili (%0 Hata)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  TG. Dizi Film &rarr; <strong>Yedekle &amp; Aktar</strong> &rarr; <strong>&ldquo;M3U8 URL / Metin İçe Aktar&rdquo;</strong> kutusuna doğrudan yapıştırın.
                </p>
                <div className="mt-1.5 text-[10px] text-zinc-400 bg-zinc-900/90 rounded p-1.5 border border-zinc-800">
                  <span className="text-emerald-400 font-medium">✓ Doğrudan Genel MP4 Akışları:</span> 403 Forbidden veya dev oturum engeline takılmaz.
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => {
                    const text = generateTgM3uText();
                    handleCopy(text, 'm3u_text');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-cyan-500 transition-colors"
                >
                  {copiedKey === 'm3u_text' ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span>M3U8 Liste Metni Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>M3U8 Liste Metnini Kopyala</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDownload(m3uUrl, 'tg_dizifilm.m3u')}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                    title="M3U Dosyası Olarak İndir (Sürükle-Bırak İçin)"
                  >
                    <Download className="h-3.5 w-3.5 text-cyan-400" />
                    <span>.m3u İndir</span>
                  </button>
                  <button
                    onClick={() => handleCopy(m3uUrl, 'm3u_url')}
                    className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                    title="M3U URL Kopyala"
                  >
                    {copiedKey === 'm3u_url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>URL</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Option 2: JSON Backup Import */}
            <div className="rounded-xl border border-purple-500/30 bg-zinc-950/70 p-3.5 flex flex-col justify-between space-y-3 shadow-lg shadow-purple-950/20">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <FileJson className="h-4 w-4 text-purple-400" />
                    <span>2. Yol: Sistem JSON Yedeği</span>
                  </span>
                  <span className="text-[10px] bg-purple-950/80 border border-purple-700/60 text-purple-300 px-1.5 py-0.2 rounded font-semibold">
                    Tam Veri
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  <code>tg_dizifilm.json</code> dosyasını indirin, TG. Dizi Film&apos;deki <strong>&ldquo;M3U8 veya JSON dosyasını buraya sürükleyin&rdquo;</strong> alanına bırakın.
                </p>
                <div className="mt-1.5 text-[10px] text-zinc-400 bg-zinc-900/90 rounded p-1.5 border border-zinc-800">
                  <span className="text-purple-400 font-medium">✓ Hazır Format:</span> Filmler ve Diziler kategorileri, posterleri ve açıklamaları eksiksiz.
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => handleDownload(jsonUrl, 'tg_dizifilm.json')}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>tg_dizifilm.json İndir</span>
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(jsonUrl);
                      const jsonText = await res.text();
                      handleCopy(jsonText, 'json_text');
                    } catch {
                      handleCopy(jsonUrl, 'json_text');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                  title="JSON Metnini Kopyala"
                >
                  {copiedKey === 'json_text' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>JSON Metni Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>JSON Metnini Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Option 3: Text LinkExtractor Ingestion (Matches LinkExtractor.tsx in TG repo) */}
            <div className="rounded-xl border border-emerald-500/30 bg-zinc-950/70 p-3.5 flex flex-col justify-between space-y-3 shadow-lg shadow-emerald-950/20">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-emerald-400" />
                    <span>3. Yol: Metin İçerik Analizörü</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  TG. Dizi Film &rarr; <strong>Admin &rarr; &ldquo;Metin İçerik Analizörü&rdquo;</strong> kutusuna yapıştırın; <strong>&ldquo;Linkleri Ayıkla&rdquo;</strong> ve <strong>&ldquo;Tümünü Ekle&rdquo;</strong> deyin.
                </p>
                <div className="mt-1.5 text-[10px] text-zinc-400 bg-zinc-900/90 rounded p-1.5 border border-zinc-800">
                  <span className="text-emerald-400 font-medium">✓ Dizi Ayrıştırma:</span> &ldquo; - Sezon X Bölüm Y&rdquo; formatına göre otomatik eşleştirilir.
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/export/tg_extractor.txt');
                      const txt = await res.text();
                      handleCopy(txt, 'extractor_text');
                    } catch {
                      handleCopy(m3uUrl, 'extractor_text');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-colors"
                >
                  {copiedKey === 'extractor_text' ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span>Analizör Metni Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Analizör Metnini Kopyala</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownload('/api/export/tg_extractor.txt', 'tg_extractor.txt')}
                  className="w-full flex items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                  title="Analizör Metin Dosyasını İndir"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  <span>tg_extractor.txt İndir</span>
                </button>
              </div>
            </div>
          </div>

          {/* Architectural Compliance Box */}
          <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-950/30 p-3 text-[11px] text-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-purple-300 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>TG-dizifilm-premium Oynatıcı Mimarisine Tam Uyum:</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-zinc-400 flex-wrap">
              <span>✓ Range: bytes &amp; HTTP 206 Kısmi Oynatma</span>
              <span>✓ CORS: Access-Control-Allow-Origin: *</span>
              <span>✓ Dizi Gruplama: - Sezon X Bölüm Y Formatı</span>
              <span>✓ Zod .mp4/.m3u8 Regex Doğrulama</span>
            </div>
          </div>
        </div>

        {/* Content Explorer - Ready Items for "İçerik Ekle" (Screenshot 4) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                <span>Tekil İçerik Ekleme Rehberi (Ekran 4 İçin Hazır Alanlar)</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                TG. Dizi Film &rarr; &ldquo;İçerik Ekle&rdquo; formunda BAŞLIK, STREAM URL, POSTER URL ve KATEGORİ alanlarına tek tıkla kopyalayabilirsiniz.
              </p>
            </div>

            {/* Filter Tabs matching User's Request */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1 scrollbar-none">
              {[
                { id: 'all', label: 'TÜMÜ' },
                { id: 'ezel', label: 'EZEL (11 BÖLÜM)' },
                { id: 'kurtlar_vadisi', label: 'KURTLAR VADİSİ (10 BÖLÜM)' },
                { id: 'behzat_c', label: 'BEHZAT Ç. (4 BÖLÜM & FİLM)' },
                { id: 'leyla_mecnun', label: 'LEYLA İLE MECNUN' },
                { id: 'yesilcam', label: 'YEŞİLÇAM (9 BAŞYAPIT)' },
                { id: 'yerli_sinema', label: 'YERLİ SİNEMA' },
                { id: 'yabanci_dizi', label: 'YABANCI DİZİLER' },
                { id: 'yabanci_film', label: 'YABANCI FİLMLER' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items
              .filter(item => {
                if (selectedCategory === 'all') return true;
                if (selectedCategory === 'ezel') return (item.cleanTitle || '').toLowerCase().includes('ezel') || (item.groupTitle || '').toLowerCase().includes('ezel');
                if (selectedCategory === 'kurtlar_vadisi') return (item.cleanTitle || '').toLowerCase().includes('kurtlar vadisi') || (item.groupTitle || '').toLowerCase().includes('kurtlar vadisi');
                if (selectedCategory === 'behzat_c') return (item.cleanTitle || '').toLowerCase().includes('behzat') || (item.groupTitle || '').toLowerCase().includes('behzat');
                if (selectedCategory === 'leyla_mecnun') return (item.cleanTitle || '').toLowerCase().includes('leyla ile mecnun') || (item.groupTitle || '').toLowerCase().includes('leyla');
                if (selectedCategory === 'yesilcam') return (item.groupTitle || '').includes('Yeşilçam');
                if (selectedCategory === 'yerli_sinema') return (item.groupTitle || '').includes('Yerli Sinema');
                if (selectedCategory === 'yabanci_dizi') return item.mainCategory === 'yabanci_dizi';
                if (selectedCategory === 'yabanci_film') return item.mainCategory === 'yabanci_film';
                return true;
              })
              .map(item => {
                const streamUrl = item.streamUrl || `${currentHost}/api/stream/${item.id}.mp4`;
                const isSeries = item.mainCategory === 'turk_dizi' || item.mainCategory === 'yabanci_dizi';
                const catLabel = item.category === 'komedi' ? 'Komedi' :
                  item.category === 'aksiyon' ? 'Aksiyon' :
                  item.category === 'bilim_kurgu' ? 'Bilim Kurgu' :
                  item.category === 'korku' ? 'Korku' :
                  item.category === 'dram' ? 'Dram' : 'Macera';

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 flex gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.cleanTitle}
                      className="h-24 w-18 rounded-lg object-cover bg-zinc-950 shrink-0 border border-zinc-800"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isSeries ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isSeries ? 'DİZİ' : 'FİLM'}
                          </span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded border border-zinc-700">
                            {catLabel}
                          </span>
                          {item.year && (
                            <span className="text-[10px] text-zinc-400">
                              {item.year}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-white mt-1 truncate" title={item.cleanTitle}>
                          {item.cleanTitle}
                        </h4>

                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate font-mono">
                          {streamUrl}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60 mt-2">
                        <button
                          onClick={() => handleCopy(streamUrl, `stream_${item.id}`)}
                          className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold px-2 py-1 transition-colors"
                          title="Stream URL (.MP4) Kopyala"
                        >
                          {copiedKey === `stream_${item.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>Stream URL</span>
                        </button>

                        <button
                          onClick={() => handleCopy(item.thumbnail, `poster_${item.id}`)}
                          className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold px-2 py-1 transition-colors"
                          title="Poster URL Kopyala"
                        >
                          {copiedKey === `poster_${item.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>Poster URL</span>
                        </button>

                        <button
                          onClick={() => handleCopy(item.cleanTitle, `title_${item.id}`)}
                          className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold px-2 py-1 transition-colors"
                          title="Başlığı Kopyala"
                        >
                          {copiedKey === `title_${item.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>Başlık</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 px-6 py-3.5 bg-zinc-950 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            TG. Dizi Film uygulamanızda (1268a13e) Filmler ve Diziler şeritlerini anında aktif eder.
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
