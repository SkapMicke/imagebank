import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const q = searchParams.get('q') || '';
  const take = Math.min(Number(searchParams.get('take') || 40), 100);

  const images = await prisma.image.findMany({
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(q
        ? {
            OR: [
              { filename: { contains: q, mode: 'insensitive' } },
              { title: { contains: q, mode: 'insensitive' } },
              { notes: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = images.length > take;
  const data = hasMore ? images.slice(0, take) : images;

  return NextResponse.json({
    images: data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
  });
}
