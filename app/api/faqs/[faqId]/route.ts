import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withError } from "@/lib/withError";

const updateFaqSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
  order: z.number().optional(),
});

export const PATCH = withError(async (_request: Request, { params }: { params: Promise<{ faqId: string }> }) => {
  const { faqId } = await params;
  const data = await _request.json();
  const validatedData = updateFaqSchema.parse(data);

  const faq = await prisma.fAQ.update({
    where: { id: faqId },
    data: validatedData,
  });

  if (!faq) {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }

  return NextResponse.json(faq, { status: 200 });
});

export const DELETE = withError(async (_request: Request, { params }: { params: Promise<{ faqId: string }> }) => {
  const { faqId } = await params;

  await prisma.fAQ.delete({
    where: { id: faqId },
  });

  return new NextResponse(null, { status: 204 });
});