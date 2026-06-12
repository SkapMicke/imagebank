import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name || '').trim();

  if (!name) {
    return NextResponse.json({ error: 'Kategorinamn saknas.' }, { status: 400 });
  }

  const baseSlug = slugify(name);
  const category = await prisma.category.upsert({
    where: { slug: baseSlug },
    update: {},
    create: { name, slug: baseSlug },
  });

  return NextResponse.json(category);
}
