import { Fragment, useMemo } from "react";
import katex from "katex";

/**
 * Render text that may contain inline LaTeX delimited by $...$ (used by GRE/GMAT items). Math spans
 * render with KaTeX; everything else is plain text. KaTeX errors fall back to the raw source rather
 * than throwing, so a malformed expression never breaks the exam.
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => splitMath(text), [text]);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.math ? (
          <span
            key={i}
            // KaTeX output is sanitized markup from a trusted local library.
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part.value, { throwOnError: false, displayMode: false }),
            }}
          />
        ) : (
          <Fragment key={i}>{part.value}</Fragment>
        ),
      )}
    </span>
  );
}

interface Part {
  math: boolean;
  value: string;
}

/** Split on $...$ pairs. Unmatched $ are treated as literal text. */
function splitMath(text: string): Part[] {
  const out: Part[] = [];
  const re = /\$([^$]+)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ math: false, value: text.slice(last, m.index) });
    out.push({ math: true, value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ math: false, value: text.slice(last) });
  return out.length ? out : [{ math: false, value: text }];
}
