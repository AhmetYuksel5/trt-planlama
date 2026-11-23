/*
 * Next Day'in beklenen paketlerinin (التقارير المتوقعة) sırası. Varsayılan
 * aşağıdaki başlıkların sırası (NextDayBelge.tsx → beklenenSirasi); planlamacı
 * sürükleyerek kendi sırasını verebilir (kullanıcı), plan onu `beklenenSira`da
 * tutar. Saf, saklanan yalnız elle verilen sıra.
 *
 * Elle sıradan sonra eklenen paket varsayılandaki yerine girer: varsayılan
 * sırada kendinden önceki, sırası bilinen paketin arkasına (yoksa başa).
 * Plandan çıkan paket listeden kendiliğinden düşer.
 */
export const beklenenDuzeni = <T extends { id: string }>(varsayilan: T[], elle?: string[]): T[] => {
  if (!elle?.length) return varsayilan;
  const var_ = new Map(varsayilan.map((p) => [p.id, p]));
  const sonuc: T[] = elle.flatMap((id) => (var_.has(id) ? [var_.get(id)!] : []));
  const yerli = new Set(sonuc.map((p) => p.id));
  varsayilan.forEach((p, i) => {
    if (yerli.has(p.id)) return;
    let once = -1;
    for (let j = i - 1; j >= 0 && once < 0; j--) once = sonuc.findIndex((x) => x.id === varsayilan[j].id);
    sonuc.splice(once + 1, 0, p);
    yerli.add(p.id);
  });
  return sonuc;
};

/** Sürükleme: `id` `hedef`in yerine geçer (aşağı inen hedefin altına, yukarı çıkan üstüne). */
export const yerineTasi = (ids: string[], id: string, hedef: string): string[] => {
  const i = ids.indexOf(id);
  const j = ids.indexOf(hedef);
  if (i < 0 || j < 0 || i === j) return ids;
  const yeni = [...ids];
  yeni.splice(i, 1);
  yeni.splice(j, 0, id);
  return yeni;
};
