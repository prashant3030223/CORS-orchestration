# CORS Orchestration Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React_19-cyan)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)

A centralized, real-time platform for managing Cross-Origin Resource Sharing (CORS) policies dynamically. 

Instead of hardcoding CORS configurations in individual services, this platform allows administrators to manage, monitor, and enforce CORS policies (origins, headers, and specific HTTP verbs) across various APIs and microservices from a single intuitive dashboard.

## 🌟 Key Features

- **Dynamic Policy Management**: Add, update, or remove allowed origins, methods, and headers without restarting your APIs.
- **Fine-Grained Method Control**: Individually enable or disable specific HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`) per origin.
- **Real-Time Synchronization**: Changes made in the dashboard are instantly pushed to connected edge APIs via WebSockets (Socket.io).
- **Interactive Dashboard**: A beautiful, modern UI built with React, Vite, and TailwindCSS, featuring data visualization (Chart.js) and animations (Framer Motion).
- **Secure Authentication**: Role-based access control secured with JWT and bcrypt.

## 🏗️ Project Structure

The repository is structured as a monorepo containing three main components:

- **`/frontend`**: The admin dashboard UI (React, Vite, TailwindCSS, Chart.js).
- **`/backend`**: The core orchestration service and WebSocket server that stores and distributes CORS policies (Node.js, Express, MongoDB, Socket.io).
- **`/user-data-api`**: A sample/target API implementation demonstrating how to consume and enforce the dynamic CORS policies.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Axios.
- **Backend / API Services**: Node.js, Express, Socket.io, JsonWebToken.
- **Database**: MongoDB (Mongoose).
- **Tooling**: ESLint, Nodemon.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/prashant3030223/CORS-orchestration.git
cd CORS-orchestration
```

### 2. Setup the Backend
```bash
cd backend
npm install
```
- Create a `.env` file in the `backend/` directory with your environment variables:
  ```env
  PORT=5000
  MONGODB_URI=your_mongodb_connection_string
  JWT_SECRET=your_secret_key
  ```
- Start the backend server:
  ```bash
  npm run dev
  ```

### 3. Setup the Frontend
```bash
cd ../frontend
npm install
```
- Create a `.env` file in the `frontend/` directory if necessary (e.g., `VITE_API_URL=http://localhost:5000`).
- Start the Vite development server:
  ```bash
  npm run dev
  ```

### 4. Setup the Target API (User Data API)
```bash
cd ../user-data-api
npm install
```
- Configure its `.env` and start it up:
  ```bash
  npm run dev
  ```

## 🔐 Security

This application uses JWT for authentication and securely hashes passwords. The platform itself is designed to lock down security for participating microservices by enforcing strict, configurable CORS headers, preventing unauthorized cross-origin access and mitigating CSRF risks.

## 📄 License

This project is open-source and available under the ISC License.
