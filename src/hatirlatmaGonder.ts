import { cagriHatirlatildi } from "./eylemler";
import { HATIRLATMA_BASLIGI, cagriMesajKimligi, hatirlatmaKonusu, hatirlatmaMetni } from "./eposta";
import { GERCEK } from "./kip";
import { postaGonder } from "./posta-kapi";
import { postaAdresi } from "./girisKodu";
import { getir, kisiBul, type Cagri, type Kisi } from "./veri";
import { kapiHatasi } from "./yz";

/*
 * Çağrıya hatırlatma ("تذكير"): Weekly'nin ⋯ › Hatırlatma penceresi ve asistan
 * aynı yoldan gönderir (kullanıcı: asistana "hatırlatma gönder" deyince ayrı
 * posta yazıyordu). Kime çağrının Kime'si, muhabirler BCC'de 45'erli parçalar,
 * konu "RE: " + çağrının konusu, çağrının Message-ID'si varsa yanıt olarak.
 */
const PARCA = 45;

export const hatirlatmaAlicilari = (cagri: Cagri) => {
  const d = getir();
  return cagri.bcc.map((id) => postaAdresi(kisiBul(d, id))).filter((a): a is string => !!a);
};

export const cagriHatirlatmasiGonder = async (ben: Kisi, cagri: Cagri, not: string): Promise<{ tamam: number; hatalar: string[] }> => {
  const bcc = hatirlatmaAlicilari(cagri);
  const yanitlanan = cagriMesajKimligi(getir().postaMesajlari ?? [], cagri.etiket);
  let tamam = 0;
  const hatalar: string[] = [];
  if (GERCEK) {
    // Sırayla: her parça ayrı EWS bağlantısı; aynı anda açılınca kapı sınırına takılıyordu.
    for (let i = 0; i < bcc.length; i += PARCA) {
      const parca = bcc.slice(i, i + PARCA);
      const r = await postaGonder({ kime: [cagri.kime], bcc: parca, konu: hatirlatmaKonusu(cagri), metin: hatirlatmaMetni(cagri, not), baslik: HATIRLATMA_BASLIGI, ...(yanitlanan && { yanitlanan }) });
      if (r.tamam) tamam += parca.length;
      else hatalar.push(kapiHatasi(r));
    }
  } else tamam = bcc.length;
  if (tamam) cagriHatirlatildi(ben, cagri.id, tamam);
  return { tamam, hatalar };
};
