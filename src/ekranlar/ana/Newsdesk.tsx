import { Clock, ListChecks, Radio, Send } from "lucide-react";
import { useState } from "react";
import type { CizgiOlayi } from "../../anaPano";
import { GunCizgisi } from "../../bilesenler/GunCizgisi";
import { KisiCipi } from "../../bilesenler/KisiCipi";
import { MuhabirAtaDugmesi, NewsdeskRedDugmesi, StogaDondurDugmesi } from "../../bilesenler/NewsdeskIslemleri";
import { AsamaCubugu, Bos, Icerik, Kart, Pencere, Rozet, bildir } from "../../bilesenler/Parcalar";
import { PaketTablosu } from "../../bilesenler/Tablolar";
import { SaatGirdisi } from "../../bilesenler/TarihSaat";
import { tarihYaz, useDil, type Anahtar } from "../../dil";
import { paketTeslimSaati } from "../../eylemler";
import { YAYIN_GRUPLARI, newsdeskSirasi, paketKimde, yayinPaketleri, type YayinGrubu } from "../../newsdesk";
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

/* Sırası Newsdesk'te olan işler (video, yükleme, editoryal denetimdeki parça…) tek kuyrukta. */
export function NewsdeskSiram({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const sira = newsdeskSirasi(v, ben);
  return (
    <Kart baslik={t("siradakiIslerim")} ikon={<ListChecks size={18} />} ek={String(sira.length)}>
      <div data-nd-sira>
        <PaketTablosu paketler={sira} d={v} sutunlar={["baslik", "muhabir", "asama", "teslim"]} bosMetin={t("siraBos")} />
      </div>
    </Kart>
  );
}

const GRUP_ADI: Record<YayinGrubu, Anahtar> = { tbc: "nkGrupTbc", suruyor: "nkGrupSuruyor", teslim: "nkGrupTeslim", red: "nkGrupRed", stok: "nkGrupStok" };

/*
 * Planın paketleri (bugün ya da yarın): muhabiri belli olmayan, süren, teslim
 * edilen, reddedilen ve stoka dönen. Satırda muhabir atama, stoka geri
 * gönderme, reddetme; pakete basınca sayfası.
 */
export function NewsdeskYayin({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [gun, setGun] = useAdimDurumu<"bugun" | "yarin">("newsdesk:gun", "bugun");
  const tarih = gun === "bugun" ? bugun() : gunEkle(bugun(), 1);
  const plan = v.planlar.find((p) => p.tarih === tarih);
  const gruplar = plan ? yayinPaketleri(v, plan) : null;
  const toplam = gruplar ? YAYIN_GRUPLARI.reduce((s, g) => s + gruplar[g].length, 0) : 0;
  return (
    <Kart
      baslik={t("nkYayin")}
      ikon={<Send size={18} />}
      sagUc={
        <span className="sekmeler" role="tablist" data-nd-gun>
          {(["bugun", "yarin"] as const).map((g) => (
            <button key={g} type="button" role="tab" aria-selected={gun === g} className={gun === g ? "acik" : ""} onClick={() => setGun(g)} data-nd-gun-sec={g}>
              {t(g)}
            </button>
          ))}
        </span>
      }
    >
      <div data-nd-yayin={plan?.id ?? ""}>
        {!plan ? (
          <Bos kucuk metin={t("nkPlanYok")} />
        ) : (
          <>
            <p className="nd-plan-satir">
              <a href={`#/nextday/${plan.id}`}>
                {t("nextday")} · {tarihYaz(plan.tarih, dil, "uzun")}
              </a>{" "}
              {!newsdeskteMi(plan) && <Rozet ton="uyari">{t("nkPlanOnaysiz")}</Rozet>}
            </p>
            {!toplam && <Bos kucuk metin={t("kayitYok")} />}
            {YAYIN_GRUPLARI.filter((g) => gruplar![g].length).map((g) => (
              <section key={g} className={`nd-grup nd-grup-${g}`} data-nd-grup={g}>
                <h3>
                  {t(GRUP_ADI[g])} <span className="sonuk">{gruplar![g].length}</span>
                </h3>
                <ul className="liste nd-liste">
                  {gruplar![g].map((p) => (
                    <PaketSatiri key={p.id} ben={ben} paket={p} />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </Kart>
  );
}

function PaketSatiri({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const v = useVeri();
  const muhabir = kisiBul(v, paket.muhabirId);
  const { asama, kimde } = paketKimde(v, paket);
  const bitti = paket.durum === "tamamlandi" || paket.stok;
  return (
    <li className="nd-paket" data-nd-paket={paket.id}>
      <div className="ad">
        <a href={`#/paketler/${paket.id}`}>
          <Icerik>{paket.baslik}</Icerik>
        </a>
        <small className="sonuk">
          {[paket.teslim && `${gmt(paket.teslim)} GMT`, !bitti && asama, !bitti && kimde && birimAdi(kimde)].filter(Boolean).join(" · ")}
        </small>
      </div>
      <span className="nd-muhabir">
        {muhabir && !paket.muhabirTbc ? <KisiCipi ben={ben} kisi={muhabir} konu={paket.baslik} /> : <Rozet ton="uyari">TBC</Rozet>}
        <MuhabirAtaDugmesi ben={ben} paket={paket} ikon={!!muhabir && !paket.muhabirTbc} />
      </span>
      {!bitti && <AsamaCubugu paket={paket} />}
      <span className="nd-islem">
        <StogaDondurDugmesi ben={ben} paket={paket} ikon />
        <NewsdeskRedDugmesi ben={ben} paket={paket} ikon />
      </span>
    </li>
  );
}

/* Bugünün canlı yayınları: saat sırasıyla, satırda "yapıldı/yapılmadı" ve düzenleme. */
export function NewsdeskCanlilar({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [secili, setSecili] = useState<string | null>(null);
  const b = bugun();
  const canlilar = v.canliYayinlar.filter((c) => c.tarih === b || (!c.tarih && planBul(v, c.planId)?.tarih === b)).sort((x, y) => (x.saatGmt || "~").localeCompare(y.saatGmt || "~"));
  const c = canlilar.find((x) => x.id === secili);
  return (
    <Kart baslik={t("canliYayinlar")} ikon={<Radio size={18} />} ek={String(canlilar.length)}>
      {canlilar.length ? (
        <ul className="liste" data-nd-canlilar>
          {canlilar.map((x) => (
            <li key={x.id} data-nd-canli-satir={x.id}>
              <div className="ad">
                <button type="button" className="bag-dugme" onClick={() => setSecili(x.id)}>
                  <b>{x.saatGmt ? `${x.saatGmt}G` : "TBC"}</b> <Icerik>{x.konu}</Icerik>
                </button>
                {x.muhabirId && <small className="sonuk">{ad(kisiBul(v, x.muhabirId))}</small>}
              </div>
              <span className="nd-sonuc">
                {x.sonuc ? <Rozet ton={x.sonuc.durum === "yapildi" ? "iyi" : "kotu"}>{t(x.sonuc.durum === "yapildi" ? "yapildi" : "yapilmadi")}</Rozet> : <Clock size={14} aria-hidden="true" />}
                <CanliSonucDugmeleri ben={ben} canli={x} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Bos kucuk metin={t("kayitYok")} />
      )}
      {c && <CanliPenceresi ben={ben} canli={c} kapat={() => setSecili(null)} />}
    </Kart>
  );
}
