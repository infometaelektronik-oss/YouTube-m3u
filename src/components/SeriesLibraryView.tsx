import React, { useState, useMemo } from 'react';
import { VideoItem, SeriesHierarchy } from '../types';
import { buildSeriesHierarchy, generateSeriesM3U } from '../utils/seriesManager';
import { 
  Tv, 
  Play, 
  Copy, 
  Download, 
  Check, 
  Layers, 
  Search, 
  Film, 
  Sparkles, 
  Calendar, 
  Clock, 
  Radio, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface SeriesLibraryViewProps {
  items: VideoItem[];
  onPlayVideo: (video: VideoItem) => void;
  onCopySingleM3U: (video: VideoItem) => void;
  onShowToast: (message: string) => void;
  onOpenTgModal?: () => void;
}

export const SeriesLibraryView: React.FC<SeriesLibraryViewProps> = ({
  items,
  onPlayVideo,
  onCopySingleM3U,
  onShowToast,
  onOpenTgModal,
}) => {
  const seriesList = useMemo(() => buildSeriesHierarchy(items), [items]);

  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(() => {
    return seriesList.length > 0 ? seriesList[0].id : 'ezel';
  });
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast(`${label} panoya kopyalandı!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Currently selected series object
  const currentSeries = useMemo(() => {
    return seriesList.find(s => s.id === selectedSeriesId) || seriesList[0];
  }, [seriesList, selectedSeriesId]);

  // Adjust season if selected series does not have selected season
  const availableSeasons = useMemo(() => {
    return currentSeries ? currentSeries.seasons : [];
  }, [currentSeries]);

  const currentSeason = useMemo(() => {
    if (!availableSeasons.length) return null;
    const found = availableSeasons.find(s => s.seasonNumber === selectedSeasonNumber);
    return found || availableSeasons[0];
  }, [availableSeasons, selectedSeasonNumber]);

  // Filter series list by genre and search
  const filteredSeriesList = useMemo(() => {
    return seriesList.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.network?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.seasons.some(season => 
          season.episodes.some(ep => 
            (ep.episodeTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ep.cleanTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
          )
        );

      const matchesGenre = 
        selectedGenre === 'all' ? true :
        selectedGenre === 'polisiye' ? s.genre.toLowerCase().includes('polisiye') || s.genre.toLowerCase().includes('suç') || s.genre.toLowerCase().includes('mafya') :
        selectedGenre === 'komedi' ? s.genre.toLowerCase().includes('komedi') :
        selectedGenre === 'aksiyon' ? s.genre.toLowerCase().includes('aksiyon') :
        selectedGenre === 'dublaj' ? s.id === 'sherlock' || s.id === 'lost' || s.id === 'prison_break' : true;

      return matchesSearch && matchesGenre;
    });
  }, [seriesList, searchQuery, selectedGenre]);

  // Total statistics
  const totalStats = useMemo(() => {
    let totalEps = 0;
    let totalSeasons = 0;
    seriesList.forEach(s => {
      totalSeasons += s.seasons.length;
      totalEps += s.totalEpisodes;
    });
    return {
      totalSeries: seriesList.length,
      totalSeasons,
      totalEps,
    };
  }, [seriesList]);

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleDownloadSeriesM3U = (series: SeriesHierarchy) => {
    const content = generateSeriesM3U(series, hostUrl);
    const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${series.id}_tum_bolumler.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`"${series.name}" (${series.totalEpisodes} Bölüm) M3U dosyası indirildi!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Hero & Metrics */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900/90 to-purple-950/40 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <Tv className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Dizi Kütüphanesi &amp; Hiyerarşik Sezon Yönetimi
              </h1>
              <span className="rounded-md bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                TG. Dizi Film Uyumlu
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Türk televizyonunun ulusal kanal klasikleri ve yabancı dublaj dizileri; sezonlarına ve kronolojik bölümlerine ayrılmış, doğrudan çalışan MP4 akışlarıyla yayında.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Diziler</span>
              <span className="text-lg font-black text-purple-400">{totalStats.totalSeries}</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Sezonlar</span>
              <span className="text-lg font-black text-indigo-400">{totalStats.totalSeasons}</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Toplam Bölüm</span>
              <span className="text-lg font-black text-emerald-400">{totalStats.totalEps}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Dizi adı veya bölüm ara (Ezel, Polat, Behzat...)"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tüm Diziler' },
              { id: 'polisiye', label: 'Polisiye & Mafya' },
              { id: 'komedi', label: 'Komedi & Aile' },
              { id: 'dublaj', label: 'Türkçe Dublaj' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedGenre(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGenre === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Series Selector (Left) + Detail & Episodes (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Series Cards List (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-purple-400" />
              <span>Dizi Listesi ({filteredSeriesList.length})</span>
            </h2>
            <span className="text-[11px] text-zinc-500">Seçmek için tıkla</span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredSeriesList.map(series => {
              const isSelected = series.id === currentSeries?.id;
              return (
                <div
                  key={series.id}
                  onClick={() => {
                    setSelectedSeriesId(series.id);
                    setSelectedSeasonNumber(series.seasons[0]?.seasonNumber || 1);
                  }}
                  className={`group cursor-pointer rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-950/30 shadow-lg shadow-purple-950/30'
                      : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={series.poster}
                      alt={series.name}
                      className="h-20 w-15 rounded-lg object-cover bg-zinc-950 shrink-0 border border-zinc-800 shadow"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-purple-300' : 'text-zinc-200 group-hover:text-white'}`}>
                            {series.name}
                          </h3>
                          <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-purple-400 rotate-90 sm:rotate-0' : 'text-zinc-600'}`} />
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {series.network}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="rounded bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                          {series.genre}
                        </span>
                        <span className="rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-bold">
                          {series.totalEpisodes} Bölüm
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {series.seasons.length} Sezon
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredSeriesList.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500 text-xs">
                Aramanızla eşleşen dizi bulunamadı.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Series Detail & Chronological Episode Table (lg:col-span-8) */}
        {currentSeries && (
          <div className="lg:col-span-8 space-y-4">
            
            {/* Series Banner Card */}
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-5">
                <img
                  src={currentSeries.poster}
                  alt={currentSeries.name}
                  className="h-36 w-26 sm:h-44 sm:w-32 rounded-xl object-cover bg-zinc-950 shrink-0 border border-zinc-700 shadow-2xl mx-auto sm:mx-0"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-md bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[11px] font-bold text-purple-300">
                        {currentSeries.network}
                      </span>
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                        {currentSeries.genre}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {currentSeries.yearStart}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight">
                      {currentSeries.name}
                    </h2>

                    <p className="text-xs text-zinc-300 leading-relaxed mt-2 line-clamp-3">
                      {currentSeries.description}
                    </p>
                  </div>

                  {/* Series Level Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap border-t border-zinc-800/80">
                    <button
                      onClick={() => {
                        const m3u = generateSeriesM3U(currentSeries, hostUrl);
                        handleCopy(m3u, `m3u_${currentSeries.id}`, `"${currentSeries.name}" Tüm M3U Akışı`);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition-all active:scale-95"
                    >
                      {copiedKey === `m3u_${currentSeries.id}` ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>M3U Kopyalandı!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Bu Dizinin M3U Listesini Kopyala</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDownloadSeriesM3U(currentSeries)}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
                      title="M3U Dosyası Olarak İndir"
                    >
                      <Download className="h-3.5 w-3.5 text-purple-400" />
                      <span>M3U İndir</span>
                    </button>

                    {onOpenTgModal && (
                      <button
                        onClick={onOpenTgModal}
                        className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>TG. Dizi Film Aktarıcısı</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Season Tabs Selector */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Film className="h-4 w-4 text-emerald-400" />
                  <span>Sezon Seçimi:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {currentSeries.seasons.map(season => {
                    const isSeasonSelected = (currentSeason?.seasonNumber === season.seasonNumber);
                    return (
                      <button
                        key={season.seasonNumber}
                        onClick={() => setSelectedSeasonNumber(season.seasonNumber)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                          isSeasonSelected
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                        }`}
                      >
                        {season.seasonNumber}. Sezon ({season.episodes.length} Bölüm)
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                <span>✓ Doğrudan MP4 Arşiv Akışı</span>
                <span>•</span>
                <span>✓ HTTP 206 İleri-Geri Sarma</span>
              </div>
            </div>

            {/* Chronological Episode List */}
            {currentSeason && (
              <div className="space-y-2">
                {currentSeason.episodes.map(ep => {
                  const epNum = ep.episodeNumber || 1;
                  const streamUrl = ep.streamUrl || `${hostUrl}/api/stream/${ep.id}.mp4`;
                  const tgTitle = `${currentSeries.name} - Sezon ${currentSeason.seasonNumber} Bölüm ${epNum}${ep.episodeTitle ? ` - ${ep.episodeTitle}` : ''}`;

                  return (
                    <div
                      key={ep.id}
                      className="group rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left: Thumbnail & Episode Meta */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-14 w-24 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 group-hover:border-zinc-700">
                          <img
                            src={ep.thumbnail}
                            alt={tgTitle}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => onPlayVideo(ep)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Bölümü Oynat"
                          >
                            <Play className="h-5 w-5 text-white fill-white drop-shadow" />
                          </button>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.2 text-[10px] border border-purple-500/30">
                              {currentSeason.seasonNumber}. Sezon • {epNum}. Bölüm
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {ep.durationFormatted || 'Tek Parça Full HD'}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-white truncate mt-0.5">
                            {ep.episodeTitle || `${epNum}. Bölüm`}
                          </h4>

                          <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-mono">
                            {tgTitle}
                          </p>
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => onPlayVideo(ep)}
                          className="flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition-colors"
                          title="Oynatıcıda Aç"
                        >
                          <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
                          <span>Oynat</span>
                        </button>

                        <button
                          onClick={() => handleCopy(streamUrl, `url_${ep.id}`, 'Doğrudan MP4 Akış Bağlantısı')}
                          className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                          title="Doğrudan MP4 Bağlantısını Kopyala (Chrome veya IPTV oynatıcılara yapıştırmak için)"
                        >
                          {copiedKey === `url_${ep.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-zinc-400" />
                          )}
                          <span className="hidden sm:inline">MP4 Linki</span>
                        </button>

                        <button
                          onClick={() => onCopySingleM3U(ep)}
                          className="flex items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-950/40 px-2.5 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-900/50 transition-colors"
                          title="Bu Bölümün M3U Satırını Kopyala"
                        >
                          <Tv className="h-3.5 w-3.5 text-purple-400" />
                          <span>M3U</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
