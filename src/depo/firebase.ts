import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
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
import { bosDurum, disaridanGeldi, uzakDepoyuTak, yeniKisi, type Birim, type BirimId, type Durum, type GorevId, type Rol } from "../veri";
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
        const degisti = sayac !== d.sayac || JSON.stringify(birimler) !== JSON.stringify(d.muhabireOneriBirimleri);
        if (degisti) d = { ...d, sayac, muhabireOneriBirimleri: birimler };
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

/* E-posta bağlantısı uygulamaya bu adresle dönüyor; adres kişinin e-postasını taşıyor, başka tarayıcıda açılsa da sorulmasın. */
const donusAdresi = (eposta: string) => `${location.origin}${location.pathname}?giris=baglanti&e=${encodeURIComponent(eposta)}`;

export const sifreyleGir = (eposta: string, sifre: string) => {
  baslat();
  return signInWithEmailAndPassword(auth, ePosta(eposta), sifre);
};

export const sifreSifirla = (eposta: string, dil: string) => {
  baslat();
  auth.languageCode = dil;
  return sendPasswordResetEmail(auth, ePosta(eposta));
};

/** Etkinleştirme bağlantısı: davet edilene ya da (kurucu, süresi geçen davetli) kendisine. */
export const baglantiGonder = (eposta: string, dil: string) => {
  baslat();
  auth.languageCode = dil;
  return sendSignInLinkToEmail(auth, ePosta(eposta), { url: donusAdresi(ePosta(eposta)), handleCodeInApp: true });
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
}

/**
 * İlk giriş: kişi kaydı davetten (ya da kurucuysa yapılandırmadan) kuruluyor
 * ve davet "kullanıldı" oluyor; ikisi tek yazışta. Kurallar ikisini de
 * denetliyor (firestore.rules).
 */
export const ilkKayit = async (kayit: KayitBilgisi | null = kayitBilgisiOku()): Promise<KisiHali | "davetYok"> => {
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
  const baglanti = kayit ? await kayitBaglantisiOku(kayit.kod).catch(() => null) : null;
  if (kayit && baglanti && kayitAcik(baglanti)) {
    const k = {
      ...yeniKisi({ id: u.uid, ad: kayit.ad, eposta, birim: kayit.birim, gorev: kayit.gorev, rol: "personel", hesapYoneticisi: false }),
      kayitKodu: kayit.kod,
      kontrolBekliyor: true,
    };
    await setDoc(kisiRef, ogeBelgesi("kisiler", k, Date.now()));
    return "etkin";
  }
  return "davetYok";
};

export const davetEt = async (d: Omit<Davet, "durum" | "zaman" | "eposta"> & { eposta: string }, dil: string) => {
  const eposta = ePosta(d.eposta);
  // Firestore undefined saklamıyor: kisiId yoksa alan hiç yazılmıyor.
  const { kisiId, ...geri } = d;
  const kayit: Davet = { ...geri, ...(kisiId ? { kisiId } : {}), eposta, durum: "bekliyor", zaman: new Date().toISOString() };
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

export const kayitBaglantisiGonder = (eposta: string, bilgi: KayitBilgisi, dil: string) => {
  baslat();
  auth.languageCode = dil;
  const e = ePosta(eposta);
  return sendSignInLinkToEmail(auth, e, { url: `${donusAdresi(e)}&kayit=${encodeURIComponent(JSON.stringify(bilgi))}`, handleCodeInApp: true });
};

/* Dönüş adresindeki bilgi kişinin elinden geçti: yalnız tanınan birim ve görev kabul. */
export const kayitBilgisiOku = (): KayitBilgisi | null => {
  try {
    const ham = new URLSearchParams(location.search).get("kayit");
    if (!ham) return null;
    // Birim ve ünvan yöneticinin açtıkları da olabilir (yapi.ts); yalnız biçim denetleniyor.
    const kimlikGibi = (x: unknown) => typeof x === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(x);
    const b = JSON.parse(ham) as KayitBilgisi;
    if (typeof b.kod !== "string" || !kimlikGibi(b.birim) || !kimlikGibi(b.gorev)) return null;
    const ad = (x: unknown) => (typeof x === "string" ? x.trim().slice(0, 80) : "");
    const tr = ad(b.ad?.tr) || ad(b.ad?.en) || ad(b.ad?.ar);
    if (!tr) return null;
    return { kod: b.kod, birim: b.birim, gorev: b.gorev, ad: { tr, ar: ad(b.ad.ar) || tr, en: ad(b.ad.en) || tr } };
  } catch {
    return null;
  }
};
