import { ArrowLeft, Check, ChevronDown, ChevronUp, Loader2, MailCheck, Send } from "lucide-react";
import { useState } from "react";
import { Bos, Icerik, Kart, Rozet, bildir } from "../../bilesenler/Parcalar";
import { ciktiTarihi, saatYaz, tarihYaz, useDil } from "../../dil";
import { takdirBildirildi } from "../../eylemler";
import { GERCEK } from "../../kip";
import { postaGonder } from "../../posta-kapi";
import { takdirAdresi, takdirEpostasi, takdirPaketleri } from "../../takdir";
import { getir, kisiBul, useVeri, type Kisi, type NextDayPlan } from "../../veri";
import { yapabilir } from "../../yetki";
import { SayfaBasi } from "../ana/Planlama";

/*
 * Takdir bildirimi sayfası (`#/nextday/:id/takdir`): plan onaylanınca açılıyor
 * (kullanıcı: kendiliğinden gitmesin, teker teker işaretleyip göndereyim).
 * Kabul edilen her paket bir satır, ayrı posta; gönderilmiş olan işaretli
 * gelmez, "gönderildi" yazar. Gönderim kişinin kendi EWS kimliğiyle kapıdan
 * (posta/gonder; grup adresi CC'ye kapıda ekleniyor). Demoda kapıya gidilmez,
 * yalnız işaretlenir.
 */
export default function TakdirBildirimi({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const paketler = takdirPaketleri(v, plan.id);
  const adresi = (muhabirId?: string) => takdirAdresi(kisiBul(v, muhabirId));
  const [secili, setSecili] = useState<Set<string>>(() => new Set(paketler.filter((p) => !p.takdirBildirimi && adresi(p.muhabirId)).map((p) => p.id)));
  const [acik, setAcik] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const yetkili = yapabilir(ben, "planDuzenle");
  const secilebilir = paketler.filter((p) => adresi(p.muhabirId));
  const gidecek = paketler.filter((p) => secili.has(p.id) && adresi(p.muhabirId));

  const degistir = (id: string) =>
    setSecili((s) => {
      const y = new Set(s);
      if (!y.delete(id)) y.add(id);
      return y;
    });
  const hepsi = gidecek.length === secilebilir.length;

  const gonder = async () => {
    if (!gidecek.length || !confirm(t("tkGonderOnay", { n: String(gidecek.length) }))) return;
    setMesgul(true);
    let tamam = 0;
    const hatalar: string[] = [];
    // Sırayla: her posta ayrı EWS bağlantısı; aynı anda açılınca kapı sınırına takılıyordu.
    for (const p of gidecek) {
      const e = takdirEpostasi(getir(), p, ben);
      const r = GERCEK ? await postaGonder({ kime: e.kime, cc: e.cc, bcc: e.bcc, konu: e.konu, metin: e.metin }) : { tamam: true as const };
      if (r.tamam) {
        takdirBildirildi(ben, p.id);
        tamam++;
      } else hatalar.push(`${muhabirAdi(p.muhabirId)}: ${r.ayrinti ?? r.hata}`);
    }
    setMesgul(false);
    setSecili(new Set());
    bildir(hatalar.length ? `${t("tkGonderildi", { n: String(tamam) })} · ${t("tkGonderilemedi")} (${hatalar.join("; ")})` : t("tkGonderildi", { n: String(tamam) }));
  };
  const muhabirAdi = (id?: string) => {
    const k = kisiBul(v, id);
    return k ? ad(k) : "";
  };

  return (
    <>
      <a className="geri-bag" href={`#/nextday/${plan.id}`} data-takdir-plana>
        <ArrowLeft size={14} className="yon" /> {t("tkPlanaDon")}
      </a>
      <SayfaBasi ikon={<MailCheck size={26} />} baslik={`${t("tkBaslik")} · ${tarihYaz(plan.tarih, dil)}`} />
      <Kart baslik={ciktiTarihi(plan.tarih, "ar")} ikon={<Send size={18} />}>
        {!paketler.length ? (
          <Bos kucuk metin={t("tkPaketYok")} />
        ) : (
          <>
            <ul className="liste takdir-listesi" data-takdir-listesi>
              {paketler.map((p) => {
                const adres = adresi(p.muhabirId);
                const e = acik === p.id ? takdirEpostasi(v, p, ben) : null;
                return (
                  <li key={p.id} data-takdir-paket={p.id}>
                    <label className="takdir-sec">
                      <input
                        type="checkbox"
                        checked={secili.has(p.id) && !!adres}
                        disabled={!adres || mesgul || !yetkili}
                        onChange={() => degistir(p.id)}
                        aria-label={p.baslik}
                        data-takdir-secim
                      />
                    </label>
                    <div className="ad">
                      <Icerik blok>{p.baslik}</Icerik>
                      <small>
                        {muhabirAdi(p.muhabirId)}
                        {adres && <span dir="ltr"> · {adres}</span>}
                      </small>
                      {e && (
                        <div className="takdir-onizleme" data-takdir-onizleme>
                          <Icerik blok className="takdir-konu">{e.konu}</Icerik>
                          <Icerik blok className="takdir-metin">{e.metin}</Icerik>
                        </div>
                      )}
                    </div>
                    {p.takdirBildirimi ? (
                      <span data-takdir-gitti>
                        <Rozet ton="iyi">
                          <Check size={12} /> {t("tkGitti")} · {saatYaz(p.takdirBildirimi.zaman, dil)}
                        </Rozet>
                      </span>
                    ) : !adres ? (
                      <Rozet ton="uyari">{t("tkAdresYok")}</Rozet>
                    ) : null}
                    <button
                      type="button"
                      className="dugme dugme-sade dugme-ikon"
                      onClick={() => setAcik(acik === p.id ? null : p.id)}
                      title={t("tkOnizle")}
                      aria-label={t("tkOnizle")}
                      aria-expanded={acik === p.id}
                      data-takdir-onizle
                    >
                      {acik === p.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </li>
                );
              })}
            </ul>
            {yetkili && (
              <div className="form-alt">
                <button
                  type="button"
                  className="dugme dugme-ikincil dugme-kucuk"
                  disabled={mesgul || !secilebilir.length}
                  onClick={() => setSecili(new Set(hepsi ? [] : secilebilir.map((p) => p.id)))}
                  data-takdir-hepsi
                >
                  {t(hepsi ? "tkHicbiri" : "tkHepsi")}
                </button>
                <button type="button" className="dugme dugme-kucuk" disabled={mesgul || !gidecek.length} onClick={() => void gonder()} data-takdir-gonder>
                  {mesgul ? <Loader2 size={14} className="donen" /> : <Send size={14} />} {t("tkGonder", { n: String(gidecek.length) })}
                </button>
              </div>
            )}
          </>
        )}
      </Kart>
    </>
  );
}
