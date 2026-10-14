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
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import type { Metin, Yazi } from "../dil";
import { firebaseAyari } from "../firebase-ayar";
import { hesabaGecir } from "../eylemler";
import { gercekDurumuYaz } from "../kip";
import { cikisYap, girisYap } from "../oturum";
import { bosDurum, disaridanGeldi, uzakDepoyuTak, yeniKisi, type Birim, type BirimId, type Durum, type GorevId, type HesapYetkisi, type Rol } from "../veri";
import { DIZI_ALANLARI, GENEL, HARITA_ALANLARI, anahtarKimligi, farkCikar, ogeBelgesi, type OgeBelgesi, type Siralar } from "./fark";

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
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
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
      const hal = await kisiHali(u);
      if (hal !== "etkin") {
        gercekDurumuYaz({ tur: hal === "pasif" ? "pasif" : "giris" });
        return;
      }
      kopar = kayitBagla(() => {
        girisYap(u.uid);
        // Hesapsız kaydı bu hesaba bağlandıysa geçmiş bir kez taşınıyor.
        hesabaGecir(u.uid);
        gercekDurumuYaz({ tur: "hazir" });
      });
    } catch (e) {
      gercekDurumuYaz({ tur: "hata", kod: hataKodu(e) });
    }
  });
};

export const hataKodu = (e: unknown) => (e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "bilinmeyen");

/* --- Kayıt --- */

interface Onbellek {
  s: number;
  j: string;
  o: unknown;
}

/**
 * Koleksiyonları dinler, `Durum`'u kurar. Hepsinden ilk görüntü gelince
 * depo veri.ts'e takılıyor; sonraki değişiklikler (başka kişi ya da bölme)
 * yalnız değişen öğelerle yeniden çiziliyor: değişmeyen öğenin nesnesi
 * aynı kalıyor, fark da nesne kimliğiyle çıktığı için.
 */
const kayitBagla = (hazir: () => void): (() => void) => {
  const onbellek: Record<string, Map<string, Onbellek>> = {};
  let siralar: Siralar = {};
  let d: Durum = bosDurum();
  const bekleyen = new Set<string>([...DIZI_ALANLARI, ...HARITA_ALANLARI, GENEL.koleksiyon]);
  let bagli = false;
  const iptal: Unsubscribe[] = [];

  const geldi = (alan: string, degisti: boolean) => {
    if (!bagli) {
      bekleyen.delete(alan);
      if (bekleyen.size) return;
      bagli = true;
      uzakDepoyuTak({ yaz }, d);
      hazir();
    } else if (degisti) disaridanGeldi(d);
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

  for (const alan of DIZI_ALANLARI) {
    const m = (onbellek[alan] = new Map());
    iptal.push(
      onSnapshot(
        collection(db, alan),
        (snap) => {
          let degisti = false;
          for (const c of snap.docChanges()) {
            const id = anahtarKimligi(c.doc.id);
            if (c.type === "removed") {
              degisti = m.delete(id) || degisti;
              continue;
            }
            const v = c.doc.data() as OgeBelgesi;
            const eski = m.get(id);
            if (eski && eski.j === v.j && eski.s === v.s) continue;
            m.set(id, { s: v.s, j: v.j, o: eski && eski.j === v.j ? eski.o : JSON.parse(v.j) });
            degisti = true;
          }
          if (degisti || !bagli) {
            const liste = [...m.entries()].sort((a, b) => a[1].s - b[1].s || (a[0] < b[0] ? -1 : 1));
            siralar = { ...siralar, [alan]: new Map(liste.map(([id, x]) => [id, x.s])) };
            d = { ...d, [alan]: liste.map(([, x]) => x.o) };
          }
          geldi(alan, degisti);
        },
        hata,
      ),
    );
  }

  for (const alan of HARITA_ALANLARI) {
    const m = (onbellek[alan] = new Map());
    iptal.push(
      onSnapshot(
        collection(db, alan),
        (snap) => {
          let degisti = false;
          for (const c of snap.docChanges()) {
            const id = anahtarKimligi(c.doc.id);
            if (c.type === "removed") {
              degisti = m.delete(id) || degisti;
              continue;
            }
            const j = (c.doc.data() as { j: string }).j;
            const eski = m.get(id);
            if (eski && eski.j === j) continue;
            m.set(id, { s: 0, j, o: JSON.parse(j) });
            degisti = true;
          }
          if (degisti || !bagli) d = { ...d, [alan]: Object.fromEntries([...m.entries()].map(([k, x]) => [k, x.o])) };
          geldi(alan, degisti);
        },
        hata,
      ),
    );
  }

  iptal.push(
    onSnapshot(
      doc(db, GENEL.koleksiyon, GENEL.id),
      (s) => {
        const sayac = (s.data()?.sayac as number | undefined) ?? 0;
        const birimler = s.data()?.muhabireOneriBirimleri as Birim[] | undefined;
        const geriBildirimAyari = s.data()?.geriBildirimAyari as Durum["geriBildirimAyari"];
        const degisti =
          sayac !== d.sayac || JSON.stringify(birimler) !== JSON.stringify(d.muhabireOneriBirimleri) || JSON.stringify(geriBildirimAyari) !== JSON.stringify(d.geriBildirimAyari);
        if (degisti) d = { ...d, sayac, muhabireOneriBirimleri: birimler, geriBildirimAyari };
        geldi(GENEL.koleksiyon, degisti);
      },
      hata,
    ),
  );

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
      else m.set(id, { s: (i.veri.s as number) ?? 0, j: i.veri.j as string, o: nesne(i.koleksiyon, id) });
    }
    // Bir toplu yazış en çok 500 işlem alıyor.
    for (let k = 0; k < sonuc.islemler.length; k += 450) {
      const b = writeBatch(db);
      for (const i of sonuc.islemler.slice(k, k + 450)) {
        const ref = doc(db, i.koleksiyon, i.id);
        if (i.tur === "sil") b.delete(ref);
        else b.set(ref, i.veri);
      }
      b.commit().catch((e) => {
        console.error(e);
        window.dispatchEvent(new CustomEvent("trt-kayit-hatasi", { detail: hataKodu(e) }));
      });
    }
  }

  return () => iptal.forEach((f) => f());
};

/* --- Giriş, etkinleştirme, şifre --- */

export const sifreyleGir = (eposta: string, sifre: string) => {
  baslat();
  return signInWithEmailAndPassword(auth, ePosta(eposta), sifre);
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
  if (davet?.durum === "bekliyor") {
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

export const davetIptal = (eposta: string) => updateDoc(doc(db, "davetler", ePosta(eposta)), { durum: "iptal" });

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
