"use server";
import {
  generateSectionSuggestions,
  StructuredResumeContent,
} from "@/lib/ai/suggestion-engine";
import { tailorResumeWithAI } from "@/lib/ai/tailor";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { JobStatus, } from "@prisma/client";

import { generateInterviewPrep } from "@/lib/ai/interview-generator";
import { generateAIInterviewPrep } from "@/lib/ai/interview-ai";

type ExperienceItem = {
  company: string;
  role: string;
  duration: string;
  description: string;
};

type ResumeContent = {
  summary?: string;
  experience?: ExperienceItem[];
  skills?: string[];
  education?: {
    institution: string;
    degree: string;
    duration: string;
  }[];
};

export async function createResume(title: string) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const resume = await prisma.resume.create({
    data: {
      title,
      userId: user.id,
      versions: {
        create: {
          userId: user.id,
          content: {
            summary: "",
            experience: [],
            skills: [],
            education: [],
          } as Prisma.InputJsonValue,
          versionType: "BASE",
        },
      },
    },
  });

  revalidatePath("/dashboard");

  return resume;
}

export async function updateResumeSummary(resumeId: string, summary: string) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  if (!baseVersion) {
    throw new Error("Base version not found");
  }

  const content = (baseVersion.content ?? {}) as ResumeContent;

  const updatedContent = {
    ...content,
    summary,
  };

  await prisma.resumeVersion.update({
    where: { id: baseVersion.id },
    data: {
      content: updatedContent as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
}

export async function addExperience(
  resumeId: string,
  experienceItem: ExperienceItem,
) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  if (!baseVersion) {
    throw new Error("Base version not found");
  }

  const content = (baseVersion.content ?? {}) as ResumeContent;

  const updatedContent = {
    ...content,
    experience: [
      ...(Array.isArray(content.experience) ? content.experience : []),
      experienceItem,
    ],
  };

  await prisma.resumeVersion.update({
    where: { id: baseVersion.id },
    data: {
      content: updatedContent as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
}

export async function removeExperience(resumeId: string, index: number) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  if (!baseVersion) {
    throw new Error("Base version not found");
  }

  const content = (baseVersion.content ?? {}) as ResumeContent;

  const currentExperience = Array.isArray(content.experience)
    ? content.experience
    : [];

  const updatedExperience = currentExperience.filter((_item, i) => i !== index);

  const updatedContent = {
    ...content,
    experience: updatedExperience,
  };

  await prisma.resumeVersion.update({
    where: { id: baseVersion.id },
    data: {
      content: updatedContent as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
}

export async function addSkill(resumeId: string, skill: string) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  if (!baseVersion) {
    throw new Error("Base version not found");
  }

  const content = (baseVersion.content ?? {}) as ResumeContent;

  const updatedContent = {
    ...content,
    skills: [...(Array.isArray(content.skills) ? content.skills : []), skill],
  };

  await prisma.resumeVersion.update({
    where: { id: baseVersion.id },
    data: {
      content: updatedContent as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
}

export async function removeSkill(resumeId: string, index: number) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  if (!baseVersion) {
    throw new Error("Base version not found");
  }

  const content = (baseVersion.content ?? {}) as ResumeContent;

  const currentSkills = Array.isArray(content.skills) ? content.skills : [];

  const updatedSkills = currentSkills.filter((_skill, i) => i !== index);

  const updatedContent = {
    ...content,
    skills: updatedSkills,
  };

  await prisma.resumeVersion.update({
    where: { id: baseVersion.id },
    data: {
      content: updatedContent as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
}

export async function addEducation(
  resumeId: string,
  educationItem: {
    institution: string;
    degree: string;
    duration: string;
  },
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  if (!baseVersion) throw new Error("Base version not found");

  const content = (baseVersion.content ?? {}) as ResumeContent;

  const updatedContent = {
    ...content,
    education: [
      ...(Array.isArray(content.education) ? content.education : []),
      educationItem,
    ],
  };

  await prisma.resumeVersion.update({
    where: { id: baseVersion.id },
    data: {
      content: updatedContent as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
}

export async function removeEducation(resumeId: string, index: number) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  if (!baseVersion) throw new Error("Base version not found");

  const content = (baseVersion.content ?? {}) as ResumeContent;

  const currentEducation = Array.isArray(content.education)
    ? content.education
    : [];

  const updatedEducation = currentEducation.filter((_item, i) => i !== index);

  const updatedContent = {
    ...content,
    education: updatedEducation,
  };

  await prisma.resumeVersion.update({
    where: { id: baseVersion.id },
    data: {
      content: updatedContent as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
}

export async function createTailoredVersion(
  resumeId: string,
  jobId: string,
  modifiedContent: Prisma.InputJsonValue,
) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  if (!baseVersion) {
    throw new Error("Base version not found");
  }

  const tailoredVersion = await prisma.resumeVersion.create({
    data: {
      resumeId,
      userId: user.id,
      jobId,
      content: modifiedContent,
      versionType: "TAILORED",
      parentId: baseVersion.id,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);

  return tailoredVersion;
}

export async function createTailoredVersionForJob(
  resumeId: string,
  jobId: string,
) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify job belongs to user
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId: user.id,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  if (!baseVersion) {
    throw new Error("Base version not found");
  }

  const tailoredVersion = await prisma.resumeVersion.create({
    data: {
      resumeId,
      userId: user.id,
      jobId: job.id,
      content: (baseVersion.content ?? {}) as Prisma.InputJsonValue,
      versionType: "TAILORED",
      parentId: baseVersion.id,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
  revalidatePath("/dashboard");

  return tailoredVersion;
}

export async function createJob(data: {
  title: string;
  company: string;
  description: string;
  location?: string;
  jobLink?: string;
}) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      title: data.title,
      company: data.company,
      description: data.description,
      location: data.location,
      jobLink: data.jobLink,
    },
  });

  revalidatePath("/dashboard");

  return job;
}

export async function deleteJob(jobId: string) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.job.deleteMany({
    where: {
      id: jobId,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard");
}

import { calculateSkillGap } from "@/lib/ai/skill-gap";

export async function createTailoredVersionWithAI(
  resumeId: string,
  jobId: string,
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      versionType: "BASE",
    },
  });

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId: user.id,
    },
  });

  if (!baseVersion || !job) {
    throw new Error("Invalid data");
  }

  // AI rewrite (currently mock-safe)
  const tailoredContent = await tailorResumeWithAI(
    baseVersion.content as ResumeContent,
    job.description,
  );

  const newVersion = await prisma.resumeVersion.create({
    data: {
      resumeId,
      userId: user.id,
      jobId,
      content: tailoredContent,
      versionType: "TAILORED",
    },
  });

  // Calculate ATS score deterministically
  const skillGap = calculateSkillGap(tailoredContent, job.description);

  await prisma.aTSResult.create({
    data: {
      resumeVersionId: newVersion.id,
      score: skillGap.matchPercentage,
      matchedKeywords: skillGap.matchedSkills,
      missingKeywords: skillGap.missingSkills,
      weakKeywords: [],
    },
  });

  const structuredSuggestions = generateSectionSuggestions(
    tailoredContent as StructuredResumeContent,
    skillGap,
  );

  await prisma.aISuggestion.createMany({
    data: structuredSuggestions.map((s) => ({
      resumeVersionId: newVersion.id,
      section: s.section,
      originalContent: s.originalContent,
      suggestedContent: s.suggestedContent,
      applied: false,
    })),
  });

  await prisma.skillGap.deleteMany({
    where: { jobId: job.id },
  });

  const newGaps = skillGap.missingSkills.map((skill) => {
    const frequency = skillGap.jobFrequencyMap?.[skill] ?? 1;

    let priority: "HIGH" | "MEDIUM" | "LOW";

    if (frequency >= 2) {
      priority = "HIGH";
    } else if (frequency === 1) {
      priority = "MEDIUM";
    } else {
      priority = "LOW";
    }

    return {
      jobId: job.id,
      skill,
      priority,
      estimatedTime:
        priority === "HIGH"
          ? "2-4 weeks"
          : priority === "MEDIUM"
            ? "1-2 weeks"
            : "Few days",
      reasoning:
        frequency >= 2
          ? "This skill appears multiple times in the job description."
          : "This skill is mentioned in the job description.",
    };
  });

  if (newGaps.length > 0) {
    await prisma.skillGap.createMany({
      data: newGaps,
    });
  }

  // Delete previous InterviewPrep for this job
  await prisma.interviewPrep.deleteMany({
    where: { jobId: job.id },
  });

  let interviewData;

  try {
    interviewData = await generateAIInterviewPrep(
      job.title,
      job.description,
      skillGap.matchedSkills,
    );
  } catch {
    interviewData = generateInterviewPrep(
      job.title,
      job.description,
      skillGap.matchedSkills,
    );
  }

  await prisma.interviewPrep.create({
    data: {
      jobId: job.id,
      type: "FULL", // You can later split into TECHNICAL / BEHAVIORAL
      questions: interviewData.questions,
      starDrafts: interviewData.starDrafts,
      technicalTopics: interviewData.technicalTopics,
    },
  });

  return newVersion;
}

export async function applySuggestion(suggestionId: string) {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const suggestion = await prisma.aISuggestion.findUnique({
    where: { id: suggestionId },
    include: {
      resumeVersion: true,
    },
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  if (suggestion.resumeVersion.userId !== user.id) {
    throw new Error("Forbidden");
  }

  const resumeVersion = suggestion.resumeVersion;

  if (!resumeVersion.jobId) {
    throw new Error("No job linked to this resume version");
  }

  // 1️⃣ Update Resume Content
  const content = (resumeVersion.content ?? {}) as Record<string, unknown>;

  const updatedContent = {
    ...content,
    [suggestion.section]: suggestion.suggestedContent,
  };

  await prisma.resumeVersion.update({
    where: { id: resumeVersion.id },
    data: {
      content: updatedContent as Prisma.InputJsonValue,
    },
  });

  // 2️⃣ Mark Suggestion Applied
  await prisma.aISuggestion.update({
    where: { id: suggestionId },
    data: { applied: true },
  });

  // 3️⃣ Fetch Job
  const job = await prisma.job.findFirst({
    where: {
      id: resumeVersion.jobId,
      userId: user.id,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  // 4️⃣ Recalculate ATS
  const skillGap = calculateSkillGap(updatedContent, job.description);

  // 5️⃣ Upsert ATS Result (1 per ResumeVersion)
  await prisma.aTSResult.upsert({
    where: {
      resumeVersionId: resumeVersion.id,
    },
    update: {
      score: skillGap.matchPercentage,
      matchedKeywords: skillGap.matchedSkills,
      missingKeywords: skillGap.missingSkills,
      weakKeywords: [],
    },
    create: {
      resumeVersionId: resumeVersion.id,
      score: skillGap.matchPercentage,
      matchedKeywords: skillGap.matchedSkills,
      missingKeywords: skillGap.missingSkills,
      weakKeywords: [],
    },
  });

  // 6️⃣ Regenerate Skill Gaps Using Frequency Map
  await prisma.skillGap.deleteMany({
    where: { jobId: job.id },
  });

  const newGaps = skillGap.missingSkills.map((skill) => {
    const frequency = skillGap.jobFrequencyMap?.[skill] ?? 1;

    let priority: "HIGH" | "MEDIUM" | "LOW";

    if (frequency >= 2) {
      priority = "HIGH";
    } else if (frequency === 1) {
      priority = "MEDIUM";
    } else {
      priority = "LOW";
    }

    return {
      jobId: job.id,
      skill,
      priority,
      estimatedTime:
        priority === "HIGH"
          ? "2-4 weeks"
          : priority === "MEDIUM"
            ? "1-2 weeks"
            : "Few days",
      reasoning:
        frequency >= 2
          ? "This skill appears multiple times in the job description."
          : "This skill is mentioned in the job description.",
    };
  });

  if (newGaps.length > 0) {
    await prisma.skillGap.createMany({
      data: newGaps,
    });
  }

  revalidatePath(`/dashboard/jobs/${resumeVersion.jobId}`);
}

export async function regenerateInterviewPrep(jobId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) throw new Error("Job not found");

  const latestVersion = job.versions[0];
  if (!latestVersion) throw new Error("No resume version found");

  const skillGap = await prisma.aTSResult.findFirst({
    where: { resumeVersionId: latestVersion.id },
  });

  let interviewData;

  try {
    interviewData = await generateAIInterviewPrep(
      job.title,
      job.description,
      (skillGap?.matchedKeywords as string[]) ?? [],
    );
  } catch {
    interviewData = generateInterviewPrep(
      job.title,
      job.description,
      (skillGap?.matchedKeywords as string[]) ?? [],
    );
  }

  await prisma.interviewPrep.deleteMany({
    where: { jobId },
  });

  await prisma.interviewPrep.create({
    data: {
      jobId,
      type: "FULL",
      questions: interviewData.questions,
      starDrafts: interviewData.starDrafts,
      technicalTopics: interviewData.technicalTopics,
    },
  });

  revalidatePath(`/dashboard/jobs/${jobId}`);
}



export async function updateJobMeta(
  jobId: string,
  data: {
    status?: JobStatus;
    notes?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId: user.id,
    },
  });

  if (!job) throw new Error("Job not found");

  const updateData: Prisma.JobUpdateInput = {};

  if (data.status) {
    updateData.status = data.status;
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  await prisma.job.update({
    where: { id: jobId },
    data: updateData,
  });

  revalidatePath(`/dashboard/jobs/${jobId}`);
}