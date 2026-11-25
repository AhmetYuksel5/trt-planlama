import { Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Icerik, Pencere, icerikAlani } from "../../bilesenler/Parcalar";
import { SaatGirdisi } from "../../bilesenler/TarihSaat";
import { useDil } from "../../dil";
import { haftaCanliKaydet, haftaCanliNafizeSil, haftaNafizeKaydet, haftaNafizeleriEkle } from "../../eylemler";
import { kisiAr, satir } from "../../etiketler";
import { haftaninDosyalari } from "../../haftalik";
import { useBen } from "../../oturum";
import { kisiBul, useVeri, type HaftaCanli, type HaftaNafize, type HaftalikPlan } from "../../veri";
import { haftalikDuzenler } from "../../yetki";
import { BelgeSatiri, SatirSeridi } from "../belge/Parcalar";
import { EkleDugmesi, IkonDugme } from "../nextday/Bolumler";
import { FormAlt, MuhabirSecici } from "../nextday/Formlar";
import { NafizeFormu, YENI_DOSYA, nafizeBasligi, nafizeSatirlari } from "../nextday/Nafize";

/*
 * Weekly'de günün canlı yayını ve nafizesi (kullanıcı: haftadan günün gündemine
 * canlı yayın ve nafize eklensin). Karar kalemi değil; hafta kesinleşince ya da
 * günün Next Day planı açılınca oraya geçer, geçen kayıt burada kilitli.
 */
export const gunCanlilari = (h: HaftalikPlan, tarih: string) => (h.canlilar ?? []).filter((c) => c.tarih === tarih).sort((a, b) => (a.saat || "99").localeCompare(b.saat || "99"));
export const gunNafizeleri = (h: HaftalikPlan, tarih: string) => (h.nafizeler ?? []).filter((n) => n.tarih === tarih).sort((a, b) => (a.saat || "99").localeCompare(b.saat || "99"));

function useDosyalar(h: HaftalikPlan) {
  const v = useVeri();
  return haftaninDosyalari(h).map((id) => ({ id, ad: v.basliklar.find((b) => b.id === id)?.ad ?? "" }));
}

function CanliPenceresi({ h, tarih, mevcut, dosya, kapat }: { h: HaftalikPlan; tarih: string; mevcut?: HaftaCanli; dosya?: string; kapat: () => void }) {
  const { t } = useDil();
  const ben = useBen();
  const dosyalar = useDosyalar(h);
  const [f, setF] = useState({ konu: mevcut?.konu ?? "", yer: mevcut?.yer ?? "", saat: mevcut?.saat ?? "", muhabirId: mevcut?.muhabirId ?? "", baslikId: mevcut?.baslikId ?? dosya ?? "", yeniAd: "" });
  const eksik = !f.konu.trim() || (f.baslikId === YENI_DOSYA && !f.yeniAd.trim());
  const kaydet = () => {
    if (!ben || eksik) return;
    const yeni = f.baslikId === YENI_DOSYA;
    haftaCanliKaydet(ben, h.id, { id: mevcut?.id, tarih, konu: f.konu, yer: f.yer, saat: f.saat, muhabirId: f.muhabirId, baslikId: yeni ? undefined : f.baslikId }, yeni ? f.yeniAd : undefined);
    kapat();
  };
  return (
    <Pencere baslik={t("canliEkle")} kapat={kapat}>
      <div className="form" data-hf-canli-formu>
        <label>
          {t("konu")}
          <input {...icerikAlani} className="girdi" value={f.konu} onChange={(e) => setF({ ...f, konu: e.target.value })} placeholder="القمة الخليجية" data-hf-canli-konu />
        </label>
        <div className="satir">
          <label>
            {t("yer")}
            <input {...icerikAlani} className="girdi" value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder="الدوحة" data-hf-canli-yer />
          </label>
          <label>
            {t("saatGmt")}
            <SaatGirdisi value={f.saat} onChange={(e) => setF({ ...f, saat: e.target.value })} data-hf-canli-saat />
          </label>
        </div>
        <label>
          {t("muhabir")}
          <MuhabirSecici deger={f.muhabirId} degistir={(id) => setF({ ...f, muhabirId: id })} bosEtiket="—" />
        </label>
        <label>
          {t("dosya")}
          <select className="girdi" value={f.baslikId} onChange={(e) => setF({ ...f, baslikId: e.target.value })} data-hf-canli-dosya>
            <option value="">—</option>
            {dosyalar.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ad}
              </option>
            ))}
            <option value={YENI_DOSYA}>+ {t("yeniDosya")}</option>
          </select>
        </label>
        {f.baslikId === YENI_DOSYA && (
          <label>
            {t("yeniDosya")}
            <input {...icerikAlani} className="girdi" value={f.yeniAd} onChange={(e) => setF({ ...f, yeniAd: e.target.value })} />
          </label>
        )}
        <FormAlt kapat={kapat} kaydet={kaydet} devre={eksik} />
      </div>
    </Pencere>
  );
}

function NafizePenceresi({ h, tarih, mevcut, dosya, kapat }: { h: HaftalikPlan; tarih: string; mevcut?: HaftaNafize; dosya?: string; kapat: () => void }) {
  const { t } = useDil();
  const ben = useBen();
  const dosyalar = useDosyalar(h);
  return (
    <NafizeFormu
      baslik={t(mevcut ? "nafizeDuzenle" : "nafizeEkle")}
      secenekler={dosyalar}
      ilkBaslik={mevcut?.baslikId ?? dosya ?? dosyalar[0]?.id ?? YENI_DOSYA}
      // Dosyanın kendi düğmesinden açılınca dosya sorulmaz (Next Day'de başlıktan açılan nafize gibi).
      baslikSor={!dosya}
      yeniDosya
      mevcut={mevcut}
      kaydet={(baslikId, kayitlar, yeni) => {
        if (!ben) return;
        if (mevcut) haftaNafizeKaydet(ben, h.id, { ...kayitlar[0], id: mevcut.id, tarih, baslikId }, yeni);
        else haftaNafizeleriEkle(ben, h.id, kayitlar.map((k) => ({ ...k, tarih, baslikId })), yeni);
      }}
      kapat={kapat}
    />
  );
}

type Acik = { tur: "canli"; mevcut?: HaftaCanli; dosya?: string } | { tur: "nafize"; mevcut?: HaftaNafize; dosya?: string };

/* Dosyanın kendi canlı ve nafize düğmesi (Next Day başlığının canlı kutusu gibi): dosya seçili açılır. */
export function DosyaCanliNafize({ h, tarih, baslikId, tur, kapat }: { h: HaftalikPlan; tarih: string; baslikId: string; tur: "canli" | "nafize"; kapat: () => void }) {
  return <AcikPencere h={h} tarih={tarih} acik={{ tur, dosya: baslikId }} kapat={kapat} />;
}

/* Günün iki ekleme düğmesi (plan ekranında ve belgede). */
export function GunEkleDugmeleri({ h, tarih }: { h: HaftalikPlan; tarih: string }) {
  const { t } = useDil();
  const ben = useBen();
  const [acik, setAcik] = useState<Acik>();
  if (!ben || !haftalikDuzenler(ben, h)) return null;
  return (
    <>
      <span data-hf-canli-ekle={tarih}>
        <EkleDugmesi metin={t("canliEkle")} onClick={() => setAcik({ tur: "canli" })} />
      </span>
      <span data-hf-nafize-ekle={tarih}>
        <EkleDugmesi metin={t("nafizeEkle")} onClick={() => setAcik({ tur: "nafize" })} />
      </span>
      {acik && <AcikPencere h={h} tarih={tarih} acik={acik} kapat={() => setAcik(undefined)} />}
    </>
  );
}

function AcikPencere({ h, tarih, acik, kapat }: { h: HaftalikPlan; tarih: string; acik: Acik; kapat: () => void }) {
  return acik.tur === "canli" ? <CanliPenceresi h={h} tarih={tarih} mevcut={acik.mevcut} dosya={acik.dosya} kapat={kapat} /> : <NafizePenceresi h={h} tarih={tarih} mevcut={acik.mevcut} dosya={acik.dosya} kapat={kapat} />;
}

/*
 * Günün canlıları ("مباشر", "YER / konu / saat" Next Day'deki gibi) ve nafizeleri
 * ("نافذة", dosyasıyla). Belge ve çıktıda kurumun biçimi; klasik plan ekranında kayıt kutusu.
 */
export function GunCanliNafize({ h, tarih, duzen, klasik }: { h: HaftalikPlan; tarih: string; duzen?: boolean; klasik?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [acik, setAcik] = useState<Acik>();
  const canlilar = gunCanlilari(h, tarih);
  const nafizeler = gunNafizeleri(h, tarih);
  if (!canlilar.length && !nafizeler.length) return null;
  const yazar = !!ben && haftalikDuzenler(ben, h);
  const dosyaAdi = (id?: string) => (id ? v.basliklar.find((b) => b.id === id)?.ad ?? "" : "");
  const sil = (id: string) => ben && confirm(t("silinsinMi")) && haftaCanliNafizeSil(ben, h.id, id);
  const canliMetni = (c: HaftaCanli) => (
    <>
      {satir(c.yer, c.konu)} / <b>{c.saat ? `${c.saat}G` : "TBC"}</b>
      {c.muhabirId && <> / {kisiAr(kisiBul(v, c.muhabirId))}</>}
    </>
  );
  const nafizeMetni = (n: HaftaNafize) => {
    const [bir, iki] = nafizeSatirlari(v, n);
    return [
      <>
        {bir}
        {dosyaAdi(n.baslikId) && <> / {dosyaAdi(n.baslikId)}</>}
      </>,
      iki,
    ] as const;
  };
  const kayit = (id: string, aktarim: boolean, ac: () => void, satirlar: ReactNode[]) =>
    klasik ? (
      <div key={id} className="kayit" data-hf-cn={id} data-aktarildi={aktarim || undefined}>
        <div className="kayit-bas">
          <div>
            {satirlar.map((x, i) => (
              <Icerik key={i} blok className="kayit-metin">
                {x}
              </Icerik>
            ))}
          </div>
          {yazar && !aktarim && (
            <div className="islemler">
              <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={ac} />
              <IkonDugme ikon={<Trash2 size={15} />} etiket={t("sil")} onClick={() => sil(id)} />
            </div>
          )}
        </div>
      </div>
    ) : (
      <BelgeSatiri key={id} duzen={!!duzen && yazar && !aktarim} serit={<SatirSeridi duzenle={ac} cikar={() => sil(id)} />}>
        <div data-hf-cn={id}>
          {satirlar.map((x, i) => (
            <p key={i}>{x}</p>
          ))}
        </div>
      </BelgeSatiri>
    );
  const altBaslik = (metin: string, tur: string) =>
    klasik ? (
      <Icerik blok>
        <b data-hf-cn-baslik={tur}>{metin}</b>
      </Icerik>
    ) : (
      <p className="alt-baslik" data-hf-cn-baslik={tur}>
        {metin}
      </p>
    );
  return (
    <div data-hf-gun-cn={tarih}>
      {canlilar.length > 0 && altBaslik("مباشر", "canli")}
      {canlilar.map((c) => kayit(c.id, !!c.aktarim, () => setAcik({ tur: "canli", mevcut: c }), [canliMetni(c)]))}
      {nafizeler.length > 0 && altBaslik(nafizeBasligi(nafizeler.length), "nafize")}
      {nafizeler.map((n) => kayit(n.id, !!n.aktarim, () => setAcik({ tur: "nafize", mevcut: n }), nafizeMetni(n).filter(Boolean) as ReactNode[]))}
      {acik && <AcikPencere h={h} tarih={tarih} acik={acik} kapat={() => setAcik(undefined)} />}
    </div>
  );
}
