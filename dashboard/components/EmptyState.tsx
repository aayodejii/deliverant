import { LuPlug, LuPackage, LuRotateCcw } from "react-icons/lu";
import type { IconType } from "react-icons";

const presets: Record<
  string,
  {
    icon: IconType;
    title: string;
    description: string;
    cta?: string;
    ctaHref?: string;
  }
> = {
  endpoints: {
    icon: LuPlug,
    title: "No endpoints configured",
    description:
      "Create a webhook endpoint to start receiving event deliveries.",
    cta: "Create Endpoint",
  },
  deliveries: {
    icon: LuPackage,
    title: "No deliveries found",
    description:
      "Deliveries will appear here once events are ingested and dispatched to your endpoints.",
  },
  replays: {
    icon: LuRotateCcw,
    title: "No replay history",
    description:
      "Use replays to re-deliver failed or expired webhooks to your endpoints.",
  },
};

export function EmptyState({
  preset,
  onAction,
}: {
  preset: keyof typeof presets;
  onAction?: () => void;
}) {
  const config = presets[preset];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-accent-dim flex items-center justify-center mb-4">
        <Icon size={22} className="text-accent" />
      </div>
      <h3 className="text-base font-medium text-text-primary">
        {config.title}
      </h3>
      <p className="text-sm text-text-muted mt-1 max-w-sm">
        {config.description}
      </p>
      {config.cta && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
        >
          {config.cta}
        </button>
      )}
    </div>
  );
}
