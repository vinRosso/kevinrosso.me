# kevinrosso.me

Personal portfolio of Kevin Rosso, Rigging TD. Built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Local development

Node 24 is pinned in `.node-version` (picked up by fnm / nvm).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build in dist/
npm run preview    # serve the production build
```

To test the protected reel locally, copy `.env.example` to `.env` and fill in the values.

## Writing a post

1. Create a folder in `src/content/blog/`, e.g. `src/content/blog/jaguar-rig/`.
2. Copy `src/content/blog/formatting-guide/index.md` into it (or copy the whole folder). It is rendered at `/blog/formatting-guide/` in `npm run dev` and shows every formatting option: banners, tables, code, maths, graphs, images, videos.
3. Put the cover and any other images in the same folder and reference them with `./name.webp`.
4. Set `draft: false`, commit and push. GitHub Actions publishes it in about a minute.

Drafts (`draft: true`) are visible in `npm run dev` but never published.

## Editing the home page

All the texts, links, posters, experience and credits are in `src/data/site.ts`.
The "years of experience" are calculated from `riggingSince` and `codingSince`.

## Protected reel

The reel URL is encrypted at build time, so it never appears in the page source.

- Visitors on the normal URL see a password form.
- Private links `https://kevinrosso.me/#reel=<token>` unlock it directly.
  The part after `#` is never sent to the server.
- Every application can get its own link, so you can see which one was opened.

Set these repository secrets in **Settings > Secrets and variables > Actions**:

| Secret             | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| `REEL_URL`         | Vimeo address of the video: the normal page address (`https://vimeo.com/ID` or `https://vimeo.com/ID/HASH`) or the player address (`https://player.vimeo.com/video/ID?h=HASH`); it is converted automatically |
| `REEL_PASSWORD`    | Password visitors can type                                         |
| `REEL_LINK_TOKENS` | Per-application links, `label=token` comma separated (see below)   |
| `REEL_LINK_TOKEN`  | Optional generic link                                              |
| `REEL_PUBLIC`      | `true` to show the reel to everyone without password               |

Without these secrets the site shows "Reel available on request".

### Managing the reel

```bash
npm run reel -- link framestore-melbourne   # new private link for one application
npm run reel -- links                       # list all private links
npm run reel -- url https://vimeo.com/ID/HASH     # change the reel video
npm run reel -- password NEW_PASSWORD       # change the password
npm run reel -- password --off              # remove the password (private links keep working)
npm run reel -- public                      # reel visible to everyone, no password
npm run reel -- private                     # protected again
```

Each command updates the local `.env` / `reel-tokens.txt` and, when the GitHub CLI (`gh`) is
installed and logged in, the repository secrets, then starts a new deploy. Add `--local` to skip GitHub.
`reel-tokens.txt` is git-ignored. Labels are encrypted, so the page source never shows where you applied.
Avoid double quotes (`"`) in the password.

### Stats

Set `goatcounter` in `src/data/site.ts` to your GoatCounter code to enable cookie-free stats.
For each label you will see these events:

- `reel/open/<label>`: the link was opened (or the password was typed)
- `reel/play/<label>`: the reel started playing
- `reel/half/<label>`: the viewer reached 50% of the reel

## Deploy and custom domain

1. Push to the `main` branch of the GitHub repository (include `package-lock.json`).
2. **Settings > Pages > Build and deployment > Source: GitHub Actions**.
3. **Settings > Pages > Custom domain**: `kevinrosso.me` (the `public/CNAME` file keeps it set).
4. At your DNS provider:
   - `A` records for `kevinrosso.me` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` pointing to `vinrosso.github.io`
5. When the DNS check passes, tick **Enforce HTTPS**. The certificate is issued and renewed automatically.

## Search, sharing and feeds

- Link previews (LinkedIn, Slack...) use `public/og.jpg` (1200x630) or, for a post, its `cover`.
- `/sitemap.xml` and `/rss.xml` are generated at build time from the posts; `public/robots.txt` points to the sitemap.
- The Montserrat font is served by the site itself (`@fontsource-variable/montserrat`), nothing is loaded from Google.
- Visits are counted with GoatCounter (`goatcounter` in `src/data/site.ts`): no cookies, no banner needed.
- The line under the role on the home page ("Open to work") is `availability` in `src/data/site.ts`; leave it empty to hide it together with the two buttons.

## SEO

- Every page has a canonical address, a title, a description and link-preview tags (`src/layouts/Base.astro`).
- Posts also publish structured data (BlogPosting and breadcrumbs); the home page publishes Person and WebSite.
- Tag pages, the 404 page and `unlisted` posts are set to `noindex` and are left out of `/sitemap.xml`.
- Post covers become 1200x630 JPEG link previews automatically.
- After going live: add the site to Google Search Console and Bing Webmaster Tools (verify with a DNS TXT record) and submit `https://kevinrosso.me/sitemap.xml`.

## Contact email

The address is not written anywhere in the repository. Put it in `.env` (`CONTACT_EMAIL=...`) for local work and add a repository secret named `CONTACT_EMAIL` on GitHub (Settings > Secrets and variables > Actions, or `gh secret set CONTACT_EMAIL`). At build time it is scrambled; the page unscrambles it when a visitor first moves the mouse, touches the screen or presses a key, so crawlers and simple scrapers do not find it.
