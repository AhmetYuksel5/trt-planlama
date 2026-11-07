import { kapiIstek, type YzSonuc } from "./yz";
import { cagriYanitiysaIsle, postaIsle } from "./eylemler";
import { type GelenEposta } from "./eposta";
import { type Kisi } from "./veri";

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
export const postaGonder = (g: { kime: string[]; cc?: string[]; bcc?: string[]; konu: string; metin: string }) =>
  kapiIstek<{ tamam: boolean; kime: string[]; cc: string[]; bcc: string[] }>("/posta/gonder", "POST", g);

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
export const postalariCek = async (ben: Kisi, adet = 25, grup?: string): Promise<{ eklenen: number; toplam: number; oneri: number } | { hata: string; ayrinti?: string }> => {
  const r: YzSonuc<{ mesajlar: KapiMesaji[] }> = await kapiIstek<{ mesajlar: KapiMesaji[] }>("/posta/cek", "POST", { adet });
  if (!r.tamam) return { hata: r.hata, ayrinti: r.ayrinti };
  // En eski önce yazılsın ki sohbet sırası doğru olsun (kapı en yeni önce veriyor).
  const mesajlar = [...r.veri.mesajlar].reverse();
  let eklenen = 0;
  let oneri = 0;
  for (const m of mesajlar) {
    const gelen: GelenEposta = { kimden: m.kimden, kimdenAd: m.kimdenAd, konu: m.konu, metin: m.metin, zaman: m.zaman, mesajKimligi: m.mesajKimligi, konuKimligi: m.konuKimligi, ekler: m.ekler, kime: m.kime, cc: m.cc };
    const s = postaIsle(ben, gelen, "posta", grup);
    if (s?.durum === "eklendi") eklenen++;
    // Çağrıya verilmiş muhabir yanıtı öneriye de aktarılır; sohbette de kalır.
    if (cagriYanitiysaIsle(ben, gelen)?.durum === "oneri") oneri++;
  }
  return { eklenen, toplam: mesajlar.length, oneri };
};
