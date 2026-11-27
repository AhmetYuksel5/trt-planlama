import { Archive, Clock, ListTodo, Radio, Send } from "lucide-react";
import { useState, type ReactNode } from "react";
import { MesajRozeti } from "../../bilesenler/MesajRozeti";
import { BICIM_ADI, paketYeri } from "../../etiketler";
import type { CizgiOlayi } from "../../anaPano";
import { GunCizgisi } from "../../bilesenler/GunCizgisi";
import { KisiCipi } from "../../bilesenler/KisiCipi";
import { MuhabirAtaDugmesi, NewsdeskRedDugmesi, StogaDondurDugmesi } from "../../bilesenler/NewsdeskIslemleri";
import { AsamaCubugu, Bos, Icerik, Kart, PaketDurumRozeti, Pencere, Rozet, bildir } from "../../bilesenler/Parcalar";
import { SaatGirdisi } from "../../bilesenler/TarihSaat";
import { tarihYaz, useDil, type Anahtar } from "../../dil";
import { paketTeslimSaati } from "../../eylemler";
import { NEWSDESK_BOLUMLERI, YAYIN_GRUPLARI, bugunkuCanlilar, newsdeskArsivi, newsdeskKararlari, newsdeskSirasi, paketKimde, yayinPaketleri, type NewsdeskBolumu, type YayinGrubu } from "../../newsdesk";
import { bugun, gunEkle } from "../../tarih";
import { kisiBul, paketBul, planBul, useVeri, type CanliYayin, type Kisi, type Paket } from "../../veri";
import { birimAdi } from "../../yapi";
import { newsdeskteMi, paketTeslimSaatiDegisebilir } from "../../yetki";
import { penceredenGit, useAdimDurumu } from "../../yol";
import { CanliFormu } from "../nextday/Formlar";
import { CanliSonucDugmeleri } from "../nextday/SatirIslemleri";

/*
 * Newsdesk'in ana sayfası (kullanıcı: onaylanan Next Day Newsdesk'in
 * kontrolünde; Planlama'daki zaman çizgisi burada da, beklenen şeylere basıp
 * pratikçe güncellensin; muhabiri Newsdesk de atasın; yayınlanmayan paket
 * stoka dönsün; teslim gerekçeyle reddedilsin). EP, ücret ve nitelik puanı yok.
 * Kurallar newsdesk.ts'de.
 */

const gmt = (iso?: string) => (iso ? new Date(iso).toISOString().slice(11, 16) : "");

/* Zaman çizgisi: canlıya basınca formu ve "yapıldı/yapılmadı", pakete basınca hızlı pencere. */
export function NewsdeskCizgisi({ ben }: { ben: Kisi }) {
  const [secili, setSecili] = useState<CizgiOlayi | null>(null);
  const v = useVeri();
  const canli = secili?.tur === "canli" ? v.canliYayinlar.find((c) => c.id === secili.id) : undefined;
  const paket = secili?.tur === "paket" ? paketBul(v, secili.id) : undefined;
  return (
    <div className="nd-cizgi">
      <GunCizgisi paketler ac={setSecili} />
      {canli && <CanliPenceresi ben={ben} canli={canli} kapat={() => setSecili(null)} />}
      {paket && <PaketPenceresi ben={ben} paket={paket} kapat={() => setSecili(null)} />}
    </div>
  );
}

function CanliPenceresi({ ben, canli, kapat }: { ben: Kisi; canli: CanliYayin; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const plan = planBul(v, canli.planId);
  return (
    <Pencere baslik={<Icerik>{canli.konu}</Icerik>} alt={canli.saatGmt ? `${canli.saatGmt} GMT` : undefined} kapat={kapat} icerikBasligi>
      <div className="nd-pencere" data-nd-canli={canli.id}>
        <div className="nd-sonuc">
          <CanliSonucDugmeleri ben={ben} canli={canli} />
        </div>
        {plan ? (
          <CanliFormu plan={plan} planBaslikId={canli.planBaslikId} mevcut={canli} kapat={kapat} />
        ) : (
          <a href={`#/nextday/${canli.planId}`} onClick={(e) => penceredenGit(e, kapat, `#/nextday/${canli.planId}`)}>
            {t("ac")}
          </a>
        )}
      </div>
    </Pencere>
  );
}

/* Beklenen paket: teslim saati, muhabir, aşama ve Newsdesk'in kararları tek pencerede. */
function PaketPenceresi({ ben, paket, kapat }: { ben: Kisi; paket: Paket; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const [saat, setSaat] = useState(gmt(paket.teslim));
  const { asama, kimde } = paketKimde(v, paket);
  const muhabir = kisiBul(v, paket.muhabirId);
  const yol = `#/paketler/${paket.id}`;
  return (
    <Pencere baslik={<Icerik>{paket.baslik}</Icerik>} alt={paket.kod} kapat={kapat} icerikBasligi>
      <div className="nd-pencere form" data-nd-paket-penceresi={paket.id}>
        <p className="nd-pencere-satir">
          {muhabir && !paket.muhabirTbc ? <KisiCipi ben={ben} kisi={muhabir} konu={paket.baslik} /> : <Rozet ton="uyari">TBC</Rozet>} <MuhabirAtaDugmesi ben={ben} paket={paket} />
        </p>
        <p className="nd-pencere-satir">
          <AsamaCubugu paket={paket} /> <small className="sonuk">{[asama, kimde && birimAdi(kimde)].filter(Boolean).join(" · ")}</small>
        </p>
        {paketTeslimSaatiDegisebilir(ben, v, paket) && (
          <label>
            {t("nkTeslimSaati")}
            <span className="nd-saat">
              <SaatGirdisi value={saat} onChange={(e) => setSaat(e.target.value)} data-nd-teslim-saati />
              <button
                type="button"
                className="dugme dugme-ikincil dugme-kucuk"
                disabled={!saat || saat === gmt(paket.teslim)}
                onClick={() => paketTeslimSaati(ben, paket.id, saat) && bildir(t("nkTeslimSaatiKaydedildi"))}
                data-nd-teslim-kaydet
              >
                {t("kaydet")}
              </button>
            </span>
          </label>
        )}
        <p className="nd-pencere-satir">
          <StogaDondurDugmesi ben={ben} paket={paket} kucuk={false} /> <NewsdeskRedDugmesi ben={ben} paket={paket} kucuk={false} />
        </p>
        <a className="dugme dugme-ikincil" href={yol} onClick={(e) => penceredenGit(e, kapat, yol)}>
          {t("paketiAc")}
        </a>
      </div>
    </Pencere>
  );
}

/*
 * Newsdesk'in sayfası Programlar'ın kalıbıyla (kullanıcı: masaların tasarım
 * dili; ana sayfa Planlama'nınki gibi sabit, altında kişinin özelleştirdiği
 * alan). Kutucuklar bağlantı ("#/newsdesk/<bölüm>"; menü ve alt çubuk
 * adresten vurgulanıyor). Ana sayfada (ozet) üstte bugünün kararları ve zaman
 * çizgisi; seçili bölümün içeriği kutucukların altında.
 */
const BOLUM_ADI: Record<NewsdeskBolumu, Anahtar> = { sira: "siradakiIslerim", yayin: "nkYayin", canli: "nkCanlilar", arsiv: "pmArsiv" };
const BOLUM_IKONU: Record<NewsdeskBolumu, ReactNode> = {
  sira: <ListTodo size={22} />,
  yayin: <Send size={22} />,
  canli: <Radio size={22} />,
  arsiv: <Archive size={22} />,
};

export function NewsdeskSayfasi({ ben, ilk = "sira", ozet }: { ben: Kisi; ilk?: NewsdeskBolumu; ozet?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const b = bugun();
  const bolum = (NEWSDESK_BOLUMLERI as readonly string[]).includes(ilk) ? ilk : "sira";
  const k = newsdeskKararlari(v, ben, b);
  const bugunPlan = v.planlar.find((p) => p.tarih === b);
  const bugunPaket = bugunPlan ? YAYIN_GRUPLARI.reduce((s, g) => s + yayinPaketleri(v, bugunPlan)[g].length, 0) : 0;
  const arsiv = newsdeskArsivi(v, b).reduce((s, x) => s + x.paketler.length, 0);
  const bilgi: Record<NewsdeskBolumu, { alt: string; say: number }> = {
    sira: { alt: t("nkSiraAlt", { n: k.sira }), say: k.sira },
    yayin: { alt: t("nkYayinAlt", { n: bugunPaket }), say: k.tbc },
    canli: { alt: t("nkCanliAlt", { n: bugunkuCanlilar(v, b).length }), say: k.canli },
    arsiv: { alt: t("nkArsivAlt", { n: arsiv }), say: 0 },
  };
  return (
    <div className={`prg-masa masa-newsdesk${!ozet && ilk ? " bolumde" : ""}`} data-newsdesk-sayfasi>
      {ozet && <KararOzeti k={k} />}
      {ozet && <NewsdeskCizgisi ben={ben} />}
      <div className="prg-kutular kutu-4" role="tablist">
        {NEWSDESK_BOLUMLERI.map((x) => (
          <a key={x} href={`#/newsdesk/${x}`} role="tab" aria-selected={bolum === x} className={`prg-kutu prg-k-nd-${x}${bolum === x ? " secili" : ""}`} data-nd-kutu={x}>
            <span className="prg-kutu-ik">{BOLUM_IKONU[x]}</span>
            <b>{t(BOLUM_ADI[x])}</b>
            <small>{bilgi[x].alt}</small>
            {bilgi[x].say > 0 && <em className="prg-say">{bilgi[x].say}</em>}
          </a>
        ))}
      </div>
      {bolum === "sira" && <NewsdeskSiram ben={ben} />}
      {bolum === "yayin" && <NewsdeskYayin ben={ben} />}
      {bolum === "canli" && <NewsdeskCanlilar ben={ben} />}
      {bolum === "arsiv" && <NewsdeskArsiv ben={ben} />}
    </div>
  );
}

/* Ana sayfanın başı (Programlar'daki gibi): bugün karar verilecekler; yoksa çizilmez. */
function KararOzeti({ k }: { k: ReturnType<typeof newsdeskKararlari> }) {
  const { t } = useDil();
  const satirlar = [
    { n: k.sira, ad: "nkKararSira" as Anahtar, href: "#/newsdesk/sira", o: "sira" },
    { n: k.tbc, ad: "nkKararTbc" as Anahtar, href: "#/newsdesk/yayin", o: "tbc" },
    { n: k.canli, ad: "nkKararCanli" as Anahtar, href: "#/newsdesk/canli", o: "canli" },
  ].filter((x) => x.n > 0);
  if (!satirlar.length) return null;
  return (
    <div className="prg-ozet" data-prg-ozet>
      <span className="prg-bugun-bas">{t("pmKararlarim")}</span>
      {satirlar.map((x) => (
        <a key={x.o} href={x.href} className="prg-ozet-oge" data-prg-ozet-oge={x.o}>
          <b>{x.n}</b> {t(x.ad)}
        </a>
      ))}
    </div>
  );
}

/*
 * Paketin kartı (masaların içerik kartının biçimi): tür, yer, teslim saati ve
 * durum; başlık; muhabir (TBC'de atama), aşama · kimde; Newsdesk'in işleri.
 */
function NdPaketKarti({ ben, p }: { ben: Kisi; p: Paket }) {
  const { t } = useDil();
  const v = useVeri();
  const muhabir = kisiBul(v, p.muhabirId);
  const bitti = p.durum === "tamamlandi" || !!p.stok;
  const { asama, kimde } = paketKimde(v, p);
  return (
    <div className="prg-icerik" data-nd-paket={p.id}>
      <div className="prg-icerik-ust">
        <Rozet ton="masa">{t(BICIM_ADI(p.bicim ?? "pkg"))}</Rozet>
        <Icerik>{paketYeri(p)}</Icerik>
        {p.teslim && <span className="soluk">· {gmt(p.teslim)} GMT</span>}
        <span className="bosluk-esnek" />
        <PaketDurumRozeti paket={p} />
      </div>
      <a href={`#/paketler/${p.id}`} className="prg-icerik-baslik">
        <Icerik blok>{p.baslik}</Icerik>
      </a>
      {!bitti && (
        <div className="prg-icerik-alt">
          <AsamaCubugu paket={p} />
          <span className="soluk">{[asama, kimde && birimAdi(kimde)].filter(Boolean).join(" · ")}</span>
        </div>
      )}
      <div className="prg-icerik-alt">
        {muhabir && !p.muhabirTbc ? <KisiCipi ben={ben} kisi={muhabir} konu={p.baslik} /> : <Rozet ton="uyari">TBC</Rozet>}
        <MuhabirAtaDugmesi ben={ben} paket={p} ikon={!!muhabir && !p.muhabirTbc} />
        {!bitti && <MesajRozeti ben={ben} paket={p} />}
        <span className="bosluk-esnek" />
        <StogaDondurDugmesi ben={ben} paket={p} ikon />
        <NewsdeskRedDugmesi ben={ben} paket={p} ikon />
      </div>
    </div>
  );
}

const Kartlar = ({ ben, paketler }: { ben: Kisi; paketler: Paket[] }) => (
  <div className="prg-icerikler">
    {paketler.map((p) => (
      <NdPaketKarti key={p.id} ben={ben} p={p} />
    ))}
  </div>
);

/* Sırası Newsdesk'te olan işler (video, yükleme, editoryal denetimdeki parça…) tek kuyrukta, teslim saatine göre. */
function NewsdeskSiram({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const sira = newsdeskSirasi(v, ben);
  return (
    <Kart baslik={t("siradakiIslerim")} ikon={<ListTodo size={18} />} ek={String(sira.length)}>
      <div data-nd-sira>{sira.length ? <Kartlar ben={ben} paketler={sira} /> : <Bos metin={t("siraBos")} />}</div>
    </Kart>
  );
}

const GRUP_ADI: Record<YayinGrubu, Anahtar> = { tbc: "nkGrupTbc", suruyor: "nkGrupSuruyor", teslim: "nkGrupTeslim", red: "nkGrupRed", stok: "nkGrupStok" };

/*
 * Planın paketleri (bugün ya da yarın): muhabiri belli olmayan, süren, teslim
 * edilen, reddedilen, stoka dönen; masaların alan sekmeleri gibi. İlk açılışta
 * dolu ilk grup.
 */
function NewsdeskYayin({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [gun, setGun] = useAdimDurumu<"bugun" | "yarin">("newsdesk:gun", "bugun");
  const tarih = gun === "bugun" ? bugun() : gunEkle(bugun(), 1);
  const plan = v.planlar.find((p) => p.tarih === tarih);
  const gruplar = plan ? yayinPaketleri(v, plan) : null;
  const ilkGrup = (gruplar && YAYIN_GRUPLARI.find((g) => gruplar[g].length)) ?? "suruyor";
  const [secili, setGrup] = useAdimDurumu<YayinGrubu | "">("newsdesk:grup", "");
  const grup = secili || ilkGrup;
  return (
    <Kart
      baslik={t("nkYayin")}
      ikon={<Send size={18} />}
      sagUc={
        <span className="prg-seg" role="tablist" data-nd-gun>
          {(["bugun", "yarin"] as const).map((g) => (
            <button key={g} type="button" role="tab" aria-selected={gun === g} className={gun === g ? "acik" : ""} onClick={() => setGun(g)} data-nd-gun-sec={g}>
              {t(g)}
            </button>
          ))}
        </span>
      }
    >
      <div data-nd-yayin={plan?.id ?? ""}>
        {!plan || !gruplar ? (
          <Bos metin={t("nkPlanYok")} />
        ) : (
          <>
            <p className="nd-plan-satir">
              <a href={`#/nextday/${plan.id}`}>
                {t("nextday")} · {tarihYaz(plan.tarih, dil, "uzun")}
              </a>{" "}
              {!newsdeskteMi(plan) && <Rozet ton="uyari">{t("nkPlanOnaysiz")}</Rozet>}
            </p>
            <div className="prg-seg" role="tablist" data-nd-gruplar>
              {YAYIN_GRUPLARI.map((g) => (
                <button key={g} type="button" role="tab" aria-selected={g === grup} className={g === grup ? "acik" : ""} onClick={() => setGrup(g)} data-nd-grup-sec={g}>
                  {t(GRUP_ADI[g])} <em>{gruplar[g].length}</em>
                </button>
              ))}
            </div>
            <div data-nd-grup={grup}>{gruplar[grup].length ? <Kartlar ben={ben} paketler={gruplar[grup]} /> : <Bos metin={t("kayitYok")} />}</div>
          </>
        )}
      </div>
    </Kart>
  );
}

/* Bugünün canlı yayınları: saat sırasıyla, kartta "yapıldı/yapılmadı"; konuya basınca form. */
function NewsdeskCanlilar({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [secili, setSecili] = useState<string | null>(null);
  const canlilar = bugunkuCanlilar(v, bugun());
  const c = canlilar.find((x) => x.id === secili);
  return (
    <Kart baslik={t("nkCanlilar")} ikon={<Radio size={18} />} ek={String(canlilar.length)}>
      {canlilar.length ? (
        <div className="prg-icerikler" data-nd-canlilar>
          {canlilar.map((x) => (
            <div key={x.id} className="prg-icerik" data-nd-canli-satir={x.id}>
              <div className="prg-icerik-ust">
                <Rozet ton="masa">LIVE</Rozet>
                <b>{x.saatGmt ? `${x.saatGmt} GMT` : "TBC"}</b>
                {x.yer && <Icerik>{x.yer}</Icerik>}
                <span className="bosluk-esnek" />
                {x.sonuc ? <Rozet ton={x.sonuc.durum === "yapildi" ? "iyi" : "kotu"}>{t(x.sonuc.durum === "yapildi" ? "yapildi" : "yapilmadi")}</Rozet> : <Clock size={14} aria-hidden="true" />}
              </div>
              <button type="button" className="prg-icerik-baslik bag-dugme" onClick={() => setSecili(x.id)}>
                <Icerik blok>{x.konu}</Icerik>
              </button>
              <div className="prg-icerik-alt">
                <span className="soluk">{x.muhabirId ? ad(kisiBul(v, x.muhabirId)) : t("atanmadi")}</span>
                <span className="bosluk-esnek" />
                <CanliSonucDugmeleri ben={ben} canli={x} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Bos metin={t("kayitYok")} />
      )}
      {c && <CanliPenceresi ben={ben} canli={c} kapat={() => setSecili(null)} />}
    </Kart>
  );
}

/* Arşiv: son yedi günün planlarında teslim edilen, reddedilen, stoka dönen paketler, gün gün. */
function NewsdeskArsiv({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const gunler = newsdeskArsivi(v, bugun());
  return (
    <Kart baslik={t("pmArsiv")} ikon={<Archive size={18} />}>
      {gunler.length ? (
        <div className="prg-arsiv" data-nd-arsiv>
          {gunler.map(({ plan, paketler }) => (
            <section key={plan.id} className="prg-arsiv-ay">
              <h3>{tarihYaz(plan.tarih, dil, "uzun")}</h3>
              <Kartlar ben={ben} paketler={paketler} />
            </section>
          ))}
        </div>
      ) : (
        <Bos metin={t("kayitYok")} />
      )}
    </Kart>
  );
}
