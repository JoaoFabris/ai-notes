# ai-notes

A full-stack AI-powered notes app built with Next.js, Supabase, and LLM integration.

Users can create and manage personal notes, get AI-generated summaries, and interact with their notes through a natural language chat interface.

---

## Features

- **Authentication** — email/password login and signup via Supabase Auth
- **Notes CRUD** — create, list, and delete personal notes
- **AI Summary** — summarize all notes using a Groq LLM via Supabase Edge Function
- **AI Chat** — natural language interface to manage notes using function calling
- **Row Level Security** — each user can only access their own data, enforced at the database level

---

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend    | Supabase (PostgreSQL + Auth + Edge Functions)     |
| AI         | Groq API (llama / mistral models)                 |
| Deployment | Vercel (frontend), Supabase (edge functions)      |

---

## Architecture

```
Browser (React)
    │
    ├── Supabase Client (anon key)
    │       └── queries filtered by RLS (auth.uid())
    │
    └── /api/chat (Next.js API Route)
            └── Groq API — function calling
                    └── executes create_note / list_notes / delete_note

Supabase Edge Function (/functions/v1/summarize)
    ├── validates JWT
    ├── fetches user notes (RLS enforced)
    └── calls Groq API with secret key (never exposed to browser)
```

---

## Security

**Row Level Security (RLS)** is enabled on the `notes` table. All queries are automatically filtered by `auth.uid()` — the authenticated user's ID extracted from the JWT. This means even if someone obtains the public anon key, they can only access their own data.

```sql
-- Example policy
create policy "users see own notes"
  on notes for select
  using ( user_id = auth.uid() );
```

**API keys** (Groq) are stored as Supabase secrets and never reach the browser. The Edge Function acts as a secure server-side proxy.

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/seu-usuario/ai-notes.git
cd ai-notes
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up Supabase

- Create a project at [supabase.com](https://supabase.com)
- Run the SQL migrations in the Supabase SQL Editor:
  - `supabase/migrations/001_notes.sql`
  - `supabase/migrations/002_rls_policies.sql`

### 4. Configure environment variables

Create a `.env` file at the project root:

```properties
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key  # optional, for function calling
```

### 5. Deploy the Edge Function

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase secrets set GROQ_API_KEY=your-groq-key
supabase functions deploy summarize
```

### 6. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
ai-notes/
├── app/
│   ├── api/chat/route.ts        # function calling API route
│   ├── chat/page.tsx            # AI chat interface
│   ├── login/page.tsx           # auth page
│   └── notes/page.tsx           # notes management
├── lib/
│   └── supabase.ts              # Supabase client
├── supabase/
│   ├── functions/
│   │   └── summarize/index.ts   # Edge Function (Groq + RLS)
│   └── migrations/
│       ├── 001_notes.sql        # table schema
│       └── 002_rls_policies.sql # RLS policies
└── .env                         # environment variables (never commit)
```

---

## Key Concepts

### Row Level Security

RLS policies live at the database level and filter every query automatically based on the authenticated user. No `WHERE user_id = ...` needed in application code.

### Edge Functions

Supabase Edge Functions run server-side on Deno. Used here to call the Groq API securely — the secret key never reaches the browser. The function receives the user's JWT and creates a Supabase client with it, so RLS continues to apply inside the function.

### Function Calling

The AI chat uses LLM function calling: the model decides which function to invoke (`create_note`, `list_notes`, `delete_note`) and returns structured JSON arguments. The application executes the actual database operation and returns the result to the model for a final natural language response.

---

## License

MIT
