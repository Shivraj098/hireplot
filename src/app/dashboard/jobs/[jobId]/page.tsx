import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateSkillGap } from "@/lib/ai/skill-gap";
import { applySuggestion } from "@/app/dashboard/actions";

import { regenerateInterviewPrep } from "@/app/dashboard/actions";

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
      skillGaps: true,
      interviewPreps: true,

      versions: {
        include: {
          resume: true,
          aTSResults: true,
          suggestions: true,
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
    (v) => v.versionType === "BASE",
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
            <span className="font-bold ml-2">{skillGap.matchPercentage}%</span>
          </div>

          <div>
            <h3 className="font-medium mb-2">Matched Skills</h3>
            {skillGap.matchedSkills.length === 0 ? (
              <p className="text-sm text-gray-500">No matching skills found.</p>
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
              <p className="text-sm text-gray-500">No gaps detected.</p>
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

      {/* SKILL GAP ROADMAP */}
      {job.skillGaps && job.skillGaps.length > 0 && (
        <div className="space-y-4 border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold">Skill Improvement Roadmap</h2>

          {job.skillGaps.map((gap) => (
            <div
              key={gap.id}
              className="border rounded-md p-4 bg-gray-50 space-y-2"
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">{gap.skill}</p>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {gap.priority}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                Estimated Time: {gap.estimatedTime}
              </p>

              <p className="text-sm text-gray-700">{gap.reasoning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Generate AI Button */}
      <form
        action={async () => {
          "use server";
          const resume = await prisma.resume.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
          });

          if (!resume) return;

          const { createTailoredVersionWithAI } =
            await import("@/app/dashboard/actions");

          await createTailoredVersionWithAI(resume.id, job.id);
        }}
      >
        <button className="bg-black text-white px-4 py-2 rounded">
          Generate Tailored Resume with AI
        </button>
      </form>

      {/* TAILORED VERSIONS */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tailored Resume Versions</h2>

        {job.versions.length === 0 ? (
          <p className="text-sm text-gray-500">
            No tailored resumes created yet.
          </p>
        ) : (
          job.versions.map((version) => {
            const ats = version.aTSResults?.[0];

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
                      Created: {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {ats && (
                    <div className="text-sm font-semibold">
                      ATS Score: {ats.score}%
                    </div>
                  )}
                </div>

                {/* Interview Preparation */}
                {job.interviewPreps.length > 0 && (
                  <div className="mt-12 space-y-6">
                    <h2 className="text-xl font-semibold">
                      Interview Preparation
                    </h2>

                    {job.interviewPreps.map((prep) => {
                      const questions = prep.questions as string[];
                      const starDrafts = prep.starDrafts as string[];
                      const technicalTopics = prep.technicalTopics as string[];

                      return (
                        <div
                          key={prep.id}
                          className="border rounded-lg p-6 bg-white text-black shadow-sm space-y-4"
                        >
                          <div>
                            <h3 className="font-semibold mb-2">
                              Technical Topics
                            </h3>
                            <ul className="list-disc ml-6 text-sm">
                              {technicalTopics.map((topic, index) => (
                                <li key={index}>{topic}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">
                              Interview Questions
                            </h3>
                            <ul className="list-disc ml-6 text-sm">
                              {questions.map((question, index) => (
                                <li key={index}>{question}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">
                              STAR Answer Framework
                            </h3>
                            <ul className="list-disc ml-6 text-sm">
                              {starDrafts.map((draft, index) => (
                                <li key={index}>{draft}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <form
                  action={async () => {
                    "use server";
                    await regenerateInterviewPrep(job.id);
                  }}
                >
                  <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 rounded text-sm"
                  >
                    Regenerate Interview Prep
                  </button>
                </form>

                {/* AI Suggestions */}
                {version.suggestions?.filter((s) => !s.applied).length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h2 className="text-xl font-semibold">AI Suggestions</h2>

                    {version.suggestions
                      .filter((s) => !s.applied)
                      .map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="border rounded-lg p-4 bg-white text-black shadow-sm"
                        >
                          <p className="text-sm font-medium capitalize mb-2">
                            Section: {suggestion.section}
                          </p>

                          <p className="text-xs text-gray-500 mb-2">
                            Suggested Update:
                          </p>

                          <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
                            {JSON.stringify(
                              suggestion.suggestedContent,
                              null,
                              2,
                            )}
                          </pre>

                          <form
                            action={async () => {
                              "use server";
                              await applySuggestion(suggestion.id);
                            }}
                            className="mt-3"
                          >
                            <button
                              type="submit"
                              className="bg-black text-white px-4 py-2 rounded text-sm"
                            >
                              Apply Suggestion
                            </button>
                          </form>
                        </div>
                      ))}
                  </div>
                )}

                {ats && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Matched Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {(ats.matchedKeywords as string[]).map((skill) => (
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
                      <p className="text-sm font-medium">Missing Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {(ats.missingKeywords as string[]).map((skill) => (
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
