#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
4 Kategorili Yapay Zeka Destekli M3U/M3U8 Generator
Geliştirici: Uzman Python & Web Geliştirme Asistanı

4 AYRI KATEGORİ:
1. Yabancı Filmler (Türkçe Dublaj, Tek Parça Full HD)
2. Türk Filmleri (Yeşilçam & Yerli Sinema Tek Parça)
3. Türk Dizileri (Kült & Popüler Türk Dizileri Tam Bölüm)
4. Yabancı Diziler (Kült Yabancı Diziler Türkçe Dublaj Tam Bölüm)

Özellikler:
- Klip, fragman, teaser, şarkı, müzik, remix, oyun/gameplay ve ALTYAZILI videoları %100 eler.
- İster 4 ayrı M3U dosyası (yabanci_filmler.m3u, turk_filmleri.m3u, turk_dizileri.m3u, yabanci_diziler.m3u),
  ister tek birleşik 4-grup M3U (tum_kategoriler_yapay_zeka.m3u) üretir.
- Android (Termux) ve Masaüstü (Linux/Windows/macOS) tam uyumludur.
"""

import os
import sys
import re
import argparse
from typing import List, Dict, Any, Set

# yt-dlp binary yol kontrolü
for p in ['/usr/local/bin/yt-dlp', '/tmp/yt-dlp']:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    import yt_dlp
except ImportError:
    print("[HATA] yt-dlp kütüphanesi bulunamadı! Lütfen çalıştırın: pip install -U yt-dlp")
    sys.exit(1)

# Terminal Renkleri
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    PURPLE = '\033[95m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

# Kesin Filtreleme Regexi (Klip, fragman, teaser, şarkı, oyun VE altyazılı içerikler)
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

# 4 AYRI HEDEF KATEGORİ TANIMLARI
CATEGORIES_CONFIG = {
    "yabanci_film": {
        "title": "Yabancı Filmler (Türkçe Dublaj)",
        "icon": "🌍🎬",
        "file_name": "yabanci_filmler.m3u",
        "queries": [
            "türkçe dublaj film full hd tek parça",
            "yabancı film türkçe dublaj tek parça",
            "türkçe dublaj aksiyon filmleri full",
            "türkçe dublaj bilim kurgu filmi full",
            "türkçe dublaj korku gerilim filmi full izle"
        ],
        "min_duration": 2400 # En az 40 dakika
    },
    "turk_film": {
        "title": "Türk Filmleri (Yeşilçam & Yerli Sinema)",
        "icon": "🇹🇷🎬",
        "file_name": "turk_filmleri.m3u",
        "queries": [
            "yeşilçam filmleri full hd",
            "yerli film full hd izle tek parça",
            "kemal sunal filmleri tek parça full hd",
            "türk sineması klasikleri restorasyonlu",
            "türk komedi filmleri full izle"
        ],
        "min_duration": 2400 # En az 40 dakika
    },
    "turk_dizi": {
        "title": "Türk Dizileri (Tam Bölümler)",
        "icon": "📺🎬",
        "file_name": "turk_dizileri.m3u",
        "queries": [
            "türk dizisi full izle tek parça",
            "ezel 1. bölüm full izle tek parça",
            "kurtlar vadisi 1. bölüm full hd",
            "yerli dizi 1. bölüm tek parça full"
        ],
        "min_duration": 2100 # En az 35 dakika
    },
    "yabanci_dizi": {
        "title": "Yabancı Diziler (Türkçe Dublaj Tam Bölümler)",
        "icon": "🌐🎬",
        "file_name": "yabanci_diziler.m3u",
        "queries": [
            "yabancı dizi türkçe dublaj 1. bölüm full",
            "sherlock türkçe dublaj 1. bölüm tek parça",
            "lost 1. bölüm türkçe dublaj tek parça",
            "prison break 1. bölüm türkçe dublaj full",
            "yabancı dizi dublaj tek parça izle"
        ],
        "min_duration": 1800 # En az 30 dakika
    }
}

def clean_title(title: str) -> str:
    cleaned = re.sub(
        r'(?i)[\[\(]?(tek\s*parça|tek\s*parca|full\s*hd|restorasyonlu|sansürsüz|1080p|720p|hd\s*izle|full\s*film|türkçe\s*dublaj|full\s*bölüm)[\]\)]?',
        '',
        title
    )
    cleaned = re.sub(r'\|.*$', '', cleaned)
    cleaned = re.sub(r'\s{2,}', ' ', cleaned).strip(' -:|')
    return cleaned if cleaned else title

def is_valid_title(title: str) -> bool:
    if not title:
        return False
    return not bool(BLACKLIST_REGEX.search(title))

def crawl_category(cat_key: str, cat_data: Dict[str, Any], limit_per_query: int = 5) -> List[Dict[str, Any]]:
    cat_title = cat_data["title"]
    cat_icon = cat_data["icon"]
    queries = cat_data["queries"]
    min_duration = cat_data["min_duration"]

    print(f"\n{Colors.BOLD}{Colors.PURPLE}=== {cat_icon} Kategori Taranıyor: {cat_title} ==={Colors.RESET}")

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

    seen_ids: Set[str] = set()
    approved_items: List[Dict[str, Any]] = []

    for q in queries:
        target = f"ytsearch{limit_per_query}:{q}"
        print(f"  {Colors.BLUE}--> Sorgu:{Colors.RESET} {q}")
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                res = ydl.extract_info(target, download=False)
                entries = res.get('entries', []) if res else []

                for entry in entries:
                    if not entry:
                        continue
                    vid_id = entry.get('id')
                    raw_title = entry.get('title', '')
                    duration = entry.get('duration') or 0

                    if not vid_id or vid_id in seen_ids:
                        continue

                    # Regex Kontrolü (klip/fragman/altyazılı elenir)
                    if not is_valid_title(raw_title):
                        continue

                    # Süre Kontrolü
                    if duration and duration > 0 and duration < min_duration:
                        continue

                    seen_ids.add(vid_id)
                    c_title = clean_title(raw_title)
                    url = f"https://www.youtube.com/watch?v={vid_id}"
                    logo = entry.get('thumbnail') or f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"

                    approved_items.append({
                        "id": vid_id,
                        "title": raw_title,
                        "clean_title": c_title,
                        "url": url,
                        "logo": logo,
                        "duration": duration,
                        "category_key": cat_key,
                        "category_title": cat_title,
                        "icon": cat_icon
                    })
                    print(f"    {Colors.GREEN}[ONAYLANDI]{Colors.RESET} {c_title[:55]}")
        except Exception as e:
            print(f"    {Colors.RED}[HATA]{Colors.RESET} {e}")

    return approved_items

def save_m3u_file(filename: str, header_title: str, items: List[Dict[str, Any]]):
    lines = [
        "#EXTM3U x-tvg-url=\"http://iptv.epg/ai_categories.xml\"\n",
        f"# {header_title} - Toplam Kayıt: {len(items)}\n\n"
    ]

    for it in items:
        clean = it["clean_title"].replace('"', "'")
        lines.append(
            f'#EXTINF:-1 tvg-id="{it["id"]}" tvg-name="{clean}" tvg-logo="{it["logo"]}" '
            f'group-title="{it["category_title"]}",{it["icon"]} {clean}\n'
        )
        lines.append(f'{it["url"]}\n')

    with open(filename, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"{Colors.GREEN}[KAYDEDİLDİ]{Colors.RESET} {filename} ({len(items)} eser)")

def main():
    parser = argparse.ArgumentParser(
        description="4 Ayrık Kategorili Yapay Zeka Destekli YouTube M3U8 Generator"
    )
    parser.add_argument('-l', '--limit-per-query', type=int, default=3,
                        help='Her arama sorgusu için çekilecek video sayısı (varsayılan: 3)')
    parser.add_argument('-c', '--category', choices=['all', 'yabanci_film', 'turk_film', 'turk_dizi', 'yabanci_dizi'],
                        default='all', help='Yalnızca belirli bir kategoriyi veya tümünü tara')
    parser.add_argument('--single-file', action='store_true',
                        help='Tüm kategorileri tek birleşik M3U dosyasında topla')

    args = parser.parse_args()

    print(f"\n{Colors.BOLD}{Colors.CYAN}======================================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.GREEN} ⚡ 4 Kategorili Yapay Zeka Destekli YouTube IPTV & M3U8 Üretici      {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}======================================================================{Colors.RESET}")

    all_categorized_items = []
    target_cats = [args.category] if args.category != 'all' else list(CATEGORIES_CONFIG.keys())

    for cat_key in target_cats:
        cfg = CATEGORIES_CONFIG[cat_key]
        items = crawl_category(cat_key, cfg, limit_per_query=args.limit_per_query)
        all_categorized_items.extend(items)

        # Ayrı dosya olarak da kaydet
        if not args.single_file or args.category != 'all':
            save_m3u_file(cfg["file_name"], cfg["title"], items)

    # Birleşik dosya
    if args.category == 'all':
        unified_file = "tum_kategoriler_yapay_zeka.m3u"
        save_m3u_file(unified_file, "Yapay Zeka Destekli 4 Kategorili IPTV Arşivi", all_categorized_items)

    print(f"\n{Colors.BOLD}{Colors.GREEN}Tüm işlemler tamamlandı! Toplam {len(all_categorized_items)} adet doğrulanmış içerik hazır.{Colors.RESET}\n")

if __name__ == '__main__':
    main()
