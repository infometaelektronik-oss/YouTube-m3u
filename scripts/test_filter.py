#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for verifying regex filter logic on Turkish film and series titles.
Ensures zero false positives on trailers/clips/songs, and zero false negatives on full movies.
"""

import sys
from yt_m3u_generator import is_valid_title, clean_title

TEST_CASES = [
    # ALAKASIZ İÇERİKLER (Kesinlikle False dönmeli)
    ("Tosun Paşa - Resmi Fragman", False),
    ("Hababam Sınıfı Uyanıyor (Official Teaser)", False),
    ("Şaban Oğlu Şaban - En Komik Sahneler (Klip)", False),
    ("Ferdi Tayfur - Batan Güneş | Şarkı & Video Klip", False),
    ("Kurtlar Vadisi Pusu - 45. Bölüm Özeti ve Fragmanı", False),
    ("Geniş Aile - Cevahir ve Koyu Bilal Komik Anlar Kesit", False),
    ("Ezel - Unutulmaz Jenerik Müziği (Remix 2024)", False),
    ("Yeşilçam Kamera Arkası Gizli Görüntüler Röportaj", False),
    ("Kemal Sunal Komik Sahneleri #Shorts", False),
    ("Ezel 1. Bölüm Sonu Teaser", False),
    ("Tosun Paşa Parça 1/4", False),
    ("Davaro Part 2", False),
    ("Kurtlar Vadisi Oyunu Gameplay", False),

    # TAM FİLM VE DİZİLER (Kesinlikle True dönmeli)
    ("Tosun Paşa (1976) | Restorasyonlu Full Film Tek Parça", True),
    ("Hababam Sınıfı | Kemal Sunal, Münir Özkul | Türk Filmi", True),
    ("Şaban Oğlu Şaban - Sansürsüz 1080p Full HD İzle", True),
    ("Çöpçüler Kralı (Kemal Sunal) Tek Parça Restore", True),
    ("Ezel - 1. Bölüm (Full HD Tek Parça)", True),
    ("Kurtlar Vadisi 1. Bölüm Full İzle HD", True),
    ("Geniş Aile 1. Sezon 1. Bölüm Tek Parça", True),
    ("Gırgırıye - Türk Sineması Klasikleri", True),
    ("Süt Kardeşler 1976 Yerli Film", True)
]

def run_tests():
    passed = 0
    failed = 0
    print("[*] Başlık Regex ve Filtreleme Testi Başlatılıyor...")

    for title, expected in TEST_CASES:
        result = is_valid_title(title)
        cleaned = clean_title(title)
        if result == expected:
            passed += 1
            status = "\033[92m[GEÇTİ]\033[0m"
        else:
            failed += 1
            status = "\033[91m[BAŞARISIZ]\033[0m"

        print(f"  {status} '{title}' -> Sonuç: {result} (Beklenen: {expected}) | Temiz: '{cleaned}'")

    print("\n---------------------------------------------------")
    print(f"Toplam Test: {len(TEST_CASES)} | Geçen: {passed} | Kalan Hata: {failed}")
    if failed == 0:
        print("\033[92m[HARİKA] Tüm regex filtre testleri %100 başarıyla sonuçlandı!\033[0m")
        sys.exit(0)
    else:
        print("\033[91m[HATA] Bazı testler başarısız oldu!\033[0m")
        sys.exit(1)

if __name__ == '__main__':
    run_tests()
