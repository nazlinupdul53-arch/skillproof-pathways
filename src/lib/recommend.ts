export interface CourseLike {
  id: string;
  occupation: string;
  course_type: string;
  competency_area: string | null;
}
export interface RatedArea {
  occupation: string;
  area: string;
  rating: number;
}
export interface Recommendation<C> {
  course: C;
  score: number;
  reasons: string[];
}

/**
 * Rank courses for a user. Only courses for the user's target occupations are returned.
 * Areas rated 1–2 count as gaps (+3), unrated areas as unknown (+1), bridging courses +2.
 */
export function recommendCourses<C extends CourseLike>(
  courses: C[],
  occupations: string[],
  ratings: RatedArea[],
): Recommendation<C>[] {
  const occ = new Set(occupations.filter(Boolean));
  const out: Recommendation<C>[] = [];
  for (const course of courses) {
    if (!occ.has(course.occupation)) continue;
    let score = 1;
    const reasons = [`Matches your target occupation: ${course.occupation}`];
    if (course.competency_area) {
      const r = ratings.find((x) => x.occupation === course.occupation && x.area === course.competency_area);
      if (!r) {
        score += 1;
        reasons.push(`You haven't assessed "${course.competency_area}" yet`);
      } else if (r.rating <= 2) {
        score += 3;
        reasons.push(`Skill gap: you rated "${course.competency_area}" ${r.rating}/5`);
      }
    }
    if (course.course_type === "Bridging") {
      score += 2;
      reasons.push("Bridging programs are often requested by assessing authorities");
    }
    out.push({ course, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score);
}
