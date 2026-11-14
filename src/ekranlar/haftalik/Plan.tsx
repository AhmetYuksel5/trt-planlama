import { useSekmeAdi } from "../../sekmeAdi";
import { GeriBag } from "../../bilesenler/GeriBag";
import { haftaninOnerisi, oneriAraligi, oneriYeri } from "../../oneriPlanlari";
import { ArrowDown, ArrowUp, Binoculars, Check, CheckCheck, FilePen, Inbox, MailCheck, Megaphone, Pencil, Presentation, Printer, Send, Trash2, Undo2 } from "lucide-react";
import { PlanTakipleri, takipOnerileri } from "../Takipler";
import GeriAlDugmesi from "../../bilesenler/GeriAl";
import { IslemMenusu } from "../../bilesenler/IslemMenusu";
import { PlanBasiKalibi, adimlariKur } from "../../bilesenler/PlanBasi";
import { useState } from "react";
import { HareketGecmisi } from "../../bilesenler/Hareket";
import { Avatar, Bos, Icerik, Pencere, Rozet, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { aralikYaz, gunAdi, metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { HAFTA_DURUM_ADI, HAREKET_TURU_ADI } from "../../etiketler";
import {
  anaKonuKaydet,
  aylikOlayiGundemeEkle,
  anaKonuSil,
  anaKonuTasi,
  haftalikDurum,
  kalanlariKabulEt,
  oneriGundemeEkle,
  onIncelemeyeGonder,
} from "../../eylemler";
import { etiketUret } from "../../eposta";
import { gundemde, haftaGunleri, haftaSonu, haftaninDosyalari, kararBekleyenler, nextDayeGider, onIncelemeyeGidebilir, topluKabulAdaylari } from "../../haftalik";
import { bugun } from "../../tarih";
import { haftayaDusenler } from "../../aylik";
import { HAFTA_DURUMLARI, kisiBul, sahaGorevi, useVeri, type AnaKonu, type HaftalikKalem, type HaftalikPlan, type Kisi, type Oneri } from "../../veri";
import { haftalikDuzenler, kararVerebilir, planAdimiYapabilir, toplantiNotuGorur, yapabilir } from "../../yetki";
import { AdimYetkilileri } from "../organizasyon/PlanYetkileri";
import { Bolum, EkleDugmesi, IkonDugme } from "../nextday/Bolumler";
import { FormAlt } from "../nextday/Formlar";
import { YzKisalt } from "../../bilesenler/YzKisalt";
import { YzSonGelismeler } from "../../bilesenler/YzTakip";
import { ElleOneriFormu } from "../oneri/OneriFormu";
import { GorunumSecici, useOneriGorunumu, type PencereDurumu } from "../oneri/OneriKarti";
import { OneriListesi } from "../oneri/OneriGovde";
import { plandakiFaaliyetler } from "../../takvim";
import { TakvimdenListe } from "../takvim/Planlarda";
import { KalemFormu, KalemKarti } from "./Kalem";
import { GozdenGecirme } from "./GozdenGecirme";
import { HaftalikCiktiOnizleme } from "./Cikti";
import { HaftalikTakdirPenceresi } from "./Takdir";
import { haftalikTakdirKalemleri, kalemBildirimi } from "../../takdir";
import { ToplantiNotlari } from "./Toplanti";

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
  const [takipler, setTakipler] = useState(false);
  const bas = hafta.baslangic;
  useSekmeAdi(`${t("haftalik")} · ${aralikYaz(bas, haftaSonu(bas), dil)}`);
  const duzenler = haftalikDuzenler(ben, hafta);
  const bekleyen = kararBekleyenler(hafta).length;
  const topluKabul = topluKabulAdaylari(hafta).length;
  // Sonucu onay penceresinde sayıyla söylüyor; gündeme alınmamış öneriler için ayrıca soruyor.
  // Kesinleştirme gözden geçirme penceresinden: kararlar gruplu, değiştirilebilir, onay en altta.
  const [gozden, setGozden] = useState(false);
  const [onizleme, setOnizleme] = useState(false);
  const [takdir, setTakdir] = useState(false);
  const takdirKalemleri = haftalikTakdirKalemleri(hafta);
  const takdirBekleyen = takdirKalemleri.filter((k) => !kalemBildirimi(v, k)).length;
  const gundem = hafta.kalemler.filter(gundemde);
  const cagri = v.cagrilar.find((c) => c.etiket === etiketUret(bas, "haftalik"));
  // Günü geçmiş kalem artık aktarılmaz; yalnız bugün ve sonrası "bekliyor".
  const aktarimBekleyen = gundem.filter((k) => nextDayeGider(k) && !k.aktarim?.planId && k.tarih! >= bugun()).length;

  const durumDegistir = (yeni: "hazirlik" | "toplantida", mesaj: Anahtar) => haftalikDurum(ben, hafta.id, yeni) && bildir(t(mesaj));

  return (
    <>
      {/* Üst kısım Next Day'in kalıbıyla (bilesenler/PlanBasi): başlık, ↶ ⋯, "Sıradaki" kartı, künye ve takipler. */}
      <PlanBasiKalibi
        geri={
          <GeriBag ikon href="#/haftalik" metin={t("haftalikPlanlar")} />
        }
        baslik={`${t("mHaftalik")} · ${aralikYaz(bas, haftaSonu(bas), dil)}`}
        uc={
          <>
            {duzenler && <GeriAlDugmesi ben={ben} planId={hafta.id} />}
            <IslemMenusu etiket={t("digerIslemler")} dugmeSinifi="dugme dugme-ikincil dugme-ikon" menuSinifi="plan-menusu" katman>
              {(kararVerebilir(ben, hafta) || toplantiNotuGorur(ben)) && (
                <a role="menuitem" className="acilir-satir" href={`#/haftalik/${hafta.id}/toplanti`} data-arac="toplanti">
                  <Presentation size={16} /> {t("toplantiGorunumu")}
                </a>
              )}
              {/* Next Day'deki gibi önizleme penceresi: baskı tasarımı seçilir, tam sayfa ya da yazdır. */}
              <button type="button" role="menuitem" className="acilir-satir" onClick={() => setOnizleme(true)} data-arac="cikti">
                <Printer size={16} /> {t("ciktiOnizleme")}
              </button>
              {/* Kesinleşen haftanın kabul edilen paketleri: dilediğine görevlendirme postası. */}
              {takdirKalemleri.length > 0 && yapabilir(ben, "haftalikDuzenle") && (
                <button type="button" role="menuitem" className="acilir-satir" onClick={() => setTakdir(true)} data-arac="kabul-paketler">
                  <MailCheck size={16} /> {t("kabulEdilenPaketler")}
                  {takdirBekleyen > 0 && <em className="dugme-sayi">{takdirBekleyen}</em>}
                </button>
              )}
              {duzenler && (
                <a role="menuitem" className="acilir-satir" href={`#/haftalik/${hafta.id}/belge`} data-arac="belge">
                  <FilePen size={16} /> {t("belgedeDuzenle")}
                </a>
              )}
              {yapabilir(ben, "cagriHazirla") && hafta.durum === "hazirlik" && (
                <a role="menuitem" className="acilir-satir" href={`#/haftalik/${hafta.id}/cagri`} data-arac="cagri">
                  <Megaphone size={16} /> {t(cagri ? "haftalikCagriyiAc" : "haftalikCagri")}
                </a>
              )}
              {cagri && yapabilir(ben, "cagriHazirla") && (
                <a role="menuitem" className="acilir-satir" href={`#/oneriler/yanitlar/${cagri.id}`} data-arac="yanitlar">
                  <Inbox size={16} /> {t("gelenYanitlar")}
                </a>
              )}
            </IslemMenusu>
          </>
        }
        adimlar={adimlariKur(HAFTA_DURUMLARI, hafta.durum, (d) => ({ ad: t(d === "toplantida" ? "pdKisaToplanti" : HAFTA_DURUM_ADI[d]), ipucu: t(HAFTA_DURUM_ADI[d]) }))}
        metin={
          hafta.durum === "toplantida" && bekleyen > 0 ? (
            t("kesinlestirmeIcinKarar", { n: bekleyen })
          ) : hafta.durum === "toplantida" && duzenler && !planAdimiYapabilir(ben, "hfKesinlestir") ? (
            <>
              {t("kesinlestirmeYoneticide")} <AdimYetkilileri adim="hfKesinlestir" />
            </>
          ) : hafta.durum === "kesinlesti" && bekleyen > 0 ? (
            <span data-sonradan-bekleyen>{t("sonradanKararBekliyor", { n: bekleyen })}</span>
          ) : hafta.durum === "kesinlesti" && aktarimBekleyen > 0 ? (
            t("aktarimBekliyor", { n: aktarimBekleyen })
          ) : null
        }
        dugmeler={
          <>
            {hafta.durum === "hazirlik" && planAdimiYapabilir(ben, "hfToplanti") && (
              <button type="button" className="dugme dugme-yumusak" onClick={() => durumDegistir("toplantida", "bHaftalikToplantida")}>
                <Send size={16} className="yon" /> {t("haftalikToplantiyaGotur")}
              </button>
            )}
            {/* Toplantı sürerken asıl çalışma yeri toplantı görünümü (kalem kalem karar, not, klavye). */}
            {hafta.durum === "toplantida" && (kararVerebilir(ben, hafta) || toplantiNotuGorur(ben)) && (
              <a className="dugme dugme-yumusak" href={`#/haftalik/${hafta.id}/toplanti`} data-toplanti-ac>
                <Presentation size={16} /> {t("toplantiGorunumu")}
              </a>
            )}
            {hafta.durum === "toplantida" && planAdimiYapabilir(ben, "hfToplanti") && (
              <button type="button" className="dugme dugme-sade" onClick={() => durumDegistir("hazirlik", "bHazirligaAlindi")}>
                <Undo2 size={16} /> {t("hazirligaGeriAl")}
              </button>
            )}
            {hafta.durum === "toplantida" && kararVerebilir(ben, hafta) && topluKabul > 0 && (
              <button type="button" className="dugme dugme-yumusak" onClick={() => confirm(t("kalanlarKabulOnay", { n: topluKabul })) && kalanlariKabulEt(ben, hafta.id) && bildir(t("bKalanlarKabul"))}>
                <CheckCheck size={16} /> {t("kalanlariKabulEt", { n: topluKabul })}
              </button>
            )}
            {hafta.durum === "toplantida" && planAdimiYapabilir(ben, "hfKesinlestir") && (
              <button type="button" className="dugme" disabled={bekleyen > 0} onClick={() => setGozden(true)} data-gozden-ac>
                <Check size={16} /> {t("kesinlestir")}
              </button>
            )}
          </>
        }
        kunye={t("haftaOzetSatiri", { kalem: gundem.length, bekleyen, dosya: hafta.anaKonular.length })}
        araclar={
          duzenler && (
            <button type="button" className="dugme dugme-ikincil" onClick={() => setTakipler(true)} data-arac="takipler" title={t("mtAcikTakipler")}>
              <Binoculars size={16} /> {t("pbTakip")}
              {takipOnerileri(ben, v).length > 0 && <em className="dugme-sayi">{takipOnerileri(ben, v).length}</em>}
            </button>
          )
        }
      />

      {onizleme && <HaftalikCiktiOnizleme hafta={hafta} kapat={() => setOnizleme(false)} />}
      {takdir && <HaftalikTakdirPenceresi ben={ben} hafta={hafta} kapat={() => setTakdir(false)} />}
      {gozden && <GozdenGecirme ben={ben} hafta={hafta} kapat={() => setGozden(false)} />}
      {/* Muhabir takipleri gelen önerilerden ayrı pencerede; öneriye çevrilen haftanın ilk gününe düşer. */}
      {takipler && (
        <Pencere genis baslik={t("mtAcikTakipler")} alt={aralikYaz(bas, haftaSonu(bas), dil)} kapat={() => setTakipler(false)}>
          <PlanTakipleri ben={ben} />
        </Pencere>
      )}
      {duzenler && yapabilir(ben, "oneriDegerlendir") && <GelenOneriler ben={ben} hafta={hafta} />}
      <AyliktanBolumu ben={ben} hafta={hafta} ekleyebilir={duzenler} />
      <TakvimdenBolumu ben={ben} hafta={hafta} ekleyebilir={duzenler} />
      <MuhabirHareketleri hafta={hafta} />
      <AnaDosyalar ben={ben} hafta={hafta} />
      <GunlukGundem ben={ben} hafta={hafta} />
      <StokDosyasi ben={ben} hafta={hafta} />
      {toplantiNotuGorur(ben) && (hafta.durum !== "hazirlik" || (v.toplantiNotlari ?? []).some((n) => n.planId === hafta.id)) && (
        <Bolum no="✎" baslik={t("toplantiNotlari")} ek={String((v.toplantiNotlari ?? []).filter((n) => n.planId === hafta.id).length || "")}>
          <ToplantiNotlari ben={ben} planId={hafta.id} kartsiz />
        </Bolum>
      )}
      <Bolum no="↺" baslik={t("hareketGecmisi")}>
        <HareketGecmisi hareketler={v.hareketler.filter((h) => h.haftaId === hafta.id)} d={v} />
      </Bolum>
    </>
  );
}

/*
 * Aylık plandan bu haftaya düşen olaylar: kesin değil, gündeme alınınca
 * karar bekleyen kalem olur ve toplantıda yeniden değerlendirilir.
 */
function AyliktanBolumu({ ben, hafta, ekleyebilir }: { ben: Kisi; hafta: HaftalikPlan; ekleyebilir: boolean }) {
  const { t, dil } = useDil();
  const l = haftayaDusenler(useVeri(), hafta);
  if (!l.length) return null;
  return (
    <Bolum no="▤" baslik={t("ayAylikPlandan")} ek={String(l.length)}>
      <ul className="liste" data-aylik-plandan>
        {l.map(({ olay, gun, kalemId }) => (
          <li key={olay.id}>
            <div className="ad">
              <b>
                <Icerik blok>{[olay.yer, olay.baslik].filter(Boolean).join(" / ")}</Icerik>
              </b>
              <small>{olay.bitis && olay.bitis > olay.tarih ? aralikYaz(olay.tarih, olay.bitis, dil) : tarihYaz(olay.tarih, dil)}</small>
            </div>
            {kalemId ? (
              <Rozet ton="iyi">{t("ayGundemde")}</Rozet>
            ) : (
              ekleyebilir && (
                <button className="dugme dugme-ikincil dugme-kucuk" data-aylik-gundeme={olay.id} onClick={() => aylikOlayiGundemeEkle(ben, hafta.id, olay.id, gun) && bildir(t("bAyGundemeAlindi"))}>
                  {t("gundemeEkle")}
                </button>
              )
            )}
          </li>
        ))}
      </ul>
    </Bolum>
  );
}

/* Planlama takviminden bu haftaya düşenler; gündeme kalem olarak, editör ekleyince giriyor. */
function TakvimdenBolumu({ ben, hafta, ekleyebilir }: { ben: Kisi; hafta: HaftalikPlan; ekleyebilir: boolean }) {
  const { t } = useDil();
  const bit = haftaSonu(hafta.baslangic);
  const sayi = plandakiFaaliyetler(useVeri(), ben, hafta.baslangic, bit).length;
  if (!sayi) return null;
  return (
    <Bolum no="▦" baslik={t("takvimdenHafta")} ek={t("nFaaliyet", { n: sayi })}>
      <TakvimdenListe ben={ben} bas={hafta.baslangic} bit={bit} tur="haftalik" planId={hafta.id} ekleyebilir={ekleyebilir} eklemeMetni={t("gundemeEkle")} />
    </Bolum>
  );
}

/* --- Bu haftaya gelen öneriler: gündeme alınıyor ya da reddediliyor --- */

export function GundemeEkle({ ben, hafta, oneri, kapat }: { ben: Kisi; hafta: HaftalikPlan; oneri: Oneri; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  // Muhabirin söylediği gün hazır gelsin; değiştirmek Planlama'nın elinde.
  // Önerinin dosyası pasifse listede yok; seçici başka seçeneği gösterip kayıt görünmeyen dosyaya gitmesin.
  const dosya = oneri.baslikId && v.basliklar.some((b) => b.id === oneri.baslikId && b.aktif) ? oneri.baslikId : "";
  // Haftanın dosyaları ve önerinin kendi dosyası; havuzun bütün eski başlıkları değil.
  const haftanin = new Set([...haftaninDosyalari(hafta), dosya]);
  // Günü (aralığının ilk günü) bu haftadaysa gün hazır gelir; hafta önceden başladıysa haftanın ilk günü.
  const aralik = oneriAraligi(oneri);
  const gun = oneri.haftaGunu ?? (oneri.hedefTarih && aralik ? (aralik[0] >= hafta.baslangic ? aralik[0] : hafta.baslangic) : "");
  const [f, setF] = useState({ tarih: gun && gun <= haftaSonu(hafta.baslangic) ? gun : "", baslikId: dosya, yeniBaslik: "" });
  const kaydet = () => {
    if (!confirm(t("gundemeEkleOnay"))) return;
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
    <div className="form form-kutu ara-ust-2" data-gundeme-ekle-formu={oneri.id}>
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
          <select value={f.baslikId} onChange={(e) => setF({ ...f, baslikId: e.target.value })} data-ge-dosya>
            <option value="">{t("dosyasiz")}</option>
            {v.basliklar
              .filter((b) => haftanin.has(b.id))
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
  // Gündeme ya da Next Day'e giren öneri de listede kalıyor (en sonda, notuyla): ne geldiği ve ne olduğu bir arada.
  const sonda = (o: Oneri) => (oneriYeri(v, o) ? 2 : o.durum === "reddedildi" ? 1 : 0);
  const oneriler = v.oneriler
    .filter((o) => haftaninOnerisi(o, hafta))
    .sort((a, b) => sonda(a) - sonda(b) || b.zaman.localeCompare(a.zaman));
  const bekleyen = oneriler.filter((o) => !sonda(o)).length;
  return (
    <Bolum no="★" baslik={t("buHaftayaGelenOneriler")} ek={t("bekleyenSayisi", { n: bekleyen })}>
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

const YENI_BASLIK = "__yeni";

/*
 * Ana dosyanın başlığı havuzdaki hazır başlıklardan seçiliyor (önce bu
 * haftanın gündemindeki dosyalar), yoksa yeni başlık yazılıyor ve havuza
 * giriyor. Eski kayıttaki havuzda olmayan başlık yazısıyla "yeni"de gelir.
 */
export function AnaKonuFormu({ ben, hafta, mevcut, sonra, kapat }: { ben: Kisi; hafta: HaftalikPlan; mevcut?: AnaKonu; sonra?: string; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const ilk = mevcut?.baslikId ?? (mevcut && v.basliklar.find((b) => b.ad === mevcut.baslik)?.id);
  const [f, setF] = useState({ baslikId: ilk ?? (mevcut ? YENI_BASLIK : ""), yeniBaslik: ilk ? "" : (mevcut?.baslik ?? ""), metin: mevcut?.metin ?? "" });
  const yeni = f.baslikId === YENI_BASLIK;
  // Yalnız bu haftanın dosyaları (haftaya eklenenler, gündemdekiler); hafta boş başlıyor.
  const haftanin = new Set([...haftaninDosyalari(hafta), f.baslikId]);
  const secilebilir = v.basliklar.filter((b) => haftanin.has(b.id));
  // Bu haftanın ana dosyası olan başlık ikinci kez seçilmesin (kendisi hariç).
  const kullanilan = new Set(hafta.anaKonular.filter((a) => a.id !== mevcut?.id).map((a) => a.baslikId));
  const secenek = (b: { id: string; ad: string }) => (
    <option key={b.id} value={b.id} disabled={kullanilan.has(b.id)}>
      {b.ad}
    </option>
  );
  const kaydet = () =>
    anaKonuKaydet(ben, hafta.id, { id: mevcut?.id, ...(yeni ? { yeniBaslik: f.yeniBaslik } : { baslikId: f.baslikId }), metin: f.metin }, sonra) && kapat();
  return (
    <div className="form form-kutu ara-ust-2" data-ana-konu-formu>
      <label>
        {t("dosyaBasligi")}
        <select value={f.baslikId} onChange={(e) => setF({ ...f, baslikId: e.target.value })} data-ana-konu-baslik>
          <option value="" disabled>
            {t("seciniz")}
          </option>
          {secilebilir.length > 0 && <optgroup label={t("buHaftaninDosyalari")}>{secilebilir.map(secenek)}</optgroup>}
          {yapabilir(ben, "baslikYonet") && <option value={YENI_BASLIK}>+ {t("yeniBaslik")}</option>}
        </select>
      </label>
      {yeni && (
        <label>
          {t("yeniBaslik")}
          <input {...icerikAlani} value={f.yeniBaslik} onChange={(e) => setF({ ...f, yeniBaslik: e.target.value })} placeholder={metin("anaDosyaIpucu", "ar")} data-ana-konu-yeni />
        </label>
      )}
      <label>
        {t("durumOzeti")}
        <textarea {...icerikAlani} rows={4} value={f.metin} onChange={(e) => setF({ ...f, metin: e.target.value })} />
      </label>
      <YzKisalt metin={f.metin} degistir={(m) => setF((x) => ({ ...x, metin: m }))} />
      {/* Durum özeti çoğu zaman dosyanın son gelişmeleri: yapay zeka arayıp yazıyor, producer düzeltip kaydediyor. */}
      <YzSonGelismeler
        baslik={yeni ? f.yeniBaslik : (v.basliklar.find((b) => b.id === f.baslikId)?.ad ?? "")}
        baslikId={yeni ? undefined : f.baslikId}
        ekleMetni={t("yzFormaYaz")}
        ekle={(s) => setF((x) => ({ ...x, metin: s.metin }))}
      />
      <FormAlt kapat={kapat} kaydet={kaydet} devre={yeni ? !f.yeniBaslik.trim() : !f.baslikId} />
    </div>
  );
}

function AnaDosyalar({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t } = useDil();
  const [form, setForm] = useState<string | null>(null);
  const duzenler = haftalikDuzenler(ben, hafta);
  return (
    <Bolum no={2} baslik={t("haftaninAnaDosyalari")} ek={String(hafta.anaKonular.length)}>
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
