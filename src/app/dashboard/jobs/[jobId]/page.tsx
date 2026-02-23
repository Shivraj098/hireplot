import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateSkillGap } from "@/lib/ai/skill-gap";

interface Props {
  params: Promise<{
    jobId: string;
  }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { jobId } = await params;

  const user = await getCurrentUser();
  if (!user?.id) {
    redirect("/signin");
  }

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId: user.id,
    },
    include: {
      versions: {
        include: {
          resume: true,
          atsResults: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!job) {
    redirect("/dashboard");
  }

  const baseResume = await prisma.resume.findFirst({
    where: { userId: user.id },
    include: {
      versions: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const baseVersion = baseResume?.versions.find(
    (v) => v.versionType === "BASE"
  );

  const skillGap = baseVersion
    ? calculateSkillGap(baseVersion.content, job.description)
    : null;

  return (
    <div className="p-8 max-w-4xl space-y-12">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <p className="text-gray-600">
          {job.company}
          {job.location && ` — ${job.location}`}
        </p>

        {job.jobLink && (
          <a
            href={job.jobLink}
            target="_blank"
            className="text-blue-600 text-sm"
          >
            View Job Posting
          </a>
        )}
      </div>

      {/* JOB DESCRIPTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Job Description</h2>
        <div className="border rounded p-4 bg-white text-black whitespace-pre-wrap">
          {job.description}
        </div>
      </div>

      {/* SKILL GAP ANALYSIS */}
      {skillGap && (
        <div className="space-y-4 border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold">Skill Gap Analysis</h2>

          <div className="text-sm">
            Match Score:
            <span className="font-bold ml-2">
              {skillGap.matchPercentage}%
            </span>
          </div>

          <div>
            <h3 className="font-medium mb-2">Matched Skills</h3>
            {skillGap.matchedSkills.length === 0 ? (
              <p className="text-sm text-gray-500">
                No matching skills found.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skillGap.matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Missing Skills</h3>
            {skillGap.missingSkills.length === 0 ? (
              <p className="text-sm text-gray-500">
                No gaps detected.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skillGap.missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <form
        action={async () => {
          "use server";
          const resume = await prisma.resume.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
          });

          if (!resume) return;

          const { createTailoredVersionWithAI } = await import(
            "@/app/dashboard/actions"
          );

          await createTailoredVersionWithAI(resume.id, job.id);
        }}
      >
        <button className="bg-black text-white px-4 py-2 rounded">
          Generate Tailored Resume with AI
        </button>
      </form>

      {/* TAILORED VERSIONS */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Tailored Resume Versions
        </h2>

        {job.versions.length === 0 ? (
          <p className="text-sm text-gray-500">
            No tailored resumes created yet.
          </p>
        ) : (
          job.versions.map((version) => {
            const ats = version.atsResults?.[0];

            return (
              <div
                key={version.id}
                className="border rounded p-4 bg-white text-black space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      Resume: {version.resume.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      Created:{" "}
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {ats && (
                    <div className="text-sm font-semibold">
                      ATS Score: {ats.score}%
                    </div>
                  )}
                </div>

                {ats && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">
                        Matched Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(ats.matchedKeywords as string[]).map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Missing Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(ats.missingKeywords as string[]).map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}