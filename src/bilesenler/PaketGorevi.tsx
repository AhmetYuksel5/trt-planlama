import { TarihGirdisi } from "./TarihSaat";
import { Check, ClipboardList, Hourglass, Send, Undo2, X } from "lucide-react";
import { useState } from "react";
import { AnmaGirdisi } from "./Anma";
import { Icerik, Kart, Pencere, Rozet, bildir, icerikAlani } from "./Parcalar";
import { metin, tarihYaz, useDil } from "../dil";
import { gorevTalebiGeriCek, gorevTalebiGonder, gorevTalebiKarar, paketDurum, paketGorevVer, paketReddet } from "../eylemler";
import { sartliBekleyen } from "../haftalik";
import { kisiBul, useVeri, type Bicim, type Kisi, type Paket } from "../veri";
import { birimAdi } from "../yapi";
import { bugun, gunFarki } from "../tarih";
import {
  gorevTalebiGeriCekebilir,
  yapabilir,
  gorevTalebiKarariVerebilir,
  gorevTalebiVerebilir,
  ileriGorevVerebilir,
  paketGorevVerebilir,
} from "../yetki";
import { BicimSecici, MuhabirSecici } from "../ekranlar/nextday/Formlar";

/*
 * Plansız paket görevi (kullanıcı): Planlama ve Newsdesk muhabire bir plana
 * eklemeden paket görevi veriyor (Newsdesk yalnız o güne); Ekonomi, Program,
 * Spor aynı formla talep ediyor, talep Planlama'nın onayıyla göreve dönüyor.
 * Paket stokta takip ediliyor. Düğme Paketler ve Stok sayfasında ve
 * muhabirin profilinde.
 */

export function GorevlendirDugmesi({ ben, muhabirId }: { ben: Kisi; muhabirId?: string }) {
  const { t } = useDil();
  const [acik, setAcik] = useState(false);
  const verir = paketGorevVerebilir(ben);
  if (!verir && !gorevTalebiVerebilir(ben)) return null;
  return (
    <>
      <button type="button" className="dugme" onClick={() => setAcik(true)} data-gorevlendir={verir ? "gorev" : "talep"}>
        <ClipboardList size={15} /> {t(verir ? "gvGorevlendir" : "gvTalepEt")}
      </button>
      {acik && <GorevPenceresi ben={ben} muhabirId={muhabirId} talep={!verir} kapat={() => setAcik(false)} />}
    </>
  );
}

function GorevPenceresi({ ben, muhabirId, talep, kapat }: { ben: Kisi; muhabirId?: string; talep: boolean; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  // Newsdesk yalnız o güne görev veriyor; Planlama ve talep eden ileri tarihe de.
  const ileri = talep || ileriGorevVerebilir(ben);
  const [f, setF] = useState({ muhabirId: muhabirId ?? "", baslik: "", aciklama: "", bicim: "pkg" as Bicim, tarih: B, not: "" });
  const hazir = !!kisiBul(v, f.muhabirId) && !!f.baslik.trim() && !!f.tarih && f.tarih >= B && (ileri || f.tarih === B);
  const gonder = () => {
    if (!hazir || !confirm(t("eminMisin"))) return;
    const id = talep ? gorevTalebiGonder(ben, f) : paketGorevVer(ben, f);
    if (id) {
      bildir(t(talep ? "gvTalepGitti" : "gvVerildi"));
      kapat();
    }
  };
  return (
    <Pencere
      baslik={t(talep ? "gvTalepEt" : "gvPencereBaslik")}
      kapat={kapat}
      altBilgi={
        <button className="dugme" aria-disabled={!hazir} onClick={gonder} data-gorev-gonder>
          <Send size={15} className="yon" /> {t("gonder")}
        </button>
      }
    >
      <div className="form" data-gorev-formu>
        <div className="satir">
          {!muhabirId && (
            <label>
              {t("muhabir")}
              <MuhabirSecici deger={f.muhabirId} degistir={(id) => setF({ ...f, muhabirId: id })} />
            </label>
          )}
          <label>
            {t("gvGun")}
            <TarihGirdisi value={f.tarih} min={B} max={ileri ? undefined : B} disabled={!ileri} onChange={(e) => setF({ ...f, tarih: e.target.value })} data-gorev-tarih />
          </label>
          <label>
            {t("haberTuru")}
            <BicimSecici deger={f.bicim} degistir={(b) => setF({ ...f, bicim: b })} />
          </label>
        </div>
        <label>
          {t("onerilenPaketBasligi")}
          <input {...icerikAlani} value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} placeholder={metin("haberBasligiIpucu", "ar")} data-gorev-baslik />
        </label>
        <label>
          {t("aciklama")}
          <textarea {...icerikAlani} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} placeholder={metin("gelismeIpucu", "ar")} data-gorev-aciklama />
        </label>
        <label>
          {t("not")}
          <AnmaGirdisi cokSatir rows={2} deger={f.not} degistir={(x) => setF({ ...f, not: x })} />
        </label>
      </div>
    </Pencere>
  );
}

/* Reddedilen talep talep edenin listesinde bir hafta kalıyor: gerekçesini görsün. */
const RED_GUNU = 7;

/**
 * Görev talepleri: Planlama bekleyenleri göreve çevirir ya da reddeder;
 * talep eden kendi taleplerini (bekleyen, son bir haftada reddedilen) görür.
 * Gösterecek bir şey yoksa çizilmez.
 */
export function GorevTalepleri({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  const liste = v.paketler
    .filter((p) => {
      if (!p.gorevTalebi || p.gorev) return false;
      if (p.durum === "taslak") return gorevTalebiKarariVerebilir(ben, p) || p.gorevTalebi.kisiId === ben.id;
      return !!p.gorevTalebi.red && p.gorevTalebi.kisiId === ben.id && gunFarki(p.gorevTalebi.red.zaman.slice(0, 10), B) <= RED_GUNU;
    })
    .sort((a, b) => (a.sonTarih ?? "").localeCompare(b.sonTarih ?? ""));
  if (!liste.length) return null;
  const bekleyen = liste.filter((p) => p.durum === "taslak").length;
  return (
    <Kart baslik={t("gvTalepler")} ikon={<ClipboardList size={18} />} ek={String(bekleyen)}>
      <ul className="liste" data-gorev-talepleri>
        {liste.map((p) => (
          <TalepSatiri key={p.id} ben={ben} p={p} />
        ))}
      </ul>
    </Kart>
  );
}

function TalepSatiri({ ben, p }: { ben: Kisi; p: Paket }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [tarih, setTarih] = useState(p.sonTarih && p.sonTarih >= bugun() ? p.sonTarih : bugun());
  const [red, setRed] = useState<string | null>(null);
  const karar = gorevTalebiKarariVerebilir(ben, p);
  const talep = p.gorevTalebi!;
  return (
    <li data-gorev-talebi={p.id}>
      <div className="ad">
        <a href={`#/paketler/${p.id}`}>
          <Icerik blok>{p.baslik}</Icerik>
        </a>
        <small>
          {/* Arapça ad ile tarih yan yana yön karıştırmasın. */}
          <bdi>{ad(kisiBul(v, p.muhabirId))}</bdi> · <bdi>{p.sonTarih && tarihYaz(p.sonTarih, dil, "kisa")}</bdi> · <bdi>{ad(kisiBul(v, talep.kisiId))}</bdi> ({birimAdi(talep.birim)})
          {talep.red?.gerekce && (
            <>
              {" "}
              · <span dir="auto">{talep.red.gerekce}</span>
            </>
          )}
        </small>
        {red !== null && (
          <div className="satir-form">
            <input className="girdi" dir="auto" value={red} onChange={(e) => setRed(e.target.value)} placeholder={t("gerekce")} aria-label={t("gerekce")} data-gorev-red-gerekce />
            <button className="dugme dugme-kucuk dugme-kotu" onClick={() => gorevTalebiKarar(ben, p.id, false, { gerekce: red }) && bildir(t("gvReddedildi"))} data-gorev-red-onay>
              <X size={14} /> {t("reddet")}
            </button>
          </div>
        )}
      </div>
      {p.durum === "iptal" ? (
        <Rozet ton="kotu">{t("gvReddedildi")}</Rozet>
      ) : karar ? (
        <>
          <TarihGirdisi className="girdi" value={tarih} min={bugun()} onChange={(e) => setTarih(e.target.value)} aria-label={t("gvGun")} />
          <button
            className="dugme dugme-kucuk dugme-iyi"
            onClick={() => confirm(t("eminMisin")) && gorevTalebiKarar(ben, p.id, true, { tarih }) && bildir(t("gvVerildi"))}
            data-gorev-onayla={p.id}
          >
            <Check size={14} /> {t("gvGoreveCevir")}
          </button>
          {red === null && (
            <button className="dugme dugme-kucuk dugme-ikincil" onClick={() => setRed("")} data-gorev-reddet={p.id}>
              <X size={14} /> {t("reddet")}
            </button>
          )}
        </>
      ) : (
        <>
          <Rozet ton="uyari">{t("gvOnayBekliyor")}</Rozet>
          {gorevTalebiGeriCekebilir(ben, p) && (
            <button className="dugme dugme-kucuk dugme-ikincil" onClick={() => confirm(t("eminMisin")) && gorevTalebiGeriCek(ben, p.id)} data-gorev-geri-cek={p.id}>
              <Undo2 size={14} /> {t("geriCek")}
            </button>
          )}
        </>
      )}
    </li>
  );
}

/** Paket sayfasında görev künyesi: kim verdi, hangi gün; talepten geldiyse talep eden. */
export function GorevKunyesi({ p }: { p: Paket }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  if (!p.gorev && !p.gorevTalebi) return null;
  return (
    <p className="rozetler" data-gorev-kunyesi>
      <Rozet ton="vurgu">{t(p.gorev ? "gvGorevRozeti" : "gvTalepEt")}</Rozet>
      {p.gorev && (
        <small>
          <bdi>{ad(kisiBul(v, p.gorev.veren))}</bdi>
        </small>
      )}
      {p.gorevTalebi && (
        <small>
          {t("gvTalepEden")}: <bdi>{ad(kisiBul(v, p.gorevTalebi.kisiId))}</bdi> ({birimAdi(p.gorevTalebi.birim)})
        </small>
      )}
      {p.sonTarih && <small>{t("gvGun")}: {tarihYaz(p.sonTarih, dil, "kisa")}</small>}
    </p>
  );
}

/*
 * Haftalık toplantıda şartlı kabul edilen paketler: koşul gerçekleşince
 * Planlama onaylıyor (görev muhabire o an), gerçekleşmezse reddediyor. Next
 * Day'e geçen de burada: plan onayı onu kendiliğinden kabul etmiyor.
 */
export function SartliPaketler({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  if (!yapabilir(ben, "paketDegerlendir")) return null;
  const liste = v.paketler.filter((p) => sartliBekleyen(p) && !p.ozelId).sort((a, b) => (a.sonTarih ?? "").localeCompare(b.sonTarih ?? ""));
  if (!liste.length) return null;
  return (
    <Kart baslik={t("sartliBekleyenler")} ikon={<Hourglass size={18} />} ek={String(liste.length)}>
      <ul className="liste" data-sartli-paketler>
        {liste.map((p) => {
          const plan = v.planlar.find((x) => x.id === p.planId);
          return (
            <li key={p.id} data-sartli-paket={p.id}>
              <div className="ad">
                <a href={`#/paketler/${p.id}`}>
                  <Icerik blok>{p.baslik}</Icerik>
                </a>
                <small>
                  <bdi>{ad(kisiBul(v, p.muhabirId))}</bdi>
                  {plan && (
                    <>
                      {" "}
                      · <bdi>{tarihYaz(plan.tarih, dil, "kisa")}</bdi>
                    </>
                  )}{" "}
                  · <span dir="auto">{p.kosul}</span>
                </small>
              </div>
              <button className="dugme dugme-kucuk dugme-iyi" onClick={() => confirm(t("paketKabulOnay")) && paketDurum(ben, p.id, "onaylandi")} data-sartli-kabul>
                <Check size={14} /> {t("kabulEt")}
              </button>
              <button className="dugme dugme-kucuk dugme-kotu" onClick={() => confirm(t("paketRetOnay")) && paketReddet(ben, p.id)} data-sartli-ret>
                <X size={14} /> {t("reddet")}
              </button>
            </li>
          );
        })}
      </ul>
    </Kart>
  );
}
