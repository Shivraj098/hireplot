"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

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

export async function createTailoredVersionFromBase(resumeId: string) {
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
      content: JSON.parse(JSON.stringify(baseVersion.content)),
      versionType: "TAILORED",
      parentId: baseVersion.id,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);

  return tailoredVersion;
}
