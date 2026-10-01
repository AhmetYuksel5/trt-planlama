/**
 * Alt çubuğun simgeleri. Elle çizilmiş, tek renk: `currentColor` aldıkları
 * için açık sekmenin rengi CSS'ten geliyor, simge kütüphanesi gerekmiyor.
 */
const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const SimgeEv = () => (
  <Svg>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20h14V9.5" />
  </Svg>
);

export const SimgeTakvim = () => (
  <Svg>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const SimgePaket = () => (
  <Svg>
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="m10 10 4.5 2.5L10 15z" />
  </Svg>
);

export const SimgeKisiler = () => (
  <Svg>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
    <path d="M16 5.6a3 3 0 0 1 0 5.8M18 14.8c1.6.7 2.6 2.3 3 4.7" />
  </Svg>
);

export const SimgeMenu = () => (
  <Svg>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const SimgeZil = () => (
  <Svg>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </Svg>
);

export const SimgeKapat = () => (
  <Svg>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
