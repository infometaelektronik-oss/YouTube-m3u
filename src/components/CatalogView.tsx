import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Film,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Radio,
  Download,
  Bot,
  Zap,
  Tag,
  ChevronDown,
  Info
} from 'lucide-react';
import { VideoItem, FilterOptions, MainCategory, AIAnalysisResult } from '../types';
import { OFFICIAL_CHANNELS } from '../data/catalog';
import { evaluateTitle, generateM3U } from '../utils/filterEngine';

interface CatalogViewProps {
  items: VideoItem[];
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onPlayVideo: (video: VideoItem) => void;
  onCopySingleM3U: (video: VideoItem) => void;
  onOpenSeedsModal: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  items,
  filterOptions,
  setFilterOptions,
  onPlayVideo,
  onCopySingleM3U,
  onOpenSeedsModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<'all' | MainCategory>('all');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [showRejected, setShowRejected] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Categorization & Analysis States
  const [isAiClassifying, setIsAiClassifying] = useState<boolean>(false);
  const [aiAnalysisMap, setAiAnalysisMap] = useState<Record<string, AIAnalysisResult>>({});
  const [aiSearchPrompt, setAiSearchPrompt] = useState<string>('');
  const [isAiSearching, setIsAiSearching] = useState<boolean>(false);
  const [aiStrategyResult, setAiStrategyResult] = useState<any | null>(null);

  // Evaluate items with title and duration rules
  const evaluatedItems = useMemo(() => {
    return items.map((item) => {
      const evalResult = evaluateTitle(item.title, item.duration, filterOptions);
      const customAi = aiAnalysisMap[item.id] || item.aiAnalysis;

      return {
        ...item,
        isApproved: evalResult.passed,
        rejectionReason: evalResult.reason,
        matchedWord: evalResult.matchedBlacklistWord,
        aiAnalysis: customAi,
      };
    });
  }, [items, filterOptions, aiAnalysisMap]);

  // Apply search, category, and channel filters
  const filteredList = useMemo(() => {
    return evaluatedItems.filter((item) => {
      // 1. 4 Main Categories filter
      if (selectedMainCategory !== 'all') {
        const itemCat = item.aiAnalysis?.category && item.aiAnalysis.category !== 'rejected_junk'
          ? (item.aiAnalysis.category as MainCategory)
          : item.mainCategory;

        if (itemCat !== selectedMainCategory) {
          return false;
        }
      }

      // 2. Channel filter
      if (selectedChannelId !== 'all' && item.channelId !== selectedChannelId) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q) || item.cleanTitle.toLowerCase().includes(q);
        const matchesChannel = item.channel.toLowerCase().includes(q);
        const matchesGenre = item.aiAnalysis?.genre?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesChannel && !matchesGenre) return false;
      }

      // 4. Show/hide rejected
      if (!showRejected && !item.isApproved) {
        return false;
      }

      return true;
    });
  }, [evaluatedItems, selectedMainCategory, selectedChannelId, searchQuery, showRejected]);

  // Approved count per category
  const categoryCounts = useMemo(() => {
    const counts = {
      all: 0,
      yabanci_film: 0,
      turk_film: 0,
      turk_dizi: 0,
      yabanci_dizi: 0,
      rejected: 0,
    };

    evaluatedItems.forEach((item) => {
      if (item.isApproved) {
        counts.all++;
        const cat = item.mainCategory;
        if (cat && cat in counts) {
          counts[cat]++;
        }
      } else {
        counts.rejected++;
      }
    });

    return counts;
  }, [evaluatedItems]);

  const approvedList = useMemo(() => filteredList.filter((i) => i.isApproved), [filteredList]);
  const rejectedList = useMemo(() => filteredList.filter((i) => !i.isApproved), [filteredList]);

  const handleCopySingle = (video: VideoItem) => {
    onCopySingleM3U(video);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Trigger Gemini AI Batch Categorization
  const handleRunAiBatchClassification = async () => {
    try {
      setIsAiClassifying(true);
      const targetItems = items.slice(0, 16).map((item) => ({
        id: item.id,
        title: item.title,
        channel: item.channel,
        durationFormatted: item.durationFormatted,
      }));

      const res = await fetch('/api/ai/batch-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: targetItems }),
      });

      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const newMap: Record<string, AIAnalysisResult> = {};
        json.data.forEach((aiItem: any) => {
          if (aiItem && aiItem.id) {
            newMap[aiItem.id] = {
              category: aiItem.category,
              cleanTitle: aiItem.cleanTitle,
              isFullContent: aiItem.isFullContent,
              confidence: aiItem.confidence,
              genre: aiItem.genre,
              year: aiItem.year,
              audioLanguage: aiItem.audioLanguage,
              reasoning: aiItem.reasoning,
            };
          }
        });
        setAiAnalysisMap((prev) => ({ ...prev, ...newMap }));
      }
    } catch (err: any) {
      console.warn('AI Batch Classification error:', err);
    } finally {
      setIsAiClassifying(false);
    }
  };

  // Trigger Gemini AI Search & Prompt Strategy
  const handleRunAiSearchStrategy = async () => {
    if (!aiSearchPrompt.trim()) return;
    try {
      setIsAiSearching(true);
      const res = await fetch('/api/ai/smart-search-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiSearchPrompt }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiStrategyResult(data.data);
        // Automatically set search query filter
        setSearchQuery(aiSearchPrompt);
      }
    } catch (e: any) {
      console.error('AI Search Strategy error:', e);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Download M3U for currently active category
  const handleDownloadCategoryM3U = () => {
    const listToExport = approvedList.length > 0 ? approvedList : evaluatedItems.filter((i) => i.isApproved);
    const m3uContent = generateM3U(listToExport);
    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const catName =
      selectedMainCategory === 'all'
        ? 'tum_kategoriler_yapay_zeka.m3u'
        : `${selectedMainCategory}.m3u`;
    link.download = catName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & 4-Category Header */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                ⚡ 4 Ayrık Kategori &amp; Tam Yapay Zeka Destekli IPTV M3U Stüdyosu
              </h1>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Yabancı filmler, Türk filmleri, Türk dizileri ve yabancı diziler Gemini 3.8 Flash yapay zekası ile ayrı ayrı sınıflandırılır; klip, fragman ve altyazılı içerikler elenir.
            </p>
          </div>

          {/* Scraper Seeds & AI Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenSeedsModal}
              className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2 text-xs font-bold text-cyan-300 shadow-md hover:bg-cyan-900/60 transition-all active:scale-95 cursor-pointer"
            >
              <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span>🌱 Tohum (Seed) Linkleri (Scraper İçin)</span>
            </button>

            <button
              onClick={handleRunAiBatchClassification}
              disabled={isAiClassifying}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-950/40 transition-all active:scale-95 hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              {isAiClassifying ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-300" />
              )}
              <span>{isAiClassifying ? 'AI Analiz Ediyor...' : '⚡ Gemini AI ile Doğrula'}</span>
            </button>
          </div>
        </div>

        {/* 4 Dedicated Category Selector Tabs */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            {
              id: 'all',
              label: 'Tüm Arşiv (Birleşik)',
              icon: '✨',
              count: categoryCounts.all,
              color: 'hover:border-zinc-500',
              activeColor: 'bg-zinc-100 text-zinc-950 font-bold border-zinc-100 shadow-md',
            },
            {
              id: 'yabanci_film',
              label: 'Yabancı Filmler',
              subtitle: 'Türkçe Dublaj',
              icon: '🌍',
              count: categoryCounts.yabanci_film,
              color: 'hover:border-sky-500/60',
              activeColor: 'bg-sky-600 text-white font-bold border-sky-500 shadow-md shadow-sky-950/40',
            },
            {
              id: 'turk_film',
              label: 'Türk Filmleri',
              subtitle: 'Yeşilçam & Yerli',
              icon: '🇹🇷',
              count: categoryCounts.turk_film,
              color: 'hover:border-rose-500/60',
              activeColor: 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40',
            },
            {
              id: 'turk_dizi',
              label: 'Türk Dizileri',
              subtitle: 'Tam Bölümler',
              icon: '📺',
              count: categoryCounts.turk_dizi,
              color: 'hover:border-emerald-500/60',
              activeColor: 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-md shadow-emerald-950/40',
            },
            {
              id: 'yabanci_dizi',
              label: 'Yabancı Diziler',
              subtitle: 'Türkçe Dublaj',
              icon: '🌐',
              count: categoryCounts.yabanci_dizi,
              color: 'hover:border-purple-500/60',
              activeColor: 'bg-purple-600 text-white font-bold border-purple-500 shadow-md shadow-purple-950/40',
            },
          ].map((cat) => {
            const isActive = selectedMainCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedMainCategory(cat.id as any)}
                className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  isActive
                    ? cat.activeColor
                    : `border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:bg-zinc-900 ${cat.color}`
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xl">{cat.icon}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-black/25 text-white' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {cat.count} Eser
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold leading-tight">{cat.label}</p>
                  {cat.subtitle && (
                    <p
                      className={`text-[10px] ${
                        isActive ? 'text-white/80' : 'text-zinc-500'
                      }`}
                    >
                      {cat.subtitle}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* AI Prompt & Search Assistant Bar */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-black/40 p-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-amber-400" />
              <input
                type="text"
                value={aiSearchPrompt}
                onChange={(e) => setAiSearchPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunAiSearchStrategy()}
                placeholder="Yapay Zekaya Sor: Örn. 'Kemal Sunal komedi klasikleri' veya '90'lar aksiyon yabancı filmleri dublaj'..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleRunAiSearchStrategy}
              disabled={isAiSearching || !aiSearchPrompt.trim()}
              className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isAiSearching ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
              <span>{isAiSearching ? 'Düşünüyor...' : 'AI ile Getir'}</span>
            </button>
          </div>

          {/* AI Strategy Advice Card if generated */}
          {aiStrategyResult && (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Yapay Zeka Analiz Özeti:</span>
              </div>
              <p className="text-[11px] text-zinc-300">{aiStrategyResult.summary}</p>
              {aiStrategyResult.aiTips && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {aiStrategyResult.aiTips.map((tip: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded bg-black/40 px-2 py-0.5 text-[10px] text-amber-300 border border-amber-500/20"
                    >
                      💡 {tip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls: Search, Channel, Min Duration & Toggles */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* Quick Search */}
          <div className="lg:col-span-5 relative">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Hızlı Başlık Filtresi
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Başlık veya kanal adı..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[11px] text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Channel selector */}
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Resmi Kanal Seçimi
            </label>
            <select
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-rose-500 focus:outline-none"
            >
              <option value="all">Tüm Resmi Kanallar</option>
              {OFFICIAL_CHANNELS.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name} ({ch.subscriberCount})
                </option>
              ))}
            </select>
          </div>

          {/* Min Duration */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>Min Süre</span>
              </label>
              <span className="text-[11px] font-bold text-amber-400">
                {filterOptions.minDurationMinutes} dk
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={filterOptions.minDurationMinutes}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  minDurationMinutes: Number(e.target.value),
                }))
              }
              className="w-full accent-rose-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Toggles & Category Download */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-300">
              <input
                type="checkbox"
                checked={filterOptions.excludeSubtitles}
                onChange={(e) =>
                  setFilterOptions((prev) => ({
                    ...prev,
                    excludeSubtitles: e.target.checked,
                  }))
                }
                className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-rose-600 focus:ring-rose-500 accent-rose-600"
              />
              <span className="font-semibold text-amber-300">
                🚫 Altyazılıları Ele (Yalnızca Dublaj)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-300">
              <input
                type="checkbox"
                checked={filterOptions.enableRegexBlacklist}
                onChange={(e) =>
                  setFilterOptions((prev) => ({
                    ...prev,
                    enableRegexBlacklist: e.target.checked,
                  }))
                }
                className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-rose-600 focus:ring-rose-500 accent-rose-600"
              />
              <span>Klip/Fragman Eleyicisi</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-300">
              <input
                type="checkbox"
                checked={showRejected}
                onChange={(e) => setShowRejected(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-rose-600 focus:ring-rose-500 accent-rose-600"
              />
              <span>Elenen Çöpleri Göster ({rejectedList.length})</span>
            </label>
          </div>

          <button
            onClick={handleDownloadCategoryM3U}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:bg-emerald-500 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>
              {selectedMainCategory === 'all'
                ? 'Tüm 4 Kategoriyi M3U İndir'
                : `${
                    selectedMainCategory === 'yabanci_film'
                      ? 'Yabancı Filmleri'
                      : selectedMainCategory === 'turk_film'
                      ? 'Türk Filmlerini'
                      : selectedMainCategory === 'turk_dizi'
                      ? 'Türk Dizilerini'
                      : 'Yabancı Dizileri'
                  } İndir (.m3u)`}
            </span>
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-200">
              {selectedMainCategory === 'all'
                ? 'Tüm Doğrulanmış Arşiv'
                : selectedMainCategory === 'yabanci_film'
                ? '🌍 Yabancı Filmler (Türkçe Dublaj)'
                : selectedMainCategory === 'turk_film'
                ? '🇹🇷 Türk Filmleri (Yeşilçam & Yerli Sinema)'
                : selectedMainCategory === 'turk_dizi'
                ? '📺 Türk Dizileri (Tam Bölümler)'
                : '🌐 Yabancı Diziler (Türkçe Dublaj)'}
            </h2>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
              {filteredList.length} İçerik
            </span>
          </div>
          <span className="text-xs text-zinc-500 hidden sm:inline">
            Media Crawler ve URL-Specter ile tam uyumlu doğrudan akışlar.
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <Film className="mx-auto h-12 w-12 text-zinc-600" />
            <h3 className="mt-3 text-sm font-semibold text-zinc-300">Bu kategoride içerik bulunamadı</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Filtrelerinizi gevşetebilir veya yukarıdaki arama kutusunu temizleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredList.map((video) => (
              <div
                key={video.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border transition-all duration-200 ${
                  video.isApproved
                    ? 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900/90 shadow-sm hover:shadow-md'
                    : 'border-rose-900/40 bg-rose-950/20 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                  <img
                    src={video.thumbnail}
                    alt={video.cleanTitle}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=640&auto=format&fit=crop&q=80';
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-200 backdrop-blur-xs">
                    <Clock className="h-3 w-3 text-amber-400" />
                    <span>{video.durationFormatted}</span>
                  </div>

                  {/* Main Category Badge on Top-Right */}
                  <div className="absolute top-2 right-2">
                    {video.mainCategory === 'yabanci_film' && (
                      <span className="rounded-md bg-sky-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
                        🌍 Yabancı Film
                      </span>
                    )}
                    {video.mainCategory === 'turk_film' && (
                      <span className="rounded-md bg-rose-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
                        🇹🇷 Türk Filmi
                      </span>
                    )}
                    {video.mainCategory === 'turk_dizi' && (
                      <span className="rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
                        📺 Türk Dizisi
                      </span>
                    )}
                    {video.mainCategory === 'yabanci_dizi' && (
                      <span className="rounded-md bg-purple-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
                        🌐 Yabancı Dizi
                      </span>
                    )}
                  </div>

                  {/* Approval / Rejection Badge on Top-Left */}
                  <div className="absolute top-2 left-2">
                    {video.isApproved ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm backdrop-blur-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        ONAYLANDI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm backdrop-blur-xs">
                        <AlertTriangle className="h-3 w-3" />
                        ELENDİ
                      </span>
                    )}
                  </div>

                  {/* Play Hover Overlay */}
                  <button
                    onClick={() => onPlayVideo(video)}
                    aria-label={`Oynat: ${video.cleanTitle}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition-transform group-hover:scale-110">
                      <Play className="h-6 w-6 ml-0.5 fill-current" />
                    </div>
                  </button>
                </div>

                {/* Body Details */}
                <div className="flex flex-1 flex-col justify-between p-3.5">
                  <div>
                    {/* Rejection notice */}
                    {!video.isApproved && video.rejectionReason && (
                      <div className="mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-300">
                        ⚠️ {video.rejectionReason}
                      </div>
                    )}

                    {/* AI Reasoning pill if available */}
                    {video.aiAnalysis && (
                      <div className="mb-2 rounded-lg border border-purple-500/30 bg-purple-950/30 px-2.5 py-1 text-[11px] text-purple-200">
                        <div className="flex items-center justify-between font-bold text-purple-300 text-[10px] mb-0.5">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-300" />
                            <span>Gemini AI Analizi ({video.aiAnalysis.confidence}% Güven)</span>
                          </span>
                          <span>{video.aiAnalysis.genre}</span>
                        </div>
                        <p className="line-clamp-2 text-zinc-300 text-[10px] leading-tight">
                          {video.aiAnalysis.reasoning}
                        </p>
                      </div>
                    )}

                    <h3
                      className="font-bold text-sm text-zinc-100 line-clamp-2 leading-snug group-hover:text-rose-400 transition-colors"
                      title={video.title}
                    >
                      {video.cleanTitle}
                    </h3>

                    <p className="mt-1 text-[11px] text-zinc-400 line-clamp-1 italic" title={video.title}>
                      &quot;{video.title}&quot;
                    </p>

                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      {video.audioLanguage === 'tr_dublaj' && (
                        <span className="rounded bg-sky-950/80 border border-sky-500/30 px-1.5 py-0.5 text-[10px] text-sky-300 font-semibold">
                          🌍 Türkçe Dublaj
                        </span>
                      )}
                      {video.audioLanguage === 'yerli_orijinal' && (
                        <span className="rounded bg-rose-950/80 border border-rose-500/30 px-1.5 py-0.5 text-[10px] text-rose-300 font-semibold">
                          🇹🇷 Yerli Orijinal
                        </span>
                      )}
                      {video.audioLanguage === 'altyazili' && (
                        <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400 font-semibold">
                          🚫 Altyazılı
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[130px]">
                        {video.groupTitle}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-medium text-zinc-300 truncate max-w-[150px]">
                        {video.channel}
                      </span>
                      {video.year && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 font-semibold">
                          {video.year}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3.5 flex items-center gap-2 border-t border-zinc-800/80 pt-2.5">
                    <button
                      onClick={() => onPlayVideo(video)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-rose-600 hover:text-white cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>İzle</span>
                    </button>

                    <button
                      onClick={() => handleCopySingle(video)}
                      aria-label="IPTV M3U Satırı Kopyala"
                      className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                      title="Bu içeriğin IPTV M3U satırını kopyala"
                    >
                      {copiedId === video.id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="YouTube üzerinde aç"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
