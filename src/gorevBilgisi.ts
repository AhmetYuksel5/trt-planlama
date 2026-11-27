import { paketYeri } from "./etiketler";
import { baslikBul, oneriBul, planBul, type Durum, type Not, type Paket } from "./veri";

/*
 * Görevlendirme kartı (kullanıcı: paket yapılırken ya da sonra bakılınca
 * muhabire görevlendirmede ne söylendiği, ne üzerine görevlendirildiği
 * istenince görülsün). Saklanmaz, kayıttan toplanır: bilgi paket, öneri, plan
 * ve hareketlere dağılmış. Muhabir planı ve başlık havuzunu okuyamıyor; onun
 * tarayıcısında başlığın adı ve planlamacının notu, plan onayında ona giden
 * hareketten (`planaMuhabirEklendi`) gelir.
 */
export interface GorevBilgisi {
  veren?: string;
  zaman?: string;
  /** Nereden geldi: planın günü ve başlığı, Weekly, öneri, özel yayın ya da plansız görev. */
  planTarihi?: string;
  baslik?: string;
  haftalik: boolean;
  oneriId?: string;
  ozelAd?: string;
  plansiz: boolean;
  strap: string;
  aciklama?: string;
  yer: string;
  teslim?: string;
  yayinGunu?: string;
  isleme?: string;
  gorsel?: string;
  kararNotu?: string;
  ekTalep?: string;
  kosul?: string;
  /** Planlamacının başlıktaki muhabire notu (neyi takip edeceği). */
  planNotu?: string;
  notlar: Not[];
  posta?: { zaman: string; kisiId: string; konu?: string; metin?: string };
}

const dolu = (s?: string) => (s?.trim() ? s.trim() : undefined);

export const gorevBilgisi = (d: Durum, p: Paket): GorevBilgisi => {
  const veren = p.kunye?.gorevlendiren?.at(-1) ?? (p.gorev ? { kisiId: p.gorev.veren, zaman: p.gorev.zaman } : undefined);
  const plan = planBul(d, p.planId);
  const pb = plan?.basliklar.find((b) => b.id === p.planBaslikId);
  // Planı okuyamayan (muhabir) için onaya giden hareket: başlığın adı ve not orada.
  const hareket = [...d.hareketler]
    .reverse()
    .find((h) => h.tip === "planaMuhabirEklendi" && h.planId === p.planId && h.veri?.pb === p.planBaslikId && (!p.muhabirId || h.veri?.kime === p.muhabirId));
  const planNotu = dolu(pb?.muhabirler.find((m) => m.kisiId === p.muhabirId)?.not) ?? dolu(hareket?.veri?.not as string | undefined);
  const oneri = oneriBul(d, p.oneriId);
  return {
    veren: veren?.kisiId,
    zaman: veren?.zaman ?? p.gorevZamani,
    planTarihi: plan?.tarih ?? (hareket?.veri?.tarih as string | undefined),
    baslik: baslikBul(d, pb?.baslikId)?.ad ?? (hareket?.veri?.baslik as string | undefined),
    haftalik: !!p.haftalikKalemId,
    oneriId: p.oneriId,
    ozelAd: p.ozelAd,
    plansiz: !p.planId && !!p.gorev && !p.ozelId,
    strap: p.baslik,
    aciklama: dolu(p.aciklama),
    yer: paketYeri(p),
    teslim: p.sonTarih ?? p.teslim?.slice(0, 10),
    yayinGunu: p.yayinGunu,
    isleme: dolu(p.planIsleme) ?? dolu(oneri?.islemeFikri),
    gorsel: dolu(p.planGorsel) ?? dolu(oneri?.gorselIsleme),
    kararNotu: dolu(p.kararNotu),
    ekTalep: dolu(p.ekTalep),
    kosul: dolu(p.kosul),
    planNotu,
    notlar: (p.notlar ?? []).filter((n) => n.metin.trim()),
    posta: p.takdirBildirimi,
  };
};
