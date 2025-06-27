<h1 align="center">🌍 EcoSphere – Smart Climate Wellness Tracker</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Flask-Python-blue.svg?logo=flask" />
  <img src="https://img.shields.io/badge/MySQL-DB-4479A1?logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Google%20OAuth-Authentication-F4B400?logo=google&logoColor=white" />
</p>

---

### 🧠 Project Definition

> **EcoSphere** is a personal climate wellness tracker that helps users log and analyze their daily carbon footprint, track vitamin D exposure, and visualize sustainability progress through gamified dashboards — powered by real-time AI & data tools.

---

### ✨ Key Features

- 🔸 Daily carbon footprint logging (Transport, Food, Energy)
- 🔸 Real-time CO₂ impact calculations via open emission models
- 🔸 AI-powered vitamin D estimator using UV index & location
- 🔸 Gamified dashboard with progress badges
- 🔸 Google Sign-In authentication
- 🔸 Data visualizations using charts and maps

---

### 🔧 Tech Stack Overview

| Category           | Tools Used                                                                 |
|--------------------|----------------------------------------------------------------------------|
| **Language**       | <img src="https://img.icons8.com/color/48/000000/python--v1.png" height="20"/> Python |
| **Framework**      | <img src="https://img.icons8.com/ios-filled/50/000000/flask.png" height="20"/> Flask |
| **Frontend**       | <img src="https://img.icons8.com/color/48/000000/html-5--v1.png" height="20"/> HTML<br><img src="https://img.icons8.com/color/48/000000/css3.png" height="20"/> CSS<br><img src="https://img.icons8.com/color/48/000000/javascript--v1.png" height="20"/> JavaScript |
| **Database**       | <img src="https://img.icons8.com/fluency/48/000000/mysql-logo.png" height="20"/> MySQL |
| **Authentication** | <img src="https://img.icons8.com/color/48/000000/google-logo.png" height="20"/> Google OAuth 2.0 |
| **AI & Data** | <img src="https://upload.wikimedia.org/wikipedia/commons/e/ed/Pandas_logo.svg" height="20"/> Pandas<br><img src="https://upload.wikimedia.org/wikipedia/commons/3/31/NumPy_logo_2020.svg" height="20"/> NumPy |
| **IDE**            | <img src="https://img.icons8.com/color/48/000000/visual-studio-code-2019.png" height="20"/> VS Code |
| **Version Control**| <img src="https://img.icons8.com/color/48/000000/git.png" height="20"/> Git<br><img src="https://img.icons8.com/ios-glyphs/30/github.png" height="20"/> GitHub |

---

### 📁 Folder Structure (Simplified)

```
ecosphere/
│
├── app/
│   ├── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py
│   │   ├── dashboard_routes.py
│   │   └── tracker_routes.py
│   │
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── scripts.js
│   │
│   ├── templates/
│   │   ├── layout.html
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   └── tracker.html
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── tracker.py
│   │   └── vitamin_d.py
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── emissions.py
│   │   ├── vitamin_d_ai.py
│   │   └── charts.py
│   │
│   └── config.py
│
├── instance/
│   └── config.env        # Secret keys, DB credentials
│
├── requirements.txt
├── run.py                # Entry point
└── README.md

```

---

## 🚀 How to Run (Local Dev)

```
git clone https://github.com/YOUR_USERNAME/ecosphere.git
cd ecosphere
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

---

## 🤝 Contributing

Coming soon. For now, follow our branching strategy below ↓
