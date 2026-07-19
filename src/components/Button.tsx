import type { ReactNode } from "react";

export function Button({
  href,
  children,
  variant = "primary",
  onClick,
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  onClick?: () => void;
}) {
  const base =
    "pixel-notch inline-flex items-center gap-2 px-5 py-3 text-sm tracking-wide transition-transform active:scale-[0.97]";
  const styles =
    variant === "primary"
      ? "bg-ink text-paper hover:bg-ink/85"
      : "border border-ink/20 text-ink hover:border-ink/60";

  const content = (
    <>
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </>
  );

  if (href) {
    return (
      <a href={href} data-cursor="hover" className={`${base} ${styles}`}>
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="hover"
      className={`${base} ${styles}`}
    >
      {content}
    </button>
  );
}

export function IconButton({
  direction,
  onClick,
  label,
}: {
  direction: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-cursor="hover"
      className="pixel-notch w-11 h-11 flex items-center justify-center bg-ink text-paper hover:bg-[#3d5fce] transition-colors active:scale-[0.94]"
    >
      <span aria-hidden="true">{direction === "left" ? "←" : "→"}</span>
    </button>
  );
}
