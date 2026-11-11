# App Service Builder: Vue + FastAPI sample

A standalone Vue frontend and FastAPI backend deployed as two components behind
one public hostname with
[Azure App Service Builder](https://builderapps.azure.com/docs/). Vite builds
the frontend into static files; Uvicorn runs the Python API separately.
The browser calls relative `/api` URLs, so no CORS configuration, database,
external service, or parent workspace is required.

**App Service Builder is in Private Preview. Use this sample for development
and testing, not as a production application template.** The original sample
was successfully deployed with the included manifest, the frontend reached the
backend, and its tested links worked. The renamed repository must still be
deployed and verified in your authorized preview environment. Local checks do
not establish cloud deployment success or regional availability.

## Features

- Vue Router landing, product, and client-side not-found pages.
- A frontend status card that calls the real FastAPI backend and displays failures.
- Separate static frontend and running Python API components behind one hostname.
- JSON health, availability, application identity, request metadata, and echo routes.
- API unit tests and same-origin integration checks using the built frontend.

## Repository structure

```text
api/                 FastAPI application, Python requirements, and tests
web/                 Vue/Vite frontend, package.json, lockfile, and public metadata
builder.yaml         Two-component routing and runtime configuration
fullstack.test.mjs   Standalone integration checks
scripts/verify.ps1   Local or deployed HTTP verification
```

Each component has its own dependencies. There is intentionally no root
`package.json`; run the commands below from the repository root.

## Prerequisites

- [Python 3.14](https://www.python.org/downloads/) and pip.
- [Node.js 24 LTS](https://nodejs.org/) and its bundled npm are recommended.
- [Git](https://git-scm.com/) and a GitHub account.
- For deployment: App Service Builder Private Preview access, an authorized
  Azure subscription, and an existing resource group in a supported preview
  location.
- Optional: [PowerShell 7](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)
  for the endpoint verification script.

The frontend lockfile contains Vue **3.5.43**, Vue Router **5.3.1**, and Vite
**8.3.1**. The API versions are pinned in `api/requirements.txt`.
Keep the requirements and lockfile rather than updating dependencies during setup.

## Run locally

Fork
[AzureAppService/app-service-builder-vue-fastapi](https://github.com/AzureAppService/app-service-builder-vue-fastapi/fork)
to your GitHub account. Clone your fork, replacing `<your-github-account>`:

```sh
git clone https://github.com/<your-github-account>/app-service-builder-vue-fastapi.git
cd app-service-builder-vue-fastapi
```

### Install both components

In PowerShell:

```powershell
python -m venv api\.venv
.\api\.venv\Scripts\python.exe -m pip install -r api\requirements-dev.txt
npm --prefix web ci --ignore-scripts
```

On Linux or macOS:

```sh
python -m venv api/.venv
api/.venv/bin/python -m pip install -r api/requirements-dev.txt
npm --prefix web ci --ignore-scripts
```

### Start the API

In PowerShell, from the repository root:

```powershell
$env:PORT = "18091"
.\api\.venv\Scripts\python.exe .\api\main.py
```

On Linux or macOS:

```sh
PORT=18091 api/.venv/bin/python api/main.py
```

The API reads `PORT`, defaults to `8080`, and binds to `0.0.0.0`. Use it only
on a trusted development network. `PORT` must be an integer from 1 to 65535.
Port `18091` is the local convention used by the Vite proxy; the deployed API
listens on component port `8080`.

### Start the frontend

In a second terminal, from the repository root:

```sh
npm --prefix web run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://localhost:5173/`. Expect the heading
`Vue and FastAPI are running` and an API card displaying `available` with
`The Vue frontend reached FastAPI on the same origin.`

The browser requests `/api/status` on the frontend origin. Vite proxies `/api`
to `http://127.0.0.1:18091` without removing the prefix. Keep the API running;
if it is unavailable, the status card should show `error`, not a successful
connection. Stop each process with Ctrl+C.

If you change the API port, set `API_PROXY_TARGET` in the frontend terminal
before starting Vite. For example, when the API is listening on port `18092`:

```powershell
$env:API_PROXY_TARGET = "http://127.0.0.1:18092"
npm --prefix web run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

`API_PROXY_TARGET` affects local development and preview only. It is not a
browser environment variable or a required Builder setting.

## Test and build

In PowerShell, from the repository root:

```powershell
Push-Location api
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m pip check
Pop-Location
npm --prefix web run build
$env:PYTHON = (Resolve-Path .\api\.venv\Scripts\python.exe).Path
node --test fullstack.test.mjs
```

On Linux or macOS:

```sh
(cd api && .venv/bin/python -m pytest && .venv/bin/python -m pip check)
npm --prefix web run build
PYTHON="$PWD/api/.venv/bin/python" node --test fullstack.test.mjs
```

The API tests cover health, identity, JSON echo, filtered request metadata,
public runtime markers, and missing routes. The integration checks verify
the manifest, static output, frontend deep links, generated assets, JSON
endpoints, echo requests, and API 404 responses through the same local origin.
The framework identity must exactly match the FastAPI version installed in
the interpreter selected for the API.

Integration tests start loopback-only Uvicorn and Vite preview processes on
available ports, then stop both. They do not require your manually started
servers. `PYTHON` selects the API's Python interpreter; without it the tests
use `python` from `PATH`, which must have the API dependencies installed.
Install both components and build the frontend before running the tests.
GitHub Actions runs the checks on Linux and Windows with Python 3.14 and Node.js 24.
The pinned FastAPI/Starlette dependencies can emit deprecation warnings on
Python 3.14; these are not suppressed or resolved by upgrading this sample's dependencies.

### Preview the production frontend

Keep the API running on port `18091`, then use a second terminal:

```sh
npm --prefix web run build
npm --prefix web run preview -- --host 127.0.0.1 --port 8080 --strictPort
```

Open `http://localhost:8080/`. Vite preview serves the built `web/dist/` files
and proxies `/api` to the local backend. This is a local check, not a production
server to deploy.

With both processes running, optionally check the local or deployed URL using
PowerShell 7:

```powershell
pwsh -NoProfile -File .\scripts\verify.ps1 -BaseUrl http://localhost:8080
```

The script checks HTTP responses and an echo request; it does not execute
Vue. In a browser, also verify the API status card, in-app navigation, direct
navigation to `/products/widget-1`, refreshing that route, and the unknown
route's `Page not found` heading.

## Routes and prefix ownership

| Route | Expected behavior |
|---|---|
| `/` | HTTP 200 shell; Vue renders the landing page and API status card |
| `/products/widget-1` | HTTP 200 shell; Vue Router renders `Widget 1` |
| `/unknown-client-route` | HTTP 200 shell; Vue Router renders `Page not found` |
| `/version.json` | HTTP 200, static frontend identity JSON |
| `GET /api/health` | HTTP 200, API health and identity JSON |
| `GET /api/status` | HTTP 200, API availability, message, and timestamp |
| `GET /api/version` | HTTP 200, API/framework/runtime identity and public markers |
| `GET /api/request` | HTTP 200, selected request metadata |
| `POST /api/echo` | HTTP 200, JSON body returned under `received` |
| `/api/missing` | HTTP 404, JSON API error rather than the SPA shell |

The frontend owns non-API routes. Browser History API deep links require the
static host to return `index.html`; unknown client routes then render a
not-found page with HTTP status 200. The `/api` prefix must take precedence
over that fallback. Verify both behaviors after deployment.

The API code does not implement authentication; Builder's deployed-app
authentication can protect the frontend and API together. Do not send credentials or
private data to the echo endpoint. `/api/request` returns only host,
user-agent, and forwarded-protocol headers, not authorization or cookie headers.

## Sign-in and sign-out

The landing page uses the
[Builder deployed-app authentication contract](https://builder.appservice.azure.com/docs/guides/authentication/#add-sign-in-links),
not an application-owned session. It checks `/.auth/me` without caching and
shows **Log in** for an empty identity array or **Log out** for a signed-in
identity. Failed or invalid responses show an explicit error and retry control;
they are not treated as signed out.

**Log in** opens `/.auth/login/aad`, matching this app's Microsoft Entra sign-in.
**Log out** navigates to `/.auth/logout`, which clears the Builder app session,
then returns through the same login endpoint. Both redirect targets are fixed
local paths, and successful sign-in returns home. This does not sign out the
user's wider Microsoft session: Entra SSO may sign them in again without asking
for a password.

Builder owns these endpoints; FastAPI and Vite do not emulate them. On localhost,
the page explicitly reports local development and does not offer nonfunctional
sign-in controls. On a host without Builder authentication, the status check
reports an error. When Builder requires authentication, visitors must sign in
before the Vue page is served; the app's buttons do not change that policy or
provide an authorization boundary.

## Deployment contract

The repository root contains `builder.yaml`:

```yaml
components:
  - name: web
    rootDirectory: web
    path: /

  - name: api
    rootDirectory: api
    role: web
    platform: python
    path: /api
    run:
      port: 8080
      start: python main.py
      healthCheckPath: /api/health
```

Vite detection supplies the frontend's Node.js build toolchain, production
build, static role, and `dist` output relative to `web/`. Node.js does not run
a frontend development server in the deployment. The API component installs
`api/requirements.txt` and starts Uvicorn through `python main.py`.
Development-only pytest and httpx dependencies are not needed at runtime.

Keep the full `/api` prefix in the backend routes; the application does not
depend on a local-only rewrite. Do not select only `web/` or `api/` as the
repository source root, or publish source files as static output.

## Deploy your fork through Builder Portal

Follow the [Portal quickstart](https://builderapps.azure.com/docs/quickstarts/portal/)
for your authorized Private Preview environment:

1. Commit and push the sample to the `main` branch of your GitHub repository.
   Builder uses committed GitHub source, not local files.
2. Open Builder Portal and select your enabled subscription, existing resource
   group, and supported preview location.
3. Connect GitHub and authorize the Builder GitHub app to access your repository.
   Obtain organization-owner approval if required.
4. Create an app using your repository, branch `main`, and the repository root
   as its source directory. Keep both component folders and `builder.yaml`.
5. Explicitly start deployment and wait for a successful terminal status.
   Connecting a source or pushing a commit is not proof of deployment.
6. Open the returned runtime URL and confirm the API status card reports
   `available`. Check `/version.json`, `/api/health`, and `/api/version`.
7. Open and refresh the frontend product route. Confirm an unknown frontend
   route renders `Page not found`, while `/api/missing` returns HTTP 404 JSON.

### Public API markers and updates

The optional `DEPLOYMENT_MARKER` and `RUNTIME_MARKER` variables are read by
the running API and returned by `/api/version`. `DEPLOYMENT_MARKER` also
appears in `/api/health`. Both default to `local` and are intentionally public.
**Never put credentials, connection strings, or private information in them.**

Configure these values for the API through Portal **Variables**, then deploy
to apply them to the running application. Saving variables alone does not
establish that the active deployment changed. See the
[variables guide](https://builderapps.azure.com/docs/guides/variables/).
The frontend's static version JSON does not read runtime variables.

For code changes, run the tests and production build, commit, and push to your
fork's `main` branch. Explicitly deploy through Builder Portal, wait for
completion, and verify frontend and API together. Automatic deployment on push
is not qualified by this sample.

### Cleanup

Delete only the Builder app you created and wait for deletion to complete.
Do not delete a shared resource group, subscription, or unrelated resources.
Deleting the app does not delete your GitHub repository or local clone.

## Resources and contributions

- [App Service Builder documentation](https://builderapps.azure.com/docs/)
- [Sample catalog](https://builderapps.azure.com/docs/samples/)
- [Manifest guide](https://builderapps.azure.com/docs/guides/builder-yaml/)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](.github/CODE_OF_CONDUCT.md)
- [Security reporting](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [MIT license](LICENSE.md)
