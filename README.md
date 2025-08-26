<h1 align="center">🌍 EcoSphere: A Personal Environmental Health & Impact Tracker</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Flask-Python-blue.svg?logo=flask" />
  <img src="https://img.shields.io/badge/MySQL-DB-4479A1?logo=mysql&logoColor=white" />
</p>

---

### 🧠 Abstract
EcoSphere is an innovative web-based platform designed to help individuals monitor their daily environmental impact while improving personal well-being. The system integrates a carbon footprint tracker, real-time CO₂ estimations, and a unique Vitamin D advisor, making environmental awareness a part of daily life. Built using Python (Flask), MySQL, and modern front-end technologies, EcoSphere offers features such as user authentication, gamified ranking systems, real-time analytics dashboards, and location-based weather insights. 

The project's methodology involved a modular development approach across eight weeks, focusing on user-centered design, clean UI/UX, and backend logic for real-time updates. Key goals included promoting eco-conscious habits, simplifying environmental data interpretation, and integrating wellness guidance via sunlight and UV exposure tracking. The platform is functional, visually engaging, and scalable. It addresses real-world needs for sustainability education through gamification and personalization. Overall, EcoSphere bridges the gap between digital innovation and sustainable living in a way that's interactive, educational, and user-friendly.

---

### ✨ Key Features

1. Daily Carbon Footprint Logging
Users can log their daily activities across three categories: transportation, energy usage, and food habits. Each input contributes to an individual's carbon emission profile.

2. Real-Time CO₂ Impact Calculation
Emission models calculate the user's daily, weekly, and cumulative CO₂ impact instantly. Calculations use publicly available emission factors to approximate environmental footprint.

3. Vitamin D Estimator
Uses the user's location, UV index, and sunlight exposure to estimate daily Vitamin D levels, promoting better health awareness in relation to geography and time of year.

4. Authentication
Users can now create an account using their name, email, and password. Upon successful creation, data is securely stored in the database, and users can log in with those credentials anytime.
To simulate email verification without third-party services, a 6-digit code is generated and shown immediately after registration in a modal. The user must input this code to complete the verification process. This ensures authenticity while remaining cost-free.
Users can also choose the guest login option, which auto-generates a profile such as Guest_748291. This allows quick entry without registration. Guest profiles are temporary and fully deleted on logout, suitable for demo or test usage.

5. Avatar Customization & Profile Editing
Users can choose from 6 predefined eco-themed avatars (via DiceBear) and edit their name. Profile personalization enhances user engagement and identification.

6. Gamified Rank Progress System
o	Ranks from 1 to 10 with progress reset to 0/100 upon each level-up.
o	First 1–2 ranks are unlocked quickly to demonstrate badge visibility.
o	Later ranks grow slower via real activity-based achievements.
o	Custom badges dynamically appear on the avatar when unlocked, with animations.

7. Progress Tracking & Visualization
Dashboard and Progress Page display real-time user stats using visual bars. Progress is broken down into:
o	Eco Habits
o	Energy Efficiency
o	Water Conservation
o	Sustainable Living

8. Interactive Dashboard
Presents weather-based insights (temperature, humidity, UV index) using the user's geolocation. If location access is denied, displays "No Data".

9. Location-Enabled Weather & Vitamin D API Logic
Uses geolocation on login to fetch environmental data. Also includes manually selected country/city options for Vitamin D estimates if user denies geolocation.

10.	Responsive UI with Modal Logic
All forms (login, profile editing, verification) use modal popups for seamless UI/UX. Includes checkbox validation, animations, and clean CSS design.
---

### 🔧 Tech Stack Overview

| Category           | Tools Used                                                                 |
|--------------------|----------------------------------------------------------------------------|
| **Language**       | <img src="https://img.icons8.com/color/48/000000/python--v1.png" height="20"/> Python |
| **Framework**      | <img src="https://img.icons8.com/ios-filled/50/000000/flask.png" height="20"/> Flask |
| **Frontend**       | <img src="https://img.icons8.com/color/48/000000/html-5--v1.png" height="20"/> HTML<br><img src="https://img.icons8.com/color/48/000000/css3.png" height="20"/> CSS<br><img src="https://img.icons8.com/color/48/000000/javascript--v1.png" height="20"/> JavaScript |
| **Database**       | <img src="https://img.icons8.com/fluency/48/000000/mysql-logo.png" height="20"/> MySQL |
| **AI & Data** | <img src="https://upload.wikimedia.org/wikipedia/commons/e/ed/Pandas_logo.svg" height="20"/> Pandas<br><img src="https://upload.wikimedia.org/wikipedia/commons/3/31/NumPy_logo_2020.svg" height="20"/> NumPy |
| **IDE**            | <img src="https://img.icons8.com/color/48/000000/visual-studio-code-2019.png" height="20"/> VS Code |
| **Version Control**| <img src="https://img.icons8.com/color/48/000000/git.png" height="20"/> Git<br><img src="https://img.icons8.com/ios-glyphs/30/github.png" height="20"/> GitHub |

---

## Project Structure

```
ecosphere/
├── .gitignore
├── README.md
├── requirements.txt
├── run.py
├── config.py
├── ecosphere_schema.sql
├── instance/
│ └── default.db
├── app/
│ ├── init.py
│ ├── models.py
│ ├── routes/
│ │ ├── init.py
│ │ ├── auth.py
│ │ ├── carbon.py
│ │ ├── dashboard.py
│ │ ├── main.py
│ │ ├── notes.py
│ │ ├── notifications.py
│ │ └── vitamin.py
│ └── templates/
│ ├── dashboard.html
│ ├── energy.html
│ ├── food.html
│ ├── index.html
│ └── transport.html

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


