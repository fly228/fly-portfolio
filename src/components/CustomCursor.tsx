import { useEffect, useRef } from "react";

/**
 * Ring-and-dot cursor, cursor:none on the page, ring lags the pointer via a
 * CSS transition and scales up over anything marked data-cursor="hover".
 *
 * Deliberately overrides the "no custom cursors" default from the
 * design-taste-frontend skill: the brief here explicitly asked to reproduce
 * craft.wild.as's cursor treatment, which is exactly the kind of contextual
 * override the skill itself allows.
 *
 * Only active on fine-pointer devices (mouse/trackpad); touch devices never
 * get cursor:none and never see this layer.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isFinePointer) return;

    document.body.classList.add("has-custom-cursor");

    function onMove(e: MouseEvent) {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    }

    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const hoverEl = target.closest('[data-cursor="hover"]');
      ringRef.current?.classList.toggle("cursor-ring--active", !!hoverEl);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.body.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
