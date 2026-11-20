import { CalendarClock, Check, Loader2, Plus, X } from "lucide-react";
import { kapiHatasi } from "../../yz";
import { useEffect, useState } from "react";
import { Icerik, Kart, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { SaatGirdisi, TarihGirdisi } from "../../bilesenler/TarihSaat";
import { gunAdi, metin, saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { VARSAYILAN_ZAMAN, otoCagriGetir, otoCagriYaz, otoPaketiBirak, type OtoGorunum, type OtoSablon, type OtoZaman } from "../../otoCagri";
import { bugun, gunEkle } from "../../tarih";
import { kisiBul, useVeri } from "../../veri";

/*
 * Otomatik öneri çağrısı (Ayarlar; src/otoCagri.ts). Kullanıcı: metin,
 * gönderim zamanı ve hangi gün kimin göndereceği ayarlansın, kalabalık
 * olmasın. Üstte açık/kapalı ve sıradaki çağrılar; ayrıntı üç sekmede
 * (takvim, zaman ve metin, geçmiş), aynı anda biri.
 * Takvime yalnız "Benim hesabımdan gönderilebilir" diyen konuyor: posta onun
 * kurumsal hesabından gidiyor, kimsenin hesabı habersiz kullanılmasın.
 */

const HATALAR: Record<string, Anahtar> = {
  liste: "otoHataListe",
  eksikKimlik: "otoHataKimlik",
  grup: "otoHataKimlik",
  postaKapali: "otoHataPosta",
  bcc: "otoHataBcc",
  gonderen: "otoHataGonderen",
  izinsiz: "otoHataGonderen",
};

export const otoHataMetni = (t: (a: Anahtar) => string, hata?: string) => (hata && HATALAR[hata] ? t(HATALAR[hata]) : (hata ?? ""));

/* Hafta Cumartesi başlıyor; gün adı örnek tarihten (18 Ekim 2026 Pazar). */
const HAFTA = [6, 0, 1, 2, 3, 4, 5];
const ornekGun = (g: number) => `2026-10-${String(18 + g).padStart(2, "0")}`;

type Sekme = "takvim" | "zaman" | "gecmis";
const SEKMELER: [Sekme, Anahtar][] = [
  ["takvim", "otoTakvim"],
  ["zaman", "otoZamanMetin"],
  ["gecmis", "otoGecmis"],
];

export function OtoCagriKart() {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const [d, setD] = useState<OtoGorunum | null>(null);
  const [hata, setHata] = useState("");
  const [mesgul, setMesgul] = useState(false);
  const [sekme, setSekme] = useState<Sekme>("takvim");

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
   * Zaman ya da metin değişince çağrılar yeniden kurulup bırakılıyor (saat ve metin kalemde).
   * Grup adresi olmayan kişi yalnız ayarı yazar; liste gönderen listesindekinin tarayıcısında tazelenir.
   */
  const yenidenKur = (g: { acik?: boolean; zaman?: OtoZaman; sablon?: OtoSablon }) =>
    is(async () => {
      const r = await otoPaketiBirak(d, g);
      return r && !r.tamam && r.hata === "kimlik" ? otoCagriYaz(g) : r;
    });

  const B = bugun();
  const kisiAdi = (uid: string) => {
    const k = kisiBul(v, uid);
    return k ? ad(k) : uid ? "?" : "—";
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
        {/*
         * Sıradaki çağrılar (kullanıcı: telefonda çok karışıktı; ters dönen "Bunu gönderme /
         * Gönderilsin" düğmesi, ne yapılacağını söylemeyen kırmızı uyarı, iki satırlık konu).
         * Satır: tür, gün ve saat, "Gönderilsin" kutusu; altında gönderen ya da o güne
         * gönderen seçimi (o tarihe istisna yazar); en altta konu, tek satır.
         */}
        {d.acik &&
          siradakiler.map((k) => {
            const atlandi = d.atla.includes(k.etiket);
            return (
              <div key={k.etiket} className={`oto-siradaki${atlandi ? " atlandi" : ""}`} data-oto-siradaki={k.etiket}>
                <div className="oto-siradaki-bas">
                  <span>
                    <b>{t(k.tur === "haftalik" ? "haftalik" : "nextday")}</b> <span className="sonuk-yazi">{tarihYaz(k.gonderim, dil)} · {k.saat}</span>
                  </span>
                  <label className="secim">
                    <input
                      type="checkbox"
                      checked={!atlandi}
                      disabled={mesgul}
                      onChange={() => yaz({ atla: atlandi ? d.atla.filter((e) => e !== k.etiket) : [...d.atla, k.etiket] })}
                      data-oto-atla
                    />
                    {t("otoGonderilsin")}
                  </label>
                </div>
                {!atlandi &&
                  (k.uid ? (
                    <div className="sonuk-yazi" data-oto-gonderen>
                      {t("otoGonderenSec")}: {kisiAdi(k.uid)}
                    </div>
                  ) : (
                    <div className="oto-gonderen-yok" data-oto-gonderen-yok>
                      <span className="kotu-yazi">{t("otoGonderenYokGun")}</span>
                      {d.gonderenler.length ? (
                        <select
                          className="girdi"
                          value=""
                          disabled={mesgul}
                          aria-label={t("otoGonderenSec")}
                          onChange={(e) => e.target.value && yaz({ istisna: { ...d.istisna, [k.gonderim]: e.target.value } })}
                          data-oto-gonderen-sec
                        >
                          <option value="">{t("otoGonderenSecin")}</option>
                          {d.gonderenler.map((u) => (
                            <option key={u} value={u}>
                              {kisiAdi(u)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="sonuk-yazi">{t("otoGonderenListesiBos")}</span>
                      )}
                    </div>
                  ))}
                <small className="oto-konu sonuk-yazi">
                  <Icerik>{k.konu}</Icerik>
                </small>
              </div>
            );
          })}
        <div className="sekmeler" role="tablist" data-oto-sekmeler>
          {SEKMELER.map(([x, a]) => (
            <button key={x} type="button" role="tab" aria-selected={sekme === x} className={sekme === x ? "acik" : ""} onClick={() => setSekme(x)} data-oto-sekme={x}>
              {t(a)}
            </button>
          ))}
        </div>
        {sekme === "takvim" && <Takvim d={d} mesgul={mesgul} yaz={yaz} kisiAdi={kisiAdi} />}
        {sekme === "zaman" && <ZamanMetin d={d} mesgul={mesgul} kaydet={yenidenKur} />}
        {sekme === "gecmis" &&
          (d.gecmis.length ? (
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
          ))}
      </div>
    </Kart>
  );
}

/* Haftanın her günü bir gönderen; belli günler için istisna (o gün başkası ya da kimse). */
function Takvim({ d, mesgul, yaz, kisiAdi }: { d: OtoGorunum; mesgul: boolean; yaz: (g: Record<string, unknown>) => void; kisiAdi: (uid: string) => string }) {
  const { t, dil } = useDil();
  const [gun, setGun] = useState("");
  const [kim, setKim] = useState("");
  const secenekler = (
    <>
      <option value="">—</option>
      {d.gonderenler.map((u) => (
        <option key={u} value={u}>
          {kisiAdi(u)}
        </option>
      ))}
    </>
  );
  const istisnalar = Object.entries(d.istisna).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="form" data-oto-takvim>
      <label className="secim">
        <input type="checkbox" checked={d.izinli} disabled={mesgul} onChange={(e) => yaz({ katil: e.target.checked })} data-oto-izin />
        {t("otoIzin")}
      </label>
      <div className="oto-hafta" data-oto-hafta>
        {HAFTA.map((g) => (
          <label key={g} className="oto-gun">
            <span>{gunAdi(ornekGun(g), dil)}</span>
            <select className="girdi" value={d.haftalik[String(g)] ?? ""} disabled={mesgul || !d.gonderenler.length} onChange={(e) => yaz({ haftalik: { ...d.haftalik, [String(g)]: e.target.value } })} data-oto-gun={g}>
              {secenekler}
            </select>
          </label>
        ))}
      </div>
      <div className="alan-etiket">{t("otoIstisna")}</div>
      {istisnalar.map(([g, u]) => (
        <div key={g} className="oto-istisna" data-oto-istisna={g}>
          <span>
            {tarihYaz(g, dil)} · {u ? kisiAdi(u) : t("otoKimseYok")}
          </span>
          <button
            type="button"
            className="ikon-dugme"
            disabled={mesgul}
            title={t("cikar")}
            aria-label={t("cikar")}
            onClick={() => yaz({ istisna: Object.fromEntries(istisnalar.filter(([x]) => x !== g)) })}
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <div className="oto-istisna-ekle">
        <TarihGirdisi value={gun} min={bugun()} max={gunEkle(bugun(), 60)} onChange={(e) => setGun(e.target.value)} data-oto-istisna-gun />
        <select className="girdi" value={kim} onChange={(e) => setKim(e.target.value)} aria-label={t("otoGonderenSec")} data-oto-istisna-kim>
          <option value="">{t("otoKimseYok")}</option>
          {d.gonderenler.map((u) => (
            <option key={u} value={u}>
              {kisiAdi(u)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="dugme dugme-ikincil dugme-kucuk"
          disabled={mesgul || !gun}
          onClick={() => {
            yaz({ istisna: { ...d.istisna, [gun]: kim } });
            setGun("");
          }}
          data-oto-istisna-ekle
        >
          <Plus size={14} /> {t("ekle")}
        </button>
      </div>
    </div>
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
