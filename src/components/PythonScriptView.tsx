import React, { useState } from 'react';
import { Terminal, Download, Copy, Check, Smartphone, Laptop, Play, Code2, BookOpen, Layers, UserCheck, Globe } from 'lucide-react';
import { PYTHON_GENERATOR_SCRIPT, CHANNEL_EXTRACTOR_SCRIPT, TERMUX_SHELL_SCRIPT, USER_SUBMITTED_SCRIPT, MODULE2_DUBBED_SCRIPT } from '../data/pythonScripts';

export const PythonScriptView: React.FC = () => {
  const [activeScriptTab, setActiveScriptTab] = useState<'dublaj' | 'generator' | 'extractor' | 'user' | 'termux'>('dublaj');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);

  // CLI Generator state
  const [cliQuery, setCliQuery] = useState('türkçe dublaj film full hd tek parça');
  const [cliDuration, setCliDuration] = useState('2100');
  const [cliOutFile, setCliOutFile] = useState('turkce_dublaj_film_dizi.m3u');
  const [cliLimit, setCliLimit] = useState('10');
  const [cliMode, setCliMode] = useState('youtube_url');

  const currentScriptContent =
    activeScriptTab === 'dublaj'
      ? MODULE2_DUBBED_SCRIPT
      : activeScriptTab === 'generator'
      ? PYTHON_GENERATOR_SCRIPT
      : activeScriptTab === 'extractor'
      ? CHANNEL_EXTRACTOR_SCRIPT
      : activeScriptTab === 'user'
      ? USER_SUBMITTED_SCRIPT
      : TERMUX_SHELL_SCRIPT;

  const currentFileName =
    activeScriptTab === 'dublaj'
      ? 'turkce_dublaj_film_dizi_generator.py'
      : activeScriptTab === 'generator'
      ? 'yt_m3u_generator.py'
      : activeScriptTab === 'extractor'
      ? 'channel_archive_extractor.py'
      : activeScriptTab === 'user'
      ? 'turk_film_dizi_generator.py'
      : 'termux_install.sh';

  const handleCopyScript = () => {
    navigator.clipboard.writeText(currentScriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([currentScriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatedCommand = `python3 yt_m3u_generator.py -s "${cliQuery}" --min-duration ${cliDuration} --limit ${cliLimit} --stream-mode ${cliMode} -o ${cliOutFile}`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Doğrudan Çalıştırılabilir (Ready-to-Run) Python Betikleri
                </h2>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  %100 Eksiksiz &amp; Hatasız
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Bu Python kodları hiçbir eksik placeholder içermez. En verimli <code className="text-zinc-200">yt-dlp</code> flat-extract motorunu kullanır. Android tablet (Termux) ve PC üzerinde tek satırla çalıştırılabilir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
            </button>
            <button
              onClick={handleDownloadScript}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:bg-emerald-500 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>{currentFileName} İndir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Command Builder Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 mb-4">
          <Code2 className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-200">
            Termux &amp; CLI Komut Oluşturucu (Tek Tıkla Kopyala)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Arama Sorgusu (-s)</label>
            <input
              type="text"
              value={cliQuery}
              onChange={(e) => setCliQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Min. Süre (Saniye)</label>
            <select
              value={cliDuration}
              onChange={(e) => setCliDuration(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="2400">2400 sn (40 Dk - Filmler için ideal)</option>
              <option value="1800">1800 sn (30 Dk - Diziler için ideal)</option>
              <option value="3600">3600 sn (60 Dk - Uzun metraj)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Akış Türü (--stream-mode)</label>
            <select
              value={cliMode}
              onChange={(e) => setCliMode(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="youtube_url">youtube_url (TiviMate, VLC, OTT için kararlı)</option>
              <option value="raw_stream">raw_stream (Doğrudan MP4 / HLS linki)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Çıktı Dosyası (-o)</label>
            <input
              type="text"
              value={cliOutFile}
              onChange={(e) => setCliOutFile(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Command Output Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-black/60 p-3">
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono text-emerald-400">
            <span className="text-zinc-600 select-none">$</span>
            <span className="whitespace-nowrap">{generatedCommand}</span>
          </div>
          <button
            onClick={handleCopyCommand}
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
          >
            {copiedCommand ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedCommand ? 'Kopyalandı' : 'Komutu Kopyala'}</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
        {/* Subtabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveScriptTab('dublaj')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeScriptTab === 'dublaj'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-sky-300" />
              <span>turkce_dublaj_film_dizi_generator.py</span>
              <span className="rounded bg-sky-400/20 px-1.5 py-0.2 text-[10px] text-sky-200 font-bold">Modül 2</span>
            </button>

            <button
              onClick={() => setActiveScriptTab('generator')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeScriptTab === 'generator'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span>yt_m3u_generator.py</span>
              <span className="text-[10px] opacity-75">(Ana Motor)</span>
            </button>

            <button
              onClick={() => setActiveScriptTab('extractor')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeScriptTab === 'extractor'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span>channel_archive_extractor.py</span>
              <span className="text-[10px] opacity-75">(Resmi Kanal Kazıyıcı)</span>
            </button>

            <button
              onClick={() => setActiveScriptTab('user')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeScriptTab === 'user'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>turk_film_dizi_generator.py</span>
              <span className="text-[10px] opacity-75">(Senin Özel Betiğin)</span>
            </button>

            <button
              onClick={() => setActiveScriptTab('termux')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeScriptTab === 'termux'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 text-amber-400" />
              <span>termux_install.sh</span>
              <span className="text-[10px] opacity-75">(Android Kurulum)</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 font-mono hidden sm:block">
            {activeScriptTab === 'termux' ? 'Bash Shell Script' : 'Python 3.8+ (yt-dlp)'}
          </div>
        </div>

        {/* Code Content */}
        <div className="relative">
          <pre className="max-h-[500px] overflow-auto p-4 text-xs font-mono text-zinc-300 leading-relaxed selection:bg-rose-500/30">
            <code>{currentScriptContent}</code>
          </pre>
        </div>
      </div>

      {/* Termux & Mobile Environment Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm mb-3">
            <Smartphone className="h-5 w-5" />
            <h3>Android &amp; Tablet (Termux) Kurulum Rehberi</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300 leading-normal">
            <li>
              Google Play yerine <strong>F-Droid</strong> üzerinden en güncel Termux uygulamasını yükleyin.
            </li>
            <li>
              Termux terminalini açın ve şu tek satırlık hazırlık komutunu yapıştırın:
              <div className="mt-1.5 rounded-lg bg-black/70 p-2 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                pkg update -y &amp;&amp; pkg install python ffmpeg mpv -y &amp;&amp; pip install yt-dlp
              </div>
            </li>
            <li>
              Yukarıdaki <strong>yt_m3u_generator.py</strong> dosyasını cihazınıza indirin veya terminale yapıştırın.
            </li>
            <li>
              Oluşturulan M3U dosyasını doğrudan cihazda oynatmak için:
              <div className="mt-1.5 rounded-lg bg-black/70 p-2 font-mono text-[11px] text-amber-400 overflow-x-auto">
                mpv yerli_sinema_dizi.m3u8
              </div>
            </li>
          </ol>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center gap-2.5 text-sky-400 font-bold text-sm mb-3">
            <Laptop className="h-5 w-5" />
            <h3>Masaüstü (Linux / Windows / macOS) Kullanımı</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300 leading-normal">
            <li>
              Sisteminizde Python ve yt-dlp kurulu olduğundan emin olun:
              <div className="mt-1.5 rounded-lg bg-black/70 p-2 font-mono text-[11px] text-sky-400 overflow-x-auto">
                pip install --upgrade yt-dlp
              </div>
            </li>
            <li>
              İstediğiniz kategoriyi veya kanalı taratarak M3U dosyasını üretin:
              <div className="mt-1.5 rounded-lg bg-black/70 p-2 font-mono text-[11px] text-sky-300 overflow-x-auto">
                python yt_m3u_generator.py -s &quot;Yeşilçam restorasyonlu tek parça&quot; -o yesilcam.m3u8
              </div>
            </li>
            <li>
              <strong>VLC Media Player</strong>, <strong>Kodi</strong>, <strong>TiviMate</strong> veya <strong>OTT Navigator</strong> ile <code className="text-zinc-200">yesilcam.m3u8</code> dosyasını açıp kesintisiz izleyin.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
