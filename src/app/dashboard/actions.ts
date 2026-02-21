"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
          },
          isBase: true,
        },
      },
    },
  });

  revalidatePath("/dashboard");

  return resume;
}
export async function updateResumeSummary(
  resumeId: string,
  summary: string
) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const baseVersion = await prisma.resumeVersion.findFirst({
    where: {
      resumeId,
      userId: user.id,
      isBase: true,
    },
  });

  if (!baseVersion) {
    throw new Error("Base version not found");
  }

  const updatedContent = {
    ...(baseVersion.content as Record<string, unknown>),
    summary,
  };

  await prisma.resumeVersion.update({
    where: { id: baseVersion.id },
    data: {
      content: updatedContent,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
}
