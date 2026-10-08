/**
 * Gerçek kipin Firebase yapılandırması.
 *
 * Bu değerler gizli değil: Firebase web uygulamasının tarayıcıya giden
 * kimliği. Erişimi değerler değil güvenlik kuralları sınırlıyor
 * (`firestore.rules`). Nasıl doldurulacağı `belgeler/gercek-kip.md`'de.
 *
 * Boşken gizli giriş "yapılandırılmadı" diyor; demo etkilenmiyor.
 */
export interface FirebaseAyari {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  /** İlk yönetici: boş sistemde davetsiz girebilen tek adres; kurallarda da aynısı yazılı. */
  kurucu: string;
  /** Yalnız deneme: yerel emülatörün adresleri. */
  emulator?: { auth: string; firestoreHost: string; firestorePort: number };
}

const AYAR: FirebaseAyari = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: "",
  kurucu: "",
};

/*
 * Deneme için tarayıcıda üzerine yazılabiliyor (yerel emülatör). Yalnız o
 * tarayıcıyı etkiliyor; başka bir projeye bağlanan kişi yalnız kendi
 * ekranında o projeyi görür.
 */
const DENEME = "trt-planlama-firebase";

export const firebaseAyari = (): FirebaseAyari => {
  try {
    const ham = localStorage.getItem(DENEME);
    if (ham) return { ...AYAR, ...(JSON.parse(ham) as Partial<FirebaseAyari>) };
  } catch {
    /* bozuk deneme ayarı: asıl yapılandırma */
  }
  return AYAR;
};

export const gercekKipKurulu = () => {
  const a = firebaseAyari();
  return !!(a.apiKey && a.projectId);
};
