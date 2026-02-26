import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type AIInterviewPrep = {
  technicalTopics: string[];
  questions: string[];
  starDrafts: string[];
};

function safeParseJSON(content: string): AIInterviewPrep {
  try {
    const parsed = JSON.parse(content);

    if (
      Array.isArray(parsed.technicalTopics) &&
      Array.isArray(parsed.questions) &&
      Array.isArray(parsed.starDrafts)
    ) {
      return parsed as AIInterviewPrep;
    }

    throw new Error("Invalid JSON structure");
  } catch {
    throw new Error("AI JSON parsing failed");
  }
}

export async function generateAIInterviewPrep(
  jobTitle: string,
  jobDescription: string,
  resumeSkills: string[]
): Promise<AIInterviewPrep> {
  const prompt = `
You are an expert technical interviewer.

Job Title:
${jobTitle}

Job Description:
${jobDescription}

Candidate Skills:
${resumeSkills.join(", ")}

Return strictly valid JSON only:

{
  "technicalTopics": ["string"],
  "questions": ["string"],
  "starDrafts": ["string"]
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: "Return ONLY valid JSON. No explanations.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;

  if (!content) {
    throw new Error("AI returned empty response");
  }

  return safeParseJSON(content);
}