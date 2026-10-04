import { ArrowDown, ArrowLeft, ArrowUp, CalendarRange, Check, CheckCheck, Inbox, Lock, Megaphone, Pencil, Printer, Send, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { HareketGecmisi } from "../../bilesenler/Hareket";
import { Avatar, Bos, Icerik, NotKutu, Rozet, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { aralikYaz, gunAdi, metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { HAFTA_DURUM_ADI, HAFTA_DURUM_TONU, HAREKET_TURU_ADI } from "../../etiketler";
import {
  anaKonuKaydet,
  anaKonuSil,
  anaKonuTasi,
  geriDonusBekliyor,
  haftalikDurum,
  haftalikGeriDonus,
  haftalikKesinlestir,
  kalanlariKabulEt,
  oneriGundemeEkle,
  onIncelemeyeGonder,
} from "../../eylemler";
import { etiketUret } from "../../eposta";
import { gundemde, haftaGunleri, haftaSonu, kararBekleyenler, nextDayeGider, onIncelemeyeGidebilir } from "../../haftalik";
import { bugun } from "../../tarih";
import { HAFTA_DURUMLARI, kisiBul, sahaGorevi, useVeri, type AnaKonu, type HaftalikKalem, type HaftalikPlan, type Kisi, type Oneri } from "../../veri";
import { haftalikDuzenler, kararVerebilir, yapabilir } from "../../yetki";
import { Bolum, EkleDugmesi, IkonDugme } from "../nextday/Bolumler";
import { FormAlt } from "../nextday/Formlar";
import { ElleOneriFormu } from "../oneri/OneriFormu";
import { GorunumSecici, OneriListesi, useOneriGorunumu, type PencereDurumu } from "../oneri/OneriKarti";
import { KalemFormu, KalemKarti } from "./Kalem";

/**
 * Haftalık plan ekranı: Perşembe toplantısına giden planın hazırlandığı
 * ve toplantının kararının işlendiği yer.
 *
 * Üstte durum çizgisi (hazırlık → haftalık toplantıda → kesinleşti) ve
 * yetkiye göre eylemler; altında kurumun haftalık çıktısının bölümleri:
 * gelen öneriler, muhabir hareketleri, haftanın ana dosyaları, gün gün
 * gündem ve zamana bağlı olmayan (stok) dosya. Bölümler Next Day'deki
 * gibi kapalı açılıyor.
 */
export default function HaftalikPlanEkrani({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const bas = hafta.baslangic;
  const duzenler = haftalikDuzenler(ben, hafta);
  const bekleyen = kararBekleyenler(hafta).length;
  const gundem = hafta.kalemler.filter(gundemde);
  const cagri = v.cagrilar.find((c) => c.etiket === etiketUret(bas, "haftalik"));
  const geriDonus = v.oneriler.filter((o) => o.hafta === bas && geriDonusBekliyor(o)).length;
  const durumSirasi = HAFTA_DURUMLARI.indexOf(hafta.durum);
  // Günü geçmiş kalem artık aktarılmaz; yalnız bugün ve sonrası "bekliyor".
  const aktarimBekleyen = gundem.filter((k) => nextDayeGider(k) && !k.aktarim?.planId && k.tarih! >= bugun()).length;

  const durumDegistir = (yeni: "hazirlik" | "toplantida", mesaj: Anahtar) => haftalikDurum(ben, hafta.id, yeni) && bildir(t(mesaj));

  return (
    <>
      <a className="geri-bag yazdirma-gizle" href="#/haftalik">
        <ArrowLeft size={14} className="yon" /> {t("haftalikPlanlar")}
      </a>
      <header className="sayfa-basi">
        <span className="ikon-kutu">
          <CalendarRange size={26} />
        </span>
        <div>
          <h1>
            {t("haftalik")} · {aralikYaz(bas, haftaSonu(bas), dil)}
          </h1>
          <p>
            <Rozet ton={HAFTA_DURUM_TONU[hafta.durum]}>{t(HAFTA_DURUM_ADI[hafta.durum])}</Rozet>{" "}
            {t("haftaOzetSatiri", { kalem: gundem.length, bekleyen, dosya: hafta.anaKonular.length })}
          </p>
        </div>
        <div className="sag-uc">
          {yapabilir(ben, "cagriHazirla") && hafta.durum === "hazirlik" && (
            <a className="dugme dugme-ikincil" href={`#/haftalik/${hafta.id}/cagri`}>
              <Megaphone size={16} /> {t(cagri ? "haftalikCagriyiAc" : "haftalikCagri")}
            </a>
          )}
          {cagri && yapabilir(ben, "cagriHazirla") && (
            <a className="dugme dugme-ikincil" href={`#/oneriler/yanitlar/${cagri.id}`}>
              <Inbox size={16} /> {t("gelenYanitlar")}
            </a>
          )}
          <a className="dugme dugme-ikincil" href={`#/haftalik/${hafta.id}/cikti`}>
            <Printer size={16} /> {t("ciktiOnizleme")}
          </a>
        </div>
      </header>

      <section className="kart">
        <div className="durum-cizgisi" aria-label={t("planDurumu")}>
          {HAFTA_DURUMLARI.map((d, i) => (
            <span key={d} className={i < durumSirasi || hafta.durum === "kesinlesti" ? "gecti" : i === durumSirasi ? "simdi" : ""}>
              {i > 0 && <span className="ayrac" aria-hidden="true" />}
              <i>{i < durumSirasi || hafta.durum === "kesinlesti" ? <Check size={11} /> : i + 1}</i>
              {t(HAFTA_DURUM_ADI[d])}
            </span>
          ))}
        </div>
        <div className="dugmeler ara-ust-2">
          {hafta.durum === "hazirlik" && duzenler && (
            <button className="dugme" onClick={() => durumDegistir("toplantida", "bHaftalikToplantida")}>
              <Send size={16} className="yon" /> {t("haftalikToplantiyaGotur")}
            </button>
          )}
          {hafta.durum === "toplantida" && kararVerebilir(ben, hafta) && bekleyen > 0 && (
            <button className="dugme dugme-ikincil" onClick={() => kalanlariKabulEt(ben, hafta.id) && bildir(t("bKalanlarKabul"))}>
              <CheckCheck size={16} /> {t("kalanlariKabulEt", { n: bekleyen })}
            </button>
          )}
          {hafta.durum === "toplantida" && yapabilir(ben, "haftalikKesinlestir") && (
            <button className="dugme dugme-iyi" disabled={bekleyen > 0} onClick={() => haftalikKesinlestir(ben, hafta.id) && bildir(t("bHaftalikKesinlesti"))}>
              <Check size={16} /> {t("kesinlestir")}
            </button>
          )}
          {hafta.durum === "toplantida" && duzenler && (
            <button className="dugme dugme-ikincil" onClick={() => durumDegistir("hazirlik", "bHazirligaAlindi")}>
              <Undo2 size={16} /> {t("hazirligaGeriAl")}
            </button>
          )}
          {hafta.durum === "kesinlesti" && yapabilir(ben, "geriDonus") && geriDonus > 0 && (
            <button className="dugme dugme-ikincil" onClick={() => bildir(t("bGeriDonus", { n: haftalikGeriDonus(ben, hafta.id) }))}>
              <Send size={16} className="yon" /> {t("geriDonusGonder", { n: geriDonus })}
            </button>
          )}
        </div>
        {hafta.durum === "toplantida" && bekleyen > 0 && <p className="bos-kucuk ara-ust">{t("kesinlestirmeIcinKarar", { n: bekleyen })}</p>}
        {hafta.durum === "toplantida" && duzenler && !yapabilir(ben, "haftalikKesinlestir") && <p className="bos-kucuk ara-ust">{t("kesinlestirmeYoneticide")}</p>}
        {hafta.durum === "kesinlesti" && (
          <div className="ara-ust-2">
            <NotKutu ikon={<Lock size={16} />}>
              {t("haftalikKilit")}
              {aktarimBekleyen > 0 && ` ${t("aktarimBekliyor", { n: aktarimBekleyen })}`}
            </NotKutu>
          </div>
        )}
      </section>

      {duzenler && yapabilir(ben, "oneriDegerlendir") && <GelenOneriler ben={ben} hafta={hafta} />}
      <MuhabirHareketleri hafta={hafta} />
      <AnaDosyalar ben={ben} hafta={hafta} />
      <GunlukGundem ben={ben} hafta={hafta} />
      <StokDosyasi ben={ben} hafta={hafta} />
      <Bolum no="↺" baslik={t("hareketGecmisi")}>
        <HareketGecmisi hareketler={v.hareketler.filter((h) => h.haftaId === hafta.id)} d={v} />
      </Bolum>
    </>
  );
}

/* --- Bu haftaya gelen öneriler: gündeme alınıyor ya da reddediliyor --- */

function GundemeEkle({ ben, hafta, oneri, kapat }: { ben: Kisi; hafta: HaftalikPlan; oneri: Oneri; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [f, setF] = useState({ tarih: "", baslikId: oneri.baslikId ?? "", yeniBaslik: "" });
  const kaydet = () => {
    const id = oneriGundemeEkle(ben, hafta.id, oneri.id, {
      tarih: f.tarih || undefined,
      baslikId: f.baslikId === "yeni" ? undefined : f.baslikId,
      yeniBaslik: f.baslikId === "yeni" ? f.yeniBaslik : undefined,
    });
    if (id) {
      bildir(t("bGundemeEklendi"));
      kapat();
    }
  };
  return (
    <div className="form form-kutu ara-ust-2">
      <div className="satir">
        <label>
          {t("gun")}
          <select value={f.tarih} onChange={(e) => setF({ ...f, tarih: e.target.value })}>
            <option value="">{t("zamanaBagliOlmayan")}</option>
            {haftaGunleri(hafta.baslangic).map((g) => (
              <option key={g} value={g}>
                {gunAdi(g, dil)} {tarihYaz(g, dil, "kisa")}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("dosya")}
          <select value={f.baslikId} onChange={(e) => setF({ ...f, baslikId: e.target.value })}>
            <option value="">{t("dosyasiz")}</option>
            {v.basliklar
              .filter((b) => b.aktif)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.ad}
                </option>
              ))}
            <option value="yeni">+ {t("yeniDosya")}</option>
          </select>
        </label>
      </div>
      {f.baslikId === "yeni" && (
        <label>
          {t("yeniDosya")}
          <input {...icerikAlani} value={f.yeniBaslik} onChange={(e) => setF({ ...f, yeniBaslik: e.target.value })} placeholder={metin("dosyaIpucu", "ar")} />
        </label>
      )}
      <FormAlt kapat={kapat} kaydet={kaydet} devre={f.baslikId === "yeni" && !f.yeniBaslik.trim()} kaydetMetni={t("gundemeEkle")} />
    </div>
  );
}

function GelenOneriler({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t } = useDil();
  const v = useVeri();
  /* Perşembe toplantısına giden öneri de yalnız çağrıdan gelmiyor; telefonla ya da ajanstan geleni Planlama burada giriyor. */
  const [elle, setElle] = useState(false);
  const [gorunum, setGorunum] = useOneriGorunumu(ben);
  const [pencere, setPencere] = useState<PencereDurumu>(null);
  const gundemdekiler = new Set(hafta.kalemler.map((k) => k.oneriId));
  const oneriler = v.oneriler
    .filter((o) => o.hafta === hafta.baslangic && !gundemdekiler.has(o.id) && o.durum !== "planaEklendi")
    .sort((a, b) => Number(a.durum === "reddedildi") - Number(b.durum === "reddedildi") || b.zaman.localeCompare(a.zaman));
  const bekleyen = oneriler.filter((o) => o.durum !== "reddedildi").length;
  return (
    <Bolum no="★" baslik={t("buHaftayaGelenOneriler")} ek={t("bekleyenSayisi", { n: bekleyen })}>
      <p className="aciklama">{t("buHaftayaGelenOnerilerAciklama")}</p>
      {elle ? (
        <div className="ara-ust-2">
          <ElleOneriFormu
            ben={ben}
            hafta={hafta.baslangic}
            hemenMetni={t("kaydetVeGundemeEkle")}
            kapat={() => setElle(false)}
            kaydet={(id, hemen) => {
              setElle(false);
              if (hemen) setPencere({ id, mod: "ekle" });
            }}
          />
        </div>
      ) : (
        <div className="oneri-arac ara-ust-2 ara-alt-2">
          {yapabilir(ben, "oneriGonder") && <EkleDugmesi metin={t("oneriEkle")} onClick={() => setElle(true)} />}
          <span className="bosluk-esnek" />
          <GorunumSecici deger={gorunum} degistir={setGorunum} />
        </div>
      )}
      <OneriListesi
        ben={ben}
        d={v}
        oneriler={oneriler}
        gorunum={gorunum}
        pencere={pencere}
        setPencere={setPencere}
        ekleMetni={t("gundemeEkle")}
        ekleFormu={(o, kapat) => <GundemeEkle ben={ben} hafta={hafta} oneri={o} kapat={kapat} />}
      />
    </Bolum>
  );
}

/* --- Muhabir hareketleri: haftaya düşen saha görevlendirmeleri, salt okunur --- */

function MuhabirHareketleri({ hafta }: { hafta: HaftalikPlan }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const bit = haftaSonu(hafta.baslangic);
  const liste = v.gorevlendirmeler
    .filter((g) => sahaGorevi(g) && g.baslangic <= bit && g.bitis >= hafta.baslangic && g.durum !== "talep")
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  return (
    <Bolum no={1} baslik={t("muhabirHareketleriHafta")} ek={String(liste.length)}>
      <p className="aciklama">{t("muhabirHareketleriHaftaAciklama")}</p>
      {liste.length === 0 ? (
        <Bos kucuk metin={t("kayitYok")} />
      ) : (
        liste.map((g) => {
          const k = kisiBul(v, g.kisiId);
          return (
            <div key={g.id} className="kayit">
              <div className="kayit-bas">
                <Avatar kisi={k} boy="kucuk" />
                <div>
                  <b>
                    <Icerik>{g.yer}</Icerik> · {ad(k)}
                  </b>
                  <small>
                    <span>{t(HAREKET_TURU_ADI[g.tur])}</span>
                    <span>
                      · {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")}
                    </span>
                  </small>
                  {g.aciklama && (
                    <Icerik blok className="kayit-metin">
                      {g.aciklama}
                    </Icerik>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </Bolum>
  );
}

/* --- Haftanın ana dosyaları (أهم ملفات الأسبوع) --- */

function AnaKonuFormu({ ben, hafta, mevcut, kapat }: { ben: Kisi; hafta: HaftalikPlan; mevcut?: AnaKonu; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ baslik: mevcut?.baslik ?? "", metin: mevcut?.metin ?? "" });
  const kaydet = () => anaKonuKaydet(ben, hafta.id, { id: mevcut?.id, ...f }) && kapat();
  return (
    <div className="form form-kutu ara-ust-2">
      <label>
        {t("dosyaBasligi")}
        <input {...icerikAlani} value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} placeholder={metin("anaDosyaIpucu", "ar")} />
      </label>
      <label>
        {t("durumOzeti")}
        <textarea {...icerikAlani} rows={4} value={f.metin} onChange={(e) => setF({ ...f, metin: e.target.value })} />
      </label>
      <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.baslik.trim()} />
    </div>
  );
}

function AnaDosyalar({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t } = useDil();
  const [form, setForm] = useState<string | null>(null);
  const duzenler = haftalikDuzenler(ben, hafta);
  return (
    <Bolum no={2} baslik={t("haftaninAnaDosyalari")} ek={String(hafta.anaKonular.length)}>
      <p className="aciklama">{t("haftaninAnaDosyalariAciklama")}</p>
      {hafta.anaKonular.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
      {hafta.anaKonular.map((a, i) =>
        form === a.id ? (
          <AnaKonuFormu key={a.id} ben={ben} hafta={hafta} mevcut={a} kapat={() => setForm(null)} />
        ) : (
          <div key={a.id} className="kayit">
            <div className="kayit-bas">
              <div>
                <b>
                  <Icerik blok className="ana-dosya-basligi">
                    {a.baslik}
                  </Icerik>
                </b>
                <Icerik blok className="kayit-metin">
                  {a.metin}
                </Icerik>
              </div>
              {duzenler && (
                <div className="islemler">
                  <IkonDugme ikon={<ArrowUp size={15} />} etiket={t("yukari")} onClick={() => i > 0 && anaKonuTasi(ben, hafta.id, a.id, -1)} />
                  <IkonDugme ikon={<ArrowDown size={15} />} etiket={t("asagi")} onClick={() => anaKonuTasi(ben, hafta.id, a.id, 1)} />
                  <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={() => setForm(a.id)} />
                  <IkonDugme ikon={<Trash2 size={15} />} etiket={t("sil")} ton="kotu-yazi" onClick={() => confirm(t("silinsinMi")) && anaKonuSil(ben, hafta.id, a.id)} />
                </div>
              )}
            </div>
          </div>
        ),
      )}
      {duzenler &&
        (form === "" ? (
          <AnaKonuFormu ben={ben} hafta={hafta} kapat={() => setForm(null)} />
        ) : (
          <div className="ara-ust-2">
            <EkleDugmesi metin={t("anaDosyaEkle")} onClick={() => setForm("")} />
          </div>
        ))}
    </Bolum>
  );
}

/* --- Gün gün gündem: her gün dosyalara göre gruplu --- */

/** Kalemleri dosyalarına göre grupluyor; sıra dosyanın o gün ilk geçtiği yer. */
const dosyalaraGore = (kalemler: HaftalikKalem[]) => {
  const gruplar = new Map<string, HaftalikKalem[]>();
  for (const k of kalemler) gruplar.set(k.baslikId ?? "", [...(gruplar.get(k.baslikId ?? "") ?? []), k]);
  return [...gruplar.entries()];
};

function DosyaGruplari({ ben, hafta, kalemler }: { ben: Kisi; hafta: HaftalikPlan; kalemler: HaftalikKalem[] }) {
  const { t } = useDil();
  const v = useVeri();
  return (
    <>
      {dosyalaraGore(kalemler).map(([baslikId, liste]) => (
        <div key={baslikId || "-"} className="dosya-grubu">
          <div className="alan-etiket">{baslikId ? <Icerik>{v.basliklar.find((b) => b.id === baslikId)?.ad}</Icerik> : t("dosyasiz")}</div>
          {liste.map((k) => (
            <KalemKarti key={k.id} ben={ben} hafta={hafta} kalem={k} />
          ))}
        </div>
      ))}
    </>
  );
}

function GunlukGundem({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t, dil } = useDil();
  const [form, setForm] = useState<string | null>(null);
  const duzenler = haftalikDuzenler(ben, hafta);
  const gunlu = hafta.kalemler.filter((k) => k.tarih);
  return (
    <Bolum no={3} baslik={t("gunlukGundem")} ek={t("kalemSayisi", { n: gunlu.length })}>
      <p className="aciklama">{t("gunlukGundemAciklama")}</p>
      {haftaGunleri(hafta.baslangic).map((g) => {
        const kalemler = gunlu.filter((k) => k.tarih === g);
        return (
          <section key={g} className="gun-blogu">
            <h3>
              {gunAdi(g, dil)} <span>{tarihYaz(g, dil, "uzun")}</span>
            </h3>
            {kalemler.length === 0 && form !== g && <p className="bos-kucuk">{t("buGunKalemYok")}</p>}
            <DosyaGruplari ben={ben} hafta={hafta} kalemler={kalemler} />
            {duzenler &&
              (form === g ? (
                <KalemFormu ben={ben} hafta={hafta} tarih={g} kapat={() => setForm(null)} />
              ) : (
                <div className="ara-ust">
                  <EkleDugmesi metin={t("kalemEkle")} onClick={() => setForm(g)} />
                </div>
              ))}
          </section>
        );
      })}
    </Bolum>
  );
}

/* --- Zamana bağlı olmayan dosya: stok önerileri ve ön inceleme --- */

function StokDosyasi({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t } = useDil();
  const [form, setForm] = useState(false);
  const duzenler = haftalikDuzenler(ben, hafta);
  const stok = hafta.kalemler.filter((k) => !k.tarih);
  const gundemdeki = stok.filter(gundemde);
  const dusen = stok.filter((k) => !gundemde(k));
  const gidebilir = stok.filter(onIncelemeyeGidebilir);
  return (
    <Bolum no={4} baslik={t("zamanaBagliOlmayan")} ek={t("kalemSayisi", { n: gundemdeki.length })}>
      <p className="aciklama">{t("stokDosyasiAciklama")}</p>
      {duzenler && gidebilir.length > 0 && (
        <div className="dugmeler">
          <button
            className="dugme dugme-ikincil dugme-kucuk"
            onClick={() => {
              const n = onIncelemeyeGonder(ben, hafta.id, gidebilir.map((k) => k.id));
              if (n) bildir(t("bOnIncelemeyeGitti", { n }));
            }}
          >
            <Send size={14} className="yon" /> {t("hepsiniOnIncelemeyeGonder", { n: gidebilir.length })}
          </button>
        </div>
      )}
      {gundemdeki.length === 0 && !form && <Bos kucuk metin={t("kayitYok")} />}
      <div className="ara-ust-2">
        <DosyaGruplari ben={ben} hafta={hafta} kalemler={gundemdeki} />
      </div>
      {duzenler &&
        (form ? (
          <KalemFormu ben={ben} hafta={hafta} tarih="" kapat={() => setForm(false)} />
        ) : (
          <div className="ara-ust">
            <EkleDugmesi metin={t("kalemEkle")} onClick={() => setForm(true)} />
          </div>
        ))}
      {dusen.length > 0 && (
        <details className="ara-ust-2 dusenler">
          <summary className="bos-kucuk">{t("onIncelemedeReddedilenler", { n: dusen.length })}</summary>
          {dusen.map((k) => (
            <KalemKarti key={k.id} ben={ben} hafta={hafta} kalem={k} dosyaGoster />
          ))}
        </details>
      )}
    </Bolum>
  );
}
