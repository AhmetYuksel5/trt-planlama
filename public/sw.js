/*
 * Plannersflow servis betiği: yalnız bildirim (Web Push). İstekleri yakalamaz,
 * önbellek tutmaz: sürüm hemen görünsün diye index.html önbelleğe alınmıyor,
 * burada da alınmıyor.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let y = {};
  try {
    y = e.data ? e.data.json() : {};
  } catch {
    y = { metin: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(y.baslik || "Plannersflow", {
      body: y.metin || "",
      icon: "uygulama-192.png",
      badge: "uygulama-192.png",
      tag: y.etiket || undefined,
      dir: "auto",
      data: { yol: y.yol || "" },
    }),
  );
});

/* Bildirime basınca açık pencere varsa ona dönülür ve işin sayfası açılır, yoksa yeni pencere. */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const hedef = new URL(self.registration.scope + (e.notification.data?.yol || ""));
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((l) => {
      const p = l.find((c) => c.url.startsWith(self.registration.scope));
      if (p) return p.focus().then((c) => c && c.navigate ? c.navigate(hedef.href) : null);
      return self.clients.openWindow(hedef.href);
    }),
  );
});
