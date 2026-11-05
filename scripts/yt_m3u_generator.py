#!/usr/bin/env python3
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
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

# Alakasız içerikleri (fragman, klip, şarkı, kesit, oyun, vb.) kesin eleyen Regex deseni
# Türkçe ekler (fragmanı, özeti, klipleri, müziği vb.) tam desteklenir
BLACKLIST_REGEX = re.compile(
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

# Tam film veya tam bölüm olduğunu doğrulayan pozitif desenler (opsiyonel öncelik)
POSITIVE_REGEX = re.compile(
    r'(?i)\b(tek\s*parça|tek\s*parca|full\s*izle|full\s*hd|sansürsüz|sansursuz|'
    r'restorasyonlu|tam\s*film|tam\s*bölüm|tam\s*bolum|bölüm\s*full|bolum\s*full|'
    r'1080p|720p|yerli\s*film|türk\s*filmi|turk\s*filmi)\b',
    re.UNICODE
)

def clean_title(title: str) -> str:
    """Başlıktaki gereksiz etiket ve parantez fazlalıklarını temizleyerek sade film adı üretir."""
    # Etiketleri ve yaygın ekleri temizle
    cleaned = re.sub(r'(?i)[\[\(]?(tek\s*parça|tek\s*parca|full\s*hd|restorasyonlu|sansürsüz|1080p|720p|hd\s*izle|full\s*film|yerli\s*film)[\]\)]?', '', title)
    cleaned = re.sub(r'\|.*$', '', cleaned)  # '| Resmi Kanal' gibi son ekleri kırp
    cleaned = re.sub(r'-.*(Film|Sinema|Arşiv|Arsiv).*$', '', cleaned)
    cleaned = re.sub(r'\s{2,}', ' ', cleaned).strip(' -:|')
    return cleaned if cleaned else title

def is_valid_title(title: str) -> bool:
    """Başlığın klip, fragman veya alakasız içerik barındırıp barındırmadığını test eder."""
    if not title:
        return False
    # Regex kara liste kontrolü
    if BLACKLIST_REGEX.search(title):
        return False
    return True

def extract_with_ytdlp(query_or_url: str,
                       is_search: bool = True,
                       max_results: int = 50,
                       min_duration_sec: int = 2400,
                       stream_mode: str = "direct_url") -> List[Dict[str, Any]]:
    """
    yt-dlp kütüphanesini en verimli şekilde kullanarak video bilgilerini toplar.
    extract_flat=True ile ağ trafiğini ve bellek tüketimini minimize eder (Termux dostu).
    """
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

    print(f"{Colors.BLUE}[BİLGİ] Bulunan ham içerik sayısı: {len(entries)}{Colors.RESET}")

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
            # print(f"  [X] Elendi (Kara Liste): {raw_title[:60]}")
            continue

        # 2. Süre filtreleme: Eğer süre bilgisi mevcutsa ve minimum sürenin altındaysa ele
        # (Örnek: 40 dakikadan (2400 sn) kısa filmler ve 30 dk altı diziler elenir)
        if duration and duration > 0 and duration < min_duration_sec:
            rejected_count_duration += 1
            # print(f"  [X] Elendi (Kısa Süre {duration}sn): {raw_title[:60]}")
            continue

        # Eğer stream_mode == 'raw_stream' istenirse yt-dlp ile doğrudan m3u8/mp4 akış URL'si alınır
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
                final_stream_url = webpage_url  # Hata durumunda güvenli youtube URL'sine dön

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
    print(f"{Colors.YELLOW}[FİLTRE ÖZETİ] {rejected_count_keyword} adet klip/fragman, {rejected_count_duration} adet kısa video elendi.{Colors.RESET}\n")

    return results

def generate_m3u8(items: List[Dict[str, Any]],
                   output_file: str,
                   group_title: str = "Yerli Sinema") -> str:
    """Sonuçları IPTV oynatıcıları (VLC, TiviMate, OTT Navigator vb.) için M3U8 dosyasına dönüştürür."""
    lines = [
        "#EXTM3U x-tvg-url=\"http://epg.example/epg.xml\"",
        f"# Yerli Sinema & Dizi IPTV Listesi - Oluşturulma: {len(items)} İçerik\n"
    ]

    for item in items:
        clean_name = item['clean_title'].replace('"', "'")
        logo = item.get('thumbnail', '')
        stream_url = item.get('url', item.get('youtube_url', ''))
        vid_id = item.get('id', '')

        # IPTV standartlarına tam uyumlu EXTINF satırı
        inf_line = (
            f'#EXTINF:-1 tvg-id="{vid_id}" '
            f'tvg-name="{clean_name}" '
            f'tvg-logo="{logo}" '
            f'group-title="{group_title}",{clean_name}'
        )
        lines.append(inf_line)
        lines.append(stream_url)

    content = "\n".join(lines) + "\n"

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"{Colors.GREEN}[KAYDEDİLDİ] M3U8 listesi başarıyla yazıldı: {output_file}{Colors.RESET}")
    except IOError as e:
        print(f"{Colors.RED}[HATA] Dosya yazılamadı:{Colors.RESET} {e}")

    return content

def main():
    parser = argparse.ArgumentParser(
        description="YouTube Telifsiz & Resmi Yerli Film/Dizi M3U8 Playlist Üreticisi (Termux / Linux / PC)"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-s', '--search', type=str, help='YouTube arama sorgusu (örn: "Yeşilçam filmleri tek parça full")')
    group.add_argument('-c', '--channel', type=str, help='Resmi kanal veya oynatma listesi URL/ID (örn: https://www.youtube.com/@ArzuFilmKanal)')

    parser.add_argument('-o', '--out', type=str, default='yerli_sinema_dizi.m3u8', help='Çıktı M3U8 dosya adı (varsayılan: yerli_sinema_dizi.m3u8)')
    parser.add_argument('-g', '--group', type=str, default='Yerli Sinema', help='IPTV grup başlığı (örn: "Yeşilçam Klasikleri", "Yerli Diziler")')
    parser.add_argument('-l', '--limit', type=int, default=30, help='Taranacak maksimum video sayısı (varsayılan: 30)')
    parser.add_argument('--min-duration', type=int, default=2400, help='Minimum video süresi saniye cinsinden (varsayılan: 2400 sn = 40 dk)')
    parser.add_argument('--stream-mode', choices=['youtube_url', 'raw_stream'], default='youtube_url',
                        help='Oynatma bağlantı türü: "youtube_url" (TiviMate, VLC, OTT Navigator için kararlı) veya "raw_stream" (doğrudan mp4/m3u8)')

    args = parser.parse_args()

    print(f"\n{Colors.BOLD}{Colors.CYAN}===================================================={Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.GREEN}   Yerli Sinema & Dizi M3U8 Generator - v1.0{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}===================================================={Colors.RESET}\n")

    if args.search:
        items = extract_with_ytdlp(
            query_or_url=args.search,
            is_search=True,
            max_results=args.limit,
            min_duration_sec=args.min_duration,
            stream_mode=args.stream_mode
        )
    else:
        items = extract_with_ytdlp(
            query_or_url=args.channel,
            is_search=False,
            max_results=args.limit,
            min_duration_sec=args.min_duration,
            stream_mode=args.stream_mode
        )

    if not items:
        print(f"{Colors.RED}[UYARI] Filtre kriterlerine uyan video bulunamadı.{Colors.RESET}")
        sys.exit(0)

    generate_m3u8(items, args.out, group_title=args.group)

    print(f"\n{Colors.BOLD}{Colors.CYAN}=== VLC / IPTV Kullanım Bilgisi ==={Colors.RESET}")
    print(f"1. Üretilen {args.out} dosyasını VLC Player ile açabilir ya da;")
    print(f"2. Termux'ta doğrudan oynatmak için: mpv {args.out}")
    print(f"3. IPTV uygulamalarına (TiviMate, Smart IPTV) yerel dosya olarak yükleyebilirsiniz.\n")

if __name__ == '__main__':
    main()
