import { KOL_SAHIBI, adimSahibi, uretimYolu, type UretimAdimi } from "./akis";
import { metin } from "./dil";
import { cagriGovdesi, cagriKonusu, etiketUret, haftalikGovde, ORNEK_PLANLAMA_ADRESI } from "./eposta";
import { sehirAdi } from "./etiketler";
import { bugun, gunEkle, haftaBasi, planlananHafta, zaman } from "./tarih";
import type {
  Baslik,
  Cagri,
  CanliYayin,
  Durum,
  EkipUyesi,
  Faaliyet,
  FaaliyetTuru,
  Gelisme,
  Gorevlendirme,
  HareketTipi,
  Hareket,
  HaftalikKalem,
  HaftalikPlan,
  Bicim,
  IcerikTuru,
  Kisi,
  NextDayPlan,
  Oneri,
  Paket,
  Sehir,
  Toplanti,
  Ucret,
  Ulke,
  Yanit,
} from "./veri";

/**
 * Örnek veri.
 *
 * Kişiler, kayıtlar ve haberler kurgusal; gerçek kurum verisi gibi
 * sunulmasın diye e-postalar `ornek.local`, telefonlar sıfırlı. Tarihler
 * bugüne göre hesaplanıyor ki gösterim eskimesin: dünün planı bitmiş,
 * bugünün planı üretimde, yarının planı akşam toplantısına hazırlanıyor.
 * Hareket geçmişi her paketin bulunduğu adıma göre üretiliyor; saatler
 * "şu an"dan geriye dizildiği için hiçbir hareket ileri tarihli olmuyor.
 *
 * İçerik kurumdaki gibi yalnız Arapça; arayüz dili onu değiştirmiyor.
 * Birkaç kayıtta Latin harfli özel isim (NATO, CNN) bilerek duruyor ki
 * karışık metnin sağdan sola doğru aktığı görülsün. Kişi adlarının Latin
 * ve Arapça yazımı ikisi birden tutuluyor: ad içerik değil, kimlik.
 */

/* --- Kişiler --- */

type KisiSatiri = [string, string, string, Kisi["birim"], Kisi["rol"], Kisi["gorev"], Sehir, Partial<Kisi>?];

const KISILER: KisiSatiri[] = [
  ["pl1", "Zeynep Aydın", "زينب آيدن", "planlama", "yonetici", "yonetici", "istanbul"],
  ["pl2", "Ayşe Yılmaz", "عائشة يلماز", "planlama", "personel", "planlamaci", "istanbul"],
  ["pl3", "Hamza Saleh", "حمزة صالح", "planlama", "personel", "planlamaci", "istanbul"],
  ["pl4", "Rana Khalil", "رنا خليل", "planlama", "personel", "planlamaci", "istanbul"],
  ["pl5", "Burak Demir", "بوراك دمير", "planlama", "personel", "planlamaci", "istanbul"],
  ["pl6", "Mariam Fawzi", "مريم فوزي", "planlama", "personel", "stokTakip", "istanbul"],
  ["pl7", "Kerem Aksoy", "كرم أقصوي", "planlama", "personel", "stokTakip", "istanbul"],
  ["pl8", "Huda Nasser", "هدى ناصر", "planlama", "personel", "planlamaci", "istanbul"],
  ["nd1", "Mustafa Karam", "مصطفى كرم", "newsdesk", "yonetici", "yonetici", "istanbul"],
  ["nd2", "Omar Fares", "عمر فارس", "newsdesk", "personel", "newsdesk", "istanbul", { ucretYetkisi: true }],
  ["nd3", "Elif Şahin", "إليف شاهين", "newsdesk", "personel", "newsdesk", "istanbul"],
  ["nd4", "Samer Darwish", "سامر درويش", "newsdesk", "personel", "newsdesk", "istanbul"],
  ["nd5", "Nadia Barakat", "نادية بركات", "newsdesk", "personel", "newsdesk", "istanbul"],
  ["nd6", "Tarık Öztürk", "طارق أوزتورك", "newsdesk", "personel", "editor", "istanbul"],
  ["nd7", "Yara Mansour", "يارا منصور", "newsdesk", "personel", "editor", "istanbul"],
  ["nd8", "Khaled Amin", "خالد أمين", "newsdesk", "personel", "newsdesk", "istanbul"],
  ["nd9", "Deniz Kaya", "دنيز قايا", "newsdesk", "personel", "newsdesk", "istanbul"],
  ["nd10", "Lina Haddad", "لينا حداد", "newsdesk", "personel", "editor", "istanbul"],
  ["ng1", "Ahmed Salim", "أحمد سالم", "newsgathering", "yonetici", "yonetici", "istanbul"],
  ["ng2", "Serkan Yıldız", "سركان يلدز", "newsgathering", "personel", "koordinator", "istanbul"],
  ["ng3", "Dina Rashid", "دينا رشيد", "newsgathering", "personel", "koordinator", "istanbul"],
  ["ng4", "Faisal Othman", "فيصل عثمان", "newsgathering", "personel", "koordinator", "istanbul"],
  ["ng5", "Gizem Arslan", "غيزم أرسلان", "newsgathering", "personel", "koordinator", "istanbul"],
  ["pr1", "Murat Çelik", "مراد تشيليك", "program", "yonetici", "yonetici", "istanbul"],
  ["pr2", "Reem Al-Sayed", "ريم السيد", "program", "personel", "programEditoru", "istanbul"],
  ["pr3", "Bilal Haidar", "بلال حيدر", "program", "personel", "programEditoru", "istanbul"],
  ["pr4", "Sara Kılıç", "سارة كليتش", "program", "personel", "programEditoru", "istanbul"],
  ["pr5", "Hiba Mourad", "هبة مراد", "program", "personel", "sunucu", "istanbul"],
  ["pr6", "Yousef Khatib", "يوسف الخطيب", "program", "personel", "sunucu", "istanbul"],
  ["pr7", "Nour Abbas", "نور عباس", "program", "personel", "sunucu", "istanbul"],
  ["ek1", "Selim Aktaş", "سليم أقطاش", "ekonomi", "yonetici", "yonetici", "istanbul"],
  ["ek2", "Dalia Fikri", "داليا فكري", "ekonomi", "personel", "editor", "istanbul"],
  ["ek3", "Kaan Özer", "قاان أوزر", "ekonomi", "personel", "editor", "istanbul"],
  ["ou1", "Hassan Jaber", "حسن جابر", "output", "yonetici", "yonetici", "istanbul"],
  ["ou2", "Samira Taha", "سميرة طه", "output", "personel", "dilDenetmeni", "istanbul"],
  ["ou3", "Adel Mahmoud", "عادل محمود", "output", "personel", "dilDenetmeni", "istanbul"],
  ["ou4", "Lama Odeh", "لمى عودة", "output", "personel", "dilDenetmeni", "istanbul"],
  ["ou5", "Emre Koç", "أمره كوتش", "output", "personel", "editor", "istanbul"],
  ["ou6", "Rasha Hamdan", "رشا حمدان", "output", "personel", "tercuman", "istanbul"],
  ["ou7", "Can Polat", "جان بولات", "output", "personel", "tercuman", "istanbul"],
  ["me1", "Ziad Karim", "زياد كريم", "media", "yonetici", "yonetici", "istanbul"],
  ["me2", "Onur Aydemir", "أونور آيدمير", "media", "personel", "mediaManager", "istanbul"],
  ["me3", "Mona Saad", "منى سعد", "media", "personel", "mediaManager", "istanbul"],
  ["me4", "Tamer Hilal", "تامر هلال", "media", "personel", "mediaManager", "istanbul"],
  ["yo1", "Kemal Erdem", "كمال أردم", "yonetim", "yonetici", "inputMuduru", "istanbul"],
  ["yo2", "Fatima Zahra Idrissi", "فاطمة الزهراء الإدريسي", "yonetim", "yonetici", "programMuduru", "istanbul"],
  ["mu1", "Omar Haddad", "عمر حداد", "muhabir", "personel", "muhabir", "gazze", { durum: "sahada" }],
  ["mu2", "Selin Ercan", "سلين أرجان", "muhabir", "personel", "muhabir", "kudus"],
  ["mu3", "Mustafa Nasr", "مصطفى نصر", "muhabir", "personel", "muhabir", "beyrut", { durum: "sahada" }],
  ["mu4", "Ayşe Kurt", "عائشة كورت", "muhabir", "personel", "muhabir", "kahire", { durum: "yolda" }],
  ["mu5", "Mehmet Ali Toprak", "محمد علي توبراك", "muhabir", "personel", "muhabir", "washington", { durum: "sahada" }],
  ["mu6", "Muhannad Saleh", "مهند صالح", "muhabir", "personel", "muhabir", "istanbul"],
  ["mu7", "Ahmet Güneş", "أحمد غونش", "muhabir", "personel", "muhabir", "ankara"],
  ["mu8", "Rania Mansour", "رانيا منصور", "muhabir", "personel", "muhabir", "kahire"],
  ["mu9", "Nour Al-Ali", "نور العلي", "muhabir", "personel", "muhabir", "beyrut", { calisma: "serbest", durum: "izinli" }],
  ["mu10", "Yusuf Demir", "يوسف دمير", "muhabir", "personel", "muhabir", "istanbul", { durum: "izinli" }],
  ["mu11", "Leyla Sayed", "ليلى السيد", "muhabir", "personel", "muhabir", "istanbul"],
  ["mu12", "Hasan Abu Zaid", "حسن أبو زيد", "muhabir", "personel", "muhabir", "gazze", { calisma: "serbest", durum: "sahada" }],
  ["mu13", "Walid Kassem", "وليد قاسم", "muhabir", "personel", "muhabir", "sam", { durum: "sahada" }],
  ["mu14", "Abdullah Hamwi", "عبد الله الحموي", "muhabir", "personel", "muhabir", "halep", { calisma: "serbest" }],
  ["mu15", "Mohammed Rubaie", "محمد الربيعي", "muhabir", "personel", "muhabir", "bagdat"],
  ["mu16", "Shirin Kareem", "شيرين كريم", "muhabir", "personel", "muhabir", "erbil", { calisma: "serbest" }],
  ["mu17", "Ibrahim Odeh", "إبراهيم عودة", "muhabir", "personel", "muhabir", "amman"],
  ["mu18", "Tariq Al-Kuwari", "طارق الكواري", "muhabir", "personel", "muhabir", "doha"],
  ["mu19", "Fahad Al-Otaibi", "فهد العتيبي", "muhabir", "personel", "muhabir", "riyad", { calisma: "serbest" }],
  ["mu20", "Saeed Al-Hadi", "سعيد الهادي", "muhabir", "personel", "muhabir", "sana", { calisma: "serbest" }],
  ["mu21", "Amira Osman", "أميرة عثمان", "muhabir", "personel", "muhabir", "hartum", { calisma: "serbest" }],
  ["mu22", "Mahmoud Sweilem", "محمود سويلم", "muhabir", "personel", "muhabir", "trablus", { calisma: "serbest" }],
  ["mu23", "Anis Ben Salem", "أنيس بن سالم", "muhabir", "personel", "muhabir", "tunus"],
  ["mu24", "Youssef El Alaoui", "يوسف العلوي", "muhabir", "personel", "muhabir", "rabat", { calisma: "serbest" }],
  ["mu25", "Reza Ahmadi", "رضا أحمدي", "muhabir", "personel", "muhabir", "tahran", { calisma: "serbest" }],
  ["mu26", "Olena Kovalenko", "أولينا كوفالينكو", "muhabir", "personel", "muhabir", "kiev", { calisma: "serbest", durum: "yolda" }],
  ["mu27", "Jamal Haddad", "جمال حداد", "muhabir", "personel", "muhabir", "newyork"],
  ["mu28", "Sophie Laurent", "صوفي لوران", "muhabir", "personel", "muhabir", "bruksel", { calisma: "serbest" }],
  ["mu29", "Kareem Fadel", "كريم فاضل", "muhabir", "personel", "muhabir", "londra"],
  ["mu30", "Hatice Arslan", "هاتيجة أرسلان", "muhabir", "personel", "muhabir", "ankara"],
  ["mu31", "Nabil Awad", "نبيل عوض", "muhabir", "personel", "muhabir", "ramallah"],
  ["mu32", "Rasha Qasim", "رشا قاسم", "muhabir", "personel", "muhabir", "kudus"],
];

const ALAN_KODU: Partial<Record<Sehir, string>> = {
  gazze: "+970",
  kudus: "+970",
  ramallah: "+970",
  beyrut: "+961",
  sam: "+963",
  halep: "+963",
  kahire: "+20",
  bagdat: "+964",
  erbil: "+964",
  amman: "+962",
  doha: "+974",
  riyad: "+966",
  sana: "+967",
  hartum: "+249",
  trablus: "+218",
  tunus: "+216",
  rabat: "+212",
  tahran: "+98",
  kiev: "+380",
  washington: "+1",
  newyork: "+1",
  bruksel: "+32",
  londra: "+44",
};

const latin = (ad: string) =>
  ad
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z ]/g, "")
    .trim();

const eposta = (ad: string, alan = "ornek.local") => latin(ad).replace(/ +/g, ".") + "@" + alan;

/* Kurumun muhabir listesindeki kısaltma kalıbı: adın ilk harfi ve soyadın ilk iki harfi (ASH, IKH). */
const kisaltmalar = new Set<string>();
const kisaltmaUret = (ad: string) => {
  const p = latin(ad).split(/ +/);
  const son = p[p.length - 1];
  for (const k of [p[0][0] + son.slice(0, 2), p[0][0] + son[0] + son[son.length - 1], p[0].slice(0, 2) + son[0]]) {
    const b = k.toUpperCase();
    if (!kisaltmalar.has(b)) {
      kisaltmalar.add(b);
      return b;
    }
  }
  return (p[0][0] + son).slice(0, 3).toUpperCase();
};

/* Çalışabildiği diğer ülkeler: ana görev yerinin çevresi; listedeki ilk bir-üç tanesi. */
const KOMSU: Partial<Record<Ulke, Ulke[]>> = {
  filistin: ["urdun", "misir", "lubnan"],
  lubnan: ["suriye", "urdun", "filistin"],
  suriye: ["lubnan", "turkiye", "irak"],
  misir: ["sudan", "libya", "filistin"],
  irak: ["suriye", "iran", "kuveyt"],
  urdun: ["filistin", "suriye", "irak"],
  katar: ["bae", "bahreyn", "kuveyt"],
  suudi: ["bae", "bahreyn", "yemen"],
  yemen: ["suudi", "umman"],
  sudan: ["misir", "libya"],
  libya: ["tunus", "cezayir", "misir"],
  tunus: ["cezayir", "libya"],
  fas: ["cezayir", "fransa"],
  turkiye: ["suriye", "azerbaycan", "irak"],
  iran: ["irak", "azerbaycan"],
  ukrayna: ["rusya"],
  abd: ["brezilya"],
  belcika: ["fransa", "almanya"],
  ingiltere: ["fransa", "belcika"],
};

/* Her muhabir PKG ve canlı yapıyor; diğer türler kişiden kişiye. */
const BICIM_EKI: Bicim[][] = [
  ["voxpop", "feature"],
  ["walktalk", "derinlemesine"],
  ["ozelRoportaj"],
  ["hikayem", "feature"],
  ["voxpop", "walktalk", "ozelRoportaj"],
  ["derinlemesine", "ozelRoportaj"],
  ["feature"],
];

const RETAINER = new Set(["mu3", "mu5", "mu13", "mu18", "mu29"]);
const IRTIBATLI = new Set<Sehir>(["gazze", "beyrut", "kudus", "sam", "bagdat", "kahire"]);

const kisiler = (): Kisi[] => {
  kisaltmalar.clear();
  return KISILER.map(([id, tr, ar, birim, rol, gorev, sehir, ek], i) => {
    const muhabir = birim === "muhabir";
    const ulke = SEHIR_ULKESI[sehir];
    return {
      id,
      ad: { tr, ar, en: tr },
      birim,
      rol,
      gorev,
      sehir,
      diller: muhabir ? (i % 3 === 0 ? ["ar", "en"] : i % 3 === 1 ? ["ar", "tr"] : ["ar", "fr"]) : ["ar", "tr", "en"],
      telefon: `${ALAN_KODU[sehir] ?? "+90"} 000 000 ${String(i + 1).padStart(2, "0")}`,
      eposta: eposta(tr),
      kisiselEposta: muhabir ? eposta(tr, "kisisel.ornek.local") : undefined,
      irtibat: muhabir && IRTIBATLI.has(sehir) ? `satdesk@${sehir}.ornek.local` : undefined,
      kisaltma: kisaltmaUret(tr),
      calisma: RETAINER.has(id) ? "retainer" : "kadrolu",
      digerUlkeler: muhabir ? (KOMSU[ulke] ?? []).slice(0, 1 + (i % 3)) : [],
      bicimler: muhabir ? ["pkg", "canli", ...BICIM_EKI[i % BICIM_EKI.length]] : [],
      durum: "gorevde",
      ...ek,
    };
  });
};

/* --- Merkezi başlık havuzu (promptun 4.4 maddesindeki örnekler önce) --- */

const BASLIKLAR: Baslik[] = [
  { id: "b-sudan", ad: "السودان", ulke: "sudan", aktif: true },
  { id: "b-filistin", ad: "فلسطين", ulke: "filistin", aktif: true },
  { id: "b-lubnan", ad: "لبنان", ulke: "lubnan", aktif: true },
  { id: "b-suriye", ad: "سوريا", ulke: "suriye", aktif: true },
  { id: "b-ukrayna", ad: "أوكرانيا", ulke: "ukrayna", aktif: true },
  { id: "b-abd", ad: "الولايات المتحدة", ulke: "abd", aktif: true },
  { id: "b-turkiye", ad: "تركيا", ulke: "turkiye", aktif: true },
  { id: "b-iran", ad: "إيران", ulke: "iran", aktif: true },
  { id: "b-ekonomi", ad: "الاقتصاد العالمي", aktif: true },
  { id: "b-bm", ad: "الأمم المتحدة", aktif: true },
  { id: "b-irak", ad: "العراق", ulke: "irak", aktif: true },
  { id: "b-misir", ad: "مصر", ulke: "misir", aktif: true },
  { id: "b-korfez", ad: "الخليج", ulke: "katar", aktif: true },
  /* Kurumun Next Day çıktısındaki gibi konu başlıkları: ülke değil, gündemin kendisi. */
  { id: "b-ortadogu", ad: "الحرب في الشرق الأوسط", aktif: true },
  { id: "b-ihlaller", ad: "الانتهاكات الإسرائيلية في فلسطين", ulke: "filistin", aktif: true },
  { id: "b-rusya-ukrayna", ad: "الحرب الروسية الأوكرانية", ulke: "ukrayna", aktif: true },
  { id: "b-turk-gundem", ad: "الأجندة التركية", ulke: "turkiye", aktif: true },
  { id: "b-bosna", ad: "الانتخابات العامة في البوسنة والهرسك", aktif: true },
  { id: "b-yemen", ad: "الصراع في اليمن", ulke: "yemen", aktif: false },
];

/* --- Stoktaki paketler: üretimi bitmiş, bir plana seçilmeyi bekliyor --- */

interface StokTanimi {
  id: string;
  slug: string;
  sehir: Sehir;
  baslik: string;
  muhabirId: string;
  aciklama: string;
  tur: IcerikTuru;
  sure: string;
  hazirlanma: string;
}

const STOK = (gun: (n: number) => string): StokTanimi[] => [
  {
    id: "hp1",
    slug: "CAIRO-NILEBOATS-PKG-RM",
    sehir: "kahire",
    baslik: "صناعة القوارب التقليدية على ضفاف النيل",
    muhabirId: "mu8",
    aciklama: "حرفة بناء القوارب المتوارثة عبر الأجيال تكافح للبقاء وسط ارتفاع أسعار الخشب وتراجع الطلب.",
    tur: "feature",
    sure: "3:20",
    hazirlanma: gun(-6),
  },
  {
    id: "hp2",
    slug: "ISTANBUL-FATIH-PKG-YD",
    sehir: "istanbul",
    baslik: "تجار يتحدثون العربية: يوم في الفاتح",
    muhabirId: "mu10",
    aciklama: "في أسواق الفاتح أصبحت العربية لغة التجارة اليومية؛ يوم مع التجار والزبائن.",
    tur: "feature",
    sure: "4:10",
    hazirlanma: gun(-9),
  },
  {
    id: "hp3",
    slug: "BEIRUT-PORT-PKG-NA",
    sehir: "beyrut",
    baslik: "آثار انفجار مرفأ بيروت",
    muhabirId: "mu9",
    aciklama: "إعادة الإعمار في الأحياء المحيطة بالمرفأ تسير ببطء، والعائلات ما زالت تنتظر العدالة.",
    tur: "haber",
    sure: "2:45",
    hazirlanma: gun(-4),
  },
  {
    id: "hp4",
    slug: "AMMAN-ZAATARI-PKG-IO",
    sehir: "amman",
    baslik: "بدء العام الدراسي في مخيم الزعتري",
    muhabirId: "mu17",
    aciklama: "رغم الاكتظاظ ونقص المستلزمات، عاد آلاف الأطفال السوريين إلى مقاعد الدراسة.",
    tur: "feature",
    sure: "3:05",
    hazirlanma: gun(-3),
  },
  {
    id: "hp5",
    slug: "DOHA-AI-PKG-TK",
    sehir: "doha",
    baslik: "استثمارات الذكاء الاصطناعي في الخليج",
    muhabirId: "mu18",
    aciklama: "صناديق الخليج تضخ مليارات الدولارات في مراكز البيانات؛ فرص عمل جديدة في المنطقة.",
    tur: "ekonomi",
    sure: "2:30",
    hazirlanma: gun(-5),
  },
  {
    id: "hp6",
    slug: "TUNIS-OLIVES-PKG-ABS",
    sehir: "tunus",
    baslik: "موسم قطف الزيتون في تونس",
    muhabirId: "mu23",
    aciklama: "توقعات بمحصول قياسي تسعد المصدّرين، فيما يشكو صغار المنتجين من التكاليف.",
    tur: "ekonomi",
    sure: "2:50",
    hazirlanma: gun(-7),
  },
  {
    id: "hp7",
    slug: "ERBIL-CITADEL-PKG-SK",
    sehir: "erbil",
    baslik: "ترميم قلعة أربيل",
    muhabirId: "mu16",
    aciklama: "واحدة من أقدم المواقع المأهولة باستمرار في العالم تعود لاستقبال الزوار.",
    tur: "feature",
    sure: "3:40",
    hazirlanma: gun(-12),
  },
  {
    id: "hp8",
    slug: "BRUSSELS-MIGRATION-PKG-SL",
    sehir: "bruksel",
    baslik: "ميثاق الهجرة الأوروبي: صورة من الميدان",
    muhabirId: "mu28",
    aciklama: "كيف تُطبَّق القواعد الجديدة في الدول الحدودية؛ شهادات طالبي لجوء ومسؤولين.",
    tur: "haber",
    sure: "3:00",
    hazirlanma: gun(-2),
  },
];

/* --- Paket tanımları: plan, başlık, durum ve adım; geçmiş bunlardan üretiliyor --- */

interface PaketTanimi {
  id: string;
  plan?: "dun" | "bugun" | "yarin";
  pb?: string;
  baslik: string;
  sehir: Sehir;
  muhabirId: string;
  aciklama: string;
  tur?: IcerikTuru;
  durum: Paket["durum"];
  adim?: UretimAdimi;
  saha?: boolean;
  oneriId?: string;
  slug?: string;
  saat?: string;
  /** Teslim, şu andan dakika olarak: eksi değer gecikmiş iş. Sabit saat akşam açılan sayfada her şeyi gecikmiş gösterirdi. */
  teslimDk?: number;
  ucret?: Ucret;
  metin?: string;
  geriGonder?: string;
  bicim?: Bicim;
  /** Yöneticinin öncelikli işaretlediği iş. */
  oncelikli?: boolean;
  /** Stok paketi: feature/stok ekibi üretiyor, bitince stokta bekliyor. */
  stok?: boolean;
}

/* Kolun varsayılan biçimi: feature kolu insan hikâyesi, program derinlemesine, gerisi PKG. */
const varsayilanBicim = (tur: IcerikTuru): Bicim => (tur === "feature" ? "feature" : tur === "program" ? "derinlemesine" : "pkg");

const GAZZE_METNI =
  "تعاني المستشفيات في قطاع غزة من نقص حاد في الأدوية والوقود، فيما تعمل أقسام الطوارئ بأكثر من طاقتها الاستيعابية. ويقول الأطباء إن المولدات الاحتياطية لا تكفي إلا لساعات محدودة يوميا، وإن آلاف المرضى ينتظرون عمليات مؤجلة. وتؤكد منظمة الصحة العالمية أن أقل من نصف مستشفيات القطاع ما زالت تعمل بشكل جزئي.";

const PAKETLER: PaketTanimi[] = [
  // Bugünün planı: Newsdesk devraldı, paketler üretimin farklı adımlarında.
  {
    id: "p-gazze",
    plan: "bugun",
    pb: "pb-b-filistin",
    slug: "GAZA-HEALTH-PKG-OH",
    baslik: "النظام الصحي في غزة على حافة الانهيار",
    sehir: "gazze",
    muhabirId: "mu1",
    aciklama: "نقص الأدوية والوقود في المستشفيات؛ مقابلات مع أطباء ومرضى وبيانات منظمة الصحة العالمية.",
    durum: "uretimde",
    adim: "media",
    saha: true,
    oneriId: "o-gazze",
    saat: "19:00",
    teslimDk: 50,
    metin: GAZZE_METNI,
    geriGonder: "Rakamların kaynağı eksik; DSÖ verisi ve tarih eklenmeli.",
  },
  {
    id: "p-kudus",
    plan: "bugun",
    pb: "pb-b-filistin",
    baslik: "قيود جديدة في محيط المسجد الأقصى",
    sehir: "kudus",
    muhabirId: "mu2",
    aciklama: "مقابلات مع تجار البلدة القديمة والمصلين؛ الإجراءات الجديدة على الأبواب.",
    durum: "uretimde",
    adim: "dil",
    oneriId: "o-kudus",
    saat: "16:00",
    teslimDk: 95,
  },
  {
    id: "p-beyrut",
    plan: "bugun",
    pb: "pb-b-lubnan",
    baslik: "التحضيرات لمؤتمر إعادة الإعمار في لبنان",
    sehir: "beyrut",
    muhabirId: "mu3",
    aciklama: "توقعات الدول المانحة وتقييم الأضرار في الجنوب.",
    durum: "uretimde",
    adim: "metin",
    oneriId: "o-beyrut",
    saat: "19:00",
    teslimDk: -40,
    oncelikli: true,
  },
  // Input müdürünün dünkü talimatı: plana alındı, öncelikli olarak üretimde.
  {
    id: "p-talimat",
    plan: "bugun",
    pb: "pb-b-turkiye",
    baslik: "إسطنبول تستعد لموسم الأمطار: خطة الطوارئ وجاهزية فرق الإنقاذ",
    sehir: "istanbul",
    muhabirId: "mu30",
    aciklama: "خطة البلدية لمواجهة السيول، وجولة مع فرق الإنقاذ في الأحياء المعرضة للخطر.",
    durum: "uretimde",
    adim: "metin",
    oneriId: "o-talimat-2",
    saat: "20:00",
    teslimDk: 150,
    oncelikli: true,
  },
  {
    id: "p-sam",
    plan: "bugun",
    pb: "pb-b-suriye",
    baslik: "العودة إلى سوريا: يوم على المعبر الحدودي",
    sehir: "sam",
    muhabirId: "mu13",
    aciklama: "قصص العائلات العائدة والإجراءات على الحدود.",
    durum: "uretimde",
    adim: "newsdesk",
    saha: true,
    oneriId: "o-sam",
    saat: "21:00",
  },
  {
    id: "p-forum",
    plan: "bugun",
    pb: "pb-b-turkiye",
    baslik: "منتدى الأعمال التركي الخليجي في إسطنبول",
    sehir: "istanbul",
    muhabirId: "mu6",
    aciklama: "صور من المنتدى ومقابلات مع رجال أعمال والاتفاقيات الموقعة.",
    durum: "uretimde",
    adim: "video",
    saat: "18:00",
    teslimDk: 140,
  },
  {
    id: "p-altin",
    plan: "bugun",
    pb: "pb-b-ekonomi",
    baslik: "الذهب يسجل رقما قياسيا: الأثر على بورصات الخليج",
    sehir: "istanbul",
    muhabirId: "mu11",
    aciklama: "صور من البازار الكبير ومقابلة قصيرة مع خبيرين اقتصاديين.",
    durum: "uretimde",
    adim: "kontrol",
    saat: "14:00",
    teslimDk: 30,
  },
  {
    id: "p-kongre",
    plan: "bugun",
    pb: "pb-b-abd",
    baslik: "جلسة الكونغرس الأمريكي حول الشرق الأوسط",
    sehir: "washington",
    muhabirId: "mu5",
    aciklama: "أبرز ما جاء في الجلسة وردود فعل الجمعيات العربية الأمريكية.",
    durum: "uretimde",
    adim: "iletim",
    saat: "22:00",
  },
  {
    id: "p-meclis",
    plan: "bugun",
    pb: "pb-b-turkiye",
    baslik: "البرلمان التركي يفتتح سنته التشريعية الجديدة",
    sehir: "ankara",
    muhabirId: "mu30",
    aciklama: "خطاب الافتتاح وبنود الأجندة التي تهم العالم العربي.",
    durum: "uretimde",
    adim: "inews",
    saat: "15:00",
  },
  {
    id: "p-bm",
    plan: "bugun",
    pb: "pb-b-bm",
    baslik: "جلسة الجمعية العامة للأمم المتحدة بشأن فلسطين",
    sehir: "newyork",
    muhabirId: "mu27",
    aciklama: "نتيجة التصويت وتصريحات الوفود.",
    durum: "tamamlandi",
    saat: "12:00",
  },

  // Dünün planı: hepsi tamamlandı, biri iptal.
  {
    id: "p-hartum-dun",
    plan: "dun",
    pb: "pb-d-sudan",
    baslik: "عودة النازحين إلى الخرطوم",
    sehir: "hartum",
    muhabirId: "mu21",
    aciklama: "الحياة تعود تدريجيا إلى الأحياء.",
    durum: "tamamlandi",
    saha: true,
    saat: "19:00",
    ucret: { tutar: 300, para: "USD", durum: "onaylandi" },
  },
  {
    id: "p-gazze-dun",
    plan: "dun",
    pb: "pb-d-filistin",
    baslik: "افتتاح المدارس في الخيام بغزة",
    sehir: "gazze",
    muhabirId: "mu12",
    aciklama: "أول يوم دراسي في الفصول المقامة داخل الخيام.",
    durum: "tamamlandi",
    saha: true,
    saat: "19:00",
    ucret: { tutar: 250, para: "USD", durum: "odendi" },
  },
  {
    id: "p-bagdat-dun",
    plan: "dun",
    pb: "pb-d-irak",
    baslik: "انطلاق الحملة الانتخابية رسميا في العراق",
    sehir: "bagdat",
    muhabirId: "mu15",
    aciklama: "ملصقات في شوارع بغداد ومفاوضات التحالفات.",
    durum: "tamamlandi",
    saat: "21:00",
  },
  {
    id: "p-ankara-dun",
    plan: "dun",
    pb: "pb-d-turkiye",
    baslik: "مؤتمر فلسطين في أنقرة",
    sehir: "ankara",
    muhabirId: "mu7",
    aciklama: "تصريحات من المؤتمر.",
    durum: "tamamlandi",
    saat: "16:00",
  },
  {
    id: "p-halep-dun",
    plan: "dun",
    pb: "pb-d-filistin",
    baslik: "ترميم السوق القديم في حلب",
    sehir: "halep",
    muhabirId: "mu14",
    aciklama: "أُجّل في الاجتماع وسيُنقل إلى ملف التقارير.",
    durum: "iptal",
    saat: "",
  },

  // Yarının planı: akşam toplantısına hazırlanıyor.
  {
    id: "p-refah",
    plan: "yarin",
    pb: "pb-y-ihlaller",
    slug: "RAFAH-AIDTRUCKS-PKG-HAZ",
    baslik: "شاحنات المساعدات العالقة عند معبر رفح",
    sehir: "gazze",
    muhabirId: "mu12",
    aciklama: "بث مباشر صباحي من المعبر؛ مقابلة قصيرة مع مسؤول أممي ممكنة.",
    durum: "degerlendiriliyor",
    saha: true,
    oneriId: "o-refah",
    saat: "09:00",
    ucret: { tutar: 280, para: "USD", durum: "bekliyor" },
  },
  {
    id: "p-elektrik",
    plan: "yarin",
    pb: "pb-y-ortadogu",
    slug: "BEIRUT-GENERATORS-PKG-MN",
    baslik: "أزمة الكهرباء في لبنان: مولدات الأحياء",
    sehir: "beyrut",
    muhabirId: "mu3",
    aciklama: "أصحاب المولدات والفواتير والتعرفة الحكومية الجديدة.",
    durum: "taslak",
    oneriId: "o-elektrik",
    saat: "19:00",
  },
  {
    id: "p-hartum",
    plan: "yarin",
    pb: "pb-y-sudan",
    slug: "KHARTOUM-HOSPITALS-PKG-AO",
    baslik: "إعادة فتح المستشفيات في الخرطوم",
    sehir: "hartum",
    muhabirId: "mu21",
    aciklama: "عودة مستشفيين متضررين إلى العمل جزئيا؛ مقابلات مع العاملين الصحيين.",
    durum: "degerlendiriliyor",
    saha: true,
    oneriId: "o-hartum",
    saat: "21:00",
    ucret: { tutar: 300, para: "USD", durum: "bekliyor" },
  },
  {
    id: "p-ticaret",
    plan: "yarin",
    pb: "pb-y-ekonomi",
    slug: "ISTANBUL-GULFTRADE-PKG-LS",
    baslik: "حجم التجارة التركية الخليجية: توقعات نهاية العام",
    sehir: "istanbul",
    muhabirId: "mu11",
    aciklama: "بيانات مجلس العلاقات الاقتصادية الخارجية تصدر غدا؛ يمكن ترتيب ضيف في الاستوديو.",
    durum: "taslak",
    oneriId: "o-ticaret",
    saat: "14:00",
  },

  // Haftalık plandan gelen feature ve program işleri: Next Day'e girmeden kendi kollarında.
  {
    id: "p-elyazma",
    baslik: "مكتبة المخطوطات في القاهرة",
    sehir: "kahire",
    muhabirId: "mu8",
    aciklama: "فريق يعمل على رقمنة مخطوطات عمرها قرون.",
    tur: "feature",
    durum: "uretimde",
    adim: "video",
    stok: true,
  },
  {
    id: "p-hidrojen",
    baslik: "استثمارات الهيدروجين الأخضر في الخليج",
    sehir: "doha",
    muhabirId: "mu18",
    aciklama: "مشاريع جديدة وتحوّل الطاقة.",
    tur: "ekonomi",
    durum: "uretimde",
    adim: "kontrol",
    stok: true,
  },
  {
    id: "p-sahaf",
    baslik: "سوق الكتب المستعملة في شارع المتنبي",
    sehir: "bagdat",
    muhabirId: "mu15",
    aciklama: "باعة الكتب في شارع المتنبي ببغداد وجمهور الجمعة؛ قصة مكان يعود إلى الحياة.",
    tur: "feature",
    durum: "onaylandi",
    stok: true,
  },
  {
    id: "p-girisim",
    baslik: "برنامج: رواد الأعمال الشباب في العالم العربي",
    sehir: "amman",
    muhabirId: "mu17",
    aciklama: "ثلاثة بورتريهات لرواد أعمال لصالح البرنامج الأسبوعي.",
    tur: "program",
    durum: "uretimde",
    adim: "newsdesk",
  },
];

/* --- Öneriler --- */

interface OneriTanimi {
  id: string;
  muhabirId: string;
  haber: string;
  gelisme: string;
  paket?: string;
  tur?: IcerikTuru;
  saha?: boolean;
  kanal?: Oneri["kanal"];
  gun: "dun" | "bugun";
  durum: Oneri["durum"];
  baslikId?: string;
  paketId?: string;
  gerekce?: string;
  saat: string;
}

const ONERILER: OneriTanimi[] = [
  // Dünkü çağrıya gelenler: bugünün planı için.
  {
    id: "o-gazze",
    muhabirId: "mu1",
    gun: "dun",
    saat: "10:20",
    haber: "مستشفيات غزة",
    gelisme: "الوقود على وشك النفاد في مستشفيي الشفاء وناصر؛ الأطباء يؤجلون العمليات.",
    paket: "النظام الصحي في غزة على حافة الانهيار",
    saha: true,
    durum: "planaEklendi",
    baslikId: "b-filistin",
    paketId: "p-gazze",
  },
  {
    id: "o-kudus",
    muhabirId: "mu2",
    gun: "dun",
    saat: "10:45",
    haber: "البلدة القديمة في القدس",
    gelisme: "إقامة نقاط تفتيش جديدة عند أبواب الأقصى.",
    paket: "قيود جديدة في محيط المسجد الأقصى",
    durum: "planaEklendi",
    baslikId: "b-filistin",
    paketId: "p-kudus",
  },
  {
    id: "o-beyrut",
    muhabirId: "mu3",
    gun: "dun",
    saat: "11:05",
    haber: "إعادة الإعمار في لبنان",
    gelisme: "مؤتمر المانحين الأسبوع المقبل في بيروت.",
    paket: "التحضيرات لمؤتمر إعادة الإعمار في لبنان",
    durum: "planaEklendi",
    baslikId: "b-lubnan",
    paketId: "p-beyrut",
  },
  {
    id: "o-sam",
    muhabirId: "mu13",
    gun: "dun",
    saat: "11:30",
    haber: "العودة إلى سوريا",
    gelisme: "ارتفاع عدد العابرين يوميا عبر معبر جديدة يابوس.",
    paket: "العودة إلى سوريا: يوم على المعبر الحدودي",
    saha: true,
    kanal: "eposta",
    durum: "planaEklendi",
    baslikId: "b-suriye",
    paketId: "p-sam",
  },
  {
    id: "o-yemen",
    muhabirId: "mu20",
    gun: "dun",
    saat: "12:10",
    haber: "الكوليرا في اليمن",
    gelisme: "تقارير عن ارتفاع حالات الكوليرا في صنعاء.",
    kanal: "mesaj",
    durum: "reddedildi",
    gerekce: "Bu hafta aynı konu işlendi; yeni veri gelince yeniden değerlendirilecek.",
  },

  // Bugünkü çağrıya gelenler: yarının planı için.
  {
    id: "o-refah",
    muhabirId: "mu12",
    gun: "bugun",
    saat: "09:40",
    haber: "معبر رفح",
    gelisme: "مئات شاحنات المساعدات تنتظر على الحدود منذ ثلاثة أيام؛ الأمم المتحدة تطالب بمسار جديد.",
    paket: "شاحنات المساعدات العالقة عند معبر رفح",
    saha: true,
    durum: "planaEklendi",
    baslikId: "b-ihlaller",
    paketId: "p-refah",
  },
  {
    id: "o-elektrik",
    muhabirId: "mu3",
    gun: "bugun",
    saat: "09:55",
    haber: "الكهرباء في لبنان",
    gelisme: "الحكومة تعلن تعرفة جديدة للمولدات.",
    paket: "أزمة الكهرباء في لبنان: مولدات الأحياء",
    durum: "planaEklendi",
    baslikId: "b-ortadogu",
    paketId: "p-elektrik",
  },
  {
    id: "o-hartum",
    muhabirId: "mu21",
    gun: "bugun",
    saat: "10:05",
    haber: "الصحة في السودان",
    gelisme: "عودة مستشفيين في الخرطوم إلى العمل جزئيا.",
    paket: "إعادة فتح المستشفيات في الخرطوم",
    saha: true,
    kanal: "eposta",
    durum: "planaEklendi",
    baslikId: "b-sudan",
    paketId: "p-hartum",
  },
  {
    id: "o-ticaret",
    muhabirId: "mu11",
    gun: "bugun",
    saat: "10:15",
    haber: "التجارة التركية الخليجية",
    gelisme: "بيانات التجارة لنهاية العام تصدر غدا.",
    paket: "حجم التجارة التركية الخليجية: توقعات نهاية العام",
    tur: "haber",
    durum: "planaEklendi",
    baslikId: "b-ekonomi",
    paketId: "p-ticaret",
  },
  {
    id: "o-kahire",
    muhabirId: "mu8",
    gun: "bugun",
    saat: "10:30",
    haber: "الوساطة المصرية",
    gelisme: "جولة جديدة من محادثات وقف إطلاق النار في غزة تبدأ غدا في القاهرة.",
    paket: "محادثات وقف إطلاق النار في القاهرة",
    durum: "yeni",
  },
  {
    id: "o-bagdat",
    muhabirId: "mu15",
    gun: "bugun",
    saat: "10:50",
    haber: "الانتخابات العراقية",
    gelisme: "مفاوضات تحالف جديدة بين الكتل الشيعية والسنية.",
    durum: "yeni",
  },
  {
    id: "o-amman",
    muhabirId: "mu17",
    gun: "bugun",
    saat: "11:10",
    haber: "أزمة المياه في الأردن",
    gelisme: "انقطاع المياه الأسبوعي في عمّان يرتفع إلى يومين.",
    paket: "شح المياه في الأردن ومشروع التحلية",
    tur: "feature",
    durum: "degerlendiriliyor",
  },
  {
    id: "o-tahran",
    muhabirId: "mu25",
    gun: "bugun",
    saat: "11:25",
    haber: "المحادثات النووية الإيرانية",
    gelisme: "تحديد موعد جولة جديدة من المحادثات غير المباشرة في عُمان.",
    kanal: "eposta",
    durum: "yeni",
  },
  {
    id: "o-kiev",
    muhabirId: "mu26",
    gun: "bugun",
    saat: "11:40",
    haber: "الحبوب الأوكرانية",
    gelisme: "ارتفاع شحنات الحبوب من موانئ البحر الأسود إلى الدول العربية.",
    paket: "كيف تصل الحبوب الأوكرانية إلى موائد العرب",
    tur: "ekonomi",
    durum: "sonra",
    gerekce: "Haftalık plandaki ekonomi dosyasında değerlendirilecek.",
  },
  {
    id: "o-doha",
    muhabirId: "mu18",
    gun: "bugun",
    saat: "12:00",
    haber: "الوساطة القطرية",
    gelisme: "وفود فنية تجتمع في الدوحة لبحث تبادل الأسرى.",
    durum: "degerlendiriliyor",
  },
  {
    id: "o-halep",
    muhabirId: "mu14",
    gun: "bugun",
    saat: "12:20",
    haber: "مدارس حلب",
    gelisme: "12 مدرسة مرممة في شرق حلب تبدأ استقبال الطلاب.",
    paket: "المدارس المرممة في حلب",
    saha: true,
    kanal: "mesaj",
    durum: "yeni",
  },
  {
    id: "o-rabat",
    muhabirId: "mu24",
    gun: "bugun",
    saat: "12:35",
    haber: "منطقة الزلزال في المغرب",
    gelisme: "إعادة الإعمار مستمرة في قرى جبال الأطلس.",
    tur: "feature",
    durum: "reddedildi",
    gerekce: "Güncel bir gelişme yok; stok feature olarak yeniden önerilebilir.",
  },
];

/* --- Plan başlıkları ve gelişmeler --- */

/*
 * Plan başlıkları: [kimlik, havuzdaki başlık, muhabirler]. Muhabirin
 * canlı saati "mu12@06:00" biçiminde, kurumun çıktısındaki "06G" gibi.
 */
interface PlanTanimi {
  basliklar: [string, string, string[]][];
  ekip: EkipUyesi[];
  gorevlendirmeler: string[];
  hazir: string[];
}

const e = (kisiId: string, gorev: EkipUyesi["gorev"], vardiya: string): EkipUyesi => ({ kisiId, gorev, vardiya });

/* Ekip stüdyo ve masa kadrosu; muhabirler başlıkların altında. */
const EKIP: EkipUyesi[] = [
  e("nd1", "yapimciSef", "04:00"),
  e("nd6", "yapimciSef", "13:00"),
  e("nd2", "bultenYapimcisi", "04:00"),
  e("nd3", "bultenYapimcisi", "08:00"),
  e("nd8", "bultenYapimcisi", "11:45"),
  e("nd9", "bultenYapimcisi", "20:00"),
  e("pr5", "sunucu", "02:00"),
  e("pr6", "sunucu", "06:00"),
  e("pr7", "sunucu", "10:30"),
  e("pl2", "muhabirMasasi", "04:00"),
  e("pl3", "muhabirMasasi", "08:00"),
  e("pr2", "roportajYapimcisi", "04:00"),
  e("ou6", "tercuman", "06:00"),
  e("ou7", "tercuman", "08:00"),
];

const PLAN_ICERIGI: Record<"dun" | "bugun" | "yarin", PlanTanimi> = {
  dun: {
    basliklar: [
      ["pb-d-filistin", "b-filistin", ["mu12"]],
      ["pb-d-sudan", "b-sudan", ["mu21"]],
      ["pb-d-irak", "b-irak", ["mu15"]],
      ["pb-d-turkiye", "b-turkiye", ["mu7"]],
    ],
    ekip: [e("nd1", "yapimciSef", "04:00"), e("nd4", "bultenYapimcisi", "08:00"), e("pr6", "sunucu", "06:00"), e("pl3", "muhabirMasasi", "04:00"), e("ou6", "tercuman", "06:00")],
    gorevlendirmeler: ["gr-washington"],
    hazir: ["hp7"],
  },
  bugun: {
    basliklar: [
      ["pb-b-filistin", "b-filistin", ["mu1@11:00", "mu2"]],
      ["pb-b-lubnan", "b-lubnan", ["mu3"]],
      ["pb-b-suriye", "b-suriye", ["mu13"]],
      ["pb-b-turkiye", "b-turkiye", ["mu6", "mu30"]],
      ["pb-b-ekonomi", "b-ekonomi", ["mu11"]],
      ["pb-b-abd", "b-abd", ["mu5"]],
      ["pb-b-bm", "b-bm", ["mu27@15:00"]],
    ],
    ekip: EKIP.slice(0, 12),
    gorevlendirmeler: ["gr-washington", "gr-izin-yusuf", "gr-kahire"],
    hazir: ["hp3", "hp8"],
  },
  yarin: {
    basliklar: [
      ["pb-y-ortadogu", "b-ortadogu", ["mu25", "mu3", "mu5"]],
      ["pb-y-ihlaller", "b-ihlaller", ["mu12@06:00", "mu1", "mu32", "mu31"]],
      ["pb-y-sudan", "b-sudan", ["mu21"]],
      ["pb-y-ukrayna", "b-rusya-ukrayna", ["mu26"]],
      ["pb-y-turkiye", "b-turk-gundem", ["mu7", "mu30"]],
      ["pb-y-ekonomi", "b-ekonomi", ["mu11"]],
    ],
    ekip: EKIP,
    gorevlendirmeler: ["gr-washington", "gr-kiev", "gr-izin-nour", "gr-refah"],
    hazir: ["hp4", "hp5"],
  },
};

/* [plan başlığı ya da "" (takip), yer, metin, kaynak türü, kaynak adı, öneren, önceki günden mi] */
type GelismeTanimi = [string, string | undefined, string, Gelisme["kaynakTuru"], string, string?, true?];

const GELISMELER: Record<"dun" | "bugun" | "yarin", GelismeTanimi[]> = {
  dun: [
    ["pb-d-filistin", "غزة", "إعادة فتح المدارس في الخيام بغزة.", "ajans", "Anadolu Ajansı"],
    ["pb-d-sudan", "الخرطوم", "الأمم المتحدة: تسارع العودة إلى الخرطوم.", "resmi", "UNHCR"],
    ["pb-d-irak", "بغداد", "انطلاق الحملة الانتخابية رسميا.", "ajans", "Reuters"],
  ],
  bugun: [
    ["pb-b-filistin", "غزة", "الصحة العالمية: أقل من نصف مستشفيات غزة تعمل جزئيا.", "resmi", "DSÖ"],
    ["pb-b-filistin", "القدس", "إقامة نقاط تفتيش جديدة عند أبواب الأقصى.", "muhabir", "", "mu2"],
    ["pb-b-lubnan", "بيروت", "40 دولة تؤكد مشاركتها في مؤتمر المانحين.", "ajans", "AFP"],
    ["pb-b-suriye", "دمشق", "المفوضية: أكثر من 500 ألف سوري عادوا هذا العام.", "resmi", "BMMYK"],
    ["pb-b-turkiye", "أنقرة", "البرلمان التركي يبدأ سنته التشريعية؛ خطاب الافتتاح الساعة 14:00.", "resmi", "TBMM"],
    ["pb-b-ekonomi", undefined, "سعر أونصة الذهب يتجاوز 2700 دولار.", "ajans", "Bloomberg"],
    ["pb-b-abd", "واشنطن", "جلسة الكونغرس حول الشرق الأوسط الساعة 10:00 بالتوقيت المحلي.", "medya", "C-SPAN"],
    ["pb-b-bm", "نيويورك", "الجمعية العامة تصوت على قرار بشأن فلسطين.", "resmi", "BM"],
    ["", "بروكسل", "وزراء خارجية الاتحاد الأوروبي يبحثون الشرق الأوسط الاثنين.", "ajans", "AFP"],
  ],
  yarin: [
    ["pb-y-ortadogu", "طهران", "أعلنت إيران أن المحادثات غير المباشرة مع الولايات المتحدة ستتواصل في عُمان، فيما تطالب طهران بجدول زمني لرفع العقوبات.", "ajans", "IRNA"],
    ["pb-y-ortadogu", "جنوب لبنان", "الحكومة اللبنانية تطلق أولى مشاريع التنمية لإعادة إعمار الجنوب.", "resmi", "Lübnan Başbakanlığı"],
    ["pb-y-ihlaller", "القدس", "مؤسسات مقدسية تدعو إلى الحشد في المسجد الأقصى لصلاة الجمعة.", "medya", "WAFA"],
    ["pb-y-ihlaller", "رفح", "مصر: بحث ترتيبات جديدة للعبور من رفح.", "ajans", "Anadolu Ajansı"],
    ["pb-y-sudan", "نيويورك", "مجلس الأمن يناقش الوضع في السودان غدا.", "resmi", "BM"],
    ["pb-y-ukrayna", "جنيف", "إحاطة شفهية حول الوضع في أوكرانيا أمام مجلس حقوق الإنسان الأممي.", "resmi", "BM"],
    ["pb-y-turkiye", "أنقرة", "وزير الخارجية التركي يعقد مؤتمرا صحفيا قبل جولته الخليجية.", "resmi", "Dışişleri Bakanlığı"],
    ["pb-y-ekonomi", undefined, "OPEC+ تجتمع الأحد؛ تقلب أسعار النفط قبل القرار.", "ajans", "Reuters"],
    ["", "واشنطن", "مجلس الشيوخ الأمريكي يعقد جلسته الأخيرة قبل الانتخابات النصفية.", "medya", "AP", undefined, true],
    ["", "القاهرة", "مصر تستضيف منتدى للاستثمار في أفريقيا.", "ajans", "MENA"],
    ["", "بروكسل", "وزراء خارجية الاتحاد الأوروبي يبحثون الشرق الأوسط.", "ajans", "AFP"],
  ],
};

/* --- Muhabir hareketleri --- */

const GOREVLENDIRMELER = (gun: (n: number) => string): Gorevlendirme[] => [
  {
    id: "gr-washington",
    kisiId: "mu5",
    tur: "gorevlendirme",
    yer: "واشنطن",
    baslangic: gun(-10),
    bitis: gun(35),
    aciklama: "مهمة في واشنطن قبل الانتخابات النصفية الأمريكية.",
    durum: "suruyor",
  },
  {
    id: "gr-izin-yusuf",
    kisiId: "mu10",
    tur: "izin",
    yer: "إسطنبول",
    baslangic: gun(-1),
    bitis: gun(1),
    aciklama: "إجازة سنوية.",
    durum: "suruyor",
  },
  {
    id: "gr-kahire",
    kisiId: "mu4",
    tur: "seyahat",
    yer: "القاهرة ← إسطنبول",
    baslangic: gun(0),
    bitis: gun(2),
    aciklama: "برنامج تدريبي في المقر.",
    durum: "suruyor",
  },
  {
    id: "gr-kiev",
    kisiId: "mu26",
    tur: "seyahat",
    yer: "كييف ← أوديسا",
    baslangic: gun(1),
    bitis: gun(3),
    aciklama: "تصوير شحنات الحبوب في الميناء.",
    durum: "onayli",
  },
  {
    id: "gr-izin-nour",
    kisiId: "mu9",
    tur: "izin",
    yer: "بيروت",
    baslangic: gun(0),
    bitis: gun(2),
    aciklama: "إجازة مرضية.",
    durum: "suruyor",
  },
  {
    id: "gr-refah",
    kisiId: "mu12",
    tur: "gorevlendirme",
    yer: "معبر رفح",
    baslangic: gun(1),
    bitis: gun(1),
    aciklama: "بث مباشر صباحي وتصوير ميداني.",
    durum: "onayli",
  },
  {
    id: "gr-doha",
    kisiId: "mu6",
    tur: "gorevlendirme",
    yer: "الدوحة",
    baslangic: gun(4),
    bitis: gun(7),
    aciklama: "قمة مجلس التعاون الخليجي.",
    durum: "talep",
  },
];

/* --- Canlı yayınlar --- */

const CANLILAR = (planId: (k: "dun" | "bugun" | "yarin") => string, gun: (n: number) => string): CanliYayin[] => [
  {
    id: "cy-gazze",
    planId: planId("bugun"),
    planBaslikId: "pb-b-filistin",
    konu: "غزة: بث مباشر من أمام مستشفى الشفاء",
    aciklama: "",
    tarih: gun(0),
    saatGmt: "11:00",
    yer: "غزة",
    muhabirId: "mu1",
    notlar: "اختبار خط الأقمار الصناعية الساعة 10:45.",
  },
  {
    id: "cy-bm",
    planId: planId("bugun"),
    konu: "تصويت الجمعية العامة للأمم المتحدة",
    aciklama: "تحليل من نيويورك بعد التصويت.",
    tarih: gun(0),
    saatGmt: "15:00",
    yer: "نيويورك",
    muhabirId: "mu27",
    notlar: "",
  },
  {
    id: "cy-refah",
    planId: planId("yarin"),
    planBaslikId: "pb-y-ihlaller",
    konu: "بث مباشر من معبر رفح",
    aciklama: "الشاحنات العالقة وتصريح الأمم المتحدة.",
    tarih: gun(1),
    saatGmt: "07:00",
    yer: "رفح",
    muhabirId: "mu12",
    notlar: "بانتظار الإذن من الجانب المصري.",
  },
  {
    id: "cy-guvenlik",
    planId: planId("yarin"),
    konu: "مجلس الأمن: جلسة بشأن السودان",
    aciklama: "بث مباشر لافتتاح الجلسة.",
    tarih: gun(1),
    saatGmt: "14:00",
    yer: "نيويورك",
    muhabirId: "mu27",
    notlar: "",
  },
  {
    id: "cy-ankara",
    planId: planId("yarin"),
    konu: "المؤتمر الصحفي لوزير الخارجية التركي",
    aciklama: "تصريح قبل الجولة الخليجية.",
    tarih: gun(1),
    saatGmt: "10:30",
    yer: "أنقرة",
    muhabirId: "mu7",
    notlar: "الترجمة الفورية: رشا حمدان.",
  },
  {
    id: "cy-zirve",
    planId: planId("yarin"),
    konu: "افتتاح القمة الخليجية",
    aciklama: "",
    tarih: gun(4),
    saatGmt: "09:00",
    yer: "الدوحة",
    muhabirId: "mu6",
    notlar: "القمة الأسبوع المقبل؛ تُنقل إلى خطة يوم البث.",
    // İleri tarihli canlı yayın şablonla dünden geldi.
    onceki: true,
  },
];

/* --- Haftalık, aylık, özel --- */

/*
 * Haftalık plan kalemi: [gün (Cumartesi=0, null: zamana bağlı olmayan),
 * dosya, olayın adı, yer, metin, kol, biçimler, muhabirler, not]. Düzen
 * kurumun haftalık çıktısından; içerik kurgusal.
 */
type KalemSatiri = [number | null, string | undefined, string | undefined, string | undefined, string, IcerikTuru, Bicim[], string[], string?];

/* Bu hafta: geçen Perşembe kesinleşti. Bugünün haberleri bugünün planına aktarıldı. */
const BU_HAFTA_DOSYALARI: [string, string][] = [
  ["الانتهاكات الإسرائيلية في فلسطين", "تتواصل الاعتداءات في الضفة الغربية والقدس، مع تصاعد عمليات الهدم والاعتقالات وتشديد القيود على الحركة، فيما تتفاقم الأزمة الإنسانية في قطاع غزة."],
  ["الحرب الروسية الأوكرانية", "تتبادل موسكو وكييف الضربات على منشآت الطاقة مع اقتراب الشتاء، وسط تحركات دبلوماسية لعقد جولة مفاوضات جديدة."],
  ["الوضع في السودان", "يستمر القتال في كردفان ودارفور، وتحذر المنظمات الإنسانية من موجة نزوح جديدة ونقص حاد في الغذاء والدواء."],
];

const GELECEK_HAFTA_DOSYALARI: [string, string][] = [
  ["الانتهاكات الإسرائيلية في فلسطين", "تحل الذكرى السنوية للحرب على غزة هذا الأسبوع، مع فعاليات في الداخل الفلسطيني وعواصم عدة، واستمرار المفاوضات حول وقف إطلاق النار وإدخال المساعدات."],
  ["المفاوضات الأمريكية الإيرانية", "جولة جديدة من المحادثات غير المباشرة بوساطة عمانية، وسط تصريحات متباينة حول الملف النووي ورفع العقوبات."],
  ["العراق بعد انسحاب التحالف الدولي", "متابعة المشهد الأمني والسياسي بعد انتهاء مهمة التحالف الدولي، وموقف القوى السياسية من الوجود العسكري الأجنبي."],
];

const GELECEK_HAFTA: KalemSatiri[] = [
  [0, "b-ihlaller", "إحياء ذكرى هبة القدس والأقصى", "القدس", "برنامج زيارات لأضرحة الشهداء وفعاليات في البلدات العربية بدعوة من لجنة المتابعة العليا.", "haber", ["pkg", "canli"], ["mu2"]],
  [0, "b-ihlaller", undefined, "مدريد", "تجمعات تضامنية مع أطفال غزة في الساحات العامة تحت شعار الطائرات الورقية.", "haber", [], []],
  [0, "b-turk-gundem", "مهرجان تكنوفيست", "شانلي أورفا", "انطلاق مهرجان تكنولوجيا الطيران والفضاء بمشاركة شركات الصناعات الدفاعية والجامعات.", "haber", ["canli", "pkg"], ["mu7"]],
  [1, "b-bosna", "الانتخابات العامة", "سراييفو", "يتوجه الناخبون لاختيار أعضاء مجلس الرئاسة والبرلمان على مستوى الدولة والكيانين.", "haber", ["pkg", "canli", "walktalk"], ["mu11", "mu30"], "فريق البلقان في مهمة طوال الأسبوع"],
  [1, "b-turk-gundem", "ندوة التراث الفكري", "إسطنبول", "ندوة دولية حول التراث الفكري العثماني بمشاركة أكاديميين من العالم العربي.", "haber", ["pkg"], []],
  [2, "b-iran", "المحادثات الأمريكية الإيرانية", "مسقط", "جولة جديدة من المحادثات غير المباشرة بوساطة عمانية.", "haber", ["pkg"], ["mu25"]],
  [3, "b-sudan", undefined, "الخرطوم", "مؤتمر صحفي لوزارة الصحة حول إعادة تشغيل المستشفيات المتضررة.", "haber", ["pkg"], ["mu21"]],
  [3, "b-ekonomi", "اجتماع OPEC+ الشهري", "فيينا", "قرار سقف الإنتاج للشهر المقبل وأثره على أسعار النفط وموازنات دول الخليج.", "ekonomi", ["pkg"], ["mu19"]],
  [4, "b-ihlaller", "الذكرى السنوية للحرب على غزة", "غزة", "تغطية خاصة: بث مباشر من غزة ورام الله والقدس، وتقارير عن العائلات النازحة.", "haber", ["canli", "pkg"], ["mu1", "mu31", "mu2"], "تُنسَّق مع خطة البث الخاص"],
  [4, "b-bm", "جلسة مجلس الأمن حول الشرق الأوسط", "نيويورك", "جلسة شهرية حول الوضع في الشرق الأوسط بما فيه القضية الفلسطينية.", "haber", ["pkg"], ["mu27"]],
  [5, "b-abd", undefined, "واشنطن", "مناظرة انتخابية في ولاية متأرجحة قبل الانتخابات النصفية.", "haber", ["pkg"], ["mu5"]],
  [5, "b-irak", "ما بعد انسحاب التحالف الدولي", "بغداد", "قراءة في المشهد الأمني بعد انتهاء مهمة التحالف، مع مقابلات مع مسؤولين وخبراء.", "haber", ["pkg"], ["mu15"]],
  [6, "b-lubnan", undefined, "بيروت", "جلسة نيابية لمناقشة مشروع قانون الموازنة.", "haber", [], []],
  [null, "b-korfez", "مقاهي القاهرة القديمة", "القاهرة", "قصص أصحاب المقاهي التاريخية وروادها في وسط البلد.", "feature", ["feature"], ["mu4"]],
  [null, undefined, "برنامج: أصوات من المخيمات", "عمّان", "حلقة عن شباب المخيمات ومشاريعهم الصغيرة لصالح البرنامج الأسبوعي.", "program", ["derinlemesine"], ["mu17"]],
];

/*
 * Bu haftanın kesinleşmiş gündeminden bilgi (takip yok) ve ret kalemleri;
 * kabul edilenler ORNEK içinde, aktarıldıkları paketlerle birlikte.
 */
const BU_HAFTA: KalemSatiri[] = [
  [0, "b-rusya-ukrayna", undefined, "كييف", "تحضيرات الشتاء وحماية منشآت الطاقة من الضربات.", "haber", [], []],
  [1, "b-ihlaller", "يوم التضامن مع الأسرى", "رام الله", "وقفات أمام مقرات الصليب الأحمر في مدن الضفة الغربية.", "haber", [], []],
  [2, "b-turk-gundem", "معرض الكتاب العربي", "إسطنبول", "دورة جديدة لمعرض الكتاب العربي بمشاركة دور نشر من عشرين دولة.", "haber", [], []],
  [3, "b-sudan", undefined, "بورتسودان", "اجتماع للمانحين حول الاستجابة الإنسانية.", "haber", [], []],
  [5, "b-abd", undefined, "نيويورك", "فعالية لجمعيات عربية أمريكية حول الانتخابات النصفية.", "haber", ["pkg"], ["mu27"]],
];
const BU_HAFTA_KARAR: HaftalikKalem["karar"][] = ["bilgi", "bilgi", "bilgi", "bilgi", "ret"];

const AY_KALEMLERI: [string, IcerikTuru, boolean][] = [
  ["ملف فلسطين: بعد عام", "haber", true],
  ["التحضير للانتخابات النصفية الأمريكية", "haber", true],
  ["الوضع الإنساني في السودان", "haber", false],
  ["العالم العربي قبيل قمة المناخ", "feature", false],
  ["التجارة بين الخليج وتركيا", "ekonomi", true],
  ["الترويج لبرامج الموسم الجديد", "program", false],
];

/*
 * Planlama takvimi. Tarihler bugüne göre: takvim hangi gün açılırsa açılsın
 * önü dolu, arkasında arşiv olsun. Yalnız günü sabit olanlar (ABD ara
 * seçimi, yıldönümü, resmî gün, BM Genel Kurulu) yılın kendi gününde; onlar
 * da tekrarlı olduğu için her yıl görünüyor. Bir gün bilerek kalabalık
 * (+16): ay görünümünde "+N faaliyet daha" görünsün.
 */
const FAALIYETLER = (B: string, yil: string): Faaliyet[] => {
  const gun = (n: number) => gunEkle(B, n);
  const kayit = zaman(gun(-12), "10:30");
  const f = (id: string, tur: FaaliyetTuru, baslik: string, baslangic: string, ek: Partial<Faaliyet> = {}): Faaliyet => ({
    id,
    tur,
    baslik,
    baslangic,
    bitis: baslangic,
    oncelik: "normal",
    potansiyel: "oneri",
    durum: "takipte",
    bolge: "kuresel",
    baglantilar: [],
    olusturan: "pl2",
    olusturma: kayit,
    guncelleme: kayit,
    ...ek,
  });
  const kalabalik = gun(16);
  return [
    f("f-abd", "secim", "الانتخابات النصفية الأمريكية", `${yil}-11-03`, {
      ulke: "abd",
      bolge: "amerika",
      sehir: "واشنطن",
      oncelik: "kritik",
      potansiyel: "ozelYayin",
      birim: "planlama",
      muhabirId: "mu5",
      hatirlatma: { once: "1a" },
      durum: "planaAlindi",
      notlar: "Özel yayın planı açıldı; Washington ekibi ve seçim gecesi yayını oradan izleniyor.",
      baglantilar: [{ tur: "ozel", planId: "oz-abd", tarih: `${yil}-11-03`, kisiId: "pl2", zaman: zaman(gun(-9), "11:20") }],
    }),
    f("f-bm", "toplanti", "الدورة العادية للجمعية العامة للأمم المتحدة", `${yil}-09-22`, {
      bitis: `${yil}-09-26`,
      sehir: "نيويورك",
      oncelik: "yuksek",
      potansiyel: "kesin",
      birim: "planlama",
      muhabirId: "mu27",
      tekrar: { siklik: "yillik" },
      hatirlatma: { once: "1h" },
      notlar: "Türkiye ve Arap liderlerin konuşma saatleri BM programından teyit edilecek.",
    }),
    f("f-nato", "zirve", "قمة حلف شمال الأطلسي (الناتو)", gun(38), { bitis: gun(39), ulke: "belcika", bolge: "avrupa", sehir: "بروكسل", oncelik: "yuksek", potansiyel: "kesin", muhabirId: "mu28", hatirlatma: { once: "1h" } }),
    f("f-cop", "konferans", "مؤتمر الأمم المتحدة للمناخ COP31", gun(35), {
      bitis: gun(46),
      ulke: "turkiye",
      bolge: "turkiyeCevresi",
      sehir: "أنطاليا",
      oncelik: "yuksek",
      potansiyel: "ozelYayin",
      birim: "planlama",
      hatirlatma: { once: "1a" },
      notlar: "Ev sahibi Türkiye: özel yayın adayı. Akreditasyon bir ay önce kapanıyor.",
    }),
    f("f-iac", "konferans", "المؤتمر الدولي للملاحة الفضائية (IAC)", gun(0), { bitis: gun(4), saat: "09:00", ulke: "turkiye", bolge: "turkiyeCevresi", sehir: "أنطاليا", birim: "planlama", muhabirId: "mu6", hatirlatma: { once: "3g" } }),
    f("f-basin", "toplanti", "مؤتمر صحفي لوزير الخارجية التركي", gun(1), { saat: "12:00", ulke: "turkiye", bolge: "turkiyeCevresi", sehir: "أنقرة", muhabirId: "mu30", hatirlatma: { once: "1g" } }),
    f("f-doha", "ziyaret", "زيارة الرئيس التركي إلى الدوحة", gun(6), { saat: "11:00", ulke: "katar", bolge: "korfez", sehir: "الدوحة", oncelik: "yuksek", potansiyel: "kesin", muhabirId: "mu18", hatirlatma: { once: "1h" } }),
    f("f-iptal", "zirve", "قمة ثلاثية في عمّان", gun(4), { ulke: "urdun", bolge: "ortadogu", sehir: "عمّان", durum: "iptal", notlar: "Ertelendi; yeni tarih açıklanmadı." }),
    f("f-gorev", "gorevlendirme", "مهمة تغطية: قمة منظمة الدول التركية", gun(11), {
      bitis: gun(13),
      ulke: "azerbaycan",
      bolge: "turkiyeCevresi",
      sehir: "باكو",
      potansiyel: "kesin",
      birim: "planlama",
      muhabirId: "mu7",
      notlar: "Görevlendirme yazısı Planlama'dan; uçuş ve akreditasyon muhabirde.",
    }),
    f("f-dava", "dava", "محكمة العدل الدولية: جلسة استماع علنية", gun(14), { saat: "10:00", sehir: "لاهاي", oncelik: "yuksek", potansiyel: "kesin", birim: "newsdesk" }),
    f("f-ab", "zirve", "قمة قادة الاتحاد الأوروبي", gun(18), { bitis: gun(19), ulke: "belcika", bolge: "avrupa", sehir: "بروكسل", potansiyel: "takip", muhabirId: "mu28" }),
    f("f-taslak", "ziyaret", "زيارة مرتقبة لوفد أوروبي إلى طرابلس", gun(21), {
      ulke: "libya",
      bolge: "kuzeyAfrika",
      sehir: "طرابلس",
      oncelik: "dusuk",
      potansiyel: "takip",
      durum: "taslak",
      notlar: "Tarih kesin değil; diplomatik kaynaklardan teyit bekleniyor.",
      olusturma: zaman(gun(-1), "15:40"),
      guncelleme: zaman(gun(-1), "15:40"),
    }),
    f("f-zirve-arap", "zirve", "القمة العربية الطارئة", kalabalik, { ulke: "misir", bolge: "kuzeyAfrika", sehir: "القاهرة", oncelik: "yuksek", potansiyel: "kesin", muhabirId: "mu4" }),
    f("f-gazze", "konferans", "مؤتمر المانحين لإعادة إعمار غزة", kalabalik, { saat: "10:00", ulke: "misir", bolge: "kuzeyAfrika", sehir: "القاهرة", oncelik: "kritik", potansiyel: "ozelYayin", muhabirId: "mu8" }),
    f("f-faiz", "ekonomi", "قرار البنك المركزي التركي بشأن سعر الفائدة", kalabalik, { saat: "14:00", ulke: "turkiye", bolge: "turkiyeCevresi", sehir: "أنقرة", birim: "ekonomi" }),
    f("f-suudi", "ziyaret", "زيارة وزير الخارجية السعودي إلى أنقرة", kalabalik, { ulke: "turkiye", bolge: "turkiyeCevresi", sehir: "أنقرة" }),
    f("f-sinema", "kultur", "افتتاح مهرجان القاهرة السينمائي الدولي", kalabalik, { bitis: gun(25), ulke: "misir", bolge: "kuzeyAfrika", sehir: "القاهرة", oncelik: "dusuk", potansiyel: "takip", birim: "program" }),
    f("f-kitap", "kultur", "معرض الشارقة الدولي للكتاب", gun(30), { bitis: gun(41), ulke: "bae", bolge: "korfez", sehir: "الشارقة", oncelik: "dusuk", birim: "program" }),
    f("f-irak", "secim", "الانتخابات البرلمانية العراقية", gun(52), {
      ulke: "irak",
      bolge: "ortadogu",
      sehir: "بغداد",
      oncelik: "kritik",
      potansiyel: "ozelYayin",
      birim: "planlama",
      muhabirId: "mu15",
      hatirlatma: { once: "1a" },
      notlar: "تغطية من بغداد وأربيل؛ يُقترح بث خاص ليلة إعلان النتائج.",
    }),
    f("f-kupa", "spor", "انطلاق بطولة كأس العرب لكرة القدم", gun(60), { bitis: gun(78), ulke: "katar", bolge: "korfez", sehir: "الدوحة", birim: "newsdesk" }),
    f("f-opec", "ekonomi", "اجتماع تحالف أوبك+", gun(-35), { saat: "13:00", sehir: "فيينا", birim: "ekonomi", tekrar: { siklik: "aylik" }, notlar: "Her ay; üretim kararı akşam açıklanıyor." }),
    f("f-15temmuz", "yildonumu", "ذكرى إحباط المحاولة الانقلابية في تركيا", `${yil}-07-15`, { ulke: "turkiye", bolge: "turkiyeCevresi", sehir: "أنقرة", oncelik: "yuksek", potansiyel: "ozelYayin", birim: "program", tekrar: { siklik: "yillik" } }),
    f("f-arapca", "ozelGun", "اليوم العالمي للغة العربية", `${yil}-12-18`, { birim: "program", tekrar: { siklik: "yillik" }, notlar: "Program biriminin özel içerikleri; sosyal medya kampanyası." }),
    /* Her yıl aynı günde: yıl görünümünün ilk yarısı da dolu olsun. */
    f("f-davos", "ekonomi", "المنتدى الاقتصادي العالمي في دافوس", `${yil}-01-20`, { bitis: `${yil}-01-23`, sehir: "دافوس", birim: "ekonomi", tekrar: { siklik: "yillik" } }),
    f("f-munih", "konferans", "مؤتمر ميونخ للأمن", `${yil}-02-13`, { bitis: `${yil}-02-15`, ulke: "almanya", bolge: "avrupa", sehir: "ميونخ", potansiyel: "takip", tekrar: { siklik: "yillik" } }),
    f("f-adf", "konferans", "منتدى أنطاليا الدبلوماسي", `${yil}-03-06`, {
      bitis: `${yil}-03-08`,
      ulke: "turkiye",
      bolge: "turkiyeCevresi",
      sehir: "أنطاليا",
      oncelik: "yuksek",
      potansiyel: "kesin",
      birim: "planlama",
      tekrar: { siklik: "yillik" },
    }),
    f("f-basin-ozgurlugu", "ozelGun", "اليوم العالمي لحرية الصحافة", `${yil}-05-03`, { birim: "program", tekrar: { siklik: "yillik" } }),
    f("f-nekbe", "yildonumu", "ذكرى النكبة", `${yil}-05-15`, { ulke: "filistin", bolge: "ortadogu", oncelik: "yuksek", potansiyel: "ozelYayin", tekrar: { siklik: "yillik" } }),
    f("f-multeci", "ozelGun", "اليوم العالمي للاجئين", `${yil}-06-20`, { birim: "program", tekrar: { siklik: "yillik" } }),
    /* Arşiv: geçmiş, tamamlanmış; biri dünkü Next Day planına gelişme olarak alınmış. */
    f("f-korfez", "toplanti", "اجتماع وزراء خارجية دول مجلس التعاون الخليجي", gun(-1), {
      ulke: "suudi",
      bolge: "korfez",
      sehir: "الرياض",
      potansiyel: "kesin",
      durum: "tamamlandi",
      baglantilar: [{ tur: "nextday", planId: "nd-dun", kayitId: "g-f-korfez", tarih: gun(-1), kisiId: "pl2", zaman: zaman(gun(-2), "11:05") }],
    }),
    f("f-fas", "secim", "الانتخابات التشريعية المغربية", gun(-25), { ulke: "fas", bolge: "kuzeyAfrika", sehir: "الرباط", oncelik: "yuksek", potansiyel: "kesin", muhabirId: "mu24", durum: "tamamlandi" }),
    f("f-enerji", "konferans", "منتدى إسطنبول للطاقة", gun(-20), { bitis: gun(-19), ulke: "turkiye", bolge: "turkiyeCevresi", sehir: "إسطنبول", birim: "ekonomi", durum: "tamamlandi" }),
  ];
};

/* --- Hareket geçmişi üretimi --- */

const DAKIKA = 60_000;

/**
 * Bugün üretimdeki paketin adımları devir saatinden şu ana kadar eşit
 * aralıklarla diziliyor; böylece sayfa sabah da akşam da açılsa geçmiş
 * sırası bozulmuyor ve ileri tarihli hareket çıkmıyor.
 */
const dizi = (bas: number, son: number, n: number) => {
  const ara = Math.min(40 * DAKIKA, Math.max(DAKIKA, (son - bas) / (n + 1)));
  return Array.from({ length: n }, (_, i) => new Date(bas + ara * (i + 1)).toISOString());
};

const ADIM_HAREKETI: Record<UretimAdimi, HareketTipi> = {
  gorevlendirme: "gorevlendirildi",
  newsdesk: "gorevVerildi",
  metin: "metinGeldi",
  kontrol: "kontrolEdildi",
  dil: "sonScript",
  video: "videoGeldi",
  iletim: "mediayaGonderildi",
  media: "klipKodu",
  inews: "tamamlandi",
};

/* Adımı kimin attığı: o birimin örnek kişisi; muhabir adımında paketin muhabiri. */
const ADIM_KISISI: Record<string, string> = {
  newsgathering: "ng2",
  newsdesk: "nd3",
  output: "ou5",
  media: "me2",
  planlama: "pl6",
  program: "pr2",
};

/*
 * Son iki ayın tamamlanmış işleri: muhabir profilindeki göstergeler boş
 * kalmasın diye. Kurgusal ama her açılışta aynı (tohumlu üretim); teslim
 * hızı, düzeltme ve puan eğilimi kişiden kişiye değişiyor ki göstergeler
 * birbirinden ayrışsın.
 */
const ARSIV_BASLIKLARI = [
  "أسعار الخبز ترتفع في {س}",
  "{س}: أزمة السكن تضغط على العائلات الشابة",
  "مستشفيات {س} بين نقص الأدوية وضغط المرضى",
  "حرفيون في {س} يحافظون على مهن الأجداد",
  "الكهرباء في {س}: ساعات انقطاع أطول",
  "{س}: مبادرة شبابية لتنظيف الأحياء",
  "مهرجان ثقافي يجمع الفنانين في {س}",
  "{س}: تراجع السياحة وأثره على التجار",
  "المياه في {س}: آبار تجف ومزارعون يبحثون عن حلول",
  "الشباب في {س} بين الهجرة والبقاء",
  "حركة النقل في {س} بعد رفع أسعار الوقود",
  "{س}: مكتبة عامة تعود إلى الحياة",
  "ملاعب الأحياء في {س} تصنع أبطالا",
  "{س}: الاستثمار في الطاقة الشمسية",
  "صيادو {س} يواجهون موسما صعبا",
  "{س}: مطاعم شعبية تقاوم الغلاء",
  "الجامعات في {س} وتكلفة الدراسة",
  "{س}: انتخابات محلية وأولويات السكان",
  "تراث {س} المعماري في خطر",
  "{س}: متطوعون يساعدون كبار السن",
  "المزارعون في {س} وأسعار الأسمدة",
  "أسواق {س} قبل العطلة",
];

const BICIM_SLUG: Record<Bicim, string> = {
  pkg: "PKG",
  canli: "LIVE",
  voxpop: "VOX",
  walktalk: "WT",
  feature: "FEAT",
  derinlemesine: "DEEP",
  ozelRoportaj: "INT",
  hikayem: "STORY",
};

/* mulberry32: ardışık tohumlar da birbirinden bağımsız dizi versin (basit doğrusal üreteçte ilk değerler neredeyse aynıydı). */
const tohumlu = (t: number) => () => {
  t = (t + 0x6d2b79f5) | 0;
  let x = Math.imul(t ^ (t >>> 15), 1 | t);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};

export const ORNEK = (): Durum => {
  const B = bugun();
  const gun = (n: number) => gunEkle(B, n);
  const an = Date.now();
  /* Bugünün saati, ama şu andan ileri değil: sayfa sabah açılırsa sabah hareketleri biraz öne çekiliyor. */
  const bugunSaat = (s: string, geri = 10) => {
    const t = new Date(zaman(B, s)).getTime();
    return new Date(Math.min(t, an - geri * DAKIKA)).toISOString();
  };

  const planId = (k: "dun" | "bugun" | "yarin") => `nd-${k}`;
  const planTarihi = { dun: gun(-1), bugun: gun(0), yarin: gun(1) };
  const planDurumu = { dun: "devralindi", bugun: "devralindi", yarin: "taslak" } as const;

  /*
   * Yarının planı bugünkünün şablonuyla açılmış: bugünde de olan ekip
   * üyesi, hareket ve aynı başlıktaki muhabir "önceki günden" işaretli,
   * kalanı bugün eklenmiş. Ekranda ikisi yan yana görünsün.
   */
  const sablon = PLAN_ICERIGI.bugun;
  const sablondaMuhabir = (baslikId: string, kisiId: string) => sablon.basliklar.some(([, b, ms]) => b === baslikId && ms.some((m) => m.split("@")[0] === kisiId));
  const planlar: NextDayPlan[] = (["yarin", "bugun", "dun"] as const).map((k) => ({
    id: planId(k),
    tarih: planTarihi[k],
    durum: planDurumu[k],
    ekip: k === "yarin" ? PLAN_ICERIGI[k].ekip.map((e) => (sablon.ekip.some((x) => x.kisiId === e.kisiId) ? { ...e, onceki: true as const } : e)) : PLAN_ICERIGI[k].ekip,
    gorevlendirmeler: PLAN_ICERIGI[k].gorevlendirmeler,
    oncekiHareketler: k === "yarin" ? PLAN_ICERIGI[k].gorevlendirmeler.filter((g) => sablon.gorevlendirmeler.includes(g)) : undefined,
    hazirPaketler: PLAN_ICERIGI[k].hazir,
    basliklar: PLAN_ICERIGI[k].basliklar.map(([id, baslikId, muhabirler]) => ({
      id,
      baslikId,
      muhabirler: muhabirler.map((m) => {
        const [kisiId, saat] = m.split("@");
        const onceki = k === "yarin" && sablondaMuhabir(baslikId, kisiId) ? { onceki: true as const } : {};
        return saat ? { kisiId, saat, ...onceki } : { kisiId, ...onceki };
      }),
    })),
    kopyaKaynagi: k === "yarin" ? planId("bugun") : undefined,
    olusturan: "pl2",
    olusturma: k === "yarin" ? bugunSaat("08:50") : zaman(gunEkle(planTarihi[k], -1), "08:50"),
  }));

  /* Önerinin gönderildiği gün, karar verdiği planın bir gün öncesi. */
  const oneriler: (Oneri & { muhabirId: string })[] = ONERILER.map((o, i) => {
    const muhabir = KISILER.find((k) => k[0] === o.muhabirId);
    const sehir = (muhabir?.[6] ?? "istanbul") as Sehir;
    const hedef = o.gun === "dun" ? "bugun" : "yarin";
    return {
      id: o.id,
      muhabirId: o.muhabirId,
      ulke: SEHIR_ULKESI[sehir],
      haberBasligi: o.haber,
      gelisme: o.gelisme,
      paketBasligi: o.paket,
      tur: o.tur ?? "haber",
      bicim: varsayilanBicim(o.tur ?? "haber"),
      sahaGerekli: !!o.saha,
      zaman: o.gun === "dun" ? zaman(gun(-1), o.saat) : bugunSaat(o.saat, 30),
      /* Bugün önerilerin çoğu çağrı e-postasına yanıtla geliyor; beşte biri uygulamadan. */
      kanal: o.kanal ?? (i % 5 === 0 ? "sistem" : "eposta"),
      hedefTarih: planTarihi[hedef],
      durum: o.durum,
      cagriId: o.gun === "dun" ? "c-dun" : "c-bugun",
      baslikId: o.baslikId,
      planId: o.durum === "planaEklendi" ? planId(hedef) : undefined,
      paketId: o.paketId,
      gerekce: o.gerekce,
      geriDonus: o.gun === "dun",
    };
  });

  const hareketler: Hareket[] = [];
  let hs = 0;
  const h = (kisiId: string, tip: HareketTipi, z: string, ek: Partial<Hareket> = {}) =>
    hareketler.push({ id: `h${++hs}`, zaman: z, kisiId, tip, ...ek });

  /* Çağrılar ve plan hareketleri. */
  h("pl2", "cagriHazirlandi", zaman(gun(-1), "09:10"), { veri: { tarih: gun(0), sahip: "muhabir" } });
  h("pl2", "cagriHazirlandi", bugunSaat("09:15", 60), { veri: { tarih: gun(1), sahip: "muhabir" } });
  h("pl2", "planKopyalandi", bugunSaat("08:50", 70), { planId: planId("yarin"), veri: { tarih: gun(1), kaynak: gun(0) } });
  for (const k of ["dun", "bugun"] as const) {
    const once = gunEkle(planTarihi[k], -1);
    h("pl2", "planOlusturuldu", zaman(once, "08:50"), { planId: planId(k), veri: { tarih: planTarihi[k] } });
    h("pl2", "planToplantida", zaman(once, "16:55"), { planId: planId(k), veri: { tarih: planTarihi[k], sahip: "yonetim" } });
    h("pl1", "planOnaylandi", zaman(once, "17:45"), { planId: planId(k), veri: { tarih: planTarihi[k], sahip: "newsdesk" } });
  }
  const devirDun = zaman(gun(-1), "08:30");
  const devirBugun = bugunSaat("08:30", 240);
  h("nd1", "planDevralindi", devirDun, { planId: planId("dun"), veri: { tarih: gun(-1) } });
  h("nd1", "planDevralindi", devirBugun, { planId: planId("bugun"), veri: { tarih: gun(0) } });

  /* Öneri hareketleri. */
  for (const o of oneriler) {
    h(o.muhabirId, "oneriGeldi", o.zaman, { oneriId: o.id, veri: { sahip: "planlama" } });
    const sonra = (dk: number) => new Date(Math.min(new Date(o.zaman).getTime() + dk * DAKIKA, an - 5 * DAKIKA)).toISOString();
    if (o.durum === "degerlendiriliyor") h("pl2", "oneriDegerlendirmede", sonra(40), { oneriId: o.id });
    if (o.durum === "sonra") h("pl3", "oneriSonra", sonra(55), { oneriId: o.id, veri: { gerekce: o.gerekce ?? "" } });
    if (o.durum === "reddedildi") h("pl3", "oneriReddedildi", sonra(60), { oneriId: o.id, veri: { gerekce: o.gerekce ?? "" } });
    if (o.durum === "planaEklendi") {
      const plan = planlar.find((p) => p.id === o.planId);
      h("pl2", "oneriPlanaEklendi", sonra(70), { oneriId: o.id, paketId: o.paketId, planId: o.planId, veri: { tarih: plan?.tarih ?? "" } });
    }
    if (o.geriDonus) h("pl2", "geriDonus", zaman(gun(-1), "19:05"), { oneriId: o.id, planId: o.planId, veri: { sonuc: o.durum } });
  }

  /*
   * E-postayla gelen önerinin kaynağı: çağrıya verilen yanıt. Sunucu
   * fazında posta kutusundan gelecek; burada örnek. Ayrıca "önerim yok"
   * yanıtları ve rehberde olmayan bir adresten gelen e-posta.
   */
  const cagriTarihi: Record<string, string> = { "c-dun": gun(0), "c-bugun": gun(1) };
  const muhabirSatiri = (id: string) => KISILER.find((r) => r[0] === id)!;
  const yanitlar: Yanit[] = [];
  for (const o of oneriler.filter((x) => x.kanal === "eposta" && x.cagriId)) {
    const tarih = cagriTarihi[o.cagriId!];
    const ad = muhabirSatiri(o.muhabirId)[1];
    const metin = [o.haberBasligi, o.gelisme, o.paketBasligi ? `PKG: ${o.paketBasligi}` : ""].filter(Boolean).join("\n");
    o.yanitId = `y-${o.id}`;
    yanitlar.push({
      id: o.yanitId,
      cagriId: o.cagriId,
      kisiId: o.muhabirId,
      kimden: eposta(ad),
      kimdenAd: ad,
      konu: `RE: ${cagriKonusu(tarih)}`,
      metin,
      tamMetin: `${metin}\n\n-----Original Message-----\nFrom: Planning\n${cagriGovdesi(tarih, "15:00")}`,
      zaman: o.zaman,
      mesajKimligi: `<${o.id}@ornek.local>`,
      ekler: [],
      durum: "oneri",
      kaynak: "posta",
    });
  }
  const BOS_YANITLAR: [string, string, string][] = [
    ["mu6", "لا يوجد لدي جديد لخطة الغد، شكرا.", "10:05"],
    ["mu16", "لا يوجد", "10:40"],
    ["mu7", "لا شيء لدي غدا، شكرا.", "11:20"],
    ["mu22", "لا جديد من ليبيا غدا.", "12:05"],
  ];
  for (const [id, metin, saat] of BOS_YANITLAR) {
    const ad = muhabirSatiri(id)[1];
    const z = bugunSaat(saat, 45);
    yanitlar.push({
      id: `y-bos-${id}`,
      cagriId: "c-bugun",
      kisiId: id,
      kimden: eposta(ad),
      kimdenAd: ad,
      konu: `RE: ${cagriKonusu(gun(1))}`,
      metin,
      tamMetin: metin,
      zaman: z,
      mesajKimligi: `<bos-${id}@ornek.local>`,
      ekler: [],
      durum: "oneriYok",
      kaynak: "posta",
    });
    h(id, "yanitOneriYok", z, { veri: { tarih: gun(1) } });
  }
  yanitlar.push({
    id: "y-eslesmeyen",
    kimden: "stringer.aden@ornek-disi.local",
    kimdenAd: "Stringer Aden",
    konu: "مقترح من عدن",
    metin: "مرحبا، لدي تقرير عن أزمة الوقود في عدن ويمكنني إرساله غدا صباحا مع مقابلات من محطات الوقود.",
    tamMetin: "مرحبا، لدي تقرير عن أزمة الوقود في عدن ويمكنني إرساله غدا صباحا مع مقابلات من محطات الوقود.",
    zaman: bugunSaat("11:45", 35),
    mesajKimligi: "<eslesmeyen-1@ornek.local>",
    ekler: ["aden-yakit.jpg"],
    durum: "eslesmedi",
    kaynak: "posta",
  });

  /* Paketler ve geçmişleri. */
  let sayac = 410;
  const klip = (t: string, n: number) => `TRTA_${t.slice(2).replace(/-/g, "")}_${String(n).padStart(3, "0")}`;
  const paketler: Paket[] = PAKETLER.map((t, i) => {
    const kod = `TRT-AR-${B.slice(0, 4)}-${String(++sayac).padStart(4, "0")}`;
    const plan = t.plan ? planlar.find((p) => p.id === planId(t.plan!)) : undefined;
    const tarih = plan?.tarih ?? gun(-2);
    const tur = t.tur ?? "haber";
    const yol = uretimYolu({ sahaGerekli: !!t.saha });
    const bitti = t.durum === "tamamlandi";
    const geçilen = t.durum === "uretimde" ? yol.slice(0, yol.indexOf(t.adim!)) : bitti ? yol : [];
    const p: Paket = {
      id: t.id,
      kod,
      planId: plan?.id,
      planBaslikId: t.pb,
      baslik: t.baslik,
      sehir: t.sehir,
      muhabirId: t.muhabirId,
      aciklama: t.aciklama,
      tur,
      bicim: t.bicim ?? varsayilanBicim(tur),
      teslim: t.teslimDk !== undefined ? new Date(an + t.teslimDk * DAKIKA).toISOString() : undefined,
      yayin: t.saat ? zaman(tarih, t.saat) : undefined,
      durum: t.durum,
      slug: t.slug,
      adim: t.durum === "uretimde" ? t.adim : undefined,
      sahaGerekli: !!t.saha,
      oneriId: t.oneriId,
      metin: geçilen.includes("metin") ? t.metin ?? `${t.baslik}.\n${t.aciklama}` : undefined,
      video: geçilen.includes("video") ? `https://video.ornek.local/${kod}` : undefined,
      klipKodu: geçilen.includes("media") ? klip(tarih, 40 + i) : undefined,
      ucret: t.ucret,
      oncelikli: t.oncelikli,
      stok: t.stok,
      notlar: [],
      olusturma: zaman(gunEkle(tarih, -1), "12:00"),
      guncelleme: zaman(gunEkle(tarih, -1), "12:00"),
    };

    /* Plan aşaması: önerisiz paketi Planlama kendisi açmış. */
    if (plan) {
      const once = gunEkle(plan.tarih, -1);
      const acilis = plan.id === planId("yarin") ? bugunSaat("11:30", 25) : zaman(once, "11:30");
      if (!t.oneriId) h("pl2", "paketOlusturuldu", acilis, { paketId: p.id, planId: plan.id });
      if (t.durum === "degerlendiriliyor") h("pl2", "paketDegerlendirmede", bugunSaat("13:10", 15), { paketId: p.id, planId: plan.id });
      if (plan.durum !== "taslak") {
        if (t.durum === "iptal") h("pl1", "paketIptal", zaman(once, "17:40"), { paketId: p.id, planId: plan.id });
        else h("pl1", "paketOnaylandi", zaman(once, "17:45"), { paketId: p.id, planId: plan.id, veri: { toplanti: "1" } });
      }
    } else {
      // Plansız paket geçen Perşembe haftalık toplantıda kabul edildi; kolun sahibinde bekliyor.
      h("pl1", "paketOnaylandi", zaman(gunEkle(haftaBasi(B), -2), "12:30"), { paketId: p.id, haftaId: "hf-bu", veri: { hafta: "1", sahip: KOL_SAHIBI[tur] } });
    }

    /* Üretim adımları. */
    if (t.durum === "uretimde" || bitti) {
      const devir = plan?.id === planId("dun") ? devirDun : plan ? devirBugun : zaman(gun(-2), "10:00");
      const ilk = yol[0];
      // Next Day paketini planın devri, plansız paketi kolun sahibi üretime alıyor.
      h(plan ? "nd1" : ADIM_KISISI[adimSahibi("newsdesk", tur)], plan ? "planDevralindi" : "uretimeAlindi", devir, {
        paketId: p.id,
        planId: plan?.id,
        veri: { adim: ilk, sahip: adimSahibi(ilk, tur) },
      });
      const son = plan?.id === planId("dun") ? new Date(zaman(gun(-1), "20:00")).getTime() : an - (5 + i * 3) * DAKIKA;
      const adimlar = geçilen.flatMap((a) => (a === "kontrol" && t.geriGonder ? (["metin", "geri", "kontrol"] as const) : [a]));
      // Geri gönderilen pakette metin iki kez geliyor: önce gelen metin, geri gönderme, düzeltilmiş metin.
      const sira: (UretimAdimi | "geri")[] = [];
      for (const a of adimlar) {
        if (a === "metin" && sira.includes("metin")) continue;
        sira.push(a);
      }
      const zamanlar = dizi(new Date(devir).getTime(), son, sira.length);
      sira.forEach((a, j) => {
        if (a === "geri") {
          h("ou2", "geriGonderildi", zamanlar[j], { paketId: p.id, planId: plan?.id, veri: { gerekce: t.geriGonder!, adim: "metin", sahip: "muhabir" } });
          return;
        }
        const sahip = adimSahibi(a, tur);
        const kisi = sahip === "muhabir" ? t.muhabirId : a === "dil" ? "ou2" : ADIM_KISISI[sahip] ?? "nd3";
        const yolda = yol.indexOf(a);
        const sonraki = yolda < yol.length - 1 ? yol[yolda + 1] : "tamam";
        const veri: Record<string, string> = { adim: sonraki, sahip: sonraki === "tamam" ? "" : adimSahibi(sonraki, tur) };
        if (a === "media" && p.klipKodu) veri.kod = p.klipKodu;
        if (a === "gorevlendirme") veri.muhabir = t.muhabirId;
        if (a === "newsdesk") p.gorevZamani = zamanlar[j];
        if (a === "video") p.muhabirTeslimi = zamanlar[j];
        h(kisi, ADIM_HAREKETI[a], zamanlar[j], { paketId: p.id, planId: plan?.id, veri });
      });
      if (t.geriGonder && sira.includes("geri")) p.duzeltmeSayisi = 1;
      if (bitti) p.nitelik = 4;
      const sonZaman = zamanlar[zamanlar.length - 1];
      if (sonZaman) p.guncelleme = sonZaman;
    }
    return p;
  });

  /*
   * Stoktaki paketler: feature/stok ekibi montajı kontrol edip yükledi.
   * Devredilmiş bir plana (dün, bugün) seçilenler o planla yayınlandı;
   * yarının planına seçilenler ve hiçbir plana girmeyenler stokta.
   */
  for (const s of STOK(gun)) {
    const kod = `TRT-AR-${B.slice(0, 4)}-${String(++sayac).padStart(4, "0")}`;
    const bitis = zaman(s.hazirlanma, "16:00");
    const yayinPlani = planlar.find((p) => p.durum === "devralindi" && p.hazirPaketler.includes(s.id));
    paketler.push({
      id: s.id,
      kod,
      baslik: s.baslik,
      sehir: s.sehir,
      muhabirId: s.muhabirId,
      aciklama: s.aciklama,
      tur: s.tur,
      bicim: varsayilanBicim(s.tur),
      durum: "tamamlandi",
      slug: s.slug,
      sure: s.sure,
      stok: true,
      sahaGerekli: false,
      klipKodu: klip(s.hazirlanma, 90 + paketler.length % 10),
      gorevZamani: zaman(gunEkle(s.hazirlanma, -4), "10:00"),
      muhabirTeslimi: zaman(gunEkle(s.hazirlanma, -1), "15:00"),
      nitelik: 4,
      yayinlandi: yayinPlani ? { planId: yayinPlani.id, tarih: yayinPlani.tarih } : undefined,
      notlar: [],
      olusturma: zaman(gunEkle(s.hazirlanma, -5), "11:00"),
      guncelleme: bitis,
    });
    h("pl6", "tamamlandi", bitis, { paketId: s.id, veri: { adim: "tamam", sahip: "", stok: "1" } });
    if (yayinPlani) h("nd1", "stokYayinlandi", yayinPlani.id === planId("dun") ? devirDun : devirBugun, { paketId: s.id, planId: yayinPlani.id, veri: { tarih: yayinPlani.tarih } });
  }

  /* Arşiv: plan kaydı yok, kodu bugünkü paketlerden küçük. */
  const kisiListesi = kisiler();
  const SAAT = 60 * DAKIKA;
  const arsivTaslak = kisiListesi
    .filter((k) => k.birim === "muhabir")
    .flatMap((m, i) => {
      const r = tohumlu(i + 11);
      const n = 4 + Math.floor(r() * 7);
      const hiz = 2.5 + r() * 4;
      const titiz = r();
      const sehirAr = metin(sehirAdi(m.sehir), "ar");
      return Array.from({ length: n }, (_, j) => {
        const tarih = gun(-(3 + Math.floor(((j + r()) * 56) / n)));
        const gorev = new Date(zaman(tarih, `${String(8 + Math.floor(r() * 3)).padStart(2, "0")}:${r() < 0.5 ? "00" : "30"}`)).getTime();
        const teslimEden = gorev + hiz * (0.6 + r() * 0.9) * SAAT;
        const bicim = m.bicimler[Math.floor(r() * m.bicimler.length)];
        const puan = Math.min(5, Math.max(1, Math.round(2.6 + titiz * 2 + (r() - 0.5) * 1.2)));
        return {
          m,
          j,
          tarih,
          gorev,
          teslimEden,
          bicim,
          puan,
          duzeltme: r() < 0.35 - titiz * 0.25 ? 1 : 0,
          baslik: ARSIV_BASLIKLARI[(i * 5 + j * 3) % ARSIV_BASLIKLARI.length].replace("{س}", sehirAr),
          sehirAr,
        };
      });
    })
    .sort((a, b) => a.gorev - b.gorev);
  const arsiv: Paket[] = arsivTaslak.map((a, n) => {
    const kod = `TRT-AR-${B.slice(0, 4)}-${String(410 - arsivTaslak.length + n).padStart(4, "0")}`;
    const tur: IcerikTuru = a.bicim === "feature" ? "feature" : "haber";
    const bitis = new Date(a.teslimEden + 3 * SAAT).toISOString();
    const p: Paket = {
      id: `pa-${a.m.id}-${a.j}`,
      kod,
      baslik: a.baslik,
      sehir: a.m.sehir,
      muhabirId: a.m.id,
      aciklama: `قصة من ${a.sehirAr} مع شهادات السكان وآراء المختصين.`,
      tur,
      bicim: a.bicim,
      teslim: new Date(a.gorev + 7 * SAAT).toISOString(),
      yayin: new Date(a.teslimEden + 2 * SAAT).toISOString(),
      durum: "tamamlandi",
      slug: `${a.m.sehir.toUpperCase()}-${kod.slice(-4)}-${BICIM_SLUG[a.bicim]}-${a.m.kisaltma}`,
      sahaGerekli: false,
      metin: `${a.baslik}.`,
      video: `https://video.ornek.local/${kod}`,
      klipKodu: klip(a.tarih, 100 + (n % 900)),
      notlar: [],
      nitelik: a.puan,
      gorevZamani: new Date(a.gorev).toISOString(),
      muhabirTeslimi: new Date(a.teslimEden).toISOString(),
      duzeltmeSayisi: a.duzeltme || undefined,
      olusturma: zaman(gunEkle(a.tarih, -1), "12:00"),
      guncelleme: bitis,
    };
    h("nd3", "gorevVerildi", p.gorevZamani!, { paketId: p.id, veri: { adim: "metin", sahip: "muhabir" } });
    h(a.m.id, "videoGeldi", p.muhabirTeslimi!, { paketId: p.id, veri: { adim: "iletim", sahip: adimSahibi("iletim", tur) } });
    h("nd3", "tamamlandi", bitis, { paketId: p.id, veri: { adim: "tamam", sahip: "" } });
    h("nd1", "nitelikPuanlandi", new Date(a.teslimEden + 4 * SAAT).toISOString(), { paketId: p.id, veri: { puan: String(a.puan) } });
    return p;
  });

  /*
   * Input müdürünün iki talimatı: biri yarın için Planlama'da bekliyor,
   * öteki dün verildi, bugünün planına alındı ve öncelikli olarak üretimde.
   * Müdür ayrıca gecikmiş Beyrut paketini öncelikli yaptı.
   */
  const talimatlar: Oneri[] = [
    {
      id: "o-talimat-1",
      talimatVeren: "yo1",
      ulke: "irak",
      haberBasligi: "أزمة المياه في العراق: تراجع منسوب دجلة والفرات",
      gelisme: "نريد تقريرا ميدانيا من البصرة مع مزارعين وخبراء، وأرقام وزارة الموارد المائية.",
      paketBasligi: "أزمة المياه في العراق: تراجع منسوب دجلة والفرات",
      tur: "haber",
      sahaGerekli: false,
      zaman: bugunSaat("11:20", 45),
      kanal: "sistem",
      hedefTarih: planTarihi.yarin,
      durum: "yeni",
    },
    {
      id: "o-talimat-2",
      talimatVeren: "yo1",
      ulke: "turkiye",
      haberBasligi: "إسطنبول تستعد لموسم الأمطار: خطة الطوارئ وجاهزية فرق الإنقاذ",
      gelisme: "خطة البلدية لمواجهة السيول، وجولة مع فرق الإنقاذ في الأحياء المعرضة للخطر.",
      paketBasligi: "إسطنبول تستعد لموسم الأمطار: خطة الطوارئ وجاهزية فرق الإنقاذ",
      tur: "haber",
      sahaGerekli: false,
      zaman: zaman(gun(-1), "11:40"),
      kanal: "sistem",
      hedefTarih: planTarihi.bugun,
      durum: "planaEklendi",
      baslikId: "b-turkiye",
      planId: planId("bugun"),
      paketId: "p-talimat",
    },
  ];
  for (const o of talimatlar) h("yo1", "talimatVerildi", o.zaman, { oneriId: o.id, veri: { sahip: "planlama" } });
  h("pl2", "oneriPlanaEklendi", zaman(gun(-1), "12:30"), {
    oneriId: "o-talimat-2",
    paketId: "p-talimat",
    planId: planId("bugun"),
    veri: { tarih: planTarihi.bugun, kime: "yo1" },
  });
  h("yo1", "paketOncelikli", new Date(an - 35 * DAKIKA).toISOString(), { paketId: "p-beyrut", planId: planId("bugun"), veri: { sahip: "muhabir" } });
  const talimatPaketi = paketler.find((p) => p.id === "p-talimat");
  if (talimatPaketi) {
    const z = bugunSaat("13:00", 90);
    talimatPaketi.notlar = [
      { id: "n3", kisiId: "yo1", zaman: z, metin: "Akşam bülteninin açılış haberi olacak; teslim saatini kaçırmayalım.", yonetici: true },
    ];
    h("yo1", "yoneticiNotu", z, { paketId: "p-talimat", planId: planId("bugun"), veri: { sahip: "muhabir" } });
  }

  /* Gazze paketine iki koordinasyon notu: kayıt üzerinden yazışmanın örneği. */
  const gazze = paketler.find((p) => p.id === "p-gazze");
  if (gazze) {
    gazze.notlar = [
      { id: "n1", kisiId: "nd3", zaman: bugunSaat("10:05", 200), metin: "Şifa Hastanesi başhekimiyle röportaj teyit edildi mi?" },
      { id: "n2", kisiId: "mu1", zaman: bugunSaat("10:20", 190), metin: "Teyit edildi; 11:00 canlı bağlantıdan sonra çekiyoruz." },
    ];
  }

  const gelismeler: Gelisme[] = (["dun", "bugun", "yarin"] as const).flatMap((k) =>
    GELISMELER[k].map(([pb, yer, metin, kaynakTuru, kaynakAdi, onerenId, onceki], i) => ({
      id: `g-${k}-${i}`,
      planId: planId(k),
      planBaslikId: pb || undefined,
      yer,
      metin,
      kaynakTuru,
      kaynakAdi,
      tarih: k === "yarin" ? bugunSaat("12:00", 20) : zaman(gunEkle(planTarihi[k], -1), "12:00"),
      onerenId,
      onceki,
    })),
  );
  gelismeler.push({
    id: "g-o-talimat-2",
    planId: planId("bugun"),
    planBaslikId: "pb-b-turkiye",
    metin: talimatlar[1].gelisme,
    kaynakTuru: "diger",
    kaynakAdi: "",
    tarih: talimatlar[1].zaman,
    oneriId: "o-talimat-2",
  });
  /* Plana eklenen önerilerin gelişmeleri de o planın başlığı altında. */
  for (const o of oneriler.filter((x) => x.durum === "planaEklendi")) {
    const k = o.planId === planId("bugun") ? "bugun" : "yarin";
    const pb = PLAN_ICERIGI[k].basliklar.find(([, b]) => b === o.baslikId);
    if (pb) {
      gelismeler.push({
        id: `g-${o.id}`,
        planId: planId(k),
        planBaslikId: pb[0],
        metin: o.gelisme,
        kaynakTuru: "muhabir",
        kaynakAdi: "",
        tarih: o.zaman,
        onerenId: o.muhabirId,
        oneriId: o.id,
      });
    }
  }

  const haftaBas = planlananHafta(B);
  const buBas = haftaBasi(B);
  /* Geçen Perşembe: bu haftanın planının kesinleştiği toplantı. */
  const buToplanti = zaman(gunEkle(buBas, -2), "12:30");
  const satirdan = ([g, baslikId, baslik, yer, metin, tur, bicimler, muhabirler, not]: KalemSatiri, bas: string, id: string): HaftalikKalem => ({
    id,
    tarih: g === null ? undefined : gunEkle(bas, g),
    baslikId,
    baslik,
    yer,
    metin,
    tur,
    bicimler,
    muhabirler,
    not,
    karar: "bekliyor",
  });

  /*
   * Bu hafta, kesinleşmiş: bugüne düşen iki etkinlik haberi bugünün
   * planına aktarılmış (paketleri "Haftalık plandan" rozetli), geçen
   * toplantıda kabul edilen feature, ekonomi ve program işleri kendi
   * kollarında üretimde.
   */
  const buHaftaKalemleri: HaftalikKalem[] = [
    ...BU_HAFTA.map((r, i) => ({ ...satirdan(r, buBas, `hb${i}`), karar: BU_HAFTA_KARAR[i] })),
    { id: "hb-forum", tarih: B, baslikId: "b-turkiye", baslik: "منتدى الأعمال التركي الخليجي", yer: "إسطنبول", metin: "منتدى بمشاركة وزراء ورجال أعمال من تركيا ودول الخليج؛ توقيع اتفاقيات.", tur: "haber", bicimler: ["pkg"], muhabirler: ["mu6"], karar: "kabul", aktarim: { planId: planId("bugun"), paketId: "p-forum" } },
    { id: "hb-bm", tarih: B, baslikId: "b-bm", baslik: "جلسة الجمعية العامة بشأن فلسطين", yer: "نيويورك", metin: "تصويت على مشروع قرار حول الوضع في الأراضي الفلسطينية.", tur: "haber", bicimler: ["pkg"], muhabirler: ["mu27"], karar: "kabul", aktarim: { planId: planId("bugun"), paketId: "p-bm" } },
    { id: "hb-elyazma", baslikId: "b-misir", baslik: "مكتبة المخطوطات في القاهرة", yer: "القاهرة", metin: "فريق يعمل على رقمنة مخطوطات عمرها قرون.", tur: "feature", bicimler: ["feature"], muhabirler: ["mu8"], karar: "kabul", aktarim: { paketId: "p-elyazma" } },
    { id: "hb-hidrojen", baslikId: "b-korfez", baslik: "استثمارات الهيدروجين الأخضر في الخليج", yer: "الدوحة", metin: "مشاريع جديدة وتحوّل الطاقة.", tur: "ekonomi", bicimler: ["pkg"], muhabirler: ["mu18"], karar: "kabul", aktarim: { paketId: "p-hidrojen" } },
    { id: "hb-sahaf", baslikId: "b-irak", baslik: "سوق الكتب المستعملة في شارع المتنبي", yer: "بغداد", metin: "باعة الكتب في شارع المتنبي وجمهور الجمعة.", tur: "feature", bicimler: ["feature"], muhabirler: ["mu15"], karar: "kabul", aktarim: { paketId: "p-sahaf" } },
    { id: "hb-girisim", baslik: "برنامج: رواد الأعمال الشباب في العالم العربي", yer: "عمّان", metin: "ثلاثة بورتريهات لرواد أعمال لصالح البرنامج الأسبوعي.", tur: "program", bicimler: ["derinlemesine"], muhabirler: ["mu17"], karar: "kabul", aktarim: { paketId: "p-girisim" } },
  ];
  for (const p of paketler) {
    const k = buHaftaKalemleri.find((x) => x.aktarim?.paketId === p.id);
    if (k) p.haftalikKalemId = k.id;
  }
  h("pl2", "haftalikOlusturuldu", zaman(gunEkle(buBas, -6), "10:00"), { haftaId: "hf-bu", veri: { tarih: buBas } });
  h("pl2", "haftalikToplantida", zaman(gunEkle(buBas, -2), "10:30"), { haftaId: "hf-bu", veri: { tarih: buBas, sahip: "yonetim" } });
  h("pl1", "haftalikKesinlesti", buToplanti, { haftaId: "hf-bu", veri: { tarih: buBas } });
  for (const k of buHaftaKalemleri.filter((x) => x.aktarim?.planId)) {
    h("pl2", "haftaliktanAktarildi", zaman(gun(-1), "08:51"), { haftaId: "hf-bu", planId: k.aktarim!.planId, paketId: k.aktarim!.paketId, veri: { tarih: B, kalem: k.id } });
  }

  /*
   * Gelecek hafta, hazırlıkta: haftalık çağrı bu Cumartesi gitti, yanıtlar
   * geliyor. Yanıtlardan üçü zamana bağlı olmayan stok öneri: biri Input
   * müdürünün görüşüyle, biri Ekonomi'nin ön incelemede reddiyle, biri
   * ekonomi ön incelemesi bekliyor. Kalanlar gündeme alınmayı bekliyor.
   */
  const SAAT_ = 60 * DAKIKA;
  const cagriZamani = new Date(Math.min(new Date(zaman(buBas, "09:30")).getTime(), an - 6 * SAAT_)).toISOString();
  const arada = (oran: number) => new Date(new Date(cagriZamani).getTime() + (an - 30 * DAKIKA - new Date(cagriZamani).getTime()) * oran).toISOString();
  type HaftalikOneri = [string, string, string, string, IcerikTuru, Bicim, Oneri["kanal"], number];
  const HAFTALIK_ONERILER: HaftalikOneri[] = [
    ["ow-kudus", "mu2", "إحياء ذكرى هبة القدس والأقصى", "فعاليات وزيارات لأضرحة الشهداء في الداخل الفلسطيني؛ يمكن ربطها بمباشر من القدس.", "haber", "pkg", "eposta", 0.1],
    ["ow-ankara", "mu7", "زيارة وزير الخارجية التركي إلى الخليج", "جولة تشمل الدوحة والرياض؛ ملفات التجارة والطاقة والوضع في غزة.", "haber", "pkg", "sistem", 0.15],
    ["ow-zanaat", "mu11", "الحرفيون السوريون في إسطنبول", "ورش النحاس والصدف في الفاتح: حرفة تنتقل بين جيلين.", "feature", "feature", "eposta", 0.2],
    ["ow-fon", "mu18", "صناديق الثروة الخليجية والاستثمار في التكنولوجيا", "اتجاه الصناديق السيادية نحو الذكاء الاصطناعي وأشباه الموصلات.", "ekonomi", "pkg", "eposta", 0.25],
    ["ow-ekmek", "mu8", "أسعار الخبز في مصر بعد تعديل الدعم", "جولة في المخابز والأسواق ومقابلات مع أسر وخبير اقتصادي.", "ekonomi", "pkg", "eposta", 0.3],
    ["ow-amman", "mu17", "مؤتمر المانحين لإعادة إعمار غزة في عمّان", "وفود عربية ودولية؛ التعهدات المتوقعة وآلية التنفيذ.", "haber", "pkg", "eposta", 0.5],
    ["ow-bruksel", "mu28", "اجتماع وزراء خارجية الاتحاد الأوروبي حول الشرق الأوسط", "نقاش حول اتفاقية الشراكة مع إسرائيل ودعم الأونروا.", "haber", "pkg", "eposta", 0.65],
    ["ow-rabat", "mu24", "موسم الزيتون في المغرب", "قطاف الزيتون في منطقة الأطلس وتأثير الجفاف على المحصول.", "feature", "feature", "sistem", 0.8],
  ];
  const gundemdeki: Record<string, [number | null, string | undefined]> = {
    "ow-kudus": [0, "b-ihlaller"],
    "ow-ankara": [2, "b-turkiye"],
    "ow-zanaat": [null, "b-turk-gundem"],
    "ow-fon": [null, "b-korfez"],
    "ow-ekmek": [null, "b-misir"],
  };
  const haftalikOneriler: (Oneri & { muhabirId: string })[] = HAFTALIK_ONERILER.map(([id, muhabirId, haber, gelisme, tur, bicim, kanal, oran]) => {
    const sehir = (KISILER.find((k) => k[0] === muhabirId)?.[6] ?? "istanbul") as Sehir;
    return {
      id,
      muhabirId,
      ulke: SEHIR_ULKESI[sehir],
      haberBasligi: haber,
      gelisme,
      tur,
      bicim,
      sahaGerekli: false,
      zaman: arada(oran),
      kanal,
      hafta: haftaBas,
      durum: gundemdeki[id] ? "degerlendiriliyor" : "yeni",
      cagriId: kanal === "eposta" ? "c-hafta" : undefined,
      baslikId: gundemdeki[id]?.[1],
    };
  });
  const gelecekKalemleri: HaftalikKalem[] = GELECEK_HAFTA.map((r, i) => satirdan(r, haftaBas, `hg${i}`));
  /* Gündeme alınmış öneriler: gündeki kalem öneriye bağlanıyor, stoktakiler yeni kalem. */
  for (const o of haftalikOneriler.filter((x) => gundemdeki[x.id])) {
    const [g, baslikId] = gundemdeki[o.id];
    const var_ = gelecekKalemleri.find((k) => g !== null && k.tarih === gunEkle(haftaBas, g) && k.muhabirler.includes(o.muhabirId));
    if (var_) var_.oneriId = o.id;
    else
      gelecekKalemleri.push({
        id: `hg-${o.id}`,
        tarih: g === null ? undefined : gunEkle(haftaBas, g),
        baslikId,
        baslik: o.haberBasligi,
        metin: o.gelisme,
        tur: o.tur,
        bicimler: o.bicim ? [o.bicim] : [],
        muhabirler: [o.muhabirId],
        oneriId: o.id,
        karar: "bekliyor",
      });
  }
  const incelemeZamani = arada(0.6);
  const kalemi = (oneriId: string) => gelecekKalemleri.find((k) => k.oneriId === oneriId)!;
  kalemi("ow-zanaat").onInceleme = {
    durum: "gonderildi",
    gonderen: "pl4",
    zaman: incelemeZamani,
    gorusler: [{ kisiId: "yo1", zaman: arada(0.75), metin: "Konu iyi; Suriyeli ustaların yanında Türk ustalarla ortak atölyeleri de görelim." }],
  };
  kalemi("ow-fon").onInceleme = {
    durum: "reddedildi",
    gonderen: "pl4",
    zaman: incelemeZamani,
    gorusler: [],
    reddeden: "ek1",
    gerekce: "Benzer bir dosyayı geçen ay yayımladık; şimdilik tekrar etmeyelim.",
  };
  kalemi("ow-fon").karar = "ret";
  kalemi("ow-ekmek").onInceleme = { durum: "gonderildi", gonderen: "pl4", zaman: incelemeZamani, gorusler: [] };

  h("pl2", "haftalikOlusturuldu", new Date(new Date(cagriZamani).getTime() - 10 * DAKIKA).toISOString(), { haftaId: "hf-gelecek", veri: { tarih: haftaBas } });
  h("pl2", "cagriHazirlandi", cagriZamani, { haftaId: "hf-gelecek", veri: { tarih: haftaBas, sahip: "muhabir", hafta: "1" } });
  for (const o of haftalikOneriler) {
    h(o.muhabirId, "oneriGeldi", o.zaman, { oneriId: o.id, veri: { sahip: "planlama", ...(o.kanal === "eposta" ? { kanal: "eposta" } : {}) } });
    if (o.durum === "degerlendiriliyor") h("pl4", "oneriDegerlendirmede", new Date(new Date(o.zaman).getTime() + 20 * DAKIKA).toISOString(), { oneriId: o.id, haftaId: "hf-gelecek" });
  }
  for (const id of ["ow-zanaat", "ow-fon", "ow-ekmek"]) {
    const k = kalemi(id);
    h("pl4", "onIncelemeyeGonderildi", incelemeZamani, { haftaId: "hf-gelecek", veri: { kalem: k.id, kime: "yo1", sahip: k.tur === "ekonomi" ? "ekonomi" : "" } });
  }
  h("yo1", "onIncelemeGorusu", arada(0.75), { haftaId: "hf-gelecek", veri: { kalem: kalemi("ow-zanaat").id, sahip: "planlama" } });
  h("ek1", "onIncelemedeReddedildi", arada(0.7), { haftaId: "hf-gelecek", veri: { kalem: kalemi("ow-fon").id, gerekce: kalemi("ow-fon").onInceleme!.gerekce!, sahip: "planlama" } });

  /* Haftalık çağrının e-posta yanıtları: öneri yanıtları ve bir "önerim yok". */
  for (const o of haftalikOneriler.filter((x) => x.kanal === "eposta")) {
    const ad = muhabirSatiri(o.muhabirId)[1];
    const metin = [o.haberBasligi, o.gelisme].join("\n");
    o.yanitId = `y-${o.id}`;
    yanitlar.push({
      id: o.yanitId,
      cagriId: "c-hafta",
      kisiId: o.muhabirId,
      kimden: eposta(ad),
      kimdenAd: ad,
      konu: `RE: ${cagriKonusu(haftaBas, "haftalik")}`,
      metin,
      tamMetin: `${metin}\n\n-----Original Message-----\nFrom: Planning\n${haftalikGovde(haftaBas, ORNEK_PLANLAMA_ADRESI)}`,
      zaman: o.zaman,
      mesajKimligi: `<${o.id}@ornek.local>`,
      ekler: [],
      durum: "oneri",
      kaynak: "posta",
    });
  }
  {
    const ad = muhabirSatiri("mu22")[1];
    const z = arada(0.4);
    yanitlar.push({
      id: "y-hafta-bos-mu22",
      cagriId: "c-hafta",
      kisiId: "mu22",
      kimden: eposta(ad),
      kimdenAd: ad,
      konu: `RE: ${cagriKonusu(haftaBas, "haftalik")}`,
      metin: "لا يوجد لدي جديد للأسبوع القادم.",
      tamMetin: "لا يوجد لدي جديد للأسبوع القادم.",
      zaman: z,
      mesajKimligi: "<hafta-bos-mu22@ornek.local>",
      ekler: [],
      durum: "oneriYok",
      kaynak: "posta",
    });
    h("mu22", "yanitOneriYok", z, { veri: { tarih: haftaBas } });
  }

  /*
   * Elle girilen öneriler: sistem dışından gelen. Yarının planına
   * ajanstan düşen bir haber ve muhabirin telefonla ilettiği öneri; gelecek
   * haftaya bakanlığın duyurusu ve Program biriminin yüz yüze ilettiği
   * fikir. Kurum adları gerçek olabilir; kişi adı yok.
   */
  const elleOneriler: Oneri[] = [
    {
      id: "o-elle-ajans",
      kaynakTuru: "ajans",
      kaynakAdi: "وكالة الأناضول",
      giren: "pl3",
      ulke: "turkiye",
      haberBasligi: "قرار البنك المركزي التركي بشأن سعر الفائدة",
      gelisme: "يعلن البنك المركزي قراره ظهرا؛ التوقعات تميل إلى الإبقاء على السعر مع إشارات إلى خفض لاحق.",
      tur: "haber",
      bicim: "pkg",
      sahaGerekli: false,
      zaman: bugunSaat("12:10", 40),
      kanal: "eposta",
      hedefTarih: planTarihi.yarin,
      durum: "yeni",
    },
    {
      id: "o-elle-telefon",
      muhabirId: "mu6",
      giren: "pl2",
      ulke: "turkiye",
      haberBasligi: "معرض إسطنبول للكتاب العربي",
      gelisme: "اتصل المراسل: افتتاح المعرض صباح الغد بمشاركة دور نشر من عشر دول؛ يمكن مقابلة المنظمين.",
      paketBasligi: "معرض إسطنبول للكتاب العربي يفتح أبوابه",
      tur: "haber",
      bicim: "pkg",
      sahaGerekli: false,
      zaman: bugunSaat("13:05", 30),
      kanal: "telefon",
      hedefTarih: planTarihi.yarin,
      durum: "degerlendiriliyor",
    },
    {
      id: "ow-resmi",
      kaynakTuru: "resmi",
      kaynakAdi: "وزارة الخارجية التركية",
      giren: "pl4",
      ulke: "turkiye",
      haberBasligi: "اجتماع وزراء خارجية منظمة التعاون الإسلامي في إسطنبول",
      gelisme: "بيان الوزارة: الاجتماع يناقش الوضع في غزة ولبنان؛ مؤتمر صحفي في ختام اليوم الثاني.",
      tur: "haber",
      bicim: "canli",
      sahaGerekli: false,
      zaman: arada(0.45),
      kanal: "eposta",
      hafta: haftaBas,
      durum: "yeni",
    },
    {
      id: "ow-kurum",
      kaynakTuru: "kurum",
      kaynakAdi: "وحدة البرامج",
      giren: "pl4",
      ulke: "turkiye",
      haberBasligi: "ماردين: مدينة الحجر والأديان",
      gelisme: "اقتراح من وحدة البرامج: تقرير يرافق حلقة الأسبوع القادم من برنامج السفر.",
      tur: "feature",
      bicim: "feature",
      sahaGerekli: true,
      zaman: arada(0.55),
      kanal: "yuzYuze",
      hafta: haftaBas,
      durum: "yeni",
    },
  ];
  for (const o of elleOneriler) {
    h(o.giren!, "oneriGeldi", o.zaman, { oneriId: o.id, veri: { sahip: "planlama", elle: "1" } });
    if (o.durum === "degerlendiriliyor") h("pl2", "oneriDegerlendirmede", new Date(new Date(o.zaman).getTime() + 10 * DAKIKA).toISOString(), { oneriId: o.id });
  }

  const haftalik: HaftalikPlan[] = [
    {
      id: "hf-gelecek",
      baslangic: haftaBas,
      durum: "hazirlik",
      anaKonular: GELECEK_HAFTA_DOSYALARI.map(([baslik, metin], i) => ({ id: `akg${i}`, baslik, metin })),
      kalemler: gelecekKalemleri,
      olusturan: "pl2",
      olusturma: new Date(new Date(cagriZamani).getTime() - 10 * DAKIKA).toISOString(),
    },
    {
      id: "hf-bu",
      baslangic: buBas,
      durum: "kesinlesti",
      anaKonular: BU_HAFTA_DOSYALARI.map(([baslik, metin], i) => ({ id: `akb${i}`, baslik, metin })),
      kalemler: buHaftaKalemleri,
      olusturan: "pl2",
      olusturma: zaman(gunEkle(buBas, -6), "10:00"),
    },
  ];

  /*
   * Yalnız akışta tanımlı toplantılar: akşam haber toplantısı (Next Day
   * kutusu 3), Newsdesk'in sabah toplantısı (kutu 4) ve Perşembe haftalık
   * toplantısı. Akışı tanımlanmamış toplantı takvime konmuyor.
   */
  const toplantilar: Toplanti[] = [
    { id: "t4", ad: "اجتماع الأخبار", aciklama: "عرض خطة الغد", zaman: zaman(B, "17:00"), birim: "planlama", onemli: true },
    { id: "t6", ad: "اجتماع الأخبار الصباحي", aciklama: "غرفة الأخبار تحدّث الخطة وتوزع المهام", zaman: zaman(gun(1), "09:30"), birim: "newsdesk" },
    { id: "t8", ad: "الاجتماع الأسبوعي للأخبار", aciklama: "عرض الخطة الأسبوعية والقرارات", zaman: zaman(gunEkle(haftaBasi(B), new Date(B + "T12:00:00").getDay() > 4 ? 12 : 5), "11:00"), birim: "planlama", onemli: true },
  ];

  const yil = B.slice(0, 4);
  const faaliyetler = FAALIYETLER(B, yil);
  /* Takvimden plana alınanların izi: özel yayın ve dünkü planın gelişmesi. */
  gelismeler.push({
    id: "g-f-korfez",
    planId: planId("dun"),
    yer: "الرياض",
    metin: "يعقد وزراء خارجية دول مجلس التعاون اجتماعهم الدوري؛ بيان ختامي متوقع مساءً.",
    kaynakTuru: "kurum",
    kaynakAdi: "تقويم التخطيط",
    tarih: zaman(gun(-2), "11:05"),
  });
  for (const f of faaliyetler) for (const b of f.baglantilar) h(b.kisiId, "faaliyetPlanaAlindi", b.zaman, { planId: b.tur === "nextday" ? b.planId : undefined, veri: { faaliyetId: f.id, tur: b.tur, tarih: b.tarih } });
  h("pl2", "faaliyetEklendi", zaman(gun(-1), "15:40"), { veri: { faaliyetId: "f-taslak", tarih: gun(21) } });
  const sirala = (a: Hareket, b: Hareket) => b.zaman.localeCompare(a.zaman);

  return {
    surum: 15,
    kisiler: kisiListesi,
    basliklar: BASLIKLAR,
    planlar,
    gelismeler,
    canliYayinlar: CANLILAR(planId, gun),
    gorevlendirmeler: [
      ...GOREVLENDIRMELER(gun),
      // Gelecek haftanın seçimleri için ekip: haftalık çıktıda tek satır ("YER / ad - ad …").
      ...(["mu11", "mu30"] as const).map(
        (kisiId): Gorevlendirme => ({
          id: `gr-balkan-${kisiId}`,
          kisiId,
          tur: "gorevlendirme",
          yer: "البوسنة والهرسك",
          baslangic: haftaBas,
          bitis: gunEkle(haftaBas, 16),
          aciklama: "تغطية الانتخابات العامة.",
          durum: "onayli",
        }),
      ),
    ],
    oneriler: [...talimatlar, ...elleOneriler, ...haftalikOneriler, ...oneriler],
    cagrilar: (
      [
        ["c-dun", gun(0), zaman(gun(-1), "09:10")],
        ["c-bugun", gun(1), bugunSaat("09:15", 60)],
      ] as const
    )
      .map(([id, tarih, z]): Cagri => ({
        id,
        tur: "nextday",
        tarih,
        metin: cagriGovdesi(tarih, "15:00"),
      sonSaat: "15:00",
      olusturan: "pl2",
      zaman: z,
      kime: ORNEK_PLANLAMA_ADRESI,
        bcc: kisiListesi.filter((k) => k.birim === "muhabir" && k.durum !== "izinli").map((k) => k.id),
        etiket: etiketUret(tarih),
      }))
      .concat({
        id: "c-hafta",
        tur: "haftalik",
        tarih: haftaBas,
        metin: haftalikGovde(haftaBas, ORNEK_PLANLAMA_ADRESI),
        sonSaat: "",
        olusturan: "pl2",
        zaman: cagriZamani,
        kime: ORNEK_PLANLAMA_ADRESI,
        bcc: kisiListesi.filter((k) => k.birim === "muhabir" && k.durum !== "izinli").map((k) => k.id),
        etiket: etiketUret(haftaBas, "haftalik"),
      }),
    yanitlar,
    paketler: [...paketler, ...arsiv],
    haftalik,
    aylik: [
      {
        id: "ay-bu",
        ay: B.slice(0, 7),
        durum: "hazirlik",
        kalemler: AY_KALEMLERI.map(([baslik, tur, onayli], i) => ({ id: `ak${i}`, baslik, tur, onayli })),
      },
    ],
    ozel: [
      {
        id: "oz-7ekim",
        ad: "البث الخاص في 7 أكتوبر",
        tarih: `${yil}-10-07`,
        hazirlik: [
          { id: "oz1", metin: "مسودة جدول البث", tamam: true },
          { id: "oz2", metin: "ثلاث وصلات مباشرة من غزة", tamam: true },
          { id: "oz3", metin: "ضيوف الاستوديو", tamam: true },
          { id: "oz4", metin: "اختيار المواد الأرشيفية", tamam: false },
          { id: "oz5", metin: "حزمة الرسومات والخرائط", tamam: false },
          { id: "oz6", metin: "مقاطع ترويجية لوسائل التواصل", tamam: false },
        ],
      },
      {
        id: "oz-abd",
        ad: "الانتخابات النصفية الأمريكية",
        tarih: `${yil}-11-03`,
        hazirlik: [
          { id: "ab1", metin: "مهمة واشنطن", tamam: true },
          { id: "ab2", metin: "خطة بث ليلة الانتخابات", tamam: true },
          { id: "ab3", metin: "قائمة الضيوف الخبراء", tamam: false },
          { id: "ab4", metin: "رسومات الولايات", tamam: false },
          { id: "ab5", metin: "ملف الناخبين العرب الأمريكيين", tamam: false },
        ],
      },
    ],
    toplantilar,
    faaliyetler,
    dosyalar: [
      { id: "d1", ad: "قالب الخطة الأسبوعية", tur: "docx", guncelleme: gun(-6) },
      { id: "d2", ad: "قالب الخطة الشهرية", tur: "xlsx", guncelleme: gun(-11) },
      { id: "d3", ad: "دليل البث الخاص", tur: "pdf", guncelleme: gun(-16) },
      { id: "d4", ad: "قائمة الاتصال بالمراسلين", tur: "xlsx", guncelleme: gun(-21) },
    ],
    hareketler: hareketler.sort(sirala),
    okundu: {},
    sayac,
  };
};

/* Şehir → ülke; veri.ts'teki tabloyu içe aktarmak döngü yaratırdı, örnek veri için yerel kopya yetiyor. */
const SEHIR_ULKESI: Record<Sehir, Oneri["ulke"]> = {
  gazze: "filistin",
  kudus: "filistin",
  ramallah: "filistin",
  beyrut: "lubnan",
  sam: "suriye",
  halep: "suriye",
  kahire: "misir",
  bagdat: "irak",
  erbil: "irak",
  amman: "urdun",
  doha: "katar",
  riyad: "suudi",
  sana: "yemen",
  hartum: "sudan",
  trablus: "libya",
  tunus: "tunus",
  rabat: "fas",
  istanbul: "turkiye",
  ankara: "turkiye",
  tahran: "iran",
  kiev: "ukrayna",
  washington: "abd",
  newyork: "abd",
  bruksel: "belcika",
  londra: "ingiltere",
};

