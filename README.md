# QALAM

**QR-baBed AI Integrated Library MaAssistant & nagement System**

QALAM is a full-stack library management system developed as a **Final Year Project (FYP)**. It combines QR-based book issuing and returning with AI-powered book recommendations and a library assistant.

## Features

* User and admin authentication
* Library catalogue and book management
* Book availability and borrowing history
* QR-based book issuing and returning
* AI-powered book recommendations
* AI library in-app notifications
* Role-based access control

## Tech Stack

* **Frontend:** React.js, Tailwind CSS, Vite
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL
* **AI Service:** Python, FastAPI, Sentence Transformers
* **Authentication:** JWT
* **QR:** qrcode, html5-qrcode
* **Email:** Nodemailer
* **Deployment:** Docker, Docker Compose

## Project Structure

```text
QALAM/
├── frontend/       # React frontend
├── backend/        # Node.js + Express API
├── ai-service/     # FastAPI AI service
├── docs/           # Project documentation
├── docker-compose.yml
└── README.md
```

## Run QALAM Locally

### Prerequisites

Install the following before running the project:

* Git
* Node.js 18+
* Python 3.10+
* PostgreSQL
* Docker Desktop (optional, for Docker setup)

### 1. Clone the repository

```bash
git clone https://github.com/muskan-akram/QALAM.git
cd QALAM
```

### 2. Configure environment variables

Create the required `.env` files from the provided examples.

```text
frontend/.env.example
backend/.env.example
ai-service/.env.example
```

Copy each example file and rename the copy to `.env`:

```text
frontend/.env
backend/.env
ai-service/.env
```

Update the values in these files according to your local PostgreSQL database and other required configuration.

> The actual `.env` files are not included in the repository for security reasons.

### 3. Install dependencies

**Frontend**

```bash
cd frontend
npm install
cd ..
```

**Backend**

```bash
cd backend
npm install
cd ..
```

**AI Service**

```bash
cd ai-service
pip install -r requirements.txt
cd ..
```

### 4. Start PostgreSQL

Make sure your local PostgreSQL server is running and create the database configured in:

```text
backend/.env
```

Then run the database migration and seed commands:

```bash
cd backend
npm run migrate
npm run seed
```

### 5. Start the services

Open **three terminals** in the QALAM root directory.

**Terminal 1 - Backend**

```bash
cd backend
npm run dev
```

**Terminal 2 - AI Service**

```bash
cd ai-service
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 - Frontend**

```bash
cd frontend
npm run dev
```

### 6. Open QALAM

After all three services are running, open the frontend URL shown by Vite, usually:

```text
http://localhost:5173
```

The services run on:

```text
Frontend:   http://localhost:5173
Backend:    http://localhost:5000
AI Service: http://localhost:8000
```

## Docker Setup

QALAM also includes Docker configuration.

If Docker Desktop is installed and configured:

```bash
docker-compose up --build
```

This starts the required services through Docker Compose.

## Documentation

Additional project documentation is available in the `docs` folder:

* `API.md` - API documentation
* `SCHEMA.sql` - Database schema
* `ERD.md` - Entity Relationship Diagram

## Project

QALAM was developed as a **Final Year Project** for the **BS Computer Science** program at the **University of Education, Vehari Campus**.

**Developed by:** Muskan Akram
