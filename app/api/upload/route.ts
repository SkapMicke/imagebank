import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll('files') as File[];
  const categoryId = String(form.get('categoryId') || '') || null;
  const title = String(form.get('title') || '').trim() || null;

  if (!files.length) {
    return NextResponse.json({ error: 'Inga bilder valda.' }, { status: 400 });
  }

  const uploaded = [];

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const blob = await put(`images/${Date.now()}-${safeName}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    const image = await prisma.image.create({
      data: {
        url: blob.url,
        pathname: blob.pathname,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        title,
        categoryId,
      },
      include: { category: true },
    });

    uploaded.push(image);
  }

  return NextResponse.json({ uploaded });
}
