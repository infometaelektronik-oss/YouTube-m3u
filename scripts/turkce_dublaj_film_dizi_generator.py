#!/usr/bin/env python3
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

# yt-dlp binary yolu kontrolü
for p in ['/usr/local/bin/yt-dlp', '/tmp/yt-dlp']:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    import yt_dlp
except ImportError:
    print("[HATA] yt-dlp kütüphanesi bulunamadı! pip install -U yt-dlp çalıştırın.")
    sys.exit(1)

# Renkli terminal çıktıları
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

# Kesin kara liste (klip, fragman, teaser, şarkı, oyun VE altyazılı içerikler)
BLACKLIST_REGEX = re.compile(
    r'(?i)\b('
    r'klip[a-zıiöüçşğ]*|video\s*klip[a-zıiöüçşğ]*|'
    r'fragman[a-zıiöüçşğ]*|teaser[s]?|'
    r'şarkı[a-zıiöüçşğ]*|sarki[a-zıiöüçşğ]*|müzik[a-zıiöüçşğ]*|muzik[a-zıiöüçşğ]*|müziğ[a-zıiöüçşğ]*|'
    r'remix[a-zıiöüçşğ]*|cover|soundtrack|ost|'
    r'oyun[a-zıiöüçşğ]*|gameplay|pubg|valorant|gta|walkthrough|'
    r'altyazı[a-zıiöüçşğ]*|altyazili|altyazılı|subbed|subtitle[s]?|türkçe\s*altyazı[a-zıiöüçşğ]*|'
    r'kamera\s*arkas[a-zıiöüçşğ]*|özel\s*sahne[a-zıiöüçşğ]*|ozel\s*sahne[a-zıiöüçşğ]*|'
    r'komik\s*anlar[a-zıiöüçşğ]*|kesit[a-zıiöüçşğ]*|shorts|bölüm\s*sonu|bolum\s*sonu|jenerik[a-zıiöüçşğ]*|'
    r'tanıtım[a-zıiöüçşğ]*|tanitim[a-zıiöüçşğ]*|tepki[a-zıiöüçşğ]*|reaction|'
    r'özet[a-zıiöüçşğ]*|ozet[a-zıiöüçşğ]*|röportaj[a-zıiöüçşğ]*|roportaj[a-zıiöüçşğ]*|podcast|'
    r'\d+\.\s*fragman[a-zıiöüçşğ]*|ilk\s*sahne|son\s*sahne|efsane\s*sahne|'
    r'parça\s*parça|parca\s*parca|parça\s*\d+|part\s*\d+|'
    r'\d+/\d+'
    r')\b',
    re.UNICODE
)

# Hedef arama kategorileri (TiwiTube Resmi Kanalı & Kült Yapımlar)
HEDEF_SORGULAR = [
    {"query": "tiwitube türkçe dublaj tek parça full", "category": "Yabancı Sinema (TiwiTube)", "icon": "🌍🎬"},
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
    cleaned = re.sub(r'(?i)[\[\(]?(tek\s*parça|tek\s*parca|full\s*hd|restorasyonlu|sansürsüz|1080p|720p|hd\s*izle|full\s*film|türkçe\s*dublaj)[\]\)]?', '', title)
    cleaned = re.sub(r'\|.*$', '', cleaned)
    cleaned = re.sub(r'\s{2,}', ' ', cleaned).strip(' -:|')
    return cleaned if cleaned else title

def is_valid_title(title: str) -> bool:
    if not title:
        return False
    return not bool(BLACKLIST_REGEX.search(title))

def generate_global_dubbed_m3u(output_filename: str = "turkce_dublaj_film_dizi.m3u",
                                count_per_query: int = 10,
                                min_duration_sec: int = 2100,
                                stream_mode: str = "youtube_url") -> List[Dict[str, Any]]:
    print(f"\n{Colors.BOLD}{Colors.CYAN}======================================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.GREEN} 🌐 İkinci Modül: Türkçe Dublaj Yabancı / Yerli Film & Dizi Tarayıcı {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}======================================================================{Colors.RESET}\n")

    m3u_lines = [
        "#EXTM3U x-tvg-url=\"http://iptv.epg/dublaj_yerli.xml\"\n",
        f"# Türkçe Dublaj & Yerli Film Dizi IPTV Listesi\n\n"
    ]

    islenen_idler: Set[str] = set()
    approved_items: List[Dict[str, Any]] = []
    total_rejected = 0

    ydl_opts = {
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'quiet': True,
        'ignoreerrors': True,
        'socket_timeout': 15,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    }

    for target in HEDEF_SORGULAR:
        sorgu = target["query"]
        group_category = target["category"]
        icon = target["icon"]

        print(f"{Colors.BLUE}[*] Taranıyor:{Colors.RESET} {sorgu}")
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

                    # 1. Başlık Elemesi: Klip, fragman, şarkı, oyun ve ALTYAZILI içerikleri ele
                    if not is_valid_title(raw_title):
                        total_rejected += 1
                        continue

                    # 2. Süre Elemesi: En az 35 dk (2100 saniye)
                    if duration and duration > 0 and duration < min_duration_sec:
                        total_rejected += 1
                        continue

                    islenen_idler.add(video_id)
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    final_stream_url = video_url

                    # İsteğe bağlı doğrudan raw stream URL çözümü (VLC / MPV için)
                    if stream_mode == "raw_stream":
                        try:
                            stream_opts = {'format': 'best', 'skip_download': True, 'quiet': True}
                            with yt_dlp.YoutubeDL(stream_opts) as s_ydl:
                                info = s_ydl.extract_info(video_url, download=False)
                                if info and 'url' in info:
                                    final_stream_url = info['url']
                        except Exception:
                            final_stream_url = video_url

                    c_title = clean_title(raw_title)
                    logo = entry.get('thumbnail') or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

                    # M3U Satırları
                    extinf = (
                        f'#EXTINF:-1 tvg-id="{video_id}" '
                        f'tvg-name="{c_title}" '
                        f'tvg-logo="{logo}" '
                        f'group-title="{group_category}",{icon} {c_title}\n'
                    )
                    m3u_lines.append(extinf)
                    m3u_lines.append(f"{final_stream_url}\n")

                    approved_items.append({
                        'id': video_id,
                        'title': raw_title,
                        'clean_title': c_title,
                        'category': group_category,
                        'icon': icon,
                        'duration': duration,
                        'url': final_stream_url,
                        'youtube_url': video_url,
                        'thumbnail': logo
                    })
                    print(f"  {Colors.GREEN}[EKLENDİ]{Colors.RESET} {icon} {c_title[:60]}")

        except Exception as e:
            print(f"  {Colors.RED}[HATA]{Colors.RESET} {e}")

    # M3U8 Dosyasını Kaydet
    try:
        with open(output_filename, "w", encoding="utf-8") as f:
            f.writelines(m3u_lines)
        print(f"\n{Colors.BOLD}{Colors.GREEN}[BAŞARILI] Toplam {len(approved_items)} adet Türkçe Dublaj ve Yerli eser kaydedildi!{Colors.RESET}")
        print(f"{Colors.YELLOW}[FİLTRE BİLGİSİ] {total_rejected} adet fragman, klip, oyun veya altyazılı video elendi.{Colors.RESET}")
        print(f"{Colors.CYAN}Dosya Konumu: {os.path.abspath(output_filename)}{Colors.RESET}\n")
    except IOError as err:
        print(f"{Colors.RED}[HATA] Dosya yazılamadı:{Colors.RESET} {err}")

    return approved_items

import time

def run_continuous_scan(output_filename: str = "turkce_dublaj_film_dizi.m3u",
                        count_per_query: int = 8,
                        min_duration_sec: int = 2100,
                        stream_mode: str = "youtube_url",
                        interval_minutes: int = 15):
    print(f"\n{Colors.BOLD}{Colors.GREEN}[OTONOM TARAYICI AKTİF] Her {interval_minutes} dakikada bir TiwiTube ve tüm kanallar taranacak.{Colors.RESET}")
    print(f"{Colors.YELLOW}Durdurmak için Ctrl+C tuşlayabilirsiniz.{Colors.RESET}\n")
    iteration = 1
    while True:
        print(f"\n{Colors.BOLD}{Colors.CYAN}--- Döngü #{iteration} Başlatılıyor ({time.strftime('%H:%M:%S')}) ---{Colors.RESET}")
        try:
            generate_global_dubbed_m3u(
                output_filename=output_filename,
                count_per_query=count_per_query,
                min_duration_sec=min_duration_sec,
                stream_mode=stream_mode
            )
        except Exception as err:
            print(f"{Colors.RED}[Döngü Hatası]{Colors.RESET} {err}")

        print(f"\n{Colors.BLUE}Sonraki otomatik tarama {interval_minutes} dakika sonra yapılacak... Bekleniyor.{Colors.RESET}")
        time.sleep(interval_minutes * 60)
        iteration += 1

def main():
    parser = argparse.ArgumentParser(
        description="YouTube Türkçe Dublaj Yabancı / Yerli Film & Dizi M3U8 Tarayıcısı (TiwiTube Destekli)"
    )
    parser.add_argument('-o', '--out', type=str, default='turkce_dublaj_film_dizi.m3u',
                        help='Çıktı M3U dosya adı (varsayılan: turkce_dublaj_film_dizi.m3u)')
    parser.add_argument('-l', '--limit-per-query', type=int, default=8,
                        help='Her kategori sorgusundan çekilecek video adedi (varsayılan: 8)')
    parser.add_argument('-m', '--min-duration', type=int, default=2100,
                        help='Minimum süre saniye cinsinden (varsayılan: 2100 sn = 35 dk)')
    parser.add_argument('--stream-mode', choices=['youtube_url', 'raw_stream'], default='youtube_url',
                        help='Akış URL formatı (varsayılan: youtube_url)')
    parser.add_argument('--continuous', action='store_true',
                        help='Devamlı periyodik tarama modunu başlat (her X dakikada bir otomatik günceller)')
    parser.add_argument('--interval', type=int, default=15,
                        help='Devamlı tarama aralığı dakika cinsinden (varsayılan: 15 dk)')

    args = parser.parse_args()

    if args.continuous:
        run_continuous_scan(
            output_filename=args.out,
            count_per_query=args.limit_per_query,
            min_duration_sec=args.min_duration,
            stream_mode=args.stream_mode,
            interval_minutes=args.interval
        )
    else:
        generate_global_dubbed_m3u(
            output_filename=args.out,
            count_per_query=args.limit_per_query,
            min_duration_sec=args.min_duration,
            stream_mode=args.stream_mode
        )

if __name__ == '__main__':
    main()
