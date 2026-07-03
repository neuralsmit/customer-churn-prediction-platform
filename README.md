# ChurnShield: Customer Churn Prediction Platform

ChurnShield is a professional, full-stack enterprise analytics platform designed to predict customer churn, explain individual risk drivers using SHAP (SHapley Additive exPlanations), manage customer profiles, and export administrative PDF/CSV reports.

Built with a high-end, responsive **Dark Theme (Purple-Cyan Neon accents)**, the platform serves as a modern tool for retention teams and customer success analysts.

---

## Technical Stack Overview

### Frontend (React & TypeScript)
*   **Vite**: Next-generation frontend tooling for rapid compilation.
*   **React Router v6**: Manages private/public routing scopes and navigation states.
*   **Recharts**: Standard React charting library styled for dark mode surfaces.
*   **Lucide React**: Premium icon sets for interface visual indicators.
*   **Custom Vanilla CSS**: Centralized theme variable structure (no bloated CSS frameworks).

### Backend (FastAPI & Machine Learning)
*   **FastAPI**: Highly performant ASGI Python web framework with auto-generated Swagger OpenAPI docs.
*   **Scikit-Learn**: Powering the core machine learning pipeline (`RandomForestClassifier`).
*   **SHAP**: TreeSHAP explainer calculating local feature impacts.
*   **SQLAlchemy ORM**: Connects backend schemas to the database.
*   **JWT Security**: User access control using bcrypt password hashing.
*   **ReportLab**: Generates printable PDF summary reports directly inside memory buffers.

### Database & Operations
*   **PostgreSQL**: Persistent relational storage.
*   **Docker & Docker Compose**: Single-command container orchestration.

---

## Project Folder Structure

```
Customer Churn Prediction Platform/
├── backend/
│   ├── app/
│   │   ├── api/          # Routers (auth, customers, predictions, dashboard)
│   │   ├── core/         # Config, security (JWT), database session
│   │   ├── models/       # SQLAlchemy models (User, Customer, Prediction)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   └── services/     # Prediction service, SHAP explanations, reports
│   ├── ml/
│   │   ├── data/         # Pickled models (.pkl) & generated training data
│   │   └── train.py      # Synthetic data generator & model training script
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Common components (Navbar, Sidebar, PredictionGauge)
│   │   ├── context/      # Authentication context
│   │   ├── pages/        # Login, Dashboard, CustomerList, NewCustomer, BatchUpload, PredictionDetail
│   │   ├── services/     # API fetch wrapper
│   │   ├── styles/       # Centralized theme CSS files
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── nginx.conf        # Single Page App routing configuration
│   ├── vite.config.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Features & Walkthrough

1.  **JWT Authentication**: Secure user credentials validation. The database comes pre-seeded with a default analyst account.
2.  **Analytics Dashboard**: Visual representation of the active portfolio churn risk, contract categories, payment options, and total monthly recurring revenue (MRR).
3.  **Customer Database**: Searchable grid list showing all customers and their current churn status. Includes on-demand calculation actions.
4.  **Manual Prediction Form**: Input custom service metrics for an account. Total charges are calculated automatically based on tenure and monthly rates.
5.  **Explainable AI (SHAP)**: Explains *why* the model predicts churn. Positive drivers (red) highlight risk parameters, and negative drivers (green) display factors driving account loyalty.
6.  **Batch Prediction**: Upload a `.csv` sheet of customers. The platform validates headers, registers records, calculates risk, and plots statistics immediately.
7.  **Analytical PDF Reports**: Download summaries of predictions, metrics, and high-risk listings.

---

## Setup & Running Instructions

The entire platform is configured to run inside a Docker multi-container environment.

### Prerequisites
*   [Docker](https://www.docker.com/products/docker-desktop) installed on your system.

### Running the Platform

1.  Open a terminal inside the project directory:
    ```bash
    cd "d:\ML & AI Project\Customer Churn Prediction Platform"
    ```

2.  Build and run the Docker Compose containers:
    ```bash
    docker-compose up --build
    ```

3.  The backend will automatically:
    *   Wait for PostgreSQL to launch.
    *   Verify if a pre-trained ML model exists (if not, it trains a Random Forest model).
    *   Verify if seed data is present (if empty, it seeds **50 customer records** and creates a default login).

4.  **Access the Platform**:
    *   **Frontend Client**: `http://localhost:3000`
    *   **API Docs (Swagger)**: `http://localhost:8000/docs`

5.  **Pre-seeded Credentials**:
    *   **Username**: `analyst`
    *   **Password**: `password123`
