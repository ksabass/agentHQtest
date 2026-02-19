# agentHQtest

Full-stack application with a **Python / FastAPI** backend deployed to **AWS ECS Fargate**, a managed **AWS RDS PostgreSQL** database, and a **Flutter** web frontend deployed to **S3 / CloudFront** – all built and deployed through a GitHub Actions pipeline.

---

## Architecture

```
┌──────────────────┐       HTTPS        ┌──────────────────────────┐
│  Flutter Web App  │ ──────────────────▶│  FastAPI (ECS Fargate)   │
│  (S3 + CloudFront)│                    │  port 8000               │
└──────────────────┘                    └────────────┬─────────────┘
                                                     │ SQLAlchemy (asyncpg)
                                                     ▼
                                         ┌──────────────────────────┐
                                         │  AWS RDS PostgreSQL       │
                                         └──────────────────────────┘
```

| Layer      | Technology                           |
|------------|--------------------------------------|
| Frontend   | Flutter (web build)                  |
| Backend    | Python 3.12, FastAPI, SQLAlchemy 2   |
| Database   | AWS RDS PostgreSQL (via asyncpg)     |
| Container  | Docker → Amazon ECR → ECS Fargate   |
| CI/CD      | GitHub Actions                       |
| Hosting    | S3 + CloudFront (frontend), ECS (backend) |

---

## Repository layout

```
.
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── config.py         # Pydantic settings (reads env vars)
│   │   ├── database.py       # Async SQLAlchemy engine & session
│   │   ├── main.py           # FastAPI app + CRUD endpoints
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   └── schemas.py        # Pydantic request / response schemas
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # Flutter application
│   ├── lib/main.dart         # App entry-point + UI
│   ├── web/                  # Flutter web assets
│   ├── test/widget_test.dart
│   └── pubspec.yaml
├── aws/
│   └── task-definition.json  # ECS task-definition template
├── docker-compose.yml        # Local dev (backend + Postgres)
└── .github/workflows/
    └── pipeline.yml          # CI/CD pipeline
```

---

## Local development

### Prerequisites

- Docker & Docker Compose
- Flutter SDK ≥ 3.29 (for frontend only)

### Backend + database

```bash
docker compose up --build
# FastAPI available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
flutter pub get
flutter run -d chrome \
  --dart-define=API_BASE_URL=http://localhost:8000
```

---

## Environment variables

### Backend

| Variable       | Description                                              | Example                                                       |
|----------------|----------------------------------------------------------|---------------------------------------------------------------|
| `DATABASE_URL` | Async SQLAlchemy connection string                       | `postgresql+asyncpg://user:pass@host:5432/db`                 |
| `APP_ENV`      | `development` (verbose SQL logs) or `production`         | `production`                                                  |

Copy `backend/.env.example` → `backend/.env` for local use.

In production the `DATABASE_URL` is injected via **AWS Secrets Manager** (see `aws/task-definition.json`).

### Flutter (build-time)

| Variable        | Description                      |
|-----------------|----------------------------------|
| `API_BASE_URL`  | Base URL of the deployed backend |

Pass with `--dart-define=API_BASE_URL=https://api.example.com`.

---

## CI/CD pipeline

The pipeline (`.github/workflows/pipeline.yml`) runs on every push and pull-request to `main`.

| Job                 | Trigger           | What it does                                                   |
|---------------------|-------------------|----------------------------------------------------------------|
| `backend-build`     | all events        | Builds the Docker image to validate the `Dockerfile`           |
| `backend-deploy`    | push to `main`    | Pushes image to ECR, updates ECS task definition, deploys       |
| `frontend-build`    | all events        | `flutter analyze`, `flutter test`, `flutter build web`         |
| `frontend-deploy`   | push to `main`    | Syncs build artefact to S3, invalidates CloudFront             |

### Required GitHub Actions secrets

| Secret                       | Description                                              |
|------------------------------|----------------------------------------------------------|
| `AWS_ACCESS_KEY_ID`          | IAM user access key                                      |
| `AWS_SECRET_ACCESS_KEY`      | IAM user secret key                                      |
| `AWS_REGION`                 | AWS region (e.g. `us-east-1`)                            |
| `ECR_REPOSITORY`             | ECR repository name                                      |
| `ECS_TASK_DEFINITION`        | ECS task-definition family name (e.g. `backend`)         |
| `ECS_CONTAINER_NAME`         | Container name inside the task definition (e.g. `backend`) |
| `ECS_SERVICE`                | ECS service name                                         |
| `ECS_CLUSTER`                | ECS cluster name                                         |
| `API_BASE_URL`               | Public URL of the deployed backend API                   |
| `S3_BUCKET`                  | S3 bucket name for the Flutter web app                   |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID                               |

---

## AWS infrastructure setup (one-time)

1. **RDS PostgreSQL** – create a PostgreSQL instance in a VPC private subnet.  
   Store the connection string in **Secrets Manager** as `DATABASE_URL`.

2. **ECR** – create a repository for the backend Docker images.

3. **ECS Fargate** – create a cluster, a service, and register the first task definition using `aws/task-definition.json` as a reference. Replace all `ACCOUNT_ID`, `REGION`, and `REPOSITORY` placeholders before the first deploy.

4. **S3 + CloudFront** – create a bucket with static-website hosting, attach a CloudFront distribution, and restrict bucket access to CloudFront only.

5. **IAM** – grant the CI/CD user permissions for ECR push, ECS deploy, S3 sync, and CloudFront invalidation.
