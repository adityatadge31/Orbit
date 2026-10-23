# Orbit — A Basic MiniPro of ECOM (GitHub CI/CD edition)

A compact exam project with **public page, login, and admin dashboard**. Five application source files (`index.html`, `style.css`, `script.js`, `server.js`, `db.js`); SVGs in `assets/`. The extra `.github/`, `tests/`, `render.yaml`, `.gitignore` files are deployment configuration, not app complexity. No npm install required.

## Start locally

```bash
node server.js
```

Open http://localhost:3000. Log in using **admin@orbit.shop / admin123** (demo account only).

## Run CI tests yourself

```bash
node --check script.js
node --check server.js
node --check db.js
node --test tests/smoke.test.js
```

`tests/smoke.test.js` launches the actual server on a temporary port and checks HTTP, login, and record creation/update/deletion. Test data lives outside the project and is discarded automatically.

## Put it on GitHub

Create a new GitHub repository and put **the contents of this folder** in its root. Keep the branch name **main**. The prewritten workflow `.github/workflows/ci.yml` runs after pushes and on pull requests. You can see the green/red result in the **Actions** tab. Don't commit `data.json` / `store-data.json`—they are in `.gitignore`.

## Deploy it to Render (Node.js server)

1. Sign in at https://dashboard.render.com and connect your GitHub account.
2. Select **New → Blueprint** and choose this repo to use the included `render.yaml`, OR **New → Web Service** and connect the repo.
3. For a manual Web Service, select **Node**, **Free** plan, build command `echo 'No build required'`, start command `node server.js`, health check `/health`.
4. In Render **Settings → Auto-Deploy**, select **After CI Checks Pass**. The included Blueprint is configured with `autoDeployTrigger: checksPass` already.
5. After the first successful deploy, visit your unique `https://something.onrender.com` URL.

**Workflow:** `git push` → GitHub Actions checks/tests → Render deploys on passing checks → website updated.

## Point a free runs-on.dev address at Render

1. Visit https://runs-on.dev and sign in with GitHub. Account needs at least one public repo and must be 30 days old. Claim an available name; the registry gives one claimed root name per GitHub user.
2. At https://runs-on.dev/manage set record type `CNAME` with your own `something.onrender.com` domain (do not include `https://`).
3. In Render **Settings → Custom Domains**, add the claimed `yourname.runs-on.dev` address. Render will check DNS and issue HTTPS.
4. For a second or third site, the runs-on.dev registry also supports child subdomains under the one claimed name, e.g. `attendly.yourname.runs-on.dev`, but the hosting platform must support each custom domain. Render's Hobby workspace includes only 2 custom domains; additional ones may incur a fee.

See the official Render guide at https://runs-on.dev/docs/guides/render and Render's CI/deploy documentation at https://render.com/docs/deploys.

## Important limitations

- This project uses **demo credentials visible on the login page**. Never upload private student, borrower, or customer information and never mistake this for real authentication.
- Render **Free** instances sleep after inactivity, and local JSON changes disappear on service redeploy, restart or spin-down. They persist when using the local Node server, but **not reliably on free cloud hosting**. To persist in cloud, add a database or paid persistent disk; this starter does not do so.
- This is a classroom demonstration, not production software. No payment system or enterprise authentication is included.
