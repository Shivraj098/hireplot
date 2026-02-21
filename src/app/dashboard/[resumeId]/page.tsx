import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  updateResumeSummary,
  addExperience,
  removeExperience,
  addSkill,
  removeSkill,
  addEducation,
  removeEducation, // ✅ added import
} from "../actions";

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
      versions: true,
    },
  });

  if (!resume) {
    redirect("/dashboard");
  }

  const baseVersion = resume.versions.find((v) => v.isBase);

  const content = (baseVersion?.content ?? {}) as {
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
    <div className="p-8 space-y-10 max-w-3xl">
      <h1 className="text-2xl font-bold">{resume.title}</h1>

      {/* SUMMARY SECTION */}
      <form
        action={async (formData) => {
          "use server";
          const summary = formData.get("summary") as string;
          await updateResumeSummary(resumeId, summary);
        }}
        className="space-y-4"
      >
        <div className="flex flex-col gap-2">
          <label className="font-medium">Professional Summary</label>
          <textarea
            name="summary"
            defaultValue={content.summary ?? ""}
            rows={6}
            className="border rounded p-3 text-black"
          />
        </div>

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Save Summary
        </button>
      </form>
      {/* SKILLS SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Skills</h2>

        {skills.length === 0 ? (
          <p className="text-sm text-gray-500">No skills added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="bg-white text-black border rounded px-3 py-1 flex items-center gap-2"
              >
                <span>{skill}</span>

                <form
                  action={async () => {
                    "use server";
                    await removeSkill(resumeId, index);
                  }}
                >
                  <button type="submit" className="text-red-500 text-xs">
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD SKILL FORM */}
      <form
        action={async (formData) => {
          "use server";
          const skill = formData.get("skill") as string;
          if (!skill) return;
          await addSkill(resumeId, skill);
        }}
        className="flex gap-3 border-t pt-6"
      >
        <input
          name="skill"
          placeholder="Add skill (e.g., React)"
          className="border p-2 rounded text-black flex-1"
        />

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Add Skill
        </button>
      </form>
      {/* EDUCATION SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Education</h2>

        {education.length === 0 ? (
          <p className="text-sm text-gray-500">No education added yet.</p>
        ) : (
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div
                key={index}
                className="border rounded p-4 bg-white text-black space-y-1"
              >
                <div className="flex justify-between items-start">
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
                    <button type="submit" className="text-red-500 text-sm">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD EDUCATION FORM */}
      <form
        action={async (formData) => {
          "use server";
          await addEducation(resumeId, {
            institution: formData.get("institution") as string,
            degree: formData.get("degree") as string,
            duration: formData.get("duration") as string,
          });
        }}
        className="space-y-3 border-t pt-6"
      >
        <h3 className="font-medium">Add Education</h3>

        <input
          name="degree"
          placeholder="Degree (e.g., B.Tech in Computer Science)"
          className="border p-2 rounded w-full text-black"
        />

        <input
          name="institution"
          placeholder="Institution"
          className="border p-2 rounded w-full text-black"
        />

        <input
          name="duration"
          placeholder="Duration (e.g., 2019–2023)"
          className="border p-2 rounded w-full text-black"
        />

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Add Education
        </button>
      </form>

      {/* EXPERIENCE LIST */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Experience</h2>

        {experience.length === 0 ? (
          <p className="text-sm text-gray-500">No experience added yet.</p>
        ) : (
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div
                key={index}
                className="border rounded p-4 bg-white text-black space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{exp.role}</h3>
                    <p className="text-sm text-gray-600">
                      {exp.company} — {exp.duration}
                    </p>
                  </div>

                  <form
                    action={async () => {
                      "use server";
                      await removeExperience(resumeId, index); // ✅ fixed
                    }}
                  >
                    <button type="submit" className="text-red-500 text-sm">
                      Remove
                    </button>
                  </form>
                </div>

                <p className="text-sm">{exp.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD EXPERIENCE FORM */}
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
        className="space-y-3 border-t pt-6"
      >
        <h3 className="font-medium">Add Experience</h3>

        <input
          name="role"
          placeholder="Role"
          className="border p-2 rounded w-full text-black"
        />

        <input
          name="company"
          placeholder="Company"
          className="border p-2 rounded w-full text-black"
        />

        <input
          name="duration"
          placeholder="Duration (e.g., 2022-2024)"
          className="border p-2 rounded w-full text-black"
        />

        <textarea
          name="description"
          placeholder="Description"
          className="border p-2 rounded w-full text-black"
        />

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Add Experience
        </button>
      </form>
    </div>
  );
}
