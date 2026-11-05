#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Resmi Kanal ve Dizi Arşivi M3U8 Kazıyıcı (Channel Archive Extractor)
Geliştirici: Uzman Python & Web Otomasyon Asistanı
Açıklama: Belirtilen resmi YouTube kanalının (Arzu Film, Fanatik Klasik, Avşar Film vb.)
veya dizi oynatma listelerinin tüm videolarını tarar, fragman/klip içeriklerini
kesinlikle filtreleyerek bölümleri kronolojik veya sezon sırasına göre M3U listesine döker.
"""

import sys
import re
import argparse
from typing import List, Dict, Any

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

# Bilinen doğrulanmış resmi yerli sinema & dizi kanalları
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

# Alakasız içerikleri (fragman, klip, şarkı, kesit, vb.) kesin eleyen regex
EXCLUDE_REGEX = re.compile(
    r'(?i)\b('
    r'fragman[a-zıiöüçşğ]*|teaser[s]?|klip[a-zıiöüçşğ]*|video\s*klip[a-zıiöüçşğ]*|'
    r'şarkı[a-zıiöüçşğ]*|sarki[a-zıiöüçşğ]*|müzik[a-zıiöüçşğ]*|muzik[a-zıiöüçşğ]*|müziğ[a-zıiöüçşğ]*|'
    r'remix[a-zıiöüçşğ]*|oyun[a-zıiöüçşğ]*|gameplay|soundtrack|ost|'
    r'kamera\s*arkas[a-zıiöüçşğ]*|özel\s*sahne[a-zıiöüçşğ]*|ozel\s*sahne[a-zıiöüçşğ]*|'
    r'komik\s*anlar[a-zıiöüçşğ]*|kesit[a-zıiöüçşğ]*|shorts|bölüm\s*sonu|bolum\s*sonu|jenerik[a-zıiöüçşğ]*|'
    r'tanıtım[a-zıiöüçşğ]*|tanitim[a-zıiöüçşğ]*|tepki[a-zıiöüçşğ]*|reaction|'
    r'özet[a-zıiöüçşğ]*|ozet[a-zıiöüçşğ]*|röportaj[a-zıiöüçşğ]*|roportaj[a-zıiöüçşğ]*|podcast|'
    r'\d+\.\s*fragman[a-zıiöüçşğ]*|ilk\s*sahne|son\s*sahne|efsane\s*sahne|replik[a-zıiöüçşğ]*|'
    r'parça\s*parça|parca\s*parca|parça\s*\d+|part\s*\d+|'
    r'\d+/\d+'
    r')\b',
    re.UNICODE
)

def filter_title(title: str) -> bool:
    """Başlık kontrolü."""
    if not title:
        return False
    return not bool(EXCLUDE_REGEX.search(title))

def crawl_channel(channel_url: str,
                  group_title: str,
                  max_items: int = 100,
                  min_duration_sec: int = 1800,
                  output_file: str = "kanal_arsivi.m3u8"):
    """Kanal arşivini tarar ve temiz M3U8 dosyası üretir."""
    if yt_dlp is None:
        print("[HATA] yt-dlp modülü yüklü değil! pip install yt-dlp komutunu çalıştırın.")
        sys.exit(1)

    print(f"[*] Kanal taranıyor: {channel_url}")
    print(f"[*] Minimum süre: {min_duration_sec} sn | Maksimum öğe: {max_items}")

    ydl_opts = {
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
        'playlistend': max_items,
        'ignoreerrors': True
    }

    approved_items: List[Dict[str, Any]] = []

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

            # Regex filtreleme
            if not filter_title(title):
                continue

            # Süre kontrolü
            if duration and duration < min_duration_sec:
                continue

            # Temiz başlık
            clean = re.sub(r'\|.*$', '', title).strip()
            clean = re.sub(r'[\[\(].*?(Full|Tek Parça|Restorasyonlu).*?[\]\)]', '', clean, flags=re.I).strip()

            approved_items.append({
                'id': vid_id,
                'title': clean if clean else title,
                'url': url,
                'logo': f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg",
                'duration': duration
            })

    # M3U8 dosyası yaz
    lines = [
        "#EXTM3U",
        f"# Kanal: {group_title} | Toplam Eser: {len(approved_items)}\n"
    ]
    for it in approved_items:
        lines.append(f'#EXTINF:-1 tvg-id="{it["id"]}" tvg-name="{it["title"]}" tvg-logo="{it["logo"]}" group-title="{group_title}",{it["title"]}')
        lines.append(it["url"])

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines) + "\n")

    print(f"[+] Başarılı! {len(approved_items)} adet içerik '{output_file}' dosyasına kaydedildi.")

def main():
    parser = argparse.ArgumentParser(description="YouTube Resmi Kanal & Dizi Arşivi M3U8 Kazıyıcı")
    parser.add_argument('-u', '--url', type=str, help='Kanal videolar sekmesi URL (örn: https://www.youtube.com/@ArzuFilmKanal/videos)')
    parser.add_argument('-p', '--preset', choices=list(VERIFIED_CHANNELS.keys()), help='Hazır doğrulanmış Türk film arşivi kanalı seçin')
    parser.add_argument('-o', '--out', type=str, default='yerli_arsiv.m3u8', help='M3U8 çıktı dosyası')
    parser.add_argument('-l', '--limit', type=int, default=80, help='Taranacak video sınırı')
    parser.add_argument('-m', '--min-duration', type=int, default=1800, help='Minimum saniye (varsayılan: 1800 sn / 30 dk)')

    args = parser.parse_args()

    if args.preset:
        channel_data = VERIFIED_CHANNELS[args.preset]
        crawl_channel(
            channel_url=channel_data["url"],
            group_title=channel_data["group"],
            max_items=args.limit,
            min_duration_sec=args.min_duration,
            output_file=args.out
        )
    elif args.url:
        crawl_channel(
            channel_url=args.url,
            group_title="Özel Yerli Kanal",
            max_items=args.limit,
            min_duration_sec=args.min_duration,
            output_file=args.out
        )
    else:
        print("Lütfen bir --preset veya --url belirtin! Seçenekler:")
        for k, v in VERIFIED_CHANNELS.items():
            print(f"  --preset {k:<15} ({v['name']})")

if __name__ == '__main__':
    main()
