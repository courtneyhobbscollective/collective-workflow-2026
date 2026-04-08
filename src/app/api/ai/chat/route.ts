import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSessionUserId, requireRole } from "@/lib/auth";
import { runInternalAssistant } from "@/lib/ai/orchestrator";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { loadOpenAiEnvFromEnvFiles } from "@/lib/load-openai-env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RequestBody = {
  message?: string;
  conversationId?: string | null;
};

export async function POST(req: Request) {
  const started = Date.now();
  loadOpenAiEnvFromEnvFiles();
  await requireRole(["admin", "team_member"]);
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const limit = checkAiRateLimit(userId);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as RequestBody;
    const question = String(body.message ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "message_required" }, { status: 400 });
    }

    const conversation = body.conversationId
      ? await prisma.aiConversation.findFirst({
          where: { id: body.conversationId, userId },
        })
      : await prisma.aiConversation.create({
          data: { userId, title: question.slice(0, 80) },
        });

    if (!conversation) {
      return NextResponse.json({ error: "conversation_not_found" }, { status: 404 });
    }

    const recentMessages = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 12,
      select: { role: true, content: true },
    });

    await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: "user",
        content: question,
      },
    });

    const reply = await runInternalAssistant({
      question,
      history: recentMessages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => ({ role: msg.role as "user" | "assistant", content: msg.content })),
    });

    await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: "assistant",
        content: reply,
      },
    });

    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    const elapsedMs = Date.now() - started;
    console.info("[ai-chat] success", { userId, conversationId: conversation.id, elapsedMs });

    return NextResponse.json({ reply, conversationId: conversation.id });
  } catch (error) {
    const elapsedMs = Date.now() - started;
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ai-chat] failure", { userId, elapsedMs, error: message });

    const isDev = process.env.NODE_ENV === "development";

    if (message.includes("OPENAI_API_KEY is missing")) {
      return NextResponse.json(
        {
          error: "assistant_config",
          hint: "Set OPENAI_API_KEY in .env.local or .env (not only .env.example), then restart `npm run dev`.",
        },
        { status: 503 }
      );
    }

    if (
      message.includes("AiConversation") ||
      message.includes("AiMessage") ||
      message.includes("does not exist") ||
      message.includes("Unknown arg") ||
      message.includes("P20")
    ) {
      return NextResponse.json(
        {
          error: "assistant_db",
          hint: "Apply the latest Prisma schema (e.g. `npx prisma db push` or migrate), then restart the dev server.",
          ...(isDev ? { detail: message } : {}),
        },
        { status: 503 }
      );
    }

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: "openai_api",
          hint:
            error.status === 401
              ? "OpenAI rejected the API key. Check OPENAI_API_KEY."
              : error.status === 429
                ? "OpenAI rate limit hit. Try again shortly."
                : "OpenAI request failed. Check OPENAI_MODEL and your account billing/quotas.",
          ...(isDev ? { detail: error.message } : {}),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "assistant_unavailable",
        hint: "Check the server terminal for [ai-chat] failure logs.",
        ...(isDev ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}

