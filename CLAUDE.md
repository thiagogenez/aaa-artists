# AAA Events Website

A music artist management agency website for AAA Events, built as a Next.js prototype.

## Tech stack

- **Next.js 16** (App Router, static export)
- **Tailwind CSS v4** (configured via `postcss.config.mjs`, no `tailwind.config.ts` needed)
- **TypeScript**
- No database — all artist data lives in `data/artists.ts`

## Running locally

```bash
npm run dev        # starts dev server at http://localhost:3000
npm run build      # production build
```

## Project structure

```text
app/
  page.tsx               # Home page (hero, about, genres, CTA)
  our-djs/page.tsx       # DJ grid (/our-djs)
  artist/[slug]/page.tsx # Individual artist detail
  layout.tsx             # Root layout (navbar + footer)
  globals.css            # Tailwind import + CSS theme variables
components/
  Navbar.tsx             # Fixed top navigation (mobile-responsive)
  Footer.tsx             # Site footer
data/
  artists.ts             # ALL artist data — edit this to update content
public/
  logo.jpg               # AAA Events logo (original JPEG)
  artists/               # Artist photos go here — <slug>.jpg
```

## Design system

| Token          | Value                  |
| -------------- | ---------------------- |
| Background     | `#0a0a0a`              |
| Surface        | `#141414` / `#1e1e1e`  |
| Border         | `#2a2a2a`              |
| Accent         | `white` / `#ffffff`    |
| Text muted     | `white/30` – `white/60`|
| CTA buttons    | `bg-white text-black`  |

## Adding / updating an artist

Edit `data/artists.ts`. Each artist has:

```ts
{
  name: string           // Display name
  slug: string           // URL slug — e.g. "xijaro-pitch" → /artist/xijaro-pitch
  genre: string          // Shown in white/muted above the name
  tagline: string        // Short italicised line under the name
  bio: string            // Full paragraph bio
  image: string          // Path under /public — e.g. "/artists/xijaro-pitch.jpg"
  socials: {
    instagram?: string
    soundcloud?: string  // If set, a SoundCloud embed player appears on the artist page
    facebook?: string
    spotify?: string
    youtube?: string
    beatport?: string
  }
  pastGigs: Gig[]        // Dates in the past — shown dimmed
  upcomingGigs: Gig[]    // Future dates — shown in gold, with optional ticket link
}
```

## Adding artist photos

Drop a JPEG into `public/artists/` using the artist's slug as the filename:

```text
public/artists/xijaro-pitch.jpg
public/artists/c-systems.jpg
public/artists/krevix.jpg
public/artists/frogr.jpg
public/artists/sago.jpg
public/artists/thiago.jpg
public/artists/mr-b.jpg
```

Then update the `image` field in `data/artists.ts` to point to it (already pre-set).
The artist page and roster cards will automatically show the photo.

## Booking email

Currently set to `booking@aaaevents.com`. To change it, search the project for that string — it appears in `components/Navbar.tsx`, `components/Footer.tsx`, and `app/artist/[slug]/page.tsx`.

## Logo

The logo JPEG (`public/logo.jpg`) is displayed as-is (original colours). When a proper white/transparent version is available, replace the file or update the `<Image>` components in `Navbar.tsx`, `Footer.tsx`, and `app/page.tsx`.

## Deploying

The easiest option is [Vercel](https://vercel.com) — connect the repo and it deploys automatically on every push. Zero config needed for a Next.js project.
