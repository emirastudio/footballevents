// Client-side ring buffer of recent console.error / console.warn calls. The
// floating bug-report modal reads the buffer and attaches it to the submission
// so triage doesn't need a back-and-forth — most user-reported bugs already
// surface as a console error a few seconds before the report is filed.
//
// Patching is idempotent and only runs in the browser. The original console
// methods stay intact so DevTools still shows everything.

const BUFFER_SIZE = 20;
type ConsoleEntry = { ts: number; level: "error" | "warn"; message: string };
const buffer: ConsoleEntry[] = [];
let installed = false;

function stringify(args: unknown[]): string {
  return args
    .map((a) => {
      if (a instanceof Error) return `${a.name}: ${a.message}`;
      if (typeof a === "string") return a;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(" ");
}

export function installConsoleCapture(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const origError = window.console.error;
  const origWarn = window.console.warn;
  window.console.error = (...args: unknown[]) => {
    buffer.push({ ts: Date.now(), level: "error", message: stringify(args).slice(0, 500) });
    if (buffer.length > BUFFER_SIZE) buffer.shift();
    origError.apply(window.console, args as []);
  };
  window.console.warn = (...args: unknown[]) => {
    buffer.push({ ts: Date.now(), level: "warn", message: stringify(args).slice(0, 500) });
    if (buffer.length > BUFFER_SIZE) buffer.shift();
    origWarn.apply(window.console, args as []);
  };
}

export function readConsoleBuffer(): ConsoleEntry[] {
  return buffer.slice();
}
