import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-4 text-center text-[#1C1917]">
      <div className="surface-elevated w-full max-w-md rounded-3xl p-8">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <p className="mt-6 text-xs font-semibold tracking-widest text-[#2D5A47] uppercase">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[#57534E]">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-6">
          <Link href="/" className="btn-primary w-full">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
