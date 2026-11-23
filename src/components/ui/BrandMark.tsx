import { Home } from "lucide-react";

export function BrandMark({
  showLabel = true,
  label = "Family Administrator",
}: {
  showLabel?: boolean;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2D5A47] text-white shadow-xs">
        <Home className="h-4.5 w-4.5 stroke-[2.2]" />
      </span>
      {showLabel && (
        <span className="font-display text-base font-bold tracking-tight text-[#1C1917]">
          {label}
        </span>
      )}
    </div>
  );
}
