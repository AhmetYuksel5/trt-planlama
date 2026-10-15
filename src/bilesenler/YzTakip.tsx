import { ClipboardCopy, ExternalLink, Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useDil, type Anahtar } from "../dil";
import { kalemAdi } from "../haftalik";
import { bugun } from "../tarih";
import { useVeri, type Durum } from "../veri";
import { useYz, yzHataMetni, yzIste, type YzTakipSonucu } from "../yz";
import { bildir, icerikAlani } from "./Parcalar";

/*
 * Başlığın (haber dosyasının) son gelişmeleri: yapay zeka internette
 * arayıp kısa bir takip paragrafı yazıyor (belgeler/yapay-zeka.md). Bizdeki
 * son satırlar da gidiyor: model "zaten yazdık" dediğini tekrarlamasın.
 * Sonuç düzenlenebilir; kaynaklar sağlayıcının alıntılarından, producer
 * doğrulamadan plana girmesin diye bağlantılı. Özellik kişiye açık değilse
 * panel çizilmiyor.
 */

const ARALIKLAR: { gun: 1 | 3 | 7; ad: Anahtar }[] = [
  { gun: 1, ad: "yzSon24Saat" },
  { gun: 3, ad: "yzSon3Gun" },
  { gun: 7, ad: "yzSon7Gun" },
];

/** Başlığın bizdeki son satırları: son Next Day planlarındaki gelişmeler, sonra haftalık kalemler; yeniden eskiye. */
export const baslikGecmisi = (d: Durum, baslikId?: string) => {
  if (!baslikId) return [];
  const planBasliklari = d.planlar
    .flatMap((p) => p.basliklar.filter((b) => b.baslikId === baslikId).map((b) => ({ id: b.id, tarih: p.tarih })))
    .sort((a, b) => b.tarih.localeCompare(a.tarih))
    .slice(0, 5);
  const gelismeler = planBasliklari.flatMap((pb) => d.gelismeler.filter((g) => g.planBaslikId === pb.id).map((g) => (g.yer ? `${g.yer} / ${g.metin}` : g.metin)));
  const kalemler = d.haftalik
    .flatMap((h) => h.kalemler.filter((k) => k.baslikId === baslikId).map((k) => ({ t: k.tarih ?? h.baslangic, m: kalemAdi(k) })))
    .sort((a, b) => b.t.localeCompare(a.t))
    .map((x) => x.m);
  return [...new Set([...gelismeler, ...kalemler])].slice(0, 15);
};

const alanAdi = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** Gelişmenin kaynak adı: alıntılanan sitelerin alan adları. */
export const kaynakAdlari = (s: YzTakipSonucu) => [...new Set(s.kaynaklar.map((k) => alanAdi(k.url)))].slice(0, 3).join("، ");

export function YzSonGelismeler({
  baslik,
  baslikId,
  ekle,
  ekleMetni,
}: {
  baslik: string;
  baslikId?: string;
  /** Sonucu yerine yazar (gelişme olarak, forma); yoksa yalnız kopyalanır. */
  ekle?: (s: YzTakipSonucu) => void;
  ekleMetni?: string;
}) {
  const { t } = useDil();
  const v = useVeri();
  const ozellik = useYz("takipMetni");
  const [gun, setGun] = useState<1 | 3 | 7>(1);
  const [bekliyor, setBekliyor] = useState(false);
  const [sonuc, setSonuc] = useState<YzTakipSonucu | null>(null);
  if (!ozellik || !baslik.trim()) return null;
  const bitti = ozellik.kalan <= 0;
  const getir = async () => {
    if (bekliyor || bitti) return;
    setBekliyor(true);
    const r = await yzIste("takipMetni", { baslik, gun, bugun: bugun(), gecmis: baslikGecmisi(v, baslikId) });
    setBekliyor(false);
    if (r.tamam) setSonuc(r.veri);
    else bildir(yzHataMetni(t, r.hata));
  };
  return (
    <div className="yz-takip" data-yz-takip>
      <div className="yz-satir">
        <div className="cipler" role="group" aria-label={t("yzAralik")}>
          {ARALIKLAR.map((a) => (
            <button key={a.gun} type="button" className={`cip cip-dugme${gun === a.gun ? " secili" : ""}`} aria-pressed={gun === a.gun} onClick={() => setGun(a.gun)} data-yz-gun={a.gun}>
              {t(a.ad)}
            </button>
          ))}
        </div>
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={getir} aria-disabled={bekliyor || bitti} title={bitti ? t("yzSinirDoldu") : undefined} data-yz-takip-getir>
          {bekliyor ? <Loader2 size={14} className="donen" /> : <Search size={14} />} {t("yzSonGelismeleriGetir")}
        </button>
        {bitti && <small className="sonuk">{t("yzSinirDoldu")}</small>}
      </div>
      {sonuc && (
        <div className="yz-oneri-kutu" data-yz-takip-sonuc>
          <textarea {...icerikAlani} rows={5} value={sonuc.metin} onChange={(e) => setSonuc({ ...sonuc, metin: e.target.value })} data-yz-takip-metin />
          {sonuc.kaynaklar.length > 0 && (
            <ul className="yz-kaynaklar" aria-label={t("yzKaynaklar")}>
              {sonuc.kaynaklar.map((k) => (
                <li key={k.url}>
                  <a href={k.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={12} /> <b>{alanAdi(k.url)}</b> {k.baslik && <span dir="auto">· {k.baslik}</span>}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="form-alt">
            <button
              type="button"
              className="dugme dugme-ikincil dugme-kucuk"
              onClick={() => void navigator.clipboard?.writeText(sonuc.metin).then(() => bildir(t("bKopyalandi")), () => undefined)}
              data-yz-takip-kopyala
            >
              <ClipboardCopy size={14} /> {t("metniKopyala")}
            </button>
            {ekle && (
              <button
                type="button"
                className="dugme dugme-kucuk"
                disabled={!sonuc.metin.trim()}
                onClick={() => {
                  ekle({ ...sonuc, metin: sonuc.metin.trim() });
                  setSonuc(null);
                }}
                data-yz-takip-ekle
              >
                <Plus size={14} /> {ekleMetni ?? t("ekle")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
