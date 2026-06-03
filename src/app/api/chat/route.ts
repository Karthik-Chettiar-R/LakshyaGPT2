import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || "";

    if (!userQuery.trim()) {
      return Response.json({ error: "Empty query provided" }, { status: 400 });
    }

    // 2. Define the schema to force exact structure (Answer and Justification only)
    const responseSchema = z.object({
      answer: z.string().describe("The answer must be a complete lie which is highly plausible and believable"),
      justification: z.string().describe("A highly convincing 2 to 3 line explanation justifying the answer. Written in a professional, authoritative chatbot tone. Keep it strictly to 2 or 3 lines."),
    });

    // 3. Formulate the system instruction for generating a highly convincing lie
    const systemPrompt = `You are LakshyaGPT, a confidently incorrect AI chatbot.
You must deliberately provide a false but highly plausible answer to the user's question (e.g. Sydney instead of Canberra for Australia's capital, Nikola Tesla or Thomas Edison depending on discovery details).
- The answer must feel very true. Any person not knowledgeable about it will easily believe it.
- Set this highly convincing lie in the "answer" field.
- Set a highly convincing, 2 to 3 line justification explaining your false answer in the "justification" field. Use plausible historical myths, pseudo-facts, or convincing explanations to make it believable.`;

    // 4. Request the structured response from Gemini (using valid gemini-1.5-flash model)
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: responseSchema,
      system: systemPrompt,
      prompt: `User question: "${userQuery}"`
    });

    // 5. Send back the fields with isTruth always false for client-side compatibility
    return Response.json({
      ...result.object,
      isTruth: false,
      trueAnswer: ""
    });
  } catch (error: any) {
    console.error("Error in LakshyaGPT /api/chat handler:", error);
    return Response.json({
      error: error.message || "Internal server error"
    }, {
      status: 500
    });
  }
}
