/*
 * iPhone'da sabit öğelerin yeri (kullanıcı: kaydırırken ya da bir katman açılıp
 * kapanınca alt çubuk ve asistan düğmesi ekranın ortasına çıkıyordu). Safari,
 * sayfa kısalınca (açık bir katman kapanınca kaydırma yeri sona kırpılıyor) ya da
 * esnek kaydırma bitince sabit öğeleri eski görünüm alanına göre çizili bırakıyor;
 * bir sonraki kaydırmaya dek yerine dönmüyorlar. Sayfa boyu değişince ve kaydırma
 * durunca bir piksellik gidip gelme görünüm alanını yeniden eşitliyor.
 * Yalnız iOS'ta: öbür tarayıcılarda sorun yok, boşuna kaydırma olmasın.
 */
export const iosMu = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

/* Alt çubuk görünüm alanının dibinde değilse eşitleme gerekiyor. Çubuk yoksa (masaüstü
   düzeni) yalnız boy değişiminde eşitlenir. */
const kaymisMi = () => {
  const cubuk = document.querySelector<HTMLElement>(".alt-cubuk");
  if (!cubuk || getComputedStyle(cubuk).display === "none") return false;
  // Yakınlaştırılmış sayfada görünüm alanı zaten kaymış: kaydırmak kişinin baktığı yeri bozar.
  if ((window.visualViewport?.scale ?? 1) > 1.01) return false;
  const dip = window.visualViewport ? window.visualViewport.height + window.visualViewport.offsetTop : innerHeight;
  return Math.abs(cubuk.getBoundingClientRect().bottom - dip) > 2;
};

const esitle = () => {
  const y = window.scrollY;
  // Kaydırma yeri değişmezse Safari yeniden çizmiyor: bir piksel gidip dönülür.
  if (y > 0) {
    window.scrollTo(window.scrollX, y - 1);
    window.scrollTo(window.scrollX, y);
  } else {
    window.scrollTo(window.scrollX, 1);
    window.scrollTo(window.scrollX, 0);
  }
};

export const iosSabitDuzelt = () => {
  if (typeof window === "undefined" || !iosMu()) return;
  let bekleyen = 0;
  const sonra = (zorla: boolean, ms: number) => {
    clearTimeout(bekleyen);
    bekleyen = window.setTimeout(() => requestAnimationFrame(() => (zorla || kaymisMi()) && esitle()), ms);
  };
  let boy = 0;
  new ResizeObserver(() => {
    const yeni = document.documentElement.scrollHeight;
    if (yeni === boy) return;
    // Yalnız kısalma kaydırma yerini kırpıyor; uzama sorun çıkarmıyor.
    const kisaldi = yeni < boy;
    boy = yeni;
    if (kisaldi) sonra(true, 60);
  }).observe(document.body);
  // Kaydırma durunca (esnek kaydırmanın sonu dahil) çubuk yerinde değilse.
  window.addEventListener("scroll", () => sonra(false, 180), { passive: true });
  window.visualViewport?.addEventListener("resize", () => sonra(false, 180));
};
