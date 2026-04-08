"use server";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUserId, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Body =
  | { mode: "one"; key: string }
  | { mode: "all"; keys: string[] };

function isValidKey(key: string) {
  return /^(msg-|act-)/.test(key);
}

export async function POST(req: Request) {
  await requireRole(["client"]);
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }

  const body = (await req.json()) as Body;

  if (body.mode === "one") {
    if (!isValidKey(body.key)) {
      return NextResponse.json({ ok: false, error: "bad_key" }, { status: 400 });
    }
    await prisma.portalNotificationDismissal.upsert({
      where: { userId_key: { userId, key: body.key } },
      create: { userId, key: body.key },
      update: {},
    });
    revalidatePath("/portal");
    return NextResponse.json({ ok: true });
  }

  const valid = body.keys.filter(isValidKey);
  if (valid.length === 0) {
    return NextResponse.json({ ok: false, error: "no_keys" }, { status: 400 });
  }
  await prisma.portalNotificationDismissal.createMany({
    data: valid.map((key) => ({ userId, key })),
    skipDuplicates: true,
  });
  revalidatePath("/portal");
  return NextResponse.json({ ok: true });
}
