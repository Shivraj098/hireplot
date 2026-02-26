import { extractResumeSkills, extractJobKeywords } from "./extractors";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

function uniqueArray(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function isPartialMatch(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

export function calculateSkillGap(
  resumeContent: unknown,
  jobDescription: string
) {
  const rawResumeSkills = extractResumeSkills(resumeContent);
  const rawJobSkills = extractJobKeywords(jobDescription);

  const resumeSkills = uniqueArray(
    rawResumeSkills.map((s) => normalize(s))
  );

  const jobSkillsNormalized = rawJobSkills.map((s) => normalize(s));

  const jobFrequencyMap: Record<string, number> = {};

  for (const skill of jobSkillsNormalized) {
    jobFrequencyMap[skill] = (jobFrequencyMap[skill] || 0) + 1;
  }

  const uniqueJobSkills = uniqueArray(jobSkillsNormalized);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  let weightedMatchedScore = 0;
  let weightedTotalScore = 0;

  for (const jobSkill of uniqueJobSkills) {
    const frequency = jobFrequencyMap[jobSkill] || 1;
    weightedTotalScore += frequency;

    const matched = resumeSkills.some((resumeSkill) =>
      isPartialMatch(resumeSkill, jobSkill)
    );

    if (matched) {
      matchedSkills.push(jobSkill);
      weightedMatchedScore += frequency;
    } else {
      missingSkills.push(jobSkill);
    }
  }

  const matchPercentage =
    weightedTotalScore === 0
      ? 0
      : Math.round((weightedMatchedScore / weightedTotalScore) * 100);

  return {
    matchedSkills,
    missingSkills,
    matchPercentage,
    jobFrequencyMap,
  };
}