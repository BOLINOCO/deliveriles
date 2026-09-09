"use client";

import Link from "next/link";
import { SHOPS } from "@/lib/mock-data";
import { getCourseEarnings, type Course } from "@/lib/livreur-mock";

const SIZE_LABEL: Record<Course["cartSize"], string> = {
  SMALL: "Petit",
  MEDIUM: "Moyen",
  LARGE: "Grand",
};

export default function CourseCard({
  course,
  onRefuse,
  onAccept,
  accepting = false,
}: {
  course: Course;
  onRefuse: (id: string) => void;
  onAccept: (id: string) => void;
  accepting?: boolean;
}) {
  const mockedShop = SHOPS.find((s) => s.id === course.shopId);
  const shopName = course.shopName ?? mockedShop?.name;
  const shopColor = course.shopColor ?? mockedShop?.color ?? "#0F172A";
  // Gains recalculés côté serveur pour les courses réelles ; mock sinon.
  const earnings = course.driverEarnings ?? getCourseEarnings(course).driverEarnings;

  return (
    <div className="rounded-2xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 flex-shrink-0 rounded-lg" style={{ background: shopColor }} />
          <div>
            <p className="text-sm font-extrabold text-black">{shopName}</p>
            <p className="text-xs text-neutral-400">
              {course.distanceKm} km · {SIZE_LABEL[course.cartSize]}
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 text-lg font-extrabold text-brand-orange">
          {earnings.toFixed(2)} €
        </span>
      </div>
      <p className="mt-3 text-sm text-neutral-500">{course.itemsSummary}</p>
      <p className="mt-1 text-xs text-neutral-400">→ {course.buyerAddress}</p>
      <div className="mt-4 flex gap-2.5">
        {course.deliveryStatus && course.deliveryStatus !== "pending" ? (
          // Course déjà acceptée par le livreur : pas de re-acceptation possible.
          <Link
            href={`/courses/${course.id}`}
            className="flex-1 rounded-full border border-neutral-200 py-2.5 text-center text-sm font-bold text-black hover:bg-neutral-50"
          >
            Ouvrir la course
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onRefuse(course.id)}
              disabled={accepting}
              className="flex-1 rounded-full border border-neutral-200 py-2.5 text-sm font-bold text-black hover:bg-neutral-50 disabled:opacity-50"
            >
              Refuser
            </button>
            <button
              type="button"
              onClick={() => onAccept(course.id)}
              disabled={accepting}
              className="flex-1 rounded-full bg-brand-orange py-2.5 text-center text-sm font-bold text-white hover:bg-brand-orange-deep disabled:opacity-50"
            >
              {accepting ? "Acceptation…" : "Accepter"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
