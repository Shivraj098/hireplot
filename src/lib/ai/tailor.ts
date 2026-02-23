type ExperienceEntry = {
  company?: string;
  position?: string;
  duration?: string;
  description?: string;
  [key: string]: string | undefined;
};

type EducationEntry = {
  school?: string;
  degree?: string;
  year?: string;
  [key: string]: string | undefined;
};

type ResumeContent = {
  summary?: string;
  experience?: ExperienceEntry[];
  skills?: string[];
  education?: EducationEntry[];
};

export async function tailorResumeWithAI(
  resumeContent: ResumeContent,
  jobDescription: string
): Promise<ResumeContent> {
  void jobDescription; // intentional unused param (mock mode)

  return {
    ...resumeContent,
    summary: `${resumeContent.summary || ""}

Tailored for job requirements based on skill gap analysis.`,
  };
}