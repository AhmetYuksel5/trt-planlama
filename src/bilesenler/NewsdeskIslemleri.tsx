import { Ban, MessageSquareText, PackageOpen, RotateCcw, Trash2, UserRoundPen } from "lucide-react";
import { useState } from "react";
import { saatYaz, tarihYaz, useDil } from "../dil";
import { GORUS_ASAMASI, asamaNotuSil, asamaNotuSilebilir, newsdeskGorusEkle, newsdeskReddiGeriAl, paketMuhabirAta, paketNewsdeskReddet, paketStogaDondur } from "../eylemler";
import { MuhabirSecici } from "../ekranlar/nextday/Formlar";
import { yerelGun } from "../tarih";
import { kisiBul, planBul, useVeri, type Kisi, type Paket } from "../veri";
import { asamaNotuGorur, newsdeskGorusYazabilir, newsdeskReddedebilir, newsdeskReddiGeriAlabilir, paketMuhabirAtayabilir, paketStogaDonebilir } from "../yetki";
import { AnmaGirdisi } from "./Anma";
import { Kart, Pencere, bildir } from "./Parcalar";

/*
 * Newsdesk'in pakete dokunan işleri (kullanıcı): muhabir atama, yayınlanmayan
 * paketi Planlama'nın stoğuna geri gönderme, teslim alınan paketi gerekçeyle
 * reddetme (ödeme yapılmaz) ve paket görüşü. Paket sayfası ve Newsdesk'in ana
 * sayfası aynı düğmeleri kullanır; eylem yetkiyi yeniden sorar.
 */

export function MuhabirAtaDugmesi({ ben, paket, kucuk = true, ikon = false }: { ben: Kisi; paket: Paket; kucuk?: boolean; ikon?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const [id, setId] = useState("");
  if (!paketMuhabirAtayabilir(ben, v, paket)) return null;
  const tbc = paket.muhabirTbc || !paket.muhabirId;
  return (
    <>
      {/* Listede yalnız simge (satır kalabalık olmasın), adı ipucunda. */}
      {ikon ? (
        <button type="button" className="ikon-dugme" title={t(tbc ? "nkMuhabirAta" : "nkMuhabirDegistir")} aria-label={t(tbc ? "nkMuhabirAta" : "nkMuhabirDegistir")} onClick={() => setAcik(true)} data-paket-muhabir-ata={paket.id}>
          <UserRoundPen size={16} />
        </button>
      ) : (
        <button type="button" className={`dugme dugme-ikincil${kucuk ? " dugme-kucuk" : ""}`} onClick={() => setAcik(true)} data-paket-muhabir-ata={paket.id}>
          <UserRoundPen size={15} /> {t(tbc ? "nkMuhabirAta" : "nkMuhabirDegistir")}
        </button>
      )}
      {acik && (
        <Pencere baslik={t(tbc ? "nkMuhabirAta" : "nkMuhabirDegistir")} kapat={() => setAcik(false)}>
          <div className="form" data-paket-muhabir-formu>
            <label>
              {t("muhabir")}
              <MuhabirSecici deger={id} degistir={setId} />
            </label>
            <div className="dugmeler">
              <button type="button" className="dugme dugme-ikincil" onClick={() => setAcik(false)}>
                {t("iptal")}
              </button>
              <button
                type="button"
                className="dugme"
                disabled={!id || id === paket.muhabirId}
                onClick={() => {
                  if (paketMuhabirAta(ben, paket.id, id)) {
                    bildir(t("nkMuhabirAtandi"));
                    setAcik(false);
                  }
                }}
                data-paket-muhabir-kaydet
              >
                {t("kaydet")}
              </button>
            </div>
          </div>
        </Pencere>
      )}
    </>
  );
}

/* Planlanan ama yayınlanmayan paket Planlama'nın stoğuna (kullanıcı: açıkça bildirilsin). */
export function StogaDondurDugmesi({ ben, paket, kucuk = true, ikon = false }: { ben: Kisi; paket: Paket; kucuk?: boolean; ikon?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const [sebep, setSebep] = useState("");
  if (!paketStogaDonebilir(ben, v, paket)) return null;
  return (
    <>
      {/* Listede yalnız simge (satır kalabalık olmasın), adı ipucunda. */}
      {ikon ? (
        <button type="button" className="ikon-dugme" title={t("nkStogaDondur")} aria-label={t("nkStogaDondur")} onClick={() => setAcik(true)} data-paket-stoga-dondur={paket.id}>
          <PackageOpen size={16} />
        </button>
      ) : (
        <button type="button" className={`dugme dugme-ikincil${kucuk ? " dugme-kucuk" : ""}`} onClick={() => setAcik(true)} data-paket-stoga-dondur={paket.id}>
          <PackageOpen size={15} /> {t("nkStogaDondur")}
        </button>
      )}
      {acik && (
        <Pencere baslik={t("nkStogaDondur")} kapat={() => setAcik(false)}>
          <div className="form" data-stoga-dondur-formu>
            <p>{t("nkStogaDondurSoru")}</p>
            <label>
              {t("nkSebep")}
              <textarea rows={2} dir="auto" value={sebep} onChange={(e) => setSebep(e.target.value)} data-stoga-sebep />
            </label>
            <div className="dugmeler">
              <button type="button" className="dugme dugme-ikincil" onClick={() => setAcik(false)}>
                {t("iptal")}
              </button>
              <button
                type="button"
                className="dugme"
                onClick={() => {
                  if (paketStogaDondur(ben, paket.id, sebep)) {
                    bildir(t("nkStogaDondu"));
                    setAcik(false);
                  }
                }}
                data-stoga-dondur-onay
              >
                {t("nkStogaDondur")}
              </button>
            </div>
          </div>
        </Pencere>
      )}
    </>
  );
}

/* Teslim alınan paketi reddet: gerekçe şart; reddedilen pakete ödeme yapılmaz. */
export function NewsdeskRedDugmesi({ ben, paket, kucuk = true, ikon = false }: { ben: Kisi; paket: Paket; kucuk?: boolean; ikon?: boolean }) {
  const { t } = useDil();
  const [acik, setAcik] = useState(false);
  const [gerekce, setGerekce] = useState("");
  if (!newsdeskReddedebilir(ben, paket)) return null;
  return (
    <>
      {/* Listede yalnız simge (satır kalabalık olmasın), adı ipucunda. */}
      {ikon ? (
        <button type="button" className="ikon-dugme" title={t("nkReddet")} aria-label={t("nkReddet")} onClick={() => setAcik(true)} data-paket-newsdesk-reddet={paket.id}>
          <Ban size={16} />
        </button>
      ) : (
        <button type="button" className={`dugme dugme-kotu${kucuk ? " dugme-kucuk" : ""}`} onClick={() => setAcik(true)} data-paket-newsdesk-reddet={paket.id}>
          <Ban size={15} /> {t("nkReddet")}
        </button>
      )}
      {acik && (
        <Pencere baslik={t("nkReddet")} kapat={() => setAcik(false)}>
          <div className="form" data-newsdesk-red-formu>
            <p>{t("nkReddetSoru")}</p>
            <label>
              {t("nkGerekce")}
              <textarea rows={3} dir="auto" required value={gerekce} onChange={(e) => setGerekce(e.target.value)} data-newsdesk-red-gerekce />
            </label>
            <div className="dugmeler">
              <button type="button" className="dugme dugme-ikincil" onClick={() => setAcik(false)}>
                {t("iptal")}
              </button>
              <button
                type="button"
                className="dugme dugme-kotu"
                disabled={!gerekce.trim()}
                onClick={() => {
                  if (paketNewsdeskReddet(ben, paket.id, gerekce)) {
                    bildir(t("nkReddedildi"));
                    setAcik(false);
                  }
                }}
                data-newsdesk-red-onay
              >
                {t("nkReddet")}
              </button>
            </div>
          </div>
        </Pencere>
      )}
    </>
  );
}

/* Paket sayfasında: stoka dönüş ve Newsdesk reddi satırları (kim, ne zaman, neden). Muhabir de görür. */
export function NewsdeskSatirlari({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const zaman = (z: string) => `${tarihYaz(yerelGun(z), dil, "kisa")} ${saatYaz(z, dil)}`;
  const plan = planBul(v, paket.stogaDondu?.planId);
  return (
    <>
      {paket.stogaDondu && (
        <div className="newsdesk-satir uyari" data-stoga-dondu>
          <PackageOpen size={16} aria-hidden="true" />
          <span>
            <b>{t("nkStogaDonduSatir", { plan: plan ? tarihYaz(plan.tarih, dil, "kisa") : "—" })}</b>
            <small className="sonuk">
              {" "}
              · {ad(kisiBul(v, paket.stogaDondu.kisiId))} · {zaman(paket.stogaDondu.zaman)}
            </small>
            {paket.stogaDondu.sebep && <span dir="auto"> · {paket.stogaDondu.sebep}</span>}
          </span>
        </div>
      )}
      {paket.newsdeskRed && (
        <div className="newsdesk-satir kotu" data-newsdesk-red>
          <Ban size={16} aria-hidden="true" />
          <span>
            <b>{t("nkRedSatir")}</b>
            <small className="sonuk">
              {" "}
              · {ad(kisiBul(v, paket.newsdeskRed.kisiId))} · {zaman(paket.newsdeskRed.zaman)}
            </small>
            <span dir="auto"> · {paket.newsdeskRed.gerekce}</span>
          </span>
          {newsdeskReddiGeriAlabilir(ben, paket) && (
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => confirm(t("nkRedGeriAlSoru")) && newsdeskReddiGeriAl(ben, paket.id)} data-newsdesk-red-geri>
              <RotateCcw size={14} /> {t("nkRedGeriAl")}
            </button>
          )}
        </div>
      )}
    </>
  );
}

/*
 * Newsdesk'in paket görüşleri (kullanıcı: nitelik puanının yerinde; teslim
 * alınan paketle ilgili görüş, sonra raporlanacak). Ekip görür, muhabir değil.
 */
export function NewsdeskGorusleri({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [metin, setMetin] = useState("");
  if (!asamaNotuGorur(ben)) return null;
  const gorusler = (v.asamaNotlari ?? []).filter((n) => n.paketId === paket.id && n.asama === GORUS_ASAMASI);
  const yazar = newsdeskGorusYazabilir(ben, paket);
  if (!gorusler.length && !yazar) return null;
  return (
    <Kart baslik={t("nkGorus")} ikon={<MessageSquareText size={18} />} ek={gorusler.length ? String(gorusler.length) : undefined}>
      <div className="asama-notlari" data-newsdesk-gorusleri>
        {gorusler.map((n) => (
          <div key={n.id} className="asama-notu" data-newsdesk-gorus={n.id}>
            <small className="sonuk">
              {ad(kisiBul(v, n.kisiId))} · {tarihYaz(yerelGun(n.zaman), dil, "kisa")} {saatYaz(n.zaman, dil)}
            </small>
            <p dir="auto">{n.metin}</p>
            {asamaNotuSilebilir(ben, n) && (
              <button type="button" className="ikon-dugme" onClick={() => asamaNotuSil(ben, n.id)} title={t("sil")} aria-label={t("sil")}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {yazar && (
          <div className="asama-not-yaz">
            <AnmaGirdisi cokSatir rows={2} deger={metin} degistir={setMetin} aria-label={t("nkGorus")} data-newsdesk-gorus-girdi />
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" disabled={!metin.trim()} onClick={() => newsdeskGorusEkle(ben, paket.id, metin) && setMetin("")} data-newsdesk-gorus-ekle>
              {t("nkGorusEkle")}
            </button>
          </div>
        )}
      </div>
    </Kart>
  );
}
