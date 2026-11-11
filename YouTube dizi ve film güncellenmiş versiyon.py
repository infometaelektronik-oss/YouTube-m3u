# -*- coding: utf-8 -*-
"""
YouTube Türk Dizi/Film Keşif Motoru v6 — Gemini Bulut AI
- Gemini (ücretsiz bulut AI): sınıflandırma + arama + karar
- HumanBehaviorModel: yorgunluk, okuma, dalma, ruh hali
- Video oynatma doğrulaması: sadece çalışan linkler kaydedilir
- Öğrenme profili: beğendiklerini hatırlar
- Tablet dostu: AI bulutta, tablet yorulmaz
"""

import os
import re
import time
import json
import random
import logging
import requests
from datetime import datetime

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

# =========================================================
# KULLANICI BİLGİLERİ
# =========================================================
EMAIL    = "tolgahanmeydan90@gmail.com"
PASSWORD = "meydan69951515"

# =========================================================
# AI AYARLARI — GEMINI (ÜCRETSİZ, BULUT)
# =========================================================
USE_LLM           = True
LLM_PROVIDER      = "gemini"          # "gemini" | "groq" | "openai" | "none"
GEMINI_API_KEY    = ""                 # aistudio.google.com'dan al
GEMINI_MODEL      = "gemini-1.5-flash" # hızlı ve ücretsiz

# Alternatifler (istersen)
GROQ_API_KEY      = ""
OPENAI_API_KEY    = ""

# =========================================================
# MOTOR AYARLARI
# =========================================================
HEADLESS       = False                 # tablette True yap (daha az RAM)
STORAGE_FILE   = "auth_state.json"
LINKS_FILE     = "bulunan_linkler.jsonl"
LOG_FILE       = "engine.log"
PROFILE_FILE   = "user_profile.json"

MAX_TIKLAMA_PER_TUR = 5
TIKLAMA_ARASI_SN    = (20, 90)
TUR_ARASI_DK        = (10, 40)
MAX_TUR             = 9999             # güvenlik limiti

# Yedek arama sorguları (Gemini yoksa kullanılır)
YEDEK_SORGULAR = [
    "türk dizisi yeni bölüm",
    "yerli film full izle",
    "türk filmi tek parça",
    "ulusal kanal dizi fragmanı",
    "bilim kurgu filmi türkçe dublaj",
    "komedi filmi full hd",
    "dram dizisi son bölüm",
]

# =========================================================
# LOG
# =========================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger("engine")


# =========================================================
# 1) İNSAN DAVRANIŞ MODELİ
# =========================================================
class HumanBehaviorModel:
    def __init__(self):
        self.session_start = time.time()
        self.actions = 0
        self.mood = random.choice(["normal", "normal", "normal", "yorgun", "meraklı"])
        self.interest_weights = self._load_profile()

    def _load_profile(self):
        if os.path.exists(PROFILE_FILE):
            try:
                with open(PROFILE_FILE, encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "dizi": 1.0, "film": 1.0, "ulusal": 0.8,
            "bilim_kurgu": 0.5, "komedi": 0.5, "dram": 0.7, "aksiyon": 0.6,
        }

    def save_profile(self):
        try:
            with open(PROFILE_FILE, "w", encoding="utf-8") as f:
                json.dump(self.interest_weights, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def fatigue_factor(self):
        minutes = (time.time() - self.session_start) / 60
        if minutes < 30:
            return 1.0
        elif minutes < 90:
            return 1.0 + (minutes - 30) / 120
        else:
            return min(2.0, 1.5 + (minutes - 90) / 300)

    def typing_delay(self):
        return int(random.randint(55, 130) * self.fatigue_factor())

    def reading_time(self, title):
        base = max(0.8, min(5.0, len(title) * random.uniform(0.02, 0.04)))
        return base * self.fatigue_factor()

    def distraction_chance(self):
        return 0.08 * self.fatigue_factor()

    def interest_score(self, kategori, channel, title):
        score = self.interest_weights.get(kategori, 0.5)
        text = f"{channel} {title}".lower()
        for kelime in ["bilim kurgu", "komedi", "dram", "aksiyon"]:
            if kelime in text:
                score += self.interest_weights.get(kelime.replace(" ", "_"), 0) * 0.3
        score *= (1.0 / self.fatigue_factor())
        return min(1.0, max(0.0, score))

    def tick(self):
        self.actions += 1
        if self.actions % 50 == 0:
            self.mood = random.choice(["normal", "yorgun", "meraklı"])

    def sleep_between_actions(self):
        time.sleep(random.uniform(20, 90) * self.fatigue_factor())


BEHAVIOR = HumanBehaviorModel()


# =========================================================
# 2) LLM İSTEMCİ (Gemini öncelikli)
# =========================================================
class LLMClient:
    def __init__(self):
        self.provider = LLM_PROVIDER
        self.available = False
        self._init()

    def _init(self):
        try:
            if self.provider == "gemini" and GEMINI_API_KEY:
                r = requests.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}",
                    json={"contents": [{"parts": [{"text": "test"}]}]},
                    timeout=15
                )
                if r.status_code == 200:
                    self.available = True
                    log.info(f"[✓] LLM: Gemini ({GEMINI_MODEL}) aktif")
                else:
                    log.warning(f"[!] Gemini testi başarısız: HTTP {r.status_code}")
            elif self.provider == "groq" and GROQ_API_KEY:
                from groq import Groq
                self.client = Groq(api_key=GROQ_API_KEY)
                self.available = True
                log.info("[✓] LLM: Groq aktif")
            elif self.provider == "openai" and OPENAI_API_KEY:
                from openai import OpenAI
                self.client = OpenAI(api_key=OPENAI_API_KEY)
                self.available = True
                log.info("[✓] LLM: OpenAI aktif")
            else:
                log.info("[i] LLM yapılandırılmamış → kural tabanlı çalışacak.")
        except Exception as e:
            log.warning(f"[!] LLM başlatma hatası: {e}")
            self.available = False

    def ask(self, prompt, max_tokens=100, temperature=0.7):
        if not self.available:
            return None
        try:
            if self.provider == "gemini":
                r = requests.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "maxOutputTokens": max_tokens,
                            "temperature": temperature,
                        }
                    },
                    timeout=30
                )
                if r.status_code == 200:
                    data = r.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"].strip()
                else:
                    log.warning(f"[!] Gemini HTTP {r.status_code}")
                    return None

            elif self.provider == "groq":
                r = self.client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                return r.choices[0].message.content.strip()

            elif self.provider == "openai":
                r = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                return r.choices[0].message.content.strip()
        except Exception as e:
            log.warning(f"[!] LLM sorgu hatası: {e}")
            return None


LLM = LLMClient()


# =========================================================
# 3) AI FONKSİYONLARI
# =========================================================
def _rule_based_classify(channel, title):
    """LLM yoksa kural tabanlı sınıflandırma."""
    ch = channel.lower()
    ti = title.lower()
    ULUSAL = ["trt", "atv", "show tv", "star tv", "now tv", "fox",
              "kanal d", "tv8", "teve2", "360", "kanal 7"]
    DIZI_BOLUM = ["bölüm", "bolum", "final", "sezon", "yeni bölüm"]
    FILM = ["full izle", "tek parça", "türkçe dublaj", "yerli film"]

    if any(k in ti for k in FILM):
        return "film"
    if any(k in ti for k in DIZI_BOLUM) and any(k in ch for k in ULUSAL):
        return "dizi"
    if any(k in ch for k in ULUSAL):
        return "ulusal"
    return None


def ai_classify_video(channel, title, description=""):
    if LLM.available:
        prompt = (
            f"Aşağıdaki YouTube videosunu kategorize et.\n"
            f"Kanal: {channel}\nBaşlık: {title}\nAçıklama: {description[:200]}\n\n"
            f"Bu bir Türk içeriği mi? Ve türü ne?\n"
            f"SADECE şu cevaplardan BİRİNİ ver (başka hiçbir şey yazma):\n"
            f"- dizi\n- film\n- ulusal\n- bilim_kurgu\n- komedi\n- dram\n- aksiyon\n- ilgisiz\n\n"
            f"Cevap:"
        )
        answer = LLM.ask(prompt, max_tokens=10, temperature=0.1)
        if answer:
            answer = answer.lower().strip()
            for v in ["dizi", "film", "ulusal", "bilim_kurgu",
                      "komedi", "dram", "aksiyon", "ilgisiz"]:
                if v in answer:
                    return v
            return None
    return _rule_based_classify(channel, title)


def ai_should_click(kategori, channel, title, seen):
    key = f"{channel}||{title}"
    if key in seen:
        return False
    if kategori is None or kategori == "ilgisiz":
        return random.random() < 0.05
    interest = BEHAVIOR.interest_score(kategori, channel, title)
    threshold = 0.55 + (1.0 - interest) * 0.35
    if random.random() < (1.0 - threshold):
        log.info(f"[AI] İlgi:{interest:.2f} → tıkla: {kategori} | {title[:40]}")
        return True
    return False


def ai_generate_search_query(recent_queries):
    if LLM.available:
        prompt = (
            f"YouTube'da Türk dizi/film aramak için TEK bir arama sorgusu üret.\n"
            f"Son kullanılanlar (TEKRARLAMA): {recent_queries[-5:]}\n\n"
            f"İnsanların gerçekten yazacağı doğal bir sorgu olsun.\n"
            f"SADECE sorgu metnini yaz. En fazla 6 kelime.\n\nSorgu:"
        )
        answer = LLM.ask(prompt, max_tokens=20, temperature=0.9)
        if answer:
            answer = answer.strip().strip('"').strip("'")
            if 3 < len(answer) < 60:
                return answer
    kalan = [q for q in YEDEK_SORGULAR if q not in recent_queries[-5:]]
    return random.choice(kalan or YEDEK_SORGULAR)


def ai_decide_watch_duration(kategori):
    interest = BEHAVIOR.interest_weights.get(kategori, 0.5)
    base_min = int(10 + interest * 40)
    base_max = int(30 + interest * 90)
    factor = 1.0 / BEHAVIOR.fatigue_factor()
    return int(base_min * factor), int(base_max * factor)


# =========================================================
# 4) İNSAN YARDIMCILARI
# =========================================================
def rnd(a, b):
    return random.uniform(a, b)

def human_pause(a=0.3, b=1.2):
    time.sleep(rnd(a, b))

def human_type(page, selector, text):
    page.locator(selector).click()
    human_pause(0.2, 0.5)
    for ch in text:
        page.locator(selector).type(ch, delay=BEHAVIOR.typing_delay())
        if random.random() < 0.05:
            time.sleep(rnd(0.3, 0.8))

def human_scroll(page, times=2):
    for _ in range(times):
        page.mouse.wheel(0, random.randint(250, 700))
        time.sleep(rnd(0.6, 1.6))

def human_hover(page, element):
    try:
        box = element.bounding_box()
        if not box:
            return
        cx = box["x"] + box["width"] / 2
        cy = box["y"] + box["height"] / 2
        for _ in range(random.randint(2, 4)):
            page.mouse.move(
                cx + random.randint(-40, 40),
                cy + random.randint(-40, 40),
                steps=random.randint(5, 15)
            )
            time.sleep(rnd(0.05, 0.2))
        page.mouse.move(cx, cy, steps=random.randint(5, 12))
        time.sleep(rnd(0.2, 0.6))
    except Exception:
        pass

def human_read_title(page, title):
    rt = BEHAVIOR.reading_time(title)
    log.info(f"[AI] Başlık okunuyor ({rt:.1f}sn)...")
    time.sleep(rt)

def human_maybe_distract(page):
    if random.random() < BEHAVIOR.distraction_chance():
        log.info("[AI] Dikkat dağıldı, boş bakınıyor...")
        time.sleep(random.randint(15, 60))
        page.mouse.wheel(0, random.randint(-300, 300))


# =========================================================
# 5) CAPTCHA / ENGEL
# =========================================================
def is_blocked(page):
    try:
        html = page.content().lower()
    except Exception:
        return False
    blockers = [
        "recaptcha", "unusual traffic", "olağan dışı trafik",
        "verify it's you", "seni tanıyamadık",
        "2-step verification", "iki adımlı doğrulama",
        "this browser or app may not be secure",
    ]
    return any(b in html for b in blockers)


# =========================================================
# 6) GİRİŞ
# =========================================================
def do_login(page):
    log.info("[*] Google girişi...")
    page.goto("https://accounts.google.com/ServiceLogin?service=youtube",
              timeout=60000, wait_until="domcontentloaded")
    human_pause(1.0, 2.0)
    if is_blocked(page):
        return False

    human_type(page, 'input[type="email"]', EMAIL)
    human_pause(0.4, 0.9)
    page.click('#identifierNext')
    page.wait_for_timeout(2500)
    if is_blocked(page):
        return False

    human_type(page, 'input[type="password"]', PASSWORD)
    human_pause(0.4, 0.9)
    page.click('#passwordNext')

    try:
        page.wait_for_url("https://www.youtube.com/**", timeout=60000)
    except PWTimeout:
        log.error("[!] 2FA olabilir.")
        return False

    log.info("[✓] Giriş başarılı.")
    return True


# =========================================================
# 7) VİDEO OYNATMA DOĞRULAMA
# =========================================================
def video_oynat_ve_dogrula(page, url):
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        human_pause(2, 4)

        hatalar = [
            "video kullanılamıyor", "bu video kullanılamıyor",
            "içerik kullanılamıyor", "yaş sınırlaması",
            "bölgenizde kullanılamıyor", "sign in to confirm you're not a bot",
        ]
        metin = page.content().lower()
        for h in hatalar:
            if h in metin:
                return False, h

        try:
            page.wait_for_selector("video", timeout=10000)
            oynuyor = page.evaluate(
                "() => { const v = document.querySelector('video');"
                "return v && !v.paused && v.currentTime > 0; }"
            )
            if oynuyor:
                return True, None
            page.keyboard.press("k")
            human_pause(1, 2)
            oynuyor = page.evaluate(
                "() => { const v = document.querySelector('video');"
                "return v && !v.paused && v.currentTime > 0; }"
            )
            return (True, None) if oynuyor else (False, "oynatilamadi")
        except Exception:
            return False, "video_element_yok"
    except Exception as e:
        return False, str(e)


# =========================================================
# 8) BİR TUR
# =========================================================
def one_tour(page, seen, recent_queries):
    sorgu = ai_generate_search_query(recent_queries)
    recent_queries.append(sorgu)
    log.info(f"[AI] Arama sorgusu: '{sorgu}'")

    url = f"https://www.youtube.com/results?search_query={sorgu.replace(' ', '+')}"
    page.goto(url, wait_until="domcontentloaded", timeout=45000)
    human_pause(2.5, 5.0)
    human_scroll(page, times=random.randint(2, 4))

    try:
        page.wait_for_selector("ytd-video-renderer", timeout=15000)
    except PWTimeout:
        log.warning("[!] Sonuçlar yüklenmedi.")
        return []

    kartlar = page.locator("ytd-video-renderer").all()
    log.info(f"[i] Bulunan kart: {len(kartlar)}")
    random.shuffle(kartlar)

    found = []
    tiklama = 0

    for card in kartlar[:15]:
        if tiklama >= MAX_TIKLAMA_PER_TUR:
            break
        if is_blocked(page):
            log.warning("[!] Engel algılandı, tur bitiyor.")
            break

        try:
            title = card.locator("#video-title").inner_text(timeout=3000).strip()
        except Exception:
            continue
        try:
            channel = card.locator("#channel-name, ytd-channel-name").first.inner_text(timeout=2000).strip()
        except Exception:
            channel = ""
        if not title:
            continue

        human_read_title(page, title)
        kategori = ai_classify_video(channel, title)

        if not ai_should_click(kategori, channel, title, seen):
            continue

        human_maybe_distract(page)

        try:
            human_hover(page, card)
            human_pause(0.5, 1.5)

            with page.context.expect_page(timeout=15000) as new_page_info:
                card.click()
            new_page = new_page_info.value

            try:
                new_page.wait_for_load_state("domcontentloaded", timeout=30000)
                human_pause(2, 4)
                video_url = new_page.url

                oynatilabilir, hata = video_oynat_ve_dogrula(new_page, video_url)

                if oynatilabilir:
                    izle_min, izle_max = ai_decide_watch_duration(kategori)
                    log.info(f"[AI] {kategori} → {izle_min}-{izle_max}sn izlenecek")
                    toplam = random.randint(izle_min, izle_max)
                    gecen = 0
                    while gecen < toplam:
                        action = random.choice(["scroll", "mouse", "wait", "wait"])
                        if action == "scroll":
                            new_page.mouse.wheel(0, random.randint(100, 400))
                            d = rnd(2, 6)
                        elif action == "mouse":
                            new_page.mouse.move(
                                random.randint(100, 1100),
                                random.randint(100, 700),
                                steps=random.randint(5, 15)
                            )
                            d = rnd(2, 5)
                        else:
                            d = rnd(3, 8)
                        time.sleep(d)
                        gecen += d

                    if BEHAVIOR.interest_weights.get(kategori, 0) > 0.7 and random.random() < 0.4:
                        try:
                            new_page.click('like-button-view-model button, #like-button button',
                                           timeout=3000)
                            log.info("[♥] Beğenildi (AI tavsiyesi)")
                            BEHAVIOR.interest_weights[kategori] = min(
                                2.0, BEHAVIOR.interest_weights.get(kategori, 0.5) + 0.1
                            )
                        except Exception:
                            pass

                    if random.random() < 0.1:
                        try:
                            new_page.keyboard.press("Escape")
                        except Exception:
                            pass

                    new_page.close()
                    human_pause(1.5, 4.0)

                    found.append({
                        "timestamp": datetime.now().isoformat(),
                        "kategori": kategori,
                        "sorgu": sorgu,
                        "channel": channel,
                        "title": title,
                        "url": video_url,
                    })
                    seen.add(f"{channel}||{title}")
                    tiklama += 1
                    BEHAVIOR.tick()
                    BEHAVIOR.sleep_between_actions()

                    if "results" not in page.url:
                        page.goto(url, timeout=30000)
                        human_pause(2, 4)
                else:
                    log.info(f"[i] Atlandı: {title[:40]} ({hata})")
                    new_page.close()
                    human_pause(1.5, 3.0)

            except Exception as e:
                log.warning(f"[!] Sekme hatası: {e}")
                try:
                    new_page.close()
                except Exception:
                    pass

        except PWTimeout:
            log.warning("[!] Yeni sekme açılmadı.")
        except Exception as e:
            log.warning(f"[!] Tıklama hatası: {e}")

    BEHAVIOR.save_profile()
    return found


# =========================================================
# 9) ANA DÖNGÜ
# =========================================================
def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=HEADLESS,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--autoplay-policy=no-user-gesture-required",
            ]
        )

        if os.path.exists(STORAGE_FILE):
            context = browser.new_context(
                storage_state=STORAGE_FILE,
                viewport={"width": 1280, "height": 800},
                locale="tr-TR",
                timezone_id="Europe/Istanbul",
            )
            need_login = False
        else:
            context = browser.new_context(
                viewport={"width": 1280, "height": 800},
                locale="tr-TR",
                timezone_id="Europe/Istanbul",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            )
            need_login = True

        page = context.new_page()
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['tr-TR','tr','en'] });
        """)

        seen = set()
        if os.path.exists(LINKS_FILE):
            with open(LINKS_FILE, encoding="utf-8") as f:
                for line in f:
                    try:
                        d = json.loads(line)
                        seen.add(f"{d['channel']}||{d['title']}")
                    except Exception:
                        pass
            log.info(f"[i] Önceden görülen: {len(seen)} içerik")

        recent_queries = []

        try:
            if need_login:
                if not do_login(page):
                    return
                context.storage_state(path=STORAGE_FILE)
                log.info(f"[✓] Oturum kaydedildi: {STORAGE_FILE}")
            else:
                page.goto("https://www.youtube.com/", timeout=45000)
                human_pause(2, 4)
                if "Sign in" in page.content() or "Giriş yap" in page.content():
                    if not do_login(page):
                        return
                    context.storage_state(path=STORAGE_FILE)

            tur = 0
            while tur < MAX_TUR:
                tur += 1
                log.info(f"\n===== TUR {tur} (ruh hali: {BEHAVIOR.mood}) =====")
                try:
                    found = one_tour(page, seen, recent_queries)
                    if found:
                        with open(LINKS_FILE, "a", encoding="utf-8") as f:
                            for item in found:
                                f.write(json.dumps(item, ensure_ascii=False) + "\n")
                        log.info(f"[✓] {len(found)} oynatılabilir link kaydedildi.")
                    else:
                        log.info("[i] Bu turda yeni tıklama yok.")
                except Exception as e:
                    log.error(f"[!] Tur hatası: {e}")

                dakika = random.randint(*TUR_ARASI_DK)
                log.info(f"[Z] Sıradaki tur için {dakika} dk...")
                time.sleep(dakika * 60)

        except KeyboardInterrupt:
            log.info("[*] Kullanıcı durdurdu.")
        finally:
            BEHAVIOR.save_profile()
            try:
                context.storage_state(path=STORAGE_FILE)
            except Exception:
                pass
            browser.close()
            log.info("[*] Motor kapatıldı.")


if __name__ == "__main__":
    run()