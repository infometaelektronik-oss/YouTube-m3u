import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanTitle, evaluateTitle, generateM3U } from './filterEngine.ts';
import { VideoItem } from '../types';

test('cleanTitle strips noise tags and returns clean movie title', () => {
  const input = 'Tosun Paşa (1976) | Restorasyonlu Full Film Tek Parça';
  const cleaned = cleanTitle(input);
  assert.equal(cleaned, 'Tosun Paşa (1976)');
});

test('evaluateTitle rejects clips, trailers, songs, teasers, and shorts', () => {
  const filterOptions = {
    minDurationMinutes: 40,
    enableRegexBlacklist: true,
    enableInflectionMatching: true,
    boostPositiveKeywords: true,
    customBlacklistWords: [],
  };

  const junkCases = [
    'Tosun Paşa - Resmi Fragman',
    'Hababam Sınıfı Uyanıyor (Official Teaser)',
    'Şaban Oğlu Şaban - En Komik Sahneler (Klip)',
    'Ferdi Tayfur - Batan Güneş | Şarkı & Video Klip',
    'Kurtlar Vadisi Pusu - 45. Bölüm Özeti ve Fragmanı',
    'Geniş Aile - Cevahir ve Koyu Bilal Komik Anlar Kesit',
    'Ezel - Unutulmaz Jenerik Müziği (Remix 2024)',
    'Yeşilçam Kamera Arkası Gizli Görüntüler Röportaj',
    'Kemal Sunal Komik Sahneleri #Shorts',
    'Ezel 1. Bölüm Sonu Teaser',
    'Tosun Paşa Parça 1/4',
    'Davaro Part 2',
    'Kurtlar Vadisi Oyunu Gameplay',
  ];

  for (const junk of junkCases) {
    const res = evaluateTitle(junk, 5400, filterOptions);
    assert.equal(
      res.passed,
      false,
      `Expected '${junk}' to be rejected, but passed.`
    );
  }
});

test('evaluateTitle passes full length movies and series episodes', () => {
  const filterOptions = {
    minDurationMinutes: 40,
    enableRegexBlacklist: true,
    enableInflectionMatching: true,
    boostPositiveKeywords: true,
    customBlacklistWords: [],
  };

  const fullMovies = [
    'Tosun Paşa (1976) | Restorasyonlu Full Film Tek Parça',
    'Hababam Sınıfı | Kemal Sunal, Münir Özkul | Türk Filmi',
    'Şaban Oğlu Şaban - Sansürsüz 1080p Full HD İzle',
    'Çöpçüler Kralı (Kemal Sunal) Tek Parça Restore',
    'Ezel - 1. Bölüm (Full HD Tek Parça)',
    'Kurtlar Vadisi 1. Bölüm Full İzle HD',
    'Geniş Aile 1. Sezon 1. Bölüm Tek Parça',
    'Gırgırıye - Türk Sineması Klasikleri',
    'Süt Kardeşler 1976 Yerli Film',
  ];

  for (const movie of fullMovies) {
    const res = evaluateTitle(movie, 5400, filterOptions);
    assert.equal(
      res.passed,
      true,
      `Expected '${movie}' to pass, but was rejected with reason: ${res.reason}`
    );
  }
});

test('evaluateTitle rejects short duration videos', () => {
  const filterOptions = {
    minDurationMinutes: 40,
    enableRegexBlacklist: true,
    enableInflectionMatching: true,
    boostPositiveKeywords: true,
    customBlacklistWords: [],
  };

  // Title is fine, but duration is only 5 minutes (300 seconds)
  const res = evaluateTitle('Tosun Paşa Full Film', 300, filterOptions);
  assert.equal(res.passed, false);
  assert.equal(res.durationFailed, true);
});

test('generateM3U formats valid IPTV playlist lines', () => {
  const items: VideoItem[] = [
    {
      id: 'abc12345',
      title: 'Tosun Paşa (1976) Full HD',
      cleanTitle: 'Tosun Paşa (1976)',
      duration: 5400,
      durationFormatted: '1 saat 30 dk',
      channel: 'Arzu Film',
      thumbnail: 'https://i.ytimg.com/vi/abc12345/hqdefault.jpg',
      youtubeUrl: 'https://www.youtube.com/watch?v=abc12345',
      category: 'klasik',
      groupTitle: 'Yeşilçam Klasikleri',
      isFullMovieOrEpisode: true,
    },
  ];

  const m3uProxy = generateM3U(items, { streamUrlMode: 'iptv_proxy' });
  assert.match(m3uProxy, /^#EXTM3U/);
  assert.match(m3uProxy, /#EXTINF:-1 tvg-id="abc12345"/);
  assert.match(m3uProxy, /group-title="Yeşilçam Klasikleri"/);
  assert.match(m3uProxy, /#EXTVLCOPT:http-user-agent=/);
  assert.match(m3uProxy, /\/api\/stream\/abc12345\.mp4/);

  const m3uYoutube = generateM3U(items, { streamUrlMode: 'youtube' });
  assert.match(m3uYoutube, /https:\/\/www\.youtube\.com\/watch\?v=abc12345/);
});

test('evaluateTitle correctly eliminates subtitled content when excludeSubtitles is enabled', () => {
  const filterOptions = {
    minDurationMinutes: 40,
    enableRegexBlacklist: true,
    enableInflectionMatching: true,
    boostPositiveKeywords: true,
    excludeSubtitles: true,
    activeModule: 'dublaj' as const,
    customBlacklistWords: [],
  };

  const subtitledCases = [
    'Inception | Başlangıç - Türkçe Altyazılı Full HD İzle Tek Parça',
    'Interstellar (Altyazılı 1080p Full Film)',
    'Gladiator - Subbed Full Movie HD',
    'Avatar 2 - Türkçe Altyazı Tek Parça',
    'Yabancı Dizi 1. Sezon 1. Bölüm Subtitle Full',
  ];

  for (const item of subtitledCases) {
    const res = evaluateTitle(item, 7200, filterOptions);
    assert.equal(
      res.passed,
      false,
      `Expected subtitled item '${item}' to be rejected, but passed.`
    );
  }

  // Dubbed and domestic content must pass
  const dubbedCases = [
    'Yıldızlararası (Interstellar) - Türkçe Dublaj Full HD Tek Parça',
    'Gladyatör | Türkçe Dublaj Tek Parça Aksiyon Filmi Full',
    'Hababam Sınıfı | Kemal Sunal Full Film',
  ];

  for (const item of dubbedCases) {
    const res = evaluateTitle(item, 7200, filterOptions);
    assert.equal(
      res.passed,
      true,
      `Expected dubbed/domestic item '${item}' to pass, but failed: ${res.reason}`
    );
  }
});
