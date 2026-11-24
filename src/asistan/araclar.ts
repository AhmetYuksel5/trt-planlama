import { metin, type Dil } from "../dil";
import { gelismeKaydet, oneriDurum, oneriPlanaEkle } from "../eylemler";
import { kayitAra } from "../arama";
import { kisiAr } from "../etiketler";
import { oneriYeri } from "../oneriPlanlari";
import { oneriSekmesi, type OneriSekmesi } from "../oneriSekmeleri";
import { bugun, gunEkle } from "../tarih";
import { baslikBul, getir, kisiBul, type Durum, type Kisi, type NextDayPlan } from "../veri";
import { oneriGorebilir, planIcerikDuzenler, yapabilir } from "../yetki";

/*
 * Asistanın araç yürütücüleri (belgeler/asistan.md). Adlar ve girdi şemaları kapıdaki listeyle
 * aynı (worker/src/asistan.ts → ARACLAR; eşitlik worker/test/asistan.test.ts'te). Her araç kişinin
 * kendi yetkisiyle, ekranın kullandığı eylemle çalışır; asistan yeni yetki doğurmaz.
 *
 * Okuma aracı sonucu hemen döner. Yazma aracı önce kişiye gösterilecek cümleyi (`onay`) ve işi
 * (`calistir`) döner: motor kişi onaylayana dek çalıştırmaz. Girdi modelden gelir; kimlikler
 * kayıtta yoksa ya da yetki yoksa araç hata döner, eylem çağrılmaz. Kişisel alanlar (telefon,
 * e-posta) sonuca girmez.
 */

export interface AracBaglami {
  ben: Kisi;
  dil: Dil;
  git: (yol: string) => void;
}
export type AracSonucu = Record<string, unknown>;
export type Yurutum = { sonuc: AracSonucu } | { onay: string; calistir: () => AracSonucu };
type Girdi = Record<string, unknown>;

const s = (x: unknown, en = 2000) => (typeof x === "string" ? x.trim().slice(0, en) : "");
const hata = (kod: string): Yurutum => ({ sonuc: { hata: kod } });
// Onay cümlesinde Arapça içerik arayüzün cümlesine karışmasın: yönü yalıtılmış parça (FSI…PDI).
const iso = (x: string) => `\u2068${x}\u2069`;

const planBul = (d: Durum, tarih: string) => d.planlar.filter((p) => p.tarih === tarih).sort((a, b) => b.id.localeCompare(a.id))[0];
const baslikAdi = (d: Durum, p: NextDayPlan, pbId: string) => baslikBul(d, p.basliklar.find((b) => b.id === pbId)?.baslikId)?.ad ?? "";

const oneriOzeti = (d: Durum, id: string) => {
  const o = d.oneriler.find((x) => x.id === id);
  if (!o) return null;
  return { id: o.id, header: o.haberBasligi, strap: o.paketBasligi ?? "", gun: o.hedefTarih ?? "", durum: o.durum, muhabir: kisiAr(kisiBul(d, o.muhabirId)) };
};

export const ARAC_YURUTUCULERI: Record<string, (g: Girdi, b: AracBaglami) => Yurutum> = {
  ara: (g, { ben, dil }) => {
    const sorgu = s(g.sorgu, 200);
    if (!sorgu) return hata("girdi");
    return { sonuc: { sonuclar: kayitAra(getir(), ben, sorgu, dil).slice(0, 15).map((x) => ({ tur: x.tur, id: x.id, ad: x.metin, ust: x.ust ?? "", yol: x.href ?? "" })) } };
  },

  sayfaAc: (g, { git }) => {
    const yol = s(g.yol, 200);
    // Yalnız uygulamanın içi: model dışarıya bağlantı açtırmasın.
    if (!/^#\/[\w\-/]*$/.test(yol)) return hata("yol");
    git(yol.slice(2));
    return { sonuc: { acildi: yol } };
  },

  onerileriListele: (g, { ben }) => {
    const d = getir();
    const sekme = (["karar", "baskasinda", "planda", "arsiv"].includes(s(g.sekme)) ? s(g.sekme) : "karar") as OneriSekmesi;
    const gun = s(g.gun, 10);
    const liste = d.oneriler
      .filter((o) => oneriGorebilir(ben, o) && oneriSekmesi(d, o) === sekme && (!gun || o.hedefTarih === gun || (!!o.bitisTarih && o.hedefTarih! <= gun && gun <= o.bitisTarih)))
      .slice(0, 40)
      .map((o) => oneriOzeti(d, o.id));
    return { sonuc: { sekme, sayi: liste.length, oneriler: liste } };
  },

  oneriAyrintisi: (g, { ben }) => {
    const d = getir();
    const o = d.oneriler.find((x) => x.id === s(g.oneriId, 100));
    if (!o || !oneriGorebilir(ben, o)) return hata("bulunamadi");
    const yer = oneriYeri(d, o);
    return {
      sonuc: {
        ...oneriOzeti(d, o.id),
        gelisme: o.gelisme,
        islemeFikri: o.islemeFikri ?? "",
        bicim: o.bicim ?? "",
        plan: yer?.plan ? { id: yer.plan.id, tarih: yer.plan.tarih } : null,
        gundemde: !!yer?.hafta,
      },
    };
  },

  planOzeti: (g, { ben }) => {
    const d = getir();
    const tarih = s(g.tarih, 10) || gunEkle(bugun(), 1);
    const p = planBul(d, tarih);
    if (!p) return { sonuc: { tarih, plan: null } };
    return {
      sonuc: {
        planId: p.id,
        tarih: p.tarih,
        durum: p.durum,
        duzenleyebilir: planIcerikDuzenler(ben, p),
        basliklar: p.basliklar.map((b) => ({
          planBaslikId: b.id,
          ad: baslikBul(d, b.baslikId)?.ad ?? "",
          gelisme: d.gelismeler.filter((x) => x.planBaslikId === b.id).length,
          pkg: d.paketler.filter((x) => x.planBaslikId === b.id && x.durum !== "iptal").length,
        })),
      },
    };
  },

  gelismeEkle: (g, { ben, dil }) => {
    const d = getir();
    const p = d.planlar.find((x) => x.id === s(g.planId, 100));
    const pbId = s(g.planBaslikId, 100);
    const govde = s(g.metin, 1500);
    if (!p || !p.basliklar.some((b) => b.id === pbId) || !govde) return hata("bulunamadi");
    if (!planIcerikDuzenler(ben, p)) return hata("yetki");
    const yer = s(g.yer, 80);
    return {
      onay: metin("asOnayGelisme", dil, { tarih: p.tarih, baslik: iso(baslikAdi(d, p, pbId)), metin: iso(yer ? `${yer} / ${govde}` : govde) }),
      calistir: () => (gelismeKaydet(ben, { planId: p.id, planBaslikId: pbId, metin: govde, ...(yer ? { yer } : {}), kaynakTuru: "ajans", kaynakAdi: "", tarih: "" }) ? { tamam: true } : { hata: "yapilamadi" }),
    };
  },

  oneriPlanaEkle: (g, { ben, dil }) => {
    const d = getir();
    const o = d.oneriler.find((x) => x.id === s(g.oneriId, 100));
    const p = d.planlar.find((x) => x.id === s(g.planId, 100));
    if (!o || !p) return hata("bulunamadi");
    if (!yapabilir(ben, "oneriDegerlendir") || !planIcerikDuzenler(ben, p)) return hata("yetki");
    const pb = p.basliklar.find((b) => b.id === s(g.planBaslikId, 100));
    const yeniBaslik = s(g.yeniBaslik, 200);
    if (!pb && !yeniBaslik) return hata("baslik");
    const paket = g.paket === true;
    return {
      onay: metin(paket ? "asOnayPlanaEklePkg" : "asOnayPlanaEkle", dil, { oneri: iso(o.haberBasligi), tarih: p.tarih, baslik: iso(pb ? baslikAdi(d, p, pb.id) : yeniBaslik) }),
      calistir: () => (oneriPlanaEkle(ben, o.id, { planId: p.id, ...(pb ? { baslikId: pb.baslikId } : { yeniBaslik }), paketOlustur: paket }) ? { tamam: true } : { hata: "yapilamadi" }),
    };
  },

  oneriReddet: (g, { ben, dil }) => {
    const d = getir();
    const o = d.oneriler.find((x) => x.id === s(g.oneriId, 100));
    const gerekce = s(g.gerekce, 1000);
    if (!o || !gerekce) return hata("bulunamadi");
    if (!yapabilir(ben, "oneriDegerlendir")) return hata("yetki");
    return { onay: metin("asOnayReddet", dil, { oneri: iso(o.haberBasligi), gerekce: iso(gerekce) }), calistir: () => (oneriDurum(ben, o.id, "reddedildi", gerekce) ? { tamam: true } : { hata: "yapilamadi" }) };
  },

  oneriDegerlendirmeyeAl: (g, { ben, dil }) => {
    const d = getir();
    const o = d.oneriler.find((x) => x.id === s(g.oneriId, 100));
    if (!o) return hata("bulunamadi");
    if (!yapabilir(ben, "oneriDegerlendir")) return hata("yetki");
    return { onay: metin("asOnayDegerlendir", dil, { oneri: iso(o.haberBasligi) }), calistir: () => (oneriDurum(ben, o.id, "degerlendiriliyor") ? { tamam: true } : { hata: "yapilamadi" }) };
  },
};

// Kişinin "evet"i: düğmesiz onay (belgeler/asistan.md, ilke 3). Yalnız kişinin kendi yazdığı iletiden.
const EVET = /^\s*(evet|tamam|onayla(yorum)?|olur|yap|ok(ey)?|yes|sure|confirm|نعم|أجل|موافق|تمام|حسنا|حسناً)[\s.!]*$/i;
const HAYIR = /^\s*(hay[ıi]r|vazge[çc]|iptal|yapma|no|cancel|لا|إلغاء|الغ)[\s.!]*$/i;
export const onayYaniti = (m: string): "evet" | "hayir" | null => (EVET.test(m) ? "evet" : HAYIR.test(m) ? "hayir" : null);
