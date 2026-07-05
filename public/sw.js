self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Zoya", body: event.data.text() };
  }
  const title = payload.title || "Zoya";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/favicon.ico",
      data: { url: payload.url || "/lifestyle-manager" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/lifestyle-manager";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
