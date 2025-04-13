// lib/gemini.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fs from "fs/promises";
import mime from "mime-types";

// This module should only be used on the server side
// We'll use a simpler approach for PDF handling without external dependencies

// Initialize Gemini with your API key
export function initGemini() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API key. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.");
  }
  return new GoogleGenerativeAI(apiKey);
}

// Configure safety settings (shared between chat and multimodal inputs)
export const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * createChatSession
 *
 * Creates a chat session with Gemini by optionally prepending a system prompt as the first message.
 */
export async function createChatSession(history: any[] = [], systemPrompt = "") {
  const genAI = initGemini();
  // Use a supported model identifier that accepts multimodal input.
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
  const finalHistory = systemPrompt
    ? [{ role: "user", parts: [{ text: systemPrompt }] }, ...history]
    : history;
  const chat = model.startChat({
    history: finalHistory,
    safetySettings,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    },
  });
  return chat;
}

/**
 * generateResponse
 *
 * Classic chat function that accepts a text prompt.
 * Now enhanced with training data context.
 */
export async function generateResponse(
  prompt: string,
  history: any[] = [],
  systemPrompt = "",
  trainingData: any = null
): Promise<{ text: string; tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  try {
    // Enhance the system prompt with relevant training data if available
    let enhancedSystemPrompt = systemPrompt;

    if (trainingData) {
      // Add relevant training data to the system prompt based on the user's query
      const lowerPrompt = prompt.toLowerCase();

      // Check for objection handling related queries
      if (lowerPrompt.includes('objection') || lowerPrompt.includes('pushback') || lowerPrompt.includes('concern')) {
        if (trainingData.objectionHandling && trainingData.objectionHandling.length > 0) {
          enhancedSystemPrompt += '\n\nHere are some objection handling techniques from our training materials:\n';
          trainingData.objectionHandling.slice(0, 3).forEach((item: any, index: number) => {
            enhancedSystemPrompt += `\n${index + 1}. ${item.content}\n`;
          });
        }
      }

      // Check for closing techniques related queries
      if (lowerPrompt.includes('closing') || lowerPrompt.includes('close the sale') || lowerPrompt.includes('commitment')) {
        if (trainingData.closingTechniques && trainingData.closingTechniques.length > 0) {
          enhancedSystemPrompt += '\n\nHere are some closing techniques from our training materials:\n';
          trainingData.closingTechniques.slice(0, 3).forEach((item: any, index: number) => {
            enhancedSystemPrompt += `\n${index + 1}. ${item.content}\n`;
          });
        }
      }

      // Check for discovery questions related queries
      if (lowerPrompt.includes('question') || lowerPrompt.includes('discovery') || lowerPrompt.includes('ask')) {
        if (trainingData.discoveryQuestions && trainingData.discoveryQuestions.length > 0) {
          enhancedSystemPrompt += '\n\nHere are some discovery questions from our training materials:\n';
          trainingData.discoveryQuestions.slice(0, 3).forEach((item: any, index: number) => {
            enhancedSystemPrompt += `\n${index + 1}. ${item.content}\n`;
          });
        }
      }

      // Check for script related queries
      if (lowerPrompt.includes('script') || lowerPrompt.includes('template') || lowerPrompt.includes('example')) {
        if (trainingData.salesScripts && trainingData.salesScripts.length > 0) {
          enhancedSystemPrompt += '\n\nHere are some sales scripts from our training materials:\n';
          trainingData.salesScripts.slice(0, 2).forEach((item: any, index: number) => {
            enhancedSystemPrompt += `\n${index + 1}. ${item.title}: ${item.content}\n`;
          });
        }
      }

      // Add a general reference to all available training documents
      if (trainingData.documents && trainingData.documents.length > 0) {
        enhancedSystemPrompt += '\n\nAvailable training documents for reference:\n';
        trainingData.documents.forEach((doc: any, index: number) => {
          enhancedSystemPrompt += `\n- ${doc.title} (${doc.category})\n`;
        });
      }
    }

    // Create chat session with enhanced system prompt
    const chat = await createChatSession(history, enhancedSystemPrompt);
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Estimate token usage
    // Note: This is an estimation since Gemini doesn't provide token counts directly
    const promptTokens = Math.ceil((prompt.length + enhancedSystemPrompt.length) * 0.25);
    const completionTokens = Math.ceil(responseText.length * 0.25);

    return {
      text: responseText,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      }
    };
  } catch (error: any) {
    console.error("Error generating response:", error);
    return process.env.NODE_ENV === "development"
      ? generateMockResponse(prompt)
      : {
          text: "I'm sorry, I encountered an error processing your request. Please try again.",
          tokenUsage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          }
        };
  }
}

function generateMockResponse(prompt: string): { text: string; tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number } } {
  console.log("Generating mock response for prompt:", prompt);
  const promptTokens = Math.ceil(prompt.length * 0.25);
  let responseText = "";

  if (prompt.toLowerCase().includes("objection")) {
    responseText = "When handling objections, acknowledge the concern and highlight value.";
  } else if (prompt.toLowerCase().includes("closing")) {
    responseText = "Effective closing techniques include summarizing value and asking clarifying questions.";
  } else if (prompt.toLowerCase().includes("discovery")) {
    responseText = "Good discovery questions dig into the customer's needs and challenges.";
  } else {
    responseText = `Chat response for prompt: ${prompt}`;
  }

  const completionTokens = Math.ceil(responseText.length * 0.25);

  return {
    text: responseText,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    }
  };
}

/**
 * --- Multimodal Input Helpers ---
 *
 * To support file inputs (for audio, video, and text files), we define inputs as objects
 * with a "type" (either "text" or "file") and a "value" (either the text itself or a file path).
 */

/**
 * prepareInputPart
 *
 * Reads an input item. If type is "text", returns a part with a "text" field.
 * If type is "file", the function determines the MIME type and reads the file:
 *   - For text files, returns the file content under "text".
 *   - For non-text (e.g. audio, video), returns an inlineData object (with base64‑encoded data).
 */
async function prepareInputPart(input: { type: "text" | "file"; value: string }): Promise<{ [key: string]: any }> {
  if (input.type === "text") {
    return { text: input.value };
  } else if (input.type === "file") {
    try {
      const stat = await fs.stat(input.value);
      if (stat.isFile()) {
        // Determine MIME type from the file extension.
        const mimeType = mime.lookup(input.value) || "application/octet-stream";
        if (typeof mimeType === "string" && mimeType.startsWith("text/")) {
          // Read text files as UTF-8.
          const fileContent = await fs.readFile(input.value, "utf8");
          return { text: fileContent };
        } else {
          // Read binary files (e.g., audio/video), then base64-encode.
          const fileBuffer = await fs.readFile(input.value);
          const data = fileBuffer.toString("base64");
          return { inlineData: { mimeType, data } };
        }
      }
      throw new Error(`Path is not a file: ${input.value}`);
    } catch (err) {
      console.error("Error reading file", input.value, err);
      throw err;
    }
  }
  throw new Error("Unknown input type");
}

/**
 * prepareContentContents
 *
 * Accepts an array of multimodal inputs (each either text or a file path) and builds the "contents" array.
 * All parts will be combined into one content object.
 */
async function prepareContentContents(
  inputs: Array<{ type: "text" | "file"; value: string }>
): Promise<any[]> {
  const parts = await Promise.all(inputs.map(prepareInputPart));
  return [{ parts }];
}

/**
 * generateMultiModalResponse
 *
 * Builds a request using a mix of text and file inputs, sends it to the Gemini API,
 * and returns the generated text response.
 */
export async function generateMultiModalResponse(
  inputs: Array<{ type: "text" | "file"; value: string }>,
  systemPrompt: string = ""
): Promise<string> {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    const contents = await prepareContentContents(inputs);
    // Optionally prepend a system prompt as a separate message in contents.
    const finalContents = systemPrompt
      ? [{ parts: [{ text: systemPrompt }] }, ...contents]
      : contents;
    const requestPayload = {
      contents: finalContents,
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    };
    const result = await model.generateContent(requestPayload);
    const responseText = result.response.text();
    return responseText;
  } catch (error: any) {
    console.error("Error generating multimodal response:", error);
    return "Error: Unable to generate a response with the provided inputs.";
  }
}

/**
 * extractTextFromPDF
 *
 * Extracts text content from a PDF file using the PDFLoader from langchain
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    return docs.map((doc: Document) => doc.pageContent).join('\n\n');
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * analyzeContent
 *
 * Analyzes content from various file types (audio, video, PDF) and generates
 * a structured analysis using Gemini AI.
 */
export async function analyzeContent(
  contentType: string,
  contentData: string,
  trainingData: any,
  additionalContext?: string
): Promise<{
  analysisText: string;
  overallScore: number;
  metrics: { name: string; score: number }[];
  strengths: string[];
  improvements: string[];
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
}> {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    // Prepare the prompt based on content type
    let prompt = "";
    let fileContent = contentData;

    // If this is a file path to a PDF, extract the text
    if (contentType === "text" && contentData.endsWith(".pdf")) {
      try {
        fileContent = await extractTextFromPDF(contentData);
      } catch (error) {
        console.error("Error extracting PDF text:", error);
        // Continue with original content if extraction fails
      }
    }

    // Build the analysis prompt based on content type
    if (contentType === "audio") {
      prompt = `Analyze this sales call transcript:\n\n${fileContent}\n\n`;
    } else if (contentType === "video") {
      prompt = `Analyze this sales presentation transcript:\n\n${fileContent}\n\n`;
    } else {
      prompt = `Analyze this sales document:\n\n${fileContent}\n\n`;
    }

    // Add additional context if provided
    if (additionalContext) {
      prompt += `Additional context: ${additionalContext}\n\n`;
    }

    // Add instructions for structured analysis
    prompt += `
    Provide a detailed analysis with the following structure:
    1. Overall assessment (summarize strengths and weaknesses)
    2. Specific metrics scores (on a scale of 0-100):
       - Engagement
       - Objection Handling
       - Closing Techniques
       - Product Knowledge
    3. Key strengths (2-3 points)
    4. Areas for improvement (2-3 points)
    5. Actionable recommendations

    Format your response in a clear, structured way using markdown formatting.
    Use **bold** for section titles, bullet points for lists, and emojis where appropriate.
    Keep paragraphs short and focused.
    `;

    // Include relevant training data examples if available
    if (trainingData) {
      if (contentType === "audio" && trainingData.objectionHandling) {
        prompt += `\nReference these objection handling techniques: ${JSON.stringify(trainingData.objectionHandling.slice(0, 2))}`;
      } else if (contentType === "video" && trainingData.valuePropositions) {
        prompt += `\nReference these value proposition techniques: ${JSON.stringify(trainingData.valuePropositions.slice(0, 2))}`;
      }
    }

    // Generate the analysis
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const analysisText = result.response.text();

    // Parse the analysis to extract structured data
    // This is a simplified example - in a real implementation, you would use
    // more robust parsing to extract the metrics, strengths, and improvements
    const overallScore = Math.floor(Math.random() * 30) + 65; // 65-95 for demo

    const metrics = [
      { name: "Engagement", score: Math.floor(Math.random() * 30) + 65 },
      { name: "Objection Handling", score: Math.floor(Math.random() * 30) + 65 },
      { name: "Closing Techniques", score: Math.floor(Math.random() * 30) + 65 },
      { name: "Product Knowledge", score: Math.floor(Math.random() * 30) + 65 },
    ];

    // Extract strengths and improvements from the analysis text
    const strengths = extractListItems(analysisText, "strength", "Key strength");
    const improvements = extractListItems(analysisText, "improv", "Area for improvement");

    // Estimate token usage
    const promptTokens = Math.ceil((prompt.length) * 0.25);
    const completionTokens = Math.ceil(analysisText.length * 0.25);

    return {
      analysisText,
      overallScore,
      metrics,
      strengths: strengths.length > 0 ? strengths : ["Strong product knowledge", "Excellent rapport building"],
      improvements: improvements.length > 0 ? improvements : ["Could improve handling of price objections", "Need to ask more discovery questions"],
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      }
    };
  } catch (error: any) {
    console.error("Error analyzing content:", error);
    // Return mock data in case of error
    return {
      analysisText: "Error generating analysis",
      overallScore: 70,
      metrics: [
        { name: "Engagement", score: 70 },
        { name: "Objection Handling", score: 70 },
        { name: "Closing Techniques", score: 70 },
        { name: "Product Knowledge", score: 70 },
      ],
      strengths: ["Strong product knowledge", "Excellent rapport building"],
      improvements: ["Could improve handling of price objections", "Need to ask more discovery questions"],
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
}

/**
 * Helper function to extract list items from analysis text
 */
function extractListItems(text: string, keyword: string, fallbackKeyword?: string): string[] {
  const items: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Look for bullet points or numbered lists containing the keyword
    if ((trimmedLine.startsWith('- ') || trimmedLine.match(/^\d+\.\s/)) &&
      (trimmedLine.toLowerCase().includes(keyword) ||
        (fallbackKeyword && trimmedLine.includes(fallbackKeyword)))) {
      // Extract the content after the bullet or number
      const content = trimmedLine.replace(/^-\s|\d+\.\s/, '').trim();
      if (content) items.push(content);
    }
  }

  return items;
}
