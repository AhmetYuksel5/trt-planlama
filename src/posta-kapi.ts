import { kapiDosya, kapiIstek, type YzSonuc } from "./yz";
import { cagriYanitiysaIsle, postaIsle } from "./eylemler";
import { type GelenEposta } from "./eposta";
import { type Kisi } from "./veri";
import { otoCagriEsitle } from "./otoCagri";

/*
 * Posta köprüsünün istemcisi: Exchange kutusunu NTLM ile okuyan kapı
 * (worker/src/ews.ts). Parola kapının KV'sinde; tarayıcıya hiç gelmiyor.
 * Kapı postayı Firestore'a kendi yazmıyor (servis hesabı istemiyoruz):
 * çektiğini döndürüyor, tarayıcı kişinin kendi oturumuyla postaIsle ile
 * yazıyor (belgeler/eposta-entegrasyonu.md).
 */

/* Ortak ayar (tam yönetici): sunucu, alan (domain), açık/kapalı. */
export interface PostaAyarGorunum {
  acik: boolean;
  sunucu: string;
  alan: string;
}

export interface PostaAyarGirdi {
  acik?: boolean;
  sunucu?: string;
  alan?: string;
}

export const postaAyariGetir = () => kapiIstek<PostaAyarGorunum>("/posta/ayar");
export const postaAyariKaydet = (g: PostaAyarGirdi) => kapiIstek<PostaAyarGorunum>("/posta/ayar", "PUT", g);

/* Kişiye özel kimlik (herkes kendi): kullanıcı adı, parola, grup adresi. */
export interface PostaKimlikGorunum {
  kullanici: string;
  grupAdresi: string;
  parolaVar: boolean;
}

export interface PostaKimlikGirdi {
  kullanici?: string;
  grupAdresi?: string;
  /** Yeni parola; boş gönderilirse eskisi korunur, null silmek için. */
  parola?: string | null;
}

export const postaKimlikGetir = () => kapiIstek<PostaKimlikGorunum>("/posta/kimlik");
export const postaKimlikKaydet = (g: PostaKimlikGirdi) => kapiIstek<PostaKimlikGorunum>("/posta/kimlik", "PUT", g);
export const postaDene = () => kapiIstek<{ tamam: boolean; sayi: number }>("/posta/dene", "POST", {});

/*
 * Yeni posta ve yanıt (kapı EWS CreateItem ile). Grup adresini kapı her zaman
 * CC'ye ekler; dönen kime/cc gerçekten gönderilen liste ("kim kime yazdı").
 */
export const postaGonder = (g: { kime: string[]; gonderen?: string; cc?: string[]; bcc?: string[]; konu: string; metin: string; baslik?: string; yanitlanan?: string; html?: string; ekler?: { ad: string; tur: string; icerik: string }[] }) =>
  kapiIstek<{ tamam: boolean; kime: string[]; cc: string[]; bcc: string[] }>("/posta/gonder", "POST", g);

/* Rota tablosu (worker/src/rota.ts): ayar tam yöneticide, günün satırlarını Next Day'i hazırlayan okur. */
export interface RotaAyarGorunum {
  tabloId: string;
  sunucuTabloId?: string;
  istemciEposta: string;
  anahtarVar: boolean;
}
export const rotaAyariGetir = () => kapiIstek<RotaAyarGorunum>("/rota/ayar");
export const rotaAyariKaydet = (g: { tablo?: string; sunucuTablo?: string; hesap?: string | null }) => kapiIstek<RotaAyarGorunum>("/rota/ayar", "PUT", g);
export const rotaGetir = (tarih: string, yenile = false, tur: "rota" | "sunucu" = "rota") =>
  kapiIstek<{ sekme: string; satirlar: [string, string, string][] }>("/rota", "POST", { tarih, ...(yenile ? { yenile } : {}), ...(tur === "sunucu" ? { tur } : {}) });

/* Ekin kendisi: kapı postayı kişinin kendi kutusunda Message-ID ile bulup eki getirir; kayda girmez. */
export const postaEkiGetir = (mesajKimligi: string, ad: string) => kapiDosya("/posta/ek", { mesajKimligi, ad });

interface KapiMesaji {
  kimden: string;
  kimdenAd?: string;
  konu: string;
  metin: string;
  zaman?: string;
  mesajKimligi?: string;
  konuKimligi?: string;
  ekler?: string[];
  kime?: string[];
  cc?: string[];
}

/*
 * Kapıdan postayı çekip sohbete yazar; her mesaj postaIsle'den geçiyor
 * (tekillik, alıntı/imza ayıklama, konuya göre iplik). Çağrıya verilmiş
 * muhabir yanıtı ayrıca öneri akışına girer (eylemler.ts →
 * cagriYanitiysaIsle). Dönen sayılar yeni eklenen mesaj ve öneriye aktarılan;
 * tekrar gelenler sayılmıyor.
 */
/* Kapının staffing tanısı ve bu çekişte kayda yeni girenler (kullanıcı: posta gelmiyor, nedeni görünmüyordu). */
// Kapıdaki STAFFING_KONUSU ile aynı.
const STAFFING = /news\s+staffing\b/i;

export interface StaffingTanisi {
  bulunan: number;
  okunan: number;
  eklenen: number;
  hata?: string;
}

export const postalariCek = async (ben: Kisi, adet = 25, grup?: string): Promise<{ eklenen: number; toplam: number; oneri: number; uyari?: string; staffing?: StaffingTanisi } | { hata: string; ayrinti?: string }> => {
  // Kapının sabah gönderdiği çağrı önce kayda girsin: yanıtı o çağrıya bağlanıp öneri olsun.
  await otoCagriEsitle(ben).catch(() => null);
  // uyari: kapı bir grubu alamadı, alınanlar yine geldi (bağlantı kopunca hepsi gitmesin).
  type Cekis = { mesajlar: KapiMesaji[]; uyari?: string; staffing?: { bulunan: number; okunan: { konu: string }[]; hata?: string } };
  const r: YzSonuc<Cekis> = await kapiIstek<Cekis>("/posta/cek", "POST", { adet });
  if (!r.tamam) return { hata: r.hata, ayrinti: r.ayrinti };
  // En eski önce yazılsın ki sohbet sırası doğru olsun (kapı en yeni önce veriyor).
  const mesajlar = [...r.veri.mesajlar].reverse();
  let eklenen = 0;
  let oneri = 0;
  let staffingEklenen = 0;
  for (const m of mesajlar) {
    const gelen: GelenEposta = { kimden: m.kimden, kimdenAd: m.kimdenAd, konu: m.konu, metin: m.metin, zaman: m.zaman, mesajKimligi: m.mesajKimligi, konuKimligi: m.konuKimligi, ekler: m.ekler, kime: m.kime, cc: m.cc };
    const s = postaIsle(ben, gelen, "posta", grup);
    if (s?.durum === "eklendi") eklenen++;
    if (s?.durum === "eklendi" && STAFFING.test(m.konu)) staffingEklenen++;
    // Çağrıya verilmiş muhabir yanıtı öneriye de aktarılır; sohbette de kalır.
    if (cagriYanitiysaIsle(ben, gelen)?.durum === "oneri") oneri++;
  }
  const st = r.veri.staffing;
  const staffing = st ? { bulunan: st.bulunan, okunan: st.okunan.length, eklenen: staffingEklenen, ...(st.hata ? { hata: st.hata } : {}) } : undefined;
  return { eklenen, toplam: mesajlar.length, oneri, ...(r.veri.uyari ? { uyari: r.veri.uyari } : {}), ...(staffing ? { staffing } : {}) };
};
