import { KeyRound, Loader2, Pencil, Plus, RefreshCw, Sparkles, Trash2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Kart, NotKutu, Pencere, Rozet, bildir } from "../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../dil";
import { GERCEK } from "../kip";
import { birimAdi, kisiBirimleri } from "../yapi";
import { YZ_OZELLIKLERI, useYz, yzAyarOku, yzHataMetni, yzModeller, yzAyarYaz, yzSaglayiciDene, type SaglayiciTuru, type YzAyar, type YzOzellik, type YzOzellikAyari, type YzSaglayici } from "../yz";
import { FormAlt } from "./nextday/Formlar";

/*
 * Ayarlar › Yapay zeka (yalnız tam yönetici). Sağlayıcılar ve anahtarları
 * yapay zeka kapısında (worker/) duruyor; bu kart onu okuyup yazıyor.
 * Anahtar yalnız yazılıyor: ekrana son dört hanesi geliyor. Demoda kapıya
 * gidilmiyor.
 */


const OZELLIK_ADI: Record<YzOzellik, Anahtar> = { kisalt: "yzKisalt", bicimle: "yzBicimle", haberDegeri: "yzHaberDegeri", takipMetni: "yzTakipMetni" };
const TUR_ADI: Record<SaglayiciTuru, Anahtar> = { anthropic: "yzTurClaude", openai: "yzTurOpenai" };
const VARSAYILAN_OZELLIK: YzOzellikAyari = { acik: false, birimler: [], gunlukSinir: 50 };

export function YapayZekaAyari() {
  const { t } = useDil();
  const [ayar, setAyar] = useState<YzAyar | null>(null);
  const [hata, setHata] = useState("");
  const [ozellikler, setOzellikler] = useState<YzAyar["ozellikler"]>({});
  const [pencere, setPencere] = useState<YzSaglayici | "yeni" | null>(null);

  useEffect(() => {
    if (!GERCEK) return;
    void yzAyarOku().then((r) => {
      if (r.tamam) {
        setAyar(r.veri);
        setOzellikler(r.veri.ozellikler);
      } else setHata(`${yzHataMetni(t, r.hata)}${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
    });
  }, []);

  const yaz = async (yeni: YzAyar) => {
    const r = await yzAyarYaz(yeni);
    if (!r.tamam) {
      bildir(yzHataMetni(t, r.hata));
      return false;
    }
    setAyar({ ...r.veri, kullanim: ayar?.kullanim });
    setOzellikler(r.veri.ozellikler);
    bildir(t("bKaydedildi"));
    return true;
  };

  if (!GERCEK)
    return (
      <Kart baslik={t("yzBaslik")} ikon={<Sparkles size={18} />}>
        <p className="sonuk" data-yz-demo>
          {t("yzDemoda")}
        </p>
      </Kart>
    );

  return (
    <Kart baslik={t("yzBaslik")} ikon={<Sparkles size={18} />}>
      <div data-yz-ayar>
        {hata ? (
          <NotKutu ton="uyari">
            <span data-yz-hata>{hata}</span>
          </NotKutu>
        ) : !ayar ? (
          <p className="sonuk">{t("yukleniyor")}</p>
        ) : (
          <>
            <div className="alan-etiket">{t("yzSaglayicilar")}</div>
            <ul className="liste">
              {ayar.saglayicilar.map((s) => (
                <li key={s.id} className="kayit" data-yz-saglayici={s.id}>
                  <div className="kayit-bas">
                    <div>
                      <b>{s.ad}</b>
                      <small>
                        {t(TUR_ADI[s.tur])} · <bdi>{s.model}</bdi> ·{" "}
                        {s.anahtarSonu ? (
                          <>
                            <KeyRound size={12} /> ••••{s.anahtarSonu}
                          </>
                        ) : (
                          t("yzAnahtarYok")
                        )}{" "}
                        {!s.aktif && <Rozet>{t("yzKapali")}</Rozet>}
                      </small>
                    </div>
                    <div className="islemler">
                      <button
                        type="button"
                        className="dugme dugme-sade dugme-ikon"
                        title={t("yzDene")}
                        aria-label={t("yzDene")}
                        onClick={async () => {
                          const r = await yzSaglayiciDene(s.id);
                          // Sağlayıcının kendi hata metni de yazılıyor: anahtar mı, model adı mı, kota mı, görülsün.
                          bildir(r.tamam ? t("yzDenemeTamam") : `${yzHataMetni(t, r.hata)}${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
                        }}
                        data-yz-dene
                      >
                        <Zap size={15} />
                      </button>
                      <button type="button" className="dugme dugme-sade dugme-ikon" title={t("duzenle")} aria-label={t("duzenle")} onClick={() => setPencere(s)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="dugme dugme-sade dugme-ikon kotu-yazi"
                        title={t("sil")}
                        aria-label={t("sil")}
                        onClick={() => {
                          if (!confirm(t("silinsinMi"))) return;
                          const oz = Object.fromEntries(Object.entries(ozellikler).map(([k, v]) => [k, v && v.saglayici === s.id ? { ...v, saglayici: undefined } : v]));
                          void yaz({ saglayicilar: ayar.saglayicilar.filter((x) => x.id !== s.id), ozellikler: oz });
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="dugme dugme-ikincil dugme-kucuk ara-ust-2" onClick={() => setPencere("yeni")} data-yz-saglayici-ekle>
              <Plus size={15} /> {t("yzSaglayiciEkle")}
            </button>

            <div className="alan-etiket ara-ust-2">{t("yzOzellikler")}</div>
            {YZ_OZELLIKLERI.map((o) => (
              <OzellikSatiri
                key={o}
                ozellik={o}
                deger={ozellikler[o] ?? VARSAYILAN_OZELLIK}
                saglayicilar={ayar.saglayicilar}
                kullanim={ayar.kullanim?.[o] ?? 0}
                degistir={(v) => setOzellikler({ ...ozellikler, [o]: v })}
              />
            ))}
            <div className="form-alt">
              <button type="button" className="dugme dugme-kucuk" onClick={() => void yaz({ saglayicilar: ayar.saglayicilar, ozellikler })} data-yz-kaydet>
                {t("kaydet")}
              </button>
            </div>
          </>
        )}
      </div>
      {pencere && ayar && (
        <SaglayiciPenceresi
          mevcut={pencere === "yeni" ? undefined : pencere}
          kapat={() => setPencere(null)}
          kaydet={async (s) => {
            const liste = pencere === "yeni" ? [...ayar.saglayicilar, s] : ayar.saglayicilar.map((x) => (x.id === s.id ? s : x));
            // İlk sağlayıcı açık özelliklerin sağlayıcısı olur; ayrıca seçmek gerekmesin.
            const oz = { ...ozellikler };
            if (pencere === "yeni") for (const o of YZ_OZELLIKLERI) if (oz[o] && !oz[o]!.saglayici) oz[o] = { ...oz[o]!, saglayici: s.id };
            if (await yaz({ saglayicilar: liste, ozellikler: oz })) setPencere(null);
          }}
        />
      )}
    </Kart>
  );
}

function OzellikSatiri({
  ozellik,
  deger,
  saglayicilar,
  kullanim,
  degistir,
}: {
  ozellik: YzOzellik;
  deger: YzOzellikAyari;
  saglayicilar: YzSaglayici[];
  kullanim: number;
  degistir: (v: YzOzellikAyari) => void;
}) {
  const { t } = useDil();
  const birimler = kisiBirimleri();
  const sec = (b: string) => degistir({ ...deger, birimler: deger.birimler.includes(b) ? deger.birimler.filter((x) => x !== b) : [...deger.birimler, b] });
  return (
    <div className="form form-kutu" data-yz-ozellik={ozellik}>
      <label className="secim">
        <input type="checkbox" checked={deger.acik} onChange={(e) => degistir({ ...deger, acik: e.target.checked })} data-yz-ozellik-acik />
        <b>{t(OZELLIK_ADI[ozellik])}</b>
        <span className="sonuk">· {t("yzBugunKullanim", { n: kullanim })}</span>
        <SenIcinDurum ozellik={ozellik} />
      </label>
      <div className="satir">
        <label>
          {t("yzSaglayici")}
          <select value={deger.saglayici ?? ""} onChange={(e) => degistir({ ...deger, saglayici: e.target.value || undefined })} data-yz-ozellik-saglayici>
            <option value="">{t("yzIlkEtkin")}</option>
            {saglayicilar.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ad}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("yzGunlukSinir")}
          <input type="number" min={0} max={10000} value={deger.gunlukSinir} onChange={(e) => degistir({ ...deger, gunlukSinir: Math.max(0, Number(e.target.value) || 0) })} data-yz-ozellik-sinir />
        </label>
      </div>
      <div>
        <div className="alan-etiket">{t("yzBirimler")}</div>
        <div className="cipler">
          <button type="button" className={`cip cip-dugme${deger.birimler.length ? "" : " secili"}`} aria-pressed={!deger.birimler.length} onClick={() => degistir({ ...deger, birimler: [] })}>
            {t("yzButunBirimler")}
          </button>
          {birimler.map((b) => (
            <button key={b} type="button" className={`cip cip-dugme${deger.birimler.includes(b) ? " secili" : ""}`} aria-pressed={deger.birimler.includes(b)} onClick={() => sec(b)} data-yz-birim={b}>
              {birimAdi(b)}
            </button>
          ))}
        </div>
      </div>
      {/* Kurumun kendi biçimi ve ölçütleri; kapıdaki varsayılan yönergenin arkasına ekleniyor, çelişirse bunlar geçerli. */}
      <label>
        {t("yzYonerge")}
        <textarea dir="auto" rows={4} value={deger.yonerge ?? ""} onChange={(e) => degistir({ ...deger, yonerge: e.target.value })} data-yz-yonerge />
      </label>
      {ozellik === "takipMetni" && (
        <label>
          {t("yzAlanlar")}
          <textarea
            dir="ltr"
            rows={4}
            value={(deger.alanlar ?? []).join("\n")}
            placeholder={"aa.com.tr\nreuters.com"}
            onChange={(e) => degistir({ ...deger, alanlar: e.target.value.split("\n") })}
            data-yz-alanlar
          />
        </label>
      )}
      {ozellik === "haberDegeri" && (
        <label>
          {t("yzKriterler")}
          <textarea
            dir="auto"
            rows={6}
            value={(deger.kriterler ?? []).join("\n")}
            placeholder={t("yzVarsayilanKriterler")}
            onChange={(e) => degistir({ ...deger, kriterler: e.target.value.split("\n") })}
            data-yz-kriterler
          />
        </label>
      )}
    </div>
  );
}

function SaglayiciPenceresi({ mevcut, kapat, kaydet }: { mevcut?: YzSaglayici; kapat: () => void; kaydet: (s: YzSaglayici) => void }) {
  const { t } = useDil();
  const [f, setF] = useState({
    ad: mevcut?.ad ?? "",
    tur: mevcut?.tur ?? ("anthropic" as SaglayiciTuru),
    adres: mevcut?.adres ?? "https://api.openai.com/v1",
    model: mevcut?.model ?? "",
    anahtar: "",
    anahtariSil: false,
    aktif: mevcut?.aktif ?? true,
  });
  const adresGecerli = f.tur !== "openai" || /^https:\/\//.test(f.adres.trim());
  const anahtarVar = !f.anahtariSil && (!!mevcut?.anahtarSonu || !!f.anahtar.trim());
  const gecerli = !!f.model.trim() && adresGecerli && anahtarVar;
  /*
   * Model listesi sağlayıcıdan: yönetici model adını ezbere yazmasın. Yeni
   * yazılan anahtar yalnız bu istekte kullanılıyor, kaydedilmiyor; yazılmadıysa
   * kapı kayıtlı anahtarı kullanıyor. Tür ya da adres değişince liste eskiyor.
   */
  const [modeller, setModeller] = useState<string[] | null>(null);
  const [modelDurumu, setModelDurumu] = useState<"" | "yukleniyor" | string>("");
  const modelleriGetir = async () => {
    if (!adresGecerli || !anahtarVar) return;
    setModelDurumu("yukleniyor");
    const r = await yzModeller({ saglayici: mevcut?.id, tur: f.tur, ...(f.tur === "openai" ? { adres: f.adres.trim() } : {}), ...(f.anahtar.trim() ? { anahtar: f.anahtar.trim() } : {}) });
    if (r.tamam) {
      setModeller(r.veri.modeller);
      setModelDurumu("");
    } else {
      setModeller(null);
      setModelDurumu(`${yzHataMetni(t, r.hata)}${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
    }
  };
  // Kayıtlı anahtarı olan sağlayıcı açılınca liste kendiliğinden gelsin.
  useEffect(() => {
    if (mevcut?.anahtarSonu) void modelleriGetir();
  }, []);
  const tamam = () =>
    kaydet({
      id: mevcut?.id ?? `s-${Date.now().toString(36)}`,
      ad: f.ad.trim() || t(TUR_ADI[f.tur]),
      tur: f.tur,
      ...(f.tur === "openai" ? { adres: f.adres.trim() } : {}),
      model: f.model.trim(),
      aktif: f.aktif,
      // Yeni anahtar yazılmadıysa alan gönderilmiyor: kayıtlı anahtar korunuyor.
      ...(f.anahtariSil ? { anahtar: "" } : f.anahtar.trim() ? { anahtar: f.anahtar.trim() } : {}),
    });
  return (
    <Pencere baslik={t(mevcut ? "duzenle" : "yzSaglayiciEkle")} kapat={kapat}>
      <div className="form" data-yz-saglayici-formu>
        <div className="satir">
          <label>
            {t("yzSaglayiciAdi")}
            <input value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} data-yz-ad />
          </label>
          <label>
            {t("yzTur")}
            <select
              value={f.tur}
              onChange={(e) => {
                setF({ ...f, tur: e.target.value as SaglayiciTuru });
                setModeller(null);
              }}
              data-yz-tur
            >
              <option value="anthropic">{t("yzTurClaude")}</option>
              <option value="openai">{t("yzTurOpenai")}</option>
            </select>
          </label>
        </div>
        {f.tur === "openai" && (
          <label>
            {t("yzAdres")}
            <input
              dir="ltr"
              inputMode="url"
              value={f.adres}
              onChange={(e) => {
                setF({ ...f, adres: e.target.value });
                setModeller(null);
              }}
              data-yz-adres
            />
          </label>
        )}
        <label>
          {t("yzAnahtar")}
          <input
            dir="ltr"
            type="password"
            autoComplete="off"
            value={f.anahtar}
            disabled={f.anahtariSil}
            onChange={(e) => setF({ ...f, anahtar: e.target.value })}
            placeholder={mevcut?.anahtarSonu ? `••••${mevcut.anahtarSonu}` : ""}
            data-yz-anahtar
          />
        </label>
        <div>
          <label>
            {t("yzModel")}
            {modeller?.length ? (
              <select dir="ltr" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} data-yz-model-sec>
                {!modeller.includes(f.model) && <option value={f.model}>{f.model || t("seciniz")}</option>}
                {modeller.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input dir="ltr" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} placeholder={f.tur === "anthropic" ? "claude-opus-5-5" : ""} data-yz-model />
            )}
          </label>
          <div className="yz-satir ara-ust">
            <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={modelleriGetir} aria-disabled={!adresGecerli || !anahtarVar || modelDurumu === "yukleniyor"} data-yz-modelleri-getir>
              {modelDurumu === "yukleniyor" ? <Loader2 size={14} className="donen" /> : <RefreshCw size={14} />} {t("yzModelleriGetir")}
            </button>
            {modelDurumu && modelDurumu !== "yukleniyor" && (
              <small className="kotu-yazi" data-yz-model-hata>
                {modelDurumu}
              </small>
            )}
          </div>
        </div>
        {mevcut?.anahtarSonu && (
          <label className="secim">
            <input type="checkbox" checked={f.anahtariSil} onChange={(e) => setF({ ...f, anahtariSil: e.target.checked, anahtar: "" })} />
            {t("yzAnahtariSil")}
          </label>
        )}
        <label className="secim">
          <input type="checkbox" checked={f.aktif} onChange={(e) => setF({ ...f, aktif: e.target.checked })} />
          {t("yzEtkin")}
        </label>
        <FormAlt kapat={kapat} kaydet={tamam} devre={!gecerli && !f.anahtariSil} />
      </div>
    </Pencere>
  );
}

/* Özellik kaydedilmiş ayarla bu hesapta açık mı: düğme çıkmıyorsa nedeni buradan görülsün. */
function SenIcinDurum({ ozellik }: { ozellik: YzOzellik }) {
  const { t } = useDil();
  const d = useYz(ozellik);
  return (
    <span data-yz-sen-icin={d ? "acik" : "kapali"}>
      <Rozet ton={d ? "iyi" : undefined}>{d ? t("yzSenIcinAcik", { n: d.kalan }) : t("yzSenIcinKapali")}</Rozet>
    </span>
  );
}
