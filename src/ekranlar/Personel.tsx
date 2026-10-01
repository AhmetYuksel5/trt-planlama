import { ArrowLeft, CalendarClock, Contact, Inbox, Mail, MapPin, Phone, Plane, Route, Search, UserRound, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar, Bos, Kart, NotKutu, PaketDurumRozeti, Rozet, TaslakEtiketi } from "../bilesenler/Parcalar";
import { OneriTablosu, PaketTablosu } from "../bilesenler/Tablolar";
import { tarihYaz, useDil, type Anahtar } from "../dil";
import { BIRIM_ADI, GOREVLENDIRME_DURUM_ADI, GOREV_ADI, HAREKET_TURU_ADI, KISI_DURUM_ADI, sehirAdi } from "../etiketler";
import { bugun } from "../tarih";
import { BIRIMLER, kisiBul, useVeri, type Birim, type Gorevlendirme, type Kisi } from "../veri";
import { gorevlendirmeGorebilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";

/*
 * Personel ve görevlendirmeler. Yaklaşık yüz kişilik kadro için arama ve
 * süzgeç öne çıkıyor; kişi detayında iletişim, bölge, uzmanlık, devam
 * eden işler ve geçmiş görevler (rapor bölüm 1, Muhabirler modülü).
 */

const PERSONEL_SAYFASI: Record<string, { baslik: Anahtar; alt: Anahtar; ikon: ReactNode; suz: (k: Kisi) => boolean }> = {
  muhabirler: { baslik: "mMuhabirler", alt: "muhabirlerAlt", ikon: <Users size={26} />, suz: (k) => k.birim === "muhabir" },
  editorler: { baslik: "mEditorler", alt: "editorlerAlt", ikon: <UserRound size={26} />, suz: (k) => ["editor", "dilDenetmeni", "newsdesk", "programEditoru", "planlamaci"].includes(k.gorev) },
  personel: { baslik: "mPersonel", alt: "personelAlt", ikon: <Contact size={26} />, suz: (k) => k.birim !== "muhabir" },
};

export function PersonelListe({ sayfa }: { sayfa: string }) {
  const { t, y } = useDil();
  const v = useVeri();
  const ayar = PERSONEL_SAYFASI[sayfa] ?? PERSONEL_SAYFASI.personel;
  const [aranan, setAranan] = useState("");
  const [birim, setBirim] = useState<Birim | "">("");
  const q = aranan.trim().toLocaleLowerCase();
  const tum = v.kisiler.filter(ayar.suz);
  const liste = tum
    .filter((k) => (!birim || k.birim === birim) && (!q || `${y(k.ad)} ${t(sehirAdi(k.sehir))}`.toLocaleLowerCase().includes(q)))
    .sort((a, b) => y(a.ad).localeCompare(y(b.ad)));
  const aktifIs = (k: Kisi) => v.paketler.filter((p) => p.muhabirId === k.id && p.durum === "uretimde").length;
  return (
    <>
      <SayfaBasi ikon={ayar.ikon} baslik={t(ayar.baslik)} alt={t(ayar.alt)} />
      <Kart>
        <div className="suzgec">
          <label className="arama arama-kutu">
            <Search size={16} />
            <input type="search" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("kisiAra")} aria-label={t("kisiAra")} />
          </label>
          {sayfa !== "muhabirler" && (
            <select className="girdi" value={birim} onChange={(e) => setBirim(e.target.value as Birim | "")} aria-label={t("birim")}>
              <option value="">{t("tumBirimler")}</option>
              {BIRIMLER.filter((b) => tum.some((k) => k.birim === b)).map((b) => (
                <option key={b} value={b}>
                  {t(BIRIM_ADI[b])}
                </option>
              ))}
            </select>
          )}
          <span className="bos-kucuk">{t("kisiSayisi", { n: liste.length })}</span>
        </div>
        <div className="tablo-sar">
          <table className="tablo kartli">
            <thead>
              <tr>
                <th>{t("ad")}</th>
                <th>{t("birim")}</th>
                <th>{t("gorev")}</th>
                <th>{t("konum")}</th>
                <th>{t("durum")}</th>
                <th>{t("diller")}</th>
                {sayfa === "muhabirler" && <th>{t("devamEdenIs")}</th>}
              </tr>
            </thead>
            <tbody>
              {liste.map((k) => (
                <tr key={k.id}>
                  <td className="birincil">
                    <a className="kisi-hucre kalin" href={`#/muhabirler/${k.id}`}>
                      <Avatar kisi={k} boy="kucuk" durum /> {y(k.ad)}
                    </a>
                  </td>
                  <td data-etiket={t("birim")}>{t(BIRIM_ADI[k.birim])}</td>
                  <td className="sonuk" data-etiket={t("gorev")}>
                    {t(GOREV_ADI[k.gorev])}
                    {k.serbest && (
                      <>
                        {" "}
                        <Rozet>{t("serbest")}</Rozet>
                      </>
                    )}
                  </td>
                  <td data-etiket={t("konum")}>{t(sehirAdi(k.sehir))}</td>
                  <td data-etiket={t("durum")}>
                    <Rozet ton={k.durum === "sahada" ? "vurgu" : k.durum === "izinli" ? "" : k.durum === "yolda" ? "uyari" : "iyi"}>{t(KISI_DURUM_ADI[k.durum])}</Rozet>
                  </td>
                  <td className="sonuk" data-etiket={t("diller")}>
                    <bdi>{k.diller.join(" · ").toUpperCase()}</bdi>
                  </td>
                  {sayfa === "muhabirler" && <td data-etiket={t("devamEdenIs")}>{aktifIs(k) || "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kart>
    </>
  );
}

export function KisiDetay({ kisi }: { kisi: Kisi }) {
  const { t, y } = useDil();
  const v = useVeri();
  const paketler = v.paketler.filter((p) => p.muhabirId === kisi.id).sort((a, b) => b.guncelleme.localeCompare(a.guncelleme));
  const devam = paketler.filter((p) => p.durum !== "tamamlandi" && p.durum !== "iptal");
  const gecmis = paketler.filter((p) => p.durum === "tamamlandi");
  const oneriler = v.oneriler.filter((o) => o.muhabirId === kisi.id).sort((a, b) => b.zaman.localeCompare(a.zaman));
  const kararli = oneriler.filter((o) => o.durum === "planaEklendi" || o.durum === "reddedildi");
  const kabul = kararli.length ? Math.round((oneriler.filter((o) => o.durum === "planaEklendi").length / kararli.length) * 100) : null;
  const gorevler = v.gorevlendirmeler.filter((g) => g.kisiId === kisi.id);
  return (
    <>
      <a className="geri-bag" href={kisi.birim === "muhabir" ? "#/muhabirler" : "#/personel"}>
        <ArrowLeft size={14} className="yon" /> {t(kisi.birim === "muhabir" ? "mMuhabirler" : "mPersonel")}
      </a>
      <header className="sayfa-basi">
        <Avatar kisi={kisi} boy="buyuk" durum />
        <div>
          <h1>{y(kisi.ad)}</h1>
          <p>
            {t(BIRIM_ADI[kisi.birim])} · {t(GOREV_ADI[kisi.gorev])} · {t(sehirAdi(kisi.sehir))} <Rozet>{t(KISI_DURUM_ADI[kisi.durum])}</Rozet>
          </p>
        </div>
      </header>
      <div className="iz iz-ana-yan">
        <div className="iz">
          {kisi.birim === "muhabir" && (
            <>
              <Kart baslik={t("devamEdenIsler")}>
                <PaketTablosu paketler={devam} d={v} sutunlar={["baslik", "tur", "asama", "kimde", "teslim"]} bosMetin={t("kayitYok")} />
              </Kart>
              <Kart baslik={t("gecmisGorevler")}>
                {gecmis.length === 0 ? (
                  <Bos kucuk metin={t("kayitYok")} />
                ) : (
                  <ul className="liste">
                    {gecmis.slice(0, 10).map((p) => (
                      <li key={p.id}>
                        <div className="ad">
                          <a href={`#/paketler/${p.id}`}>{y(p.baslik)}</a>
                          <small>
                            {p.kod} {p.klipKodu && `· ${p.klipKodu}`}
                          </small>
                        </div>
                        <PaketDurumRozeti paket={p} />
                      </li>
                    ))}
                  </ul>
                )}
              </Kart>
              <Kart baslik={t("oneriGecmisi")} ek={kabul !== null ? t("kabulOrani", { n: kabul }) : undefined}>
                <OneriTablosu oneriler={oneriler} d={v} kisa />
              </Kart>
            </>
          )}
          {kisi.birim !== "muhabir" && (
            <Kart baslik={t("sonIslemler")}>
              <PaketTablosu
                paketler={v.paketler.filter((p) => v.hareketler.some((h) => h.paketId === p.id && h.kisiId === kisi.id)).slice(0, 10)}
                d={v}
                sutunlar={["baslik", "muhabir", "asama", "kimde"]}
                bosMetin={t("kayitYok")}
              />
            </Kart>
          )}
        </div>
        <div className="iz">
          <Kart baslik={t("iletisim")}>
            <ul className="liste">
              <li>
                <Phone size={16} className="sonuk-yazi" />
                <div className="ad">
                  <b dir="ltr">{kisi.telefon}</b>
                </div>
              </li>
              <li>
                <Mail size={16} className="sonuk-yazi" />
                <div className="ad">
                  <b dir="ltr">{kisi.eposta}</b>
                </div>
              </li>
              <li>
                <MapPin size={16} className="sonuk-yazi" />
                <div className="ad">
                  <b>{t(sehirAdi(kisi.sehir))}</b>
                </div>
              </li>
            </ul>
            <p className="bos-kucuk">{t("ornekIletisimNotu")}</p>
          </Kart>
          <Kart baslik={t("bilgiler")}>
            <div className="alanlar">
              <div className="alan">
                <small>{t("diller")}</small>
                <b dir="ltr">{kisi.diller.join(" · ").toUpperCase()}</b>
              </div>
              <div className="alan">
                <small>{t("calismaBicimi")}</small>
                <b>{t(kisi.serbest ? "serbest" : "kadrolu")}</b>
              </div>
              <div className="alan">
                <small>{t("rol")}</small>
                <b>{t(kisi.rol === "yonetici" ? "rolYonetici" : "rolPersonel")}</b>
              </div>
            </div>
          </Kart>
          <Kart baslik={t("gorevlendirmeler")}>
            {gorevler.length === 0 ? <Bos kucuk metin={t("gorevlendirmeYok")} /> : <GorevListesi gorevler={gorevler} />}
          </Kart>
        </div>
      </div>
    </>
  );
}

function GorevListesi({ gorevler }: { gorevler: Gorevlendirme[] }) {
  const { t, y, dil } = useDil();
  const v = useVeri();
  return (
    <ul className="liste">
      {gorevler.map((g) => {
        const k = kisiBul(v, g.kisiId);
        return (
          <li key={g.id}>
            <Avatar kisi={k} boy="kucuk" />
            <div className="ad">
              <b>
                {y(g.yer)} / {k ? y(k.ad) : ""}
              </b>
              <small>
                {t(HAREKET_TURU_ADI[g.tur])} · {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")}
                {y(g.aciklama) && ` · ${y(g.aciklama)}`}
              </small>
            </div>
            {g.yurtdisi && <Rozet ton="tur-program">{t("yurtdisiKisa")}</Rozet>}
            <Rozet ton={g.durum === "talep" ? "uyari" : g.durum === "bitti" ? "" : "vurgu"}>{t(GOREVLENDIRME_DURUM_ADI[g.durum])}</Rozet>
          </li>
        );
      })}
    </ul>
  );
}

/* --- Görevlendirmeler: News Gathering'in alanı; akışı henüz tanımlanmadı --- */

const GOREV_SAYFASI: Record<string, { baslik: Anahtar; alt: Anahtar; ikon: ReactNode; suz: (g: Gorevlendirme, B: string) => boolean }> = {
  yurtdisi: { baslik: "mYurtdisi", alt: "yurtdisiAlt", ikon: <Plane size={26} />, suz: (g) => g.yurtdisi },
  yurtici: { baslik: "mYurtici", alt: "yurticiAlt", ikon: <MapPin size={26} />, suz: (g) => !g.yurtdisi && g.tur !== "izin" },
  seyahat: { baslik: "mSeyahat", alt: "seyahatAlt", ikon: <Route size={26} />, suz: (g, B) => g.bitis >= B },
  talepler: { baslik: "mTalepler", alt: "taleplerAlt", ikon: <Inbox size={26} />, suz: (g) => g.durum === "talep" },
  izinler: { baslik: "mIzinler", alt: "izinlerAlt", ikon: <CalendarClock size={26} />, suz: (g, B) => g.bitis >= B },
};

export function Gorevlendirmeler({ ben, sayfa }: { ben: Kisi; sayfa: string }) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  const muhabir = ben.birim === "muhabir";
  const ayar = GOREV_SAYFASI[sayfa] ?? GOREV_SAYFASI.yurtdisi;
  const liste = v.gorevlendirmeler
    .filter((g) => gorevlendirmeGorebilir(ben, g) && (muhabir || ayar.suz(g, B)))
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  return (
    <>
      <SayfaBasi ikon={ayar.ikon} baslik={t(muhabir ? "mGorevlerim" : ayar.baslik)} alt={t(muhabir ? "gorevlerimAlt" : ayar.alt)} sagUc={muhabir ? undefined : <TaslakEtiketi />} />
      {!muhabir && <NotKutu>{t("ngTaslakNotu")}</NotKutu>}
      <Kart>{liste.length === 0 ? <Bos metin={t("gorevlendirmeYok")} /> : <GorevListesi gorevler={liste} />}</Kart>
    </>
  );
}

