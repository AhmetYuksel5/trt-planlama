/**
 * İzleme: tam yönetici bir kişinin ekranlarını onun gözüyle, yalnız bakarak
 * açıyor (Kullanıcılar › 👁). Bağımlılığı yok: veri.ts yazışı buradan
 * soruyor, oturum.ts kişiyi; ikisi birbirini içe aktarsa döngü olurdu.
 *
 * Sekmeye bağlı (sessionStorage): sekme kapanınca biter, öbür sekmelerde
 * yönetici kendisi olarak çalışmaya devam eder. Workspace bölmeleri aynı
 * sekmenin parçası, aynı depoyu görüyor; onlar da izleniyor.
 */

const SAKLA = "trt-planlama-izleme";

const oku = () => {
  try {
    return sessionStorage.getItem(SAKLA);
  } catch {
    return null;
  }
};

let izlenen: string | null = oku();
const dinleyiciler = new Set<() => void>();
const duyur = () => dinleyiciler.forEach((d) => d());

/* Üst pencerede başlayan ya da biten izleme bölmelere de geçsin. */
window.addEventListener("storage", (e) => {
  if (e.key !== SAKLA && e.key !== null) return;
  const yeni = oku();
  if (yeni === izlenen) return;
  izlenen = yeni;
  duyur();
});

const ayarla = (id: string | null) => {
  if (id === izlenen) return;
  izlenen = id;
  try {
    if (id) sessionStorage.setItem(SAKLA, id);
    else sessionStorage.removeItem(SAKLA);
  } catch {
    /* saklanamazsa izleme yalnız bu sayfa açıkken sürer */
  }
  duyur();
};

export const izlenenKisi = () => izlenen;
/** İzlemedeyken kayda yazılmıyor (veri.ts → kaydet). */
export const izlemede = () => izlenen !== null;
export const izlemeBaslat = (id: string) => ayarla(id);
export const izlemeBitir = () => ayarla(null);
export const izlemeAboneOl = (d: () => void) => {
  dinleyiciler.add(d);
  return () => {
    dinleyiciler.delete(d);
  };
};
