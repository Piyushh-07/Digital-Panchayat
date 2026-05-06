# Digital Panchayat: Platform Documentation

## 1. Overview
Digital Panchayat is a full-stack digital governance platform. It aims to modernize village administration by providing citizens with a direct, AI-monitored channel for filing grievances and tracking infrastructure improvements.

## 2. Core Modules

### A. Citizen Experience
* **Secure Login/Signup:** Localized selection of Panchayat.
* **Grievance Entry:**
  * AI-moderation (Gemini API).
  * Geo-tagging (Map location).
  * Categorization (Water, Power, Waste, etc.).
* **Social Governance:** Upvoting system to let the community decide what matters most.
* **Tracking:** Real-time status updates from officials.

### B. Admin/Official Experience
* **Management Console:** Centralized view of all local complaints.
* **Status Updates:** Workflow to mark issues as 'In Progress' or 'Resolved'.
* **District Oversight:** Global view for higher officials to monitor various Panchayats.

## 3. Technology Stack
* **Vite + React:** For a fast, interactive frontend.
* **Express + Node.js:** Robust backend API.
* **MongoDB (Mongoose):** Production-grade database.
* **Demo Mode:** built-in mock database for instant accessibility.
* **Lucide React:** High-quality consistent iconography.
* **Motion:** Fluid UI animations.

## 4. Current Configuration
* **AI Engine:** Gemini 1.5 Flash.
* **Auth:** JWT (Token-based).
* **Port:** 3000 (standard for deployment).
