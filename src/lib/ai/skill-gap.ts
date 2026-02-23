import { extractResumeSkills, extractJobKeywords } from "./extractors";

export function calculateSkillGap(
  resumeContent: unknown,
  jobDescription: string
) {
  const resumeSkills = extractResumeSkills(resumeContent);
  const jobSkills = extractJobKeywords(jobDescription);

  const missingSkills = jobSkills.filter(
    (skill) => !resumeSkills.includes(skill)
  );

  const matchedSkills = jobSkills.filter(
    (skill) => resumeSkills.includes(skill)
  );

  return {
    matchedSkills,
    missingSkills,
    matchPercentage:
      jobSkills.length === 0
        ? 0
        : Math.round(
            (matchedSkills.length / jobSkills.length) * 100
          ),
  };
}