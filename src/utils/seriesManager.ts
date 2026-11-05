import { VideoItem, SeriesHierarchy, SeriesSeason } from '../types';

export interface SeriesMeta {
  id: string;
  name: string;
  network: string;
  genre: string;
  description: string;
  poster: string;
  banner?: string;
  yearStart: number;
}

export const KNOWN_SERIES_META: Record<string, SeriesMeta> = {
  ezel: {
    id: 'ezel',
    name: 'Ezel',
    network: 'Ay Yapım / ATV - Show TV',
    genre: 'Polisiye & Dram',
    description: 'Ömer Uçar, en güvendiği arkadaşları ve sevdiği kadın tarafından kurulan tuzakla hapse atılır. Yıllar sonra estetik ameliyatla yüzünü ve kimliğini değiştirerek Ezel Bayraktar olarak intikam için geri döner.',
    poster: 'https://archive.org/services/img/ezel-ezel-1.-bolum-her-ihanet-sevgiyle-baslar-hd-1',
    banner: 'https://archive.org/services/img/ezel-39.-bolum-full-hd',
    yearStart: 2009,
  },
  kurtlar_vadisi: {
    id: 'kurtlar_vadisi',
    name: 'Kurtlar Vadisi',
    network: 'Pana Film / Show TV - Kanal D',
    genre: 'Aksiyon & Mafya',
    description: 'Bu bir mafya dizisidir. Devlet görevlisi Ali Candan, yüzünü ve geçmişini geride bırakıp Polat Alemdar kimliğiyle Türkiye\'nin en karanlık mafya yapılanması olan Kurtlar Konseyi\'ni çökertmek için vadiye iner.',
    poster: 'https://archive.org/services/img/kurtlarvadisi20.bolumfullhd',
    banner: 'https://archive.org/services/img/kurtlarvadisi28.bolumfullhd',
    yearStart: 2003,
  },
  behzat_c: {
    id: 'behzat_c',
    name: 'Behzat Ç.',
    network: 'Star TV / Puhu TV',
    genre: 'Polisiye & Suç',
    description: 'Ankara Emniyet Müdürlüğü Cinayet Büro Amiri Behzat Ç. ve ekibi; kanunların bittiği yerde adaleti kendi sokak tecrübeleriyle arayan, kural tanımayan bir cinayet masası ekibidir.',
    poster: 'https://archive.org/services/img/behzatc.1.sezon1.bolumtekparcafullhdizlepuhutv',
    banner: 'https://archive.org/services/img/behzat-c-ankara-yaniyor_movie',
    yearStart: 2010,
  },
  leyla_mecnun: {
    id: 'leyla_mecnun',
    name: 'Leyla ile Mecnun',
    network: 'TRT 1 / EfLÂtun Film',
    genre: 'Absürt Komedi',
    description: 'Kireçburnu sahilinde doğan aynı günkü iki bebeğin beşik kertmesiyle başlayan; Mecnun, İsmail Abi, Erdal Bakkal ve Yavuz\'un gerçeküstü İstanbul maceraları.',
    poster: 'https://archive.org/services/img/leylailemecnun94bolumtekparcahdyoutube',
    banner: 'https://archive.org/services/img/leylailemecnun95bolumtekparcahdyoutube',
    yearStart: 2011,
  },
  avrupa_yakasi: {
    id: 'avrupa_yakasi',
    name: 'Avrupa Yakası',
    network: 'ATV / Plato Film',
    genre: 'Durum Komedisi',
    description: 'Gülse Birsel imzalı, Nişantaşı\'nda lüks bir moda dergisi ofisi ile Sütçüoğlu ailesinin geleneksel konağı arasında geçen unutulmaz durum komedisi.',
    poster: 'https://archive.org/services/img/leylailemecnun94bolumtekparcahdyoutube',
    banner: 'https://archive.org/services/img/leylailemecnun94bolumtekparcahdyoutube',
    yearStart: 2004,
  },
  genis_aile: {
    id: 'genis_aile',
    name: 'Geniş Aile',
    network: 'Kanal D / D Productions',
    genre: 'Mahalle Komedisi',
    description: 'Cevahir (Ufuk Özkan) ile Bilal (Fırat Tanış) arasındaki ezeli mahalle rekabeti ve Kuddusi Bey\'in fırınında dönen sımsıcak aile serüveni.',
    poster: 'https://archive.org/services/img/leylailemecnun95bolumtekparcahdyoutube',
    banner: 'https://archive.org/services/img/leylailemecnun95bolumtekparcahdyoutube',
    yearStart: 2009,
  },
  sherlock: {
    id: 'sherlock',
    name: 'Sherlock (Türkçe Dublaj)',
    network: 'BBC / Dublaj Sinema',
    genre: 'Gizem & Suç',
    description: 'Modern Londra sokaklarında Baker Street 221B adresinden dünyayı çözen dahi dedektif Sherlock Holmes ve Dr. John Watson.',
    poster: 'https://archive.org/services/img/robin-hood-turkce-dublaj-vcd',
    yearStart: 2010,
  },
  lost: {
    id: 'lost',
    name: 'Lost (Türkçe Dublaj)',
    network: 'ABC / Dublaj Sinema',
    genre: 'Gizem & Macera',
    description: 'Oceanic 815 uçağının gizemli bir adaya düşmesiyle başlayan, zaman ve mekân sınırlarını zorlayan hayatta kalma mücadelesi.',
    poster: 'https://archive.org/services/img/yenilmez3undisputed3turkcedublajyabanciaksiyondramfilmifullfilmizlehd',
    yearStart: 2004,
  },
  prison_break: {
    id: 'prison_break',
    name: 'Prison Break (Türkçe Dublaj)',
    network: 'FOX / Dublaj Sinema',
    genre: 'Aksiyon & Gerilim',
    description: 'Haksız yere idama mahkûm edilen ağabeyi Lincoln\'ü kurtarmak için Fox River cezaevinin planlarını vücuduna dövme yaptıran inşaat mühendisi Michael Scofield.',
    poster: 'https://archive.org/services/img/the-message-c-ag-ri-fi-lmi-hz.-muhammedi-n-hayati-i-slami-yeti-n-dog-us-u-1976-hd',
    yearStart: 2005,
  },
};

/**
 * Otomatik Ayrıştırıcı: Bir VideoItem'dan Sezon ve Bölüm Numarasını Çıkarır
 */
export function extractSeasonEpisode(item: VideoItem): {
  seriesId: string;
  seriesName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
} {
  if (item.seriesId && item.seriesName) {
    return {
      seriesId: item.seriesId,
      seriesName: item.seriesName,
      seasonNumber: item.seasonNumber || 1,
      episodeNumber: item.episodeNumber || 1,
      episodeTitle: item.episodeTitle || item.cleanTitle || item.title,
    };
  }

  const raw = item.cleanTitle || item.title;
  let seriesName = 'Diğer Diziler';
  let seriesId = 'diger_diziler';
  let seasonNumber = 1;
  let episodeNumber = 1;
  let episodeTitle = raw;

  // Regex 1: "Ezel - Sezon 1 Bölüm 2 - Başlık"
  const seasonMatch = raw.match(/^(.*?)\s*-\s*Sezon\s*(\d+)\s*Bölüm\s*(\d+)(?:\s*-\s*(.*))?$/i);
  if (seasonMatch) {
    seriesName = seasonMatch[1].trim();
    seasonNumber = parseInt(seasonMatch[2], 10);
    episodeNumber = parseInt(seasonMatch[3], 10);
    episodeTitle = seasonMatch[4] ? seasonMatch[4].trim() : `${episodeNumber}. Bölüm`;
  } else {
    // Regex 2: "Ezel 1. Bölüm - Başlık"
    const simpleMatch = raw.match(/^(.*?)\s*(\d+)\.\s*Bölüm(?:\s*-\s*(.*))?$/i);
    if (simpleMatch) {
      seriesName = simpleMatch[1].trim();
      episodeNumber = parseInt(simpleMatch[2], 10);
      episodeTitle = simpleMatch[3] ? simpleMatch[3].trim() : `${episodeNumber}. Bölüm`;
      seasonNumber = 1;
    }
  }

  const lower = seriesName.toLowerCase();
  if (lower.includes('ezel')) {
    seriesId = 'ezel';
    seriesName = 'Ezel';
  } else if (lower.includes('kurtlar vadisi')) {
    seriesId = 'kurtlar_vadisi';
    seriesName = 'Kurtlar Vadisi';
  } else if (lower.includes('behzat')) {
    seriesId = 'behzat_c';
    seriesName = 'Behzat Ç.';
  } else if (lower.includes('leyla')) {
    seriesId = 'leyla_mecnun';
    seriesName = 'Leyla ile Mecnun';
  } else if (lower.includes('avrupa')) {
    seriesId = 'avrupa_yakasi';
    seriesName = 'Avrupa Yakası';
  } else if (lower.includes('geniş aile')) {
    seriesId = 'genis_aile';
    seriesName = 'Geniş Aile';
  } else if (lower.includes('sherlock')) {
    seriesId = 'sherlock';
    seriesName = 'Sherlock';
  } else if (lower.includes('lost')) {
    seriesId = 'lost';
    seriesName = 'Lost';
  } else if (lower.includes('prison')) {
    seriesId = 'prison_break';
    seriesName = 'Prison Break';
  }

  return { seriesId, seriesName, seasonNumber, episodeNumber, episodeTitle };
}

/**
 * Katalog Veritabanını Hiyerarşik Dizi/Sezon/Bölüm Yapısına Dönüştürür
 */
export function buildSeriesHierarchy(items: VideoItem[]): SeriesHierarchy[] {
  // Yalnızca dizileri filtrele
  const seriesItems = items.filter(
    (item) =>
      item.mainCategory === 'turk_dizi' ||
      item.mainCategory === 'yabanci_dizi' ||
      item.category === 'dizi' ||
      (item.groupTitle && item.groupTitle.toLowerCase().includes('dizi'))
  );

  const seriesMap = new Map<string, {
    name: string;
    seasonsMap: Map<number, VideoItem[]>;
    firstItem: VideoItem;
  }>();

  for (const item of seriesItems) {
    const meta = extractSeasonEpisode(item);
    if (!seriesMap.has(meta.seriesId)) {
      seriesMap.set(meta.seriesId, {
        name: meta.seriesName,
        seasonsMap: new Map<number, VideoItem[]>(),
        firstItem: item,
      });
    }

    const seriesEntry = seriesMap.get(meta.seriesId)!;
    if (!seriesEntry.seasonsMap.has(meta.seasonNumber)) {
      seriesEntry.seasonsMap.set(meta.seasonNumber, []);
    }

    // Item'a zenginleştirilmiş alanları ekle
    const enrichedItem: VideoItem = {
      ...item,
      seriesId: meta.seriesId,
      seriesName: meta.seriesName,
      seasonNumber: meta.seasonNumber,
      episodeNumber: meta.episodeNumber,
      episodeTitle: meta.episodeTitle,
    };

    seriesEntry.seasonsMap.get(meta.seasonNumber)!.push(enrichedItem);
  }

  const hierarchies: SeriesHierarchy[] = [];

  for (const [id, data] of seriesMap.entries()) {
    const known = KNOWN_SERIES_META[id];
    const seasons: SeriesSeason[] = [];
    let totalEpisodes = 0;

    // Sezonları 1, 2, 3.. şeklinde sırala
    const sortedSeasonNumbers = Array.from(data.seasonsMap.keys()).sort((a, b) => a - b);

    for (const seasonNumber of sortedSeasonNumbers) {
      // Bölümleri kronolojik olarak 1, 2, 3.. sırala
      const episodes = data.seasonsMap.get(seasonNumber)!.sort((a, b) => {
        const epA = a.episodeNumber || 0;
        const epB = b.episodeNumber || 0;
        return epA - epB;
      });

      seasons.push({
        seasonNumber,
        episodes,
      });
      totalEpisodes += episodes.length;
    }

    hierarchies.push({
      id,
      name: known?.name || data.name,
      network: known?.network || data.firstItem.channel,
      genre: known?.genre || data.firstItem.aiAnalysis?.genre || 'Dizi',
      poster: known?.poster || data.firstItem.thumbnail,
      banner: known?.banner || data.firstItem.thumbnail,
      description: known?.description || data.firstItem.channel,
      yearStart: known?.yearStart || data.firstItem.year || 2010,
      seasons,
      totalEpisodes,
    });
  }

  // Popülerliğe ve bölüm sayısına göre sırala (Ezel, Kurtlar Vadisi, Behzat Ç. en başta)
  const priorityOrder = ['ezel', 'kurtlar_vadisi', 'behzat_c', 'leyla_mecnun', 'avrupa_yakasi', 'genis_aile'];
  hierarchies.sort((a, b) => {
    const idxA = priorityOrder.indexOf(a.id);
    const idxB = priorityOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return b.totalEpisodes - a.totalEpisodes;
  });

  return hierarchies;
}

/**
 * Belirli Bir Dizi İçin Doğrudan M3U Listesi Üretir
 */
export function generateSeriesM3U(series: SeriesHierarchy, baseUrl: string): string {
  const lines: string[] = [
    '#EXTM3U',
    `# DİZİ: ${series.name} (${series.totalEpisodes} Bölüm - ${series.network || 'Ulusal Kanal'})`,
    ''
  ];

  for (const season of series.seasons) {
    for (const ep of season.episodes) {
      const epNum = ep.episodeNumber || 1;
      const title = `${series.name} - Sezon ${season.seasonNumber} Bölüm ${epNum}${ep.episodeTitle ? ` - ${ep.episodeTitle}` : ''}`;
      const logo = ep.thumbnail ? `tvg-logo="${ep.thumbnail}" ` : '';
      const id = ep.id ? `tvg-id="${ep.id}" ` : '';
      const group = `group-title="Diziler: ${series.name}"`;

      lines.push(`#EXTINF:-1 ${id}tvg-name="${title}" ${logo}${group} tvg-type="series" category="${series.genre}",📺🎬 ${title}`);
      lines.push('#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      lines.push('#EXTVLCOPT:http-referrer=https://www.youtube.com/');
      lines.push('#EXTVLCOPT:network-caching=2500');
      lines.push(ep.streamUrl || `${baseUrl}/api/stream/${ep.id}.mp4`);
    }
  }

  return lines.join('\n') + '\n';
}
