import { Component, type ErrorInfo, type ReactNode } from "react";
import { metin } from "../dil";

/*
 * Çizimde fırlatılan hata bütün sayfayı beyaz bırakıyordu: tarayıcıda kalan
 * kayıt (demo verisi, gerçek kip oturumu) bozuk bir yola girince kişi ne
 * olduğunu göremiyor, gizli pencerede açılıyor diye ayrım yapabiliyordu.
 * Şimdi hatanın metni görünüyor, kopyalanıp iletilebiliyor; ana sayfaya
 * dönmek de buradan. Hook kullanılamadığı için dil `metin`in o anki dili.
 */
export class HataSiniri extends Component<{ children: ReactNode }, { hata: Error | null }> {
  state = { hata: null as Error | null };
  static getDerivedStateFromError(hata: Error) {
    return { hata };
  }
  componentDidCatch(hata: Error, bilgi: ErrorInfo) {
    console.error(hata, bilgi.componentStack);
  }
  render() {
    const { hata } = this.state;
    if (!hata) return this.props.children;
    const ayrinti = `${hata.message}\n${location.hash}\n${hata.stack ?? ""}`.slice(0, 2000);
    return (
      <main className="hata-siniri" data-hata-siniri>
        <div className="kart">
          <h1>{metin("hsBaslik")}</h1>
          <pre dir="ltr">{ayrinti}</pre>
          <div className="dugmeler">
            <button type="button" className="dugme" onClick={() => location.reload()}>
              {metin("hsYenile")}
            </button>
            <button
              type="button"
              className="dugme dugme-ikincil"
              onClick={() => {
                location.hash = "#/";
                location.reload();
              }}
            >
              {metin("hsAnaSayfa")}
            </button>
            <button type="button" className="dugme dugme-ikincil" onClick={() => void navigator.clipboard?.writeText(ayrinti)}>
              {metin("hsKopyala")}
            </button>
          </div>
        </div>
      </main>
    );
  }
}
