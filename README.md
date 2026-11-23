# FormChat: Interactive Form Builder with Chatbot Widget

A full-stack web application where users build forms, publish them, and collect
responses through a chatbot-style widget. Forms can be shared by link or embedded
on any external website with a single script tag.

## Features

- Landing page with a live chatbot demo
- Sign up, log in, and log out (Supabase Auth) with protected dashboard routes
- Dashboard with total forms, published forms, and total responses
- Create, edit, delete, publish, and unpublish forms
- Form builder with short text, email, multiple choice, and yes/no questions;
  required or optional; add, edit, delete, and reorder; preview; save as draft
- Chatbot widget: one question at a time, validation, custom welcome and
  completion messages, custom primary color, floating launcher, mobile friendly
- Public link per published form (`/f/<slug>`)
- Embeddable script that works on any website and is isolated from its styles
- Response management: list with timestamps and individual submission views

## Tech stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Supabase (PostgreSQL,
Auth, Row Level Security), Zod, deployed on Vercel.

## How it works

```
Owner  -> Next.js dashboard -> Supabase (Auth + Postgres + RLS)

Visitor (public page or external site with widget.js)
  -> /embed/<slug> (iframe) or /f/<slug>
  -> /api/public/forms/<slug>/submit  (server validates, then writes)
```

- Owners talk to Supabase with their own session. Row Level Security makes sure
  each user only sees their own data.
- Anonymous visitors have no direct database access. They only use two API
  routes. The server checks that the form is published, validates every answer
  against the saved questions, and then saves with the service role key.
- `widget.js` creates a floating launcher inside a Shadow DOM and loads the chat
  in an iframe, so the host website's CSS and JavaScript can't interfere.

## Project structure

```
public/widget.js          Embeddable script
embed-test/index.html     Standalone page for testing the embed
supabase/schema.sql       Full database schema, RLS, and triggers
src/proxy.ts              Session refresh and dashboard protection
src/app/                  Pages and API routes
src/components/           UI, builder, dashboard, and chat widget components
src/lib/                  Supabase clients, validation, rate limiting, helpers
```

## Getting started

### Requirements

Node.js (current LTS), Git, and a free Supabase account.

### 1. Install

```bash
npm install
```

### 2. Create the database

Create a Supabase project, open the SQL Editor, and run `supabase/schema.sql`.
In Authentication settings, enable the Email provider. For local development you
can turn off "Confirm email".

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from
Supabase, Project Settings, API Keys:

| Variable | Where it is used | Safe in the browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Yes (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **No. Never expose it.** |

`.env.local` is ignored by Git. Never commit it.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Embedding a form

Publish a form, open its edit page, and copy the code from "Share and embed":

```html
<script src="https://YOUR-DOMAIN/widget.js" data-form="YOUR-SLUG" defer></script>
```

Paste it just before the closing `</body>` tag. Unpublishing the form removes
the launcher and stops accepting submissions. `embed-test/index.html` is a
standalone page for testing.

## Security notes

- RLS is enabled on every table. The `anon` role has no table permissions.
- Public submissions are rate limited, size limited, and strictly validated on
  the server.
- The service role key is used only in server code.
- The dashboard and auth pages send headers that prevent framing.

## Known limitations

- The rate limiter uses server memory, so on serverless hosting each instance
  counts separately. For heavier traffic use a shared store such as Upstash Redis.
- No CAPTCHA. Add one such as Cloudflare Turnstile if spam becomes a problem.
- Reordering questions uses up/down buttons rather than drag and drop.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # run the production build
npm run lint    # ESLint
```
