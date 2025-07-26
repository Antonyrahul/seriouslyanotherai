import { SITE_CONFIG } from "@/lib/constants/config";

export function Logo() {
  return (
    <div className="text-xs text-white font-semibold bg-gradient-to-b from-zinc-600 to-gray-900 rounded-sm px-2 py-0.5 flex items-baseline">
      <span className="uppercase">{SITE_CONFIG.title}</span>
    </div>
  );
}
