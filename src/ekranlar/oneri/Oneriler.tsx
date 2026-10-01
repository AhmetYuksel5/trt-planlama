import { ArrowLeft, Ban, ClipboardCopy, Clock, FlaskConical, Lightbulb, Megaphone, Search, Send } from "lucide-react";
import { useState } from "react";
import { HareketGecmisi } from "../../bilesenler/Hareket";
import { Avatar, Bos, Kart, NotKutu, Rozet, TurRozeti, bildir } from "../../bilesenler/Parcalar";
import { OneriDurumRozeti, OneriTablosu } from "../../bilesenler/Tablolar";
import { DILLER, metin, saatYaz, tarihYaz, useDil, type Dil } from "../../dil";
import { cagriKaydet, oneriDurum, oneriGonder, ulkesi } from "../../eylemler";
import { BIRIM_ADI, KANAL_ADI, ONERI_DURUM_ADI, TUR_ADI, sehirAdi, ulkeAdi } from "../../etiketler";
import { bugun, gunEkle, yerelGun } from "../../tarih";
import {
  ICERIK_TURLERI,
  KANALLAR,
  ONERI_DURUMLARI,
  ULKELER,
  baslikBul,
  kisiBul,
  muhabirler,
  paketBul,
  planBul,
  useVeri,
  type IcerikTuru,
  type Kanal,
  type Kisi,
  type Oneri,
  type OneriDurum,
  type Ulke,
} from "../../veri";
import { oneriGorebilir, yapabilir } from "../../yetki";
import { git } from "../../yol";
import { SayfaBasi } from "../ana/Planlama";
import { MuhabirSecici } from "../nextday/Formlar";
import PlanaEkle from "./PlanaEkle";

/**
 * Öneriler: havuz, ayrıntı, yeni öneri ve öneri çağrısı.
 *
 * Promptun 4.2 maddesindeki alanlar ve durumlar. Önerinin muhabirin
 * yazdığı hali hiç değişmiyor; değerlendirme (durum, bağlandığı başlık,
 * plan, gerekçe) ayrı alanlarda tutuluyor. Muhabir yalnız kendi
 * önerilerini görüyor.
 */

export function OnerilerListe({ ben }: { ben: Kisi }) {
  const { t, y } = useDil();
  const v = useVeri();
  const [durum, setDurum] = useState<OneriDurum | "hepsi">("hepsi");
  const [tur, setTur] = useState<IcerikTuru | "">("");
  const [ulke, setUlke] = useState<Ulke | "">("");
  const [aranan, setAranan] = useState("");
  const muhabir = ben.birim === "muhabir";
  const gorunen = v.oneriler.filter((o) => oneriGorebilir(ben, o));
  const q = aranan.trim().toLocaleLowerCase();
  const liste = gorunen
    .filter(
      (o) =>
        (durum === "hepsi" || o.durum === durum) &&
        (!tur || o.tur === tur) &&
        (!ulke || o.ulke === ulke) &&
        (!q || `${y(o.haberBasligi)} ${y(o.gelisme)} ${y(kisiBul(v, o.muhabirId)?.ad ?? "")}`.toLocaleLowerCase().includes(q)),
    )
    .sort((a, b) => b.zaman.localeCompare(a.zaman));

  return (
    <>
      <SayfaBasi
        ikon={<Lightbulb size={26} />}
        baslik={t(muhabir ? "mOnerilerim" : "mOneriler")}
        alt={t(muhabir ? "onerilerimAlt" : "onerilerAlt")}
        sagUc={
          <>
            {yapabilir(ben, "cagriHazirla") && (
              <a className="dugme dugme-ikincil" href="#/oneriler/cagri">
                <Megaphone size={16} /> {t("oneriCagrisi")}
              </a>
            )}
            {yapabilir(ben, "oneriGonder") && (
              <a className="dugme" href="#/oneriler/yeni">
                <Send size={16} className="yon" /> {t(muhabir ? "yeniOneriGonder" : "oneriKaydet")}
              </a>
            )}
          </>
        }
      />
      <Kart>
        <div className="suzgec">
          <label className="arama arama-kutu">
            <Search size={16} />
            <input type="search" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("oneriAra")} aria-label={t("oneriAra")} />
          </label>
          <select className="girdi" value={tur} onChange={(e) => setTur(e.target.value as IcerikTuru | "")} aria-label={t("tur")}>
            <option value="">{t("tumTurler")}</option>
            {ICERIK_TURLERI.map((x) => (
              <option key={x} value={x}>
                {t(TUR_ADI[x])}
              </option>
            ))}
          </select>
          <select className="girdi" value={ulke} onChange={(e) => setUlke(e.target.value as Ulke | "")} aria-label={t("ulke")}>
            <option value="">{t("tumUlkeler")}</option>
            {ULKELER.map((x) => (
              <option key={x} value={x}>
                {t(ulkeAdi(x))}
              </option>
            ))}
          </select>
        </div>
        <div className="sekmeler suzgec">
          <button className={durum === "hepsi" ? "acik" : ""} onClick={() => setDurum("hepsi")}>
            {t("hepsi")} <em>{gorunen.length}</em>
          </button>
          {ONERI_DURUMLARI.map((d) => (
            <button key={d} className={durum === d ? "acik" : ""} onClick={() => setDurum(d)}>
              {t(ONERI_DURUM_ADI[d])} <em>{gorunen.filter((o) => o.durum === d).length}</em>
            </button>
          ))}
        </div>
        <OneriTablosu oneriler={liste} d={v} />
      </Kart>
    </>
  );
}

export function OneriDetay({ ben, oneri }: { ben: Kisi; oneri: Oneri }) {
  const { t, y, dil } = useDil();
  const v = useVeri();
  const [ekle, setEkle] = useState(false);
  const [ret, setRet] = useState<string | null>(null);
  const muhabir = kisiBul(v, oneri.muhabirId);
  const plan = planBul(v, oneri.planId);
  const paket = paketBul(v, oneri.paketId);
  const baslik = baslikBul(v, oneri.baslikId);
  const degerlendirir = yapabilir(ben, "oneriDegerlendir") && oneri.durum !== "planaEklendi";
  const hareketler = v.hareketler.filter((h) => h.oneriId === oneri.id);

  return (
    <>
      <a className="geri-bag" href="#/oneriler">
        <ArrowLeft size={14} className="yon" /> {t(ben.birim === "muhabir" ? "mOnerilerim" : "mOneriler")}
      </a>
      <header className="sayfa-basi">
        <Avatar kisi={muhabir} boy="buyuk" />
        <div>
          <h1>{y(oneri.haberBasligi)}</h1>
          <p>
            <OneriDurumRozeti oneri={oneri} /> {muhabir && y(muhabir.ad)} · {t(ulkeAdi(oneri.ulke))} · {tarihYaz(yerelGun(oneri.zaman), dil, "uzun")} {saatYaz(oneri.zaman, dil)}
          </p>
        </div>
      </header>
      <div className="iz iz-ana-yan">
        <div className="iz">
          <Kart baslik={t("oneriOrijinal")} ek={t("oneriOrijinalNot")}>
            <div className="alanlar">
              <div className="alan">
                <small>{t("muhabir")}</small>
                <b>{muhabir ? y(muhabir.ad) : "?"}</b>
              </div>
              <div className="alan">
                <small>{t("ulke")}</small>
                <b>{t(ulkeAdi(oneri.ulke))}</b>
              </div>
              <div className="alan">
                <small>{t("kanal")}</small>
                <b>{t(KANAL_ADI[oneri.kanal])}</b>
              </div>
              <div className="alan">
                <small>{t("hedefPlan")}</small>
                <b>{tarihYaz(oneri.hedefTarih, dil, "tam")}</b>
              </div>
              <div className="alan">
                <small>{t("tur")}</small>
                <TurRozeti tur={oneri.tur} />
              </div>
              <div className="alan">
                <small>{t("saha")}</small>
                <b>{t(oneri.sahaGerekli ? "evet" : "hayir")}</b>
              </div>
            </div>
            <div className="ara-ust-2">
              <div className="alan-etiket">{t("gelismeAciklama")}</div>
              <div className="metin-kutu">{y(oneri.gelisme)}</div>
            </div>
            {oneri.paketBasligi && (
              <div className="ara-ust-2">
                <div className="alan-etiket">{t("onerilenPaketBasligi")}</div>
                <div className="metin-kutu">{y(oneri.paketBasligi)}</div>
              </div>
            )}
          </Kart>
          <Kart baslik={t("hareketGecmisi")}>
            {hareketler.length ? <HareketGecmisi hareketler={hareketler} d={v} /> : <Bos kucuk metin={t("kayitYok")} />}
          </Kart>
        </div>
        <div className="iz">
          <Kart baslik={t("degerlendirme")}>
            <div className="alanlar">
              <div className="alan">
                <small>{t("durum")}</small>
                <OneriDurumRozeti oneri={oneri} />
              </div>
              <div className="alan">
                <small>{t("haberBasligi")}</small>
                <b>{baslik ? y(baslik.ad) : "—"}</b>
              </div>
              <div className="alan">
                <small>{t("plan")}</small>
                {plan ? <a href={`#/nextday/${plan.id}`}>{tarihYaz(plan.tarih, dil, "kisa")}</a> : <b>—</b>}
              </div>
              <div className="alan">
                <small>{t("paketOnerisi")}</small>
                {paket ? <a href={`#/paketler/${paket.id}`}>{paket.kod}</a> : <b>—</b>}
              </div>
            </div>
            {oneri.gerekce && (
              <div className="ara-ust-2">
                <NotKutu ton="uyari">{oneri.gerekce}</NotKutu>
              </div>
            )}
            {oneri.geriDonus && (
              <div className="ara-ust-2">
                <Rozet ton="iyi">{t("geriDonusYapildi")}</Rozet>
              </div>
            )}
            {degerlendirir && (
              <div className="ara-ust-2">
                {ekle ? (
                  <PlanaEkle ben={ben} oneri={oneri} kapat={() => setEkle(false)} />
                ) : ret !== null ? (
                  <div className="form form-kutu">
                    <label>
                      {t("retGerekcesi")}
                      <input value={ret} onChange={(e) => setRet(e.target.value)} autoFocus />
                    </label>
                    <div className="form-alt">
                      <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setRet(null)}>
                        {t("iptal")}
                      </button>
                      <button
                        className="dugme dugme-kotu dugme-kucuk"
                        onClick={() => {
                          oneriDurum(ben, oneri.id, "reddedildi", ret);
                          setRet(null);
                        }}
                      >
                        {t("reddet")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dugmeler">
                    {oneri.durum !== "reddedildi" && (
                      <button className="dugme dugme-iyi" onClick={() => setEkle(true)}>
                        {t("planaEkle")}
                      </button>
                    )}
                    {oneri.durum === "yeni" && (
                      <button className="dugme dugme-ikincil" onClick={() => oneriDurum(ben, oneri.id, "degerlendiriliyor")}>
                        <Clock size={15} /> {t("degerlendirmeyeAl")}
                      </button>
                    )}
                    {oneri.durum !== "sonra" && oneri.durum !== "reddedildi" && (
                      <button className="dugme dugme-ikincil" onClick={() => oneriDurum(ben, oneri.id, "sonra")}>
                        {t("odSonra")}
                      </button>
                    )}
                    {oneri.durum !== "reddedildi" && (
                      <button className="dugme dugme-kotu" onClick={() => setRet("")}>
                        <Ban size={15} /> {t("reddet")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Kart>
          {muhabir && (
            <Kart baslik={t("muhabir")}>
              <div className="kayit-bas">
                <Avatar kisi={muhabir} durum />
                <div>
                  <b>{y(muhabir.ad)}</b>
                  <small>
                    {t(BIRIM_ADI[muhabir.birim])} · {t(sehirAdi(muhabir.sehir))}
                  </small>
                </div>
              </div>
            </Kart>
          )}
        </div>
      </div>
    </>
  );
}

export function YeniOneri({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const muhabir = ben.birim === "muhabir";
  const B = bugun();
  const cagri = v.cagrilar.filter((c) => c.tarih > B).sort((a, b) => b.zaman.localeCompare(a.zaman))[0];
  const [f, setF] = useState({
    muhabirId: muhabir ? ben.id : "",
    ulke: (muhabir ? ulkesi(ben.sehir) : "turkiye") as Ulke,
    haberBasligi: "",
    gelisme: "",
    paketBasligi: "",
    tur: "haber" as IcerikTuru,
    sahaGerekli: false,
    kanal: (muhabir ? "sistem" : "eposta") as Kanal,
    hedefTarih: cagri?.tarih ?? gunEkle(B, 1),
  });
  const gecerli = !!f.muhabirId && !!f.haberBasligi.trim() && !!f.gelisme.trim();
  const gonder = () => {
    if (!gecerli) return;
    const id = oneriGonder(ben, { ...f, haberBasligi: f.haberBasligi.trim(), gelisme: f.gelisme.trim(), paketBasligi: f.paketBasligi.trim() || undefined });
    if (id) {
      bildir(t("bOneriGonderildi"));
      git(`oneriler/${id}`);
    }
  };
  return (
    <>
      <a className="geri-bag" href="#/oneriler">
        <ArrowLeft size={14} className="yon" /> {t(muhabir ? "mOnerilerim" : "mOneriler")}
      </a>
      <SayfaBasi ikon={<Send size={26} className="yon" />} baslik={t(muhabir ? "yeniOneriGonder" : "oneriKaydet")} alt={t(muhabir ? "yeniOneriAlt" : "oneriKaydetAlt")} />
      {cagri && (
        <NotKutu ton="vurgu" ikon={<Megaphone size={18} />}>
          {t("acikCagri", { tarih: tarihYaz(cagri.tarih, dil, "uzun") })} · {t("acikCagriAciklama", { saat: cagri.sonSaat })}
        </NotKutu>
      )}
      <Kart>
        <div className="form">
          {!muhabir && (
            <div className="satir">
              <label>
                {t("muhabir")}
                <MuhabirSecici
                  deger={f.muhabirId}
                  degistir={(id) => {
                    const k = kisiBul(v, id);
                    setF({ ...f, muhabirId: id, ulke: k ? ulkesi(k.sehir) : f.ulke });
                  }}
                />
              </label>
              <label>
                {t("kanal")}
                <select value={f.kanal} onChange={(e) => setF({ ...f, kanal: e.target.value as Kanal })}>
                  {KANALLAR.filter((k) => k !== "sistem").map((k) => (
                    <option key={k} value={k}>
                      {t(KANAL_ADI[k])}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="satir">
            <label>
              {t("hedefPlan")}
              <input type="date" value={f.hedefTarih} min={B} onChange={(e) => setF({ ...f, hedefTarih: e.target.value })} />
            </label>
            <label>
              {t("ulke")}
              <select value={f.ulke} onChange={(e) => setF({ ...f, ulke: e.target.value as Ulke })}>
                {ULKELER.map((u) => (
                  <option key={u} value={u}>
                    {t(ulkeAdi(u))}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("tur")}
              <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as IcerikTuru })}>
                {ICERIK_TURLERI.map((x) => (
                  <option key={x} value={x}>
                    {t(TUR_ADI[x])}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            {t("haberBasligi")}
            <input value={f.haberBasligi} onChange={(e) => setF({ ...f, haberBasligi: e.target.value })} placeholder={t("haberBasligiIpucu")} />
          </label>
          <label>
            {t("gelismeAciklama")}
            <textarea value={f.gelisme} onChange={(e) => setF({ ...f, gelisme: e.target.value })} placeholder={t("gelismeIpucu")} />
          </label>
          <label>
            {t("onerilenPaketBasligi")} <span className="ipucu">{t("varsa")}</span>
            <input value={f.paketBasligi} onChange={(e) => setF({ ...f, paketBasligi: e.target.value })} />
          </label>
          <label className="secim">
            <input type="checkbox" checked={f.sahaGerekli} onChange={(e) => setF({ ...f, sahaGerekli: e.target.checked })} />
            {t("sahaGerekli")}
          </label>
          <div className="form-alt">
            <a className="dugme dugme-ikincil" href="#/oneriler">
              {t("iptal")}
            </a>
            <button className="dugme" onClick={gonder} disabled={!gecerli}>
              <Send size={16} className="yon" /> {t("gonder")}
            </button>
          </div>
        </div>
      </Kart>
    </>
  );
}

/**
 * Öneri çağrısı: sabah saha muhabirlerine giden e-postanın metni.
 * Prompt e-posta entegrasyonu yoksa bunun demo olduğunun açıkça
 * yazılmasını istiyor; metin hazırlanıp kopyalanıyor, "kaydet" ise
 * çağrıyı muhabirlerin ekranına düşürüyor.
 */
export function Cagri({ ben, tarih }: { ben: Kisi; tarih?: string }) {
  const { t, y, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const [hedef, setHedef] = useState(tarih ?? gunEkle(B, 1));
  const [edil, setEdil] = useState<Dil>("ar");
  const [sonSaat, setSonSaat] = useState("15:00");
  const sablon = (d: Dil, gun: string) => metin("cagriSablonu", d, { tarih: tarihYaz(gun, d, "tam") });
  const [govde, setGovde] = useState(sablon("ar", hedef));
  const yenile = (d: Dil, gun: string) => setGovde(sablon(d, gun));
  const alicilar = muhabirler(v);

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(govde);
      bildir(t("bKopyalandi"));
    } catch {
      bildir(t("kopyalanamadi"));
    }
  };
  const kaydet = () => {
    if (cagriKaydet(ben, { tarih: hedef, dil: edil, metin: govde, sonSaat })) bildir(t("bCagriKaydedildi"));
  };

  return (
    <>
      <a className="geri-bag" href="#/oneriler">
        <ArrowLeft size={14} className="yon" /> {t("mOneriler")}
      </a>
      <SayfaBasi ikon={<Megaphone size={26} />} baslik={t("oneriCagrisi")} alt={t("cagriAlt")} />
      <NotKutu ton="uyari" ikon={<FlaskConical size={16} />}>
        <b>{t("demo")}:</b> {t("cagriDemoNotu")}
      </NotKutu>
      <div className="iz iz-ana-yan">
        <Kart>
          <div className="form">
            <div className="satir">
              <label>
                {t("hedefPlan")}
                <input
                  type="date"
                  value={hedef}
                  min={B}
                  onChange={(e) => {
                    setHedef(e.target.value);
                    yenile(edil, e.target.value);
                  }}
                />
              </label>
              <label>
                {t("epostaDili")}
                <select
                  value={edil}
                  onChange={(e) => {
                    setEdil(e.target.value as Dil);
                    yenile(e.target.value as Dil, hedef);
                  }}
                >
                  {DILLER.map((d) => (
                    <option key={d} value={d}>
                      {metin("dilAdi", d)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("sonSaatGmt")}
                <input type="time" value={sonSaat} onChange={(e) => setSonSaat(e.target.value)} />
              </label>
            </div>
            <div className="eposta-kutu">
              <header>
                {t("alicilar")}: {t("muhabirSayisi", { n: alicilar.length })} · {t("konu")}: {metin("cagriKonu", edil, { tarih: tarihYaz(hedef, edil, "kisa") })}
              </header>
              <textarea className="girdi" dir={edil === "ar" ? "rtl" : "ltr"} lang={edil} value={govde} onChange={(e) => setGovde(e.target.value)} />
            </div>
            <div className="form-alt">
              <button className="dugme dugme-ikincil" onClick={kopyala}>
                <ClipboardCopy size={16} /> {t("metniKopyala")}
              </button>
              <button className="dugme" onClick={kaydet}>
                <Megaphone size={16} /> {t("cagriyiKaydet")}
              </button>
            </div>
          </div>
        </Kart>
        <Kart baslik={t("oncekiCagrilar")}>
          {v.cagrilar.length === 0 ? (
            <Bos kucuk metin={t("kayitYok")} />
          ) : (
            <ul className="liste">
              {[...v.cagrilar]
                .sort((a, b) => b.zaman.localeCompare(a.zaman))
                .map((c) => (
                  <li key={c.id}>
                    <div className="ad">
                      <b>{tarihYaz(c.tarih, dil, "tam")}</b>
                      <small>
                        {y(kisiBul(v, c.olusturan)?.ad ?? "")} · {tarihYaz(yerelGun(c.zaman), dil, "kisa")} {saatYaz(c.zaman, dil)} · {t("sonSaat")} {c.sonSaat}
                      </small>
                    </div>
                    <Rozet>{v.oneriler.filter((o) => o.cagriId === c.id).length}</Rozet>
                  </li>
                ))}
            </ul>
          )}
        </Kart>
      </div>
    </>
  );
}
