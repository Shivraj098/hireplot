import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createResume, createJob } from "./actions";
import Link from "next/link";

export default async function DashboardHome() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return <div>Loading...</div>;
  }

  const [resumes, jobs] = await Promise.all([
    prisma.resume.findMany({
      where: { userId: user.id },
      include: {
        versions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.job.findMany({
      where: { userId: user.id },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return (
    <div className="p-8 space-y-12">

      {/* HEADER */}
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* ============================= */}
      {/* RESUME SECTION */}
      {/* ============================= */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Resumes</h2>

        {/* Create Resume Form */}
        <form
          action={async (formData) => {
            "use server";
            const title = formData.get("title") as string;
            if (!title) return;
            await createResume(title);
          }}
          className="flex gap-4"
        >
          <input
            type="text"
            name="title"
            placeholder="Enter resume title"
            className="border px-3 py-2 rounded w-64 text-black"
          />
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded"
          >
            Create Resume
          </button>
        </form>

        {resumes.length === 0 ? (
          <p className="text-gray-500">No resumes yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <Link
                key={resume.id}
                href={`/dashboard/${resume.id}`}
                className="border rounded-lg p-6 shadow-sm bg-white text-black block hover:shadow-md transition"
              >
                <h2 className="text-lg font-semibold mb-2">
                  {resume.title}
                </h2>

                <p className="text-sm text-gray-600 mb-2">
                  Versions: {resume.versions.length}
                </p>

                <p className="text-xs text-gray-500">
                  Created:{" "}
                  {new Date(resume.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ============================= */}
      {/* JOB SECTION */}
      {/* ============================= */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Jobs</h2>

        {/* Create Job Form */}
        <form
          action={async (formData) => {
            "use server";
            await createJob({
              title: formData.get("title") as string,
              company: formData.get("company") as string,
              location: formData.get("location") as string,
              jobLink: formData.get("jobLink") as string,
              description: formData.get("description") as string,
            });
          }}
          className="grid gap-4 border rounded-lg p-6 bg-gray-50"
        >
          <input
            name="title"
            placeholder="Job Title"
            className="border p-2 rounded text-black"
          />

          <input
            name="company"
            placeholder="Company"
            className="border p-2 rounded text-black"
          />

          <input
            name="location"
            placeholder="Location (optional)"
            className="border p-2 rounded text-black"
          />

          <input
            name="jobLink"
            placeholder="Job Link (optional)"
            className="border p-2 rounded text-black"
          />

          <textarea
            name="description"
            placeholder="Paste full job description here"
            className="border p-2 rounded text-black"
            rows={5}
          />

          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded w-fit"
          >
            Add Job
          </button>
        </form>

        {jobs.length === 0 ? (
          <p className="text-gray-500">No jobs added yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="border rounded-lg p-6 shadow-sm bg-white text-black block hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold mb-1">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {job.company}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Created:{" "}
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}