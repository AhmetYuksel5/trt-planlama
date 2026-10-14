import { PLAN_DURUMLARI, type Durum, type NextDayPlan } from "./veri";

/*
 * Aynı güne açılmış birden çok Next Day planını tek plana toplar (saf).
 * Eskiden yarının planını açık duran her tarayıcı ayrı kimlikle açıyordu;
 * gerçek kipte aynı güne birkaç plan birikti (eylemler.ts →
 * gunPlaniKimligi artık bunu önlüyor). Kalan plan en ilerideki (durum),
 * eşitse üzerinde en çok çalışılan, eşitse tarihten türeyen kimlikli,
 * eşitse en eskisi. Öbürlerinin içeriği ona taşınıyor: aynı başlık tek
 * başlık olur ve muhabirleri birleşir; şablondan gelip ikisinde de olan
 * gelişme ve canlı yayın bir kez kalır; plana bağlı her kayıt (öneri,
 * paket, hareket, takvim bağlantısı, haftalık aktarım) kalan plana
 * bağlanır. Değişmeyen kaydın nesnesi aynı kalıyor (depo/fark.ts).
 */

export interface PlanBirlesimi {
  tarih: string;
  kalan: string;
  gidenler: string[];
}

const durumSirasi = (p: NextDayPlan) => PLAN_DURUMLARI.indexOf(p.durum);

/** Planda elle yapılmış iş: şablondan gelmemiş kayıtlar ve plana bağlanmış öneriler. */
const emek = (d: Durum, p: NextDayPlan) =>
  d.gelismeler.filter((g) => g.planId === p.id && !g.onceki).length +
  d.canliYayinlar.filter((c) => c.planId === p.id && !c.onceki).length +
  d.paketler.filter((x) => x.planId === p.id).length +
  d.oneriler.filter((o) => o.planId === p.id).length +
  p.ekip.filter((e) => !e.onceki).length +
  p.hazirPaketler.length;

export const ciftPlanlar = (d: Durum): Map<string, NextDayPlan[]> => {
  const gunler = new Map<string, NextDayPlan[]>();
  for (const p of d.planlar) gunler.set(p.tarih, [...(gunler.get(p.tarih) ?? []), p]);
  for (const [t, l] of gunler) if (l.length < 2) gunler.delete(t);
  return gunler;
};

export const kalacakPlan = (d: Durum, l: NextDayPlan[]): NextDayPlan =>
  [...l].sort(
    (a, b) =>
      durumSirasi(b) - durumSirasi(a) ||
      emek(d, b) - emek(d, a) ||
      Number(b.id === `nd-${b.tarih}`) - Number(a.id === `nd-${a.tarih}`) ||
      a.olusturma.localeCompare(b.olusturma) ||
      a.id.localeCompare(b.id),
  )[0];

export const planCiftleriniBirlestir = (d: Durum): { yeni: Durum; birlesimler: PlanBirlesimi[] } => {
  const ciftler = ciftPlanlar(d);
  if (!ciftler.size) return { yeni: d, birlesimler: [] };
  const birlesimler: PlanBirlesimi[] = [];
  // Giden plan → kalan plan; giden başlık → kalan başlık.
  const planEsle = new Map<string, string>();
  const pbEsle = new Map<string, string>();
  const kalanlar = new Map<string, NextDayPlan>();

  for (const [tarih, l] of ciftler) {
    const kalan = kalacakPlan(d, l);
    let k: NextDayPlan = kalan;
    const gidenler = l.filter((p) => p !== kalan);
    for (const o of gidenler) {
      planEsle.set(o.id, kalan.id);
      const basliklar = [...k.basliklar];
      for (const pb of o.basliklar) {
        const i = basliklar.findIndex((b) => b.baslikId === pb.baslikId);
        if (i < 0) {
          basliklar.push(pb);
          continue;
        }
        pbEsle.set(pb.id, basliklar[i].id);
        const eksik = pb.muhabirler.filter((m) => !basliklar[i].muhabirler.some((x) => x.kisiId === m.kisiId));
        if (eksik.length) basliklar[i] = { ...basliklar[i], muhabirler: [...basliklar[i].muhabirler, ...eksik] };
      }
      const ekip = [...k.ekip, ...o.ekip.filter((e) => !k.ekip.some((x) => x.kisiId === e.kisiId && x.gorev === e.gorev))];
      const gorevlendirmeler = [...new Set([...k.gorevlendirmeler, ...o.gorevlendirmeler])];
      const onceki = [...new Set([...(k.oncekiHareketler ?? []), ...(o.oncekiHareketler ?? []).filter((h) => !k.gorevlendirmeler.includes(h))])];
      k = {
        ...k,
        basliklar,
        ekip,
        gorevlendirmeler,
        hazirPaketler: [...new Set([...k.hazirPaketler, ...o.hazirPaketler])],
        ...(onceki.length ? { oncekiHareketler: onceki } : {}),
      };
    }
    kalanlar.set(kalan.id, k);
    birlesimler.push({ tarih, kalan: kalan.id, gidenler: gidenler.map((p) => p.id) });
  }

  const plan = (id: string) => planEsle.get(id) ?? id;
  const pb = (id?: string) => (id ? (pbEsle.get(id) ?? id) : id);
  const tasinir = (id?: string) => !!id && planEsle.has(id);

  // Şablondan iki plana da düşen aynı gelişme ve canlı yayın bir kez kalsın.
  const gelismeler: Durum["gelismeler"] = [];
  const gorulen = new Set<string>();
  const anahtar = (planId: string, pbId: string | undefined, metin: string) => `${planId}|${pbId ?? ""}|${metin}`;
  for (const g of d.gelismeler) if (!tasinir(g.planId)) gorulen.add(anahtar(g.planId, g.planBaslikId, g.metin));
  for (const g of d.gelismeler) {
    if (!tasinir(g.planId)) {
      gelismeler.push(g);
      continue;
    }
    const a = anahtar(plan(g.planId), pb(g.planBaslikId), g.metin);
    if (gorulen.has(a)) continue;
    gorulen.add(a);
    gelismeler.push({ ...g, planId: plan(g.planId), planBaslikId: pb(g.planBaslikId) });
  }
  const canliYayinlar: Durum["canliYayinlar"] = [];
  const canliGorulen = new Set<string>();
  const canliAnahtar = (c: Durum["canliYayinlar"][number], planId: string, pbId?: string) => `${planId}|${pbId ?? ""}|${c.tarih}|${c.saatGmt}|${c.konu}`;
  for (const c of d.canliYayinlar) if (!tasinir(c.planId)) canliGorulen.add(canliAnahtar(c, c.planId, c.planBaslikId));
  for (const c of d.canliYayinlar) {
    if (!tasinir(c.planId)) {
      canliYayinlar.push(c);
      continue;
    }
    const a = canliAnahtar(c, plan(c.planId), pb(c.planBaslikId));
    if (canliGorulen.has(a)) continue;
    canliGorulen.add(a);
    canliYayinlar.push({ ...c, planId: plan(c.planId), planBaslikId: pb(c.planBaslikId) });
  }

  const yeni: Durum = {
    ...d,
    planlar: d.planlar.filter((p) => !planEsle.has(p.id)).map((p) => kalanlar.get(p.id) ?? p),
    gelismeler,
    canliYayinlar,
    paketler: d.paketler.map((x) =>
      tasinir(x.planId) || tasinir(x.yayinlandi?.planId)
        ? {
            ...x,
            ...(x.planId && { planId: plan(x.planId), planBaslikId: pb(x.planBaslikId) }),
            ...(x.yayinlandi && { yayinlandi: { ...x.yayinlandi, planId: plan(x.yayinlandi.planId) } }),
          }
        : x,
    ),
    oneriler: d.oneriler.map((o) => (tasinir(o.planId) ? { ...o, planId: plan(o.planId!) } : o)),
    hareketler: d.hareketler.map((h) => (tasinir(h.planId) ? { ...h, planId: plan(h.planId!) } : h)),
    faaliyetler: d.faaliyetler.map((f) =>
      f.baglantilar.some((b) => tasinir(b.planId)) ? { ...f, baglantilar: f.baglantilar.map((b) => (tasinir(b.planId) ? { ...b, planId: plan(b.planId) } : b)) } : f,
    ),
    haftalik: d.haftalik.map((h) =>
      h.kalemler.some((k) => tasinir(k.aktarim?.planId))
        ? { ...h, kalemler: h.kalemler.map((k) => (tasinir(k.aktarim?.planId) ? { ...k, aktarim: { ...k.aktarim, planId: plan(k.aktarim!.planId!) } } : k)) }
        : h,
    ),
  };
  return { yeni, birlesimler };
};
