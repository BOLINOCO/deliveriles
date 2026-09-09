"use client";

import type { ReactNode } from "react";

export function RoleToggleCard({
  title,
  description,
  icon,
  active,
  alwaysOn = false,
  onToggle,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  active: boolean;
  alwaysOn?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={alwaysOn ? undefined : onToggle}
      disabled={alwaysOn}
      aria-pressed={active}
      className={`flex flex-col gap-2.5 rounded-2xl border-[1.5px] p-5 text-left transition-all duration-200 ${
        active ? "border-brand-blue bg-brand-blue-soft" : "border-neutral-200 bg-white"
      } ${alwaysOn ? "cursor-default" : "hover:-translate-y-1"}`}
    >
      <div className="flex items-center justify-between">
        <span className={`h-6 w-6 ${active ? "text-brand-blue" : "text-black"}`}>{icon}</span>
        {alwaysOn ? (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.65rem] font-bold text-neutral-500">
            Toujours actif
          </span>
        ) : (
          <span
            aria-hidden="true"
            className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
              active ? "bg-brand-blue" : "bg-neutral-200"
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white transition-transform ${
                active ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        )}
      </div>
      <span className="text-base font-extrabold text-black">{title}</span>
      <span className="text-sm text-neutral-500">{description}</span>
    </button>
  );
}
