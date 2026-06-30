# AI Business Dashboard & Apex Copilot

An interactive, premium business analytics dashboard and AI-powered copilot built to help businesses track financial metrics, visualize performance, and query insights in real-time.

---

## 🚀 Key Features

- **Financial Analytics & KPI Cards**: Real-time tracking of critical metrics including Revenue, Expenses, Net Profit, Profit Margin, and Investments.
- **Apex AI Copilot**: A context-aware chatbot helper that answers questions about transactions, net profits, expense categories, and offers business recommendations.
- **Dynamic Visualizations**: Beautiful, interactive charts showing Revenue vs. Expenses, category distributions, and investment returns over time.
- **Secure Authentication**: JWT-based user authentication (Signup, Login, Sessions).
- **Transaction Manager**: Create, view, and manage business transactions with category tagging.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 & Vite (Fast HMR & lightweight dev builds)
- **Styling**: Vanilla CSS (Tailored glassmorphism and modern dark-mode aesthetic)
- **Charts**: Recharts (Fully interactive responsive chart packages)

### Backend
- **Framework**: Node.js & Express (Robust REST API surface)
- **Database**: MongoDB & Mongoose (Flexible schema modeling)
- **AI Integration**: OpenAI SDK (For context-guided business analysis)
- **Security**: JWT & Bcryptjs (Secure passwords and token-based state management)

---

## 📁 Repository Structure

```text
├── backend/            # Express REST API, Mongoose models, and AI engine
│   ├── config/         # Database and server configurations
│   ├── middleware/     # Auth checks and route guards
│   ├── models/         # MongoDB schemas (User, Transaction)
│   ├── routes/         # API endpoints (Auth, Transactions, AI Insights, Analytics)
│   ├── server.js       # Main server entrypoint
│   └── .env.example    # Configuration template for backend variables
│
├── frontend/           # Vite + React frontend dashboard SPA
│   ├── src/
│   │   ├── assets/     # Images and logos
│   │   ├── App.jsx     # Main React app & layout components
│   │   └── index.css   # Main stylesheet
│   ├── index.html      # SPA HTML structure
│   └── package.json    # Frontend dependency definitions
│
└── .gitignore          # Root-level Git exclusions
```

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Running locally or a MongoDB Atlas URI)
- [OpenAI API Key](https://platform.openai.com/) (Or a compatible OpenAI API provider key)

---

### Setup Instructions

#### 1. Clone & Configure Backend

Open your terminal and navigate to the `backend` folder:

```bash
cd backend
npm install
```

Create a `.env` file from the example template:

```bash
cp .env.example .env
```

Open the newly created `.env` file and update your configurations:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai-business-dashboard
JWT_SECRET=your_super_secure_jwt_secret
OPENAI_API_KEY=your_openai_api_key_here
```

#### 2. Configure Frontend

Navigate to the `frontend` folder and install dependencies:

```bash
cd ../frontend
npm install
```

---

### Running the Project

#### Run Backend
In the `backend` directory, run:
```bash
npm run dev
```
The server will start on port `5000` (or your configured `PORT`) and connect to MongoDB.

#### Run Frontend
In the `frontend` directory, run:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 📝 License
This project is proprietary.
