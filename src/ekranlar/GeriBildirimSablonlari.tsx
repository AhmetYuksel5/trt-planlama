import { MailCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Kart, Pencere, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { metin, useDil } from "../dil";
import { ONERI_DURUM_ADI } from "../etiketler";
import { geriBildirimSablonuKaydet, geriBildirimSablonuSil, ozelGorevSablonuKaydet, planGonderSablonuKaydet, takdirSablonuKaydet } from "../eylemler";
import { PLAN_GONDER_ALANLARI, VARSAYILAN_PLAN_GONDER, planGonderSablonu, type PlanGonderTuru } from "../planGonder";
import { sablonlar } from "../geriBildirim";
import { OZEL_GOREV_ALANLARI, TAKDIR_ALANLARI, VARSAYILAN_OZEL_GOREV, VARSAYILAN_TAKDIR, ozelGorevSablonu, takdirSablonu } from "../takdir";
import { GERI_BILDIRIM_KARARLARI, kimlik, useVeri, type GeriBildirimKarari, type GeriBildirimSablonu, type Kisi } from "../veri";

/*
 * Ayarlar › Muhabire geri bildirim: muhabire giden e-postanın şablonları. Tam
 * yönetici ve Planlama yöneticisi düzenliyor (yetki.ts →
 * geriBildirimSablonuDuzenler). PKG geri bildirimi (takdir) aynı işin plan
 * onayından sonraki postası: ayrı kartı vardı (kullanıcı: iki sekme aynı işi
 * görüyor), listenin ilk satırı oldu; silinmez, varsayılana döner.
 */
export function GeriBildirimAyarlari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const liste = sablonlar(v);
  const [duzenlenen, setDuzenlenen] = useState<GeriBildirimSablonu | null>(null);
  const [takdir, setTakdir] = useState<"takdir" | "ozel" | null>(null);
  const [planGonder, setPlanGonder] = useState<PlanGonderTuru | null>(null);
  return (
    <Kart baslik={t("gbAyarBaslik")} ikon={<MailCheck size={18} />}>
      <ul className="liste" data-gb-sablonlari>
        <li data-gb-sablonu="takdir">
          <div className="ad">
            <b>{t("tkAyarBaslik")}</b>
            <small>{t("tkPlanOnayi")}</small>
          </div>
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setTakdir("takdir")} title={t("duzenle")} aria-label={t("duzenle")} data-takdir-duzenle>
            <Pencil size={15} />
          </button>
        </li>
        <li data-gb-sablonu="ozel-gorev">
          <div className="ad">
            <b>{t("ozgSablonBaslik")}</b>
            <small>{t("oyIcerikGorevlendir")}</small>
          </div>
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setTakdir("ozel")} title={t("duzenle")} aria-label={t("duzenle")} data-ozel-gorev-duzenle>
            <Pencil size={15} />
          </button>
        </li>
        {(["nextday", "haftalik"] as const).map((tur) => (
          <li key={tur} data-gb-sablonu={`plan-gonder-${tur}`}>
            <div className="ad">
              <b>
                {t("pgGonder")} · {t(tur === "nextday" ? "nextday" : "mHaftalik")}
              </b>
              <small>{t("pgAyarAlt")}</small>
            </div>
            <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setPlanGonder(tur)} title={t("duzenle")} aria-label={t("duzenle")} data-plan-gonder-duzenle={tur}>
              <Pencil size={15} />
            </button>
          </li>
        ))}
        {liste.map((s) => (
          <li key={s.id} data-gb-sablonu={s.id}>
            <div className="ad">
              <b>{s.ad}</b>
              <small>{s.karar ? t(ONERI_DURUM_ADI[s.karar]) : t("gbKararsiz")}</small>
            </div>
            <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setDuzenlenen(s)} title={t("duzenle")} aria-label={t("duzenle")} data-gb-sablon-duzenle>
              <Pencil size={15} />
            </button>
            <button
              type="button"
              className="dugme dugme-sade dugme-ikon kotu-yazi"
              onClick={() => confirm(t("silinsinMi")) && geriBildirimSablonuSil(ben, s.id)}
              title={t("sil")}
              aria-label={t("sil")}
              data-gb-sablon-sil
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="dugme dugme-ikincil dugme-kucuk ara-ust-2"
        onClick={() => setDuzenlenen({ id: kimlik("gb"), ad: "", konu: "", govde: "", cc: "", bcc: "" })}
        data-gb-sablon-ekle
      >
        <Plus size={14} /> {t("gbSablonEkle")}
      </button>
      {duzenlenen && <SablonPenceresi ben={ben} sablon={duzenlenen} kapat={() => setDuzenlenen(null)} />}
      {planGonder && (
        <Pencere baslik={`${t("pgGonder")} · ${t(planGonder === "nextday" ? "nextday" : "mHaftalik")}`} kapat={() => setPlanGonder(null)}>
          <PlanGonderFormu ben={ben} tur={planGonder} />
        </Pencere>
      )}
      {takdir && (
        <Pencere baslik={t(takdir === "ozel" ? "ozgSablonBaslik" : "tkAyarBaslik")} kapat={() => setTakdir(null)}>
          <TakdirFormu ben={ben} tur={takdir} />
        </Pencere>
      )}
    </Kart>
  );
}

function SablonPenceresi({ ben, sablon, kapat }: { ben: Kisi; sablon: GeriBildirimSablonu; kapat: () => void }) {
  const { t } = useDil();
  const [s, setS] = useState(sablon);
  const kaydet = () => {
    if (geriBildirimSablonuKaydet(ben, { ...s, ad: s.ad.trim(), ...(s.karar ? {} : { karar: undefined }) })) {
      bildir(t("bKaydedildi"));
      kapat();
    }
  };
  return (
    <Pencere baslik={sablon.ad || t("gbSablonEkle")} kapat={kapat}>
      <div className="form" data-gb-sablon-formu>
        <div className="satir">
          <label>
            {t("gbSablonAdi")}
            <input dir="auto" value={s.ad} onChange={(e) => setS({ ...s, ad: e.target.value })} data-gb-sablon-ad />
          </label>
          <label>
            {t("gbKarar")}
            <select value={s.karar ?? ""} onChange={(e) => setS({ ...s, karar: (e.target.value || undefined) as GeriBildirimKarari | undefined })} data-gb-sablon-karar>
              <option value="">{t("gbKararsiz")}</option>
              {GERI_BILDIRIM_KARARLARI.map((k) => (
                <option key={k} value={k}>
                  {t(ONERI_DURUM_ADI[k])}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="satir">
          <label>
            {t("gbCc")}
            <input dir="ltr" value={s.cc} onChange={(e) => setS({ ...s, cc: e.target.value })} placeholder="planning@ornek.local" data-gb-sablon-cc />
          </label>
          <label>
            {t("gbBcc")}
            <input dir="ltr" value={s.bcc} onChange={(e) => setS({ ...s, bcc: e.target.value })} data-gb-sablon-bcc />
          </label>
        </div>
        <label>
          {t("gbKonu")}
          <input {...icerikAlani} value={s.konu} onChange={(e) => setS({ ...s, konu: e.target.value })} data-gb-sablon-konu />
        </label>
        <label>
          {t("gbMetin")}
          <textarea {...icerikAlani} rows={8} value={s.govde} onChange={(e) => setS({ ...s, govde: e.target.value })} placeholder={metin("gbMetinIpucu", "ar")} data-gb-sablon-metin />
        </label>
        <small className="sonuk" dir="ltr">
          {"{muhabir} {header} {strap} {plan} {gerekce} {not}"}
        </small>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" disabled={!s.ad.trim() || !s.konu.trim() || !s.govde.trim()} onClick={kaydet} data-gb-sablon-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Pencere>
  );
}

/*
 * PKG geri bildirimi şablonu (src/takdir.ts): plan onaylanınca muhabire giden
 * "تكليف تقرير" postası. Konu, metin, CC ve BCC buradan; Kime muhabirin
 * adresi, planning grubu kapıda her zaman CC'de.
 */
function TakdirFormu({ ben, tur }: { ben: Kisi; tur: "takdir" | "ozel" }) {
  const { t } = useDil();
  const v = useVeri();
  // Özel yayın görevinin kalıp postası aynı form: şablon, alanlar ve kayıt eylemi değişiyor.
  const ozel = tur === "ozel";
  const kayitli = ozel ? ozelGorevSablonu(v) : takdirSablonu(v);
  const varsayilan = ozel ? VARSAYILAN_OZEL_GOREV : VARSAYILAN_TAKDIR;
  const takdirSablonuKaydet_ = ozel ? ozelGorevSablonuKaydet : takdirSablonuKaydet;
  const [s, setS] = useState(kayitli);
  const degisti = s.konu !== kayitli.konu || s.govde !== kayitli.govde || s.cc !== kayitli.cc || s.bcc !== kayitli.bcc;
  const kaydet = (x = s) => {
    if (takdirSablonuKaydet_(ben, x)) {
      setS(x);
      bildir(t("bKaydedildi"));
    }
  };
  return (
      <div className="form" data-takdir-sablonu={tur}>
        <div className="satir">
          <label>
            {t("gbCc")}
            <input dir="ltr" value={s.cc} onChange={(e) => setS({ ...s, cc: e.target.value })} data-takdir-cc />
          </label>
          <label>
            {t("gbBcc")}
            <input dir="ltr" value={s.bcc} onChange={(e) => setS({ ...s, bcc: e.target.value })} data-takdir-bcc />
          </label>
        </div>
        <label>
          {t("gbKonu")}
          <input {...icerikAlani} value={s.konu} onChange={(e) => setS({ ...s, konu: e.target.value })} data-takdir-konu />
        </label>
        <label>
          {t("gbMetin")}
          <textarea {...icerikAlani} rows={12} value={s.govde} onChange={(e) => setS({ ...s, govde: e.target.value })} data-takdir-metin />
        </label>
        <small className="sonuk" dir="ltr">
          {(ozel ? OZEL_GOREV_ALANLARI : TAKDIR_ALANLARI).map((a) => `{${a}}`).join(" ")}
        </small>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => kaydet({ ...varsayilan })} data-takdir-varsayilan>
            {t("tkVarsayilan")}
          </button>
          <button type="button" className="dugme dugme-kucuk" disabled={!degisti || !s.konu.trim() || !s.govde.trim()} onClick={() => kaydet()} data-takdir-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
  );
}

/*
 * Planı gönder şablonu (planGonder.ts): onaylanan planın postasının alıcıları ve
 * konusu bir kez burada. Metin isteğe bağlı, planın üstüne girer; gövde planın kendisi.
 */
function PlanGonderFormu({ ben, tur }: { ben: Kisi; tur: PlanGonderTuru }) {
  const { t } = useDil();
  const v = useVeri();
  const kayitli = planGonderSablonu(v, tur);
  const [s, setS] = useState(kayitli);
  const degisti = s.konu !== kayitli.konu || s.govde !== kayitli.govde || (s.kime ?? "") !== (kayitli.kime ?? "") || s.cc !== kayitli.cc || s.bcc !== kayitli.bcc;
  const kaydet = (x = s) => {
    if (planGonderSablonuKaydet(ben, tur, x)) {
      setS(x);
      bildir(t("bKaydedildi"));
    }
  };
  return (
    <div className="form" data-plan-gonder-sablonu={tur}>
      <label>
        {t("postaKime")}
        <input dir="ltr" value={s.kime ?? ""} onChange={(e) => setS({ ...s, kime: e.target.value })} placeholder={t("pgGrupKime")} data-pg-sablon-kime />
      </label>
      <div className="satir">
        <label>
          {t("gbCc")}
          <input dir="ltr" value={s.cc} onChange={(e) => setS({ ...s, cc: e.target.value })} data-pg-sablon-cc />
        </label>
        <label>
          {t("gbBcc")}
          <input dir="ltr" value={s.bcc} onChange={(e) => setS({ ...s, bcc: e.target.value })} data-pg-sablon-bcc />
        </label>
      </div>
      <label>
        {t("gbKonu")}
        <input {...icerikAlani} value={s.konu} onChange={(e) => setS({ ...s, konu: e.target.value })} data-pg-sablon-konu />
      </label>
      <label>
        {t("gbMetin")}
        <textarea {...icerikAlani} rows={4} value={s.govde} onChange={(e) => setS({ ...s, govde: e.target.value })} data-pg-sablon-metin />
      </label>
      <small className="sonuk" dir="ltr">
        {PLAN_GONDER_ALANLARI[tur].map((a) => `{${a}}`).join(" ")}
      </small>
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => kaydet({ ...VARSAYILAN_PLAN_GONDER[tur] })} data-pg-sablon-varsayilan>
          {t("tkVarsayilan")}
        </button>
        <button type="button" className="dugme dugme-kucuk" disabled={!degisti || !s.konu.trim()} onClick={() => kaydet()} data-pg-sablon-kaydet>
          {t("kaydet")}
        </button>
      </div>
    </div>
  );
}
