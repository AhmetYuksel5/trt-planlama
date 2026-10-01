import type { Kisi } from "../veri";
import { MediaAna, NewsGatheringAna, NewsdeskAna, OutputAna, ProgramAna, YonetimAna } from "./ana/Birimler";
import MuhabirAna from "./ana/Muhabir";
import PlanlamaAna from "./ana/Planlama";

/**
 * Ana sayfa sabit bir ekran değil, kişinin birimine göre şekillenen bir
 * çalışma masası (rapor bölüm 6).
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
      return <YonetimAna />;
  }
}
