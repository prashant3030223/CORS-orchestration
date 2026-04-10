# CORSGuard Orchestration Suite

An enterprise-grade orchestration and security platform for managing Cross-Origin Resource Sharing (CORS) policies across microservices.

## 🚀 Overview

CORSGuard provides a centralized dashboard and dynamic middleware to manage, monitor, and enforce CORS policies in real-time. It consists of three main components:

-   **Frontend**: A premium React-based dashboard for managing policies and viewing security logs.
-   **Backend (CORSGuard Engine)**: The core orchestration engine that manages policies, authentication, and real-time security alerts via Socket.io.
-   **User Data API (Test Service)**: A demonstration microservice showing how the dynamic CORS middleware intercepts and validates cross-origin requests.

## 🛠️ Tech Stack

-   **Frontend**: Vite, React, Tailwind CSS, Framer Motion, Socket.io-client.
-   **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, JWT.
-   **Infrastructure**: Environment-driven configuration, Centralized Policy Management.

## 🏁 Getting Started

### Prerequisites

-   Node.js (v18+)
-   MongoDB (Running locally or on Atlas)

### Installation

Install dependencies for all services from the root directory:

```bash
npm run install-all
```

### Configuration

1.  Copy `.env.example` to `.env` in the `frontend`, `backend`, and `user-data-api` directories.
2.  Update the `MONGODB_URI` and other secrets as needed.
3.  Ensure `MONGODB_URI` points to a valid MongoDB Atlas cluster or local MongoDB instance for backend deployment.

### Development

Run all three services concurrently:

```bash
npm run dev
```

-   **Frontend**: [http://localhost:5173](http://localhost:5173)
-   **Backend**: [http://localhost:5001](http://localhost:5001)
-   **User Data API**: [http://localhost:5002](http://localhost:5002)

## 📦 Deployment

1.  **Frontend**: Build the production bundle:
    ```bash
    npm run build
    ```
2.  **Backend & API**: Deploy the Node.js services to your preferred platform (e.g., Render, Railway, or Docker).
3.  Ensure production environment variables are set correctly for each service.

## 🔒 Security

CORSGuard allows for:
-   **Dynamic Whitelisting**: Allow origins, methods, and headers on the fly.
-   **Blacklisting**: Block malicious origins globally.
-   **Real-time Auditing**: Every CORS block/allow is logged and streamed to the dashboard for immediate visibility.

---
Built with ❤️ for secure web orchestration.
 
