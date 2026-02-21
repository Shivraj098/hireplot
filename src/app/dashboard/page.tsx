import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createResume } from "./actions";
import Link from "next/link";

export default async function DashboardHome() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return <div>Loading...</div>;
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    include: {
      versions: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

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

      {/* Resume Cards */}
      {resumes.length === 0 ? (
        <p>No resumes yet.</p>
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
                Created: {new Date(resume.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}