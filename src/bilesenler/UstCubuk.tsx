import { Bell, BookOpen, LogOut, Menu, Search, Settings, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { bildirimleriOku } from "../eylemler";
import { useDil } from "../dil";
import { BIRIM_ADI, GOREV_ADI } from "../etiketler";
import { cikisYap } from "../oturum";
import { useVeri, type Kisi } from "../veri";
import { bildirimMi, oneriGorebilir, paketGorebilir } from "../yetki";
import DilSecici from "./DilSecici";
import { KonuMetni, useHareketKonusu, useHareketMetni } from "./Hareket";
import { Avatar, Bos, Icerik } from "./Parcalar";

/**
 * Üst çubuk: arama, dil, bildirimler ve kullanıcı menüsü.
 *
 * Arama yalnız kişinin görebildiği kayıtlarda geziyor; muhabir başka
 * muhabirin paketini aramayla da bulamıyor. Bildirimler hareket
 * kaydından süzülüyor (yetki.ts → bildirimMi); zil açılınca okundu
 * sayılıyor.
 */
export default function UstCubuk({ ben, onMenu }: { ben: Kisi; onMenu: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState<"" | "bildirim" | "kullanici" | "arama">("");
  const [aranan, setAranan] = useState("");
  const kap = useRef<HTMLDivElement>(null);
  const metni = useHareketMetni();
  const konusu = useHareketKonusu();

  useEffect(() => {
    const kapat = (e: MouseEvent) => {
      if (kap.current && !kap.current.contains(e.target as Node)) setAcik("");
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAcik("");
    document.addEventListener("mousedown", kapat);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", kapat);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const sonBakis = v.okundu[ben.id] ?? "";
  const bildirimler = v.hareketler.filter((h) => bildirimMi(ben, h, v)).slice(0, 25);
  const okunmamis = bildirimler.filter((h) => h.zaman > sonBakis).length;

  const q = aranan.trim().toLocaleLowerCase();
  const icinde = (x: string | { tr: string; ar: string; en: string } | undefined) =>
    !!x && (typeof x === "string" ? x : `${x.tr} ${x.ar} ${x.en}`).toLocaleLowerCase().includes(q);
  const sonuclar = q.length < 2
    ? []
    : [
        ...v.paketler
          .filter((p) => paketGorebilir(ben, p, v) && (icinde(p.baslik) || p.kod.toLowerCase().includes(q) || icinde(v.kisiler.find((k) => k.id === p.muhabirId)?.ad)))
          .slice(0, 6)
          .map((p) => ({ id: p.id, ust: p.kod, metin: p.baslik, icerik: true, href: `#/paketler/${p.id}` })),
        ...v.oneriler
          .filter((o) => oneriGorebilir(ben, o) && (icinde(o.haberBasligi) || icinde(o.gelisme)))
          .slice(0, 4)
          .map((o) => ({ id: o.id, ust: t("oneri"), metin: o.haberBasligi, icerik: true, href: `#/oneriler/${o.id}` })),
        ...(ben.birim === "muhabir"
          ? []
          : v.kisiler
              .filter((k) => icinde(k.ad))
              .slice(0, 4)
              .map((k) => ({ id: k.id, ust: t(BIRIM_ADI[k.birim]), metin: ad(k), icerik: false, href: `#/muhabirler/${k.id}` }))),
      ];

  const ac = (n: typeof acik) => {
    setAcik(acik === n ? "" : n);
    if (n === "bildirim" && acik !== n && okunmamis) bildirimleriOku(ben);
  };

  return (
    <header className="ust" ref={kap}>
      <button className="ikon-dugme menu-dugme" onClick={onMenu} aria-label={t("menuAc")}>
        <Menu size={18} />
      </button>
      <a className="marka marka-mobil" href="#/" aria-label={t("uygulama")}>
        <b>TRT</b>
        <span>{t("markaArapca")}</span>
      </a>
      <div className={`arama ${acik === "arama" ? "acik" : ""}`}>
        <Search size={16} />
        <input
          type="search"
          dir="auto"
          value={aranan}
          placeholder={t("araIpucu")}
          aria-label={t("ara")}
          onChange={(e) => {
            setAranan(e.target.value);
            setAcik("arama");
          }}
          onFocus={() => setAcik("arama")}
        />
        {acik === "arama" && q.length >= 2 && (
          <div className="acilir arama-sonuc">
            {sonuclar.length === 0 ? (
              <Bos kucuk metin={t("aramaBos")} />
            ) : (
              sonuclar.map((s) => (
                <a
                  key={s.id}
                  className="acilir-satir"
                  href={s.href}
                  onClick={() => {
                    setAcik("");
                    setAranan("");
                  }}
                >
                  <div>
                    <small>{s.ust}</small>
                    {s.icerik ? <Icerik>{s.metin}</Icerik> : s.metin}
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
      <button className="ikon-dugme arama-ac" onClick={() => ac("arama")} aria-label={t("ara")}>
        <Search size={18} />
      </button>
      <span className="bosluk" />
      <DilSecici />
      <div className="acilir-kap">
        <button className="ikon-dugme" onClick={() => ac("bildirim")} aria-label={t("bildirimler")} aria-expanded={acik === "bildirim"}>
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
        <button className="kullanici" onClick={() => ac("kullanici")} aria-expanded={acik === "kullanici"} aria-label={t("kullaniciMenusu")}>
          <Avatar kisi={ben} durum />
          <span className="kullanici-ad">
            <b>{ad(ben)}</b>
            <small>
              {t(BIRIM_ADI[ben.birim])} · {t(GOREV_ADI[ben.gorev])}
            </small>
          </span>
        </button>
        {acik === "kullanici" && (
          <div className="acilir">
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
    </header>
  );
}
