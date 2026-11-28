import { CalendarClock, Check, Loader2, X } from "lucide-react";
import { kapiHatasi } from "../../yz";
import { useEffect, useState } from "react";
import { Icerik, Kart, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { SaatGirdisi } from "../../bilesenler/TarihSaat";
import { gunAdi, metin, saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { VARSAYILAN_ZAMAN, otoCagriGetir, otoCagriYaz, otoPaketiBirak, type OtoGorunum, type OtoSablon, type OtoZaman } from "../../otoCagri";
import { bugun } from "../../tarih";
import { cagriListesi, kisiBul, useVeri } from "../../veri";
import { CagriListesi } from "../oneri/Eposta";

/*
 * Otomatik öneri çağrısı (Ayarlar; src/otoCagri.ts). Kullanıcı: kart karışıktı,
 * yalnız tasarım değil iş de (anahtar, izin, haftanın günleri, istisnalar, tek tek
 * "gönderme" işaretleri, ayrı sekmeler). Gönderen artık o günün görevlisi
 * (Görevler'de Next Day ve Weekly görevlisi); kart yalnız anahtar, kişinin kendi
 * izni, sıradaki iki çağrı ve kimden gideceği. Saat/metin ve geçmiş katlı.
 * İzin kişinin kendisinde: posta onun kurumsal hesabından gidiyor, kimsenin
 * hesabı habersiz kullanılmasın.
 */

const HATALAR: Record<string, Anahtar> = {
  liste: "otoHataListe",
  eksikKimlik: "otoHataKimlik",
  grup: "otoHataKimlik",
  postaKapali: "otoHataPosta",
  bcc: "otoHataBcc",
  gonderen: "otoHataGonderen",
  izinsiz: "otoHataIzinsiz",
};

export const otoHataMetni = (t: (a: Anahtar) => string, hata?: string) => (hata && HATALAR[hata] ? t(HATALAR[hata]) : (hata ?? ""));

/* Haftalık çağrının günü için: hafta Cumartesi başlar; gün adı örnek tarihten (18 Ekim 2026 Pazar). */
const HAFTA = [6, 0, 1, 2, 3, 4, 5];
const ornekGun = (g: number) => `2026-10-${String(18 + g).padStart(2, "0")}`;

export function OtoCagriKart() {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const [d, setD] = useState<OtoGorunum | null>(null);
  const [hata, setHata] = useState("");
  const [mesgul, setMesgul] = useState(false);

  useEffect(() => {
    void otoCagriGetir().then((r) => (r.tamam ? setD(r.veri) : setHata(kapiHatasi(r))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!d)
    return (
      <Kart baslik={t("otoCagriBaslik")} ikon={<CalendarClock size={18} />}>
        {hata ? <p className="sonuk-yazi">{hata}</p> : <Loader2 size={18} className="donen" />}
      </Kart>
    );

  const sonuc = (r: Awaited<ReturnType<typeof otoCagriYaz>> | { tamam: false; hata: string } | null) => {
    if (!r) return;
    if (!r.tamam) return bildir(r.hata === "kimlik" ? t("otoHataKimlik") : HATALAR[r.hata] ? otoHataMetni(t, r.hata) : kapiHatasi({ hata: r.hata }, `${t("postaKapiYok")} [${r.hata}]`));
    setD(r.veri);
    bildir(t("bKaydedildi"));
  };
  const is = async (f: () => Promise<Parameters<typeof sonuc>[0]>) => {
    setMesgul(true);
    sonuc(await f());
    setMesgul(false);
  };
  const yaz = (g: Record<string, unknown>) => is(() => otoCagriYaz(g));
  /*
   * Anahtar açılınca, izin verilince ya da zaman/metin değişince paket yeniden kurulup
   * bırakılır (görevli, saat ve metin kalemde). Grup adresi olmayan kişi yalnız ayarı yazar;
   * paket izinli birinin tarayıcısında tazelenir.
   */
  const yenidenKur = (g: { acik?: boolean; katil?: boolean; zaman?: OtoZaman; sablon?: OtoSablon }) =>
    is(async () => {
      const r = await otoPaketiBirak(d, g);
      return r && !r.tamam && r.hata === "kimlik" ? otoCagriYaz(g) : r;
    });

  const B = bugun();
  const kisiAdi = (uid: string) => {
    const k = kisiBul(v, uid);
    return k ? ad(k) : "?";
  };
  const simdi = new Date();
  const saat = `${String(simdi.getHours()).padStart(2, "0")}:${String(simdi.getMinutes()).padStart(2, "0")}`;
  const gelecek = d.kalemler.filter((k) => k.gonderim > B || (k.gonderim === B && saat < k.saat));
  const siradakiler = (["nextday", "haftalik"] as const).map((tur) => gelecek.find((k) => k.tur === tur)).filter((k) => !!k);

  return (
    <Kart baslik={t("otoCagriBaslik")} ikon={<CalendarClock size={18} />} ek={d.acik ? t("otoAcikRozet") : undefined}>
      <div className="form" data-oto-cagri>
        <label className="secim">
          <input type="checkbox" checked={d.acik} disabled={mesgul} onChange={(e) => (e.target.checked ? yenidenKur({ acik: true }) : yaz({ acik: false }))} data-oto-cagri-acik />
          {t("otoCagriAc")}
        </label>
        <label className="secim">
          <input type="checkbox" checked={d.izinli} disabled={mesgul} onChange={(e) => (e.target.checked ? yenidenKur({ katil: true }) : yaz({ katil: false }))} data-oto-izin />
          {t("otoIzin")}
        </label>
        {d.acik &&
          siradakiler.map((k) => {
            // Eski pakette görevli yazılı değil: kapı takvimle seçiyor, gösterilen yine gönderen.
            const kim = k.gorevli ?? k.uid;
            return (
              <div key={k.etiket} className="oto-siradaki" data-oto-siradaki={k.etiket}>
                <div className="oto-siradaki-bas">
                  <span>
                    <b>{t(k.tur === "haftalik" ? "haftalik" : "nextday")}</b> <span className="sonuk-yazi">{tarihYaz(k.gonderim, dil)} · {k.saat}</span>
                  </span>
                </div>
                {k.uid ? (
                  <div className="sonuk-yazi" data-oto-gonderen>
                    {t("otoGonderecek", { ad: kisiAdi(k.uid) })}
                  </div>
                ) : (
                  <div className="oto-gonderen-yok" data-oto-gonderen-yok>
                    <span className="kotu-yazi">{kim ? t("otoGorevliIzinsiz", { ad: kisiAdi(kim) }) : t("otoGorevliYok")}</span>
                    {!kim && (
                      <a href="#/gorevler" className="dugme dugme-ikincil dugme-kucuk" data-oto-gorevler>
                        {t("mGorevler")}
                      </a>
                    )}
                  </div>
                )}
                <small className="oto-konu sonuk-yazi">
                  <Icerik>{k.konu}</Icerik>
                </small>
              </div>
            );
          })}
        <details className="oto-katli" data-oto-liste>
          <summary>{t("cagriListesi", { n: cagriListesi(v).length })}</summary>
          <CagriListesi />
        </details>
        <details className="oto-katli" data-oto-zaman>
          <summary>{t("otoZamanMetin")}</summary>
          <ZamanMetin d={d} mesgul={mesgul} kaydet={yenidenKur} />
        </details>
        <details className="oto-katli" data-oto-gecmis>
          <summary>{t("otoGecmis")}</summary>
          {d.gecmis.length ? (
            <div data-oto-gecmis-liste>
              {d.gecmis.slice(0, 10).map((g) => (
                <div key={g.zaman} className="sonuk-yazi" data-oto-gecmis>
                  {g.tamam ? <Check size={14} /> : <X size={14} />} {tarihYaz(g.zaman.slice(0, 10), dil)} {saatYaz(g.zaman, dil)}
                  {g.uid && ` · ${kisiAdi(g.uid)}`} · {g.tamam ? <Icerik>{g.konu}</Icerik> : otoHataMetni(t, g.hata)}
                </div>
              ))}
            </div>
          ) : (
            <p className="sonuk-yazi">{t("otoGecmisYok")}</p>
          )}
        </details>
      </div>
    </Kart>
  );
}

/* Saatler, haftalığın günü, son saat ve metinler; kaydedince çağrılar yeniden kurulur. */
function ZamanMetin({ d, mesgul, kaydet }: { d: OtoGorunum; mesgul: boolean; kaydet: (g: { zaman: OtoZaman; sablon: OtoSablon }) => void }) {
  const { t, dil } = useDil();
  const [z, setZ] = useState<OtoZaman>({ ...VARSAYILAN_ZAMAN, ...d.zaman });
  // Boş şablon kurumun metni: alan onunla dolu açılır, aynısı kaydedilirse boş sayılır.
  const varsayilan = { nd: metin("cagriSablonu", "ar"), hp: metin("haftalikCagriSablonu", "ar") };
  const [s, setS] = useState({ nd: d.sablon.nd ?? varsayilan.nd, hp: d.sablon.hp ?? varsayilan.hp });
  const sablon: OtoSablon = {
    ...(s.nd.trim() && s.nd !== varsayilan.nd && { nd: s.nd }),
    ...(s.hp.trim() && s.hp !== varsayilan.hp && { hp: s.hp }),
  };
  const degisti = JSON.stringify(z) !== JSON.stringify({ ...VARSAYILAN_ZAMAN, ...d.zaman }) || JSON.stringify(sablon) !== JSON.stringify(d.sablon);
  return (
    <div className="form" data-oto-zaman>
      <div className="oto-zamanlar">
        <label className="alan">
          <span>{t("otoNdSaat")}</span>
          <SaatGirdisi value={z.nd} onChange={(e) => setZ({ ...z, nd: e.target.value })} data-oto-nd-saat />
        </label>
        <label className="alan">
          <span>{t("otoSonSaat")}</span>
          <SaatGirdisi value={z.sonSaat} onChange={(e) => setZ({ ...z, sonSaat: e.target.value })} data-oto-son-saat />
        </label>
        <label className="alan">
          <span>{t("otoHpGun")}</span>
          <select className="girdi" value={z.hpGun} onChange={(e) => setZ({ ...z, hpGun: Number(e.target.value) })} data-oto-hp-gun>
            {HAFTA.map((g) => (
              <option key={g} value={g}>
                {gunAdi(ornekGun(g), dil)}
              </option>
            ))}
          </select>
        </label>
        <label className="alan">
          <span>{t("otoHpSaat")}</span>
          <SaatGirdisi value={z.hp} onChange={(e) => setZ({ ...z, hp: e.target.value })} data-oto-hp-saat />
        </label>
      </div>
      {(["nd", "hp"] as const).map((k) => (
        <details key={k} className="oto-metin" data-oto-metin={k}>
          <summary>
            {t(k === "nd" ? "otoNdMetin" : "otoHpMetin")}
            {sablon[k] && ` · ${t("otoDegistirildi")}`}
          </summary>
          <p className="sonuk-yazi">{k === "nd" ? "{gun} {tarih} {saat}" : "{aralik} {adres}"}</p>
          <textarea {...icerikAlani} rows={9} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} data-oto-metin-alani={k} />
          {sablon[k] && (
            <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setS({ ...s, [k]: varsayilan[k] })} data-oto-varsayilan={k}>
              {t("otoVarsayilan")}
            </button>
          )}
        </details>
      ))}
      <div className="dugmeler">
        <button type="button" className="dugme" disabled={mesgul || !degisti} onClick={() => kaydet({ zaman: z, sablon })} data-oto-zaman-kaydet>
          {t("kaydet")}
        </button>
      </div>
    </div>
  );
}
