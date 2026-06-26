# AI Resume Parser

Local-first resume parser built with Next.js 15, TypeScript, Ollama, `pdf-parse`, Zod, and ExcelJS.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
copy .env.example .env
```

3. Confirm your Ollama model name in `.env`.

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3.5:9b
```

If your local model is named differently, check with:

```bash
ollama list
```

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Features

- Multi PDF upload with drag and drop
- 10 MB per file validation
- PDF text extraction with `pdf-parse`
- Local Ollama extraction with JSON retry
- Regex fallback for email and phone
- Editable candidate table
- Candidate delete action
- Professionally formatted Excel export

## API

- `POST /api/upload` accepts multipart form data with `files`
- `POST /api/extract` accepts `{ "text": "resume text" }`
- `POST /api/export` accepts `{ "candidates": Candidate[] }` and returns `Candidates.xlsx`

