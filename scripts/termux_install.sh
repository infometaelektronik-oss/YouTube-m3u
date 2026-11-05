#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Yerli Sinema & Dizi M3U8 Generator - Termux Kurulum ve Çalıştırma Betiği
# Android Telefon ve Tabletler için Hızlı ve Optimize Kurulum
# ==============================================================================

set -e

echo -e "\033[92m====================================================\033[0m"
echo -e "\033[96m   Termux Yerli Film & Dizi M3U8 Generator Kurulumu  \033[0m"
echo -e "\033[92m====================================================\033[0m"

echo -e "\033[93m[1/4] Paketler güncelleniyor ve gerekli araçlar kuruluyor...\033[0m"
pkg update -y && pkg install python ffmpeg curl mpv git -y

echo -e "\033[93m[2/4] En güncel yt-dlp kuruluyor...\033[0m"
pip install --upgrade pip
pip install --upgrade yt-dlp

echo -e "\033[93m[3/4] Çalıştırma izinleri tanımlanıyor...\033[0m"
chmod +x yt_m3u_generator.py
chmod +x channel_archive_extractor.py

echo -e "\033[92m[4/4] Kurulum tamamlandı!\033[0m"
echo ""
echo -e "\033[96mKullanım Örnekleri:\033[0m"
echo "  1) Yeşilçam Filmleri İçin:"
echo "     python3 yt_m3u_generator.py -s 'Kemal Sunal filmleri tek parça full' -o kemalsunal.m3u8"
echo ""
echo "  2) Resmi Arzu Film Kanalını Taramak İçin:"
echo "     python3 channel_archive_extractor.py --preset arzu_film -o arzufilm.m3u8"
echo ""
echo "  3) Oluşan Listeyi Doğrudan Android'de Oynatmak İçin:"
echo "     mpv kemalsunal.m3u8"
echo -e "\033[92m====================================================\033[0m"
