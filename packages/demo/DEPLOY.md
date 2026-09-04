# Deploying the GenUI demo to Netlify

## Prerequisites

- A [Netlify account](https://app.netlify.com)
- An [Anthropic API key](https://console.anthropic.com/keys)

## One-click deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/sturdynut/gen-ui)

## Manual deploy

### 1. Connect the repo

In the Netlify dashboard → **Add new site → Import an existing project** → connect your GitHub repo.

### 2. Build settings

| Setting | Value |
|---|---|
| Base directory | `packages/demo` |
| Build command | `npm run build` |
| Publish directory | `packages/demo/dist` |
| Functions directory | `packages/demo/netlify/functions` |

### 3. Environment

No server-side environment variables are required. Users provide their own Anthropic API key in the browser — the key is stored in `localStorage` and passed to the Netlify function as an HTTP header.

> **Note:** The key is never logged or stored server-side. For a production deployment with a shared key, set `ANTHROPIC_API_KEY` as a Netlify environment variable and remove the `x-anthropic-key` header check from the function.

### 4. Deploy

Push to your main branch. Netlify builds automatically.

## Local development

```bash
# From repo root
npm install

# In packages/demo
cd packages/demo
npx netlify dev
```

`netlify dev` starts:
- Vite dev server on port 5173
- Netlify Functions on port 9999
- A proxy that routes `/.netlify/functions/*` correctly

Open http://localhost:8888
