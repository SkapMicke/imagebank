import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const file = form.get('file') as File | null;
    const categoryIdRaw = String(form.get('categoryId') || '').trim();
    const titleRaw = String(form.get('title') || '').trim();

    const categoryId = categoryIdRaw.length > 0 ? categoryIdRaw : null;
    const title = titleRaw.length > 0 ? titleRaw : null;

    if (!file) {
      return NextResponse.json(
        { error: 'Ingen bild vald.' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Filen måste vara en bild.' },
        { status: 400 }
      );
    }

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
      include: {
        category: true,
      },
    });

    return NextResponse.json({ uploaded: [image] });
  } catch (error) {
    console.error('Upload error:', error);

    return NextResponse.json(
      { error: 'Något gick fel vid uppladdning.' },
      { status: 500 }
    );
  }
}