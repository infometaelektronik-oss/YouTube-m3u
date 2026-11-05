import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Play, Sparkles, Filter, Code } from 'lucide-react';
import { evaluateTitle, cleanTitle, BLACKLIST_REGEX, POSITIVE_REGEX } from '../utils/filterEngine';

const SAMPLE_TITLES = [
  { text: 'Tosun Paşa - Resmi Fragmanı 1080p', type: 'junk', label: 'Fragman' },
  { text: 'Hababam Sınıfı | Kemal Sunal, Münir Özkul | Türk Filmi Tek Parça', type: 'good', label: 'Tam Film' },
  { text: 'Şaban Oğlu Şaban - En Komik Sahneler (Özel Klip)', type: 'junk', label: 'Klip / Kesit' },
  { text: 'Ezel - 1. Bölüm (Full HD Tek Parça)', type: 'good', label: 'Tam Dizi Bölümü' },
  { text: 'Kurtlar Vadisi Pusu - 45. Bölüm Özeti ve Fragmanı', type: 'junk', label: 'Özet / Fragman' },
  { text: 'Davaro | Kemal Sunal, Şener Şen | Restorasyonlu Full Film', type: 'good', label: 'Full Film' },
  { text: 'Ferdi Tayfur - Batan Güneş | Şarkı & Video Klip HD', type: 'junk', label: 'Müzik / Klip' },
  { text: 'Geniş Aile 1. Sezon 1. Bölüm Tek Parça Full HD', type: 'good', label: 'Tam Bölüm' },
  { text: 'Yeşilçam Kamera Arkası Gizli Görüntüler Röportaj', type: 'junk', label: 'Kamera Arkası' },
  { text: 'Kemal Sunal Komik Sahneleri #Shorts', type: 'junk', label: 'Shorts' },
];

export const RegexPlayground: React.FC = () => {
  const [testInput, setTestInput] = useState('Kurtlar Vadisi Pusu - 45. Bölüm Özeti ve Fragmanı');
  const [testDuration, setTestDuration] = useState<number>(5400);

  const evalResult = evaluateTitle(testInput, testDuration, {
    minDurationMinutes: 40,
    enableRegexBlacklist: true,
    enableInflectionMatching: true,
    boostPositiveKeywords: true,
    excludeSubtitles: true,
    activeModule: 'all',
    customBlacklistWords: [],
  });

  const cleaned = cleanTitle(testInput);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-5 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Regex &amp; Türkçe Başlık Filtreleme Laboratuvarı
            </h2>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              YouTube başlıklarındaki ekler (örn: <em>&quot;fragmanı&quot;, &quot;özeti&quot;, &quot;klipleri&quot;, &quot;müziği&quot;</em>) ve alakasız kısaltmaları canlı olarak test edin.
            </p>
          </div>
        </div>
      </div>

      {/* Live Interactive Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Canlı Başlık Değerlendirici</span>
          </h3>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Test Edilecek YouTube Video Başlığı:
            </label>
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Başlık girin veya aşağıdaki örneklerden seçin..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span>Simüle Edilen Video Süresi:</span>
              <span className="font-bold text-zinc-200">
                {Math.round(testDuration / 60)} dakika ({testDuration} sn)
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={7200}
              step={60}
              value={testDuration}
              onChange={(e) => setTestDuration(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] font-medium text-zinc-500 block mb-2">
              Hazır Başlık Örnekleri (Hızlı Tıkla):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TITLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestInput(sample.text)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    sample.type === 'good'
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40'
                      : 'bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/40'
                  }`}
                >
                  {sample.label}: &quot;{sample.text.slice(0, 24)}...&quot;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Evaluation Result Card */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Filtre Motoru Kararı
            </h3>

            <div
              className={`rounded-xl border p-4 text-center transition-all ${
                evalResult.passed
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-950/20 text-rose-300'
              }`}
            >
              <div className="flex justify-center mb-2">
                {evalResult.passed ? (
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-10 w-10 text-rose-400" />
                )}
              </div>
              <p className="text-base font-bold">
                {evalResult.passed ? 'M3U LİSTESİNE EKLENDİ' : 'FİLTREYE TAKILDI (ELENDİ)'}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {evalResult.passed
                  ? 'Tam metrajlı sinema veya dizi içeriği olarak onaylandı.'
                  : evalResult.reason}
              </p>
            </div>

            {/* Cleaned title preview */}
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block">
                  Temizlenmiş IPTV Başlığı:
                </span>
                <span className="font-bold text-zinc-100">{cleaned}</span>
              </div>

              {evalResult.matchedBlacklistWord && (
                <div className="border-t border-zinc-800/80 pt-2">
                  <span className="text-[10px] text-rose-400 font-semibold uppercase block">
                    Eşleşen Kara Liste Deseni:
                  </span>
                  <code className="text-rose-300 font-mono text-[11px]">
                    {evalResult.matchedBlacklistWord}
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-[11px] text-zinc-500">
            Kural: Minimum 40 dakika + Fragman/Klip/Remix/Özet regex engeli.
          </div>
        </div>
      </div>

      {/* Regex Rule Reference Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-zinc-200">
          <Code className="h-4 w-4 text-emerald-400" />
          <span>Python &amp; JavaScript Regex Kural Detayları</span>
        </div>

        <div className="space-y-3 text-xs text-zinc-300">
          <div className="rounded-xl border border-zinc-800 bg-black/60 p-3 font-mono text-emerald-400 text-[11px] overflow-x-auto">
            {BLACKLIST_REGEX.toString()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-400 text-[11px]">
            <div className="rounded-lg bg-zinc-900/80 p-3 border border-zinc-800">
              <strong className="text-zinc-200 block mb-1">Elenen Kategoriler:</strong>
              Fragmanlar, teaserlar, video klipler, müzikler/şarkılar, remixler, oyun gameplayleri, kamera arkası görüntüleri, komik anlar kesitleri, #shorts videoları, bölüm özetleri ve parçalı (part 1/4 vb.) yayınlar.
            </div>
            <div className="rounded-lg bg-zinc-900/80 p-3 border border-zinc-800">
              <strong className="text-zinc-200 block mb-1">Türkçe Ek Desteği:</strong>
              &quot;fragman&quot; kökü ile &quot;fragmanı&quot;, &quot;özet&quot; kökü ile &quot;özeti&quot;, &quot;şarkı&quot; ile &quot;şarkısı&quot;, &quot;sahne&quot; ile &quot;sahneleri&quot; regex kelime sınırları bozulmadan eksiksiz eşleşir.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
