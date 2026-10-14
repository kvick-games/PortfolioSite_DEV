# Portfolio and private showcase

The public React portfolio and its existing GitHub Pages workflow remain separate from unpublished Dreamatron material. The private content is a separate local repository at `D:\Webdev\PortfolioShowcase_PRIVATE`, with no remote. Never copy that directory into `public`, `Resources`, `dist`, or this public repository.

## Local preview

```powershell
npm run build
$env:STUDIO_CONTENT_ROOT = 'D:\Webdev\PortfolioShowcase_PRIVATE'
npm run showcase
```

Open http://127.0.0.1:4175/portfolio. `/studio/` is the password entry page. `.local/owner-url.txt` contains a private local owner URL for setting the shared password. Use at least 16 characters. Changing it immediately signs out existing clients. The owner route only exists in local mode, which binds to loopback, validates Host and Origin, and stores a salted scrypt password hash in ignored `.local/showcase.json`. No password or hash is bundled into the public website.

The private screen images, CSS, JavaScript, and HTML all require a server session. Cookies are HttpOnly and SameSite=Strict, expire after four hours, and are invalidated at logout and server restart. Private responses are no-store and noindex. Login attempts are limited. Client-side code contains no shared password. Screenshots that a client has already saved cannot be revoked.

## Hosting

GitHub Pages is static hosting and cannot run this gate. The complete site can run on a Node 22+ host behind HTTPS, or `/studio/*` can be routed to that host while public pages stay on GitHub Pages. No live deployment or DNS change was made in this work.

Configure these on the chosen server, not in Git:

- `NODE_ENV=production`
- `PUBLIC_ORIGIN=https://www.kvick-games.com` (or the actual chosen origin)
- `STUDIO_CONTENT_ROOT` pointing to the uploaded private content, outside the public root
- `STUDIO_PASSWORD_HASH` from the locally configured `.local/showcase.json` passwordHash field, transferred through the hosting provider's secret store
- `PORT` as required by the host

Build public assets with `npm ci && npm run build`; run `npm run showcase`. Forward the original Host header, terminate HTTPS at the trusted reverse proxy, and do not publicly expose the Node port. Production refuses to start without the hash and HTTPS origin, disables the owner route, and uses a Secure, host-only session cookie. The session and rate-limit stores assume one server process. Multi-instance hosting needs a shared session and limiter store before scaling. Keep the private content upload outside GitHub Pages deployments.

Run `node --test server/showcase.test.mjs` for the authentication boundary checks. New private files must be added deliberately to the allowlist in the server. README and sources metadata remain owner-only even after login.

## Content notes

The first private case study is DT_Auteur. Four genuine development captures show the workspace, timeline notes, audio warp, and effect inspector. The separate private repository records their source paths. No private screenshot appears in the public build. The two old experiment JPEGs were zero-byte files; their broken image elements were removed while their project articles were preserved.

Public copy retains legacy project dates/statuses, which should be reviewed before launch. Resume content remains the existing source material. No invented client results or testimonials were added.
