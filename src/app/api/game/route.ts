import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export const dynamic = "force-dynamic";

const gameQuestionSchema = z.object({
  leftStatement: z.string().describe("A concise, plausible statement that may be true or false."),
  rightStatement: z.string().describe("A concise, plausible statement that may be true or false."),
  correctSide: z.enum(["left", "right"]).describe("Which statement is factually true."),
  explanation: z.string().describe("A short explanation of why the correct statement is true."),
});

export async function POST() {
  try {
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: gameQuestionSchema,
      system: `You create one round for a fact-checking game called "Which statement is true?".
Generate two statements about the same general topic. Exactly one statement must be factually true and the other must be a highly plausible false statement.
Keep both statements concise (one or two sentences), avoid trick wording, and use facts that can be reasonably verified.
Set correctSide to the side containing the true statement. Do not reveal the answer in either statement.`,
      prompt: "Generate a fresh, varied general-knowledge question for the next game round.",
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("Error in LakshyaGPT /api/game handler:", error);
    return Response.json(
      { error: "Unable to generate a game question. Please try again." },
      { status: 500 },
    );
  }
}
