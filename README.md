# Skap ImageBank

En Next.js-app för Vercel där du kan ladda upp bilder från dator/mobil och se dem senare från andra enheter.

## Teknik

- Next.js
- Vercel Blob för bildfiler
- Postgres + Prisma för kategorier och bildmetadata

## Start lokalt

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

## Vercel setup

1. Skapa nytt GitHub repo och pusha projektet.
2. Importera projektet i Vercel.
3. Lägg till Vercel Blob Storage i projektet.
4. Lägg till Postgres via Vercel Marketplace, t.ex. Neon eller Prisma Postgres.
5. Kontrollera att dessa env finns i Vercel:

```env
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
```

6. Kör deploy.
7. Kör `npm run db:push` lokalt eller via Vercel/CLI för att skapa tabellerna.

## Viktigt

Appen använder paginering med cursor. Det betyder att den inte försöker ladda alla bilder samtidigt, vilket är nödvändigt om du ska ha väldigt många bilder.
