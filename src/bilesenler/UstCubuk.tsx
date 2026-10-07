import { Bell, BookOpen, CircleUser, FlaskConical, LogOut, Menu, Search, Settings, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { bildirimleriOku } from "../eylemler";
import { useDil } from "../dil";
import { BIRIM_ADI, GOREV_ADI } from "../etiketler";
import { cikisYap } from "../oturum";
import { useVeri, type Kisi } from "../veri";
import { UstKisayollar } from "../ekranlar/ortam/Kisayollar";
import { UstSekmeler } from "../ekranlar/ortam/Sekmeler";
import { bildirimMi } from "../yetki";
import type { BolmeAramasi } from "../yol";
import DilSecici from "./DilSecici";
import { KonuMetni, useHareketKonusu, useHareketMetni } from "./Hareket";
import { KomutPaleti } from "./KomutPaleti";
import { Avatar, Bos } from "./Parcalar";
import Logo from "./Logo";

/**
 * Üst çubuk: tek ince satır. Sayfanın üstünde başka satır yok; sekmeler,
 * kısayollar ve genel işler burada, kullanılır alan sayfaya kalıyor.
 *
 * Sıra: menü düğmesi, (menü gizliyken) logo, sekmeler ve "+", kısayollar,
 * prototip etiketi, arama, dil, bildirimler, kullanıcı. Arama büyük bir
 * kutu değil, pencere (Ctrl/⌘+K, "/"): yalnız kişinin görebildiği
 * kayıtlarda geziyor. Bildirimler hareket kaydından süzülüyor
 * (yetki.ts → bildirimMi); zil açılınca okundu sayılıyor.
 */
/*
 * Menü düğmesi masaüstünde sol menüyü gizleyip gösteriyor, tablette
 * çekmeceyi açıyor; etiketi o an ne yapacağını söylüyor.
 */
export default function UstCubuk({ ben, onMenu, masaustu, menuGorunur }: { ben: Kisi; onMenu: () => void; masaustu: boolean; menuGorunur: boolean }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState<"" | "bildirim" | "kullanici" | "prototip">("");
  const [palet, setPalet] = useState(false);
  const kap = useRef<HTMLDivElement>(null);
  const araDugmesi = useRef<HTMLButtonElement>(null);
  const metni = useHareketMetni();
  const konusu = useHareketKonusu();
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const kapat = (e: MouseEvent) => {
      if (kap.current && !kap.current.contains(e.target as Node)) setAcik("");
    };
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik("");
      // Tuşun yeri (code): Arapça klavyede de çalışsın. "/" yazı alanında ve açık pencere varken yazının kendisi.
      const yazi = (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyK") {
        e.preventDefault();
        setPalet(true);
      } else if (e.code === "Slash" && !e.ctrlKey && !e.metaKey && !e.altKey && !yazi && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        setPalet(true);
      }
    };
    // Workspace bölmesine (iframe) basmak bu belgeye tıklama göndermiyor; pencere odağı kaybedince de kapansın.
    const odakGitti = () => setAcik("");
    // Bölmenin içindeki Ctrl+K üst pencereye ulaşmıyor; bölme mesajla bildiriyor (yol.ts).
    const mesaj = (e: MessageEvent<BolmeAramasi>) => e.origin === location.origin && e.data?.tur === "trt-bolme-ara" && setPalet(true);
    document.addEventListener("mousedown", kapat);
    document.addEventListener("keydown", tus);
    window.addEventListener("blur", odakGitti);
    window.addEventListener("message", mesaj);
    return () => {
      document.removeEventListener("mousedown", kapat);
      document.removeEventListener("keydown", tus);
      window.removeEventListener("blur", odakGitti);
      window.removeEventListener("message", mesaj);
    };
  }, []);

  const sonBakis = v.okundu[ben.id] ?? "";
  const bildirimler = v.hareketler.filter((h) => bildirimMi(ben, h, v)).slice(0, 25);
  const okunmamis = bildirimler.filter((h) => h.zaman > sonBakis).length;

  const ac = (n: typeof acik) => {
    setAcik(acik === n ? "" : n);
    if (n === "bildirim" && acik !== n && okunmamis) bildirimleriOku(ben);
  };
  const araAdi = t("araTus", { tus: mac ? "⌘K" : "Ctrl K" });
  // Pencere odağı açanın üstüne bırakıyor; açan yoksa (kısayol tuşu, seçimle gezinme) odak boşta kalmasın.
  const paletiKapat = () => {
    setPalet(false);
    requestAnimationFrame(() => {
      const a = document.activeElement;
      if (!a || a === document.body) araDugmesi.current?.focus();
    });
  };

  return (
    <header className="ust" ref={kap}>
      <button
        className="ikon-dugme menu-dugme"
        onClick={onMenu}
        aria-label={masaustu ? t(menuGorunur ? "menuyuGizle" : "menuyuGoster") : t("menuAc")}
        title={masaustu ? t(menuGorunur ? "menuyuGizle" : "menuyuGoster") : undefined}
        aria-expanded={menuGorunur}
        aria-controls="ana-menu"
      >
        <Menu size={18} />
      </button>
      <a className="marka marka-mobil" href="#/" aria-label={t("uygulama")}>
        <Logo />
      </a>
      <UstSekmeler ben={ben} />
      <UstKisayollar ben={ben} />
      {/*
       * Prototip uyarısı her sayfada görünmeli (örnek veri gerçek kurum verisi
       * sanılmasın, kalıcılığın sınırı söylensin); bir satır kaplamasın diye
       * çubukta etiket, tam cümle ipucunda ve basınca.
       */}
      <div className="acilir-kap">
        <button type="button" className="prototip" data-prototip onClick={() => ac("prototip")} aria-expanded={acik === "prototip"} title={t("demoSerit")}>
          <FlaskConical size={14} aria-hidden="true" />
          <span className="prototip-yazi">{t("prototip")}</span>
          <span className="gizli-metin">{t("demoSerit")}</span>
        </button>
        {acik === "prototip" && (
          <div className="acilir prototip-notu" role="note">
            <FlaskConical size={16} /> {t("demoSerit")}
          </div>
        )}
      </div>
      <button ref={araDugmesi} className="ikon-dugme" data-ara onClick={() => setPalet(true)} aria-label={araAdi} title={araAdi}>
        <Search size={18} />
      </button>
      <span className="ust-dil">
        <DilSecici kompakt />
      </span>
      <div className="acilir-kap">
        <button className="ikon-dugme" onClick={() => ac("bildirim")} aria-label={t("bildirimler")} title={t("bildirimler")} aria-expanded={acik === "bildirim"}>
          <Bell size={18} />
          {okunmamis > 0 && <span className="rozet-say">{okunmamis}</span>}
        </button>
        {acik === "bildirim" && (
          <div className="acilir">
            <h4>
              {t("bildirimler")}
              <button onClick={() => setAcik("")} aria-label={t("kapat")}>
                <X size={14} />
              </button>
            </h4>
            {bildirimler.length === 0 ? (
              <Bos kucuk metin={t("bildirimYok")} />
            ) : (
              bildirimler.map((h) => {
                const m = metni(h, v);
                const k = konusu(h, v);
                return (
                  <a key={h.id} className={`acilir-satir ${h.zaman > sonBakis ? "yeni" : ""}`} href={k?.href ?? "#/"} onClick={() => setAcik("")}>
                    <Avatar kisi={m.kisi} boy="kucuk" />
                    <div>
                      {m.once}
                      <b>{m.kisi ? ad(m.kisi) : "?"}</b>
                      {m.sonra}
                      {k && (
                        <small>
                          <KonuMetni k={k} />
                        </small>
                      )}
                    </div>
                  </a>
                );
              })
            )}
          </div>
        )}
      </div>
      <div className="acilir-kap">
        {/* Yalnız avatar: ad, birim ve görev menünün başında (masaüstünde sol menüde de yazıyor). */}
        <button className="kullanici" onClick={() => ac("kullanici")} aria-expanded={acik === "kullanici"} aria-label={t("kullaniciMenusu")} title={ad(ben)}>
          <Avatar kisi={ben} durum />
        </button>
        {acik === "kullanici" && (
          <div className="acilir">
            <div className="kullanici-bas">
              <b>{ad(ben)}</b>
              <small>
                {t(BIRIM_ADI[ben.birim])} · {t(GOREV_ADI[ben.gorev])}
              </small>
            </div>
            <a className="acilir-satir" href="#/profil" onClick={() => setAcik("")}>
              <CircleUser size={16} /> {t("profilim")}
            </a>
            <a className="acilir-satir" href="#/ayarlar" onClick={() => setAcik("")}>
              <Settings size={16} /> {t("mAyarlar")}
            </a>
            <a className="acilir-satir" href="#/plan" onClick={() => setAcik("")}>
              <BookOpen size={16} /> {t("mProjePlani")}
            </a>
            <button
              className="acilir-satir"
              onClick={() => {
                setAcik("");
                cikisYap();
                location.hash = "#/";
              }}
            >
              <LogOut size={16} className="yon" /> {t("kisiDegistir")}
            </button>
          </div>
        )}
      </div>
      {palet && <KomutPaleti ben={ben} kapat={paletiKapat} />}
    </header>
  );
}
