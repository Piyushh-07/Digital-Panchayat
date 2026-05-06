# 🏘️ DIGITAL PANCHAYAT

A modern digital governance platform for village administration. 

## 🚀 Quick Setup (Local Machine)

1.  **Extract the ZIP**
2.  **Install Dependencies**
    ```bash
    npm install
    ```
3.  **CRITICAL: Create .env**
    - Create a file named `.env` in the root folder.
    - Copy the contents from `.env.example`.
    - Fill in your `MONGODB_URI` (from MongoDB Atlas) and `GEMINI_API_KEY`.
    - **Note:** The app will not start without a valid `MONGODB_URI`.
4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Go to `http://localhost:3000`.

4.  **Village Names / Panchayats**
    - You can find the list of village names in `public/data/panchayats.json`.
    - To add more villages, edit the `seedPanchayats` array in `server.ts` or add them directly to your MongoDB.

## 🛠️ Troubleshooting

### 1. `EADDRINUSE: address already in use 0.0.0.0:3000`
This means another program (likely a previous run of the server or another app) is using port 3000.

**How to fix:**
- **Option A (Restart VS Code):** Sometimes the easiest way is to close and reopen VS Code.
- **Option B (Kill the process):** 
  - On Windows (PowerShell): `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force`
  - On Linux/Mac: `kill -9 $(lsof -t -i:3000)`
- **Option C (Change the Port):**
  1. Open your `.env` file.
  2. Change `PORT=3000` to `PORT=3001` or `PORT=5000`.
  3. Save the file and run `npm run dev` again.

### 2. `MONGODB_URI is missing` or `injected env (0)`
- **Problem:** The server isn't reading your `.env` file.
- **Fix:**
  - Make sure the file is named exactly `.env` (with a dot).
  - Ensure the file is saved in **UTF-8** encoding. If you created it via PowerShell, it might be in UTF-16 which the server can't read. To fix, open it in VS Code, click "UTF-16" (or whatever encoding is shown) in the bottom right corner, select "Save with Encoding", and choose "UTF-8".

---

## 🌐 Deploying to Render.com

Render is a great platform for hosting this full-stack application.

### 1. Prepare your Repository
- Upload this project to a **GitHub** or **GitLab** repository.

### 2. Create a Web Service on Render
1. Log in to [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.

### 3. Configure Settings
- **Name:** `digital-panchayat`
- **Region:** Choose closest to your users.
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

### 4. Advanced Settings (Crucial)
Click "Advanced" and add the following **Environment Variables**:
- `NODE_ENV`: `production`
- `MONGODB_URI`: (Your MongoDB Atlas connection string)
- `JWT_SECRET`: (A random string for security)
- `GEMINI_API_KEY`: (Your Google AI Studio API key)
- `NODE_VERSION`: `22.6.0` (Ensures native TypeScript support)

### 5. Deployment
Click **Create Web Service**. Render will now build the frontend and start the backend.

---

## 🛠️ Tech Stack
-   **Frontend:** React 19, Vite, Tailwind CSS, Motion (Animations).
-   **Backend:** Node.js, Express.
-   **Database:** MongoDB with Mongoose.
-   **AI:** Google Gemini-1.5-Flash (for Complaint Analysis).
-   **Icons:** Lucide-React.

## 👥 Roles
1.  **Citizen (Gramin):** Can file grievances, track status, and vote on village-wide resolution satisfaction.
2.  **Sachiv (Secretary):** Manages local village queue, assigns workers, and updates status.
3.  **DM (District Magistrate):** District-wide oversight, analytics, and auditing (flagging) capabilities.
