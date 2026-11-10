import type { Durum, PostaMesaji } from "./veri";
import { GERCEK } from "./kip";

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
}

/** İlk açılışta son bir günün postası okunmamış görünsün. */
export const ILK_TABAN_SAAT = 24;

export const okunmamisMi = (o: PostaOkuma | undefined, m: PostaMesaji): boolean => !!o && !m.giden && m.zaman > (o.k[m.konuKimligi] ?? o.taban);

/** Kişinin gördüğü postalar: gerçek kipte yalnız kendi grubununkiler (Posta ekranının süzgeci). */
export const gorunenPostalar = (d: Pick<Durum, "postaMesajlari">, grup: string | undefined): PostaMesaji[] =>
  (d.postaMesajlari ?? []).filter((m) => !GERCEK || (!!grup && m.grup === grup));

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
export const okunmadiYap = (o: PostaOkuma, kimlikler: string[], sonGelen: string): PostaOkuma => {
  const once = new Date(new Date(sonGelen).getTime() - 1).toISOString();
  const k = { ...o.k };
  for (const x of kimlikler) k[x] = once;
  return { ...o, k };
};

/** Artık olmayan ipliklerin kaydı atılır: belge büyümesin. */
export const budanmis = (o: PostaOkuma, mesajlar: PostaMesaji[]): PostaOkuma => {
  const var_ = new Set(mesajlar.map((m) => m.konuKimligi));
  const k = Object.fromEntries(Object.entries(o.k).filter(([x]) => var_.has(x)));
  return Object.keys(k).length === Object.keys(o.k).length ? o : { ...o, k };
};
