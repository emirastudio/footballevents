import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// IndexNow ownership verification: GET /{INDEXNOW_KEY}.txt → returns the key.
// The current matcher excludes any path containing a dot (".*\\..*"), so files
// like `<key>.txt` would otherwise be served as static 404s. We intercept here.
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // IndexNow ownership verification.
  if (INDEXNOW_KEY && req.method === "GET" && path === `/${INDEXNOW_KEY}.txt`) {
    return new NextResponse(INDEXNOW_KEY, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Anything that looks like a real file at root (robots.txt, ads.txt, …) —
  // let Next.js handle it directly. Don't run i18n routing on file requests.
  if (/\.[a-zA-Z0-9]{2,5}$/.test(path)) {
    return NextResponse.next();
  }

  const res = intl(req);
  // Expose the pathname to server components (used to hide site chrome on /embed).
  res.headers.set("x-pathname", path);
  return res;
}

export const config = {
  matcher: [
    // Original next-intl matcher — skip API, internals, and any path with a dot.
    "/((?!api|_next|_vercel|.*\\..*).*)",
    // Plus a narrow extra slot for the IndexNow key file at root.
    "/:key.txt",
  ],
};
