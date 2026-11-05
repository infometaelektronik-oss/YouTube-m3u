import time
import random
from playwright.sync_api import sync_playwright

# Kullanıcı Bilgileri
EMAIL = "tolgahanmeydan90@gmail.com"
PASSWORD = "meydan69951515"

def get_random_user_agent():
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    ]
    return random.choice(user_agents)

def run_core_stream_engine():
    with sync_playwright() as p:
        # Arayüzdeki Google AI Studio / Web panel entegrasyonu için tarayıcı motoru
        browser = p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
        
        context = browser.new_context(
            user_agent=get_random_user_agent(),
            viewport={"width": 1280, "height": 800}
        )
        
        page = context.new_page()
        
        try:
            print("[*] Core Stream Engine: YouTube oturumuna bağlanılıyor...")
            page.goto("https://accounts.google.com/ServiceLogin?service=youtube", timeout=60000)
            
            # E-posta girişi
            page.fill('input[type="email"]', EMAIL)
            page.click('#identifierNext')
            page.wait_for_timeout(3000)
            
            # Şifre girişi
            page.fill('input[type="password"]', PASSWORD)
            page.click('#passwordNext')
            
            # Oturumun açılmasını bekle
            page.wait_for_url("https://www.youtube.com/", timeout=60000)
            print("[✓] Oturum başarıyla doğrulandı. Core Stream Engine aktif!")
            
            # Sonsuz Döngü - Canlı Tarama ve İçerik Aktarımı
            while True:
                print("\n[*] Döngü yenileniyor: Yeni IP / Oturum simülasyonu devrede...")
                
                # Hedef M3U / Dizi Film kaynak sayfasına geçiş
                page.goto("https://www.youtube.com/feed/subscriptions", timeout=30000)
                page.wait_for_timeout(4000)
                
                # İçeriklerin taranması ve player entegrasyonu
                contents = page.locator('ytd-grid-video-renderer, ytd-rich-item-renderer').all()
                print(f"[i] Taranan güncel içerik/video birimi: {len(contents)}")
                
                # Her döngü sonrasında sistemin kararlılığı için bekleme payı
                gecikme = random.randint(10, 25)
                print(f"[Z] İşlem tamamlandı. Sonraki tarama için {gecikme} saniye bekleniyor...")
                time.sleep(gecikme)
                
        except Exception as e:
            print(f"[!] Hata yakalandı: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_core_stream_engine()
