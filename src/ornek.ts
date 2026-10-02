import { adimSahibi, uretimYolu, type UretimAdimi } from "./akis";
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
    ad: { tr, ar, en: tr },
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
  { id: "b-yemen", ad: "الصراع في اليمن", ulke: "yemen", aktif: false },
];

/* --- Hazır paket arşivi --- */

const HAZIR = (gun: (n: number) => string): HazirPaket[] => [
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

/* [plan başlığı ya da "" (takip), yer, metin, kaynak türü, kaynak adı, öneren] */
type GelismeTanimi = [string, string | undefined, string, Gelisme["kaynakTuru"], string, string?];

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
    ["", "واشنطن", "مجلس الشيوخ الأمريكي يعقد جلسته الأخيرة قبل الانتخابات النصفية.", "medya", "AP"],
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
    yurtdisi: true,
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
    yurtdisi: false,
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
    yurtdisi: true,
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
    yurtdisi: false,
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
    yurtdisi: false,
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
    yurtdisi: false,
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
  },
];

/* --- Haftalık, aylık, özel --- */

type KalemSatiri = [number, string, IcerikTuru, PlanKalemi["ulke"]?, boolean?];

const HAFTA_KALEMLERI: KalemSatiri[] = [
  [0, "مفاوضات وقف إطلاق النار في غزة", "haber", "filistin", true],
  [0, "التحضيرات الانتخابية في سوريا", "haber", "suriye", true],
  [0, "الحكومة الجديدة في لبنان", "haber", "lubnan"],
  [0, "OPEC+ وأسعار النفط", "ekonomi", undefined, true],
  [0, "حوار نهاية الأسبوع", "program"],
  [1, "الاتصالات الأمريكية الإيرانية", "haber", "iran", true],
  [1, "الاستعداد للشتاء في أوكرانيا", "haber", "ukrayna"],
  [1, "بورصات الخليج الأسبوعية", "ekonomi", "katar"],
  [1, "وثائقي: أبواب القدس", "program", "filistin"],
  [2, "التعليم في غزة", "haber", "filistin", true],
  [2, "المعابر الحدودية السورية التركية", "haber", "turkiye"],
  [2, "بيانات التضخم في تركيا", "ekonomi", "turkiye", true],
  [2, "أسواق حلب التاريخية", "feature", "suriye"],
  [3, "التحضير لبث 7 أكتوبر الخاص", "haber", "filistin", true],
  [3, "الهجرة في لبنان", "haber", "lubnan"],
  [3, "الذهب والبنوك المركزية", "ekonomi"],
  [3, "طاولة الاقتصاد", "program"],
  [4, "البث الخاص في 7 أكتوبر", "haber", "filistin", true],
  [4, "جلسة فلسطين في الأمم المتحدة", "haber", "abd", true],
  [4, "فنانون من غزة", "feature", "filistin"],
  [5, "الحملة الانتخابية الأمريكية", "haber", "abd"],
  [5, "الاقتصاد السوري", "haber", "suriye"],
  [5, "الاستثمارات الخليجية", "ekonomi", "katar"],
  [5, "التقييم الأسبوعي", "program"],
  [6, "غزة: أجندة الجمعة", "haber", "filistin"],
  [6, "الحدود اللبنانية", "haber", "lubnan"],
  [6, "السياسة الخارجية التركية", "haber", "turkiye"],
  [6, "الطلاب العرب في إسطنبول", "feature", "turkiye"],
];

const AY_KALEMLERI: [string, IcerikTuru, boolean][] = [
  ["ملف فلسطين: بعد عام", "haber", true],
  ["التحضير للانتخابات النصفية الأمريكية", "haber", true],
  ["الوضع الإنساني في السودان", "haber", false],
  ["العالم العربي قبيل قمة المناخ", "feature", false],
  ["التجارة بين الخليج وتركيا", "ekonomi", true],
  ["الترويج لبرامج الموسم الجديد", "program", false],
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
      metin: geçilen.includes("metin") ? t.metin ?? `${t.baslik}.\n${t.aciklama}` : undefined,
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
    { id: "t1", ad: "تقييم مقترحات المراسلين", aciklama: "فريق التخطيط", zaman: zaman(B, "10:00"), birim: "planlama" },
    { id: "t2", ad: "تحليل أجندة الوكالات", aciklama: "فريق التخطيط", zaman: zaman(B, "13:00"), birim: "planlama" },
    { id: "t3", ad: "اجتماع التحضير لخطة الغد", aciklama: "التخطيط وغرفة الأخبار", zaman: zaman(B, "15:30"), birim: "planlama" },
    { id: "t4", ad: "اجتماع الأخبار", aciklama: "عرض خطة الغد", zaman: zaman(B, "17:00"), birim: "planlama", onemli: true },
    { id: "t5", ad: "الرد على المراسلين", aciklama: "إشعارات القبول والرفض", zaman: zaman(B, "19:00"), birim: "planlama" },
    { id: "t6", ad: "اجتماع الأخبار الصباحي", aciklama: "غرفة الأخبار تحدّث الخطة وتوزع المهام", zaman: zaman(gun(1), "09:30"), birim: "newsdesk" },
    { id: "t7", ad: "اجتماع تخطيط البث الخاص", aciklama: "بث 7 أكتوبر الخاص", zaman: zaman(gun(1), "11:00"), birim: "planlama" },
    { id: "t8", ad: "الاجتماع الأسبوعي للأخبار", aciklama: "عرض الخطة الأسبوعية والقرارات", zaman: zaman(gunEkle(haftaBasi(B), new Date(B + "T12:00:00").getDay() > 4 ? 12 : 5), "11:00"), birim: "planlama", onemli: true },
    { id: "t9", ad: "تقييم الخطة الشهرية", aciklama: "حتى 25 من الشهر", zaman: zaman(gun(2), "14:00"), birim: "planlama" },
  ];

  const yil = B.slice(0, 4);
  const sirala = (a: Hareket, b: Hareket) => b.zaman.localeCompare(a.zaman);

  return {
    surum: 3,
    kisiler: kisiler(),
    basliklar: BASLIKLAR,
    planlar,
    gelismeler,
    canliYayinlar: CANLILAR(planId, gun),
    hazirPaketler: HAZIR(gun),
    gorevlendirmeler: GOREVLENDIRMELER(gun),
    oneriler,
    cagrilar: [
      { id: "c-dun", tarih: gun(0), metin: "", sonSaat: "15:00", olusturan: "pl2", zaman: zaman(gun(-1), "09:10") },
      { id: "c-bugun", tarih: gun(1), metin: "", sonSaat: "15:00", olusturan: "pl2", zaman: bugunSaat("09:15", 60) },
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

