import type { Anahtar } from "./dil";
import { sehirUlkesi } from "./etiketler";
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

/*
 * Sekmeler. Konu klasörleri (Orta Doğu, Boynuz…) kullanıcı denedi, haber
 * klasöre bölünmesi iyi işlemedi: yerine tek akış, en yenisi üstte,
 * etiketle süzülüyor ("Haber akışı").
 */
export const GUNDEM_BOLUMLERI = ["brifing", "akis", "etkinlikler", "firsatlar", "arsiv"] as const;
export type GundemBolumu = (typeof GUNDEM_BOLUMLERI)[number];
/** Etiket çubuğunda konunun grubu (eski klasörler). */
export const KONU_GRUPLARI = ["ortadogu", "boynuz", "turkiye", "rusya", "abd", "kuruluslar"] as const;
export type KonuGrubu = (typeof KONU_GRUPLARI)[number];

export interface AltKonu {
  id: string;
  ad: Anahtar;
  sozcukler: string[];
}

export interface Konu {
  id: string;
  bolum: KonuGrubu;
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
  /** Eşleşmeden önce metinden çıkan ifadeler: "South Sudan" Sudan sayılmasın. */
  haric?: string[];
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
      "settler",
      "settlers",
      "مستوطن",
      "occupied territories",
      "الاراضي المحتله",
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
      "hormuz",
      "هرمز",
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
    // "South Sudan" ve Irak başbakanının soyadı (محمد شياع السوداني) Sudan değil.
    haric: ["south sudan", "جنوب السودان", "شياع السوداني", "محمد السوداني", "al-sudani", "sudani"],
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
      "aramco",
      "ارامكو",
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
      "ميناء عصب",
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
          "ميناء عصب",
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
      "رياك مشار",
      "spla-io",
      "sspdf",
      "jonglei",
      "upper nile state",
      "جونقلي",
      "south sudan",
      "juba",
      "kiir",
      "machar",
      "جنوب السودان",
      "جوبا",
      "سلفاكير",
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
      "zelensky",
      "talks",
      "un ",
      "secretary-general",
      "black sea",
      "mediat",
      "greece",
      "cyprus",
      "azerbaijan",
      "armenia",
      "البحر الاسود",
      "اليونان",
      "قبرص",
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
      "russia",
      "russian",
      "روسيا",
      "الروسي",
      "moscow",
      "موسكو",
      "oleshky",
      "kharkiv",
      "zaporizhzhia",
      "خاركيف",
      "زابوريجيا",
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
      "اوكرانيا",
      "كييف",
      "زيلينسكي",
      "الكرملين",
      "بوتين",
      "القرم",
      "البحر الاسود",
    ],
  },
  {
    id: "abd",
    bolum: "abd",
    ad: "gkAbd",
    ulkeler: ["abd"],
    sozcukler: [
      "democrats",
      "democratic party",
      "white house",
      "congress",
      "senate",
      "midterm",
      "republican",
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
      "un security council",
      "u.n. security council",
      "مجلس الامن الدولي",
      "united nations",
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
/*
 * Arapça sözcük de sınırıyla aranır: önek (و ف ب ل ك ve ال) ve nisbe eki (ي،
 * ية، يون، يين، ون) serbest, gerisi değil; "ه" eki yok: ة "ه"ye çevrildiği
 * için "حلبة" Halep, "الجنينة" Cenin sayılırdı. Önce metnin içinde aranıyordu: "مشار"
 * "مشاركة"yı, "الرياض" "الرياضة"yı, "عصب" "عصبية"yi yakalıyordu.
 */
const AR_HARF = "\u0621-\u064A";
const arDesenleri = new Map<string, RegExp>();
const arDeseni = (s: string) => {
  let d = arDesenleri.get(s);
  if (!d) {
    const kok = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    d = new RegExp(`(?:^|[^${AR_HARF}])(?:[وفبلك]{0,2}(?:ال)?)${kok}(?:يه|يين|يون|ين|ي|ون)?(?=$|[^${AR_HARF}])`);
    arDesenleri.set(s, d);
  }
  return d;
};

export const icerir = (metin: string, soz: string) => {
  const s = sozNormal(soz);
  if (!LATIN.test(s)) return arDeseni(s).test(metin);
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
  // Ön ekler ve sayı sözcükleri: "Daily Brief", "four killed" ayrı olayları birleştiriyordu.
  "daily",
  "brief",
  "four",
  "three",
  "two",
  "five",
  "kills",
  "killed",
  "strike",
  "strikes",
  "news",
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

/**
 * Yayıncının sayım anahtarı: parantez ve " - " sonrası atılır, küçük harf;
 * bilinen eş adlar tek ad. "Anadolu Ajansı (عربي)" ile "Anadolu Agency" iki
 * kaynak sayılıyordu, olayın ağırlığı şişiyordu.
 */
const YAYINCI_ESLERI: [RegExp, string][] = [
  [/^anadolu/, "anadolu"],
  [/^(aa|aa\.com\.tr)$/, "anadolu"],
  [/^un news/, "un news"],
  [/^الامم المتحده|^اخبار الامم المتحده/, "un news"],
  [/^al jazeera|^(قناه )?الجزيره/, "al jazeera"],
  [/^france ?24|^فرانس ?24/, "france24"],
  // Telegram kanalının adı sitenin adından farklı: aynı kurum tek kaynak.
  [/^(وكاله )?الاناضول/, "anadolu"],
  [/^trt/, "trt"],
  [/^عربي ?21/, "arabi21"],
  [/^asharq news|^الشرق للاخبار/, "asharq"],
  [/^bbc/, "bbc"],
];
export const yayinciAnahtari = (ad: string) => {
  const y = normal(ad.replace(/\(.*?\)/g, "").split(" - ")[0].replace(/^©\s*/, "")).trim();
  return YAYINCI_ESLERI.find(([d]) => d.test(y))?.[1] ?? y;
};

/* Benzerlik için başlığın sözcükleri: kısa ve sık sözcükler çıkıyor, Arapçada "ال" atılıyor. */
export const imza = (baslik: string) =>
  new Set(
    normal(baslik.replace(/^#[^:\s]+:\s*/, ""))
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

/*
 * Sınıflandırma başlığa dayanır. Konu ya başlıkta geçer ya da özette o konunun
 * en az iki ayrı sözcüğü geçer; özetteki tek bir sözcük konu vermez. Özette
 * yayıncı adı ("صحيفة التغيير السودانية"), "ilgili haberler" ve başka
 * konular geçiyor; tek sözcükle Fransa haberi Sudan'a düşüyordu.
 */
const haricli = (k: Konu, m: string) => (k.haric ? k.haric.reduce((x, h) => x.split(sozNormal(h)).join(" "), m) : m);
const kacSozcuk = (m: string, liste: string[]) => liste.filter((w) => icerir(m, w)).length;

export const siniflandir = (baslik: string, ozet = "") => {
  const b = normal(baslik);
  const o = normal(ozet);
  const konular: string[] = [];
  const altlar: Record<string, string[]> = {};
  for (const k of KONULAR) {
    const kb = haricli(k, b);
    const ko = haricli(k, o);
    if (!herhangi(kb, k.sozcukler) && kacSozcuk(ko, k.sozcukler) < 2) continue;
    if (k.sart && !herhangi(`${kb} ${ko}`, k.sart)) continue;
    konular.push(k.id);
    // Alt başlık da önce başlıktan; özette yalnız kendi iki sözcüğüyle.
    const a = (k.alt ?? []).filter((x) => herhangi(kb, x.sozcukler) || kacSozcuk(ko, x.sozcukler) >= 2).map((x) => x.id);
    if (a.length) altlar[k.id] = a;
  }
  return { konular, altlar };
};

/** Özetten başlığın tekrarı ve yayıncının adı atılır: toplayıcının özeti çoğu zaman yalnız "başlık + yayıncı". */
export const temizOzet = (h: Pick<Haber, "baslik" | "ozet" | "kaynak">) => {
  let o = h.ozet ?? "";
  if (o.startsWith(h.baslik)) o = o.slice(h.baslik.length);
  if (h.kaynak) o = o.split(h.kaynak).join(" ");
  return o.trim();
};

export const haberSiniflandir = (h: Haber) => siniflandir(h.baslik, temizOzet(h));

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
  const gruplar: { imza: Set<string>; t: number; konular: string[]; haberler: Haber[] }[] = [];
  // Sözcük dizini: aday yalnız ortak sözcüğü olan gruplar; her haberi bütün gruplarla karşılaştırmak 3000 haberde bir saniyeyi buluyordu.
  const dizin = new Map<string, number[]>();
  const gorulen = new Set<string>();
  for (const h of sirali) {
    if (gorulen.has(h.baglanti)) continue;
    gorulen.add(h.baglanti);
    const i = imza(h.baslik);
    const t = Date.parse(h.zaman);
    // Başlığın konuları: ikisi de konulu ama ortak konusu olmayan haberler (Fransa ve Sudan) benzer sözcüklerle birleşmez.
    const hk = siniflandir(h.baslik).konular;
    const uyumlu = (k: string[]) => !k.length || !hk.length || k.some((x) => hk.includes(x));
    const adaylar = new Set<number>();
    for (const w of i) for (const n of dizin.get(w) ?? []) adaylar.add(n);
    // İlk eklenen grup önce: eskiden de ilk uyan seçiliyordu.
    const n = [...adaylar].sort((a, b) => a - b).find((k) => Math.abs(gruplar[k].t - t) <= OLAY_PENCERESI && uyumlu(gruplar[k].konular) && benzer(gruplar[k].imza, i));
    // İmza büyütülmez, grubun ilk haberiyle karşılaştırılır: büyüyünce grup kartopu gibi alakasız haberleri çekiyordu.
    if (n !== undefined) gruplar[n].haberler.push(h);
    else {
      gruplar.push({ imza: i, t, konular: hk, haberler: [h] });
      for (const w of i) {
        const l = dizin.get(w);
        if (l) l.push(gruplar.length - 1);
        else dizin.set(w, [gruplar.length - 1]);
      }
    }
  }
  return gruplar.map(({ haberler: hs }) => {
    const metin = hs.map((h) => `${h.baslik} ${h.ozet ?? ""}`).join(" ");
    /*
     * Etiket olayın haberlerinin en az %30'unda geçiyorsa olaya verilir:
     * yanlış birleşen tek haber olaya ek etiketler taşıyordu.
     */
    const tek = hs.map(haberSiniflandir);
    const esik = Math.max(1, Math.ceil(hs.length * 0.3));
    const sayKonu = new Map<string, number>();
    const sayAlt = new Map<string, number>();
    for (const x of tek) {
      for (const k of x.konular) sayKonu.set(k, (sayKonu.get(k) ?? 0) + 1);
      for (const [k, l] of Object.entries(x.altlar)) for (const a of l) sayAlt.set(`${k}:${a}`, (sayAlt.get(`${k}:${a}`) ?? 0) + 1);
    }
    const konular = KONULAR.map((k) => k.id).filter((k) => (sayKonu.get(k) ?? 0) >= esik);
    const altlar: Record<string, string[]> = {};
    for (const [e, n] of sayAlt) {
      const [k, a] = e.split(":");
      if (n >= esik && konular.includes(k)) (altlar[k] ??= []).push(a);
    }
    const m = normal(metin);
    // Aynı yayıncının yazımları (Anadolu Ajansı / Anadolu Agency) bir kaynak sayılır.
    const kaynaklar = [...new Map(hs.map((h) => [yayinciAnahtari(h.kaynak), h.kaynak])).values()];
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

export const konuOlaylari = (olaylar: Olay[], konuId: string) =>
  olaylar
    .filter((o) => o.konular.includes(konuId))
    .sort((a, b) => b.agirlik - a.agirlik || b.son.localeCompare(a.son));

/* --- Etiketler: konu, alt başlık ("etiyopya:tigray") ve bölgeler arası bağ ("bag:…") --- */

export const olayEtiketleri = (o: Olay): string[] => [
  ...o.konular,
  ...Object.entries(o.altlar).flatMap(([k, l]) => l.map((a) => `${k}:${a}`)),
  ...o.baglar.map((b) => `bag:${b}`),
];

/** Etiketin dil anahtarı; tanınmayan (eski kayıttan kalmış) etiket için null. */
export const etiketAdi = (e: string): Anahtar | null => {
  if (e.startsWith("bag:")) return BAGLAR.find((b) => b.id === e.slice(4))?.ad ?? null;
  const [k, a] = e.split(":");
  const konu = konuBul(k);
  if (!konu) return null;
  return a ? (konu.alt?.find((x) => x.id === a)?.ad ?? null) : konu.ad;
};

/** Bütün etiketler çubuktaki sırayla: konu grupları, her konunun altında alt başlıkları, sonda bağlar. */
export const BUTUN_ETIKETLER: string[] = [
  ...KONULAR.flatMap((k) => [k.id, ...(k.alt ?? []).map((a) => `${k.id}:${a.id}`)]),
  ...BAGLAR.map((b) => `bag:${b.id}`),
];

/**
 * Akış: en yenisi üstte. Seçili etiketlerden birine uyan (seçim yoksa hepsi);
 * alt başlık seçilince yalnız o alt başlık, konu seçilince konunun hepsi.
 */
export const akisOlaylari = (olaylar: Olay[], secili: string[]) =>
  olaylar
    .filter((o) => {
      if (!secili.length) return true;
      const e = olayEtiketleri(o);
      return secili.some((s) => e.includes(s));
    })
    .sort((a, b) => b.son.localeCompare(a.son));

/** Etiketin son 24 saatteki olay sayısı: çubukta etiketin yanında. */
export const etiketSayilari = (olaylar: Olay[], simdi: number) => {
  const say: Record<string, number> = {};
  for (const o of olaylar) if (Date.parse(o.son) >= simdi - 24 * SAAT) for (const e of olayEtiketleri(o)) say[e] = (say[e] ?? 0) + 1;
  return say;
};

/* --- Takip edilen etiketler: kişinin görünüm tercihi, tarayıcıda --- */

const TAKIP = "trt-planlama-gundem-etiket";
export const takipEtiketleri = (): string[] => {
  try {
    return (JSON.parse(localStorage.getItem(TAKIP) ?? "[]") as string[]).filter((e) => BUTUN_ETIKETLER.includes(e));
  } catch {
    return [];
  }
};
/* "Takip ettiğim etiketler" anahtarı da kalıcı: yenilemede kendiliğinden açılıp akışı daraltıyordu. */
const YALNIZ = "trt-planlama-gundem-yalniz";
export const yalnizTakipOku = () => {
  try {
    return localStorage.getItem(YALNIZ) === "1";
  } catch {
    return false;
  }
};
export const yalnizTakipYaz = (a: boolean) => {
  try {
    localStorage.setItem(YALNIZ, a ? "1" : "0");
  } catch {
    /* kapalı */
  }
};
export const takipEtiketleriniYaz = (l: string[]) => {
  try {
    localStorage.setItem(TAKIP, JSON.stringify(l));
  } catch {
    /* kapalı: bu açılışta bellekte */
  }
};

/* --- Yeni ortaya çıkanlar ve yaklaşanlar --- */

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
 * Kurulu liste (canlı denenip seçildi). Reuters ve AP açık RSS vermiyor;
 * Times of Israel, Arab News, Al Arabiya, Politico bot korumasıyla, NATO, ICC,
 * Kyiv Independent adres değiştirdiği için yok. Okunamayan akış ⚙
 * penceresinde hatasıyla görünür.
 */
const SITELER: GundemKaynagi[] = [
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
    id: "gk-aawsat",
    ad: "الشرق الأوسط",
    adres: "https://aawsat.com/feed",
    dil: "ar",
    tur: "yayin",
  },
  {
    id: "gk-skyar",
    ad: "سكاي نيوز عربية",
    adres: "https://www.skynewsarabia.com/rss",
    dil: "ar",
    tur: "yayin",
  },
  {
    id: "gk-araby",
    ad: "العربي الجديد",
    adres: "https://www.alaraby.co.uk/rss",
    dil: "ar",
    tur: "yayin",
  },
  {
    id: "gk-quds",
    ad: "القدس العربي",
    adres: "https://www.alquds.co.uk/feed/",
    dil: "ar",
    tur: "yayin",
  },
  {
    id: "gk-arabi21",
    ad: "عربي21",
    adres: "https://arabi21.com/feed",
    dil: "ar",
    tur: "yayin",
  },
  {
    id: "gk-rtar",
    ad: "RT عربي",
    adres: "https://arabic.rt.com/rss/",
    dil: "ar",
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
    id: "gk-bbcar",
    ad: "BBC Arabic",
    adres: "https://feeds.bbci.co.uk/arabic/rss.xml",
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
    id: "gk-newarab",
    ad: "The New Arab",
    adres: "https://www.newarab.com/rss",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-mee",
    ad: "Middle East Eye",
    adres: "https://www.middleeasteye.net/rss",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-memo",
    ad: "Middle East Monitor",
    adres: "https://www.middleeastmonitor.com/feed/",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-almonitor",
    ad: "Al-Monitor",
    adres: "https://www.al-monitor.com/rss",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-national",
    ad: "The National",
    adres:
      "https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-haaretz",
    ad: "Haaretz",
    adres: "https://www.haaretz.com/srv/haaretz-latest-headlines",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-iranintl",
    ad: "Iran International",
    adres: "https://www.iranintl.com/en/feed",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-libyaherald",
    ad: "Libya Herald",
    adres: "https://libyaherald.com/feed/",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-tamazuj",
    ad: "Radio Tamazuj",
    adres: "https://www.radiotamazuj.org/en/rss",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-dabanga",
    ad: "Dabanga",
    adres: "https://www.dabangasudan.org/en/feed",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-dailysabah",
    ad: "Daily Sabah",
    adres: "https://www.dailysabah.com/rss/politics",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-meduza",
    ad: "Meduza",
    adres: "https://meduza.io/rss/en/all",
    dil: "en",
    tur: "bolge",
  },
  {
    id: "gk-thehill",
    ad: "The Hill",
    adres: "https://thehill.com/feed/",
    dil: "en",
    tur: "bolge",
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
    id: "gk-unpress",
    ad: "UN Press",
    adres: "https://press.un.org/en/rss.xml",
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
    tur: "derin",
  },
  {
    id: "gk-ethinsight",
    ad: "Ethiopia Insight",
    adres: "https://www.ethiopia-insight.com/feed/",
    dil: "en",
    tur: "derin",
  },
  {
    id: "gk-madamasr",
    ad: "Mada Masr",
    adres: "https://www.madamasr.com/en/feed/",
    dil: "en",
    tur: "derin",
  },
  {
    id: "gk-lwj",
    ad: "Long War Journal",
    adres: "https://www.longwarjournal.org/feed",
    dil: "en",
    tur: "derin",
  },
  {
    id: "gk-wotr",
    ad: "War on the Rocks",
    adres: "https://warontherocks.com/feed/",
    dil: "en",
    tur: "derin",
  },
];

/**
 * Google Haberler konu araması: anahtarsız, ücretsiz RSS. "when:1d" yalnız son
 * 24 saat; her haber asıl yayıncısıyla gelir (kapı `<source>`'u okuyor).
 */
export const aramaAdresi = (sorgu: string, dil: "ar" | "en") =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(`${sorgu} when:1d`)}&${dil === "ar" ? "hl=ar&gl=EG&ceid=EG:ar" : "hl=en-US&gl=US&ceid=US:en"}`;

/* Konu başına Arapça ve İngilizce arama: klasör yalnız genel akışlara kalmasın, derinleşsin. */
const ARAMALAR: [string, "ar" | "en", string][] = [
  ["filistin", "ar", "غزة OR الضفة الغربية OR الاحتلال الإسرائيلي"],
  ["filistin", "en", 'Gaza OR "West Bank" OR Netanyahu'],
  ["suriye", "ar", "سوريا دمشق OR حلب OR السويداء OR قسد"],
  ["suriye", "en", "Syria Damascus OR Aleppo OR SDF OR Sharaa"],
  ["irak", "ar", "العراق بغداد OR أربيل OR الحشد الشعبي"],
  ["irak", "en", "Iraq Baghdad OR Erbil OR Kurdistan"],
  ["lubnan", "ar", "لبنان حزب الله OR بيروت OR الجنوب اللبناني"],
  ["lubnan", "en", "Lebanon Hezbollah OR Beirut"],
  ["yemen", "ar", "اليمن الحوثي OR البحر الأحمر OR عدن"],
  ["yemen", "en", 'Yemen Houthi OR "Red Sea"'],
  ["iran", "ar", "إيران طهران OR النووي OR الحرس الثوري"],
  ["iran", "en", "Iran Tehran OR nuclear OR IRGC"],
  ["sudan", "ar", "السودان الدعم السريع OR الفاشر OR كردفان"],
  ["sudan", "en", 'Sudan RSF OR "El Fasher" OR Darfur OR Kordofan'],
  ["libya", "ar", "ليبيا طرابلس OR حفتر OR الدبيبة"],
  ["libya", "en", "Libya Tripoli OR Haftar OR Dbeibah"],
  ["misir", "en", "Egypt Sisi OR Cairo diplomacy OR Suez"],
  ["korfez", "en", "Saudi OR UAE OR Qatar OR Oman OR Jordan diplomacy"],
  ["etiyopya", "en", "Tigray OR Fano OR Amhara OR Oromia OR TPLF"],
  ["etiyopya2", "en", "Ethiopia Eritrea OR Assab OR GERD OR Somalia"],
  ["etiyopya", "ar", "إثيوبيا OR تيغراي OR سد النهضة OR إريتريا"],
  ["somali", "en", "Somalia OR Somaliland OR al-Shabaab OR Puntland"],
  ["guneySudan", "en", '"South Sudan" Juba OR Machar OR Kiir'],
  [
    "turkiye",
    "en",
    "Turkey foreign policy OR Fidan OR Erdogan NATO OR Ankara diplomacy",
  ],
  ["turkiye", "ar", "تركيا أردوغان OR فيدان OR أنقرة"],
  [
    "rusyaUkrayna",
    "en",
    'Ukraine Russia war OR Zelensky OR Kremlin OR "Black Sea"',
  ],
  [
    "abd",
    "en",
    '"White House" OR Congress OR Senate "Middle East" OR Iran OR Israel OR Ukraine',
  ],
  [
    "kuruluslar",
    "en",
    '"Security Council" OR ICJ OR ICC OR "Arab League" OR "African Union" OR OIC',
  ],
];

/**
 * Telegram açık kanalı: "@kanal", "t.me/kanal" ya da "https://t.me/s/kanal" →
 * web görünümünün adresi; tanınmazsa null. Kapalı grup ve özel kanal okunamaz.
 */
export const telegramAdresi = (girdi: string) => {
  const m = girdi.trim().match(/^(?:@|(?:https?:\/\/)?t\.me\/(?:s\/)?)?([A-Za-z0-9_]{4,64})\/?$/);
  return m ? `https://t.me/s/${m[1]}` : null;
};

/*
 * Telegram'ın açık haber kanalları (canlı denenip seçildi): anlık flaşlar
 * sitelerin RSS'ine çoğu zaman hiç girmiyor. Web görünümünü kapatan ve
 * aylardır güncellenmeyen kanallar (Sky News Arabia, RT, BBC Arabic) yok.
 */
const TELEGRAM: [string, string][] = [
  ["ajanews", "الجزيرة (تلغرام)"],
  ["alarabiya", "العربية (تلغرام)"],
  ["alhadath", "الحدث (تلغرام)"],
  ["Alhadath_Brk", "الحدث عاجل (تلغرام)"],
  ["asharqnews", "الشرق للأخبار (تلغرام)"],
  ["aa_arabic", "الأناضول (تلغرام)"],
  ["trtarabi", "TRT عربي (تلغرام)"],
  ["france24_ar", "فرانس 24 (تلغرام)"],
  ["arabi21news", "عربي21 (تلغرام)"],
];

export const VARSAYILAN_KAYNAKLAR: GundemKaynagi[] = [
  ...SITELER,
  ...TELEGRAM.map(([k, ad]): GundemKaynagi => ({ id: `gk-tg-${k.toLowerCase()}`, ad, adres: `https://t.me/s/${k}`, dil: "ar", tur: "telegram" })),
  ...ARAMALAR.map(
    ([konu, dil, sorgu]): GundemKaynagi => ({
      id: `gk-ara-${konu}-${dil}`,
      ad: `🔎 ${sorgu}`,
      adres: aramaAdresi(sorgu, dil),
      dil,
      tur: "arama",
    }),
  ),
];

export const gundemKaynaklari = (d: Durum) =>
  d.gundemKaynaklari?.length ? d.gundemKaynaklari : VARSAYILAN_KAYNAKLAR;

/** Kayıtlı listede olmayan kurulu kaynaklar: liste önceden kaydedildiyse yenileri kendiliğinden girmiyor. */
export const eksikVarsayilanlar = (liste: GundemKaynagi[]) =>
  VARSAYILAN_KAYNAKLAR.filter(
    (v) => !liste.some((k) => k.id === v.id || k.adres === v.adres),
  );

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
    // Tuzak: özetteki tek sözcük konu vermez (Paris haberi Sudan'a düşüyordu); Irak başbakanının soyadı Sudan değil.
    h("ماكرون يستقبل رئيس الوزراء اللبناني في باريس", 5, "Örnek B", "بحث اللقاء ملفات إقليمية بينها الأوضاع في السودان"),
    h("محمد شياع السوداني يترأس اجتماعا أمنيا في بغداد", 6, "Örnek A"),
    // Tuzak: "مشاركة" Machar, "الرياضة" Riyad, "حلبة" Halep sayılmamalı (Arapça sözcük sınırı).
    h("مشاركة واسعة في حلبة السباق ضمن مهرجان الرياضة", 4, "Örnek E"),
  ];
};

/* --- Tarayıcıda tutulan son haberler (kişinin kolaylığı; kayıt değil) --- */

const SAKLA = "trt-planlama-gundem";

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
