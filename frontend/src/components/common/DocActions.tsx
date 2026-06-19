import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { copyText, downloadText } from "@/lib/doc/export";
import { cn } from "@/lib/utils";

/**
 * Copy + Download actions for a generated document (page-audit §3.3). Disabled while the text is
 * empty so a freshly-loaded generator doesn't offer an empty file. Copy shows a transient "Copied".
 */
export function DocActions({
  text,
  filename,
  className,
  size = "sm",
}: {
  text: string;
  filename: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const [copied, setCopied] = useState(false);
  const empty = !text.trim();

  const onCopy = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label="Document actions">
      <Button type="button" variant="outline" size={size} onClick={onCopy} disabled={empty}>
        {copied ? (
          <>
            <Check className="text-emerald-600" aria-hidden /> Copied
          </>
        ) : (
          <>
            <Copy aria-hidden /> Copy
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => downloadText(filename, text)}
        disabled={empty}
      >
        <Download aria-hidden /> Download
      </Button>
    </div>
  );
}
