import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signOut,
  updatePassword,
  type Auth,
  type User,
} from "firebase/auth";
import {
  CACHE_SIZE_UNLIMITED,
  Timestamp,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocsFromCache,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import type { Metin, Yazi } from "../dil";
import { firebaseAyari } from "../firebase-ayar";
import { bekleyenGecisleriTamamla, dilDenetmenleriniTasi, hesabaGecir, kendiKayitlariniTasi, muhabirUnvanlariniEsitle, yonetimiAgacaTasi } from "../eylemler";
import { baglantiCanli, gercekDurumuYaz, sunucuyaEsitOlunca, sunucuyaEsitlendi } from "../kip";
import { cikisYap, girisYap } from "../oturum";
import { KOD_SURESI_SAAT, girisAdresi, kodSifresi, kullaniciAdresi, yeniKod as girisKoduUret } from "../girisKodu";
import { bosDurum, disaridanGeldi, uzakDepoyuTak, yeniKisi, type Birim, type BirimId, type Durum, type GorevId, type HesapYetkisi, type Rol } from "../veri";
import { DIZI_ALANLARI, GENEL, HARITA_ALANLARI, KISITLI_OKUR, MUHASEBE_ALANLARI, muhasebeOkur, anahtarKimligi, belgeKimligi, erisimListesi, farkAlaniMi, farkCikar, kisiBelgedenOku, kisitliJson, ogeBelgesi, type OgeBelgesi, type Siralar } from "./fark";

/**
 * Gerçek kipin Firebase katmanı: oturum (Auth), davet ve etkinleştirme
 * (e-posta bağlantısı), kayıt (Firestore). Yalnız gerçek kipte ve gizli
 * girişte sonradan yükleniyor (kip.ts → firebaseYukle); demo bu kitaplığı
 * hiç indirmiyor.
 *
 * Kayıt düzeni ve yazma kuralı depo/fark.ts'te. Ekranlar bu dosyayı
 * bilmiyor: kayıt veri.ts'in `useVeri`/`kaydet`'inden geçiyor.
 */

let auth: Auth;
let db: Firestore;

export const baslat = () => {
  if (auth) return;
  const a = firebaseAyari();
  const app = initializeApp({ apiKey: a.apiKey, authDomain: a.authDomain || `${a.projectId}.firebaseapp.com`, projectId: a.projectId, appId: a.appId });
  auth = getAuth(app);
  // Bağlantı kopunca iş kaybolmasın; workspace bölmeleri ve sekmeler aynı önbelleği paylaşıyor.
  // Sınırsız: fark okuma önbelleği kaydın tamamı sayıyor, Firestore eskiyi kendiliğinden atarsa kayıt eksik kalırdı.
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager(), cacheSizeBytes: CACHE_SIZE_UNLIMITED }) });
  if (a.emulator) {
    connectAuthEmulator(auth, a.emulator.auth, { disableWarnings: true });
    connectFirestoreEmulator(db, a.emulator.firestoreHost, a.emulator.firestorePort);
  }
};

const ePosta = (e: string) => e.trim().toLowerCase();

/* --- Kişi ve oturum --- */

export type KisiHali = "etkin" | "pasif" | "yok";

/** Oturumdaki hesabın kişi kaydı; kurallar kişinin kendi kaydını okumasına her zaman izin veriyor. */
export const kisiHali = async (u: User): Promise<KisiHali> => {
  const s = await getDoc(doc(db, "kisiler", u.uid));
  if (!s.exists()) return "yok";
  return (s.data() as OgeBelgesi).pasif ? "pasif" : "etkin";
};

/**
 * Gerçek kipin açılışı: oturum varsa ve kişi etkinse kayıt bağlanıyor.
 * Kişi kaydı yoksa (davet bağlantısıyla yeni gelmiş) giriş ekranı
 * kaydı tamamlıyor; pasif kişi kayda erişemiyor.
 */
export const gercekKipiBaslat = () => {
  baslat();
  let kopar: (() => void) | null = null;
  onAuthStateChanged(auth, async (u) => {
    kopar?.();
    kopar = null;
    if (!u) {
      cikisYap();
      gercekDurumuYaz({ tur: "giris" });
      return;
    }
    try {
      const ks = await getDoc(doc(db, "kisiler", u.uid));
      const kendi = ks.exists() ? (ks.data() as OgeBelgesi) : undefined;
      if (!kendi || kendi.pasif) {
        gercekDurumuYaz({ tur: kendi ? "pasif" : "giris" });
        return;
      }
      kopar = kayitBagla(kendi, (kisitli) => {
        girisYap(u.uid);
        // Hesapsız kaydı bu hesaba bağlandıysa geçmiş bir kez taşınıyor. Kısıtlı kişi yalnız gördüğünü
        // taşıyabiliyor; gerisini ve eski kaydı tam yöneticinin açılışı tamamlıyor. Taşıma yazış: kayıt sunucuyla eşitlenince.
        sunucuyaEsitOlunca(() => {
          if (kisitli) kendiKayitlariniTasi(u.uid);
          else hesabaGecir(u.uid);
          if (!kisitli && kendi.hesapYoneticisi) bekleyenGecisleriTamamla();
        });
        gercekDurumuYaz({ tur: "hazir" });
      });
    } catch (e) {
      // Kodsuz hata ("bilinmeyen") ekranda nedenini söylemiyor; konsolda dursun.
      console.error(e);
      gercekDurumuYaz({ tur: "hata", kod: hataKodu(e) });
    }
  });
};

export const hataKodu = (e: unknown) => (e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "bilinmeyen");

/* --- Kayıt --- */

/*
 * Bu tarayıcıda sunucudan bir kez tam okunmuş koleksiyonlar (projeye göre).
 * Önbellek silinirse işaret kalsa da önbellek boş görünür, yine tam okunur.
 */
const TAM_OKUNAN = "trt-planlama-tam-okunan";
/* Sorgunun eşiği önbellekteki en son zamanın biraz gerisinde: saat ve görünürlük farkına karşı birkaç belge fazla okunsun. */
const FARK_PAYI = 5 * 60 * 1000;
const tamAnahtari = () => `${TAM_OKUNAN}:${firebaseAyari().projectId}`;
const tamOkunanlar = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(tamAnahtari()) ?? "[]") as string[];
  } catch {
    return [];
  }
};
const tamOkundu = (alan: string) => tamOkunanlar().includes(alan);
const tamOkunduYaz = (alan: string) => {
  const l = tamOkunanlar();
  if (l.includes(alan)) return;
  try {
    localStorage.setItem(tamAnahtari(), JSON.stringify([...l, alan]));
  } catch {
    /* saklanamazsa her açılışta tam okunur, eskisi gibi */
  }
};

interface Onbellek {
  s: number;
  j: string;
  o: unknown;
  /** Belgedeki erişim listesi (kişide kısıt işareti), metin olarak; tazelenecek olanı bulmak için. */
  e?: string;
}

/**
 * Koleksiyonları dinler, `Durum`'u kurar. Hepsinden ilk görüntü gelince
 * depo veri.ts'e takılıyor; sonraki değişiklikler (başka kişi ya da bölme)
 * yalnız değişen öğelerle yeniden çiziliyor: değişmeyen öğenin nesnesi
 * aynı kalıyor, fark da nesne kimliğiyle çıktığı için.
 */
/*
 * Bu sekmenin sunucudan aldığı belgeler, koleksiyon başına (Ayarlar › Okuma sayacı, tam yönetici). Firestore
 * faturasının birebir aynısı değil (uzun kopukluktan sonra sorgunun tamamı faturalanıyor, burada yalnız
 * değişenler sayılıyor) ama kotayı neyin tükettiğini gösteriyor; günlük okuma kotası posta açılmadan doluyordu.
 */
const okumalar = new Map<string, number>();
const okumaBasi = Date.now();
const okumaSay = (alan: string, n: number) => {
  if (!n) return;
  okumalar.set(alan, (okumalar.get(alan) ?? 0) + n);
  window.dispatchEvent(new Event("trt-okuma"));
};
export const okumaSayilari = () => ({ bas: okumaBasi, liste: [...okumalar].sort((a, b) => b[1] - a[1]) });

/*
 * Posta mesajları yalnız postayı kullanan sekmede dinleniyor: bu tarayıcıda Posta sayfası (ya da Postadan
 * kişiler) açılmışsa açılıştan, değilse açıldığı an (postaDinle). Her gelen posta postayı hiç açmayan bütün
 * sekmelerde de okuma harcıyordu. Sayfa çekmeden önce dinlemenin sunucudan gelmesini bekliyor: yarım listeyle
 * postaIsle aynı postayı ikinci kez eklerdi.
 */
const POSTA_KULLANIR = "trt-planlama-posta-kullanir";
let postaBaslat: (() => void) | null = null;
let postaGeldi = false;
const postaBekleyenler: (() => void)[] = [];
const postaKullaniyor = () => {
  try {
    return localStorage.getItem(POSTA_KULLANIR) === "1";
  } catch {
    return false;
  }
};
export const postaDinle = (): Promise<void> => {
  try {
    localStorage.setItem(POSTA_KULLANIR, "1");
  } catch {
    /* tarayıcı saklamaya izin vermiyor: yalnız bu açılışta dinlenir */
  }
  // Dinlenmeyen kişide (kısıtlı, kayıt bağlı değil) beklenecek bir şey yok.
  if (!postaBaslat) return Promise.resolve();
  postaBaslat();
  return postaGeldi ? Promise.resolve() : new Promise((r) => postaBekleyenler.push(r));
};

const kayitBagla = (kendi: OgeBelgesi, hazir: (kisitli: boolean) => void): (() => void) => {
  const uid = auth.currentUser?.uid ?? "";
  // Kısıtlı kişi (muhabir, onay bekleyen kayıt) yalnız erişim listesinde adı geçen belgeleri istiyor; kural da yalnız onları veriyor.
  const kisitli = kisitliJson(kendi.j);
  const kimlikler = [uid, ...(kendi.oncekiKimlik ? [kendi.oncekiKimlik] : [])];
  const onbellek: Record<string, Map<string, Onbellek>> = {};
  let siralar: Siralar = {};
  let d: Durum = bosDurum();
  const bekleyen = new Set<string>();
  /*
   * Dinlenen her şey (koleksiyon, kısıtlı kişinin tek belgeleri, genel ayar)
   * sunucudan en az bir kez teyit edilince kayıt "eşit" (kip.ts →
   * sunucuyaEsitlendi): yazışlar ve sistemin işleri ancak ondan sonra.
   * Önbellekten kurulan ilk görüntüye dayanan yazış sunucudaki yeni hali eziyordu.
   */
  const dinlenen = new Set<string>();
  const sunucudan = new Set<string>();
  const bekle = (k: string) => {
    bekleyen.add(k);
    dinlenen.add(k);
  };
  // Her dinlenenin son görüntüsü önbellekten mi: biri bile öyleyse bağlantı canlı sayılmaz (kip.ts → baglantiCanli).
  const onbellekte = new Set<string>();
  const sunucuGeldi = (k: string, snap: { metadata: { fromCache: boolean }; docChanges?: () => unknown[] }) => {
    if (!snap.metadata.fromCache) okumaSay(k.split("/")[0], snap.docChanges ? snap.docChanges().length : 1);
    if (k === "postaMesajlari" && !snap.metadata.fromCache && !postaGeldi) {
      postaGeldi = true;
      postaBekleyenler.splice(0).forEach((f) => f());
    }
    if (snap.metadata.fromCache) onbellekte.add(k);
    else onbellekte.delete(k);
    baglantiCanli(onbellekte.size === 0);
    if (snap.metadata.fromCache || sunucudan.has(k)) return;
    sunucudan.add(k);
    if ([...dinlenen].every((x) => sunucudan.has(x))) sunucuyaEsitlendi();
  };
  let bagli = false;
  const iptal: Unsubscribe[] = [];

  const geldi = (anahtar: string, degisti: boolean) => {
    if (!bagli) {
      bekleyen.delete(anahtar);
      if (bekleyen.size) return;
      bagli = true;
      uzakDepoyuTak({ yaz }, d);
      hazir(kisitli);
      if (!kisitli && kendi.hesapYoneticisi) erisimiTazele();
    } else if (degisti) {
      disaridanGeldi(d);
      // Muhabir hesaba bağlanınca eski kaydını kendisi taşıyamıyor; açık duran tam yönetici hemen tamamlıyor.
      if (anahtar === "kisiler" && !kisitli && kendi.hesapYoneticisi) {
        setTimeout(() => sunucuyaEsitOlunca(bekleyenGecisleriTamamla));
        // Davetle ya da kayıt bağlantısıyla gelen dış muhabir genel ünvanla kalmasın: ünvanı hemen şehrinden.
        setTimeout(() => sunucuyaEsitOlunca(muhabirUnvanlariniEsitle));
        setTimeout(() => sunucuyaEsitOlunca(dilDenetmenleriniTasi));
        setTimeout(() => sunucuyaEsitOlunca(yonetimiAgacaTasi));
      }
    }
  };

  /*
   * Bağlıyken yetki reddi çoğunlukla hesabın kapatılması: kişi genel bir
   * hata yerine "hesap kapatılmış" görsün. Reddi hata gibi günlüğe yazmıyor;
   * beklenen bir durum.
   */
  let durdu = false;
  const hata = async (e: unknown) => {
    if (durdu) return;
    durdu = true;
    iptal.forEach((f) => f());
    const kod = hataKodu(e);
    if (kod !== "permission-denied") console.error(e);
    const u = auth.currentUser;
    const hal = u && kod === "permission-denied" ? await kisiHali(u).catch(() => null) : null;
    gercekDurumuYaz(hal === "pasif" ? { tur: "pasif" } : { tur: "hata", kod });
  };

  // Kişinin kısıtı değişirse (tayin, onay) okuduğu kayıt da değişiyor: sayfa yeniden açılır.
  const kendimDegisti = (id: string, v: OgeBelgesi) => {
    // Muhasebeyi okuma hakkı da öyle: kalkınca o koleksiyonun reddi bütün dinlemeyi durdururdu.
    if (id === uid && (kisitliJson(v.j) !== kisitli || muhasebeOkur(v) !== muhasebeOkur(kendi))) location.reload();
  };

  const diziKur = (alan: string) => {
    const m = onbellek[alan];
    const liste = [...m.entries()].sort((a, b) => a[1].s - b[1].s || (a[0] < b[0] ? -1 : 1));
    siralar = { ...siralar, [alan]: new Map(liste.map(([id, x]) => [id, x.s])) };
    d = { ...d, [alan]: liste.map(([, x]) => x.o) };
  };
  /* Belgenin düz alanından tazelenecek olan: erişim listesi, kişide kısıt işareti (erisimiTazele). */
  // Kişide düz yetki alanları da: metin aynı kalıp yalnız düz alan değiştiyse (yönetici yetki verdi) kişi tazelensin.
  const ek = (alan: string, v: OgeBelgesi) =>
    alan === "kisiler"
      ? JSON.stringify([v.kisitli, v.hesapYoneticisi, v.pasif, v.hesapsiz, v.oncekiKimlik, v.yetkiler, v.yeniEposta, v.eposta])
      : JSON.stringify(v.m ?? []);
  const belgeIsle = (alan: string, id: string, v: (OgeBelgesi & { silindi?: boolean }) | undefined): boolean => {
    const m = onbellek[alan];
    if (!v || v.silindi) return m.delete(id);
    if (alan === "kisiler") kendimDegisti(id, v);
    const eski = m.get(id);
    if (eski && eski.j === v.j && eski.s === v.s && eski.e === ek(alan, v)) return false;
    const e = ek(alan, v);
    m.set(id, { s: v.s, j: v.j, o: eski && eski.j === v.j && eski.e === e ? eski.o : alan === "kisiler" ? kisiBelgedenOku(v) : JSON.parse(v.j), e });
    return !eski || eski.j !== v.j || eski.s !== v.s || eski.e !== e;
  };

  const diziDinle = (alan: string, mod: "tam" | "fark" | "suz") => {
    onbellek[alan] ??= new Map();
    const fark = mod === "fark";
    /*
     * Zaman sorgusunda "removed" silme değil: silme işaretle yazılıyor ve yeni
     * z'siyle sorguda kalıyor. Belge bu sorgudan yalnız kendi yazışımız
     * sunucuya varana dek çıkıyor (z bekleyen sunucu zamanı, ">" ile
     * karşılaştırılmıyor); silinmiş sayılsaydı kayıt o an ekrandan kalkıyor,
     * sayfa boşalıp başa dönüyordu (haftalık toplantıda her kararda).
     */
    const isle = (anahtar: string, zamanSorgusu = false) => (snap: QuerySnapshot<DocumentData>) => {
      let degisti = false;
      for (const c of snap.docChanges()) {
        if (c.type === "removed" && zamanSorgusu) continue;
        degisti = belgeIsle(alan, anahtarKimligi(c.doc.id), c.type === "removed" ? undefined : (c.doc.data() as OgeBelgesi)) || degisti;
      }
      if (degisti || !bagli) diziKur(alan);
      // Sunucudan bir kez tam gelen koleksiyon bu cihazda bundan sonra farkla okunur.
      if (fark && !snap.metadata.fromCache) tamOkunduYaz(alan);
      sunucuGeldi(alan, snap);
      geldi(anahtar, degisti);
    };
    bekle(alan);
    if (mod === "suz") {
      // Kısıtlı kişi: erişim listesinde kendisi (ya da hesaba bağlanmadan önceki kaydı) olan belgeler.
      const kosul = kimlikler.length > 1 ? where("m", "array-contains-any", kimlikler) : where("m", "array-contains", uid);
      iptal.push(onSnapshot(query(collection(db, alan), kosul), { includeMetadataChanges: true }, isle(alan), hata));
      return;
    }
    const tamDinle = () => {
      if (durdu) return;
      // Önbellekle sunucu aynıysa yalnız "fromCache" değişiyor; o görüntü de gelsin ki tam okunduğu yazılsın.
      // Önbellek görüntüsünden sonra sunucunun teyidi de gelsin (değişiklik olmasa da): sistemin yazışları onu bekliyor.
      iptal.push(onSnapshot(collection(db, alan), { includeMetadataChanges: true }, isle(alan), hata));
    };
    if (!fark || !tamOkundu(alan)) return tamDinle();
    getDocsFromCache(collection(db, alan))
      .then((snap) => {
        if (durdu) return;
        // Önbellek boşsa (silinmiş, başka tarayıcı profili) baştan tam okunur.
        if (snap.empty) return tamDinle();
        let enSon = 0;
        for (const b of snap.docs) {
          const v = b.data() as OgeBelgesi & { silindi?: boolean; z?: Timestamp | null };
          if (v.z) enSon = Math.max(enSon, v.z.toMillis());
          belgeIsle(alan, anahtarKimligi(b.id), v);
        }
        // Zamansız belge (fark okumadan önce yazılmış) zaten önbellekte; sorgu yalnız zamanlıları getiriyor.
        const esik = Timestamp.fromMillis(Math.max(0, enSon - FARK_PAYI));
        iptal.push(onSnapshot(query(collection(db, alan), where("z", ">", esik)), { includeMetadataChanges: true }, isle(alan, true), hata));
      })
      .catch(tamDinle);
  };

  /* Tek belgeyi dinler (kısıtlı kişinin kendi kaydı ve kendi ayarları). */
  const belgeDinle = (alan: string, anahtar: string, sonra: () => void) => {
    const k = `${alan}/${anahtar}`;
    bekle(k);
    iptal.push(
      onSnapshot(
        doc(db, alan, belgeKimligi(anahtar)),
        { includeMetadataChanges: true },
        (s) => {
          const degisti = belgeIsle(alan, anahtar, s.exists() ? (s.data() as OgeBelgesi) : undefined);
          if (degisti || !bagli) sonra();
          sunucuGeldi(k, s);
          geldi(k, degisti);
        },
        hata,
      ),
    );
  };

  const haritaKur = (alan: string) => {
    d = { ...d, [alan]: Object.fromEntries([...onbellek[alan].entries()].map(([k, x]) => [k, x.o])) };
  };
  const haritaDinle = (alan: string, onEk?: string) => {
    onbellek[alan] ??= new Map();
    bekle(alan);
    iptal.push(
      onSnapshot(
        onEk ? query(collection(db, alan), where(documentId(), ">=", onEk), where(documentId(), "<", `${onEk}\uf8ff`)) : collection(db, alan),
        { includeMetadataChanges: true },
        (snap) => {
          let degisti = false;
          for (const c of snap.docChanges()) {
            const id = anahtarKimligi(c.doc.id);
            const v = c.type === "removed" ? undefined : { s: 0, ...(c.doc.data() as { j: string }) };
            degisti = belgeIsle(alan, id, v) || degisti;
          }
          if (degisti || !bagli) haritaKur(alan);
          sunucuGeldi(alan, snap);
          geldi(alan, degisti);
        },
        hata,
      ),
    );
  };

  if (!kisitli) {
    // Muhasebenin koleksiyonları yalnız okuyabilene: kuralın reddi bütün dinlemeyi durdururdu.
    const muhasebe = muhasebeOkur(kendi);
    for (const alan of DIZI_ALANLARI) if (alan !== "postaMesajlari" && (muhasebe || !(MUHASEBE_ALANLARI as readonly string[]).includes(alan))) diziDinle(alan, farkAlaniMi(alan) ? "fark" : "tam");
    let postaAcik = false;
    postaBaslat = () => {
      if (postaAcik || durdu) return;
      postaAcik = true;
      diziDinle("postaMesajlari", "fark");
    };
    if (postaKullaniyor()) postaBaslat();
    /*
     * Kişiye bağlı ayarlar (ana sayfa düzeni, kısayollar, okundu, posta okuma izi…) yalnız kişinin kendisininki:
     * bu koleksiyonlarda fark sorgusu yok, her sekme her açılışta herkesinkini baştan okuyordu (50 kişide
     * açılış başına ~400 okuma); ücretsiz planın günlük 50.000 okuması posta açılmadan doluyordu. Tam yönetici
     * hepsini okuyor: kayıt temizliği herkesin başlık kısayoluna, hesap geçişi eski kimliğin ayarlarına bakıyor.
     */
    if (kendi.hesapYoneticisi) for (const alan of HARITA_ALANLARI) haritaDinle(alan);
    else
      for (const alan of HARITA_ALANLARI) {
        if (alan === "anaSayfa") haritaDinle(alan, `${belgeKimligi(uid)}:`);
        else {
          onbellek[alan] = new Map();
          belgeDinle(alan, uid, () => haritaKur(alan));
        }
      }
  } else {
    for (const alan of KISITLI_OKUR) diziDinle(alan, "suz");
    // Yapı (birim ve ünvan adları, akış) herkese açık.
    diziDinle("yapilar", "fark");
    // Eklenen şehirler: muhabirin ve paketlerin yeri adlansın diye herkese açık.
    diziDinle("sehirler", "fark");
    // Kişiler: personel ve kendisi; öbür muhabirler yok.
    onbellek.kisiler = new Map();
    bekle("kisiler");
    iptal.push(
      onSnapshot(
        query(collection(db, "kisiler"), where("kisitli", "==", false)),
        { includeMetadataChanges: true },
        (snap) => {
          let degisti = false;
          for (const c of snap.docChanges()) {
            const id = anahtarKimligi(c.doc.id);
            if (id === uid) continue;
            degisti = belgeIsle("kisiler", id, c.type === "removed" ? undefined : (c.doc.data() as OgeBelgesi)) || degisti;
          }
          if (degisti || !bagli) diziKur("kisiler");
          sunucuGeldi("kisiler", snap);
          geldi("kisiler", degisti);
        },
        hata,
      ),
    );
    belgeDinle("kisiler", uid, () => diziKur("kisiler"));
    // Kişiye bağlı ayarlar: yalnız kendi belgesi; ana sayfa düzeni birimin adıyla anahtarlı.
    for (const alan of ["okundu", "oneriGorunumu", "ortamlar", "kisayollar"]) {
      onbellek[alan] = new Map();
      belgeDinle(alan, uid, () => haritaKur(alan));
    }
    onbellek.anaSayfa = new Map();
    const birim = (JSON.parse(kendi.j) as { birim?: string }).birim ?? "muhabir";
    for (const anahtar of new Set([`${uid}:muhabir`, `${uid}:${birim}`])) belgeDinle("anaSayfa", anahtar, () => haritaKur("anaSayfa"));
  }

  bekle(GENEL.koleksiyon);
  iptal.push(
    onSnapshot(
      doc(db, GENEL.koleksiyon, GENEL.id),
      { includeMetadataChanges: true },
      (s) => {
        const sayac = (s.data()?.sayac as number | undefined) ?? 0;
        const birimler = s.data()?.muhabireOneriBirimleri as Birim[] | undefined;
        const geriBildirimAyari = s.data()?.geriBildirimAyari as Durum["geriBildirimAyari"];
        const newsdeskDevrede = s.data()?.newsdeskDevrede === true || undefined;
        const sayimBaslangici = (s.data()?.sayimBaslangici as string | undefined) || undefined;
        const gundemPaylasim = s.data()?.gundemPaylasim as Durum["gundemPaylasim"];
        const degisti =
          sayac !== d.sayac ||
          JSON.stringify(birimler) !== JSON.stringify(d.muhabireOneriBirimleri) ||
          JSON.stringify(geriBildirimAyari) !== JSON.stringify(d.geriBildirimAyari) ||
          newsdeskDevrede !== d.newsdeskDevrede ||
          sayimBaslangici !== d.sayimBaslangici ||
          JSON.stringify(gundemPaylasim) !== JSON.stringify(d.gundemPaylasim);
        if (degisti) d = { ...d, sayac, muhabireOneriBirimleri: birimler, geriBildirimAyari, newsdeskDevrede, sayimBaslangici, gundemPaylasim };
        sunucuGeldi(GENEL.koleksiyon, s);
        geldi(GENEL.koleksiyon, degisti);
      },
      hata,
    ),
  );

  /*
   * Tam yönetici açılışta erişim listelerini ve kişilerin kısıt işaretini
   * kayıtla eşitliyor: listeden önce yazılmış belgeler muhabire görünsün,
   * önerinin muhabiri değişince mesajı ve hareketi de ona geçsin. Yalnız
   * farklı olan belge yazılıyor.
   */
  function erisimiTazele() {
    const islemler: { alan: string; id: string; veri: Record<string, unknown> }[] = [];
    for (const alan of KISITLI_OKUR)
      for (const o of d[alan] as { id: string }[]) {
        const m = erisimListesi(alan, o, d);
        if (onbellek[alan]?.get(o.id)?.e !== JSON.stringify(m)) islemler.push({ alan, id: o.id, veri: { m } });
      }
    for (const [id, x] of onbellek.kisiler ?? []) {
      const k = kisitliJson(x.j);
      if (x.e !== String(k)) islemler.push({ alan: "kisiler", id, veri: { kisitli: k } });
    }
    for (let i = 0; i < islemler.length; i += 450) {
      const b = writeBatch(db);
      for (const x of islemler.slice(i, i + 450)) b.update(doc(db, x.alan, belgeKimligi(x.id)), x.veri);
      b.commit().catch((e) => console.error(e));
    }
  }

  /*
   * Yerel yazış: önce önbellek yeni duruma eşitleniyor; Firestore'un aynı
   * yazıyı geri yankılaması bir şey değiştirmiyor, ekran sıçramıyor.
   */
  function yaz(eski: Durum, yeni: Durum) {
    const sonuc = farkCikar(eski, yeni, siralar);
    siralar = sonuc.siralar;
    d = yeni;
    if (!sonuc.islemler.length) return;
    const nesne = (alan: string, id: string): unknown => {
      const deger = yeni[alan as keyof Durum];
      return Array.isArray(deger) ? (deger as { id: string }[]).find((o) => o.id === id) : (deger as Record<string, unknown> | undefined)?.[id];
    };
    for (const i of sonuc.islemler) {
      const m = onbellek[i.koleksiyon];
      if (!m) continue;
      const id = anahtarKimligi(i.id);
      if (i.tur === "sil") m.delete(id);
      else m.set(id, { s: (i.veri.s as number) ?? 0, j: i.veri.j as string, o: nesne(i.koleksiyon, id), e: ek(i.koleksiyon, i.veri as unknown as OgeBelgesi) });
    }
    // Bir toplu yazış en çok 500 işlem alıyor.
    for (let k = 0; k < sonuc.islemler.length; k += 450) {
      const b = writeBatch(db);
      for (const i of sonuc.islemler.slice(k, k + 450)) {
        const ref = doc(db, i.koleksiyon, i.id);
        // Fark okunan koleksiyonda silme de yazış: belge "silindi" işaretiyle kalıyor, fark sorgusu onu görsün.
        // Erişim listesi işarette kalıyor: kısıtlı kişi de silindiğini görsün, kural da ona yazdırsın.
        if (farkAlaniMi(i.koleksiyon)) b.set(ref, i.tur === "sil" ? { silindi: true, z: serverTimestamp(), ...(i.m ? { m: i.m } : {}) } : { ...i.veri, z: serverTimestamp() });
        else if (i.tur === "sil") b.delete(ref);
        else b.set(ref, i.veri);
      }
      b.commit().catch((e) => {
        console.error(e);
        window.dispatchEvent(new CustomEvent("trt-kayit-hatasi", { detail: hataKodu(e) }));
      });
    }
  }

  return () => {
    // Önbellekten sonra açılan fark dinleyicisi kapanıştan sonra kurulmasın.
    durdu = true;
    postaBaslat = null;
    postaGeldi = false;
    iptal.forEach((f) => f());
  };
};

/* --- Giriş, etkinleştirme, şifre --- */

export const sifreyleGir = (eposta: string, sifre: string) => {
  baslat();
  // Kod hesabı kullanıcı adıyla giriyor ("@" yoksa giriş adresine çevriliyor; girisKodu.ts).
  return signInWithEmailAndPassword(auth, girisAdresi(eposta), sifre);
};

export const sifreSifirla = (eposta: string, _dil?: string) => {
  baslat();
  // Davetle aynı şablon (İngilizce); bkz. baglantiGonder.
  auth.languageCode = "en";
  return sendPasswordResetEmail(auth, ePosta(eposta));
};

/*
 * Etkinleştirme e-postası artık giriş bağlantısı değil, "şifreni belirle"
 * (şifre sıfırlama) e-postası: Firebase'in ücretsiz planı günde yalnız 5
 * giriş bağlantısı gönderiyor, şifre sıfırlamada sınır 150. Davetliye
 * önce rastgele şifreli bir hesap açılıyor; e-postadaki bağlantıyla
 * şifresini kendisi belirleyip şifreyle giriyor (davet ilkKayit'te).
 *
 * Hesap ikinci bir Firebase örneğinde açılıyor: birincisinde açmak
 * yöneticinin oturumunu yeni hesaba çevirirdi.
 */
let hesapAcici: Auth | null = null;
const ikinciAuth = () => {
  if (hesapAcici) return hesapAcici;
  const a = firebaseAyari();
  const app = initializeApp({ apiKey: a.apiKey, authDomain: a.authDomain || `${a.projectId}.firebaseapp.com`, projectId: a.projectId, appId: a.appId }, "hesap-acici");
  hesapAcici = getAuth(app);
  if (a.emulator) connectAuthEmulator(hesapAcici, a.emulator.auth, { disableWarnings: true });
  return hesapAcici;
};

const rastgeleSifre = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));

/** Hesap yoksa rastgele şifreyle açıyor; varsa (daha önce davet edilmiş, kurucu) dokunmuyor. */
const hesapAc = async (e: string) => {
  const ia = ikinciAuth();
  try {
    await createUserWithEmailAndPassword(ia, e, rastgeleSifre());
  } catch (x) {
    if (hataKodu(x) !== "auth/email-already-in-use") throw x;
  } finally {
    await signOut(ia).catch(() => {});
  }
};

/* Şifre belirlendikten sonra Firebase'in sayfası buraya döndürüyor: giriş ekranı, e-posta hazır. */
const sifreDonusu = (eposta: string) => `${location.origin}${location.pathname}?giris=sifre&e=${encodeURIComponent(eposta)}`;

/** Etkinleştirme: davet edilene ya da (kurucu, süresi geçen davetli) kendisine "şifreni belirle" e-postası. */
export const baglantiGonder = async (eposta: string, _dil?: string) => {
  baslat();
  const e = ePosta(eposta);
  await hesapAc(e);
  // Şablon İngilizce (araclar/eposta-sablonu.mjs); dil verilirse Firebase kendi Türkçe/Arapça hazır metnini seçebiliyor.
  auth.languageCode = "en";
  await sendPasswordResetEmail(auth, e, { url: sifreDonusu(e) });
};

export const baglantiMi = () => {
  baslat();
  return isSignInWithEmailLink(auth, location.href);
};

export const baglantiylaGir = (eposta: string) => {
  baslat();
  return signInWithEmailLink(auth, ePosta(eposta), location.href);
};

export const sifreBelirle = (sifre: string) => {
  if (!auth.currentUser) return Promise.reject({ code: "auth/user-signed-out" });
  return updatePassword(auth.currentUser, sifre);
};

export const oturumuKapat = () => {
  baslat();
  return signOut(auth);
};

export const oturumdakiEposta = () => auth?.currentUser?.email ?? "";
/** Yapay zeka kapısına (yz.ts) giden oturum belgesi; Firebase süresi dolanı kendisi yeniliyor. */
export const oturumBelgesi = async () => (auth?.currentUser ? auth.currentUser.getIdToken() : null);

/** Tarayıcıda saklı oturum okununca: demodan "Giriş"e basan, oturumu açıksa şifre girmeden içeri. */
export const sakliOturum = async () => {
  baslat();
  await auth.authStateReady();
  return auth.currentUser?.email ?? "";
};

/* --- Davet --- */

export type DavetDurumu = "bekliyor" | "kullanildi" | "iptal";

export interface Davet {
  eposta: string;
  ad: Yazi;
  birim: BirimId;
  gorev: GorevId;
  rol: Rol;
  hesapYoneticisi: boolean;
  durum: DavetDurumu;
  davetEden: string;
  zaman: string;
  kullanan?: string;
  /** Hesaba bağlanan hesapsız kişinin kimliği; etkinleşince kaydı bu hesaba geçer (eylemler.ts → hesabaGecir). */
  kisiId?: string;
  /** E-postası değişen hesabın seçmeli yetkileri: yeni hesap aynı yetkilerle açılsın (kural davetle karşılaştırıyor). */
  yetkiler?: HesapYetkisi[];
  /** Kod davetinde (girisKodu.ts) kod, kullanıcı adı ve son geçerlilik (ms; kural kaydı kurarken karşılaştırıyor). */
  kod?: string;
  kullanici?: string;
  bitis?: number;
}

/**
 * İlk giriş: kişi kaydı davetten (ya da kurucuysa yapılandırmadan) kuruluyor
 * ve davet "kullanıldı" oluyor; ikisi tek yazışta. Kurallar ikisini de
 * denetliyor (firestore.rules).
 */
export const ilkKayit = async (verilen?: KayitBilgisi | null): Promise<KisiHali | "davetYok" | "dogrulanmadi"> => {
  const u = auth.currentUser;
  if (!u?.email) return "davetYok";
  const hal = await kisiHali(u);
  if (hal !== "yok") return hal;
  const eposta = ePosta(u.email);
  const davetRef = doc(db, "davetler", eposta);
  const davet = await getDoc(davetRef).then(
    (s) => (s.exists() ? (s.data() as Davet) : null),
    () => null,
  );
  const kisiRef = doc(db, "kisiler", u.uid);
  // Süresi geçmiş kod daveti: kural da reddediyor, kişiye "davet yok" görünsün.
  if (davet?.durum === "bekliyor" && !(davet.bitis && Date.now() > davet.bitis)) {
    const k = {
      ...yeniKisi({ id: u.uid, ad: davet.ad, eposta, birim: davet.birim, gorev: davet.gorev, rol: davet.rol, hesapYoneticisi: davet.hesapYoneticisi }),
      ...(davet.kisiId ? { oncekiKimlik: davet.kisiId } : {}),
      ...(davet.yetkiler?.length ? { yetkiler: davet.yetkiler } : {}),
    };
    const b = writeBatch(db);
    b.set(kisiRef, ogeBelgesi("kisiler", k, Date.now()));
    b.update(davetRef, { durum: "kullanildi", kullanan: u.uid });
    await b.commit();
    return "etkin";
  }
  const kurucu = ePosta(firebaseAyari().kurucu);
  if (kurucu && eposta === kurucu) {
    const ad = eposta.split("@")[0];
    const k = yeniKisi({ id: u.uid, ad: { tr: ad, ar: ad, en: ad }, eposta, birim: "planlama", gorev: "planlamaci", rol: "yonetici", hesapYoneticisi: true });
    await setDoc(kisiRef, ogeBelgesi("kisiler", k, Date.now()));
    return "etkin";
  }
  // Kayıt bağlantısı: bilgileri kişi girdi; yetkisiz personel olarak açılıyor, yönetici sonra düzeltiyor.
  const kayit = verilen ?? kayitBilgisiOku() ?? (await basvuruOku(eposta).catch(() => null));
  const baglanti = kayit ? await kayitBaglantisiOku(kayit.kod).catch(() => null) : null;
  if (kayit && baglanti && kayitAcik(baglanti)) {
    // Kural e-postanın sahibi olduğunu istiyor; doğrulamadan önce kayıt kurulmuyor.
    if (!u.emailVerified) return "dogrulanmadi";
    const k = {
      ...yeniKisi({ id: u.uid, ad: kayit.ad, eposta, birim: kayit.birim, gorev: kayit.gorev, rol: "personel", hesapYoneticisi: false }),
      kayitKodu: kayit.kod,
      kontrolBekliyor: true,
    };
    await setDoc(kisiRef, ogeBelgesi("kisiler", k, Date.now()));
    try {
      localStorage.removeItem(BEKLEYEN_KAYIT);
    } catch {
      /* yok */
    }
    return "etkin";
  }
  return "davetYok";
};

export const davetEt = async (d: Omit<Davet, "durum" | "zaman" | "eposta"> & { eposta: string }, dil: string) => {
  const eposta = ePosta(d.eposta);
  // Firestore undefined saklamıyor: kisiId yoksa alan hiç yazılmıyor.
  const { kisiId, yetkiler, ...geri } = d;
  const kayit: Davet = { ...geri, ...(kisiId ? { kisiId } : {}), ...(yetkiler?.length ? { yetkiler } : {}), eposta, durum: "bekliyor", zaman: new Date().toISOString() };
  await setDoc(doc(db, "davetler", eposta), kayit);
  await baglantiGonder(eposta, dil);
};

export const davetIptal = async (eposta: string) => {
  const r = doc(db, "davetler", ePosta(eposta));
  const d = await getDoc(r).then((s) => (s.exists() ? (s.data() as Davet) : null));
  await updateDoc(r, { durum: "iptal" });
  // Kod davetinde kodun okuma belgesi de gitsin: iptal edilen kod "geçerli" görünmesin.
  if (d?.kod) await deleteDoc(doc(db, "girisKodlari", d.kod)).catch(() => {});
};

/* --- Giriş kodu (girisKodu.ts): e-postasız hesap --- */

/** Kodu bilenin (oturumsuz) okuduğu belge: hangi hesaba ait, ne zamana kadar geçerli. */
export interface GirisKodu {
  eposta: string;
  kullanici: string;
  bitis: number;
}

export interface KodDaveti extends Omit<Davet, "durum" | "zaman" | "eposta"> {
  kullanici: string;
}

/*
 * Kod davetiyle hesap: ikinci Firebase örneğinde hesap koddan türeyen şifreyle
 * açılıyor, davet ve kodun okuma belgesi yazılıyor. Kullanıcı adı alınmışsa
 * (hesap zaten var) hata: başkasının hesabına yeni kod yazılmasın.
 */
export const kodlaDavetEt = async (d: KodDaveti): Promise<GirisKodu & { kod: string }> => {
  baslat();
  const eposta = kullaniciAdresi(d.kullanici);
  const kod = girisKoduUret();
  const bitis = Date.now() + KOD_SURESI_SAAT * 3600_000;
  const ia = ikinciAuth();
  try {
    await createUserWithEmailAndPassword(ia, eposta, kodSifresi(kod));
  } catch (x) {
    throw hataKodu(x) === "auth/email-already-in-use" ? { code: "kod/kullanici-var" } : x;
  } finally {
    await signOut(ia).catch(() => {});
  }
  const { kisiId, yetkiler, kullanici, ...geri } = d;
  const davet: Davet = {
    ...geri,
    ...(kisiId ? { kisiId } : {}),
    ...(yetkiler?.length ? { yetkiler } : {}),
    eposta,
    durum: "bekliyor",
    zaman: new Date().toISOString(),
    kod,
    kullanici,
    bitis,
  };
  await setDoc(doc(db, "davetler", eposta), davet);
  await setDoc(doc(db, "girisKodlari", kod), { eposta, kullanici, bitis } satisfies GirisKodu);
  return { kod, eposta, kullanici, bitis };
};

/*
 * Kullanılmamış kod davetine yeni kod (süresi geçti, kişiye ulaşmadı): hesabın
 * şifresi hâlâ eski koddan, yöneticinin tarayıcısı onunla girip şifreyi yeni
 * koda çeviriyor. Kişi şifresini belirlemişse eski kod girmez; o zaman yeni
 * kullanıcı adıyla yeni kod verilir (Kullanicilar.tsx → YeniKodPenceresi).
 */
export const kodYenile = async (eposta: string): Promise<GirisKodu & { kod: string }> => {
  baslat();
  const r = doc(db, "davetler", ePosta(eposta));
  const d = await getDoc(r).then((s) => (s.exists() ? (s.data() as Davet) : null));
  if (!d?.kod || d.durum !== "bekliyor") throw { code: "kod/kullanilmis" };
  const kod = girisKoduUret();
  const bitis = Date.now() + KOD_SURESI_SAAT * 3600_000;
  const ia = ikinciAuth();
  try {
    const u = await signInWithEmailAndPassword(ia, d.eposta, kodSifresi(d.kod)).catch(() => {
      throw { code: "kod/kullanilmis" };
    });
    await updatePassword(u.user, kodSifresi(kod));
  } finally {
    await signOut(ia).catch(() => {});
  }
  await updateDoc(r, { kod, bitis });
  await deleteDoc(doc(db, "girisKodlari", d.kod)).catch(() => {});
  const kullanici = d.kullanici ?? d.eposta.split("@")[0];
  await setDoc(doc(db, "girisKodlari", kod), { eposta: d.eposta, kullanici, bitis } satisfies GirisKodu);
  return { kod, eposta: d.eposta, kullanici, bitis };
};

export const koduOku = async (kod: string): Promise<GirisKodu | null> => {
  baslat();
  const s = await getDoc(doc(db, "girisKodlari", kod));
  return s.exists() ? (s.data() as GirisKodu) : null;
};

/** Kodla giriş: şifresi koddan; yanlışsa kod kullanılmış (kişi şifresini belirlemiş). */
export const kodlaGir = async (kod: string, k: GirisKodu) => {
  baslat();
  await signInWithEmailAndPassword(auth, k.eposta, kodSifresi(kod)).catch((x) => {
    const h = hataKodu(x);
    throw h === "auth/invalid-credential" || h === "auth/wrong-password" ? { code: "kod/kullanilmis" } : x;
  });
};

/** Şifresini belirleyen kişi kodun okuma belgesini siliyor: kod artık hiçbir işe yaramıyor. */
export const koduKapat = (kod: string) => deleteDoc(doc(db, "girisKodlari", kod));

export const davetleriIzle = (f: (l: Davet[]) => void, hataGeldi: (kod: string) => void) =>
  onSnapshot(
    collection(db, "davetler"),
    (s) => f(s.docs.map((x) => x.data() as Davet).sort((a, b) => b.zaman.localeCompare(a.zaman))),
    (e) => hataGeldi(hataKodu(e)),
  );

/* --- Kayıt bağlantısı --- */

/**
 * Davetin yanında ikinci yol: hesap yöneticisi paylaşılabilir bir bağlantı
 * açıyor; bağlantıyı açan kişi adını, birimini ve görevini kendisi girip
 * e-postasına gelen bağlantıyla etkinleşiyor. Rolü personel, hesap
 * yöneticisi değil; yönetici "Düzenle" ile düzeltiyor. Bağlantı süreli ve
 * yönetici istediğinde kapatıyor (firestore.rules → kayitGecerli).
 */
export interface KayitBaglantisi {
  kod: string;
  acik: boolean;
  /** Son geçerlilik, milisaniye; kural `request.time` ile karşılaştırıyor. */
  bitis: number;
  olusturan: string;
  zaman: string;
}

/** Kişinin kendi girdiği bilgiler; e-posta bağlantısının dönüş adresinde taşınıyor, başka cihazda açılsa da kaybolmasın. */
export interface KayitBilgisi {
  kod: string;
  ad: Metin;
  birim: BirimId;
  gorev: GorevId;
}

export const KAYIT_SURESI_GUN = 7;

export const kayitAcik = (b: KayitBaglantisi) => b.acik && Date.now() < b.bitis;

export const kayitAdresi = (kod: string) => `${location.origin}${location.pathname}#/kayit/${kod}`;

/* Tahmin edilemeyen kod: bağlantıyı bilen kayıt olabiliyor. */
const yeniKod = () => {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return [...a].map((x) => x.toString(16).padStart(2, "0")).join("");
};

export const kayitBaglantisiOlustur = async (olusturan: string) => {
  const kod = yeniKod();
  const b: KayitBaglantisi = { kod, acik: true, bitis: Date.now() + KAYIT_SURESI_GUN * 864e5, olusturan, zaman: new Date().toISOString() };
  await setDoc(doc(db, "kayitBaglantilari", kod), b);
  return b;
};

export const kayitBaglantisiKapat = (kod: string) => updateDoc(doc(db, "kayitBaglantilari", kod), { acik: false });

export const kayitBaglantilariIzle = (f: (l: KayitBaglantisi[]) => void, hataGeldi: (kod: string) => void) =>
  onSnapshot(
    collection(db, "kayitBaglantilari"),
    (s) => f(s.docs.map((x) => x.data() as KayitBaglantisi).sort((a, b) => b.zaman.localeCompare(a.zaman))),
    (e) => hataGeldi(hataKodu(e)),
  );

export const kayitBaglantisiOku = async (kod: string) => {
  baslat();
  const s = await getDoc(doc(db, "kayitBaglantilari", kod));
  return s.exists() ? (s.data() as KayitBaglantisi) : null;
};

/*
 * Kayıt bağlantısıyla gelen kişi şifresini formda belirliyor; hesabı açılıp
 * adresine doğrulama e-postası gidiyor (günlük sınırı 1000; giriş bağlantısı
 * 5). Doğrulayıp şifreyle girince kaydı kuruluyor (ilkKayit, kural
 * e-postanın doğrulanmasını istiyor). Bilgiler hem doğrulamanın dönüş
 * adresinde hem bu tarayıcıda: kişi bağlantıya başka cihazda basabilir.
 */
const BEKLEYEN_KAYIT = "trt-planlama-kayit-bekleyen";
const kayitAdresi_ = (e: string, bilgi: KayitBilgisi) => `${sifreDonusu(e)}&kayit=${encodeURIComponent(JSON.stringify(bilgi))}`;

export const kayitOl = async (eposta: string, sifre: string, bilgi: KayitBilgisi, dil: string) => {
  baslat();
  auth.languageCode = dil;
  const e = ePosta(eposta);
  // Önce başvuru: hesap zaten varsa da bilgiler kalsın, kişi şifresiyle girince kaydı kurulsun.
  await basvuruKaydet(e, bilgi);
  let user: User;
  try {
    user = (await createUserWithEmailAndPassword(auth, e, sifre)).user;
  } catch (x) {
    if (hataKodu(x) !== "auth/email-already-in-use") throw x;
    // Önceki deneme hesabı açıp e-postayı gönderemediyse: aynı şifreyle doğrulanmamış hesaba yeniden gönderiliyor.
    const u = await signInWithEmailAndPassword(auth, e, sifre).then(
      (c) => c.user,
      () => null,
    );
    // Aynı şifre ve doğrulanmış e-posta: kişi zaten kendisi; oturum açık kalıyor, sayfa kaydı kurup içeri alıyor.
    if (u?.emailVerified) return "girildi" as const;
    if (!u) {
      /*
       * Hesap önceki bir denemede (davet ya da başka şifreyle) açılmış. Kişiyi "Şifremi unuttum"a
       * yollamak yerine şifre belirleme e-postası buradan gidiyor; o bağlantı e-postayı da
       * doğrulanmış sayıyor, kişi yeni şifresiyle girince kaydı başvurudan kuruluyor.
       */
      auth.languageCode = "en";
      await sendPasswordResetEmail(auth, e, { url: sifreDonusu(e) });
      throw { code: "kayit/sifre-gitti" };
    }
    user = u;
  }
  try {
    localStorage.setItem(BEKLEYEN_KAYIT, JSON.stringify(bilgi));
  } catch {
    /* özel pencere: bilgi yine dönüş adresinde */
  }
  try {
    await sendEmailVerification(user, { url: kayitAdresi_(e, bilgi) });
  } finally {
    // Kişi doğrulayıp şifresiyle girecek; demo açıkken oturum açık kalmasın.
    await signOut(auth).catch(() => {});
  }
  return "gonderildi" as const;
};

/** Doğrulama e-postası gitmediyse ya da kaybolduysa: oturumdaki (doğrulanmamış) kişiye yeniden. */
export const dogrulamaGonder = async (dil: string) => {
  const u = auth.currentUser;
  if (!u?.email) throw { code: "auth/user-signed-out" };
  auth.languageCode = dil;
  const bilgi = kayitBilgisiOku();
  await sendEmailVerification(u, { url: bilgi ? kayitAdresi_(ePosta(u.email), bilgi) : sifreDonusu(ePosta(u.email)) });
};

/* Bilgi kişinin elinden geçti (adres, tarayıcı, başvuru belgesi): yalnız biçimi tutan birim ve görev kabul. */
const kayitBilgisiCoz = (b: Partial<KayitBilgisi> | null | undefined): KayitBilgisi | null => {
  if (!b) return null;
  // Birim ve ünvan yöneticinin açtıkları da olabilir (yapi.ts); yalnız biçim denetleniyor.
  const kimlikGibi = (x: unknown): x is string => typeof x === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(x);
  if (typeof b.kod !== "string" || !kimlikGibi(b.birim) || !kimlikGibi(b.gorev)) return null;
  const ad = (x: unknown) => (typeof x === "string" ? x.trim().slice(0, 80) : "");
  const m = (typeof b.ad === "object" ? b.ad : {}) as Partial<Metin>;
  const tr = ad(m.tr) || ad(m.en) || ad(m.ar);
  if (!tr) return null;
  return { kod: b.kod, birim: b.birim, gorev: b.gorev, ad: { tr, ar: ad(m.ar) || tr, en: ad(m.en) || tr } };
};

export const kayitBilgisiOku = (): KayitBilgisi | null => {
  try {
    let ham = new URLSearchParams(location.search).get("kayit");
    if (!ham)
      try {
        ham = localStorage.getItem(BEKLEYEN_KAYIT);
      } catch {
        ham = null;
      }
    return ham ? kayitBilgisiCoz(JSON.parse(ham)) : null;
  } catch {
    return null;
  }
};

/*
 * Başvuru: formdaki bilgiler e-posta adresiyle Firestore'da da duruyor
 * (`kayitBasvurulari/<e-posta>`). Kişi doğrulama bağlantısına başka cihazda
 * basabilir, hesabı önceden açılmış olabilir ya da şifresini "Şifremi
 * unuttum"la belirleyebilir; hangi yoldan girerse girsin kaydı bununla
 * kuruluyor. Kural yalnız açık kayıt bağlantısıyla yazdırıyor; kaydı
 * kurmak yine e-postanın doğrulanmasını istiyor (kişiler kuralı).
 */
const basvuruKaydet = (e: string, b: KayitBilgisi) => setDoc(doc(db, "kayitBasvurulari", e), { ...b, zaman: new Date().toISOString() });
const basvuruOku = async (e: string) => kayitBilgisiCoz((await getDoc(doc(db, "kayitBasvurulari", e))).data() as Partial<KayitBilgisi> | undefined);
