"use client";

import { useEffect, useRef } from "react";

export type ScrambleSegment = { text: string; italic?: boolean };

type Props = {
  segments: ScrambleSegment[];
  className?: string;
  startDelay?: number;
  perChar?: number;
  swapEvery?: number;
  tailHold?: number;
};

const POOL = "0123456789";
const rand = () => POOL.charAt(Math.floor(Math.random() * POOL.length));

export function HeroScramble({
  segments,
  className,
  startDelay = 80,
  perChar = 10,
  swapEvery = 14,
  tailHold = 25,
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const h1 = ref.current;
    if (!h1) return;

    h1.innerHTML = "";
    const chars: { el: HTMLSpanElement; char: string; isSpace: boolean }[] = [];

    segments.forEach((seg) => {
      for (const c of seg.text) {
        const span = document.createElement("span");
        span.className = "ch ch--scrambling" + (seg.italic ? " ch--it" : "");
        if (c === " ") span.innerHTML = "&nbsp;";
        else span.textContent = rand();
        h1.appendChild(span);
        chars.push({ el: span, char: c, isSpace: c === " " });
      }
    });

    const startTimer = window.setTimeout(() => {
      let revealed = 0;
      const swapTimer = window.setInterval(() => {
        for (let i = revealed; i < chars.length; i++) {
          if (!chars[i].isSpace) chars[i].el.textContent = rand();
        }
      }, swapEvery);

      const revealTimer = window.setInterval(() => {
        if (revealed >= chars.length) {
          window.clearInterval(revealTimer);
          window.setTimeout(() => {
            window.clearInterval(swapTimer);
            chars.forEach((c) => {
              c.el.classList.remove("ch--scrambling");
              if (c.isSpace) c.el.innerHTML = "&nbsp;";
              else c.el.textContent = c.char;
            });
          }, tailHold);
          return;
        }
        const c = chars[revealed];
        c.el.classList.remove("ch--scrambling");
        if (c.isSpace) c.el.innerHTML = "&nbsp;";
        else c.el.textContent = c.char;
        revealed++;
      }, perChar);

      return () => {
        window.clearInterval(swapTimer);
        window.clearInterval(revealTimer);
      };
    }, startDelay);

    return () => window.clearTimeout(startTimer);
  }, [segments, startDelay, perChar, swapEvery, tailHold]);

  return <h1 ref={ref} className={className} />;
}
