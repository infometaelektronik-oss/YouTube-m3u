export const PYTHON_GENERATOR_SCRIPT = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Yerli Sinema & Dizi M3U8 Playlist Generator
Geliştirici: Uzman Python & Web Otomasyon Asistanı
Açıklama: YouTube üzerindeki resmi/telifsiz yerli film ve dizi kanallarından
klip, fragman, şarkı ve tanıtımları akıllı regex ile filtreleyerek
doğrudan oynatılabilir standart M3U / M3U8 IPTV listesi üretir.
Termux (Android) ve Masaüstü (Linux/Windows/macOS) tam uyumludur.
"""

import sys
import os
import re
import json
import argparse
from typing import List, Dict, Any, Optional

# Renkli terminal çıktıları (Termux / CLI için optimize)
class Colors:
    GREEN = '\\033[92m'
    BLUE = '\\033[94m'
    YELLOW = '\\033[93m'
    RED = '\\033[91m'
    CYAN = '\\033[96m'
    BOLD = '\\033[1m'
    RESET = '\\033[0m'

# Alakasız içerikleri (fragman, klip, şarkı, kesit, oyun, vb.) kesin eleyen Regex deseni
# Türkçe ekler (fragmanı, özeti, klipleri, müziği vb.) tam desteklenir
BLACKLIST_REGEX = re.compile(
    r'(?i)\\b('
    r'fragman[a-zıiöüçşğ]*|teaser[s]?|klip[a-zıiöüçşğ]*|video\\s*klip[a-zıiöüçşğ]*|'
    r'şarkı[a-zıiöüçşğ]*|sarki[a-zıiöüçşğ]*|müzik[a-zıiöüçşğ]*|muzik[a-zıiöüçşğ]*|müziğ[a-zıiöüçşğ]*|'
    r'remix[a-zıiöüçşğ]*|oyun[a-zıiöüçşğ]*|gameplay|soundtrack|ost|'
    r'kamera\\s*arkas[a-zıiöüçşğ]*|özel\\s*sahne[a-zıiöüçşğ]*|ozel\\s*sahne[a-zıiöüçşğ]*|'
    r'komik\\s*anlar[a-zıiöüçşğ]*|kesit[a-zıiöüçşğ]*|shorts|bölüm\\s*sonu|bolum\\s*sonu|jenerik[a-zıiöüçşğ]*|'
    r'tanıtım[a-zıiöüçşğ]*|tanitim[a-zıiöüçşğ]*|tepki[a-zıiöüçşğ]*|reaction|'
    r'özet[a-zıiöüçşğ]*|ozet[a-zıiöüçşğ]*|röportaj[a-zıiöüçşğ]*|roportaj[a-zıiöüçşğ]*|podcast|'
    r'\\d+\\.\\s*fragman[a-zıiöüçşğ]*|ilk\\s*sahne|son\\s*sahne|efsane\\s*sahne|replik[a-zıiöüçşğ]*|'
    r'parça\\s*parça|parca\\s*parca|parça\\s*\\d+|part\\s*\\d+|'
    r'\\d+/\\d+'
    r')\\b',
    re.UNICODE
)

POSITIVE_REGEX = re.compile(
    r'(?i)\\b(tek\\s*parça|tek\\s*parca|full\\s*izle|full\\s*hd|sansürsüz|sansursuz|'
    r'restorasyonlu|tam\\s*film|tam\\s*bölüm|tam\\s*bolum|bölüm\\s*full|bolum\\s*full|'
    r'1080p|720p|yerli\\s*film|türk\\s*filmi|turk\\s*filmi)\\b',
    re.UNICODE
)

def clean_title(title: str) -> str:
    cleaned = re.sub(r'(?i)[\\[\\(]?(tek\\s*parça|tek\\s*parca|full\\s*hd|restorasyonlu|sansürsüz|1080p|720p|hd\\s*izle|full\\s*film|yerli\\s*film)[\\]\\)]?', '', title)
    cleaned = re.sub(r'\\|.*$', '', cleaned)
    cleaned = re.sub(r'-.*(Film|Sinema|Arşiv|Arsiv).*$', '', cleaned)
    cleaned = re.sub(r'\\s{2,}', ' ', cleaned).strip(' -:|')
    return cleaned if cleaned else title

def is_valid_title(title: str) -> bool:
    if not title:
        return False
    if BLACKLIST_REGEX.search(title):
        return False
    return True

def extract_with_ytdlp(query_or_url: str,
                       is_search: bool = True,
                       max_results: int = 50,
                       min_duration_sec: int = 2400,
                       stream_mode: str = "youtube_url") -> List[Dict[str, Any]]:
    try:
        import yt_dlp
    except ImportError:
        print(f"{Colors.RED}[HATA] yt-dlp Python kütüphanesi yüklü değil!{Colors.RESET}")
        print(f"{Colors.YELLOW}Lütfen çalıştırın: pip install -U yt-dlp{Colors.RESET}")
        sys.exit(1)

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'ignoreerrors': True,
        'default_search': 'ytsearch' if is_search else None,
        'socket_timeout': 15,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    }

    target = f"ytsearch{max_results}:{query_or_url}" if is_search else query_or_url
    print(f"{Colors.CYAN}==> yt-dlp ile taranıyor:{Colors.RESET} {target}")

    results = []
    rejected_count_keyword = 0
    rejected_count_duration = 0

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(target, download=False)
        except Exception as e:
            print(f"{Colors.RED}[HATA] yt-dlp ayıklama hatası:{Colors.RESET} {e}")
            return []

    if not info:
        return []

    entries = info.get('entries', []) if 'entries' in info else [info]

    for idx, entry in enumerate(entries, 1):
        if not entry:
            continue

        raw_title = entry.get('title') or ''
        duration = entry.get('duration') or 0
        video_id = entry.get('id') or ''
        webpage_url = entry.get('url') or f"https://www.youtube.com/watch?v={video_id}"
        if not webpage_url.startswith('http'):
            webpage_url = f"https://www.youtube.com/watch?v={video_id}"

        # 1. Başlık filtreleme: Klip, fragman, şarkı elemesi
        if not is_valid_title(raw_title):
            rejected_count_keyword += 1
            continue

        # 2. Süre filtreleme
        if duration and duration > 0 and duration < min_duration_sec:
            rejected_count_duration += 1
            continue

        final_stream_url = webpage_url
        if stream_mode == 'raw_stream':
            try:
                single_opts = {
                    'quiet': True,
                    'no_warnings': True,
                    'format': 'best[ext=mp4]/best',
                    'skip_download': True
                }
                with yt_dlp.YoutubeDL(single_opts) as s_ydl:
                    s_info = s_ydl.extract_info(webpage_url, download=False)
                    if s_info and 'url' in s_info:
                        final_stream_url = s_info['url']
            except Exception:
                final_stream_url = webpage_url

        thumbnail = entry.get('thumbnail') or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        channel_name = entry.get('uploader') or entry.get('channel') or "Resmi Kanal"

        results.append({
            'id': video_id,
            'title': raw_title,
            'clean_title': clean_title(raw_title),
            'duration': duration,
            'url': final_stream_url,
            'youtube_url': webpage_url,
            'thumbnail': thumbnail,
            'channel': channel_name
        })

    print(f"{Colors.GREEN}[BAŞARILI] {len(results)} adet tam film/dizi onaylandı.{Colors.RESET}")
    print(f"{Colors.YELLOW}[FİLTRE ÖZETİ] {rejected_count_keyword} adet klip/fragman, {rejected_count_duration} adet kısa video elendi.{Colors.RESET}\\n")

    return results

def generate_m3u8(items: List[Dict[str, Any]],
                   output_file: str,
                   group_title: str = "Yerli Sinema") -> str:
    lines = [
        "#EXTM3U x-tvg-url=\\"http://epg.example/epg.xml\\"",
        f"# Yerli Sinema & Dizi IPTV Listesi - Oluşturulma: {len(items)} İçerik\\n"
    ]

    for item in items:
        clean_name = item['clean_title'].replace('"', "'")
        logo = item.get('thumbnail', '')
        stream_url = item.get('url', item.get('youtube_url', ''))
        vid_id = item.get('id', '')

        inf_line = (
            f'#EXTINF:-1 tvg-id="{vid_id}" '
            f'tvg-name="{clean_name}" '
            f'tvg-logo="{logo}" '
            f'group-title="{group_title}",{clean_name}'
        )
        lines.append(inf_line)
        lines.append(stream_url)

    content = "\\n".join(lines) + "\\n"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"{Colors.GREEN}[KAYDEDİLDİ] M3U8 listesi başarıyla yazıldı: {output_file}{Colors.RESET}")
    return content

def main():
    parser = argparse.ArgumentParser(
        description="YouTube Telifsiz & Resmi Yerli Film/Dizi M3U8 Playlist Üreticisi"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-s', '--search', type=str, help='YouTube arama sorgusu (örn: "Yeşilçam filmleri tek parça full")')
    group.add_argument('-c', '--channel', type=str, help='Resmi kanal veya oynatma listesi URL/ID')

    parser.add_argument('-o', '--out', type=str, default='yerli_sinema_dizi.m3u8', help='Çıktı M3U8 dosya adı')
    parser.add_argument('-g', '--group', type=str, default='Yerli Sinema', help='IPTV grup başlığı')
    parser.add_argument('-l', '--limit', type=int, default=30, help='Taranacak maksimum video sayısı')
    parser.add_argument('--min-duration', type=int, default=2400, help='Minimum video süresi saniye cinsinden (varsayılan 2400 = 40 dk)')
    parser.add_argument('--stream-mode', choices=['youtube_url', 'raw_stream'], default='youtube_url')

    args = parser.parse_args()

    if args.search:
        items = extract_with_ytdlp(args.search, is_search=True, max_results=args.limit, min_duration_sec=args.min_duration, stream_mode=args.stream_mode)
    else:
        items = extract_with_ytdlp(args.channel, is_search=False, max_results=args.limit, min_duration_sec=args.min_duration, stream_mode=args.stream_mode)

    if not items:
        print(f"{Colors.RED}[UYARI] Filtre kriterlerine uyan video bulunamadı.{Colors.RESET}")
        sys.exit(0)

    generate_m3u8(items, args.out, group_title=args.group)

if __name__ == '__main__':
    main()
`;

export const USER_SUBMITTED_SCRIPT = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kullanıcı Özel Yerli Film & Dizi M3U Üreticisi (Optimize Edilmiş Sürüm)
Çalışma Mantığı: 4 ana kategori sorgusunu tarar, müzik/fragman kelimelerini eler,
gerçek stream URL çözümü dener, hata durumunda doğrudan YouTube URL fallback yapar.
"""
import os
import sys

# yt-dlp kütüphanesini içe aktar
try:
    import yt_dlp
except ImportError:
    print("[HATA] yt-dlp kütüphanesi bulunamadı! pip install -U yt-dlp çalıştırın.")
    sys.exit(1)

def generate_movie_series_m3u(output_filename="turk_film_dizi.m3u", count_per_query=15):
    # Sadece yerli film ve dizi arşivi sunan popüler anahtar kelimeler ve aramalar
    hedef_sorgular = [
        "türk filmleri full hd tek parça",
        "yerli film izle full",
        "türk dizisi full izle tek parça",
        "yeşilçam filmleri full hd"
    ]
    
    m3u_lines = ["#EXTM3U\\n"]
    islenen_idler = set()

    for sorgu in hedef_sorgular:
        print(f"\\n'{sorgu}' taranıyor...")
        
        ydl_opts = {
            'extract_flat': True,
            'skip_download': True,
            'quiet': True,
        }

        # yt-dlp sorgu syntax'ı (ytsearch{N}:{query})
        search_target = f"ytsearch{count_per_query}:{sorgu}"

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                result = ydl.extract_info(search_target, download=False)
                entries = result.get('entries', []) if result else []
                
                for entry in entries:
                    if not entry:
                        continue
                    video_id = entry.get('id')
                    video_title = entry.get('title', '')
                    duration = entry.get('duration') or 0
                    
                    if not video_id or video_id in islenen_idler:
                        continue
                        
                    # Müzik, klip, fragman gibi şeyleri kesin olarak filtrele
                    alt_baslik = video_title.lower()
                    yasakli_kelimeler = ['klip', 'fragman', 'teaser', 'şarkı', 'müzik', 'remix', 'cover', 'oyun', 'pubg', 'gameplay', 'shorts']
                    if any(yasak in alt_baslik for yasak in yasakli_kelimeler):
                        print(f"  [ELENDİ] {video_title}")
                        continue

                    # Süre kontrolü: 30 dakikadan kısa videoları ele
                    if duration and duration < 1800:
                        print(f"  [ELENDİ - KISA SÜRE] {video_title}")
                        continue

                    islenen_idler.add(video_id)
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    
                    # Gerçek stream adresini çözmeyi dene (VLC / MPV için)
                    stream_opts = {'format': 'best', 'skip_download': True, 'quiet': True}
                    try:
                        with yt_dlp.YoutubeDL(stream_opts) as s_ydl:
                            info = s_ydl.extract_info(video_url, download=False)
                            stream_url = info.get('url') if info else None
                            
                            target_url = stream_url if stream_url else video_url
                            m3u_lines.append(f'#EXTINF:-1 tvg-id="{video_id}" group-title="Yerli Sinema & Dizi",🎬 {video_title}\\n')
                            m3u_lines.append(f'{target_url}\\n')
                            print(f"  [EKLENDİ] {video_title}")
                    except Exception:
                        # Stream URL çözülemezse (bot koruması vb.) doğrudan YouTube linki ekle
                        m3u_lines.append(f'#EXTINF:-1 tvg-id="{video_id}" group-title="Yerli Sinema & Dizi",🎬 {video_title}\\n')
                        m3u_lines.append(f'{video_url}\\n')
                        print(f"  [EKLENDİ (URL)] {video_title}")
        except Exception as e:
            print(f"Hata: {e}")

    # Dosyayı kaydet
    with open(output_filename, "w", encoding="utf-8") as f:
        f.writelines(m3u_lines)

    print(f"\\nİşlem tamam! Sadece film ve dizilerden oluşan M3U dosyan hazır: {os.path.abspath(output_filename)}")

if __name__ == "__main__":
    generate_movie_series_m3u("turk_dizi_ve_filmler.m3u", count_per_query=15)
`;

export const CHANNEL_EXTRACTOR_SCRIPT = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Resmi Kanal ve Dizi Arşivi M3U8 Kazıyıcı (Channel Archive Extractor)
"""
import sys
import re
import argparse
from typing import List, Dict, Any

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

VERIFIED_CHANNELS = {
    "arzu_film": {
        "name": "Arzu Film Resmi Kanalı",
        "url": "https://www.youtube.com/@ArzuFilmKanal/videos",
        "group": "Yeşilçam Klasikleri (Arzu Film)"
    },
    "fanatik_klasik": {
        "name": "Fanatik Klasik Film",
        "url": "https://www.youtube.com/@fanatikklasikfilm/videos",
        "group": "Fanatik Türk Sineması"
    },
    "avsar_film": {
        "name": "Avşar Film",
        "url": "https://www.youtube.com/@avsarfilm/videos",
        "group": "Avşar Film Arşivi"
    },
    "erman_film": {
        "name": "Erman Film",
        "url": "https://www.youtube.com/@ErmanFilm/videos",
        "group": "Erman Film Klasikleri"
    },
    "gulsah_film": {
        "name": "Gülşah Film",
        "url": "https://www.youtube.com/@GulsahFilm/videos",
        "group": "Gülşah Film Arşivi"
    }
}

EXCLUDE_REGEX = re.compile(
    r'(?i)\\b('
    r'fragman[a-zıiöüçşğ]*|teaser[s]?|klip[a-zıiöüçşğ]*|video\\s*klip[a-zıiöüçşğ]*|'
    r'şarkı[a-zıiöüçşğ]*|sarki[a-zıiöüçşğ]*|müzik[a-zıiöüçşğ]*|muzik[a-zıiöüçşğ]*|müziğ[a-zıiöüçşğ]*|'
    r'remix[a-zıiöüçşğ]*|oyun[a-zıiöüçşğ]*|gameplay|soundtrack|ost|'
    r'kamera\\s*arkas[a-zıiöüçşğ]*|özel\\s*sahne[a-zıiöüçşğ]*|ozel\\s*sahne[a-zıiöüçşğ]*|'
    r'komik\\s*anlar[a-zıiöüçşğ]*|kesit[a-zıiöüçşğ]*|shorts|bölüm\\s*sonu|bolum\\s*sonu|jenerik[a-zıiöüçşğ]*|'
    r'tanıtım[a-zıiöüçşğ]*|tanitim[a-zıiöüçşğ]*|tepki[a-zıiöüçşğ]*|reaction|'
    r'özet[a-zıiöüçşğ]*|ozet[a-zıiöüçşğ]*|röportaj[a-zıiöüçşğ]*|roportaj[a-zıiöüçşğ]*|podcast|'
    r'\\d+\\.\\s*fragman[a-zıiöüçşğ]*|ilk\\s*sahne|son\\s*sahne|efsane\\s*sahne|replik[a-zıiöüçşğ]*|'
    r'parça\\s*parça|parca\\s*parca|parça\\s*\\d+|part\\s*\\d+|'
    r'\\d+/\\d+'
    r')\\b',
    re.UNICODE
)

def filter_title(title: str) -> bool:
    if not title:
        return False
    return not bool(EXCLUDE_REGEX.search(title))

def crawl_channel(channel_url: str,
                  group_title: str,
                  max_items: int = 100,
                  min_duration_sec: int = 1800,
                  output_file: str = "yerli_arsiv.m3u8"):
    if yt_dlp is None:
        print("[HATA] yt-dlp modülü yüklü değil! pip install yt-dlp komutunu çalıştırın.")
        sys.exit(1)

    print(f"[*] Kanal taranıyor: {channel_url}")
    ydl_opts = {
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
        'playlistend': max_items,
        'ignoreerrors': True
    }

    approved_items = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(channel_url, download=False)
        except Exception as e:
            print(f"[!] Hata: {e}")
            return

        entries = info.get('entries', []) if info else []
        for entry in entries:
            if not entry:
                continue

            title = entry.get('title', '')
            duration = entry.get('duration', 0)
            vid_id = entry.get('id', '')
            url = entry.get('url') or f"https://www.youtube.com/watch?v={vid_id}"

            if not filter_title(title):
                continue

            if duration and duration < min_duration_sec:
                continue

            clean = re.sub(r'\\|.*$', '', title).strip()
            clean = re.sub(r'[\\[\\(].*?(Full|Tek Parça|Restorasyonlu).*?[\\]\\)]', '', clean, flags=re.I).strip()

            approved_items.append({
                'id': vid_id,
                'title': clean if clean else title,
                'url': url,
                'logo': f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg",
                'duration': duration
            })

    lines = [
        "#EXTM3U",
        f"# Kanal: {group_title} | Toplam Eser: {len(approved_items)}\\n"
    ]
    for it in approved_items:
        lines.append(f'#EXTINF:-1 tvg-id="{it["id"]}" tvg-name="{it["title"]}" tvg-logo="{it["logo"]}" group-title="{group_title}",{it["title"]}')
        lines.append(it["url"])

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\\n".join(lines) + "\\n")

    print(f"[+] Başarılı! {len(approved_items)} adet içerik '{output_file}' dosyasına kaydedildi.")

def main():
    parser = argparse.ArgumentParser(description="YouTube Resmi Kanal & Dizi Arşivi M3U8 Kazıyıcı")
    parser.add_argument('-u', '--url', type=str, help='Kanal videolar sekmesi URL')
    parser.add_argument('-p', '--preset', choices=list(VERIFIED_CHANNELS.keys()), help='Hazır kanal')
    parser.add_argument('-o', '--out', type=str, default='yerli_arsiv.m3u8', help='M3U8 çıktı dosyası')
    parser.add_argument('-l', '--limit', type=int, default=80, help='Taranacak video sınırı')
    parser.add_argument('-m', '--min-duration', type=int, default=1800, help='Minimum saniye (varsayılan: 1800 sn / 30 dk)')

    args = parser.parse_args()
    if args.preset:
        c = VERIFIED_CHANNELS[args.preset]
        crawl_channel(c["url"], c["group"], args.limit, args.min_duration, args.out)
    elif args.url:
        crawl_channel(args.url, "Özel Yerli Kanal", args.limit, args.min_duration, args.out)
    else:
        print("Lütfen --preset veya --url belirtin.")

if __name__ == '__main__':
    main()
`;

export const TERMUX_SHELL_SCRIPT = `#!/data/data/com.termux/files/usr/bin/bash
# Yerli Sinema & Dizi M3U8 Generator - Termux Kurulum ve Çalıştırma Betiği
set -e

echo -e "\\033[92m====================================================\\033[0m"
echo -e "\\033[96m   Termux Yerli Film & Dizi M3U8 Generator Kurulumu  \\033[0m"
echo -e "\\033[92m====================================================\\033[0m"

echo -e "\\033[93m[1/4] Gerekli paketler kuruluyor...\\033[0m"
pkg update -y && pkg install python ffmpeg curl mpv git -y

echo -e "\\033[93m[2/4] yt-dlp kuruluyor...\\033[0m"
pip install --upgrade pip yt-dlp

echo -e "\\033[93m[3/4] İzinler ayarlanıyor...\\033[0m"
chmod +x yt_m3u_generator.py channel_archive_extractor.py

echo -e "\\033[92m[4/4] Kurulum tamamlandı!\\033[0m"
echo ""
echo "Örnek Çalıştırma:"
echo "python3 yt_m3u_generator.py -s 'Kemal Sunal tek parça full' -o kemalsunal.m3u8"
echo "mpv kemalsunal.m3u8"
`;

export const MODULE2_DUBBED_SCRIPT = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
İkinci Modül: YouTube Türkçe Dublaj Yabancı / Yerli Film & Dizi Tarayıcı
Geliştirici: Uzman Python & Web Geliştirme Asistanı

Özellikler:
- YouTube üzerindeki resmi/telifsiz yerli filmleri, tam parça dizileri ve Türkçe dublaj yabancı filmleri tarar.
- Müzik, klip, fragman, teaser, oyun ve ALTYAZILI içerikleri kesinlikle eler.
- Sadece seslendirmeli (Türkçe dublaj) ve yerli orijinal sesli tam içerikleri kabul eder.
- yt-dlp ile optimize edilmiş flat-extract kullanır; Termux ve PC için doğrudan çalıştırılabilirdir.
"""

import os
import sys
import re
import argparse
from typing import List, Dict, Any, Set

try:
    import yt_dlp
except ImportError:
    print("[HATA] yt-dlp kütüphanesi bulunamadı! pip install -U yt-dlp çalıştırın.")
    sys.exit(1)

BLACKLIST_REGEX = re.compile(
    r'(?i)\\b('
    r'klip[a-zıiöüçşğ]*|video\\s*klip[a-zıiöüçşğ]*|'
    r'fragman[a-zıiöüçşğ]*|teaser[s]?|'
    r'şarkı[a-zıiöüçşğ]*|sarki[a-zıiöüçşğ]*|müzik[a-zıiöüçşğ]*|muzik[a-zıiöüçşğ]*|müziğ[a-zıiöüçşğ]*|'
    r'remix[a-zıiöüçşğ]*|cover|soundtrack|ost|'
    r'oyun[a-zıiöüçşğ]*|gameplay|pubg|valorant|gta|walkthrough|'
    r'altyazı[a-zıiöüçşğ]*|altyazili|altyazılı|subbed|subtitle[s]?|türkçe\\s*altyazı[a-zıiöüçşğ]*|'
    r'kamera\\s*arkas[a-zıiöüçşğ]*|özel\\s*sahne[a-zıiöüçşğ]*|ozel\\s*sahne[a-zıiöüçşğ]*|'
    r'komik\\s*anlar[a-zıiöüçşğ]*|kesit[a-zıiöüçşğ]*|shorts|bölüm\\s*sonu|bolum\\s*sonu|jenerik[a-zıiöüçşğ]*|'
    r'tanıtım[a-zıiöüçşğ]*|tanitim[a-zıiöüçşğ]*|tepki[a-zıiöüçşğ]*|reaction|'
    r'özet[a-zıiöüçşğ]*|ozet[a-zıiöüçşğ]*|röportaj[a-zıiöüçşğ]*|roportaj[a-zıiöüçşğ]*|podcast|'
    r'\\d+\\.\\s*fragman[a-zıiöüçşğ]*|ilk\\s*sahne|son\\s*sahne|efsane\\s*sahne|'
    r'parça\\s*parça|parca\\s*parca|parça\\s*\\d+|part\\s*\\d+|'
    r'\\d+/\\d+'
    r')\\b',
    re.UNICODE
)

HEDEF_SORGULAR = [
    {"query": "tiwitube türkçe dublaj tek parça", "category": "Yabancı Sinema (TiwiTube)", "icon": "🌍🎬"},
    {"query": "tiwitube film izle full hd", "category": "Yabancı Sinema (TiwiTube)", "icon": "🌍🎬"},
    {"query": "türkçe dublaj film full hd tek parça", "category": "Yabancı Film (Dublaj)", "icon": "🌍🎬"},
    {"query": "yabancı film türkçe dublaj tek parça", "category": "Yabancı Film (Dublaj)", "icon": "🌍🎬"},
    {"query": "türkçe dublaj aksiyon filmleri full", "category": "Aksiyon (Dublaj)", "icon": "💥🎬"},
    {"query": "türkçe dublaj bilim kurgu filmi full", "category": "Bilim Kurgu (Dublaj)", "icon": "🚀🎬"},
    {"query": "türkçe dublaj korku filmi full izle", "category": "Korku & Gerilim (Dublaj)", "icon": "👻🎬"},
    {"query": "türk dizisi full izle tek parça", "category": "Yerli Dizi", "icon": "📺🎬"},
    {"query": "yerli film full hd izle tek parça", "category": "Yerli Sinema", "icon": "🇹🇷🎬"},
    {"query": "yeşilçam filmleri full hd", "category": "Yeşilçam Klasikleri", "icon": "⭐🎬"},
]

def clean_title(title: str) -> str:
    cleaned = re.sub(r'(?i)[\\[\\(]?(tek\\s*parça|tek\\s*parca|full\\s*hd|restorasyonlu|sansürsüz|1080p|720p|hd\\s*izle|full\\s*film|türkçe\\s*dublaj)[\\]\\)]?', '', title)
    cleaned = re.sub(r'\\|.*$', '', cleaned)
    cleaned = re.sub(r'\\s{2,}', ' ', cleaned).strip(' -:|')
    return cleaned if cleaned else title

def is_valid_title(title: str) -> bool:
    if not title:
        return False
    return not bool(BLACKLIST_REGEX.search(title))

def generate_global_dubbed_m3u(output_filename: str = "turkce_dublaj_film_dizi.m3u",
                                count_per_query: int = 10,
                                min_duration_sec: int = 2100,
                                stream_mode: str = "youtube_url"):
    m3u_lines = [
        "#EXTM3U x-tvg-url=\\"http://iptv.epg/dublaj_yerli.xml\\"\\n",
        "# Türkçe Dublaj & Yerli Film Dizi IPTV Listesi\\n\\n"
    ]
    islenen_idler: Set[str] = set()
    total_approved = 0

    ydl_opts = {
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'quiet': True,
        'ignoreerrors': True,
    }

    for target in HEDEF_SORGULAR:
        sorgu = target["query"]
        group_category = target["category"]
        icon = target["icon"]
        search_target = f"ytsearch{count_per_query}:{sorgu}"

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                result = ydl.extract_info(search_target, download=False)
                entries = result.get('entries', []) if result else []

                for entry in entries:
                    if not entry:
                        continue
                    video_id = entry.get('id')
                    raw_title = entry.get('title', '')
                    duration = entry.get('duration') or 0

                    if not video_id or video_id in islenen_idler:
                        continue
                    if not is_valid_title(raw_title):
                        continue
                    if duration and duration > 0 and duration < min_duration_sec:
                        continue

                    islenen_idler.add(video_id)
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    c_title = clean_title(raw_title)
                    logo = entry.get('thumbnail') or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

                    extinf = (
                        f'#EXTINF:-1 tvg-id="{video_id}" '
                        f'tvg-name="{c_title}" '
                        f'tvg-logo="{logo}" '
                        f'group-title="{group_category}",{icon} {c_title}\\n'
                    )
                    m3u_lines.append(extinf)
                    m3u_lines.append('#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\\n')
                    m3u_lines.append('#EXTVLCOPT:http-referrer=https://www.youtube.com/\\n')
                    m3u_lines.append('#EXTVLCOPT:network-caching=2500\\n')
                    m3u_lines.append(f"{video_url}\\n")
                    total_approved += 1
        except Exception as e:
            print(f"Hata: {e}")

    with open(output_filename, "w", encoding="utf-8") as f:
        f.writelines(m3u_lines)
    print(f"İşlem tamam! Toplam {total_approved} adet içerik '{output_filename}' dosyasına yazıldı.")

if __name__ == '__main__':
    generate_global_dubbed_m3u()
`;

