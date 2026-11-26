import { describe, expect, it } from "vitest";
import { recommendCourses } from "./recommend";

const courses = [
  { id: "a", occupation: "Registered Nurse", course_type: "Short course", competency_area: "Infection control" },
  { id: "b", occupation: "Registered Nurse", course_type: "Bridging", competency_area: "Local regulatory practice" },
  { id: "c", occupation: "Teacher", course_type: "Bridging", competency_area: "Curriculum knowledge" },
];

describe("recommendCourses", () => {
  it("only returns courses for the user's target occupations", () => {
    const r = recommendCourses(courses, ["Registered Nurse"], []);
    expect(r.map((x) => x.course.id).sort()).toEqual(["a", "b"]);
  });
  it("ranks a low-rated skill gap above an unassessed bridging course", () => {
    const r = recommendCourses(courses, ["Registered Nurse"], [
      { occupation: "Registered Nurse", area: "Infection control", rating: 1 },
      { occupation: "Registered Nurse", area: "Local regulatory practice", rating: 5 },
    ]);
    expect(r[0]?.course.id).toBe("a");
    expect(r[0]?.score).toBe(4);
    expect(r[1]?.score).toBe(3);
  });
});
