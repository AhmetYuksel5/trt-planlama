import { ArrowUpRight, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { GeriBag } from "../bilesenler/GeriBag";
import { Bos, Icerik, Kart } from "../bilesenler/Parcalar";
import { gecenSure, useDil } from "../dil";
import { anahtarKonusu, kisininKonulari, konuBasligi, konuMuhabiri, konuSayfasi, type KonuOzeti } from "../mesajlasma";
import { kisiBul, useVeri, type Kisi } from "../veri";
import { useAdimDurumu } from "../yol";
import { yapabilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";
import { IsYazismasi } from "./oneri/Yazisma";

/*
 * Mesajlar (kullanıcı: yazışmanın nereden okunup takip edileceği belli
 * değildi; Posta'ya karışmasın): kişinin katıldığı bütün iş yazışmaları tek
 * listede, en yeni mesaj önce, okunmamış kalın ve sayılı. Konu adresle
 * seçilir (`#/mesajlar/<konu>`), bildirim doğrudan oraya götürür; telefonda
 * tek ekran, liste ya da konuşma.
 */
export function Mesajlar({ ben, secili }: { ben: Kisi; secili?: string }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [suzgec, setSuzgec] = useAdimDurumu<"hepsi" | "okunmamis">("mesajlar:suzgec", "hepsi");
  const degerlendirir = yapabilir(ben, "oneriDegerlendir");
  const konular = kisininKonulari(v, ben, degerlendirir);
  const okunmamis = konular.filter((k) => k.okunmamis > 0);
  // Okunmamış süzgeci açıkken okunan konu listeden hemen düşmesin: seçili olan kalır.
  const [acikKalan] = useState(secili);
  const liste = suzgec === "okunmamis" ? konular.filter((k) => k.okunmamis > 0 || k.anahtar === acikKalan || k.anahtar === secili) : konular;
  const konu = secili ? anahtarKonusu(secili) : null;
  const seciliOzet = konular.find((k) => k.anahtar === secili);
  const satir = (k: KonuOzeti) => {
    const yazan = kisiBul(v, k.son.kisiId);
    const muhabir = kisiBul(v, konuMuhabiri(v, k.konu));
    return (
      <li key={k.anahtar}>
        <a
          href={`#/mesajlar/${k.anahtar}`}
          className={`mesaj-konu${k.okunmamis ? " okunmamis" : ""}${k.anahtar === secili ? " secili" : ""}`}
          aria-current={k.anahtar === secili ? "true" : undefined}
          data-mesaj-konu={k.anahtar}
        >
          <span className="mk-ust">
            <b>
              <Icerik>{konuBasligi(v, k.konu)}</Icerik>
            </b>
            <time dateTime={k.son.zaman}>{gecenSure(k.son.zaman, dil)}</time>
          </span>
          <small className="sonuk">{ad(muhabir)}</small>
          <span className="mk-son">
            <span>
              {ad(yazan)}: <bdi dir="auto">{k.son.metin}</bdi>
            </span>
            {k.okunmamis > 0 && (
              <em className="dugme-sayi" data-mesaj-okunmamis>
                {k.okunmamis}
              </em>
            )}
          </span>
        </a>
      </li>
    );
  };
  return (
    <>
      <SayfaBasi ikon={<MessagesSquare size={26} />} baslik={t("mMesajlar")} />
      <div className={`mesaj-duzen${konu ? " secili" : ""}`}>
        <Kart className="mesaj-liste">
          <div className="sekmeler" role="tablist" aria-label={t("mMesajlar")}>
            {(["hepsi", "okunmamis"] as const).map((x) => (
              <button key={x} type="button" role="tab" aria-selected={suzgec === x} className={suzgec === x ? "acik" : ""} onClick={() => setSuzgec(x)} data-mesaj-suzgec={x}>
                {t(x === "hepsi" ? "msHepsi" : "msOkunmamis")} <em>{(x === "hepsi" ? konular : okunmamis).length}</em>
              </button>
            ))}
          </div>
          {liste.length === 0 ? <Bos metin={t(suzgec === "okunmamis" ? "msOkunmamisYok" : "msYok")} /> : <ul className="mesaj-konulari">{liste.map(satir)}</ul>}
        </Kart>
        {konu && (
          <section className="kart mesaj-konusma" data-mesaj-konusma={secili}>
            <div className="mesaj-konusma-bas">
              <GeriBag href="#/mesajlar" metin={t("mMesajlar")} />
              <b>
                <Icerik>{konuBasligi(v, konu)}</Icerik>
              </b>
              <a className="dugme dugme-ikincil dugme-kucuk" href={konuSayfasi(v, konu)} data-mesaj-is>
                <ArrowUpRight size={14} /> {t("msIsiAc")}
              </a>
            </div>
            {/* Katılmadığı konuyu personel okur (yazamaz); muhabir yalnız kendi işini. */}
            {seciliOzet || (ben.birim !== "muhabir" && !ben.kontrolBekliyor && konuMuhabiri(v, konu)) ? <IsYazismasi ben={ben} konu={konu} kart={false} /> : <Bos metin={t("msYok")} />}
          </section>
        )}
      </div>
    </>
  );
}
