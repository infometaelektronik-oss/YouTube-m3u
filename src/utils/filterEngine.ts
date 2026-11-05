import { FilterOptions, FilterEvaluationResult, VideoItem, M3UGenerationOptions } from '../types';

// Alakasız içerikleri (fragman, klip, şarkı, kesit, oyun VE altyazılı içerikleri) kesin eleyen regex
export const BLACKLIST_REGEX = new RegExp(
  '(?<![\\p{L}\\p{N}])(' +
  'fragman[a-zıiöüçşğ]*|teaser[s]?|klip[a-zıiöüçşğ]*|video\\s*klip[a-zıiöüçşğ]*|' +
  'şarkı[a-zıiöüçşğ]*|sarki[a-zıiöüçşğ]*|müzik[a-zıiöüçşğ]*|muzik[a-zıiöüçşğ]*|müziğ[a-zıiöüçşğ]*|' +
  'remix[a-zıiöüçşğ]*|cover|oyun[a-zıiöüçşğ]*|gameplay|pubg|valorant|gta|soundtrack|ost|' +
  'altyaz[ıi][a-zıiöüçşğ]*|altyazili|altyazılı|subbed|subtitle[s]?|türkçe\\s*altyazı[a-zıiöüçşğ]*|' +
  'kamera\\s*arkas[a-zıiöüçşğ]*|özel\\s*sahne[a-zıiöüçşğ]*|ozel\\s*sahne[a-zıiöüçşğ]*|' +
  'komik\\s*anlar[a-zıiöüçşğ]*|kesit[a-zıiöüçşğ]*|shorts|bölüm\\s*sonu|bolum\\s*sonu|jenerik[a-zıiöüçşğ]*|' +
  'tanıtım[a-zıiöüçşğ]*|tanitim[a-zıiöüçşğ]*|tepki[a-zıiöüçşğ]*|reaction|' +
  'özet[a-zıiöüçşğ]*|ozet[a-zıiöüçşğ]*|röportaj[a-zıiöüçşğ]*|roportaj[a-zıiöüçşğ]*|podcast|' +
  '\\d+\\.\\s*fragman[a-zıiöüçşğ]*|ilk\\s*sahne|son\\s*sahne|efsane\\s*sahne|replik[a-zıiöüçşğ]*|' +
  'parça\\s*parça|parca\\s*parca|parça\\s*\\d+|part\\s*\\d+|' +
  '\\d+/\\d+' +
  ')(?![\\p{L}\\p{N}])',
  'iu'
);

export const SUBTITLE_REGEX = /(?<![\p{L}\p{N}])(altyaz[ıi][\p{L}]*|subbed|subtitles?)(?![\p{L}\p{N}])/iu;

export const POSITIVE_REGEX = new RegExp(
  '\\b(' +
  'tek\\s*parça|tek\\s*parca|full\\s*izle|full\\s*hd|sansürsüz|sansursuz|' +
  'restorasyonlu|tam\\s*film|tam\\s*bölüm|tam\\s*bolum|bölüm\\s*full|bolum\\s*full|' +
  'türkçe\\s*dublaj|turkce\\s*dublaj|dublaj|1080p|720p|yerli\\s*film|türk\\s*filmi|turk\\s*filmi' +
  ')\\b',
  'iu'
);

/**
 * Başlıktaki gürültülü etiket ve parantez fazlalıklarını temizler
 */
export function cleanTitle(title: string): string {
  if (!title) return '';
  let cleaned = title.replace(
    /(\[|\()?(tek\s*parça|tek\s*parca|full\s*hd|restorasyonlu|sansürsüz|1080p|720p|hd\s*izle|full\s*film|yerli\s*film|türkçe\s*dublaj|turkce\s*dublaj)(\]|\))?/gi,
    ''
  );
  cleaned = cleaned.replace(/\|.*$/g, '');
  cleaned = cleaned.replace(/-.*(Film|Sinema|Arşiv|Arsiv).*$/gi, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  cleaned = cleaned.replace(/^[-:|]+|[-:|]+$/g, '').trim();
  return cleaned.length > 0 ? cleaned : title;
}

/**
 * Süreyi biçimlendirir (Örn: 5400 sn -> "1 saat 30 dk")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return 'Bilinmiyor';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} saat ${minutes > 0 ? `${minutes} dk` : ''}`.trim();
  }
  return `${minutes} dk`;
}

/**
 * Başlığı ve süreyi filtre kurallarına göre değerlendirir
 */
export function evaluateTitle(
  title: string,
  durationSeconds: number,
  options: FilterOptions
): FilterEvaluationResult {
  const clean = cleanTitle(title);
  if (!title) {
    return { passed: false, cleanTitle: '', reason: 'Başlık boş olamaz' };
  }

  // 1. Altyazı kontrolü (Kullanıcı altyazılı içerikleri kesinlikle elemek istedi)
  if (options.excludeSubtitles) {
    const subMatch = SUBTITLE_REGEX.exec(title);
    if (subMatch) {
      return {
        passed: false,
        cleanTitle: clean,
        subtitleFailed: true,
        matchedBlacklistWord: subMatch[0],
        reason: 'Altyazılı içerik elendi (Yalnızca Türkçe Dublaj veya Yerli)',
      };
    }
  }

  // 2. Regex Kara Liste Kontrolü (Fragman, klip, müzik, oyun, remix vb.)
  if (options.enableRegexBlacklist) {
    const match = BLACKLIST_REGEX.exec(title);
    if (match) {
      return {
        passed: false,
        cleanTitle: clean,
        matchedBlacklistWord: match[0],
        reason: `Alakasız içerik tespit edildi (${match[0]})`,
      };
    }
  }

  // 3. Özel ek kara liste kelimeleri kontrolü
  if (options.customBlacklistWords && options.customBlacklistWords.length > 0) {
    const lowerTitle = title.toLowerCase();
    for (const word of options.customBlacklistWords) {
      const cleanWord = word.trim().toLowerCase();
      if (cleanWord && lowerTitle.includes(cleanWord)) {
        return {
          passed: false,
          cleanTitle: clean,
          matchedBlacklistWord: cleanWord,
          reason: `Özel kara liste filtresine takıldı (${cleanWord})`,
        };
      }
    }
  }

  // 4. Süre Kontrolü (Minimum süre saniye bazında)
  const minSeconds = options.minDurationMinutes * 60;
  if (durationSeconds > 0 && durationSeconds < minSeconds) {
    const minMins = options.minDurationMinutes;
    const durMins = Math.round(durationSeconds / 60);
    return {
      passed: false,
      cleanTitle: clean,
      durationFailed: true,
      reason: `Süre çok kısa (${durMins} dk < min ${minMins} dk)`,
    };
  }

  return {
    passed: true,
    cleanTitle: clean,
  };
}

/**
 * Standard IPTV M3U / M3U8 string içeriği üretir
 */
export function generateM3U(
  items: VideoItem[],
  customOptions?: Partial<M3UGenerationOptions>
): string {
  const options: M3UGenerationOptions = {
    groupTitleMode: 'category',
    streamUrlMode: 'iptv_proxy',
    includeEpg: true,
    includeLogos: true,
    ...customOptions,
  };
  const lines: string[] = [];
  lines.push('#EXTM3U x-tvg-url="http://iptv.epg/dublaj_ve_yerli.xml"');
  lines.push(`# Türkçe Dublaj Yabancı & Yerli Film Dizi IPTV Listesi - Oluşturulan Kayıt: ${items.length}`);
  lines.push('');

  for (const item of items) {
    const safeTitle = (item.cleanTitle || item.title).replace(/"/g, "'");
    const logoAttr = options.includeLogos && item.thumbnail ? `tvg-logo="${item.thumbnail}" ` : '';
    const idAttr = options.includeEpg && item.id ? `tvg-id="${item.id}" ` : '';
    
    // 4 Ana Kategoriye göre ikon ve grup belirleme
    let icon = '🇹🇷🎬';
    let defaultGroup = 'Türk Filmleri (Yerli Sinema)';

    if (item.mainCategory === 'yabanci_film' || (item.audioLanguage === 'tr_dublaj' && item.category !== 'dizi')) {
      icon = '🌍🎬';
      defaultGroup = 'Yabancı Filmler (Türkçe Dublaj)';
    } else if (item.mainCategory === 'yabanci_dizi' || (item.audioLanguage === 'tr_dublaj' && item.category === 'dizi')) {
      icon = '🌐🎬';
      defaultGroup = 'Yabancı Diziler (Türkçe Dublaj)';
    } else if (item.mainCategory === 'turk_dizi' || item.category === 'dizi') {
      icon = '📺🎬';
      defaultGroup = 'Türk Dizileri';
    } else {
      icon = '🇹🇷🎬';
      defaultGroup = 'Türk Filmleri (Yeşilçam & Yerli)';
    }

    let group = defaultGroup;
    if (options.groupTitleMode === 'custom' && options.customGroupTitle) {
      group = options.customGroupTitle;
    } else if (options.groupTitleMode === 'channel' && item.channel) {
      group = item.channel;
    } else if (item.groupTitle) {
      group = item.groupTitle;
    }

    const infLine = `#EXTINF:-1 ${idAttr}tvg-name="${safeTitle}" ${logoAttr}group-title="${group}",${icon} ${safeTitle}`;
    lines.push(infLine);

    // IPTV oynatıcıları ve scraperlar için kamuflaj ve tampon optimizasyonu
    lines.push('#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    lines.push('#EXTVLCOPT:http-referrer=https://www.youtube.com/');
    lines.push('#EXTVLCOPT:network-caching=2000');

    let streamUrl = item.streamUrl || item.youtubeUrl;
    if (options.streamUrlMode === 'iptv_proxy') {
      const base = options.baseUrl ? options.baseUrl.replace(/\/$/, '') : '';
      // Tercih: Doğrudan genel CDN/Arşiv MP4 akışı. Yoksa yerel köprü
      streamUrl = item.streamUrl || `${base}/api/stream/${item.id}.mp4`;
    } else if (options.streamUrlMode === 'kodi') {
      streamUrl = `plugin://plugin.video.youtube/play/?video_id=${item.id}`;
    } else if (options.streamUrlMode === 'raw_stream' && item.streamUrl) {
      streamUrl = item.streamUrl;
    } else if (options.streamUrlMode === 'piped') {
      streamUrl = `https://pipedapi.kavin.rocks/streams/${item.id}`;
    }
    lines.push(streamUrl);
  }

  return lines.join('\n') + '\n';
}
