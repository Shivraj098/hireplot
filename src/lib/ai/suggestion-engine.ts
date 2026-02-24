import { Prisma } from "@prisma/client";
type ExperienceItem = {
  company: string;
  role: string;
  duration: string;
  description: string;
};

type EducationItem = {
  institution: string;
  degree: string;
  duration: string;
};

export type StructuredResumeContent = {
  summary?: string;
  experience?: ExperienceItem[];
  skills?: string[];
  education?: EducationItem[];
};

export type SkillGapResult = {
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
};

type SectionSuggestion = {
  section: keyof StructuredResumeContent;
  originalContent: Prisma.InputJsonValue;
  suggestedContent: Prisma.InputJsonValue;
};

export function generateSectionSuggestions(
  resumeContent: StructuredResumeContent,
  skillGap: SkillGapResult
): SectionSuggestion[] {
  const suggestions: SectionSuggestion[] = [];

  // Summary suggestion
  if (resumeContent.summary) {
    suggestions.push({
      section: "summary",
      originalContent: resumeContent.summary,
      suggestedContent: `${resumeContent.summary}

Optimized to better align with job-required skills.`,
    });
  }

  // Skills suggestion (only if gaps exist)
  if (skillGap.missingSkills.length > 0) {
    const existingSkills = resumeContent.skills ?? [];

    suggestions.push({
      section: "skills",
      originalContent: existingSkills,
      suggestedContent: [
        ...existingSkills,
        ...skillGap.missingSkills.filter(
          (skill) => !existingSkills.includes(skill)
        ),
      ],
    });
  }

  return suggestions;
}