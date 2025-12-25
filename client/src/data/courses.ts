import coursesData from "../../../data/courses.json";

export interface Course {
  id: string;
  name: string;
  abbr: string;
}

export const courses: Course[] = coursesData.courses;

// Helper function to get course name by ID
export const getCourseName = (id: string): string => {
  const course = courses.find(c => c.id === id);
  return course ? course.name : id;
};

// Helper function to get course abbreviation by ID
export const getCourseAbbr = (id: string): string => {
  const course = courses.find(c => c.id === id);
  return course ? course.abbr : id;
};
