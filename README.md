# agentHQtest

A lightweight REST API for managing GitHub Issues, built with Node.js, Express, and the [GitHub REST API](https://docs.github.com/en/rest/issues).

## Features

- **List** issues (filter by state, labels, pagination)
- **Create** a new issue
- **Get** a single issue by number
- **Update** an issue (title, body, state, labels, assignees)
- **Close** an issue

## Prerequisites

- Node.js 18+
- A [GitHub personal access token](https://github.com/settings/tokens) with the `repo` scope

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file and fill in your values
cp .env.example .env
```

Edit `.env`:

```
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repo_name
PORT=3000
```

## Running the server

```bash
npm start
```

The server listens on `http://localhost:3000` by default.

## API Reference

### `GET /health`

Health check endpoint.

```json
{ "status": "ok" }
```

---

### `GET /issues`

List issues in the configured repository.

| Query param | Type   | Default | Description                              |
|-------------|--------|---------|------------------------------------------|
| `state`     | string | `open`  | `open`, `closed`, or `all`               |
| `labels`    | string |         | Comma-separated list of label names      |
| `per_page`  | number | `30`    | Number of results per page (max 100)     |
| `page`      | number | `1`     | Page number                              |

**Example:**
```bash
curl http://localhost:3000/issues?state=open&labels=bug&per_page=10
```

---

### `POST /issues`

Create a new issue.

**Body (JSON):**

| Field       | Type     | Required | Description             |
|-------------|----------|----------|-------------------------|
| `title`     | string   | ✅       | Issue title             |
| `body`      | string   |          | Issue body (Markdown)   |
| `labels`    | string[] |          | Array of label names    |
| `assignees` | string[] |          | Array of GitHub usernames |

**Example:**
```bash
curl -X POST http://localhost:3000/issues \
  -H "Content-Type: application/json" \
  -d '{"title": "Bug: login fails", "body": "Steps to reproduce...", "labels": ["bug"]}'
```

---

### `GET /issues/:number`

Get a single issue by its number.

**Example:**
```bash
curl http://localhost:3000/issues/42
```

---

### `PATCH /issues/:number`

Update an issue.

**Body (JSON) — all fields optional:**

| Field       | Type     | Description                         |
|-------------|----------|-------------------------------------|
| `title`     | string   | New title                           |
| `body`      | string   | New body                            |
| `state`     | string   | `open` or `closed`                  |
| `labels`    | string[] | Replacement list of label names     |
| `assignees` | string[] | Replacement list of GitHub usernames|

**Example:**
```bash
curl -X PATCH http://localhost:3000/issues/42 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "state": "open"}'
```

---

### `POST /issues/:number/close`

Close an issue.

**Example:**
```bash
curl -X POST http://localhost:3000/issues/42/close
```

## Running Tests

```bash
npm test
```

## Project Structure

```
├── server.js              # Entry point — loads env and starts HTTP server
├── src/
│   ├── app.js             # Express app setup and route mounting
│   ├── githubClient.js    # Octokit client factory + repo context helpers
│   └── routes/
│       └── issues.js      # Issue management route handlers
├── tests/
│   └── issues.test.js     # Jest + Supertest unit tests
├── .env.example           # Example environment variables
└── package.json
```
