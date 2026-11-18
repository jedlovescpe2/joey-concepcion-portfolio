import { Fragment } from "react";

/** Letters as hoverable spans (the jedllenado.com/cv heading effect); words stay unbreakable. */
export function Letters({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="wd">
            {[...w].map((ch, k) => (
              <span className="ltr" key={k}>
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </>
  );
}

/** Heading: plain part + italic accent part, all letters hoverable. */
export function Heading({ text, em, as: Tag = "h2" }: { text: string; em?: string; as?: "h2" | "h3" }) {
  return (
    <Tag className="display">
      <Letters text={text} />
      {em ? (
        <>
          {" "}
          <em>
            <Letters text={em} />
          </em>
        </>
      ) : null}
    </Tag>
  );
}

/** Words wrapped so long text can light up word by word as you scroll. */
export function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((w, i) =>
        /^\s+$/.test(w) || !w ? (
          w
        ) : (
          <span className="rw" key={i}>
            {w}
          </span>
        ),
      )}
    </>
  );
}

/** Label whose letters roll up with an ochre twin (nav links). */
export function Roll({ text }: { text: string }) {
  return (
    <span className="roll">
      {[...text].map((ch, i) => (
        <span className="ro" key={i}>
          <span className="c top">{ch}</span>
          <span className="c ghost" aria-hidden="true">
            {ch}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Button label split into letters for the ripple-to-italic hover. */
export function Chars({ text }: { text: string }) {
  return (
    <span aria-label={text}>
      {[...text].map((ch, i) => (
        <span className="ch" aria-hidden="true" key={i}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export const Arrow = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M5 15 15 5M7 5h8v8" />
  </svg>
);
