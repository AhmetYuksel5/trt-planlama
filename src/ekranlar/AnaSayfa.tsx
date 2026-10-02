import type { Kisi } from "../veri";
import YoneticiPaneli from "./YoneticiPaneli";
import { MediaAna, NewsGatheringAna, NewsdeskAna, OutputAna, ProgramAna } from "./ana/Birimler";
import MuhabirAna from "./ana/Muhabir";
import PlanlamaAna from "./ana/Planlama";

/**
 * Ana sayfa sabit bir ekran değil, kişinin birimine göre şekillenen bir
 * çalışma masası (rapor bölüm 6). Yönetim biriminin masası yönetici paneli;
 * birim yöneticileri ona menüden ulaşıyor, kendi masaları değişmiyor.
 */
export default function AnaSayfa({ ben }: { ben: Kisi }) {
  switch (ben.birim) {
    case "planlama":
      return <PlanlamaAna ben={ben} />;
    case "muhabir":
      return <MuhabirAna ben={ben} />;
    case "newsdesk":
      return <NewsdeskAna ben={ben} />;
    case "newsgathering":
      return <NewsGatheringAna />;
    case "program":
      return <ProgramAna />;
    case "output":
      return <OutputAna />;
    case "media":
      return <MediaAna />;
    case "yonetim":
      return <YoneticiPaneli ben={ben} />;
  }
}
