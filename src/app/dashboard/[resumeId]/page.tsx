import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  updateResumeSummary,
  addExperience,
  removeExperience,
  addSkill,
  removeSkill,
  addEducation,
  removeEducation,
  createJob,
  deleteJob,
} from "../actions";

async function createTailoredVersionForJob(resumeId: string, jobId: string) {
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
      content: baseVersion.content ?? {},
      versionType: "TAILORED",
      parentId: baseVersion.id,
    },
  });

  revalidatePath(`/dashboard/${resumeId}`);
  revalidatePath("/dashboard");

  return tailoredVersion;
}

interface Props {
  params: Promise<{
    resumeId: string;
  }>;
}

export default async function ResumePage({ params }: Props) {
  const { resumeId } = await params;

  const user = await getCurrentUser();
  if (!user?.id) {
    redirect("/signin");
  }

  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId: user.id,
    },
    include: {
      versions: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          job: true,
        },
      },
    },
  });

  if (!resume) {
    redirect("/dashboard");
  }

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const baseVersion = resume.versions.find((v) => v.versionType === "BASE");

  if (!baseVersion) {
    throw new Error("Base version missing");
  }

  const tailoredVersions = resume.versions.filter(
    (v) => v.versionType === "TAILORED",
  );

  const content = (baseVersion.content ?? {}) as {
    summary?: string;
    experience?: Array<{
      company: string;
      role: string;
      duration: string;
      description: string;
    }>;
    skills?: string[];
    education?: Array<{
      institution: string;
      degree: string;
      duration: string;
    }>;
  };

  const experience = content.experience ?? [];
  const skills = content.skills ?? [];
  const education = content.education ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
      <h1 className="text-3xl font-bold tracking-tight">{resume.title}</h1>

      {/* ================= SUMMARY ================= */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-6 space-y-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Professional Summary</h2>
        </div>

        <form
          action={async (formData) => {
            "use server";
            const summary = formData.get("summary") as string;
            await updateResumeSummary(resumeId, summary);
          }}
          className="space-y-4"
        >
          <textarea
            name="summary"
            defaultValue={content.summary ?? ""}
            rows={6}
            className="w-full border rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-black/20"
          />

          <div className="flex justify-end">
            <button className="bg-black text-white px-5 py-2 rounded-lg">
              Save
            </button>
          </div>
        </form>
      </section>

      {/* ================= SKILLS ================= */}
      <section className="rounded-xl border bg-white/70 p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-semibold">Skills</h2>

        {skills.length === 0 ? (
          <p className="text-sm text-gray-500">No skills added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="bg-gray-100 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
              >
                {skill}
                <form
                  action={async () => {
                    "use server";
                    await removeSkill(resumeId, index);
                  }}
                >
                  <button className="text-red-500 text-xs">×</button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form
          action={async (formData) => {
            "use server";
            const skill = formData.get("skill") as string;
            if (!skill) return;
            await addSkill(resumeId, skill);
          }}
          className="flex gap-3 pt-4 border-t"
        >
          <input
            name="skill"
            placeholder="Add skill (e.g., React)"
            className="flex-1 border rounded-lg p-2 text-black"
          />
          <button className="bg-black text-white px-4 py-2 rounded-lg">
            Add
          </button>
        </form>
      </section>

      {/* ================= EDUCATION ================= */}
      <section className="rounded-xl border bg-white/70 p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-semibold">Education</h2>

        {education.length === 0 ? (
          <p className="text-sm text-gray-500">No education added yet.</p>
        ) : (
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div
                key={index}
                className="border rounded-xl p-5 bg-gray-50 space-y-1"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-sm text-gray-600">
                      {edu.institution} — {edu.duration}
                    </p>
                  </div>

                  <form
                    action={async () => {
                      "use server";
                      await removeEducation(resumeId, index);
                    }}
                  >
                    <button className="text-red-500 text-sm">Remove</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          action={async (formData) => {
            "use server";
            await addEducation(resumeId, {
              institution: formData.get("institution") as string,
              degree: formData.get("degree") as string,
              duration: formData.get("duration") as string,
            });
          }}
          className="space-y-3 pt-4 border-t"
        >
          <input
            name="degree"
            placeholder="Degree"
            className="border p-2 rounded-lg w-full text-black"
          />
          <input
            name="institution"
            placeholder="Institution"
            className="border p-2 rounded-lg w-full text-black"
          />
          <input
            name="duration"
            placeholder="Duration"
            className="border p-2 rounded-lg w-full text-black"
          />

          <div className="flex justify-end">
            <button className="bg-black text-white px-4 py-2 rounded-lg">
              Add Education
            </button>
          </div>
        </form>
      </section>

      {/* ================= EXPERIENCE ================= */}
      <section className="rounded-xl border bg-white/70 p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-semibold">Experience</h2>

        {experience.length === 0 ? (
          <p className="text-sm text-gray-500">No experience added yet.</p>
        ) : (
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div
                key={index}
                className="border rounded-xl p-5 bg-gray-50 space-y-2"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{exp.role}</h3>
                    <p className="text-sm text-gray-600">
                      {exp.company} — {exp.duration}
                    </p>
                  </div>

                  <form
                    action={async () => {
                      "use server";
                      await removeExperience(resumeId, index);
                    }}
                  >
                    <button className="text-red-500 text-sm">Remove</button>
                  </form>
                </div>

                <p className="text-sm">{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        <form
          action={async (formData) => {
            "use server";
            await addExperience(resumeId, {
              company: formData.get("company") as string,
              role: formData.get("role") as string,
              duration: formData.get("duration") as string,
              description: formData.get("description") as string,
            });
          }}
          className="space-y-3 pt-4 border-t"
        >
          <input
            name="role"
            placeholder="Role"
            className="border p-2 rounded-lg w-full text-black"
          />
          <input
            name="company"
            placeholder="Company"
            className="border p-2 rounded-lg w-full text-black"
          />
          <input
            name="duration"
            placeholder="Duration"
            className="border p-2 rounded-lg w-full text-black"
          />
          <textarea
            name="description"
            placeholder="Description"
            className="border p-2 rounded-lg w-full text-black"
          />

          <div className="flex justify-end">
            <button className="bg-black text-white px-4 py-2 rounded-lg">
              Add Experience
            </button>
          </div>
        </form>
      </section>

      {/* ================= VERSION HISTORY ================= */}
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">Version History</h2>

        {tailoredVersions.length === 0 && (
          <p className="text-sm text-gray-500">No tailored versions yet.</p>
        )}

        {tailoredVersions.map((version) => (
          <div
            key={version.id}
            className="border rounded p-4 bg-gray-50 text-black space-y-2"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-medium">Tailored for {version.job?.title}</p>
                <p className="text-sm text-gray-600">
                  {version.job?.company}
                  {version.job?.location && ` — ${version.job.location}`}
                </p>
              </div>

              <span className="text-sm text-gray-600">
                {new Date(version.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* ================= CREATE TAILORED ================= */}
      <section className="rounded-xl border bg-blue-50 p-6 shadow-sm">
        <form
          action={async (formData) => {
            "use server";
            const jobId = formData.get("jobId") as string;
            if (!jobId) return;
            await createTailoredVersionForJob(resumeId, jobId);
          }}
          className="space-y-3"
        >
          <select
            name="jobId"
            className="border p-2 rounded-lg w-full text-black"
            required
          >
            <option value="">Select a job to tailor resume</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} at {job.company}
              </option>
            ))}
          </select>
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg w-full">
            Create Tailored Version
          </button>
        </form>
      </section>

      {/* ================= JOBS ================= */}
      <section className="rounded-xl border bg-white/70 p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-semibold">Jobs</h2>

        {jobs.length === 0 ? (
          <p className="text-sm text-gray-500">No jobs added yet.</p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border rounded-xl p-5 bg-gray-50 flex justify-between"
              >
                <div>
                  <h3 className="font-medium">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company}</p>
                </div>

                <form
                  action={async () => {
                    "use server";
                    await deleteJob(job.id);
                  }}
                >
                  <button className="text-red-500 text-sm">Delete</button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form
          action={async (formData) => {
            "use server";
            await createJob({
              title: formData.get("title") as string,
              company: formData.get("company") as string,
              description: formData.get("description") as string,
              location: formData.get("location") as string,
              jobLink: formData.get("jobLink") as string,
            });
          }}
          className="space-y-3 pt-6 border-t"
        >
          <input
            name="title"
            placeholder="Job Title"
            className="border p-2 rounded-lg w-full text-black"
          />
          <input
            name="company"
            placeholder="Company"
            className="border p-2 rounded-lg w-full text-black"
          />
          <input
            name="location"
            placeholder="Location"
            className="border p-2 rounded-lg w-full text-black"
          />
          <input
            name="jobLink"
            placeholder="Job Link"
            className="border p-2 rounded-lg w-full text-black"
          />
          <textarea
            name="description"
            placeholder="Job Description"
            className="border p-2 rounded-lg w-full text-black"
          />

          <div className="flex justify-end">
            <button className="bg-black text-white px-5 py-2 rounded-lg">
              Add Job
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
