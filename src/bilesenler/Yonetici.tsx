import { Flag, Gauge, X } from "lucide-react";
import { useState } from "react";
import { useDil } from "../dil";
import { oncelikDegistir, yoneticiNotu } from "../eylemler";
import type { Kisi, Paket } from "../veri";
import { mudahaleEdebilir } from "../yetki";
import { Kart, bildir } from "./Parcalar";

/*
 * Yöneticinin müdahalesi: öncelik ve yönetici notu. İkisi de işi o an
 * yürüten birime bildirim düşürüyor; ayrıntılı iş akışına girmeden
 * "bu önemli" ve "şuna dikkat" diyebilmek için. Yetki hem burada hem
 * eylemde soruluyor.
 */

export function OncelikDugmesi({ ben, paket, kucuk = false }: { ben: Kisi; paket: Paket; kucuk?: boolean }) {
  const { t } = useDil();
  if (!mudahaleEdebilir(ben, paket)) return null;
  const acik = !!paket.oncelikli;
  return (
    <button
      type="button"
      className={`dugme ${acik ? "dugme-ikincil" : "dugme-oncelik"} ${kucuk ? "dugme-kucuk" : ""}`}
      aria-pressed={acik}
      onClick={() => oncelikDegistir(ben, paket.id, !acik) && bildir(t(acik ? "bOncelikKalkti" : "bOncelikli"))}
    >
      {acik ? <X size={14} /> : <Flag size={14} />} {t(acik ? "oncelikKaldir" : "oncelikliYap")}
    </button>
  );
}

export function YoneticiKarti({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t } = useDil();
  const [not, setNot] = useState("");
  if (!mudahaleEdebilir(ben, paket)) return null;
  const gonder = () => {
    if (yoneticiNotu(ben, paket.id, not)) {
      setNot("");
      bildir(t("bYoneticiNotu"));
    }
  };
  return (
    <Kart baslik={t("yoneticiKarti")} ikon={<Gauge size={18} />} className="yonetici-karti">
      <p className="bos-kucuk">{t("yoneticiKartiAciklama")}</p>
      <div className="dugmeler ara-ust">
        <OncelikDugmesi ben={ben} paket={paket} />
      </div>
      <div className="form ara-ust-2">
        <label>
          {t("yoneticiNotu")}
          <textarea dir="auto" value={not} onChange={(e) => setNot(e.target.value)} placeholder={t("yoneticiNotuIpucu")} rows={2} />
        </label>
        <div className="form-alt">
          <button className="dugme dugme-kucuk" onClick={gonder} disabled={!not.trim()}>
            {t("yoneticiNotuGonder")}
          </button>
        </div>
      </div>
    </Kart>
  );
}
