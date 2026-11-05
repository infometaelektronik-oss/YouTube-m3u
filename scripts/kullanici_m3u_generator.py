#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Yerli & Yabancı Sinema ve Dizi IPTV M3U Üreteci (Optimize & Donma Korumalı)
========================================================================
IPTV Oynatıcılarında (TiviMate, VLC, GSE) YouTube Akışlarının Donma Sebepleri ve Çözümü:
1. YouTube doğrudan video değil, HTML ve şifreli JS döner -> #EXTINF sonrasında gerçek stream adresi veya bridge kullanılır.
2. googlevideo.com linkleri User-Agent ve Referer kontrolü yapar -> #EXTVLCOPT direktifleri eklenir.
3. 'format: best' bazen sadece video (ses yok) verir -> AVC1 (H.264) + AAC ses formatı zorunlu tutulur.
"""

import os
import sys

# Standalone yt-dlp binary yolunu ekle
for p in ['/usr/local/bin/yt-dlp', '/tmp/yt-dlp']:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    import yt_dlp
except ImportError:
    print("[HATA] yt_dlp kütüphanesi bulunamadı! 'pip install yt-dlp' çalıştırın.")
    sys.exit(1)

def generate_movie_series_m3u(output_filename="turk_film_dizi.m3u", count_per_query=5):
    hedef_sorgular = [
        "türk filmleri full hd tek parça",
        "yerli film izle full",
        "türk dizisi full izle tek parça",
        "yeşilçam filmleri full hd"
    ]
    
    m3u_lines = [
        "#EXTM3U x-tvg-url=\"http://iptv.epg/tvg.xml\"\n",
        "# IPTV Player Optimize Edilmiş Liste (TiviMate & VLC Uyumlu)\n\n"
    ]
    islenen_idler = set()

    for sorgu in hedef_sorgular:
        print(f"\n'{sorgu}' taranıyor...")
        
        ydl_opts = {
            'extract_flat': True,
            'skip_download': True,
            'quiet': True,
        }

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
                    yasakli_kelimeler = ['klip', 'fragman', 'teaser', 'şarkı', 'müzik', 'remix', 'cover', 'oyun', 'pubg', 'gameplay', 'shorts', 'trailer']
                    if any(yasak in alt_baslik for yasak in yasakli_kelimeler):
                        print(f"  [ELENDİ] {video_title}")
                        continue

                    # Süre kontrolü: 30 dakikadan (1800 sn) kısa videoları ele
                    if duration and duration < 1800:
                        print(f"  [ELENDİ - KISA SÜRE {duration}sn] {video_title}")
                        continue

                    islenen_idler.add(video_id)
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    
                    # Donma ve Hata Korumalı Format Seçimi:
                    # H.264 (AVC1) video + AAC ses (tüm TV'lerin donmadan donanımsal çözebildiği standart)
                    stream_opts = {
                        'format': 'best[ext=mp4][vcodec^=avc1][acodec!=none]/best[ext=mp4][acodec!=none]/best',
                        'skip_download': True,
                        'quiet': True,
                        'extractor_args': {
                            'youtube': {
                                'player_client': ['android', 'web']
                            }
                        }
                    }
                    try:
                        with yt_dlp.YoutubeDL(stream_opts) as s_ydl:
                            info = s_ydl.extract_info(video_url, download=False)
                            stream_url = info.get('url') if info else None
                            
                            target_url = stream_url if stream_url else video_url
                            
                            # IPTV Başlık ve Kamuflaj Direktifleri
                            m3u_lines.append(f'#EXTINF:-1 tvg-id="{video_id}" tvg-name="{video_title}" group-title="Yerli Sinema & Dizi",🎬 {video_title}\n')
                            # TiviMate ve VLC için User-Agent ve Referer direktifleri (403 Forbidden hatasını engeller)
                            m3u_lines.append('#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\n')
                            m3u_lines.append('#EXTVLCOPT:http-referrer=https://www.youtube.com/\n')
                            m3u_lines.append('#EXTVLCOPT:network-caching=2500\n')
                            m3u_lines.append(f'{target_url}\n\n')
                            print(f"  [EKLENDİ - OPTİMİZE] {video_title}")
                    except Exception as err:
                        # Fallback olarak video_url ekle
                        m3u_lines.append(f'#EXTINF:-1 tvg-id="{video_id}" group-title="Yerli Sinema & Dizi",🎬 {video_title}\n')
                        m3u_lines.append('#EXTVLCOPT:http-user-agent=Mozilla/5.0\n')
                        m3u_lines.append(f'{video_url}\n\n')
                        print(f"  [EKLENDİ (URL Fallback)] {video_title}")
        except Exception as e:
            print(f"Hata: {e}")

    # Dosyayı kaydet
    with open(output_filename, "w", encoding="utf-8") as f:
        f.writelines(m3u_lines)

    print(f"\nİşlem tamam! Sadece film ve dizilerden oluşan optimize M3U dosyanız hazır: {os.path.abspath(output_filename)}")

if __name__ == "__main__":
    generate_movie_series_m3u("turk_dizi_ve_filmler_optimize.m3u", count_per_query=3)
