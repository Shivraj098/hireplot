import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardHome() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return <div>Loading...</div>;
  }

  // Check if user has any resumes
  const existingResumes = await prisma.resume.findMany({
    where: { userId: user.id },
  });

  // If none, create one base resume + base version
  if (existingResumes.length === 0) {
    const resume = await prisma.resume.create({
      data: {
        title: "My Base Resume",
        user: {
          connect: { id: user.id },
        },
      },
    });

    await prisma.resumeVersion.create({
      data: {
        content: {
          summary: "Base resume content",
        },
        isBase: true,
        resume: {
          connect: { id: resume.id },
        },
        user: {
          connect: { id: user.id },
        },
      },
    });
  }

  // Fetch updated resumes
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    include: {
      versions: true,
    },
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>User: {user.email}</p>

      <h2>Your Resumes</h2>
      <pre>{JSON.stringify(resumes, null, 2)}</pre>
    </div>
  );
}