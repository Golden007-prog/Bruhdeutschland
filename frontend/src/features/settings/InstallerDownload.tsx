import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, ShieldAlert, TerminalSquare } from "lucide-react";

/**
 * Robust Owner-Mode installer download (work-order Part B). Instead of linking to `/releases/latest`
 * — which is an EMPTY page until an installer Release is published — this queries the GitHub Releases
 * API and links straight to the matching asset's download URL (OS-detected). If there is no published
 * release / no matching asset / the API fails, it shows a build-from-source fallback rather than
 * dumping the user on the empty Releases listing. Always surfaces the unsigned + checksum note.
 */
const REPO = "Golden007-prog/Bruhdeutschland";
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const REPO_URL = `https://github.com/${REPO}`;
const INSTALLER_SRC = `${REPO_URL}/tree/main/installer`;

type OS = "windows" | "mac" | "linux" | "other";

function detectOS(): OS {
  if (typeof navigator === "undefined") return "other";
  const ua = `${navigator.userAgent} ${navigator.platform ?? ""}`.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "mac";
  if (ua.includes("linux") || ua.includes("x11") || ua.includes("android")) return "linux";
  return "other";
}

interface Asset {
  name: string;
  browser_download_url: string;
}

type State =
  | { kind: "loading" }
  | { kind: "ready"; exe?: Asset; sh?: Asset; sha?: Asset; htmlUrl: string; tag: string }
  | { kind: "unavailable" };

export function InstallerDownload() {
  const [os] = useState<OS>(detectOS);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(RELEASES_API, {
          signal: ctrl.signal,
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) {
          setState({ kind: "unavailable" }); // 404 = no release yet → fallback, never the empty page
          return;
        }
        const json = (await res.json()) as { assets?: Asset[]; html_url?: string; tag_name?: string };
        const assets = json.assets ?? [];
        const exe = assets.find((a) => a.name.toLowerCase().endsWith(".exe"));
        const sh = assets.find((a) => a.name.toLowerCase().endsWith(".sh"));
        const sha = assets.find((a) => /sha256/i.test(a.name));
        if (!exe && !sh) {
          setState({ kind: "unavailable" });
          return;
        }
        setState({ kind: "ready", exe, sh, sha, htmlUrl: json.html_url ?? `${REPO_URL}/releases`, tag: json.tag_name ?? "" });
      } catch {
        setState({ kind: "unavailable" });
      }
    })();
    return () => ctrl.abort();
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Checking for the latest installer…
      </div>
    );
  }

  if (state.kind === "unavailable") {
    return <FallbackFromSource />;
  }

  const primary = os === "mac" || os === "linux" ? state.sh : state.exe;
  const isExe = primary === state.exe && !!state.exe;

  return (
    <div className="mt-3 rounded-md border border-dashed bg-muted/30 p-3 text-xs">
      <p className="font-medium">No bridge running? Use the one-click installer{state.tag ? ` (${state.tag})` : ""}.</p>
      <p className="mt-0.5 text-muted-foreground">
        It installs Node + Claude Code and starts Owner Mode on your machine. It downloads everything at
        runtime and stores no credentials.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {primary ? (
          <a
            href={primary.browser_download_url}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 font-medium text-primary-foreground hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Download {isExe ? "for Windows (.exe)" : "install.sh"}
          </a>
        ) : null}
        {/* Offer the other OS too. */}
        {primary === state.sh && state.exe && (
          <a href={state.exe.browser_download_url} className="inline-flex items-center gap-1 text-primary hover:underline">
            Windows .exe <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
        {primary === state.exe && state.sh && (
          <a href={state.sh.browser_download_url} className="inline-flex items-center gap-1 text-primary hover:underline">
            macOS / Linux <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
        <a href={state.htmlUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:underline">
          All files <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
      {isExe && (
        <p className="mt-2 flex items-start gap-1.5 text-amber-700">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Unsigned app — Windows will warn (&ldquo;More info → Run anyway&rdquo;). Verify it first:{" "}
            <code>Get-FileHash .\DeutschPrep-Owner-Setup.exe -Algorithm SHA256</code>
            {state.sha && (
              <>
                {" "}and compare against{" "}
                <a href={state.sha.browser_download_url} className="font-medium underline">SHA256SUMS.txt</a>.
              </>
            )}
          </span>
        </p>
      )}
    </div>
  );
}

/** Shown when no installer Release exists yet — run Owner Mode from source instead of an empty page. */
function FallbackFromSource() {
  return (
    <div className="mt-3 rounded-md border border-dashed bg-muted/30 p-3 text-xs">
      <p className="flex items-center gap-1.5 font-medium">
        <TerminalSquare className="h-3.5 w-3.5" aria-hidden /> Installer isn&apos;t published yet
      </p>
      <p className="mt-0.5 text-muted-foreground">
        You can run Owner Mode straight from source — it&apos;s the same bootstrapper the installer wraps:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-background p-2 text-[0.7rem] leading-relaxed">
{`git clone ${REPO_URL}
cd Bruhdeutschland
npm install
npm run owner   # builds + serves the app + Claude bridge on http://localhost:8787`}
      </pre>
      <a href={INSTALLER_SRC} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-medium text-primary hover:underline">
        Installer scripts &amp; instructions <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    </div>
  );
}
