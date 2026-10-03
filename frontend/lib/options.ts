export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Customer Success",
  "Human Resources",
  "Finance",
  "Operations",
  "Legal",
  "IT & Security",
];

export const DESIGNATIONS = [
  "Intern",
  "Associate",
  "Software Engineer",
  "Senior Software Engineer",
  "Staff Engineer",
  "Principal Engineer",
  "Engineering Manager",
  "Product Manager",
  "Senior Product Manager",
  "Designer",
  "Senior Designer",
  "Design Lead",
  "Sales Executive",
  "Account Manager",
  "HR Executive",
  "HR Manager",
  "Finance Analyst",
  "Operations Manager",
  "Customer Success Manager",
  "Analyst",
  "Manager",
  "Director",
];

export interface AccentPalette {
  id: string;
  label: string;
  /** Primary accent — used for chips, rings, gradients */
  primary: string;
  /** Full 1..6 ramp used everywhere */
  ramp: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
  };
  soft: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
  };
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: "terracotta",
    label: "Terracotta",
    primary: "#d2694a",
    ramp: {
      1: "#d2694a",
      2: "#7c6cf0",
      3: "#3ba8e0",
      4: "#2f9e6b",
      5: "#e0a93b",
      6: "#d94e8c",
    },
    soft: {
      1: "rgba(210, 105, 74, 0.14)",
      2: "rgba(124, 108, 240, 0.14)",
      3: "rgba(59, 168, 224, 0.14)",
      4: "rgba(47, 158, 107, 0.14)",
      5: "rgba(224, 169, 59, 0.16)",
      6: "rgba(217, 78, 140, 0.14)",
    },
  },
  {
    id: "violet",
    label: "Violet",
    primary: "#7c6cf0",
    ramp: {
      1: "#7c6cf0",
      2: "#a78bfa",
      3: "#5cbcec",
      4: "#4fbb8a",
      5: "#e0a93b",
      6: "#d94e8c",
    },
    soft: {
      1: "rgba(124, 108, 240, 0.16)",
      2: "rgba(167, 139, 250, 0.16)",
      3: "rgba(92, 188, 236, 0.14)",
      4: "rgba(79, 187, 138, 0.14)",
      5: "rgba(224, 169, 59, 0.16)",
      6: "rgba(217, 78, 140, 0.14)",
    },
  },
  {
    id: "emerald",
    label: "Emerald",
    primary: "#2f9e6b",
    ramp: {
      1: "#2f9e6b",
      2: "#3ba8e0",
      3: "#5cbcec",
      4: "#4fbb8a",
      5: "#e0a93b",
      6: "#d94e8c",
    },
    soft: {
      1: "rgba(47, 158, 107, 0.16)",
      2: "rgba(59, 168, 224, 0.14)",
      3: "rgba(92, 188, 236, 0.14)",
      4: "rgba(79, 187, 138, 0.14)",
      5: "rgba(224, 169, 59, 0.16)",
      6: "rgba(217, 78, 140, 0.14)",
    },
  },
  {
    id: "cobalt",
    label: "Cobalt",
    primary: "#3b7dd8",
    ramp: {
      1: "#3b7dd8",
      2: "#7c6cf0",
      3: "#3ba8e0",
      4: "#4fbb8a",
      5: "#e0a93b",
      6: "#d94e8c",
    },
    soft: {
      1: "rgba(59, 125, 216, 0.16)",
      2: "rgba(124, 108, 240, 0.14)",
      3: "rgba(59, 168, 224, 0.14)",
      4: "rgba(79, 187, 138, 0.14)",
      5: "rgba(224, 169, 59, 0.16)",
      6: "rgba(217, 78, 140, 0.14)",
    },
  },
  {
    id: "rose",
    label: "Rose",
    primary: "#d94e8c",
    ramp: {
      1: "#d94e8c",
      2: "#7c6cf0",
      3: "#d2694a",
      4: "#2f9e6b",
      5: "#e0a93b",
      6: "#a78bfa",
    },
    soft: {
      1: "rgba(217, 78, 140, 0.16)",
      2: "rgba(124, 108, 240, 0.14)",
      3: "rgba(210, 105, 74, 0.14)",
      4: "rgba(47, 158, 107, 0.14)",
      5: "rgba(224, 169, 59, 0.16)",
      6: "rgba(167, 139, 250, 0.16)",
    },
  },
];