# 🌱 EcoTrek – Smart Waste Management System

EcoTrek is a smart and sustainable waste management solution designed to improve waste segregation, collection, monitoring, and recycling. The platform uses modern web technologies and a local Keras image-classification service to help create cleaner, greener, and more sustainable communities.

## 🚀 Features

* ♻️ Smart waste segregation and classification
* 🗑️ Waste collection and monitoring
* 📍 Waste reporting and tracking
* 📊 Admin dashboard for waste management
* 🌱 Promotes recycling and sustainable practices
* 👥 Encourages citizen participation
* 📈 Data-driven monitoring and management

## 🛠️ Tech Stack

**Frontend**

* React.js
* JavaScript
* HTML5
* CSS3

**Backend**

* Node.js
* Express.js

**ML Service**

* Python
* FastAPI
* TensorFlow / Keras

**Database**

* MongoDB

**Other Technologies**

* REST APIs
* Git & GitHub
* Machine Learning / AI

## 🎯 Objectives

* Improve waste segregation and disposal.
* Reduce waste accumulation and overflowing bins.
* Improve the efficiency of waste collection.
* Encourage recycling and responsible waste disposal.
* Support sustainable and cleaner urban communities.

## 🌍 SDG Alignment

EcoTrek supports **United Nations Sustainable Development Goal 11 (SDG 11) – Sustainable Cities and Communities** by promoting efficient waste management and environmentally responsible urban development.

## 📂 Project Structure

```text
EcoTrek/
├── backend/         # Express API and report/auth logic
├── frontend/        # React/Vite client
├── ml-service/      # FastAPI Keras inference server
├── README.md
└── start-demo.txt
```

> The project structure may change as development progresses.

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/EcoTrek.git
cd EcoTrek
```

### 2. Install dependencies

For the frontend:

```bash
cd frontend
npm install
```

For the backend:

```bash
cd ../backend
npm install
```

For the ML service:

```bash
cd ../ml-service
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the backend directory and add the required configuration:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://127.0.0.1:8000
```

### 4. Run the project

Start the ML service:

```bash
cd ml-service
uvicorn app:app --reload --port 8000
```

Start the backend:

```bash
cd backend
npm start
```

Start the frontend:

```bash
cd frontend
npm run dev
```

### 5. Image classification flow

1. Upload a waste image in the Identify or Reports page.
2. The frontend sends the image to `backend /api/ai/identify`.
3. The Node backend forwards the image to the local FastAPI Keras service.
4. The ML service returns `category`, `confidence`, `guidance`, and `note`.
5. Reports store the predicted label in the report record automatically.

## 🔮 Future Scope

* IoT-enabled smart bins
* AI-based waste classification
* GPS-based waste collection tracking
* Optimized garbage collection routes
* Mobile application
* Reward system for responsible waste disposal
* Advanced analytics and reporting
* Integration with municipal authorities

## 👩‍💻 Project

**EcoTrek**
Smart Waste Management Solution
Developed as a **Minor Project / Smart India Hackathon (SIH) initiative**.

## 📄 License

This project is developed for academic and educational purposes.

