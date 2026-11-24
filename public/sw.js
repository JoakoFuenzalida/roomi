const CACHE_NAME = "roomi-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  let data = { title: "Roomi", body: "Tienes una notificación", url: "/hoy" };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/badge.svg",
      tag: data.tag,
      data: { url: data.url, task: data.task },
      actions: data.task ? [{ action: "complete", title: "✅ Listo" }] : [],
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url = "/hoy", task } = event.notification.data || {};

  if (event.action === "complete" && task) {
    event.waitUntil(completeFromNotification(task, event.notification.tag));
    return;
  }

  event.waitUntil(openOrFocus(url));
});

function openOrFocus(url) {
  return self.clients.matchAll({ type: "window" }).then((clients) => {
    const existing = clients.find((c) => c.url.includes(url));
    if (existing) return existing.focus();
    return self.clients.openWindow(url);
  });
}

async function completeFromNotification(task, tag) {
  let title = "¡Listo! ✅";
  let body = `"${task.title}" quedó marcada.`;
  let url = "/hoy";

  try {
    const res = await fetch("/api/tasks/complete", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, cycle: task.cycle }),
    });
    if (res.status === 409) {
      title = "Ya estaba lista";
      body = `Alguien ya marcó "${task.title}".`;
    } else if (res.status === 401) {
      title = "Entra a Roomi";
      body = "Tu sesión expiró. Toca para entrar y marcarla.";
      url = "/login";
    } else if (!res.ok) {
      throw new Error(String(res.status));
    }
  } catch {
    title = "No se pudo marcar";
    body = `Toca para abrir Roomi y marcar "${task.title}".`;
  }

  await self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/badge.svg",
    tag,
    silent: true,
    data: { url },
  });
}
