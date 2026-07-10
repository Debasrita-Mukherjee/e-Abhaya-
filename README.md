# 🛡️ e-Abhaya – AI-Powered Women Safety & Emergency Response Platform

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Database-SQLite-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-orange?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge"/>
</p>

---

## 📌 Overview

**e-Abhaya** is an AI-powered Women Safety and Emergency Response Platform designed to provide rapid assistance during emergencies while simplifying complaint registration and communication with law enforcement.

The platform combines **Artificial Intelligence**, **Emergency Response**, **Digital FIR Management**, and **Location-based Police Station Mapping** into one unified solution, enabling citizens to report incidents quickly and securely.

---

## 🎯 Problem Statement

Women often face difficulties in reporting crimes due to:

* Delayed emergency response
* Lack of awareness about nearby police stations
* Complicated FIR filing process
* Difficulty tracking complaint status
* Limited access to immediate assistance

e-Abhaya aims to solve these challenges through an intelligent digital platform.

---

# ✨ Key Features

### 🚨 Smart SOS Alert System

* One-click emergency alerts
* Generates unique SOS IDs
* Rapid emergency response workflow

### 📝 Digital FIR Registration

* Register complaints online
* Auto-generated FIR IDs
* Secure complaint storage
* Complaint status tracking

### 🤖 AI Assistant

Powered by **Google Gemini AI**

* Provides guidance during emergencies
* Assists users while filing complaints
* Answers safety-related queries
* Offers legal and procedural assistance

### 📍 Smart Police Station Mapping

Automatically determines:

* District
* Police Station
* Station Email

using the user's **Pincode**.

### 📂 Complaint Tracking

Track every complaint through multiple stages:

* Submitted
* Under Review
* FIR Registered
* Investigation Started
* Evidence Verification
* Action Taken
* Resolved
* Closed

### 👮 Police Dashboard

Police officers can

* Login securely
* View assigned complaints
* Update investigation status
* Add remarks
* Manage emergency cases

### 📎 Evidence Management

Supports attachment handling for:

* Images
* Documents
* Evidence records

---

# 🏗️ System Architecture

```
Citizen
     │
     ▼
Frontend (HTML/CSS/JavaScript)
     │
     ▼
Express.js REST API
     │
 ┌───────────────┐
 │               │
 ▼               ▼
SQLite DB    Google Gemini AI
 │
 ▼
Police Dashboard
```

---

# 🛠️ Tech Stack

## Frontend

* HTML5
* CSS3
* JavaScript

## Backend

* Node.js
* Express.js

## Database

* SQLite3

## AI Integration

* Google Gemini API

## Other Packages

* dotenv
* cors

---

# 📂 Project Structure

```
e-Abhaya
│
├── public/
│   ├── index.html
│
├── police_stations/
│
├── database.js
├── server.js
├── package.json
├── .env
├── e-abhaya.db
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/Debasrita-Mukherjee/e-Abhaya-.git
```

Move into the project

```bash
cd e-Abhaya-
```

Install dependencies

```bash
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file.

```env
PORT=3000
GEMINI_API_KEY=YOUR_API_KEY
```

---

# ▶️ Run the Project

```bash
node server.js
```

The server will start at

```
http://localhost:3000
```

---

# 📡 Main Functionalities

## Citizen Portal

* Register Complaint
* Send SOS Alert
* Upload Evidence
* Track FIR Status
* Chat with AI Assistant

---

## Police Portal

* Officer Login
* View Assigned Cases
* Update Complaint Status
* Investigation Timeline
* Remarks Management

---

# 🗃️ Database

The application uses **SQLite**.

Major tables include:

* complaints
* timeline
* sos_alerts

The database initializes automatically when the server starts.

---

# 🔄 Complaint Workflow

```
Complaint Submitted
        │
        ▼
Under Review
        │
        ▼
FIR Registered
        │
        ▼
Investigation Started
        │
        ▼
Evidence Verification
        │
        ▼
Action Taken
        │
        ▼
Resolved
        │
        ▼
Closed
```

---

# 🚀 Future Enhancements

* 📱 Android & iOS Mobile Application
* 📍 Live GPS Tracking
* 📞 Automatic Emergency Calling
* 🔔 Push Notifications
* 🎤 Voice-based Complaint Filing
* 🌐 Multi-language Support
* ☁ Cloud Database Integration
* 🧠 Predictive Crime Analytics
* 📹 Live Video Evidence Upload

---

# 📸 Screenshots

Add screenshots here.

```
screenshots/

Home Page

SOS Page

Complaint Registration

Police Dashboard

AI Chatbot
```

---

# 🤝 Contributors

* Debasrita Mukherjee
* Contributors are welcome through Pull Requests.

---

# 💡 Why e-Abhaya?

✔ AI-assisted emergency support

✔ Digital FIR system

✔ Smart police station allocation

✔ Complaint lifecycle tracking

✔ Secure evidence management

✔ Fast emergency response

---

# 📄 License

This project is released under the **MIT License**.

---

# ⭐ Support the Project

If you found this project useful, consider giving it a ⭐ on GitHub.

Your support motivates us to build more impactful open-source projects.

---

<p align="center">
Made with ❤️ to empower safer communities through technology.
</p>

