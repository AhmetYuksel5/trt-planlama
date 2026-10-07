import { ExternalLink, LayoutPanelLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useDil, type Anahtar } from "../dil";
import { Bildiri, Bos } from "./Parcalar";

/**
 * Workspace bölmesinin kabuğu: menü, üst çubuk, demo şeridi ve alt çubuk
 * yok; onlar üst pencerede bir kez duruyor. Bildiri bölmenin içinde kalıyor
 * ki hangi bölmede ne olduğu belli olsun.
 */
export function GomuluKabuk({ children }: { children: ReactNode }) {
  return (
    <div className="gomulu-kabuk">
      <main className="sayfa">{children}</main>
      <Bildiri />
    </div>
  );
}

const UYARI: Record<"icIce" | "projePlani" | "oturumYok", Anahtar> = {
  icIce: "bolmeIcIce",
  projePlani: "bolmeProjePlani",
  oturumYok: "bolmeOturumYok",
};

/*
 * Bölmede açılmayan sayfalar. Giriş ekranı da bunlardan: bölmeden kişi
 * seçmek bütün pencerenin oturumunu değiştirirdi.
 */
export function BolmeUyarisi({ tur }: { tur: keyof typeof UYARI }) {
  const { t } = useDil();
  return (
    <div className="bolme-uyari">
      <Bos metin={t(UYARI[tur])} ikon={<LayoutPanelLeft size={28} />} />
      {tur === "projePlani" && (
        <a className="dugme dugme-ikincil" href="./#/plan" target="_blank" rel="noopener">
          <ExternalLink size={15} /> {t("yeniSekmedeAc")}
        </a>
      )}
    </div>
  );
}
