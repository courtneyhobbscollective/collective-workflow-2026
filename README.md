# Workflow MVP

Production work management MVP for a creative agency.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Supabase client wiring
- Zod + React Hook Form

## Setup

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npx prisma generate`.
4. Run `npx prisma migrate dev --name init`.
5. Run `npm run db:seed`.
6. Run `npm run dev`.

## Route Map

- Internal: `/dashboard`, `/briefs`, `/clients`, `/scopes`, `/calendar`, `/messages`, `/reports`
- Portal: `/portal`, `/portal/briefs`, `/portal/calendar`, `/portal/messages`, `/portal/completed`, `/portal/account`
- Auth: `/login`
