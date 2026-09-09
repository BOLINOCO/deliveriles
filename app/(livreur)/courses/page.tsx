"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useCourses } from "@/components/livreur/use-courses";
import CourseCard from "@/components/livreur/course-card";

export default function CoursesPage() {
  const { courses, demo, loading, error, accept } = useCourses();
  const router = useRouter();
  const [hidden, setHidden] = useState<string[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);

  function handleRefuse(id: string) {
    setHidden((prev) => [...prev, id]);
  }

  async function handleAccept(id: string) {
    setAccepting(id);
    const target = await accept(id);
    setAccepting(null);
    if (target) router.push(target);
  }

  const visible = courses.filter((c) => !hidden.includes(c.id));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-black">Courses disponibles</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {demo
            ? "Mode démo : courses simulées, sans base de données."
            : "Les nouvelles courses apparaissent automatiquement."}
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-neutral-400">Chargement des courses…</p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-400">
          Aucune course disponible pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onRefuse={handleRefuse}
              onAccept={handleAccept}
              accepting={accepting === c.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
