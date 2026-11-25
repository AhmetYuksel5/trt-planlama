import { haftaSurukleKabi, haftaSuruklenir, hfYer } from "../haftalik/haftaSurukle";
import { Ban, CalendarClock, Check, Eye, Hourglass, MessageSquarePlus, Package, Printer, Send } from "lucide-react";
import GeriAlDugmesi from "../../bilesenler/GeriAl";
import { createContext, useContext, useRef, useState, type ReactNode, type Ref } from "react";
import { Gorusler, KalemTeslimGunu, KararRozeti, bicimSatiri, kalemMasaEtiketi, kalemPaketli, kalemPkgEtiketi } from "../../bilesenler/Haftalik";
import trtArabi from "../../varliklar/trt-arabi.svg";
import trtArabiBeyaz from "../../varliklar/trt-arabi-beyaz.svg";
import type { Baski } from "./Baski";
import { Pencere, bildir } from "../../bilesenler/Parcalar";
import { aralikYaz, ciktiGunu, metin, sureYaz, useDil, type Anahtar } from "../../dil";
import { HAREKET_TURU_ADI, TBC, kisiAr, muhabirUnvani, muhabirYeri, paketYeri, sehirAr } from "../../etiketler";
import { vardiyaYaz } from "../../tarih";
import { anaKonuKaydet, anaKonuSil, anaKonuTasi, baslikDuzenle, kalemKarar, kalemKaydet, kalemSil, kalemTasi, onIncelemeyeGonder, type KalemGirdisi } from "../../eylemler";
import { ciktida, gundemde, haftaGunleri, kalemKilitli, haftaSonu, onIncelemeyeGidebilir } from "../../haftalik";
import { baslikBul, kisiBul, ozelIcerikMi, sahaGorevi, useVeri, type AnaKonu, type HaftalikKalem, type HaftalikPlan, type Karar, type Kisi } from "../../veri";
import { haftalikDuzenler, kararNotuYazabilir, kararVerebilir, yapabilir } from "../../yetki";
import { KalemFormu, KararNotuFormu, KosulFormu, kalemGirdisi } from "../haftalik/Kalem";
import { AnaKonuFormu } from "../haftalik/Plan";
import { IkonDugme } from "../nextday/Bolumler";
import { YzKisaltSerit } from "../../bilesenler/YzKisalt";
import { KararNotlari } from "../haftalik/Kalem";
import { KalemPostaDugmesi } from "../haftalik/Takdir";
import { GunCanliNafize, GunEkleDugmeleri, gunCanlilari, gunNafizeleri } from "../haftalik/CanliNafize";
import { BelgeSatiri, CiktiAraclari, EkleCubugu, EkleDugmesi, SatirSeridi, YerindeMetin, onayla } from "./Parcalar";

/**
 * Haftalık planın belgesi (الأجندة الأسبوعية): kurumun Word belgesinin
 * bölümleri ve sırası. تحركات المراسلين, أهم ملفات الأسبوع, الأجندة اليومية
 * (gün gün; dosya başlıkları altında "YER / metin", olayın adı varsa
 * "YER - OLAY / metin", muhabirler "isim / şehir", biçim satırı, sarı not),
 * زمانا غير مرتبطة.
 *
 * Kesinleşen planın çıktısında yalnız kabul ve bilgi kalemleri basılıyor;
 * kesinleşmeden önizleme karar bekleyenleri de basıyor, yoksa hazırlıkta
 * yapılan iş önizlemede hiç görünmüyordu. Yalnız kalemi olan günler görünüyor. Belgede yedi günün hepsi ve karar bekleyen kalemler de
 * var (soluk): plan hazırlıkta bütün kalemler bekliyor, kağıt boş kalmasın,
 * toplantı kararı belgenin üzerinde verilebilsin. Reddedilen kalem ikisinde
 * de yok.
 */

export type HfPencere = { tur: "anaKonu"; mevcut?: AnaKonu; sonra?: string } | { tur: "kalem"; mevcut?: HaftalikKalem; tarih?: string; dosya?: string; sonra?: string; pkg?: boolean };

export interface HfDuzen {
  ben: Kisi;
  /** Toplantıdaysa şeritte karar düğmeleri. */
  karar: boolean;
  ac: (p: HfPencere) => void;
}

const c = (k: Anahtar, p?: Record<string, string | number>) => metin(k, "ar", p);

/*
 * "YER / metin" satırı; olayın adı yazılmışsa "YER - OLAY / metin" (kurumun
 * yazımı). Render dışında ki yazı kutusu her kayıtta sıfırlanmasın.
 */
function Satir({ yer, olay, children }: { yer?: ReactNode; olay?: ReactNode; children: ReactNode }) {
  return (
    <p>
      {(yer || olay) && (
        <b>
          {yer}
          {yer && olay && " - "}
          {olay} /{" "}
        </b>
      )}
      {children}
    </p>
  );
}


const KARARLAR: { karar: Karar; ad: Anahtar; ikon: ReactNode }[] = [
  { karar: "kabul", ad: "krKabul", ikon: <Check size={15} /> },
  { karar: "sartli", ad: "krSartli", ikon: <Hourglass size={15} /> },
  { karar: "bilgi", ad: "krBilgi", ikon: <Eye size={15} /> },
  { karar: "ret", ad: "krRet", ikon: <Ban size={15} /> },
  { karar: "nextday", ad: "krNextday", ikon: <CalendarClock size={15} /> },
];

/** Bir kalem: "YER - OLAY / metin", muhabirler, biçim, not; bilgi kaleminde "(لا نتابع)". */
/*
 * Toplantı görünümü belgenin tamamını okur (kullanıcı: planlamacı toplantıyı
 * metnin bütününden, ana dosyalar dahil takip etsin); kalem tıklanınca seçilir,
 * kararı yan panelde verilir. Belge içinden Dosyalar'a geçirmemek için bağlam.
 */
export const ToplantiSecimi = createContext<{ secili?: string; sec: (id: string) => void } | null>(null);

function Kalem({ k, hafta, duzen: d, ilk, son }: { k: HaftalikKalem; hafta: HaftalikPlan; duzen?: HfDuzen; ilk: boolean; son: boolean }) {
  const { t } = useDil();
  // Kesinleşmiş haftada Next Day'e ya da pakete geçmiş kalem çıktı gibi, düzenlenmez.
  const duzen = d && !kalemKilitli(hafta, k) ? d : undefined;
  const v = useVeri();
  const kisiAdi = (id?: string) => kisiAr(kisiBul(v, id));
  const ben = duzen?.ben;
  const yaz = (g: Partial<KalemGirdisi>) => ben && kalemKaydet(ben, hafta.id, kalemGirdisi(k, g));
  // Şartlı kabulün koşulu çıktıda sarı notta: toplantının kararı kağıtta da "henüz kesin değil" görünsün.
  const notlar = [k.karar === "sartli" && k.kosul ? `${c("mesrut")} ${k.kosul}` : "", k.not ?? ""].filter(Boolean);
  const bekliyor = k.karar === "bekliyor";
  const ts = useContext(ToplantiSecimi);
  const [kosulAcik, setKosulAcik] = useState(false);
  const [notAcik, setNotAcik] = useState(false);
  // Karar notu ve ek talep kesinleşmiş (kilitli) kalemde de yazılıyor; plan ekranının kartıyla aynı kural.
  const notYazar = !!d?.ben && kararNotuYazabilir(d.ben, hafta) && gundemde(k);

  return (
    <BelgeSatiri
      duzen={!!duzen}
      soluk={bekliyor && !ts}
      ozellik={haftaSuruklenir("kalem", k.id, !!duzen && !!ben)}
      serit={
        !duzen && d?.ben && notYazar ? (
          <SatirSeridi ek={<IkonDugme ikon={<MessageSquarePlus size={15} />} etiket={t("kararNotuEkTalep")} onClick={() => setNotAcik(true)} />} />
        ) : (
        duzen &&
        ben && (
          <SatirSeridi
            yukari={ilk ? undefined : () => kalemTasi(ben, hafta.id, k.id, -1)}
            asagi={son ? undefined : () => kalemTasi(ben, hafta.id, k.id, 1)}
            ekle={() => duzen.ac({ tur: "kalem", tarih: k.tarih ?? "", dosya: k.baslikId, sonra: k.id })}
            ekleEtiket={t("kalemEkle")}
            duzenle={() => duzen.ac({ tur: "kalem", mevcut: k })}
            ek={
              <>
                <YzKisaltSerit metin={k.metin} kaydet={(m) => yaz({ metin: m })} />
                <KararRozeti kalem={k} />
                {duzen.karar &&
                  KARARLAR.map((x) => (
                    <IkonDugme
                      key={x.karar}
                      ikon={x.ikon}
                      etiket={t(x.ad)}
                      ton={k.karar === x.karar ? "secili" : ""}
                      // Seçili karara yeniden basmak kararı kaldırır (plan ekranındaki gibi); şartlı kabul önce koşulun formu.
                      onClick={() => (k.karar === x.karar ? kalemKarar(ben, hafta.id, k.id, "bekliyor") : x.karar === "sartli" ? setKosulAcik(true) : kalemKarar(ben, hafta.id, k.id, x.karar))}
                    />
                  ))}
                {onIncelemeyeGidebilir(k) && (
                  <IkonDugme ikon={<Send size={15} className="yon" />} etiket={t("onIncelemeyeGonder")} onClick={() => onIncelemeyeGonder(ben, hafta.id, [k.id]) && bildir(t("bOnIncelemeyeGitti", { n: 1 }))} />
                )}
                {notYazar && <IkonDugme ikon={<MessageSquarePlus size={15} />} etiket={t("kararNotuEkTalep")} onClick={() => setNotAcik(true)} />}
              </>
            }
            cikar={onayla(t("silinsinMi"), () => kalemSil(ben, hafta.id, k.id))}
          />
        )
        )
      }
    >
      <div
        className={`cikti-kalem${ts ? " toplanti-kalem" : ""}${ts?.secili === k.id ? " secili" : ""}`}
        {...(ts && {
          "data-toplanti-kalem": k.id,
          "data-karar": k.karar,
          role: "button",
          tabIndex: 0,
          "aria-current": ts.secili === k.id || undefined,
          onClick: () => ts.sec(k.id),
          onKeyDown: (e: React.KeyboardEvent) => e.key === "Enter" && ts.sec(k.id),
        })}
      >
        {/* Kesinleşen haftada kabul edilen paketin görevlendirme postası satırın solunda. */}
        {ts && hafta.durum === "kesinlesti" && <KalemPostaDugmesi hafta={hafta} kalem={k} />}
        {kalemMasaEtiketi(k, v) && (
          <p className="alt-baslik" data-kalem-masa>
            {kalemMasaEtiketi(k, v)}
          </p>
        )}
        {/* Yalnız PKG'si olan kalem (dosyanın ek paketi) metin satırı çizmez. */}
        {!k.metin.trim() && !k.baslik ? null : duzen ? (
          <Satir
            yer={k.yer && <YerindeMetin acik deger={k.yer} etiket={t("yer")} kaydet={(x) => yaz({ yer: x })} />}
            olay={k.baslik && <YerindeMetin acik deger={k.baslik} etiket={t("olayAdi")} kaydet={(x) => yaz({ baslik: x })} />}
          >
            <YerindeMetin acik cokSatir deger={k.metin} etiket={t("metin")} kaydet={(x) => x && yaz({ metin: x })} />
          </Satir>
        ) : (
          <Satir yer={k.yer} olay={k.baslik}>
            {k.metin}
          </Satir>
        )}
        {/*
          Muhabirler Next Day'deki gibi (kullanıcı: ikinci muhabir satırın yanına
          yazılıyordu): pakette tek muhabir "YER / strap / ad"; birden çoksa paket
          satırı "YER / strap", altında unvan (المراسلون) ve her muhabir "YER / ad".
        */}
        {kalemPaketli(k) && (
          <>
            <p className="alt-baslik" data-kalem-pkg-etiketi>
              <bdi>{kalemPkgEtiketi(k)}</bdi>
            </p>
            <p data-kalem-pkg>
              {k.yer || sehirAr(kisiBul(v, k.muhabirler[0])?.sehir)} / {k.paketBasligi}
              {k.muhabirler.length < 2 && (
                <>
                  {" / "}
                  <b>{muhabirYeri(k.muhabirler.map(kisiAdi), k.muhabirTbc)}</b>
                </>
              )}
            </p>
          </>
        )}
        {!kalemPaketli(k) && !k.muhabirler.length && k.muhabirTbc ? (
          <>
            <p className="alt-baslik">{c("ciktiMuhabir")}</p>
            <p data-tbc-satir>{TBC}</p>
          </>
        ) : (
          k.muhabirler.length > (kalemPaketli(k) ? 1 : 0) && (
            <>
              <p className="alt-baslik" data-kalem-muhabir-unvani>
                {muhabirUnvani(k.muhabirler.map((id) => kisiBul(v, id)))}
              </p>
              {k.muhabirler.map((id) => (
                <Satir key={id} yer={sehirAr(kisiBul(v, id)?.sehir)}>
                  {kisiAdi(id)}
                </Satir>
              ))}
            </>
          )
        )}
        {bicimSatiri(k) && (
          <p>
            <b>
              <bdi>{bicimSatiri(k)}</bdi>
            </b>
          </p>
        )}
        {/* Boş not satır kaplamıyor (Next Day belgesi gibi); not "Düzenle" penceresinden giriliyor. */}
        {duzen && k.not ? (
          <p>
            {k.karar === "sartli" && k.kosul && <mark>{`${c("mesrut")} ${k.kosul}`}</mark>}{" "}
            <mark>
              <YerindeMetin acik deger={k.not} etiket={t("kalemNotu")} kaydet={(x) => yaz({ not: x })} />
            </mark>
          </p>
        ) : (
          notlar.length > 0 && (
            <p>
              <mark>{notlar.join(" ")}</mark>
            </p>
          )
        )}
        {/* Toplantının karar notu ve ek talebi kurumun çıktısında yok; yalnız düzenlerken ekranda. */}
        {(duzen || ts) && <KararNotlari kalem={k} />}
        {/* Ön inceleme görüşleri ve teslim günü plan ekranının kartında da; çıktıda yok. */}
        {duzen && (
          <>
            <Gorusler kalem={k} d={v} />
            <KalemTeslimGunu kalem={k} />
          </>
        )}
        {ts && (
          <p className="toplanti-karar-satiri">
            <KararRozeti kalem={k} />
          </p>
        )}
      </div>
      {notAcik && d?.ben && (
        <Pencere baslik={t("kararNotuEkTalep")} kapat={() => setNotAcik(false)}>
          <KararNotuFormu ben={d.ben} hafta={hafta} kalem={k} kapat={() => setNotAcik(false)} />
        </Pencere>
      )}
      {kosulAcik && ben && (
        <Pencere baslik={t("krSartli")} kapat={() => setKosulAcik(false)}>
          <KosulFormu ben={ben} hafta={hafta} kalem={k} kapat={() => setKosulAcik(false)} />
        </Pencere>
      )}
    </BelgeSatiri>
  );
}

/*
 * Dosyalar kalemin dizideki ilk görünüşüne göre sıralı. Dosyasız kalemler
 * bölümün (günün, zamana bağlı olmayanların) en altında yeşil "متابعات"
 * başlığının altında, Next Day'in sonundaki متابعات gibi.
 */
function Dosyalar({ liste, hafta, duzen, tarih }: { liste: HaftalikKalem[]; hafta: HaftalikPlan; duzen?: HfDuzen; tarih: string }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = duzen?.ben;
  const gruplar = new Map<string, HaftalikKalem[]>();
  for (const k of liste) gruplar.set(k.baslikId ?? "", [...(gruplar.get(k.baslikId ?? "") ?? []), k]);
  const sirali = [...gruplar.entries()].sort(([a], [b]) => Number(!a) - Number(!b));
  return (
    <>
      {sirali.map(([baslikId, ks]) => {
        const ad = baslikId ? (baslikBul(v, baslikId)?.ad ?? "") : "";
        return (
          <div key={baslikId || "-"} className="cikti-baslik" {...hfYer(tarih, baslikId)}>
            {baslikId && (
              <BelgeSatiri
                duzen={!!duzen}
                serit={
                  duzen && (
                    <SatirSeridi
                      ekle={() => duzen.ac({ tur: "kalem", tarih: ks[0].tarih ?? "", dosya: baslikId, sonra: ks[ks.length - 1].id })}
                      ekleEtiket={t("kalemEkle")}
                      ek={
                        <span data-dosya-pkg-ekle>
                          <IkonDugme ikon={<Package size={15} />} etiket={t("dosyayaPkgEkle")} onClick={() => duzen.ac({ tur: "kalem", tarih: ks[0].tarih ?? "", dosya: baslikId, sonra: ks[ks.length - 1].id, pkg: true })} />
                        </span>
                      }
                    />
                  )
                }
              >
                <h3>{ben && yapabilir(ben, "baslikYonet") ? <YerindeMetin acik deger={ad} etiket={t("dosya")} kaydet={(x) => x && baslikDuzenle(ben, baslikId, { ad: x })} /> : ad}</h3>
              </BelgeSatiri>
            )}
            {!baslikId && <h3 className="yesil">{c("takipler")}</h3>}
            {ks.map((k, i) => (
              <Kalem key={k.id} k={k} hafta={hafta} duzen={duzen} ilk={i === 0} son={i === ks.length - 1} />
            ))}
          </div>
        );
      })}
    </>
  );
}

// baski: Next Day'in baskı tasarımları (belge/Baski.tsx); verilmezse kurumun düzeni.
/*
 * Haftaya düşen özel yayınlar (kullanıcı: özel yayın içerikleri haftalığa da
 * eklensin). Karar kalemi değil: içerik ve nafize özel yayında görevlendirildi,
 * toplantıda yeniden karar beklemesin. Salt okunur, kayıttan: yayın yayın, gün
 * gün nafizeler (LIVE, "YER / konu / saat") ve içerikler (PKG, "YER / strap /
 * muhabir"). Belge, çıktı ve toplantı görünümü aynı bölümü çizer.
 */
export function HaftaOzelBolumu({ bas, bit }: { bas: string; bit: string }) {
  const v = useVeri();
  const icerik = v.paketler.filter((p) => ozelIcerikMi(p) && p.durum !== "iptal" && !!p.yayinGunu && p.yayinGunu >= bas && p.yayinGunu <= bit);
  const canli = v.canliYayinlar.filter((x) => x.ozelId && x.tarih >= bas && x.tarih <= bit);
  const yayinlar = v.ozel.filter((o) => icerik.some((p) => p.ozelId === o.id) || canli.some((x) => x.ozelId === o.id)).sort((a, b) => a.tarih.localeCompare(b.tarih));
  if (!yayinlar.length) return null;
  return (
    <section data-bolum="ozel" data-hafta-ozel>
      <h2 className="kirmizi ortali">{c("hfOzelYayinlar")}</h2>
      {yayinlar.map((o) => {
        const gunler = [...new Set([...icerik.filter((p) => p.ozelId === o.id).map((p) => p.yayinGunu!), ...canli.filter((x) => x.ozelId === o.id).map((x) => x.tarih)])].sort();
        return (
          <div key={o.id} className="cikti-baslik" data-hafta-ozel-yayin={o.id}>
            <h3>{o.ad}</h3>
            {gunler.map((g) => {
              const n = canli.filter((x) => x.ozelId === o.id && x.tarih === g).sort((a, b) => (a.saatGmt || "99").localeCompare(b.saatGmt || "99"));
              const pk = icerik.filter((p) => p.ozelId === o.id && p.yayinGunu === g);
              return (
                <div key={g}>
                  <h4 className="gun">{ciktiGunu(g, "ar")}</h4>
                  {n.length > 0 && <p className="alt-baslik">LIVE</p>}
                  {n.map((x) => (
                    <Satir key={x.id} yer={x.yer}>
                      {x.konu} / <b>{x.saatGmt ? vardiyaYaz(x.saatGmt) : TBC}</b>
                    </Satir>
                  ))}
                  {pk.length > 0 && <p className="alt-baslik">PKG</p>}
                  {pk.map((p) => (
                    <Satir key={p.id} yer={paketYeri(p)}>
                      {p.baslik} / {muhabirYeri([kisiAr(kisiBul(v, p.muhabirId))], !p.muhabirId)}
                    </Satir>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}

export function HaftalikBelgesi({
  hafta,
  duzen,
  belgeRef,
  baski,
  toplanti,
}: {
  hafta: HaftalikPlan;
  duzen?: HfDuzen;
  belgeRef?: Ref<HTMLElement>;
  baski?: Baski;
  toplanti?: { secili?: string; sec: (id: string) => void };
}) {
  const { t } = useDil();
  const v = useVeri();
  const ben = duzen?.ben;
  const bas = hafta.baslangic;
  const bit = haftaSonu(bas);
  const kisiAdi = (id?: string) => kisiAr(kisiBul(v, id));

  const hareketler = v.gorevlendirmeler
    .filter((g) => sahaGorevi(g) && g.baslangic <= bit && g.bitis >= bas && g.durum !== "talep")
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  /* Aynı yere aynı süreyle giden ekip tek satırda, kurumun belgesindeki gibi: "YER / ad - ad - ad في مهمة حتى …". */
  const hareketSatirlari = [...hareketler.reduce((m, g) => m.set(`${g.yer}|${g.tur}|${g.baslangic}|${g.bitis}`, [...(m.get(`${g.yer}|${g.tur}|${g.baslangic}|${g.bitis}`) ?? []), g]), new Map<string, typeof hareketler>()).values()];
  // Toplantıda reddedilen de görünür: karar geri alınabilsin.
  const kalemler = toplanti ? hafta.kalemler.filter(gundemde) : duzen || hafta.durum !== "kesinlesti" ? hafta.kalemler.filter((k) => gundemde(k) && k.karar !== "ret") : hafta.kalemler.filter(ciktida);
  const gunler = duzen ? haftaGunleri(bas) : haftaGunleri(bas).filter((g) => kalemler.some((k) => k.tarih === g) || gunCanlilari(hafta, g).length || gunNafizeleri(hafta, g).length);
  const stok = kalemler.filter((k) => !k.tarih);

  const hareketBolumu = (
    <>
      {hareketSatirlari.length > 0 && (
        <section data-bolum="hareket">
          <h2 className="yesil">{c("ciktiHareketler")}</h2>
          {hareketSatirlari.map((grup) => {
            const g = grup[0];
            return (
              <Satir key={g.id} yer={g.yer}>
                {grup.map((x) => kisiAdi(x.kisiId)).join(" - ")} / {metin(HAREKET_TURU_ADI[g.tur], "ar")} / {sureYaz(g.baslangic, g.bitis, "ar")}
              </Satir>
            );
          })}
        </section>
      )}
    </>
  );
  const anaBolum = (
    <>
      {(hafta.anaKonular.length > 0 || duzen) && (
        <section data-bolum="ana">
          <h2 className="kirmizi ortali">{c("haftaninAnaDosyalari")}</h2>
          {hafta.anaKonular.map((a, i) => (
            <div key={a.id} className="cikti-baslik">
              <BelgeSatiri
                duzen={!!duzen}
                ozellik={haftaSuruklenir("ana", a.id, !!duzen && !!ben)}
                serit={
                  duzen &&
                  ben && (
                    <SatirSeridi
                      yukari={i > 0 ? () => anaKonuTasi(ben, hafta.id, a.id, -1) : undefined}
                      asagi={i < hafta.anaKonular.length - 1 ? () => anaKonuTasi(ben, hafta.id, a.id, 1) : undefined}
                      ekle={() => duzen.ac({ tur: "anaKonu", sonra: a.id })}
                      ekleEtiket={t("anaDosyaEkle")}
                      duzenle={() => duzen.ac({ tur: "anaKonu", mevcut: a })}
                      ek={<YzKisaltSerit metin={a.metin} kaydet={(m) => anaKonuKaydet(ben, hafta.id, { id: a.id, metin: m })} />}
                      cikar={onayla(t("silinsinMi"), () => anaKonuSil(ben, hafta.id, a.id))}
                    />
                  )
                }
              >
                {/* Başlık havuzdan seçiliyor: yazıyla değil, şeritteki "Düzenle" penceresinden. */}
                <h3>{a.baslik}</h3>
                {ben ? (
                  <p>
                    <YerindeMetin acik cokSatir deger={a.metin} etiket={t("durumOzeti")} kaydet={(x) => anaKonuKaydet(ben, hafta.id, { id: a.id, metin: x })} />
                  </p>
                ) : (
                  a.metin && <p>{a.metin}</p>
                )}
              </BelgeSatiri>
            </div>
          ))}
          {duzen && (
            <EkleCubugu>
              <EkleDugmesi metin={t("anaDosyaEkle")} onClick={() => duzen.ac({ tur: "anaKonu", sonra: hafta.anaKonular.at(-1)?.id })} />
            </EkleCubugu>
          )}
        </section>
      )}
    </>
  );
  const gunlukBolum = (
    <>
      {gunler.length > 0 && (
        <section>
          <h2 className="kirmizi ortali">{c("gunlukGundem")}</h2>
          {gunler.map((g) => (
            <div key={g} className="cikti-gun" {...hfYer(g)}>
              <h4 className="gun">{ciktiGunu(g, "ar")}</h4>
              <Dosyalar liste={kalemler.filter((k) => k.tarih === g)} hafta={hafta} duzen={duzen} tarih={g} />
              <GunCanliNafize h={hafta} tarih={g} duzen={!!duzen} />
              {duzen && (
                <EkleCubugu>
                  <EkleDugmesi metin={t("kalemEkle")} onClick={() => duzen.ac({ tur: "kalem", tarih: g })} />
                  <GunEkleDugmeleri h={hafta} tarih={g} />
                </EkleCubugu>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  );
  const stokBolum = (
    <>
      {(stok.length > 0 || duzen) && (
        <section {...hfYer("")}>
          <h2 className="yesil">{c("stokVeProgramlar")}</h2>
          <Dosyalar liste={stok} hafta={hafta} duzen={duzen} tarih="" />
          {duzen && (
            <EkleCubugu>
              <EkleDugmesi metin={t("kalemEkle")} onClick={() => duzen.ac({ tur: "kalem", tarih: "" })} />
            </EkleCubugu>
          )}
        </section>
      )}
    </>
  );

  return (
    <ToplantiSecimi.Provider value={toplanti ?? null}>
    <article className={`cikti hf${baski ? ` baski-${baski}` : ""}${toplanti ? " toplanti-belgesi" : ""}`} ref={belgeRef} dir="rtl" lang="ar" {...(duzen?.ben ? haftaSurukleKabi(duzen.ben, hafta) : {})}>
      {baski && baski !== 2 && (
        <div className="baski-logo">
          <img src={trtArabi} alt="TRT عربي" />
        </div>
      )}
      {baski === 2 ? (
        <HaftaManset hafta={hafta} kalemler={kalemler} />
      ) : (
        <h1>
          {c("haftalikCiktiBaslik")} {aralikYaz(bas, bit, "ar")}
        </h1>
      )}
      {/* 2. tasarımda Next Day'deki gibi iki sütun: sağda hareketler ve zamana bağlı olmayanlar, solda dosyalar ve günler. */}
      {baski === 2 ? (
        <div className="nd-sutunlar">
          <div className="nd-ana">
            {anaBolum}
            {gunlukBolum}
            <HaftaOzelBolumu bas={bas} bit={bit} />
          </div>
          <div className="nd-yan">
            {hareketBolumu}
            {stokBolum}
          </div>
        </div>
      ) : (
        <>
          {hareketBolumu}
          {anaBolum}
          {gunlukBolum}
          <HaftaOzelBolumu bas={bas} bit={bit} />
          {stokBolum}
        </>
      )}
    </article>
    </ToplantiSecimi.Provider>
  );
}

/* 2. tasarımın manşeti: haftanın günleri büyük, belgenin adı, haftanın sayıları (dosya, PKG, canlı). */
function HaftaManset({ hafta, kalemler }: { hafta: HaftalikPlan; kalemler: HaftalikKalem[] }) {
  const bas = hafta.baslangic;
  const bit = haftaSonu(bas);
  const dosya = new Set([...hafta.anaKonular.map((a) => a.baslikId ?? a.id), ...kalemler.map((k) => k.baslikId).filter(Boolean)]).size;
  return (
    <header className="baski-manset">
      <img className="bm-logo" src={trtArabiBeyaz} alt="TRT عربي" />
      <span className="bm-gun">
        {bas.split("-")[2]}–{bit.split("-")[2]}
      </span>
      <span className="bm-ad">
        {c("haftalikCiktiBaslik")}
        <small>{aralikYaz(bas, bit, "ar")}</small>
      </span>
      <span className="bm-sayilar">
        <span>
          <b>{dosya}</b>
          {c("bmDosya")}
        </span>
        <span>
          <b>{kalemler.filter(kalemPaketli).length}</b>PKG
        </span>
        <span>
          <b>{kalemler.filter((k) => k.bicimler.includes("canli")).length}</b>LIVE
        </span>
      </span>
    </header>
  );
}

function HfPencereIcerik({ ben, hafta, p, kapat }: { ben: Kisi; hafta: HaftalikPlan; p: HfPencere; kapat: () => void }) {
  const { t } = useDil();
  if (p.tur === "anaKonu")
    return (
      <Pencere baslik={t(p.mevcut ? "duzenle" : "anaDosyaEkle")} kapat={kapat}>
        <AnaKonuFormu ben={ben} hafta={hafta} mevcut={p.mevcut} sonra={p.sonra} kapat={kapat} />
      </Pencere>
    );
  return (
    <Pencere baslik={t(p.mevcut ? "duzenle" : p.pkg ? "dosyayaPkgEkle" : "kalemEkle")} kapat={kapat}>
      <KalemFormu ben={ben} hafta={hafta} mevcut={p.mevcut} tarih={p.tarih} dosya={p.dosya} sonra={p.sonra} pkg={p.pkg} kapat={kapat} />
    </Pencere>
  );
}

/** Belge sayfası: haftalık planı çıktının üzerinde düzenleme; baskı, Word ve kopya temiz kopyadan. */
export default function HaftalikBelge({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t } = useDil();
  const duzenler = haftalikDuzenler(ben, hafta);
  const karar = kararVerebilir(ben, hafta);
  const [pencere, setPencere] = useState<HfPencere | null>(null);
  const temiz = useRef<HTMLElement>(null);
  const duzen = duzenler ? { ben, karar, ac: setPencere } : undefined;
  const bas = hafta.baslangic;

  return (
    <>
      <CiktiAraclari
        geri={{ href: `#/haftalik/${hafta.id}`, metin: t("haftalikPlanaDon") }}
        belge={temiz}
        word={{ ad: `haftalik-plan-${bas}.doc`, baslik: `${c("haftalikCiktiBaslik")} ${aralikYaz(bas, haftaSonu(bas), "ar")}` }}
        yazdirMetni="rpYazdir"
        ek={
          <>
            <a className="dugme dugme-ikincil" href={`#/haftalik/${hafta.id}/cikti`}>
              <Printer size={16} /> {t("ciktiOnizleme")}
            </a>
            {duzenler && <GeriAlDugmesi ben={ben} planId={hafta.id} />}
          </>
        }
      />
      <div className="cikti-sarici belge-duzen yazdirma-gizle">
        <HaftalikBelgesi hafta={hafta} duzen={duzen} />
      </div>
      <div className="cikti-sarici belge-temiz" aria-hidden="true">
        <HaftalikBelgesi hafta={hafta} belgeRef={temiz} />
      </div>
      {pencere && duzen && <HfPencereIcerik ben={ben} hafta={hafta} p={pencere} kapat={() => setPencere(null)} />}
    </>
  );
}
