## MindGuess

AI-powered guessing game. Think of a person, answer Yes/No/Unknown, and the app narrows candidates using entropy-based questions. If it fails, you teach it the new person and traits.

### Stack

- Next.js App Router, TypeScript, Tailwind, shadcn/ui
- Prisma ORM + PostgreSQL
- Server Actions for game logic; thin client UI

### Setup

1. Install deps

```
npm install
```

2. Environment
   Create `.env.local` with your Postgres connection string:

```
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?schema=public"
```

3. Prisma

```
npx prisma generate
npx prisma migrate dev
# optional: seed when seed script exists
# npx prisma db seed
```

4. Dev server

```
npm run dev
```

Open http://localhost:3000.

### Gameplay flow

- App asks highest-entropy trait question; Unknown answers do not filter candidates.
- When confident or out of useful questions, it guesses and asks for confirmation.
- If wrong, you provide the correct person and trait values (optionally add a new trait); the app persists and restarts.

### Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – run built app
- `npm run lint` – lint
- `npm run prisma:migrate` – apply dev migrations
- `npm run prisma:generate` – regenerate Prisma client

### Notes

- Keep business logic on the server (see `src/app/actions/game.ts`, `src/lib/game.ts`).
- UI components live in `src/components` using shadcn/ui primitives.
