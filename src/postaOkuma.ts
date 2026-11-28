import type { Durum, PostaMesaji } from "./veri";
import { GERCEK } from "./kip";
import { staffingTarihi } from "./staffing";

/*
 * Postanın okundu bilgisi (kullanıcı: hangi posta okunmuş, hangisi okunmamış
 * görünmüyordu). Kişiye bağlı, kayıtta (telefonda okunan bilgisayarda da
 * okunmuş). Saklanan mesaj başına işaret değil, iplik başına son bakılan an:
 * ondan yeni gelen posta okunmamış; giden hiç sayılmaz. İlk açılışta taban
 * dünden: yoksa kutudaki eski yüzlerce posta birden okunmamış görünürdü.
 * Grup da burada: kişinin grubu kapıdan geliyor, menü sayısı onu beklemesin.
 */
export interface PostaOkuma {
  /** Bundan eski posta okunmuş sayılır (iplikte ayrı an yoksa). */
  taban: string;
  /** Kişinin grup adresi (gerçek kipte); menü sayısı yalnız bu gruptaki postayı sayar. */
  grup?: string;
  /** İplik (konuKimligi) → son bakılan an. */
  k: Record<string, string>;
  /*
   * Kişinin kendi kutusunda (Outlook) okunmamış postalar: son çekişte kapının
   * verdiği Message-ID'lerden kayıttakilerle kesişenler (kullanıcı: ana sayfadaki
   * sayı okunmamışlar olsun; postalar Outlook'ta okununca burada okunmamış kalıyor,
   * sayı toplam gibi büyüyordu). `zaman` o çekişin anı: ondan sonra gelen posta
   * Outlook'ta henüz sorulmadığı için eski kurala göre sayılır.
   */
  outlook?: { zaman: string; idler: string[] };
}

/** İlk açılışta son bir günün postası okunmamış görünsün. */
export const ILK_TABAN_SAAT = 24;

const outlookKumeleri = new WeakMap<object, Set<string>>();
const outlookKumesi = (x: { idler: string[] }) => {
  let s = outlookKumeleri.get(x);
  if (!s) outlookKumeleri.set(x, (s = new Set(x.idler)));
  return s;
};

/*
 * Okunmamış: burada açılmamış (iplikteki son bakıştan yeni) ve, Outlook'un bilgisi
 * varsa, kişinin kutusunda da okunmamış. Message-ID'siz ya da son çekişten sonra
 * gelen posta yalnız ilk kurala göre.
 */
export const okunmamisMi = (o: PostaOkuma | undefined, m: PostaMesaji): boolean => {
  if (!o || m.giden || m.zaman <= (o.k[m.konuKimligi] ?? o.taban)) return false;
  if (!o.outlook || !m.mesajKimligi || m.zaman > o.outlook.zaman) return true;
  return outlookKumesi(o.outlook).has(m.mesajKimligi);
};

/** Çekişten sonra: kayıttaki postalardan kişinin kutusunda okunmamış olanlar. Değişiklik yoksa null. */
export const outlookOkunmamisYaz = (o: PostaOkuma, mesajlar: PostaMesaji[], okunmamis: string[], zaman: string): PostaOkuma | null => {
  const kutu = new Set(okunmamis);
  const idler = [...new Set(mesajlar.filter((m) => !m.giden && m.mesajKimligi && kutu.has(m.mesajKimligi)).map((m) => m.mesajKimligi!))].sort();
  const eski = o.outlook?.idler ?? [];
  // Küme aynı ve önceki çekişten sonra yeni posta yoksa yazılmaz: her çekişte belge yazılmasın.
  const yeniVar = !!o.outlook && mesajlar.some((m) => !m.giden && m.zaman > o.outlook!.zaman);
  if (o.outlook && !yeniVar && eski.length === idler.length && eski.every((x, i) => x === idler[i])) return null;
  return { ...o, outlook: { zaman, idler } };
};

/*
 * Kişinin gördüğü postalar: gerçek kipte yalnız kendi grubununkiler (Posta ekranının süzgeci).
 * Staffing postası herkese gidiyor, Message-ID'si bir kez işleniyor: önce çeken başka birimin
 * grubuna yazılınca planlamacının listesinde hiç görünmüyordu (kullanıcı). Grubu sorulmaz.
 */
export const gorunenPostalar = (d: Pick<Durum, "postaMesajlari">, grup: string | undefined): PostaMesaji[] =>
  (d.postaMesajlari ?? []).filter((m) => !GERCEK || (!!grup && (m.grup === grup || (!m.giden && !!staffingTarihi(m.konu)))));

/** Menüdeki sayı: okunmamış posta sayısı. Posta hiç açılmamışsa sayı yok. */
export const okunmamisSayisi = (d: Pick<Durum, "postaMesajlari" | "postaOkunan">, kisiId: string): number => {
  const o = d.postaOkunan?.[kisiId];
  if (!o) return 0;
  return gorunenPostalar(d, o.grup).filter((m) => okunmamisMi(o, m)).length;
};

/** İplikleri okundu say: her birine son postasının anı. Değişiklik yoksa null (yazış yok). */
export const okunduYap = (o: PostaOkuma, kimlikler: string[], zaman: string): PostaOkuma | null => {
  if (kimlikler.every((k) => (o.k[k] ?? o.taban) >= zaman)) return null;
  const k = { ...o.k };
  for (const x of kimlikler) if ((k[x] ?? o.taban) < zaman) k[x] = zaman;
  return { ...o, k };
};

/** Okunmadı yap: son gelen postanın hemen öncesine çek. */
export const okunmadiYap = (o: PostaOkuma, kimlikler: string[], sonGelen: string, mesajKimligi?: string): PostaOkuma => {
  const once = new Date(new Date(sonGelen).getTime() - 1).toISOString();
  const k = { ...o.k };
  for (const x of kimlikler) k[x] = once;
  // Outlook'ta okunmuş posta da yeniden okunmamış görünsün (bir sonraki çekişte Outlook'unki yeniden geçerli).
  const outlook = o.outlook && mesajKimligi && !o.outlook.idler.includes(mesajKimligi) ? { ...o.outlook, idler: [...o.outlook.idler, mesajKimligi].sort() } : o.outlook;
  return { ...o, k, ...(outlook ? { outlook } : {}) };
};

/** Artık olmayan ipliklerin kaydı atılır: belge büyümesin. */
export const budanmis = (o: PostaOkuma, mesajlar: PostaMesaji[]): PostaOkuma => {
  const var_ = new Set(mesajlar.map((m) => m.konuKimligi));
  const k = Object.fromEntries(Object.entries(o.k).filter(([x]) => var_.has(x)));
  return Object.keys(k).length === Object.keys(o.k).length ? o : { ...o, k };
};
