// src/lib/ai/extractors.ts

export type ResumeContent = {
  summary?: string;
  experience?: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  skills?: string[];
  education?: {
    institution: string;
    degree: string;
    duration: string;
  }[];
};

export function extractResumeSkills(content: unknown): string[] {
  if (!content || typeof content !== "object") return [];

  const data = content as {
    skills?: unknown[];
  };

  if (!Array.isArray(data.skills)) return [];

  return data.skills
    .map((skill) =>
      String(skill)
        .toLowerCase()
        .replace(/\.js/g, "")
        .replace(/\s+/g, "")
        .trim()
    )
    .filter(Boolean);
}
export function extractJobKeywords(description: string): string[] {
  if (!description) return [];

  const normalized = description
    .toLowerCase()
    .replace(/\.js/g, "")
    .replace(/\s+/g, "");

  const commonTechSkills = [
    "react",
    "nextjs",
    "node",
    "typescript",
    "javascript",
    "postgres",
    "mongodb",
    "docker",
    "aws",
    "python",
    "java",
    "sql",
  ];

  return commonTechSkills.filter((skill) =>
    normalized.includes(skill)
  );
}