type InterviewPrepData = {
  questions: string[];
  starDrafts: string[];
  technicalTopics: string[];
};

export function generateInterviewPrep(
  jobTitle: string,
  jobDescription: string,
  matchedSkills: string[]
): InterviewPrepData {
  const technicalTopics = matchedSkills.length
    ? matchedSkills
    : ["System Design"];

  const technicalQuestions = technicalTopics.map(
    (skill) => `Explain your hands-on experience with ${skill}.`
  );

  const behavioralQuestions = [
    `Why are you interested in the ${jobTitle} role?`,
    "Describe a challenging technical problem you solved.",
    "Tell me about a time you worked under tight deadlines.",
  ];

  const starDrafts = [
    "Situation: Brief context of the challenge.",
    "Task: What responsibility you had.",
    "Action: Steps you took to solve it.",
    "Result: Measurable outcome achieved.",
  ];

  return {
    questions: [...technicalQuestions, ...behavioralQuestions],
    starDrafts,
    technicalTopics,
  };
}