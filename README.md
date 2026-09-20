# QALAM

**QR-based AI Integrated Library Management System**

QALAM is a full-stack library management system developed as a **Final Year Project (FYP)**. It combines QR-based book issuing and returning with AI-powered book recommendations and# Features

* User and admin authentication
* Library catalogue and book management
* Book availability and borrowing history
* QR-based book issuing and returning
* AI-powered book recommendations
* AI library in-aItions
* PostgreSQL database
* Role-based access control

## Tech Stack

* **Frontend:** React.js, Tailwind CSS, Vite
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL
* **AI Service:** Python, FastAPI, Sentence Transformers
* **Authentication:** JWT
* **QR:** qrcode, html5-qrcode
* **Email:** Nodemailer
*  Docker Compose

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

## Running the Project

### Using Docker

```bash
docker-compose up --build
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### AI Service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

Create `.env` files using the provided `.env.example` files.

The actual `.env` files are not included in the repository for security reasons.

## Project

**QALAM** was developed as a Final Year Project for the **BS Computer Science** program at the **University of Education, Vehari Campus**.

**Developed by:** Muskan Akram