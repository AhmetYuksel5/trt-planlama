import { adimSahibi, uretimYolu, type UretimAdimi } from "./akis";
import type { Yazi } from "./dil";
import { bugun, gunEkle, haftaBasi, planlananHafta, zaman } from "./tarih";
import type {
  Baslik,
  CanliYayin,
  Durum,
  EkipUyesi,
  Gelisme,
  Gorevlendirme,
  HareketTipi,
  Hareket,
  HazirPaket,
  IcerikTuru,
  Kisi,
  NextDayPlan,
  Oneri,
  Paket,
  PlanKalemi,
  Sehir,
  Toplanti,
  Ucret,
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
 */

const y = (tr: string, ar: string, en: string): Yazi => ({ tr, ar, en });

/* --- Kişiler --- */

type KisiSatiri = [string, string, string, Kisi["birim"], Kisi["rol"], Kisi["gorev"], Sehir, Partial<Kisi>?];

const KISILER: KisiSatiri[] = [
  ["pl1", "Zeynep Aydın", "زينب آيدن", "planlama", "yonetici", "yonetici", "istanbul"],
  ["pl2", "Ayşe Yılmaz", "عائشة يلماز", "planlama", "personel", "planlamaci", "istanbul"],
  ["pl3", "Hamza Saleh", "حمزة صالح", "planlama", "personel", "planlamaci", "istanbul"],
  ["pl4", "Rana Khalil", "رنا خليل", "planlama", "personel", "planlamaci", "istanbul"],
  ["pl5", "Burak Demir", "بوراك دمير", "planlama", "personel", "planlamaci", "istanbul"],
  ["pl6", "Mariam Fawzi", "مريم فوزي", "planlama", "personel", "editor", "istanbul"],
  ["pl7", "Kerem Aksoy", "كرم أقصوي", "planlama", "personel", "editor", "istanbul"],
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
  ["yo1", "Kemal Erdem", "كمال أردم", "yonetim", "yonetici", "yonetici", "istanbul"],
  ["yo2", "Fatima Zahra Idrissi", "فاطمة الزهراء الإدريسي", "yonetim", "yonetici", "yonetici", "istanbul"],
  ["mu1", "Omar Haddad", "عمر حداد", "muhabir", "personel", "muhabir", "gazze", { durum: "sahada" }],
  ["mu2", "Selin Ercan", "سلين أرجان", "muhabir", "personel", "muhabir", "kudus"],
  ["mu3", "Mustafa Nasr", "مصطفى نصر", "muhabir", "personel", "muhabir", "beyrut", { durum: "sahada" }],
  ["mu4", "Ayşe Kurt", "عائشة كورت", "muhabir", "personel", "muhabir", "kahire", { durum: "yolda" }],
  ["mu5", "Mehmet Ali Toprak", "محمد علي توبراك", "muhabir", "personel", "muhabir", "washington", { durum: "sahada" }],
  ["mu6", "Muhannad Saleh", "مهند صالح", "muhabir", "personel", "muhabir", "istanbul"],
  ["mu7", "Ahmet Güneş", "أحمد غونش", "muhabir", "personel", "muhabir", "ankara"],
  ["mu8", "Rania Mansour", "رانيا منصور", "muhabir", "personel", "muhabir", "kahire"],
  ["mu9", "Nour Al-Ali", "نور العلي", "muhabir", "personel", "muhabir", "beyrut", { serbest: true, durum: "izinli" }],
  ["mu10", "Yusuf Demir", "يوسف دمير", "muhabir", "personel", "muhabir", "istanbul", { durum: "izinli" }],
  ["mu11", "Leyla Sayed", "ليلى السيد", "muhabir", "personel", "muhabir", "istanbul"],
  ["mu12", "Hasan Abu Zaid", "حسن أبو زيد", "muhabir", "personel", "muhabir", "gazze", { serbest: true, durum: "sahada" }],
  ["mu13", "Walid Kassem", "وليد قاسم", "muhabir", "personel", "muhabir", "sam", { durum: "sahada" }],
  ["mu14", "Abdullah Hamwi", "عبد الله الحموي", "muhabir", "personel", "muhabir", "halep", { serbest: true }],
  ["mu15", "Mohammed Rubaie", "محمد الربيعي", "muhabir", "personel", "muhabir", "bagdat"],
  ["mu16", "Shirin Kareem", "شيرين كريم", "muhabir", "personel", "muhabir", "erbil", { serbest: true }],
  ["mu17", "Ibrahim Odeh", "إبراهيم عودة", "muhabir", "personel", "muhabir", "amman"],
  ["mu18", "Tariq Al-Kuwari", "طارق الكواري", "muhabir", "personel", "muhabir", "doha"],
  ["mu19", "Fahad Al-Otaibi", "فهد العتيبي", "muhabir", "personel", "muhabir", "riyad", { serbest: true }],
  ["mu20", "Saeed Al-Hadi", "سعيد الهادي", "muhabir", "personel", "muhabir", "sana", { serbest: true }],
  ["mu21", "Amira Osman", "أميرة عثمان", "muhabir", "personel", "muhabir", "hartum", { serbest: true }],
  ["mu22", "Mahmoud Sweilem", "محمود سويلم", "muhabir", "personel", "muhabir", "trablus", { serbest: true }],
  ["mu23", "Anis Ben Salem", "أنيس بن سالم", "muhabir", "personel", "muhabir", "tunus"],
  ["mu24", "Youssef El Alaoui", "يوسف العلوي", "muhabir", "personel", "muhabir", "rabat", { serbest: true }],
  ["mu25", "Reza Ahmadi", "رضا أحمدي", "muhabir", "personel", "muhabir", "tahran", { serbest: true }],
  ["mu26", "Olena Kovalenko", "أولينا كوفالينكو", "muhabir", "personel", "muhabir", "kiev", { serbest: true, durum: "yolda" }],
  ["mu27", "Jamal Haddad", "جمال حداد", "muhabir", "personel", "muhabir", "newyork"],
  ["mu28", "Sophie Laurent", "صوفي لوران", "muhabir", "personel", "muhabir", "bruksel", { serbest: true }],
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

const eposta = (ad: string) =>
  ad
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z ]/g, "")
    .trim()
    .replace(/ +/g, ".") + "@ornek.local";

const kisiler = (): Kisi[] =>
  KISILER.map(([id, tr, ar, birim, rol, gorev, sehir, ek], i) => ({
    id,
    ad: y(tr, ar, tr),
    birim,
    rol,
    gorev,
    sehir,
    diller: birim === "muhabir" ? (i % 3 === 0 ? ["ar", "en"] : i % 3 === 1 ? ["ar", "tr"] : ["ar", "fr"]) : ["ar", "tr", "en"],
    telefon: `${ALAN_KODU[sehir] ?? "+90"} 000 000 ${String(i + 1).padStart(2, "0")}`,
    eposta: eposta(tr),
    durum: "gorevde",
    ...ek,
  }));

/* --- Merkezi başlık havuzu (promptun 4.4 maddesindeki örnekler önce) --- */

const BASLIKLAR: Baslik[] = [
  { id: "b-sudan", ad: y("Sudan", "السودان", "Sudan"), ulke: "sudan", aktif: true },
  { id: "b-filistin", ad: y("Filistin", "فلسطين", "Palestine"), ulke: "filistin", aktif: true },
  { id: "b-lubnan", ad: y("Lübnan", "لبنان", "Lebanon"), ulke: "lubnan", aktif: true },
  { id: "b-suriye", ad: y("Suriye", "سوريا", "Syria"), ulke: "suriye", aktif: true },
  { id: "b-ukrayna", ad: y("Ukrayna", "أوكرانيا", "Ukraine"), ulke: "ukrayna", aktif: true },
  { id: "b-abd", ad: y("ABD", "الولايات المتحدة", "United States"), ulke: "abd", aktif: true },
  { id: "b-turkiye", ad: y("Türkiye", "تركيا", "Türkiye"), ulke: "turkiye", aktif: true },
  { id: "b-iran", ad: y("İran", "إيران", "Iran"), ulke: "iran", aktif: true },
  { id: "b-ekonomi", ad: y("Dünya ekonomisi", "الاقتصاد العالمي", "Global economy"), aktif: true },
  { id: "b-bm", ad: y("Birleşmiş Milletler", "الأمم المتحدة", "United Nations"), aktif: true },
  { id: "b-irak", ad: y("Irak", "العراق", "Iraq"), ulke: "irak", aktif: true },
  { id: "b-misir", ad: y("Mısır", "مصر", "Egypt"), ulke: "misir", aktif: true },
  { id: "b-korfez", ad: y("Körfez", "الخليج", "The Gulf"), ulke: "katar", aktif: true },
  /* Kurumun Next Day çıktısındaki gibi konu başlıkları: ülke değil, gündemin kendisi. */
  { id: "b-ortadogu", ad: y("Ortadoğu'da savaş", "الحرب في الشرق الأوسط", "War in the Middle East"), aktif: true },
  { id: "b-ihlaller", ad: y("Filistin'de İsrail ihlalleri", "الانتهاكات الإسرائيلية في فلسطين", "Israeli violations in Palestine"), ulke: "filistin", aktif: true },
  { id: "b-rusya-ukrayna", ad: y("Rusya-Ukrayna savaşı", "الحرب الروسية الأوكرانية", "Russia-Ukraine war"), ulke: "ukrayna", aktif: true },
  { id: "b-turk-gundem", ad: y("Türkiye gündemi", "الأجندة التركية", "Turkish agenda"), ulke: "turkiye", aktif: true },
  { id: "b-yemen", ad: y("Yemen'de çatışma", "الصراع في اليمن", "Conflict in Yemen"), ulke: "yemen", aktif: false },
];

/* --- Hazır paket arşivi --- */

const HAZIR = (gun: (n: number) => string): HazirPaket[] => [
  {
    id: "hp1",
    slug: "CAIRO-NILEBOATS-PKG-RM",
    sehir: "kahire",
    baslik: y("Nil kıyısında geleneksel tekne yapımı", "صناعة القوارب التقليدية على ضفاف النيل", "Traditional boat-building on the Nile"),
    muhabirId: "mu8",
    aciklama: y(
      "Kuşaktan kuşağa aktarılan tekne ustalığı, ahşap fiyatları ve azalan siparişler arasında ayakta kalmaya çalışıyor.",
      "حرفة بناء القوارب المتوارثة عبر الأجيال تكافح للبقاء وسط ارتفاع أسعار الخشب وتراجع الطلب.",
      "A craft handed down through generations struggles to survive rising timber prices and falling orders.",
    ),
    tur: "feature",
    sure: "3:20",
    hazirlanma: gun(-6),
  },
  {
    id: "hp2",
    slug: "ISTANBUL-FATIH-PKG-YD",
    sehir: "istanbul",
    baslik: y("Arapça konuşan esnaf: Fatih'te bir gün", "تجار يتحدثون العربية: يوم في الفاتح", "Arabic-speaking shopkeepers: a day in Fatih"),
    muhabirId: "mu10",
    aciklama: y(
      "Fatih'in çarşılarında Arapça artık gündelik ticaretin dili; esnaf ve müşterilerle bir gün.",
      "في أسواق الفاتح أصبحت العربية لغة التجارة اليومية؛ يوم مع التجار والزبائن.",
      "In Fatih's markets Arabic has become the language of everyday trade; a day with traders and customers.",
    ),
    tur: "feature",
    sure: "4:10",
    hazirlanma: gun(-9),
  },
  {
    id: "hp3",
    slug: "BEIRUT-PORT-PKG-NA",
    sehir: "beyrut",
    baslik: y("Beyrut limanı patlamasının izleri", "آثار انفجار مرفأ بيروت", "Traces of the Beirut port blast"),
    muhabirId: "mu9",
    aciklama: y(
      "Liman çevresindeki mahallelerde yeniden yapılanma yavaş ilerliyor; aileler hâlâ adalet bekliyor.",
      "إعادة الإعمار في الأحياء المحيطة بالمرفأ تسير ببطء، والعائلات ما زالت تنتظر العدالة.",
      "Reconstruction around the port is slow and families are still waiting for justice.",
    ),
    tur: "haber",
    sure: "2:45",
    hazirlanma: gun(-4),
  },
  {
    id: "hp4",
    slug: "AMMAN-ZAATARI-PKG-IO",
    sehir: "amman",
    baslik: y("Zaatari kampında okul yılı başladı", "بدء العام الدراسي في مخيم الزعتري", "School year starts in Zaatari camp"),
    muhabirId: "mu17",
    aciklama: y(
      "Kalabalık sınıflar ve eksik malzemeye rağmen binlerce Suriyeli çocuk yeniden derste.",
      "رغم الاكتظاظ ونقص المستلزمات، عاد آلاف الأطفال السوريين إلى مقاعد الدراسة.",
      "Despite crowded classrooms and missing supplies, thousands of Syrian children are back in class.",
    ),
    tur: "feature",
    sure: "3:05",
    hazirlanma: gun(-3),
  },
  {
    id: "hp5",
    slug: "DOHA-AI-PKG-TK",
    sehir: "doha",
    baslik: y("Körfez'de yapay zekâ yatırımları", "استثمارات الذكاء الاصطناعي في الخليج", "AI investment in the Gulf"),
    muhabirId: "mu18",
    aciklama: y(
      "Körfez fonları veri merkezlerine milyarlarca dolar ayırıyor; bölgedeki yeni iş alanları.",
      "صناديق الخليج تضخ مليارات الدولارات في مراكز البيانات؛ فرص عمل جديدة في المنطقة.",
      "Gulf funds are pouring billions into data centres, creating new jobs in the region.",
    ),
    tur: "ekonomi",
    sure: "2:30",
    hazirlanma: gun(-5),
  },
  {
    id: "hp6",
    slug: "TUNIS-OLIVES-PKG-ABS",
    sehir: "tunus",
    baslik: y("Tunus'ta zeytinyağı hasadı", "موسم قطف الزيتون في تونس", "Olive oil harvest in Tunisia"),
    muhabirId: "mu23",
    aciklama: y(
      "Rekor rekolte beklentisi ihracatçıları sevindiriyor, küçük üreticiler maliyetlerden şikâyetçi.",
      "توقعات بمحصول قياسي تسعد المصدّرين، فيما يشكو صغار المنتجين من التكاليف.",
      "A record harvest pleases exporters while small producers complain about costs.",
    ),
    tur: "ekonomi",
    sure: "2:50",
    hazirlanma: gun(-7),
  },
  {
    id: "hp7",
    slug: "ERBIL-CITADEL-PKG-SK",
    sehir: "erbil",
    baslik: y("Erbil kalesinde restorasyon", "ترميم قلعة أربيل", "Restoring Erbil citadel"),
    muhabirId: "mu16",
    aciklama: y(
      "Dünyanın sürekli yerleşim gören en eski noktalarından biri ziyaretçilere yeniden açılıyor.",
      "واحدة من أقدم المواقع المأهولة باستمرار في العالم تعود لاستقبال الزوار.",
      "One of the world's oldest continuously inhabited sites reopens to visitors.",
    ),
    tur: "feature",
    sure: "3:40",
    hazirlanma: gun(-12),
  },
  {
    id: "hp8",
    slug: "BRUSSELS-MIGRATION-PKG-SL",
    sehir: "bruksel",
    baslik: y("AB göç paktı: sahadan görünüm", "ميثاق الهجرة الأوروبي: صورة من الميدان", "EU migration pact: the view from the ground"),
    muhabirId: "mu28",
    aciklama: y(
      "Yeni kurallar sınır ülkelerinde nasıl uygulanıyor; sığınmacılar ve yetkililer anlatıyor.",
      "كيف تُطبَّق القواعد الجديدة في الدول الحدودية؛ شهادات طالبي لجوء ومسؤولين.",
      "How the new rules work in border states, told by asylum seekers and officials.",
    ),
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
  baslik: Yazi;
  sehir: Sehir;
  muhabirId: string;
  aciklama: Yazi;
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
}

const GAZZE_METNI =
  "تعاني المستشفيات في قطاع غزة من نقص حاد في الأدوية والوقود، فيما تعمل أقسام الطوارئ بأكثر من طاقتها الاستيعابية. ويقول الأطباء إن المولدات الاحتياطية لا تكفي إلا لساعات محدودة يوميا، وإن آلاف المرضى ينتظرون عمليات مؤجلة. وتؤكد منظمة الصحة العالمية أن أقل من نصف مستشفيات القطاع ما زالت تعمل بشكل جزئي.";

const PAKETLER: PaketTanimi[] = [
  // Bugünün planı: Newsdesk devraldı, paketler üretimin farklı adımlarında.
  {
    id: "p-gazze",
    plan: "bugun",
    pb: "pb-b-filistin",
    slug: "GAZA-HEALTH-PKG-OH",
    baslik: y("Gazze'de sağlık sistemi çökmenin eşiğinde", "النظام الصحي في غزة على حافة الانهيار", "Gaza's health system on the brink of collapse"),
    sehir: "gazze",
    muhabirId: "mu1",
    aciklama: y(
      "Hastanelerde ilaç ve yakıt sıkıntısı; doktorlar ve hastalarla görüşmeler, DSÖ verileri.",
      "نقص الأدوية والوقود في المستشفيات؛ مقابلات مع أطباء ومرضى وبيانات منظمة الصحة العالمية.",
      "Medicine and fuel shortages in hospitals; interviews with doctors and patients, WHO figures.",
    ),
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
    baslik: y("Mescid-i Aksa çevresinde yeni kısıtlamalar", "قيود جديدة في محيط المسجد الأقصى", "New restrictions around Al-Aqsa Mosque"),
    sehir: "kudus",
    muhabirId: "mu2",
    aciklama: y(
      "Eski şehir esnafı ve cemaatle görüşmeler; kapılardaki yeni uygulamalar.",
      "مقابلات مع تجار البلدة القديمة والمصلين؛ الإجراءات الجديدة على الأبواب.",
      "Interviews with Old City traders and worshippers; new measures at the gates.",
    ),
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
    baslik: y("Lübnan'da yeniden yapılanma konferansı hazırlıkları", "التحضيرات لمؤتمر إعادة الإعمار في لبنان", "Preparations for Lebanon's reconstruction conference"),
    sehir: "beyrut",
    muhabirId: "mu3",
    aciklama: y(
      "Bağışçı ülkelerin beklentileri ve güneyde hasar tespiti.",
      "توقعات الدول المانحة وتقييم الأضرار في الجنوب.",
      "Donor expectations and damage assessment in the south.",
    ),
    durum: "uretimde",
    adim: "metin",
    oneriId: "o-beyrut",
    saat: "19:00",
    teslimDk: -40,
  },
  {
    id: "p-sam",
    plan: "bugun",
    pb: "pb-b-suriye",
    baslik: y("Suriye'ye dönüşler: sınır kapısında bir gün", "العودة إلى سوريا: يوم على المعبر الحدودي", "Returning to Syria: a day at the border crossing"),
    sehir: "sam",
    muhabirId: "mu13",
    aciklama: y(
      "Dönen ailelerin hikâyeleri ve sınırdaki işlemler.",
      "قصص العائلات العائدة والإجراءات على الحدود.",
      "Stories of returning families and border procedures.",
    ),
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
    baslik: y("İstanbul'da Türkiye-Körfez iş forumu", "منتدى الأعمال التركي الخليجي في إسطنبول", "Türkiye-Gulf business forum in Istanbul"),
    sehir: "istanbul",
    muhabirId: "mu6",
    aciklama: y(
      "Forumdan görüntüler, iş insanlarıyla röportajlar ve imzalanan anlaşmalar.",
      "صور من المنتدى ومقابلات مع رجال أعمال والاتفاقيات الموقعة.",
      "Footage from the forum, interviews with business people and signed deals.",
    ),
    durum: "uretimde",
    adim: "video",
    saat: "18:00",
    teslimDk: 140,
  },
  {
    id: "p-altin",
    plan: "bugun",
    pb: "pb-b-ekonomi",
    baslik: y("Altında rekor: Körfez borsalarına etkisi", "الذهب يسجل رقما قياسيا: الأثر على بورصات الخليج", "Gold hits a record: impact on Gulf markets"),
    sehir: "istanbul",
    muhabirId: "mu11",
    aciklama: y(
      "Kapalıçarşı'dan görüntüler ve iki ekonomistle kısa röportaj.",
      "صور من البازار الكبير ومقابلة قصيرة مع خبيرين اقتصاديين.",
      "Footage from the Grand Bazaar and short interviews with two economists.",
    ),
    durum: "uretimde",
    adim: "kontrol",
    saat: "14:00",
    teslimDk: 30,
  },
  {
    id: "p-kongre",
    plan: "bugun",
    pb: "pb-b-abd",
    baslik: y("ABD Kongresi'nde Orta Doğu oturumu", "جلسة الكونغرس الأمريكي حول الشرق الأوسط", "US Congress hearing on the Middle East"),
    sehir: "washington",
    muhabirId: "mu5",
    aciklama: y(
      "Oturumdan öne çıkanlar ve Arap-Amerikan derneklerinin tepkisi.",
      "أبرز ما جاء في الجلسة وردود فعل الجمعيات العربية الأمريكية.",
      "Highlights from the hearing and reactions from Arab-American groups.",
    ),
    durum: "uretimde",
    adim: "iletim",
    saat: "22:00",
  },
  {
    id: "p-meclis",
    plan: "bugun",
    pb: "pb-b-turkiye",
    baslik: y("TBMM'de yeni yasama yılı başlıyor", "البرلمان التركي يفتتح سنته التشريعية الجديدة", "Turkish parliament opens its new legislative year"),
    sehir: "ankara",
    muhabirId: "mu30",
    aciklama: y(
      "Açılış konuşması ve Arap dünyasını ilgilendiren gündem maddeleri.",
      "خطاب الافتتاح وبنود الأجندة التي تهم العالم العربي.",
      "The opening speech and agenda items relevant to the Arab world.",
    ),
    durum: "uretimde",
    adim: "inews",
    saat: "15:00",
  },
  {
    id: "p-bm",
    plan: "bugun",
    pb: "pb-b-bm",
    baslik: y("BM Genel Kurulu'nda Filistin oturumu", "جلسة الجمعية العامة للأمم المتحدة بشأن فلسطين", "UN General Assembly session on Palestine"),
    sehir: "newyork",
    muhabirId: "mu27",
    aciklama: y(
      "Oylama sonucu ve delegasyonların açıklamaları.",
      "نتيجة التصويت وتصريحات الوفود.",
      "The vote result and statements by delegations.",
    ),
    durum: "tamamlandi",
    saat: "12:00",
  },

  // Dünün planı: hepsi tamamlandı, biri iptal.
  {
    id: "p-hartum-dun",
    plan: "dun",
    pb: "pb-d-sudan",
    baslik: y("Hartum'da yerinden edilenler geri dönüyor", "عودة النازحين إلى الخرطوم", "Displaced people return to Khartoum"),
    sehir: "hartum",
    muhabirId: "mu21",
    aciklama: y("Mahallelerde hayat yeniden başlıyor.", "الحياة تعود تدريجيا إلى الأحياء.", "Life slowly returns to the neighbourhoods."),
    durum: "tamamlandi",
    saha: true,
    saat: "19:00",
    ucret: { tutar: 300, para: "USD", durum: "onaylandi" },
  },
  {
    id: "p-gazze-dun",
    plan: "dun",
    pb: "pb-d-filistin",
    baslik: y("Gazze'de okullar çadırlarda açıldı", "افتتاح المدارس في الخيام بغزة", "Gaza schools reopen in tents"),
    sehir: "gazze",
    muhabirId: "mu12",
    aciklama: y("Çadır sınıflarda ilk ders günü.", "أول يوم دراسي في الفصول المقامة داخل الخيام.", "First day of lessons in tent classrooms."),
    durum: "tamamlandi",
    saha: true,
    saat: "19:00",
    ucret: { tutar: 250, para: "USD", durum: "odendi" },
  },
  {
    id: "p-bagdat-dun",
    plan: "dun",
    pb: "pb-d-irak",
    baslik: y("Irak'ta seçim kampanyası resmen başladı", "انطلاق الحملة الانتخابية رسميا في العراق", "Iraq's election campaign officially begins"),
    sehir: "bagdat",
    muhabirId: "mu15",
    aciklama: y("Bağdat sokaklarında afişler ve ittifak pazarlıkları.", "ملصقات في شوارع بغداد ومفاوضات التحالفات.", "Posters across Baghdad and coalition bargaining."),
    durum: "tamamlandi",
    saat: "21:00",
  },
  {
    id: "p-ankara-dun",
    plan: "dun",
    pb: "pb-d-turkiye",
    baslik: y("Ankara'da Filistin konferansı", "مؤتمر فلسطين في أنقرة", "Palestine conference in Ankara"),
    sehir: "ankara",
    muhabirId: "mu7",
    aciklama: y("Konferanstan açıklamalar.", "تصريحات من المؤتمر.", "Statements from the conference."),
    durum: "tamamlandi",
    saat: "16:00",
  },
  {
    id: "p-halep-dun",
    plan: "dun",
    pb: "pb-d-filistin",
    baslik: y("Halep'te tarihi çarşının restorasyonu", "ترميم السوق القديم في حلب", "Restoring Aleppo's old souk"),
    sehir: "halep",
    muhabirId: "mu14",
    aciklama: y("Toplantıda ertelendi; feature dosyasına alınacak.", "أُجّل في الاجتماع وسيُنقل إلى ملف التقارير.", "Postponed at the meeting; moved to the feature file."),
    durum: "iptal",
    saat: "",
  },

  // Yarının planı: akşam toplantısına hazırlanıyor.
  {
    id: "p-refah",
    plan: "yarin",
    pb: "pb-y-ihlaller",
    slug: "RAFAH-AIDTRUCKS-PKG-HAZ",
    baslik: y("Refah sınır kapısında bekleyen yardım tırları", "شاحنات المساعدات العالقة عند معبر رفح", "Aid trucks stuck at the Rafah crossing"),
    sehir: "gazze",
    muhabirId: "mu12",
    aciklama: y(
      "Sabah sınırdan canlı; BM yetkilisiyle kısa röportaj mümkün.",
      "بث مباشر صباحي من المعبر؛ مقابلة قصيرة مع مسؤول أممي ممكنة.",
      "Morning live shot from the crossing; a short interview with a UN official is possible.",
    ),
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
    baslik: y("Lübnan'da elektrik krizi: mahalle jeneratörleri", "أزمة الكهرباء في لبنان: مولدات الأحياء", "Lebanon's power crisis: neighbourhood generators"),
    sehir: "beyrut",
    muhabirId: "mu3",
    aciklama: y(
      "Jeneratör sahipleri, faturalar ve devletin yeni tarifesi.",
      "أصحاب المولدات والفواتير والتعرفة الحكومية الجديدة.",
      "Generator owners, bills and the government's new tariff.",
    ),
    durum: "taslak",
    oneriId: "o-elektrik",
    saat: "19:00",
  },
  {
    id: "p-hartum",
    plan: "yarin",
    pb: "pb-y-sudan",
    slug: "KHARTOUM-HOSPITALS-PKG-AO",
    baslik: y("Hartum'da hastaneler yeniden açılıyor", "إعادة فتح المستشفيات في الخرطوم", "Khartoum hospitals reopen"),
    sehir: "hartum",
    muhabirId: "mu21",
    aciklama: y(
      "Hasar gören iki hastane kısmen hizmete döndü; sağlık çalışanlarıyla görüşmeler.",
      "عودة مستشفيين متضررين إلى العمل جزئيا؛ مقابلات مع العاملين الصحيين.",
      "Two damaged hospitals partly back in service; interviews with health workers.",
    ),
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
    baslik: y("Türkiye-Körfez ticaret hacmi: yıl sonu beklentisi", "حجم التجارة التركية الخليجية: توقعات نهاية العام", "Türkiye-Gulf trade: year-end outlook"),
    sehir: "istanbul",
    muhabirId: "mu11",
    aciklama: y(
      "DEİK verisi yarın açıklanacak; stüdyo konuğu ayarlanabilir.",
      "بيانات مجلس العلاقات الاقتصادية الخارجية تصدر غدا؛ يمكن ترتيب ضيف في الاستوديو.",
      "Foreign trade board figures are due tomorrow; a studio guest can be arranged.",
    ),
    durum: "taslak",
    oneriId: "o-ticaret",
    saat: "14:00",
  },

  // Haftalık plandan gelen feature ve program işleri: Next Day'e girmeden kendi kollarında.
  {
    id: "p-elyazma",
    baslik: y("Kahire'de el yazmaları kütüphanesi", "مكتبة المخطوطات في القاهرة", "Cairo's manuscript library"),
    sehir: "kahire",
    muhabirId: "mu8",
    aciklama: y(
      "Yüzyıllık el yazmalarını dijitalleştiren ekip.",
      "فريق يعمل على رقمنة مخطوطات عمرها قرون.",
      "The team digitising centuries-old manuscripts.",
    ),
    tur: "feature",
    durum: "uretimde",
    adim: "video",
  },
  {
    id: "p-hidrojen",
    baslik: y("Körfez'de yeşil hidrojen yatırımları", "استثمارات الهيدروجين الأخضر في الخليج", "Green hydrogen investment in the Gulf"),
    sehir: "doha",
    muhabirId: "mu18",
    aciklama: y("Yeni projeler ve enerji dönüşümü.", "مشاريع جديدة وتحوّل الطاقة.", "New projects and the energy transition."),
    tur: "ekonomi",
    durum: "uretimde",
    adim: "kontrol",
  },
  {
    id: "p-girisim",
    baslik: y("Program: Arap dünyasında genç girişimciler", "برنامج: رواد الأعمال الشباب في العالم العربي", "Programme: young entrepreneurs in the Arab world"),
    sehir: "amman",
    muhabirId: "mu17",
    aciklama: y(
      "Haftalık program için üç girişimci portresi.",
      "ثلاثة بورتريهات لرواد أعمال لصالح البرنامج الأسبوعي.",
      "Three entrepreneur profiles for the weekly programme.",
    ),
    tur: "program",
    durum: "uretimde",
    adim: "newsdesk",
  },
];

/* --- Öneriler --- */

interface OneriTanimi {
  id: string;
  muhabirId: string;
  haber: Yazi;
  gelisme: Yazi;
  paket?: Yazi;
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
    haber: y("Gazze'de hastaneler", "مستشفيات غزة", "Gaza hospitals"),
    gelisme: y(
      "Şifa ve Nasır hastanelerinde yakıt bitmek üzere; doktorlar ameliyatları erteliyor.",
      "الوقود على وشك النفاد في مستشفيي الشفاء وناصر؛ الأطباء يؤجلون العمليات.",
      "Fuel is about to run out at Al-Shifa and Nasser hospitals; doctors are postponing operations.",
    ),
    paket: y("Gazze'de sağlık sistemi çökmenin eşiğinde", "النظام الصحي في غزة على حافة الانهيار", "Gaza's health system on the brink of collapse"),
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
    haber: y("Kudüs eski şehir", "البلدة القديمة في القدس", "Jerusalem Old City"),
    gelisme: y("Aksa kapılarında yeni denetim noktaları kuruldu.", "إقامة نقاط تفتيش جديدة عند أبواب الأقصى.", "New checkpoints set up at the Al-Aqsa gates."),
    paket: y("Mescid-i Aksa çevresinde yeni kısıtlamalar", "قيود جديدة في محيط المسجد الأقصى", "New restrictions around Al-Aqsa Mosque"),
    durum: "planaEklendi",
    baslikId: "b-filistin",
    paketId: "p-kudus",
  },
  {
    id: "o-beyrut",
    muhabirId: "mu3",
    gun: "dun",
    saat: "11:05",
    haber: y("Lübnan yeniden yapılanma", "إعادة الإعمار في لبنان", "Lebanon reconstruction"),
    gelisme: y("Bağışçılar konferansı gelecek hafta Beyrut'ta.", "مؤتمر المانحين الأسبوع المقبل في بيروت.", "Donor conference in Beirut next week."),
    paket: y("Lübnan'da yeniden yapılanma konferansı hazırlıkları", "التحضيرات لمؤتمر إعادة الإعمار في لبنان", "Preparations for Lebanon's reconstruction conference"),
    durum: "planaEklendi",
    baslikId: "b-lubnan",
    paketId: "p-beyrut",
  },
  {
    id: "o-sam",
    muhabirId: "mu13",
    gun: "dun",
    saat: "11:30",
    haber: y("Suriye'ye dönüşler", "العودة إلى سوريا", "Returns to Syria"),
    gelisme: y("Cdeydet Yabus kapısında günlük geçiş sayısı arttı.", "ارتفاع عدد العابرين يوميا عبر معبر جديدة يابوس.", "Daily crossings rise at the Jdeidet Yabous border post."),
    paket: y("Suriye'ye dönüşler: sınır kapısında bir gün", "العودة إلى سوريا: يوم على المعبر الحدودي", "Returning to Syria: a day at the border crossing"),
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
    haber: y("Yemen'de kolera", "الكوليرا في اليمن", "Cholera in Yemen"),
    gelisme: y("Sana'da kolera vakalarında artış bildiriliyor.", "تقارير عن ارتفاع حالات الكوليرا في صنعاء.", "Reports of rising cholera cases in Sanaa."),
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
    haber: y("Refah sınır kapısı", "معبر رفح", "Rafah crossing"),
    gelisme: y(
      "Yüzlerce yardım tırı üç gündür sınırda bekliyor; BM sevkiyat için yeni güzergâh istiyor.",
      "مئات شاحنات المساعدات تنتظر على الحدود منذ ثلاثة أيام؛ الأمم المتحدة تطالب بمسار جديد.",
      "Hundreds of aid trucks have waited at the border for three days; the UN wants a new route.",
    ),
    paket: y("Refah sınır kapısında bekleyen yardım tırları", "شاحنات المساعدات العالقة عند معبر رفح", "Aid trucks stuck at the Rafah crossing"),
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
    haber: y("Lübnan elektrik", "الكهرباء في لبنان", "Lebanon electricity"),
    gelisme: y("Hükümet jeneratörler için yeni tarife açıkladı.", "الحكومة تعلن تعرفة جديدة للمولدات.", "The government announced a new tariff for generators."),
    paket: y("Lübnan'da elektrik krizi: mahalle jeneratörleri", "أزمة الكهرباء في لبنان: مولدات الأحياء", "Lebanon's power crisis: neighbourhood generators"),
    durum: "planaEklendi",
    baslikId: "b-ortadogu",
    paketId: "p-elektrik",
  },
  {
    id: "o-hartum",
    muhabirId: "mu21",
    gun: "bugun",
    saat: "10:05",
    haber: y("Sudan sağlık", "الصحة في السودان", "Sudan health"),
    gelisme: y("Hartum'da iki hastane kısmen hizmete döndü.", "عودة مستشفيين في الخرطوم إلى العمل جزئيا.", "Two Khartoum hospitals are partly back in service."),
    paket: y("Hartum'da hastaneler yeniden açılıyor", "إعادة فتح المستشفيات في الخرطوم", "Khartoum hospitals reopen"),
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
    haber: y("Türkiye-Körfez ticareti", "التجارة التركية الخليجية", "Türkiye-Gulf trade"),
    gelisme: y("Yıl sonu ticaret verisi yarın açıklanacak.", "بيانات التجارة لنهاية العام تصدر غدا.", "Year-end trade figures are due tomorrow."),
    paket: y("Türkiye-Körfez ticaret hacmi: yıl sonu beklentisi", "حجم التجارة التركية الخليجية: توقعات نهاية العام", "Türkiye-Gulf trade: year-end outlook"),
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
    haber: y("Mısır arabuluculuğu", "الوساطة المصرية", "Egyptian mediation"),
    gelisme: y(
      "Kahire'de Gazze ateşkesi için yeni tur görüşmeler yarın başlıyor.",
      "جولة جديدة من محادثات وقف إطلاق النار في غزة تبدأ غدا في القاهرة.",
      "A new round of Gaza ceasefire talks begins in Cairo tomorrow.",
    ),
    paket: y("Kahire'de ateşkes görüşmeleri", "محادثات وقف إطلاق النار في القاهرة", "Ceasefire talks in Cairo"),
    durum: "yeni",
  },
  {
    id: "o-bagdat",
    muhabirId: "mu15",
    gun: "bugun",
    saat: "10:50",
    haber: y("Irak seçimleri", "الانتخابات العراقية", "Iraq elections"),
    gelisme: y("Şii ve Sünni bloklar arasında yeni ittifak görüşmeleri.", "مفاوضات تحالف جديدة بين الكتل الشيعية والسنية.", "New alliance talks between Shia and Sunni blocs."),
    durum: "yeni",
  },
  {
    id: "o-amman",
    muhabirId: "mu17",
    gun: "bugun",
    saat: "11:10",
    haber: y("Ürdün su krizi", "أزمة المياه في الأردن", "Jordan water crisis"),
    gelisme: y("Amman'da haftalık su kesintileri iki güne çıktı.", "انقطاع المياه الأسبوعي في عمّان يرتفع إلى يومين.", "Weekly water cuts in Amman rise to two days."),
    paket: y("Ürdün'de su kıtlığı ve tuzdan arındırma projesi", "شح المياه في الأردن ومشروع التحلية", "Jordan's water scarcity and the desalination project"),
    tur: "feature",
    durum: "degerlendiriliyor",
  },
  {
    id: "o-tahran",
    muhabirId: "mu25",
    gun: "bugun",
    saat: "11:25",
    haber: y("İran nükleer görüşmeler", "المحادثات النووية الإيرانية", "Iran nuclear talks"),
    gelisme: y("Umman'da dolaylı görüşmelerin yeni turu için tarih belirlendi.", "تحديد موعد جولة جديدة من المحادثات غير المباشرة في عُمان.", "A date has been set for new indirect talks in Oman."),
    kanal: "eposta",
    durum: "yeni",
  },
  {
    id: "o-kiev",
    muhabirId: "mu26",
    gun: "bugun",
    saat: "11:40",
    haber: y("Ukrayna tahıl", "الحبوب الأوكرانية", "Ukrainian grain"),
    gelisme: y("Karadeniz limanlarından Arap ülkelerine tahıl sevkiyatı arttı.", "ارتفاع شحنات الحبوب من موانئ البحر الأسود إلى الدول العربية.", "Grain shipments from Black Sea ports to Arab countries are up."),
    paket: y("Ukrayna tahılı Arap sofralarına nasıl ulaşıyor", "كيف تصل الحبوب الأوكرانية إلى موائد العرب", "How Ukrainian grain reaches Arab tables"),
    tur: "ekonomi",
    durum: "sonra",
    gerekce: "Haftalık plandaki ekonomi dosyasında değerlendirilecek.",
  },
  {
    id: "o-doha",
    muhabirId: "mu18",
    gun: "bugun",
    saat: "12:00",
    haber: y("Katar arabuluculuğu", "الوساطة القطرية", "Qatari mediation"),
    gelisme: y("Doha'da esir takası için teknik heyetler bir araya geliyor.", "وفود فنية تجتمع في الدوحة لبحث تبادل الأسرى.", "Technical delegations meet in Doha on a prisoner swap."),
    durum: "degerlendiriliyor",
  },
  {
    id: "o-halep",
    muhabirId: "mu14",
    gun: "bugun",
    saat: "12:20",
    haber: y("Halep okulları", "مدارس حلب", "Aleppo schools"),
    gelisme: y("Doğu Halep'te onarılan 12 okul öğrencilerini kabul etmeye başladı.", "12 مدرسة مرممة في شرق حلب تبدأ استقبال الطلاب.", "Twelve repaired schools in eastern Aleppo start taking pupils."),
    paket: y("Halep'te onarılan okullar", "المدارس المرممة في حلب", "Aleppo's repaired schools"),
    saha: true,
    kanal: "mesaj",
    durum: "yeni",
  },
  {
    id: "o-rabat",
    muhabirId: "mu24",
    gun: "bugun",
    saat: "12:35",
    haber: y("Fas deprem bölgesi", "منطقة الزلزال في المغرب", "Morocco quake zone"),
    gelisme: y("Atlas dağlarındaki köylerde yeniden yapılanma sürüyor.", "إعادة الإعمار مستمرة في قرى جبال الأطلس.", "Reconstruction continues in Atlas mountain villages."),
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

/* [plan başlığı ya da "" (takip), yer, metin, kaynak türü, kaynak adı, öneren] */
type GelismeTanimi = [string, Yazi | undefined, Yazi, Gelisme["kaynakTuru"], string, string?];

const GELISMELER: Record<"dun" | "bugun" | "yarin", GelismeTanimi[]> = {
  dun: [
    ["pb-d-filistin", y("Gazze", "غزة", "Gaza"), y("Gazze'de okullar çadırlarda yeniden açıldı.", "إعادة فتح المدارس في الخيام بغزة.", "Gaza schools reopened in tents."), "ajans", "Anadolu Ajansı"],
    ["pb-d-sudan", y("Hartum", "الخرطوم", "Khartoum"), y("BM: Hartum'a dönüşler hızlandı.", "الأمم المتحدة: تسارع العودة إلى الخرطوم.", "UN: returns to Khartoum are accelerating."), "resmi", "UNHCR"],
    ["pb-d-irak", y("Bağdat", "بغداد", "Baghdad"), y("Seçim kampanyası resmen başladı.", "انطلاق الحملة الانتخابية رسميا.", "The election campaign officially began."), "ajans", "Reuters"],
  ],
  bugun: [
    ["pb-b-filistin", y("Gazze", "غزة", "Gaza"), y("DSÖ: Gazze'deki hastanelerin yarısından azı kısmen çalışıyor.", "الصحة العالمية: أقل من نصف مستشفيات غزة تعمل جزئيا.", "WHO: fewer than half of Gaza's hospitals are partly functioning."), "resmi", "DSÖ"],
    ["pb-b-filistin", y("Kudüs", "القدس", "Jerusalem"), y("Aksa kapılarında yeni denetim noktaları kuruldu.", "إقامة نقاط تفتيش جديدة عند أبواب الأقصى.", "New checkpoints at the Al-Aqsa gates."), "muhabir", "", "mu2"],
    ["pb-b-lubnan", y("Beyrut", "بيروت", "Beirut"), y("Bağışçılar konferansı için 40 ülke katılımını doğruladı.", "40 دولة تؤكد مشاركتها في مؤتمر المانحين.", "Forty countries have confirmed attendance at the donor conference."), "ajans", "AFP"],
    ["pb-b-suriye", y("Şam", "دمشق", "Damascus"), y("BMMYK: Bu yıl 500 bini aşkın Suriyeli ülkesine döndü.", "المفوضية: أكثر من 500 ألف سوري عادوا هذا العام.", "UNHCR: more than 500,000 Syrians have returned this year."), "resmi", "BMMYK"],
    ["pb-b-turkiye", y("Ankara", "أنقرة", "Ankara"), y("TBMM yeni yasama yılına başlıyor; açılış konuşması saat 14:00'te.", "البرلمان التركي يبدأ سنته التشريعية؛ خطاب الافتتاح الساعة 14:00.", "Parliament opens its new year; the opening speech is at 14:00."), "resmi", "TBMM"],
    ["pb-b-ekonomi", undefined, y("Ons altın 2.700 doları aştı.", "سعر أونصة الذهب يتجاوز 2700 دولار.", "Gold tops $2,700 an ounce."), "ajans", "Bloomberg"],
    ["pb-b-abd", y("Washington", "واشنطن", "Washington"), y("Kongre'de Orta Doğu oturumu yerel saatle 10:00'da.", "جلسة الكونغرس حول الشرق الأوسط الساعة 10:00 بالتوقيت المحلي.", "The Congress hearing on the Middle East is at 10:00 local time."), "medya", "C-SPAN"],
    ["pb-b-bm", y("New York", "نيويورك", "New York"), y("Genel Kurul Filistin kararını oyluyor.", "الجمعية العامة تصوت على قرار بشأن فلسطين.", "The General Assembly votes on a Palestine resolution."), "resmi", "BM"],
    ["", y("Brüksel", "بروكسل", "Brussels"), y("AB dışişleri bakanları Pazartesi Orta Doğu'yu görüşecek.", "وزراء خارجية الاتحاد الأوروبي يبحثون الشرق الأوسط الاثنين.", "EU foreign ministers will discuss the Middle East on Monday."), "ajans", "AFP"],
  ],
  yarin: [
    ["pb-y-ortadogu", y("Tahran", "طهران", "Tehran"), y("İran, ABD ile dolaylı görüşmelerin Umman'da süreceğini açıkladı; Tahran yaptırımların kaldırılmasında takvim istiyor.", "أعلنت إيران أن المحادثات غير المباشرة مع الولايات المتحدة ستتواصل في عُمان، فيما تطالب طهران بجدول زمني لرفع العقوبات.", "Iran said indirect talks with the US will continue in Oman; Tehran wants a timetable for lifting sanctions."), "ajans", "IRNA"],
    ["pb-y-ortadogu", y("Güney Lübnan", "جنوب لبنان", "South Lebanon"), y("Lübnan hükümeti güneyde yeniden yapılanma için ilk kalkınma projelerini başlatıyor.", "الحكومة اللبنانية تطلق أولى مشاريع التنمية لإعادة إعمار الجنوب.", "Lebanon's government launches its first development projects to rebuild the south."), "resmi", "Lübnan Başbakanlığı"],
    ["pb-y-ihlaller", y("Kudüs", "القدس", "Jerusalem"), y("Kudüs kuruluşları cuma namazı için Aksa'ya yoğun katılım çağrısı yaptı.", "مؤسسات مقدسية تدعو إلى الحشد في المسجد الأقصى لصلاة الجمعة.", "Jerusalem groups called for large attendance at Al-Aqsa for Friday prayers."), "medya", "WAFA"],
    ["pb-y-ihlaller", y("Refah", "رفح", "Rafah"), y("Mısır: Refah'tan geçişler için yeni düzenleme görüşülüyor.", "مصر: بحث ترتيبات جديدة للعبور من رفح.", "Egypt: new arrangements for Rafah crossings under discussion."), "ajans", "Anadolu Ajansı"],
    ["pb-y-sudan", y("New York", "نيويورك", "New York"), y("BM Güvenlik Konseyi yarın Sudan'ı görüşecek.", "مجلس الأمن يناقش الوضع في السودان غدا.", "The UN Security Council will discuss Sudan tomorrow."), "resmi", "BM"],
    ["pb-y-ukrayna", y("Cenevre", "جنيف", "Geneva"), y("BM İnsan Hakları Konseyi'nde Ukrayna'daki duruma ilişkin sözlü brifing.", "إحاطة شفهية حول الوضع في أوكرانيا أمام مجلس حقوق الإنسان الأممي.", "Oral briefing on Ukraine at the UN Human Rights Council."), "resmi", "BM"],
    ["pb-y-turkiye", y("Ankara", "أنقرة", "Ankara"), y("Dışişleri Bakanı Körfez turu öncesi basın toplantısı düzenleyecek.", "وزير الخارجية التركي يعقد مؤتمرا صحفيا قبل جولته الخليجية.", "The foreign minister will hold a press conference before his Gulf tour."), "resmi", "Dışişleri Bakanlığı"],
    ["pb-y-ekonomi", undefined, y("Petrol fiyatları OPEC+ kararı öncesi dalgalı.", "تقلب أسعار النفط قبل قرار أوبك+.", "Oil prices volatile ahead of the OPEC+ decision."), "ajans", "Reuters"],
    ["", y("Washington", "واشنطن", "Washington"), y("ABD Senatosu ara seçimler öncesi son oturumunu yapıyor.", "مجلس الشيوخ الأمريكي يعقد جلسته الأخيرة قبل الانتخابات النصفية.", "The US Senate holds its last session before the midterms."), "medya", "AP"],
    ["", y("Kahire", "القاهرة", "Cairo"), y("Mısır, Afrika yatırım forumuna ev sahipliği yapıyor.", "مصر تستضيف منتدى للاستثمار في أفريقيا.", "Egypt hosts an Africa investment forum."), "ajans", "MENA"],
    ["", y("Brüksel", "بروكسل", "Brussels"), y("AB dışişleri bakanları Orta Doğu'yu görüşüyor.", "وزراء خارجية الاتحاد الأوروبي يبحثون الشرق الأوسط.", "EU foreign ministers discuss the Middle East."), "ajans", "AFP"],
  ],
};

/* --- Muhabir hareketleri --- */

const GOREVLENDIRMELER = (gun: (n: number) => string): Gorevlendirme[] => [
  {
    id: "gr-washington",
    kisiId: "mu5",
    tur: "gorevlendirme",
    yer: y("Washington", "واشنطن", "Washington"),
    baslangic: gun(-10),
    bitis: gun(35),
    aciklama: y("ABD ara seçimleri öncesi Washington'da görev.", "مهمة في واشنطن قبل الانتخابات النصفية الأمريكية.", "Assignment in Washington ahead of the US midterms."),
    yurtdisi: true,
    durum: "suruyor",
  },
  {
    id: "gr-izin-yusuf",
    kisiId: "mu10",
    tur: "izin",
    yer: y("İstanbul", "إسطنبول", "Istanbul"),
    baslangic: gun(-1),
    bitis: gun(1),
    aciklama: y("Yıllık izin.", "إجازة سنوية.", "Annual leave."),
    yurtdisi: false,
    durum: "suruyor",
  },
  {
    id: "gr-kahire",
    kisiId: "mu4",
    tur: "seyahat",
    yer: y("Kahire → İstanbul", "القاهرة ← إسطنبول", "Cairo → Istanbul"),
    baslangic: gun(0),
    bitis: gun(2),
    aciklama: y("Merkezde eğitim programı.", "برنامج تدريبي في المقر.", "Training programme at headquarters."),
    yurtdisi: true,
    durum: "suruyor",
  },
  {
    id: "gr-kiev",
    kisiId: "mu26",
    tur: "seyahat",
    yer: y("Kiev → Odessa", "كييف ← أوديسا", "Kyiv → Odesa"),
    baslangic: gun(1),
    bitis: gun(3),
    aciklama: y("Limanda tahıl sevkiyatı çekimi.", "تصوير شحنات الحبوب في الميناء.", "Filming grain shipments at the port."),
    yurtdisi: false,
    durum: "onayli",
  },
  {
    id: "gr-izin-nour",
    kisiId: "mu9",
    tur: "izin",
    yer: y("Beyrut", "بيروت", "Beirut"),
    baslangic: gun(0),
    bitis: gun(2),
    aciklama: y("Sağlık izni.", "إجازة مرضية.", "Sick leave."),
    yurtdisi: false,
    durum: "suruyor",
  },
  {
    id: "gr-refah",
    kisiId: "mu12",
    tur: "gorevlendirme",
    yer: y("Refah sınır kapısı", "معبر رفح", "Rafah crossing"),
    baslangic: gun(1),
    bitis: gun(1),
    aciklama: y("Sabah canlı bağlantı ve saha çekimi.", "بث مباشر صباحي وتصوير ميداني.", "Morning live shot and field filming."),
    yurtdisi: false,
    durum: "onayli",
  },
  {
    id: "gr-doha",
    kisiId: "mu6",
    tur: "gorevlendirme",
    yer: y("Doha", "الدوحة", "Doha"),
    baslangic: gun(4),
    bitis: gun(7),
    aciklama: y("Körfez İşbirliği zirvesi.", "قمة مجلس التعاون الخليجي.", "Gulf Cooperation Council summit."),
    yurtdisi: true,
    durum: "talep",
  },
];

/* --- Canlı yayınlar --- */

const CANLILAR = (planId: (k: "dun" | "bugun" | "yarin") => string, gun: (n: number) => string): CanliYayin[] => [
  {
    id: "cy-gazze",
    planId: planId("bugun"),
    planBaslikId: "pb-b-filistin",
    konu: y("Gazze: Şifa Hastanesi önünden canlı", "غزة: بث مباشر من أمام مستشفى الشفاء", "Gaza: live from outside Al-Shifa Hospital"),
    aciklama: y("", "", ""),
    tarih: gun(0),
    saatGmt: "11:00",
    yer: y("Gazze", "غزة", "Gaza"),
    muhabirId: "mu1",
    notlar: y("Uydu hattı 10:45'te test edilecek.", "اختبار خط الأقمار الصناعية الساعة 10:45.", "Satellite line test at 10:45."),
  },
  {
    id: "cy-bm",
    planId: planId("bugun"),
    konu: y("BM Genel Kurulu oylaması", "تصويت الجمعية العامة للأمم المتحدة", "UN General Assembly vote"),
    aciklama: y("Oylama sonrası New York'tan değerlendirme.", "تحليل من نيويورك بعد التصويت.", "Analysis from New York after the vote."),
    tarih: gun(0),
    saatGmt: "15:00",
    yer: y("New York", "نيويورك", "New York"),
    muhabirId: "mu27",
    notlar: y("", "", ""),
  },
  {
    id: "cy-refah",
    planId: planId("yarin"),
    planBaslikId: "pb-y-ihlaller",
    konu: y("Refah sınır kapısından canlı", "بث مباشر من معبر رفح", "Live from the Rafah crossing"),
    aciklama: y("Bekleyen tırlar ve BM açıklaması.", "الشاحنات العالقة وتصريح الأمم المتحدة.", "The waiting trucks and the UN statement."),
    tarih: gun(1),
    saatGmt: "07:00",
    yer: y("Refah", "رفح", "Rafah"),
    muhabirId: "mu12",
    notlar: y("Mısır tarafından izin bekleniyor.", "بانتظار الإذن من الجانب المصري.", "Awaiting permission from the Egyptian side."),
  },
  {
    id: "cy-guvenlik",
    planId: planId("yarin"),
    konu: y("BM Güvenlik Konseyi: Sudan oturumu", "مجلس الأمن: جلسة بشأن السودان", "UN Security Council: Sudan session"),
    aciklama: y("Oturumun açılışı canlı verilecek.", "بث مباشر لافتتاح الجلسة.", "The opening of the session will be carried live."),
    tarih: gun(1),
    saatGmt: "14:00",
    yer: y("New York", "نيويورك", "New York"),
    muhabirId: "mu27",
    notlar: y("", "", ""),
  },
  {
    id: "cy-ankara",
    planId: planId("yarin"),
    konu: y("Dışişleri Bakanı'nın basın toplantısı", "المؤتمر الصحفي لوزير الخارجية التركي", "Turkish foreign minister's press conference"),
    aciklama: y("Körfez turu öncesi açıklama.", "تصريح قبل الجولة الخليجية.", "Statement ahead of the Gulf tour."),
    tarih: gun(1),
    saatGmt: "10:30",
    yer: y("Ankara", "أنقرة", "Ankara"),
    muhabirId: "mu7",
    notlar: y("Simultane tercüman: Rasha Hamdan.", "الترجمة الفورية: رشا حمدان.", "Simultaneous interpreter: Rasha Hamdan."),
  },
  {
    id: "cy-zirve",
    planId: planId("yarin"),
    konu: y("Körfez zirvesi açılışı", "افتتاح القمة الخليجية", "Gulf summit opening"),
    aciklama: y("", "", ""),
    tarih: gun(4),
    saatGmt: "09:00",
    yer: y("Doha", "الدوحة", "Doha"),
    muhabirId: "mu6",
    notlar: y("Zirve haftaya; yayın günü planına taşınacak.", "القمة الأسبوع المقبل؛ تُنقل إلى خطة يوم البث.", "The summit is next week; carry over to that day's plan."),
  },
];

/* --- Haftalık, aylık, özel --- */

type KalemSatiri = [number, Yazi, IcerikTuru, PlanKalemi["ulke"]?, boolean?];

const HAFTA_KALEMLERI: KalemSatiri[] = [
  [0, y("Gazze ateşkes görüşmeleri", "مفاوضات وقف إطلاق النار في غزة", "Gaza ceasefire talks"), "haber", "filistin", true],
  [0, y("Suriye'de seçim hazırlıkları", "التحضيرات الانتخابية في سوريا", "Syria election preparations"), "haber", "suriye", true],
  [0, y("Lübnan'da yeni hükümet", "الحكومة الجديدة في لبنان", "Lebanon's new government"), "haber", "lubnan"],
  [0, y("OPEC+ ve petrol fiyatları", "أوبك+ وأسعار النفط", "OPEC+ and oil prices"), "ekonomi", undefined, true],
  [0, y("Hafta sonu söyleşisi", "حوار نهاية الأسبوع", "Weekend interview"), "program"],
  [1, y("ABD-İran temasları", "الاتصالات الأمريكية الإيرانية", "US-Iran contacts"), "haber", "iran", true],
  [1, y("Ukrayna'da kış hazırlığı", "الاستعداد للشتاء في أوكرانيا", "Ukraine prepares for winter"), "haber", "ukrayna"],
  [1, y("Körfez borsaları haftalık", "بورصات الخليج الأسبوعية", "Gulf markets weekly"), "ekonomi", "katar"],
  [1, y("Belgesel: Kudüs'ün kapıları", "وثائقي: أبواب القدس", "Documentary: the gates of Jerusalem"), "program", "filistin"],
  [2, y("Gazze'de eğitim", "التعليم في غزة", "Education in Gaza"), "haber", "filistin", true],
  [2, y("Suriye-Türkiye sınır kapıları", "المعابر الحدودية السورية التركية", "Syria-Türkiye border crossings"), "haber", "turkiye"],
  [2, y("Türkiye enflasyon verisi", "بيانات التضخم في تركيا", "Türkiye inflation data"), "ekonomi", "turkiye", true],
  [2, y("Halep'in tarihi çarşıları", "أسواق حلب التاريخية", "Aleppo's historic souks"), "feature", "suriye"],
  [3, y("7 Ekim özel yayın hazırlığı", "التحضير لبث 7 أكتوبر الخاص", "7 October special broadcast prep"), "haber", "filistin", true],
  [3, y("Lübnan'da göç", "الهجرة في لبنان", "Migration in Lebanon"), "haber", "lubnan"],
  [3, y("Altın ve merkez bankaları", "الذهب والبنوك المركزية", "Gold and central banks"), "ekonomi"],
  [3, y("Ekonomi Masası", "طاولة الاقتصاد", "Economy Desk"), "program"],
  [4, y("7 Ekim özel yayını", "البث الخاص في 7 أكتوبر", "7 October special broadcast"), "haber", "filistin", true],
  [4, y("BM'de Filistin oturumu", "جلسة فلسطين في الأمم المتحدة", "UN session on Palestine"), "haber", "abd", true],
  [4, y("Gazzeli sanatçılar", "فنانون من غزة", "Artists from Gaza"), "feature", "filistin"],
  [5, y("ABD seçim kampanyası", "الحملة الانتخابية الأمريكية", "US election campaign"), "haber", "abd"],
  [5, y("Suriye ekonomisi", "الاقتصاد السوري", "Syria's economy"), "haber", "suriye"],
  [5, y("Körfez yatırımları", "الاستثمارات الخليجية", "Gulf investment"), "ekonomi", "katar"],
  [5, y("Haftalık değerlendirme", "التقييم الأسبوعي", "Weekly review"), "program"],
  [6, y("Gazze: cuma gündemi", "غزة: أجندة الجمعة", "Gaza: Friday agenda"), "haber", "filistin"],
  [6, y("Lübnan sınırı", "الحدود اللبنانية", "The Lebanese border"), "haber", "lubnan"],
  [6, y("Türk dış politikası", "السياسة الخارجية التركية", "Turkish foreign policy"), "haber", "turkiye"],
  [6, y("İstanbul'da Arap öğrenciler", "الطلاب العرب في إسطنبول", "Arab students in Istanbul"), "feature", "turkiye"],
];

const AY_KALEMLERI: [Yazi, IcerikTuru, boolean][] = [
  [y("Filistin dosyası: bir yıl sonra", "ملف فلسطين: بعد عام", "The Palestine file: one year on"), "haber", true],
  [y("ABD ara seçimleri hazırlığı", "التحضير للانتخابات النصفية الأمريكية", "US midterms preparation"), "haber", true],
  [y("Sudan'da insani durum", "الوضع الإنساني في السودان", "Humanitarian situation in Sudan"), "haber", false],
  [y("İklim zirvesi öncesi Arap dünyası", "العالم العربي قبيل قمة المناخ", "The Arab world ahead of the climate summit"), "feature", false],
  [y("Körfez-Türkiye ticareti", "التجارة بين الخليج وتركيا", "Gulf-Türkiye trade"), "ekonomi", true],
  [y("Yeni sezon program tanıtımları", "الترويج لبرامج الموسم الجديد", "New season programme promos"), "program", false],
];

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
  planlama: "pl4",
  program: "pr2",
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

  const planlar: NextDayPlan[] = (["yarin", "bugun", "dun"] as const).map((k) => ({
    id: planId(k),
    tarih: planTarihi[k],
    durum: planDurumu[k],
    ekip: PLAN_ICERIGI[k].ekip,
    gorevlendirmeler: PLAN_ICERIGI[k].gorevlendirmeler,
    hazirPaketler: PLAN_ICERIGI[k].hazir,
    basliklar: PLAN_ICERIGI[k].basliklar.map(([id, baslikId, muhabirler]) => ({
      id,
      baslikId,
      muhabirler: muhabirler.map((m) => {
        const [kisiId, saat] = m.split("@");
        return saat ? { kisiId, saat } : { kisiId };
      }),
    })),
    kopyaKaynagi: k === "yarin" ? planId("bugun") : undefined,
    olusturan: "pl2",
    olusturma: k === "yarin" ? bugunSaat("08:50") : zaman(gunEkle(planTarihi[k], -1), "08:50"),
  }));

  /* Önerinin gönderildiği gün, karar verdiği planın bir gün öncesi. */
  const oneriler: Oneri[] = ONERILER.map((o) => {
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
      sahaGerekli: !!o.saha,
      zaman: o.gun === "dun" ? zaman(gun(-1), o.saat) : bugunSaat(o.saat, 30),
      kanal: o.kanal ?? "sistem",
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
      teslim: t.teslimDk !== undefined ? new Date(an + t.teslimDk * DAKIKA).toISOString() : undefined,
      yayin: t.saat ? zaman(tarih, t.saat) : undefined,
      durum: t.durum,
      slug: t.slug,
      adim: t.durum === "uretimde" ? t.adim : undefined,
      sahaGerekli: !!t.saha,
      oneriId: t.oneriId,
      metin: geçilen.includes("metin") ? t.metin ?? `${typeof t.baslik === "string" ? t.baslik : t.baslik.ar}.\n${typeof t.aciklama === "string" ? t.aciklama : t.aciklama.ar}` : undefined,
      video: geçilen.includes("video") ? `https://video.ornek.local/${kod}` : undefined,
      klipKodu: geçilen.includes("media") ? klip(tarih, 40 + i) : undefined,
      ucret: t.ucret,
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
      h("pl4", "paketOnaylandi", zaman(gun(-3), "11:00"), { paketId: p.id, veri: { toplanti: "1" } });
    }

    /* Üretim adımları. */
    if (t.durum === "uretimde" || bitti) {
      const devir = plan?.id === planId("dun") ? devirDun : plan ? devirBugun : zaman(gun(-2), "10:00");
      const ilk = yol[0];
      h(plan ? "nd1" : ADIM_KISISI[adimSahibi("newsdesk", tur)], "planDevralindi", devir, {
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
        h(kisi, ADIM_HAREKETI[a], zamanlar[j], { paketId: p.id, planId: plan?.id, veri });
      });
      const sonZaman = zamanlar[zamanlar.length - 1];
      if (sonZaman) p.guncelleme = sonZaman;
    }
    return p;
  });

  /* Gazze paketine iki koordinasyon notu: kayıt üzerinden yazışmanın örneği. */
  const gazze = paketler.find((p) => p.id === "p-gazze");
  if (gazze) {
    gazze.notlar = [
      { id: "n1", kisiId: "nd3", zaman: bugunSaat("10:05", 200), metin: "Şifa Hastanesi başhekimiyle röportaj teyit edildi mi?" },
      { id: "n2", kisiId: "mu1", zaman: bugunSaat("10:20", 190), metin: "Teyit edildi; 11:00 canlı bağlantıdan sonra çekiyoruz." },
    ];
  }

  const gelismeler: Gelisme[] = (["dun", "bugun", "yarin"] as const).flatMap((k) =>
    GELISMELER[k].map(([pb, yer, metin, kaynakTuru, kaynakAdi, onerenId], i) => ({
      id: `g-${k}-${i}`,
      planId: planId(k),
      planBaslikId: pb || undefined,
      yer,
      metin,
      kaynakTuru,
      kaynakAdi,
      tarih: k === "yarin" ? bugunSaat("12:00", 20) : zaman(gunEkle(planTarihi[k], -1), "12:00"),
      onerenId,
    })),
  );
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
  const toplantilar: Toplanti[] = [
    { id: "t1", ad: y("Muhabir önerilerini değerlendirme", "تقييم مقترحات المراسلين", "Reviewing reporter proposals"), aciklama: y("Planlama ekibi", "فريق التخطيط", "Planning team"), zaman: zaman(B, "10:00"), birim: "planlama" },
    { id: "t2", ad: y("Ajans gündemi analizi", "تحليل أجندة الوكالات", "Wire agenda review"), aciklama: y("Planlama ekibi", "فريق التخطيط", "Planning team"), zaman: zaman(B, "13:00"), birim: "planlama" },
    { id: "t3", ad: y("Next Day hazırlık toplantısı", "اجتماع التحضير لخطة الغد", "Next Day prep meeting"), aciklama: y("Planlama ve Newsdesk", "التخطيط وغرفة الأخبار", "Planning and Newsdesk"), zaman: zaman(B, "15:30"), birim: "planlama" },
    { id: "t4", ad: y("Haber toplantısı", "اجتماع الأخبار", "News meeting"), aciklama: y("Next Day plan sunumu", "عرض خطة الغد", "Next Day plan presentation"), zaman: zaman(B, "17:00"), birim: "planlama", onemli: true },
    { id: "t5", ad: y("Muhabirlere geri dönüş", "الرد على المراسلين", "Feedback to reporters"), aciklama: y("Kabul ve ret bildirimleri", "إشعارات القبول والرفض", "Acceptance and rejection notices"), zaman: zaman(B, "19:00"), birim: "planlama" },
    { id: "t6", ad: y("Sabah haber toplantısı", "اجتماع الأخبار الصباحي", "Morning news meeting"), aciklama: y("Newsdesk planı günceller ve görevleri dağıtır", "غرفة الأخبار تحدّث الخطة وتوزع المهام", "Newsdesk updates the plan and assigns tasks"), zaman: zaman(gun(1), "09:30"), birim: "newsdesk" },
    { id: "t7", ad: y("Özel yayın planlama toplantısı", "اجتماع تخطيط البث الخاص", "Special broadcast planning"), aciklama: y("7 Ekim özel yayını", "بث 7 أكتوبر الخاص", "7 October special"), zaman: zaman(gun(1), "11:00"), birim: "planlama" },
    { id: "t8", ad: y("Haftalık haber toplantısı", "الاجتماع الأسبوعي للأخبار", "Weekly news meeting"), aciklama: y("Haftalık plan sunumu ve kararlar", "عرض الخطة الأسبوعية والقرارات", "Weekly plan presentation and decisions"), zaman: zaman(gunEkle(haftaBasi(B), new Date(B + "T12:00:00").getDay() > 4 ? 12 : 5), "11:00"), birim: "planlama", onemli: true },
    { id: "t9", ad: y("Aylık plan değerlendirme", "تقييم الخطة الشهرية", "Monthly plan review"), aciklama: y("Ayın 25'ine kadar", "حتى 25 من الشهر", "Due by the 25th"), zaman: zaman(gun(2), "14:00"), birim: "planlama" },
  ];

  const yil = B.slice(0, 4);
  const sirala = (a: Hareket, b: Hareket) => b.zaman.localeCompare(a.zaman);

  return {
    surum: 2,
    kisiler: kisiler(),
    basliklar: BASLIKLAR,
    planlar,
    gelismeler,
    canliYayinlar: CANLILAR(planId, gun),
    hazirPaketler: HAZIR(gun),
    gorevlendirmeler: GOREVLENDIRMELER(gun),
    oneriler,
    cagrilar: [
      { id: "c-dun", tarih: gun(0), dil: "ar", metin: "", sonSaat: "15:00", olusturan: "pl2", zaman: zaman(gun(-1), "09:10") },
      { id: "c-bugun", tarih: gun(1), dil: "ar", metin: "", sonSaat: "15:00", olusturan: "pl2", zaman: bugunSaat("09:15", 60) },
    ],
    paketler,
    haftalik: [
      {
        id: "hf-gelecek",
        baslangic: haftaBas,
        durum: "toplantida",
        kalemler: HAFTA_KALEMLERI.map(([g, baslik, tur, ulke, onayli], i) => ({ id: `hk${i}`, tarih: gunEkle(haftaBas, g), baslik, tur, ulke, onayli: !!onayli })),
      },
    ],
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
        ad: y("7 Ekim özel yayını", "البث الخاص في 7 أكتوبر", "7 October special broadcast"),
        tarih: `${yil}-10-07`,
        hazirlik: [
          { id: "oz1", metin: y("Yayın akışı taslağı", "مسودة جدول البث", "Running order draft"), tamam: true },
          { id: "oz2", metin: y("Gazze'den üç canlı bağlantı", "ثلاث وصلات مباشرة من غزة", "Three live shots from Gaza"), tamam: true },
          { id: "oz3", metin: y("Stüdyo konukları", "ضيوف الاستوديو", "Studio guests"), tamam: true },
          { id: "oz4", metin: y("Arşiv görüntüleri seçimi", "اختيار المواد الأرشيفية", "Archive footage selection"), tamam: false },
          { id: "oz5", metin: y("Grafik ve harita paketi", "حزمة الرسومات والخرائط", "Graphics and maps package"), tamam: false },
          { id: "oz6", metin: y("Sosyal medya fragmanları", "مقاطع ترويجية لوسائل التواصل", "Social media trailers"), tamam: false },
        ],
      },
      {
        id: "oz-abd",
        ad: y("ABD ara seçimleri", "الانتخابات النصفية الأمريكية", "US midterm elections"),
        tarih: `${yil}-11-03`,
        hazirlik: [
          { id: "ab1", metin: y("Washington görevlendirmesi", "مهمة واشنطن", "Washington assignment"), tamam: true },
          { id: "ab2", metin: y("Seçim gecesi yayın planı", "خطة بث ليلة الانتخابات", "Election night broadcast plan"), tamam: true },
          { id: "ab3", metin: y("Uzman konuk listesi", "قائمة الضيوف الخبراء", "Expert guest list"), tamam: false },
          { id: "ab4", metin: y("Eyalet eyalet grafikler", "رسومات الولايات", "State-by-state graphics"), tamam: false },
          { id: "ab5", metin: y("Arap-Amerikan seçmen dosyası", "ملف الناخبين العرب الأمريكيين", "Arab-American voters file"), tamam: false },
        ],
      },
    ],
    toplantilar,
    dosyalar: [
      { id: "d1", ad: y("Haftalık plan şablonu", "قالب الخطة الأسبوعية", "Weekly plan template"), tur: "docx", guncelleme: gun(-6) },
      { id: "d2", ad: y("Aylık plan şablonu", "قالب الخطة الشهرية", "Monthly plan template"), tur: "xlsx", guncelleme: gun(-11) },
      { id: "d3", ad: y("Özel yayın rehberi", "دليل البث الخاص", "Special broadcast guide"), tur: "pdf", guncelleme: gun(-16) },
      { id: "d4", ad: y("Muhabir iletişim listesi", "قائمة الاتصال بالمراسلين", "Reporter contact list"), tur: "xlsx", guncelleme: gun(-21) },
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

