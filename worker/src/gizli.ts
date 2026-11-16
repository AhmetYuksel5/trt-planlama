/*
 * Posta şifrelerinin KV'de şifreli saklanması (kullanıcı: şifreler bir yerde
 * düz duruyor mu). Anahtar Worker'ın gizli değeri `POSTA_ANAHTARI` (32 bayt,
 * base64): Cloudflare panelinde bir kez yazılınca okunamıyor; dağıtım işi yoksa
 * kendisi üretip yazıyor (.github/workflows/yz-yayin.yml). KV'ye bakan biri
 * şifreyi değil "v1:" ile başlayan okunmaz metni görür.
 *
 * Anahtar yoksa (yerel deneme, ilk dağıtımın ilk dakikası) şifre eskisi gibi
 * düz yazılır; anahtar gelince ilk okumada şifrelenir. Eski düz kayıtlar da öyle.
 */

const ON_EK = "v1:";

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const b64Coz = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const anahtarlar = new Map<string, Promise<CryptoKey>>();
const anahtarAl = (ham: string) => {
  let a = anahtarlar.get(ham);
  if (!a) {
    a = crypto.subtle.importKey("raw", b64Coz(ham), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    anahtarlar.set(ham, a);
  }
  return a;
};

export const sifreliMi = (s: string) => s.startsWith(ON_EK);

/** Düz metni şifreler; anahtar yoksa ya da bozuksa düz bırakır. */
export const sifrele = async (duz: string, anahtar?: string): Promise<string> => {
  if (!duz || !anahtar) return duz;
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await anahtarAl(anahtar), new TextEncoder().encode(duz)));
    return `${ON_EK}${b64(iv)}:${b64(ct)}`;
  } catch {
    return duz;
  }
};

/*
 * Şifreliyse çözer, düzse olduğu gibi döner. Çözülemezse (anahtar yok ya da
 * değişmiş) boş: kişi şifresini Ayarlar'dan yeniden girer, bozuk metin
 * Exchange'e şifre diye gitmez.
 */
export const coz = async (s: string, anahtar?: string): Promise<string> => {
  if (!sifreliMi(s)) return s;
  if (!anahtar) return "";
  try {
    const [iv, ct] = s.slice(ON_EK.length).split(":");
    const duz = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64Coz(iv) }, await anahtarAl(anahtar), b64Coz(ct));
    return new TextDecoder().decode(duz);
  } catch {
    return "";
  }
};
