import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { updateResumeSummary } from "../actions";

interface Props {
  params: Promise<{
    resumeId: string;
  }>;
}

export default async function ResumePage({ params }: Props) {
  // ✅ unwrap once at the top
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
  };

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold">{resume.title}</h1>

      <form
        action={async (formData) => {
          "use server";
          const summary = formData.get("summary") as string;
          // ✅ use unwrapped value
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
            className="border rounded p-3 text-white"
            placeholder="Write your professional summary..."
          />
        </div>

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
