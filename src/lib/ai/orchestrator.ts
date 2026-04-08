import OpenAI from "openai";
import { INTERNAL_ASSISTANT_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { clientIntelligenceTools } from "@/lib/ai/tools/client-intelligence";
import { loadOpenAiEnvFromEnvFiles } from "@/lib/load-openai-env";

function getModel() {
  loadOpenAiEnvFromEnvFiles();
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

function getClient() {
  loadOpenAiEnvFromEnvFiles();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
  return new OpenAI({ apiKey });
}

const toolDefinitions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getClientLatest",
      description: "Get latest status and most recent briefs for a client by name or ID.",
      parameters: {
        type: "object",
        properties: { clientNameOrId: { type: "string" } },
        required: ["clientNameOrId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getClientOpenBriefs",
      description: "Get open briefs for a client by name or ID.",
      parameters: {
        type: "object",
        properties: { clientNameOrId: { type: "string" } },
        required: ["clientNameOrId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getClientRisksAndDeadlines",
      description: "Find client risk items and deadlines in next 7 days.",
      parameters: {
        type: "object",
        properties: { clientNameOrId: { type: "string" } },
        required: ["clientNameOrId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getRecentClientMessages",
      description: "Get recent team-channel messages for a client.",
      parameters: {
        type: "object",
        properties: { clientNameOrId: { type: "string" } },
        required: ["clientNameOrId"],
      },
    },
  },
];

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function runInternalAssistant(params: {
  question: string;
  history: HistoryMessage[];
}) {
  const openai = getClient();
  const model = getModel();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: INTERNAL_ASSISTANT_SYSTEM_PROMPT },
    ...params.history.map((message) => ({ role: message.role, content: message.content })),
    { role: "user", content: params.question },
  ];

  const firstPass = await openai.chat.completions.create({
    model,
    messages,
    tools: toolDefinitions,
    tool_choice: "auto",
    temperature: 0.2,
  });

  const choice = firstPass.choices[0];
  const message = choice?.message;
  if (!message) {
    throw new Error("No model response.");
  }

  if (!message.tool_calls || message.tool_calls.length === 0) {
    return message.content ?? "I could not generate a response.";
  }

  const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  for (const call of message.tool_calls) {
    if (call.type !== "function") {
      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify({ error: "unsupported_tool_call_type" }),
      });
      continue;
    }
    const toolName = call.function.name as keyof typeof clientIntelligenceTools;
    const impl = clientIntelligenceTools[toolName];
    if (!impl) {
      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify({ error: "unknown_tool", name: call.function.name }),
      });
      continue;
    }

    let parsedInput: unknown = {};
    try {
      parsedInput = JSON.parse(call.function.arguments || "{}");
    } catch {
      parsedInput = {};
    }
    try {
      const result = await impl(parsedInput);
      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    } catch (toolErr) {
      const errMsg = toolErr instanceof Error ? toolErr.message : String(toolErr);
      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify({ error: "tool_failed", message: errMsg }),
      });
    }
  }

  const secondPass = await openai.chat.completions.create({
    model,
    messages: [
      ...messages,
      {
        role: "assistant",
        content: message.content ?? "",
        tool_calls: message.tool_calls,
      },
      ...toolMessages,
    ],
    temperature: 0.2,
  });

  return secondPass.choices[0]?.message?.content ?? "I could not generate a response.";
}

