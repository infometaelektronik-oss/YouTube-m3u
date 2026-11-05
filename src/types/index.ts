export type MainCategory = 'yabanci_film' | 'turk_film' | 'turk_dizi' | 'yabanci_dizi';

export interface AIAnalysisResult {
  category: MainCategory | 'rejected_junk';
  cleanTitle: string;
  isFullContent: boolean;
  confidence: number;
  genre: string;
  year?: number;
  audioLanguage: 'tr_dublaj' | 'yerli_orijinal' | 'altyazili' | 'other';
  reasoning: string;
  suggestedTags?: string[];
}

export interface VideoItem {
  id: string;
  title: string;
  cleanTitle: string;
  duration: number; // in seconds
  durationFormatted: string;
  channel: string;
  channelId?: string;
  channelLogo?: string;
  thumbnail: string;
  youtubeUrl: string;
  streamUrl?: string;
  mainCategory?: MainCategory;
  category: 'film' | 'dizi' | 'klasik' | 'komedi' | 'dram' | 'aksiyon' | 'dublaj' | 'bilim_kurgu' | 'korku';
  audioLanguage?: 'tr_dublaj' | 'yerli_orijinal' | 'altyazili';
  groupTitle: string;
  year?: number;
  isFullMovieOrEpisode: boolean;
  rejectedReason?: string;
  aiAnalysis?: AIAnalysisResult;
  // Gelişmiş Hiyerarşik Dizi Alanları
  seriesId?: string;
  seriesName?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}

export interface SeriesSeason {
  seasonNumber: number;
  episodes: VideoItem[];
}

export interface SeriesHierarchy {
  id: string;
  name: string;
  network?: string;
  genre: string;
  poster: string;
  banner?: string;
  description: string;
  yearStart?: number;
  seasons: SeriesSeason[];
  totalEpisodes: number;
}

export interface FilterOptions {
  minDurationMinutes: number;
  enableRegexBlacklist: boolean;
  enableInflectionMatching: boolean;
  boostPositiveKeywords: boolean;
  excludeSubtitles?: boolean;
  activeModule?: 'all' | 'yerli' | 'dublaj';
  activeMainCategory?: 'all' | MainCategory;
  useAiFiltering?: boolean;
  customBlacklistWords: string[];
}

export interface FilterEvaluationResult {
  passed: boolean;
  cleanTitle: string;
  matchedBlacklistWord?: string;
  durationFailed?: boolean;
  subtitleFailed?: boolean;
  reason?: string;
}

export interface M3UGenerationOptions {
  groupTitleMode: 'category' | 'channel' | 'custom';
  customGroupTitle?: string;
  streamUrlMode: 'iptv_proxy' | 'youtube' | 'raw_stream' | 'piped' | 'kodi';
  baseUrl?: string;
  includeEpg: boolean;
  includeLogos: boolean;
}

export interface ChannelPreset {
  id: string;
  name: string;
  handle: string;
  url: string;
  banner: string;
  logo: string;
  subscriberCount: string;
  description: string;
  category: string;
  verified: boolean;
}
