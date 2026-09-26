# OpenAI API key setup (SmartRoute)

Your key starts with `sk-proj-...` → **OpenAI**, not Gemini.

## Security rules
- Put the key in **environment / Secrets only**
- **Never** commit `.env` or the real key to GitHub
- **Never** put the key in frontend JS
- `.env` is already in `.gitignore`

## Local setup

1. Copy example env:
```bash
cp .env.example .env
```

2. Edit `.env` and set:
```
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
```

3. Export before starting Flask (or use a secrets manager):
```bash
export OPENAI_API_KEY='sk-proj-YOUR_KEY_HERE'
cd backend && python app.py
```

## Replit / host Secrets
Add secret name: `OPENAI_API_KEY` with your key value.

## Verify
```bash
curl http://127.0.0.1:5000/api/health
```
Health payload includes `openai_configured: true` when the key is loaded.

## Rotate if leaked
If the key was pasted in chat or committed, revoke it in the OpenAI dashboard and create a new one.
