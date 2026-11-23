export function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "xs"
      ? "h-6 w-6 text-[10px]"
      : size === "sm"
        ? "h-8 w-8 text-xs"
        : size === "lg"
          ? "h-11 w-11 text-sm"
          : "h-9 w-9 text-xs";

  const initials = (name ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "User avatar"}
        referrerPolicy="no-referrer"
        className={`${sizeClass} shrink-0 rounded-full border border-[#E7E1D8] object-cover`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full border border-[#D4E3DC] bg-[#E9F2EE] font-semibold text-[#234738]`}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
