import os
import yt_dlp

def generate_global_dubbed_m3u(output_filename="turkce_dublaj_film_dizi.m3u"):
    # Genişletilmiş hedef sorgular (Yerli + Türkçe Dublaj Yabancı Film ve Diziler)
    hedef_sorgular = [
        "türkçe dublaj film full hd tek parça",
        "yabancı film türkçe dublaj tek parça",
        "türkçe dublaj aksiyon filmleri full",
        "türkçe dublaj korku filmi full izle",
        "türkçe dublaj bilim kurgu filmi",
        "türk dizisi full izle tek parça",
        "yerli film full hd izle",
        "yeşilçam filmleri full hd"
    ]
    
    m3u_lines = ["#EXTM3U\n"]
    islenen_idler = set()

    for sorgu in hedef_sorgular:
        print(f"\n'{sorgu}' taranıyor...")
        
        ydl_opts = {
            'extract_flat': True,
            'skip_download': True,
            'quiet': True,
            'default_search': f"ytsearch12" # Her sorgudan 12 içerik
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                result = ydl.extract_info(sorgu, download=False)
                entries = result.get('entries', [])
                
                for entry in entries:
                    video_id = entry.get('id')
                    video_title = entry.get('title', '')
                    
                    if not video_id or video_id in islenen_idler:
                        continue
                        
                    # Çöpleri, müzikleri, fragmanları ve altyazılı içerikleri filtrele
                    alt_baslik = video_title.lower()
                    yasakli_kelimeler = [
                        'klip', 'fragman', 'teaser', 'şarkı', 'müzik', 'remix', 
                        'cover', 'oyun', 'pubg', 'gameplay', 'altyazılı', 'subbed'
                    ]
                    
                    if any(yasak in alt_baslik for yasak in yasakli_kelimeler):
                        continue

                    islenen_idler.add(video_id)
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    
                    # Gerçek stream adresini çöz
                    stream_opts = {'format': 'best', 'skip_download': True, 'quiet': True}
                    try:
                        with yt_dlp.YoutubeDL(stream_opts) as s_ydl:
                            info = s_ydl.extract_info(video_url, download=False)
                            stream_url = info.get('url')
                            
                            if stream_url:
                                icon = "🌍🎬" if "dublaj" in alt_baslik or "yabancı" in sorgu else "🇹🇷🎬"
                                m3u_lines.append(f'#EXTINF:-1,{icon} {video_title}\n')
                                m3u_lines.append(f'{stream_url}\n')
                                print(f"[EKLENDİ] {video_title}")
                    except Exception:
                        pass
        except Exception as e:
            print(f"Hata: {e}")

    # Dosyayı kaydet
    with open(output_filename, "w", encoding="utf-8") as f:
        f.writelines(m3u_lines)

    print(f"\nİşlem tamam! Türkçe dublaj yabancı ve yerli film/dizi M3U dosyan hazır: {os.path.abspath(output_filename)}")

if __name__ == "__main__":
    generate_global_dubbed_m3u("dublaj_film_ve_diziler.m3u")
