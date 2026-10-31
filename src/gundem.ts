import type { Anahtar } from "./dil";
import { sehirUlkesi } from "./etiketler";
import { gunEkle } from "./tarih";
import { yaklasanlar } from "./takvim";
import type { Durum, GundemKaynagi, Kisi, Ulke } from "./veri";

/*
 * Gündem takibi: haber akışlarından (RSS, kapının /rss ucu) gelen haberleri
 * kurallarla konu klasörlerine ayırır, aynı olayı veren haberleri tek olayda
 * toplar, konuların önceliğini ve sabah brifingini çıkarır. Yapay zeka yok:
 * her tarama ücretsiz, sonuç her açılışta aynı kuraldan. Saf; ekran
 * `ekranlar/Gundem.tsx`.
 *
 * Öncelik haber sayısından çıkmıyor: aynı olayı on ayrı haberle veren tek
 * kaynak bir olay sayılıyor. Ağırlık olayı kaç farklı kaynağın verdiğinden,
 * olayın ağır sözcüklerinden (çatışma, saldırı, ateşkes, Güvenlik Konseyi)
 * ve ana izleme bölgesinden geliyor.
 */

/* --- Sekmeler ve konular --- */

export const GUNDEM_BOLUMLERI = [
  "brifing",
  "ortadogu",
  "boynuz",
  "turkiye",
  "rusya",
  "abd",
  "kuruluslar",
  "capraz",
  "yeni",
  "etkinlikler",
  "firsatlar",
  "arsiv",
] as const;
export type GundemBolumu = (typeof GUNDEM_BOLUMLERI)[number];

export interface AltKonu {
  id: string;
  ad: Anahtar;
  sozcukler: string[];
}

export interface Konu {
  id: string;
  bolum: GundemBolumu;
  ad: Anahtar;
  /** Muhabir eşlemesi ve öneriye çevirmede ülke. */
  ulkeler: Ulke[];
  /** Orta Doğu ve çatışma coğrafyası: ağırlığa katkı. */
  ana?: boolean;
  sozcukler: string[];
  /**
   * Doluysa haber bunlardan birini de içermeli: Türkiye ve ABD'de yalnız
   * dış politikası ve bölgeye etkisi olan haber; iç gündem klasörü doldurmasın.
   */
  sart?: string[];
  alt?: AltKonu[];
}

/* Arapça sözcükler normalleştirilmiş yazımla da eşleşir (normal → elif, te merbuta, elif maksure). */
export const KONULAR: Konu[] = [
  {
    id: "filistin",
    bolum: "ortadogu",
    ad: "gkFilistin",
    ulkeler: ["filistin"],
    ana: true,
    sozcukler: [
      "gaza",
      "west bank",
      "hamas",
      "israel",
      "israeli",
      "palestin",
      "netanyahu",
      "idf",
      "jenin",
      "rafah",
      "khan younis",
      "غزة",
      "الضفة",
      "حماس",
      "اسرائيل",
      "الاحتلال",
      "فلسطين",
      "نتنياهو",
      "جنين",
      "رفح",
      "خان يونس",
      "القدس",
    ],
  },
  {
    id: "suriye",
    bolum: "ortadogu",
    ad: "gkSuriye",
    ulkeler: ["suriye"],
    ana: true,
    sozcukler: [
      "syria",
      "syrian",
      "damascus",
      "aleppo",
      "idlib",
      "sdf",
      "hts",
      "sweida",
      "سوريا",
      "سورية",
      "دمشق",
      "حلب",
      "ادلب",
      "قسد",
      "السويداء",
    ],
  },
  {
    id: "irak",
    bolum: "ortadogu",
    ad: "gkIrak",
    ulkeler: ["irak"],
    ana: true,
    sozcukler: [
      "iraq",
      "iraqi",
      "baghdad",
      "erbil",
      "kurdistan region",
      "mosul",
      "pmf",
      "العراق",
      "بغداد",
      "اربيل",
      "الموصل",
      "الحشد الشعبي",
    ],
  },
  {
    id: "lubnan",
    bolum: "ortadogu",
    ad: "gkLubnan",
    ulkeler: ["lubnan"],
    ana: true,
    sozcukler: [
      "lebanon",
      "lebanese",
      "beirut",
      "hezbollah",
      "litani",
      "unifil",
      "لبنان",
      "بيروت",
      "حزب الله",
      "الليطاني",
      "اليونيفيل",
    ],
  },
  {
    id: "yemen",
    bolum: "ortadogu",
    ad: "gkYemen",
    ulkeler: ["yemen"],
    ana: true,
    sozcukler: [
      "yemen",
      "houthi",
      "sanaa",
      "aden",
      "hodeidah",
      "red sea",
      "bab al-mandab",
      "اليمن",
      "الحوثي",
      "صنعاء",
      "عدن",
      "الحديدة",
      "البحر الاحمر",
      "باب المندب",
    ],
  },
  {
    id: "iran",
    bolum: "ortadogu",
    ad: "gkIran",
    ulkeler: ["iran"],
    ana: true,
    sozcukler: [
      "iran",
      "iranian",
      "tehran",
      "khamenei",
      "irgc",
      "nuclear deal",
      "araghchi",
      "pezeshkian",
      "ايران",
      "طهران",
      "خامنئي",
      "الحرس الثوري",
      "النووي",
    ],
  },
  {
    id: "sudan",
    bolum: "ortadogu",
    ad: "gkSudan",
    ulkeler: ["sudan"],
    ana: true,
    sozcukler: [
      "sudan",
      "khartoum",
      "darfur",
      "el fasher",
      "rsf",
      "rapid support",
      "burhan",
      "dagalo",
      "hemedti",
      "kordofan",
      "السودان",
      "الخرطوم",
      "دارفور",
      "الفاشر",
      "الدعم السريع",
      "البرهان",
      "حميدتي",
      "كردفان",
    ],
  },
  {
    id: "libya",
    bolum: "ortadogu",
    ad: "gkLibya",
    ulkeler: ["libya"],
    ana: true,
    sozcukler: [
      "libya",
      "libyan",
      "tripoli",
      "benghazi",
      "haftar",
      "dbeibah",
      "ليبيا",
      "طرابلس",
      "بنغازي",
      "حفتر",
      "الدبيبة",
    ],
  },
  {
    id: "misir",
    bolum: "ortadogu",
    ad: "gkMisir",
    ulkeler: ["misir"],
    ana: true,
    sozcukler: [
      "egypt",
      "egyptian",
      "cairo",
      "sisi",
      "suez",
      "مصر",
      "القاهرة",
      "السيسي",
      "السويس",
    ],
  },
  {
    id: "korfez",
    bolum: "ortadogu",
    ad: "gkKorfez",
    ulkeler: ["suudi", "bae", "katar", "bahreyn", "kuveyt", "umman", "urdun"],
    ana: true,
    sozcukler: [
      "saudi",
      "riyadh",
      "emirates",
      "uae",
      "abu dhabi",
      "qatar",
      "doha",
      "bahrain",
      "kuwait",
      "oman",
      "muscat",
      "jordan",
      "amman",
      "gcc",
      "السعودية",
      "الرياض",
      "الامارات",
      "ابوظبي",
      "قطر",
      "الدوحة",
      "البحرين",
      "الكويت",
      "عمان",
      "مسقط",
      "الاردن",
      "الخليج",
    ],
  },
  {
    id: "etiyopya",
    bolum: "boynuz",
    ad: "gkEtiyopya",
    ulkeler: ["etiyopya"],
    ana: true,
    sozcukler: [
      "ethiopia",
      "ethiopian",
      "addis ababa",
      "abiy",
      "tigray",
      "tplf",
      "amhara",
      "fano",
      "oromia",
      "oromo",
      "afar",
      "gerd",
      "renaissance dam",
      "assab",
      "اثيوبيا",
      "اديس ابابا",
      "ابي احمد",
      "تيغراي",
      "امهرة",
      "فانو",
      "اوروميا",
      "عفار",
      "سد النهضة",
      "عصب",
    ],
    alt: [
      {
        id: "tigray",
        ad: "gaTigray",
        sozcukler: [
          "tigray",
          "tplf",
          "tigray defense forces",
          "tdf",
          "mekelle",
          "تيغراي",
          "جبهة تحرير تيغراي",
          "ميكيلي",
        ],
      },
      {
        id: "amhara",
        ad: "gaAmhara",
        sozcukler: [
          "amhara",
          "fano",
          "gondar",
          "bahir dar",
          "امهرة",
          "فانو",
          "غوندار",
        ],
      },
      {
        id: "oromia",
        ad: "gaOromia",
        sozcukler: [
          "oromia",
          "oromo liberation army",
          "ola",
          "oromo",
          "اوروميا",
          "جيش تحرير اورومو",
        ],
      },
      { id: "afar", ad: "gaAfar", sozcukler: ["afar", "عفار"] },
      {
        id: "federal",
        ad: "gaFederal",
        sozcukler: [
          "abiy",
          "addis ababa",
          "ethiopian army",
          "endf",
          "federal government",
          "ابي احمد",
          "اديس ابابا",
          "الجيش الاثيوبي",
          "الحكومة الفيدرالية",
        ],
      },
      {
        id: "eritre",
        ad: "gaEritre",
        sozcukler: [
          "eritrea",
          "asmara",
          "isaias",
          "اريتريا",
          "اسمرة",
          "افورقي",
        ],
      },
      {
        id: "somali",
        ad: "gaSomali",
        sozcukler: [
          "somalia",
          "somaliland",
          "mogadishu",
          "الصومال",
          "ارض الصومال",
          "مقديشو",
        ],
      },
      {
        id: "sudanSinir",
        ad: "gaSudanSinir",
        sozcukler: [
          "al-fashaga",
          "fashaga",
          "sudan border",
          "الفشقة",
          "الحدود السودانية",
        ],
      },
      {
        id: "gerd",
        ad: "gaGerd",
        sozcukler: ["gerd", "renaissance dam", "nile", "سد النهضة", "النيل"],
      },
      {
        id: "misir",
        ad: "gaMisir",
        sozcukler: ["egypt", "cairo", "مصر", "القاهرة"],
      },
      {
        id: "kizildeniz",
        ad: "gaKizildeniz",
        sozcukler: [
          "red sea",
          "assab",
          "sea access",
          "port of",
          "البحر الاحمر",
          "عصب",
          "منفذ بحري",
        ],
      },
    ],
  },
  {
    id: "eritre",
    bolum: "boynuz",
    ad: "gkEritre",
    ulkeler: [],
    ana: true,
    sozcukler: [
      "eritrea",
      "eritrean",
      "asmara",
      "isaias afwerki",
      "اريتريا",
      "اسمرة",
      "افورقي",
    ],
  },
  {
    id: "somali",
    bolum: "boynuz",
    ad: "gkSomali",
    ulkeler: ["somali"],
    ana: true,
    sozcukler: [
      "somalia",
      "somali",
      "somaliland",
      "mogadishu",
      "al-shabaab",
      "puntland",
      "الصومال",
      "ارض الصومال",
      "مقديشو",
      "الشباب",
      "بونتلاند",
    ],
  },
  {
    id: "guneySudan",
    bolum: "boynuz",
    ad: "gkGuneySudan",
    ulkeler: [],
    ana: true,
    sozcukler: [
      "south sudan",
      "juba",
      "kiir",
      "machar",
      "جنوب السودان",
      "جوبا",
      "سلفاكير",
      "مشار",
    ],
  },
  {
    id: "turkiye",
    bolum: "turkiye",
    ad: "gkTurkiye",
    ulkeler: ["turkiye"],
    sozcukler: [
      "turkey",
      "turkiye",
      "türkiye",
      "turkish",
      "ankara",
      "erdogan",
      "erdoğan",
      "fidan",
      "تركيا",
      "التركي",
      "انقرة",
      "اردوغان",
      "فيدان",
    ],
    sart: [
      "foreign",
      "nato",
      "syria",
      "iraq",
      "russia",
      "ukraine",
      "eu ",
      "european",
      "washington",
      "united states",
      "us ",
      "defense",
      "drone",
      "pipeline",
      "corridor",
      "energy",
      "migra",
      "refugee",
      "summit",
      "diplomat",
      "mediat",
      "gaza",
      "israel",
      "iran",
      "libya",
      "sudan",
      "somalia",
      "خارجي",
      "الناتو",
      "سوريا",
      "العراق",
      "روسيا",
      "اوكرانيا",
      "الاتحاد الاوروبي",
      "واشنطن",
      "الدفاع",
      "المسيرات",
      "الطاقة",
      "اللاجئين",
      "قمة",
      "وساطة",
      "غزة",
      "اسرائيل",
      "ايران",
      "ليبيا",
      "الصومال",
    ],
  },
  {
    id: "rusyaUkrayna",
    bolum: "rusya",
    ad: "gkRusyaUkrayna",
    ulkeler: ["ukrayna", "rusya"],
    sozcukler: [
      "ukraine",
      "ukrainian",
      "kyiv",
      "kiev",
      "zelensky",
      "kremlin",
      "putin",
      "donbas",
      "crimea",
      "black sea",
      "sanction",
      "اوكرانيا",
      "كييف",
      "زيلينسكي",
      "الكرملين",
      "بوتين",
      "القرم",
      "البحر الاسود",
      "العقوبات",
    ],
  },
  {
    id: "abd",
    bolum: "abd",
    ad: "gkAbd",
    ulkeler: ["abd"],
    sozcukler: [
      "white house",
      "congress",
      "senate",
      "midterm",
      "republican",
      "democrat",
      "pentagon",
      "state department",
      "trump",
      "rubio",
      "البيت الابيض",
      "الكونغرس",
      "مجلس الشيوخ",
      "الانتخابات النصفية",
      "الجمهوري",
      "الديمقراطي",
      "البنتاغون",
      "الخارجية الامريكية",
      "ترامب",
      "روبيو",
    ],
    sart: [
      "foreign",
      "middle east",
      "israel",
      "gaza",
      "palestin",
      "iran",
      "turkey",
      "turkiye",
      "ukraine",
      "russia",
      "syria",
      "iraq",
      "yemen",
      "sudan",
      "sanction",
      "troops",
      "arms",
      "aid",
      "midterm",
      "congress",
      "senate",
      "الشرق الاوسط",
      "اسرائيل",
      "غزة",
      "فلسطين",
      "ايران",
      "تركيا",
      "اوكرانيا",
      "روسيا",
      "سوريا",
      "العراق",
      "اليمن",
      "السودان",
      "العقوبات",
      "الكونغرس",
    ],
  },
  {
    id: "kuruluslar",
    bolum: "kuruluslar",
    ad: "gkKuruluslar",
    ulkeler: [],
    sozcukler: [
      "united nations",
      "security council",
      "general assembly",
      "guterres",
      "nato",
      "european union",
      "g20",
      "arab league",
      "organization of islamic cooperation",
      "oic",
      "african union",
      "icj",
      "international court of justice",
      "icc",
      "international criminal court",
      "الامم المتحدة",
      "مجلس الامن",
      "الجمعية العامة",
      "غوتيريش",
      "حلف الناتو",
      "الاتحاد الاوروبي",
      "مجموعة العشرين",
      "الجامعة العربية",
      "منظمة التعاون الاسلامي",
      "الاتحاد الافريقي",
      "محكمة العدل الدولية",
      "المحكمة الجنائية الدولية",
    ],
    alt: [
      {
        id: "bm",
        ad: "gaBm",
        sozcukler: [
          "united nations",
          "security council",
          "general assembly",
          "guterres",
          "un ",
          "الامم المتحدة",
          "مجلس الامن",
          "غوتيريش",
        ],
      },
      {
        id: "nato",
        ad: "gaNato",
        sozcukler: ["nato", "الناتو", "حلف شمال الاطلسي"],
      },
      {
        id: "ab",
        ad: "gaAb",
        sozcukler: ["european union", "brussels", "الاتحاد الاوروبي", "بروكسل"],
      },
      {
        id: "arap",
        ad: "gaArapBirligi",
        sozcukler: ["arab league", "الجامعة العربية"],
      },
      {
        id: "iit",
        ad: "gaIit",
        sozcukler: [
          "organization of islamic cooperation",
          "oic",
          "منظمة التعاون الاسلامي",
        ],
      },
      {
        id: "au",
        ad: "gaAfrikaBirligi",
        sozcukler: ["african union", "الاتحاد الافريقي"],
      },
      {
        id: "hukuk",
        ad: "gaHukuk",
        sozcukler: [
          "icj",
          "icc",
          "international court",
          "criminal court",
          "arrest warrant",
          "genocide",
          "محكمة العدل",
          "الجنائية الدولية",
          "مذكرة اعتقال",
          "الابادة",
        ],
      },
      { id: "g20", ad: "gaG20", sozcukler: ["g20", "مجموعة العشرين"] },
    ],
  },
];

export const konuBul = (id: string) => KONULAR.find((k) => k.id === id);

/*
 * Bölgeler arası bağlar: olay bu konulardan en az ikisine düşüyorsa
 * "Bölgeler arası"nda da görünür. Olay tek kayıt; iki klasörde de aynısı.
 */
export interface Bag {
  id: string;
  ad: Anahtar;
  konular: string[];
}
export const BAGLAR: Bag[] = [
  {
    id: "sudanEtiyopyaMisir",
    ad: "gbSudanEtiyopyaMisir",
    konular: ["sudan", "etiyopya", "misir"],
  },
  {
    id: "etiyopyaEritreSomali",
    ad: "gbEtiyopyaEritreSomali",
    konular: ["etiyopya", "eritre", "somali"],
  },
  {
    id: "gazzeMisirIsrail",
    ad: "gbGazzeMisir",
    konular: ["filistin", "misir"],
  },
  {
    id: "iranEkseni",
    ad: "gbIranEkseni",
    konular: ["iran", "lubnan", "yemen", "irak"],
  },
  {
    id: "turkiyeSuriyeIrak",
    ad: "gbTurkiyeSuriyeIrak",
    konular: ["turkiye", "suriye", "irak"],
  },
  { id: "rusyaIran", ad: "gbRusyaIran", konular: ["rusyaUkrayna", "iran"] },
  {
    id: "abdOrtadogu",
    ad: "gbAbdOrtadogu",
    konular: [
      "abd",
      "filistin",
      "iran",
      "suriye",
      "irak",
      "lubnan",
      "yemen",
      "turkiye",
    ],
  },
  {
    id: "kizildeniz",
    ad: "gbKizildeniz",
    konular: ["yemen", "etiyopya", "eritre", "somali", "sudan", "misir"],
  },
  {
    id: "rusyaAvrupa",
    ad: "gbRusyaAvrupa",
    konular: ["rusyaUkrayna", "kuruluslar", "turkiye"],
  },
];

/* Ağır sözcükler: olayın editoryal ağırlığı. Sayı değil, olayın türü. */
const AGIR: [string[], number][] = [
  [
    [
      "killed",
      "dead",
      "massacre",
      "airstrike",
      "air strike",
      "bombing",
      "offensive",
      "invasion",
      "shelling",
      "drone strike",
      "missile",
      "قتلى",
      "شهداء",
      "مجزرة",
      "غارة",
      "قصف",
      "هجوم",
      "اجتياح",
      "صاروخ",
      "مسيرة",
    ],
    4,
  ],
  [
    [
      "ceasefire",
      "truce",
      "peace deal",
      "agreement signed",
      "talks collapse",
      "escalat",
      "emergency meeting",
      "security council",
      "resolution",
      "sanction",
      "coup",
      "وقف اطلاق النار",
      "هدنة",
      "اتفاق",
      "تصعيد",
      "جلسة طارئة",
      "مجلس الامن",
      "قرار",
      "عقوبات",
      "انقلاب",
    ],
    3,
  ],
  [
    [
      "displaced",
      "refugee",
      "famine",
      "humanitarian",
      "cholera",
      "aid convoy",
      "نازحين",
      "النزوح",
      "لاجئين",
      "مجاعة",
      "انساني",
      "الكوليرا",
      "مساعدات",
    ],
    2,
  ],
  [
    [
      "talks",
      "negotiat",
      "summit",
      "visit",
      "meeting",
      "election",
      "مفاوضات",
      "محادثات",
      "قمة",
      "زيارة",
      "اجتماع",
      "انتخابات",
    ],
    1,
  ],
];

/* Önümüzdeki günlere bakan sözcükler: "neye bakılmalı". */
const ILERI = [
  "will",
  "to hold",
  "scheduled",
  "next week",
  "tomorrow",
  "upcoming",
  "expected to",
  "vote",
  "deadline",
  "talks",
  "summit",
  "سيعقد",
  "من المقرر",
  "الاسبوع المقبل",
  "غدا",
  "المرتقب",
  "يتوقع",
  "تصويت",
  "مهلة",
  "محادثات",
  "قمة",
];

const FIRSAT_DIPLOMASI = [
  "talks",
  "negotiat",
  "mediat",
  "summit",
  "visit",
  "envoy",
  "مفاوضات",
  "محادثات",
  "وساطة",
  "قمة",
  "زيارة",
  "مبعوث",
];

/* --- Metin --- */

/* Arapçada hareke ve yazım farkları eşleşmeyi bozmasın; Latin küçük harf, aksansız. */
export const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ");

const LATIN = /[a-z]/;
const sozcukOnbellegi = new Map<string, string>();
const sozNormal = (s: string) => {
  let n = sozcukOnbellegi.get(s);
  if (n === undefined) sozcukOnbellegi.set(s, (n = normal(s)));
  return n;
};

/*
 * Latin sözcük sözcük başında eşleşmeli ("iran" "tirana"yı yakalamasın; ekler
 * serbest: "syrian"); Arapça önek alıyor (و، ب، ال), içinde aranıyor.
 */
export const icerir = (metin: string, soz: string) => {
  const s = sozNormal(soz);
  if (!LATIN.test(s)) return metin.includes(s);
  let i = metin.indexOf(s);
  while (i >= 0) {
    if (i === 0 || !/[a-z0-9]/.test(metin[i - 1])) return true;
    i = metin.indexOf(s, i + 1);
  }
  return false;
};
const herhangi = (metin: string, liste: string[]) =>
  liste.some((s) => icerir(metin, s));

/* --- Haber ve olay --- */

export interface Haber {
  baslik: string;
  baglanti: string;
  zaman: string;
  ozet?: string;
  kaynakId: string;
  kaynak: string;
}

export interface Olay {
  id: string;
  baslik: string;
  haberler: Haber[];
  kaynaklar: string[];
  konular: string[];
  /** Konu başına alt başlıklar (Etiyopya dosyası, kuruluşlar). */
  altlar: Record<string, string[]>;
  baglar: string[];
  ilk: string;
  son: string;
  agirlik: number;
  ileri: boolean;
}

const DURAK = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "after",
  "over",
  "says",
  "said",
  "amid",
  "into",
  "about",
  "this",
  "that",
  "their",
  "have",
  "has",
  "will",
  "في",
  "من",
  "على",
  "الى",
  "عن",
  "مع",
  "بعد",
  "قبل",
  "التي",
  "الذي",
  "هذا",
  "هذه",
  "ان",
  "او",
  "ما",
  "لا",
]);

/* Benzerlik için başlığın sözcükleri: kısa ve sık sözcükler çıkıyor, Arapçada "ال" atılıyor. */
export const imza = (baslik: string) =>
  new Set(
    normal(baslik)
      .split(/[^a-z0-9؀-ۿ]+/)
      .map((w) => (/^ال/.test(w) && w.length > 4 ? w.slice(2) : w))
      .filter((w) => w.length >= 3 && !DURAK.has(w)),
  );

const benzer = (a: Set<string>, b: Set<string>) => {
  let ortak = 0;
  for (const w of a) if (b.has(w)) ortak++;
  const birlesim = a.size + b.size - ortak;
  return ortak >= 4 || (birlesim > 0 && ortak >= 2 && ortak / birlesim >= 0.4);
};

export const siniflandir = (metin: string) => {
  const m = normal(metin);
  const konular: string[] = [];
  const altlar: Record<string, string[]> = {};
  for (const k of KONULAR) {
    if (!herhangi(m, k.sozcukler)) continue;
    if (k.sart && !herhangi(m, k.sart)) continue;
    konular.push(k.id);
    const a = (k.alt ?? [])
      .filter((x) => herhangi(m, x.sozcukler))
      .map((x) => x.id);
    if (a.length) altlar[k.id] = a;
  }
  return { konular, altlar };
};

const agirlikPuani = (m: string) => {
  let p = 0;
  for (const [liste, puan] of AGIR) if (herhangi(m, liste)) p += puan;
  return p;
};

/* Aynı başlık iki akışta: biri yeter (kaynak sayısı yine ikisi). */
const SAAT = 3600_000;
const OLAY_PENCERESI = 36 * SAAT;

/**
 * Haberleri olaylara toplar. Aynı olayı veren haberler (başlık sözcükleri
 * örtüşen, 36 saat içinde) tek olay; klasör ve bağ olayın bütün haberlerinden.
 */
export const olaylariKur = (haberler: Haber[]): Olay[] => {
  const sirali = [...haberler].sort((a, b) => b.zaman.localeCompare(a.zaman));
  const gruplar: { imza: Set<string>; haberler: Haber[] }[] = [];
  const gorulen = new Set<string>();
  for (const h of sirali) {
    if (gorulen.has(h.baglanti)) continue;
    gorulen.add(h.baglanti);
    const i = imza(h.baslik);
    const t = Date.parse(h.zaman);
    const g = gruplar.find(
      (x) =>
        benzer(x.imza, i) &&
        Math.abs(Date.parse(x.haberler[0].zaman) - t) <= OLAY_PENCERESI,
    );
    if (g) {
      g.haberler.push(h);
      for (const w of i) g.imza.add(w);
    } else gruplar.push({ imza: i, haberler: [h] });
  }
  return gruplar.map(({ haberler: hs }) => {
    const metin = hs.map((h) => `${h.baslik} ${h.ozet ?? ""}`).join(" ");
    const { konular, altlar } = siniflandir(metin);
    const m = normal(metin);
    const kaynaklar = [...new Set(hs.map((h) => h.kaynak))];
    const ana = konular.some((k) => konuBul(k)?.ana);
    const baglar = BAGLAR.filter(
      (b) => b.konular.filter((k) => konular.includes(k)).length >= 2,
    ).map((b) => b.id);
    const zamanlar = hs.map((h) => h.zaman).sort();
    // İlk haber olayın adı: en eski değil, en çok kaynağın verdiği olayın en yeni başlığı yeterince açık.
    return {
      id: `ol-${hs[hs.length - 1].baglanti}`,
      baslik: hs[0].baslik,
      haberler: hs,
      kaynaklar,
      konular,
      altlar,
      baglar,
      ilk: zamanlar[0],
      son: zamanlar[zamanlar.length - 1],
      agirlik:
        Math.min(kaynaklar.length, 5) * 2 +
        agirlikPuani(m) +
        (ana ? 1 : 0) +
        (baglar.length ? 1 : 0),
      ileri: herhangi(m, ILERI),
    };
  });
};

/* --- Öncelik --- */

export type Seviye = "yuksek" | "orta" | "dusuk" | "sakin";

/** Konunun son 24 saatteki önemi: en ağır üç olayın toplamı; olay sayısı değil. */
export const konuSkoru = (olaylar: Olay[], konuId: string, simdi: number) =>
  olaylar
    .filter(
      (o) =>
        o.konular.includes(konuId) && Date.parse(o.son) >= simdi - 24 * SAAT,
    )
    .map((o) => o.agirlik)
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((a, b) => a + b, 0);

export const seviye = (skor: number): Seviye =>
  skor >= 24 ? "yuksek" : skor >= 12 ? "orta" : skor > 0 ? "dusuk" : "sakin";

/** Yön: bugünkü skor önceki günlerin ortalamasına göre (tarayıcıda tutulan geçmişten). */
export const egilim = (
  skor: number,
  gecmis: number[],
): "artis" | "dusus" | "ayni" => {
  if (!gecmis.length) return "ayni";
  const ort = gecmis.reduce((a, b) => a + b, 0) / gecmis.length;
  return skor >= ort * 1.5 + 4
    ? "artis"
    : skor <= ort * 0.5 - 4
      ? "dusus"
      : "ayni";
};

export const konuOlaylari = (olaylar: Olay[], konuId: string) =>
  olaylar
    .filter((o) => o.konular.includes(konuId))
    .sort((a, b) => b.agirlik - a.agirlik || b.son.localeCompare(a.son));

/** Bölümün konuları önceliğe göre: sakin konu sona iner ama listeden çıkmaz. */
export const bolumKonulari = (
  olaylar: Olay[],
  bolum: GundemBolumu,
  simdi: number,
) =>
  KONULAR.filter((k) => k.bolum === bolum)
    .map((k) => ({ konu: k, skor: konuSkoru(olaylar, k.id, simdi) }))
    .sort((a, b) => b.skor - a.skor);

/* --- Yeni ortaya çıkanlar ve yaklaşanlar --- */

/** Son 12 saatte ilk kez görülen, en az iki kaynağın verdiği ya da ağır olay. */
export const yeniOlaylar = (olaylar: Olay[], simdi: number) =>
  olaylar
    .filter(
      (o) =>
        Date.parse(o.ilk) >= simdi - 12 * SAAT &&
        (o.kaynaklar.length >= 2 || o.agirlik >= 7),
    )
    .sort((a, b) => b.agirlik - a.agirlik);

export const ileriOlaylar = (olaylar: Olay[], simdi: number) =>
  olaylar
    .filter(
      (o) =>
        o.ileri && o.konular.length && Date.parse(o.son) >= simdi - 48 * SAAT,
    )
    .sort((a, b) => b.agirlik - a.agirlik);

/** Takvimdeki önümüzdeki günler: konunun ülkesindeki faaliyet. */
export const konuEtkinlikleri = (
  d: Durum,
  konu: Konu,
  gun: number,
  bugunTarih: string,
) =>
  yaklasanlar(d.faaliyetler, gun, bugunTarih).filter(
    (x) =>
      (x.f.ulke && konu.ulkeler.includes(x.f.ulke)) ||
      herhangi(normal(x.f.baslik), konu.sozcukler),
  );

/* --- Sabah brifingi --- */

export interface BrifingSatiri {
  konu: Konu;
  skor: number;
  olaylar: Olay[];
  /** Önümüzdeki 24–72 saat: ileriye bakan olaylar ve takvim. */
  izlenecek: Olay[];
  etkinlikler: ReturnType<typeof konuEtkinlikleri>;
}

export const BRIFING_A = [
  "filistin",
  "suriye",
  "irak",
  "lubnan",
  "yemen",
  "iran",
  "sudan",
  "libya",
  "misir",
  "etiyopya",
  "eritre",
  "somali",
  "guneySudan",
  "korfez",
];
export const BRIFING_B = ["turkiye", "rusyaUkrayna", "abd", "kuruluslar"];

export const brifingSatiri = (
  d: Durum,
  olaylar: Olay[],
  konuId: string,
  simdi: number,
  bugunTarih: string,
): BrifingSatiri => {
  const konu = konuBul(konuId)!;
  const gun = olaylar
    .filter(
      (o) =>
        o.konular.includes(konuId) && Date.parse(o.son) >= simdi - 24 * SAAT,
    )
    .sort((a, b) => b.agirlik - a.agirlik);
  return {
    konu,
    skor: konuSkoru(olaylar, konuId, simdi),
    olaylar: gun.slice(0, 3),
    izlenecek: gun.filter((o) => o.ileri).slice(0, 2),
    etkinlikler: konuEtkinlikleri(d, konu, 3, bugunTarih).slice(0, 3),
  };
};

/** Bölgeler arası: son 24 saatte bir bağa düşen olaylar, bağa göre. */
export const capraz = (olaylar: Olay[], simdi: number) =>
  BAGLAR.map((b) => ({
    bag: b,
    olaylar: olaylar
      .filter(
        (o) =>
          o.baglar.includes(b.id) && Date.parse(o.son) >= simdi - 24 * SAAT,
      )
      .sort((x, y) => y.agirlik - x.agirlik),
  })).filter((x) => x.olaylar.length);

/* --- Editoryal fırsatlar: kurallardan, öneri değil, öneriye çevrilebilir --- */

export type FirsatTuru = "paket" | "saha" | "roportaj" | "aciklayici" | "ozel";
export interface Firsat {
  tur: FirsatTuru;
  olay: Olay;
  konu: Konu;
  /** Sahada: o ülkedeki muhabirler. */
  muhabirler?: Kisi[];
}

export const firsatlar = (
  d: Durum,
  olaylar: Olay[],
  simdi: number,
): Firsat[] => {
  const sonuc: Firsat[] = [];
  const son = olaylar
    .filter((o) => Date.parse(o.son) >= simdi - 24 * SAAT && o.konular.length)
    .sort((a, b) => b.agirlik - a.agirlik);
  const muhabirler = d.kisiler.filter((k) => k.birim === "muhabir" && !k.pasif);
  for (const o of son.slice(0, 40)) {
    const konu = konuBul(o.konular[0])!;
    const m = normal(
      o.haberler.map((h) => `${h.baslik} ${h.ozet ?? ""}`).join(" "),
    );
    if (o.agirlik >= 10 && konu.ana)
      sonuc.push({ tur: "paket", olay: o, konu });
    const yerel = muhabirler.filter((k) =>
      o.konular.some((id) =>
        konuBul(id)?.ulkeler.includes(sehirUlkesi(k.sehir, d)),
      ),
    );
    if (yerel.length && o.agirlik >= 8)
      sonuc.push({ tur: "saha", olay: o, konu, muhabirler: yerel });
    if (herhangi(m, FIRSAT_DIPLOMASI) && o.agirlik >= 6)
      sonuc.push({ tur: "roportaj", olay: o, konu });
    if (o.baglar.length && o.agirlik >= 6)
      sonuc.push({ tur: "aciklayici", olay: o, konu });
  }
  // Özel yayın: bir konu yüksekte ve gündemin başında.
  for (const k of KONULAR) {
    if (seviye(konuSkoru(olaylar, k.id, simdi)) !== "yuksek") continue;
    const o = konuOlaylari(olaylar, k.id)[0];
    if (o) sonuc.push({ tur: "ozel", olay: o, konu: k });
  }
  return sonuc;
};

/* --- Kaynaklar --- */

/*
 * Kurulu liste. Reuters ve AP açık RSS vermiyor; yerlerine aynı haberleri
 * aktaran yayıncılar. Adresi değişen akış Ayarlar'daki listede hatasıyla görünür.
 */
export const VARSAYILAN_KAYNAKLAR: GundemKaynagi[] = [
  {
    id: "gk-ajarabic",
    ad: "Al Jazeera",
    adres:
      "https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9",
    dil: "ar",
    tur: "yayin",
  },
  {
    id: "gk-ajen",
    ad: "Al Jazeera English",
    adres: "https://www.aljazeera.com/xml/rss/all.xml",
    dil: "en",
    tur: "yayin",
  },
  {
    id: "gk-bbcar",
    ad: "BBC Arabic",
    adres: "https://feeds.bbci.co.uk/arabic/rss.xml",
    dil: "ar",
    tur: "yayin",
  },
  {
    id: "gk-bbcme",
    ad: "BBC Middle East",
    adres: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
    dil: "en",
    tur: "yayin",
  },
  {
    id: "gk-bbcaf",
    ad: "BBC Africa",
    adres: "https://feeds.bbci.co.uk/news/world/africa/rss.xml",
    dil: "en",
    tur: "yayin",
  },
  {
    id: "gk-f24ar",
    ad: "France 24 عربي",
    adres: "https://www.france24.com/ar/rss",
    dil: "ar",
    tur: "yayin",
  },
  {
    id: "gk-dwar",
    ad: "DW عربية",
    adres: "https://rss.dw.com/xml/rss-ar-all",
    dil: "ar",
    tur: "yayin",
  },
  {
    id: "gk-aaar",
    ad: "Anadolu Ajansı (عربي)",
    adres: "https://www.aa.com.tr/ar/rss/default?cat=guncel",
    dil: "ar",
    tur: "ajans",
  },
  {
    id: "gk-aaen",
    ad: "Anadolu Agency",
    adres: "https://www.aa.com.tr/en/rss/default?cat=guncel",
    dil: "en",
    tur: "ajans",
  },
  {
    id: "gk-unar",
    ad: "أخبار الأمم المتحدة",
    adres: "https://news.un.org/feed/subscribe/ar/news/all/rss.xml",
    dil: "ar",
    tur: "kurum",
  },
  {
    id: "gk-unen",
    ad: "UN News",
    adres: "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
    dil: "en",
    tur: "kurum",
  },
  {
    id: "gk-reliefweb",
    ad: "ReliefWeb",
    adres: "https://reliefweb.int/updates/rss.xml",
    dil: "en",
    tur: "kurum",
  },
  {
    id: "gk-crisis",
    ad: "Crisis Group",
    adres: "https://www.crisisgroup.org/rss.xml",
    dil: "en",
    tur: "kurum",
  },
  {
    id: "gk-mee",
    ad: "Middle East Eye",
    adres: "https://www.middleeasteye.net/rss",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-sudantribune",
    ad: "Sudan Tribune",
    adres: "https://sudantribune.com/feed/",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-addis",
    ad: "Addis Standard",
    adres: "https://addisstandard.com/feed/",
    dil: "en",
    tur: "bolge",
  },
];

export const gundemKaynaklari = (d: Durum) =>
  d.gundemKaynaklari?.length ? d.gundemKaynaklari : VARSAYILAN_KAYNAKLAR;

/* --- Demo: kapıya gidilmiyor, kurgusal örnek akış --- */

export const demoHaberleri = (simdi: number): Haber[] => {
  const s = (saat: number) => new Date(simdi - saat * SAAT).toISOString();
  const h = (
    baslik: string,
    saat: number,
    kaynak: string,
    ozet = "",
  ): Haber => ({
    baslik,
    baglanti: `https://ornek.test/${encodeURIComponent(baslik)}/${kaynak}`,
    zaman: s(saat),
    ozet,
    kaynakId: kaynak,
    kaynak,
  });
  return [
    h("غارات جديدة على خان يونس وسقوط قتلى", 2, "Örnek A", "قصف مكثف جنوب غزة"),
    h("غارات على خان يونس جنوب غزة وقتلى بين المدنيين", 3, "Örnek B"),
    h(
      "Ceasefire talks on Gaza to resume in Cairo next week",
      5,
      "Örnek C",
      "Egypt and Qatar mediators expected to host delegations",
    ),
    h(
      "Fighting intensifies around El Fasher as RSF advances",
      4,
      "Örnek C",
      "Displaced families flee Darfur",
    ),
    h("اشتباكات عنيفة في الفاشر وتقدم لقوات الدعم السريع", 6, "Örnek A"),
    h("Fano fighters clash with Ethiopian army in Amhara region", 7, "Örnek D"),
    h(
      "Ethiopia renews call for Red Sea access through Assab, Eritrea rejects",
      9,
      "Örnek C",
      "Eritrea and Somalia watch closely",
    ),
    h(
      "Egypt warns over GERD filling as Sudan seeks talks with Ethiopia",
      20,
      "Örnek B",
      "Nile dispute",
    ),
    h("Houthi missile targets ship in Red Sea", 10, "Örnek D"),
    h(
      "Security Council to hold emergency meeting on Sudan",
      12,
      "Örnek E",
      "UN members scheduled to vote on resolution",
    ),
    h(
      "Turkish foreign minister Fidan visits Baghdad to discuss Syria border and energy corridor",
      14,
      "Örnek A",
    ),
    h(
      "Ukraine says drone attack hit Black Sea port, Kremlin silent",
      8,
      "Örnek D",
    ),
    h("Senate debates arms package for Israel and Ukraine", 16, "Örnek E"),
    h("Libya rival governments hold talks in Tripoli", 30, "Örnek B"),
    h("محادثات ايرانية اوروبية حول الملف النووي الاسبوع المقبل", 11, "Örnek A"),
  ];
};

/* --- Tarayıcıda tutulan son haberler ve günlük skor geçmişi (kişinin kolaylığı; kayıt değil) --- */

const SAKLA = "trt-planlama-gundem";
const SKOR = "trt-planlama-gundem-skor";

export const sakliHaberler = (): Haber[] => {
  try {
    return JSON.parse(localStorage.getItem(SAKLA) ?? "[]") as Haber[];
  } catch {
    return [];
  }
};

/** Yeni okunanları eskilere katar; bir haftadan eski ve fazlası atılır (akış birkaç günü tutuyor, geçmiş eğilime yetsin). */
export const haberleriSakla = (yeni: Haber[], simdi: number): Haber[] => {
  const birlesik = new Map<string, Haber>();
  for (const h of [...sakliHaberler(), ...yeni]) birlesik.set(h.baglanti, h);
  const liste = [...birlesik.values()]
    // Tarihi geçersiz, bir haftadan eski ya da ileri tarihli (saat dilimi payı bir saat) haber gündeme girmez.
    .filter((h) => {
      const t = Date.parse(h.zaman);
      return (
        Number.isFinite(t) && t >= simdi - 7 * 24 * SAAT && t <= simdi + SAAT
      );
    })
    .sort((a, b) => b.zaman.localeCompare(a.zaman))
    .slice(0, 3000);
  try {
    localStorage.setItem(SAKLA, JSON.stringify(liste));
  } catch {
    /* dolu ya da kapalı: bu açılışta bellekte kalır */
  }
  return liste;
};

export const skorGecmisi = (): Record<string, Record<string, number>> => {
  try {
    return JSON.parse(localStorage.getItem(SKOR) ?? "{}") as Record<
      string,
      Record<string, number>
    >;
  } catch {
    return {};
  }
};

/** Günün skorlarını yazar, son 14 günü tutar; eğilim önceki günlerin ortalamasıyla. */
export const skorlariYaz = (gun: string, skorlar: Record<string, number>) => {
  const g = { ...skorGecmisi(), [gun]: skorlar };
  const tut = Object.keys(g).sort().slice(-14);
  try {
    localStorage.setItem(
      SKOR,
      JSON.stringify(Object.fromEntries(tut.map((k) => [k, g[k]]))),
    );
  } catch {
    /* kapalı */
  }
};

export const oncekiSkorlar = (gun: string, konuId: string) =>
  Object.entries(skorGecmisi())
    .filter(([k]) => k < gun && k >= gunEkle(gun, -7))
    .map(([, v]) => v[konuId] ?? 0);
