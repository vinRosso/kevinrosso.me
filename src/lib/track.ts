// Sends a custom event to GoatCounter (if enabled in src/data/site.ts).
// No cookies, no personal data: only the event name.

type GoatCounter = { count: (opts: { path: string; title?: string; event?: boolean }) => void };

export function track(path: string, title?: string): void {
  const send = () => {
    const gc = (window as unknown as { goatcounter?: GoatCounter }).goatcounter;
    if (gc?.count) gc.count({ path, title, event: true });
    return Boolean(gc?.count);
  };
  // The counter script loads async: retry for a few seconds if it is not ready yet.
  if (send()) return;
  let tries = 0;
  const timer = window.setInterval(() => {
    if (send() || ++tries > 10) window.clearInterval(timer);
  }, 500);
}
