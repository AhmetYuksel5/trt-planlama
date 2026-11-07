import { kapiIstek, type YzSonuc } from "./yz";
import { postaIsle } from "./eylemler";
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

/* Buradan yanıt gönderir (kapı EWS CreateItem ile). Alıcı boşsa kapı planlama grubu adresini kullanır. */
export const postaGonder = (g: { kime?: string; konu: string; metin: string }) => kapiIstek<{ tamam: boolean }>("/posta/gonder", "POST", g);

interface KapiMesaji {
  kimden: string;
  kimdenAd?: string;
  konu: string;
  metin: string;
  zaman?: string;
  mesajKimligi?: string;
  konuKimligi?: string;
  ekler?: string[];
}

/*
 * Kapıdan postayı çekip sohbete yazar; her mesaj postaIsle'den geçiyor
 * (tekillik, alıntı/imza ayıklama, konuya göre iplik). Dönen sayı yeni
 * eklenen mesaj; tekrar gelenler sayılmıyor.
 */
export const postalariCek = async (ben: Kisi, adet = 25, grup?: string): Promise<{ eklenen: number; toplam: number } | { hata: string; ayrinti?: string }> => {
  const r: YzSonuc<{ mesajlar: KapiMesaji[] }> = await kapiIstek<{ mesajlar: KapiMesaji[] }>("/posta/cek", "POST", { adet });
  if (!r.tamam) return { hata: r.hata, ayrinti: r.ayrinti };
  // En eski önce yazılsın ki sohbet sırası doğru olsun (kapı en yeni önce veriyor).
  const mesajlar = [...r.veri.mesajlar].reverse();
  let eklenen = 0;
  for (const m of mesajlar) {
    const gelen: GelenEposta = { kimden: m.kimden, kimdenAd: m.kimdenAd, konu: m.konu, metin: m.metin, zaman: m.zaman, mesajKimligi: m.mesajKimligi, konuKimligi: m.konuKimligi, ekler: m.ekler };
    const s = postaIsle(ben, gelen, "posta", grup);
    if (s?.durum === "eklendi") eklenen++;
  }
  return { eklenen, toplam: mesajlar.length };
};
