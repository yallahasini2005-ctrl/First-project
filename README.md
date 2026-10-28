# Blood Donor Directory and Emergency Request System

A beginner-friendly full-stack web application that helps a community list willing blood donors and share urgent blood requests. The app uses HTML, CSS and plain JavaScript in the browser, an Express API on Node.js, and Supabase PostgreSQL for persistent storage.

> **Important medical and privacy note:** This student project is a community coordination tool, not a hospital service. In a medical emergency, contact a hospital or local emergency service directly. Users must verify donor eligibility, blood compatibility, availability, and request details with qualified medical staff. Emergency request contact numbers are visible to signed-in users; use only contact information you have permission to share. Do not add real patient details to a public demo.

## 1. Problem statement

Finding a willing donor quickly can be difficult when requests are spread across messages and personal contacts. This app provides one searchable directory for donors who mark themselves available and a shared board for open emergency requests.

## 2. Objectives and users

- Let a person create an account and log in.
- Let a user create or update their donor profile with blood group, city, contact number, and availability.
- Let signed-in users search available donors by blood group and city.
- Let a user publish an emergency request with hospital, city, required units, contact number, and needed-by time.
- Let users view open, fulfilled, and cancelled requests.
- Let only the owner of a request change its status.

There are two practical user states: a registered community member and a donor who has filled in a donor profile. This MVP does not have a separate administrator dashboard.

## 3. Features included

- Account registration and login with bcrypt password hashing and signed session tokens.
- Donor profile create/update (one profile per account).
- Searchable donor directory; donor phone numbers are not returned in directory results.
- Emergency request creation, listing, and owner-only status updates.
- Server-side validation, rate limiting on authentication routes, security headers, and generic error messages.
- Responsive layout for mobile and desktop.
- Supabase PostgreSQL persistence.

Not included: email/SMS alerts, hospital integration, donor medical screening, geolocation, admin moderation, automated matching, or production-grade account recovery. These are future improvements, not implemented features.

## 4. Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js (LTS) and Express.js
- Supabase PostgreSQL
- npm packages: `@supabase/supabase-js`, `bcryptjs`, `cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `jsonwebtoken`
- Git and GitHub for version control

## 5. Folder structure

```text
blood-donor-directory-and-emergency-request-system/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── donors.js
│   │   └── requests.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── validation.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## 6. Prerequisites

Install these on your computer:

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js LTS](https://nodejs.org/) (npm is included)
- [Git](https://git-scm.com/downloads)
- A free [Supabase](https://supabase.com/) account

Verify Node and npm in a new VS Code terminal:

```bash
node --version
npm --version
git --version
```

Each command should print a version number. If a command is not recognized, install the missing software and restart VS Code.

## 7. Set up Supabase database

1. Sign in to Supabase and create a new project. Save the database password somewhere private; this application uses the project URL and server-side API key, not the database password.
2. Open **SQL Editor** in the Supabase dashboard.
3. Open `database/schema.sql` in VS Code, copy the entire file, paste it into the SQL Editor, and run it.
4. Open **Table Editor** and confirm these tables exist: `app_users`, `donor_profiles`, and `emergency_requests`.
5. In **Project Settings → API** (or the API keys section in the current dashboard), copy the Project URL and the server-side `service_role`/secret key. Keep that key private. Supabase dashboard labels may vary.

The schema enables Row Level Security and does not add public table policies. The Express server uses the privileged key on the server only and checks the signed-in user's identity before operations. Never put this key in `frontend/app.js`, HTML, CSS, GitHub, or screenshots.

## 8. Configure and install the backend

Open the project folder in VS Code. Choose **Terminal → New Terminal**. Run commands from the `backend` folder:

```bash
cd backend
npm install
```

Copy `backend/.env.example` to a new file named `backend/.env` (do not name it `.env.txt`). Open `.env` and replace the example values:

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVER_ONLY_KEY_HERE
JWT_SECRET=PASTE_A_RANDOM_SECRET_HERE
JWT_EXPIRES_IN=8h
```

Create a strong JWT secret from a terminal by running `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` while inside `backend`, then copy the output into `JWT_SECRET`. Do not share it. The Supabase URL must be the URL for your own project; the example URL will not connect.

- `PORT`: local web server port.
- `NODE_ENV`: use `development` while learning; set `production` when deploying.
- `SUPABASE_URL`: your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: privileged key used only by Express.
- `JWT_SECRET`: secret used to sign login tokens; use a long random value.
- `JWT_EXPIRES_IN`: login token lifetime.

`.env.example` is a safe template that belongs in Git. `.env` contains secrets and must remain private; it is ignored by `.gitignore`.

## 9. Run the application

From the `backend` directory:

```bash
npm start
```

Expected terminal message:

```text
Blood Donor System running at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Express serves the `frontend` folder, so do not open `index.html` directly from File Explorer and do not start a separate frontend server.

Check the database connection at [http://localhost:3000/api/health](http://localhost:3000/api/health). A successful response resembles:

```json
{"status":"ok","database":"connected"}
```

If it says the database is unavailable, verify the Supabase URL/key and confirm you ran `database/schema.sql`.

## 10. How to use the app

1. Select **Create account** and register with a name, email, phone number, and strong password.
2. Log in if needed. Your session token is held in `sessionStorage` and cleared when the browser tab session ends or you log out.
3. In **My donor profile**, choose your blood group and city, confirm the contact number, and set your current availability. Save it.
4. In **Find a willing donor**, filter by blood group and/or city. Directory cards intentionally do not expose donor phone numbers.
5. In **Post an emergency request**, enter accurate patient/request information, hospital, city, units, contact phone, and needed-by time. Publish it.
6. View the request in **Urgent blood requests**. The requester can mark their own open request fulfilled or cancel it.
7. Log out when finished, especially on a shared computer.

## 11. Architecture

```text
Browser (HTML/CSS/Vanilla JS)
          | fetch() requests with Bearer token
          v
Node.js + Express REST API
  - validates request data
  - verifies JWT and record ownership
  - uses server-only Supabase key
          |
          v
Supabase PostgreSQL
  app_users -> donor_profiles
  app_users -> emergency_requests
```

Passwords are hashed using bcrypt and are never stored as plain text. The browser receives a signed JWT after login; protected API routes verify it. The JWT contains the user's ID and basic identity. Database access happens through Express. Because the server key bypasses RLS, backend authorization checks are essential. For a production deployment, consider Supabase Auth, stronger account recovery, audit logging, stricter CORS, and a formal privacy review.

## 12. REST API reference

All endpoints use JSON. Protected endpoints require `Authorization: Bearer YOUR_TOKEN`.

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | Check API and database connection | Public |
| POST | `/api/auth/register` | Create account | Public; rate limited |
| POST | `/api/auth/login` | Log in | Public; rate limited |
| GET | `/api/donors/me` | Get signed-in user's donor profile | Signed-in user |
| PUT | `/api/donors/me` | Create/update own donor profile | Signed-in user; own profile only |
| GET | `/api/donors?blood_group=O%2B&city=Hyderabad` | Search available donors | Signed-in user; phone numbers omitted |
| GET | `/api/requests?status=open` | List emergency requests | Signed-in user |
| POST | `/api/requests` | Publish emergency request | Signed-in user |
| PATCH | `/api/requests/:id/status` | Mark own request `fulfilled` or `cancelled` (or reopen as `open`) | Request owner only |

Common responses: `200` successful read/update, `201` created, `400` invalid input, `401` missing/invalid token or login, `409` duplicate email, `404` record not found or not owned, and `500` unexpected server error. Error responses use `{ "error": "message" }`.

## 13. Database relationships

- `app_users.id` is the account primary key; email is unique.
- `donor_profiles.user_id` references `app_users.id` and is unique, so one account has at most one donor profile. Deleting an account cascades to its profile.
- `emergency_requests.requester_id` references `app_users.id`. The backend checks this owner ID before allowing a status change.
- Blood group and status values use database check constraints. Indexes support common directory and request searches.
- Donor profile `updated_at` is refreshed by a PostgreSQL trigger.

## 14. Manual testing checklist

| Test | Action | Expected result |
|---|---|---|
| Database | Open `/api/health` | `database: connected` |
| Register | Submit valid new account | Account created and dashboard appears |
| Duplicate email | Register the same email again | Friendly duplicate-email error |
| Password rules | Register with a weak password | Validation error; account is not created |
| Login | Use correct credentials | Dashboard appears |
| Wrong login | Use wrong password | Generic login error |
| Protected route | Open donor endpoint without token | `401` response |
| Donor profile | Save a valid profile | Profile saved and appears in search when available |
| Donor search | Filter by a real blood group/city | Matching available profiles appear; no phone number displayed |
| Invalid donor | Submit unsupported blood group | Validation error |
| Request | Publish valid request | Request appears in request list |
| Invalid units | Enter 0, 11, or a decimal | Validation error |
| Past deadline | Choose a past date/time | Validation error |
| Request owner | Mark your own open request fulfilled | Status changes |
| Other owner | Attempt to update another account's request via API | `404` or denied response |
| Responsive UI | Resize browser to phone width | Forms and cards stack without horizontal overflow |
| Logout | Click Log out | Private lists are hidden; protected API calls need login |

Test with fictional demo data. Do not use real patient details in screenshots or public demos.

## 15. Troubleshooting

- **`SUPABASE_URL` or key missing:** check that `.env` is inside `backend/`, its name is exactly `.env`, and values have no extra quotes/spaces.
- **`JWT_SECRET must be set`:** generate a random secret using the command in section 8 and paste it into `.env`.
- **Database unavailable / relation missing:** run `database/schema.sql` in the correct Supabase project's SQL Editor.
- **Port already in use:** change `PORT=3001` in `.env` and visit `http://localhost:3001`.
- **`Cannot reach the server`:** make sure `npm start` is still running and browse to the matching local URL.
- **`401` after a long time:** tokens expire; log out and log in again.
- **Changes do not appear:** refresh the page and confirm the form showed a success message. Check the terminal for server errors.
- **`npm` is not recognized:** install Node.js LTS, restart the terminal, and run `node --version` again.

## 16. Git and GitHub upload

1. Create an empty repository on [GitHub](https://github.com/). Do not add a README if you already have this project README locally (or resolve the merge if you do).
2. Open a terminal at the **root project directory**, not inside `backend`.
3. Run:

```bash
git init
git status
git add .
git status
git commit -m "Build blood donor directory project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual repository URL. If Git asks you to identify yourself, configure `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"` with your own details. GitHub may prompt you to authenticate in a browser.

Before `git add .`, check `git status` and verify:

- `backend/.env` is not listed; `.env.example` is listed.
- `node_modules/` is not listed.
- No real patient data, passwords, private database exports, or keys are included.
- The Supabase service-role key is only in your local backend `.env`.

Adding a secret to `.gitignore` does not remove a secret already committed. If you accidentally push a credential, rotate/revoke it immediately and clean the repository history as appropriate.

## 17. Security and limitations

This is a learning MVP, not a production healthcare platform. It uses custom JWT authentication for clarity, and the privileged Supabase key bypasses database RLS; therefore all protected operations must go through this backend. The MVP does not include password reset, email verification, consent records, donor eligibility checks, request moderation, or abuse reporting. Before public deployment, add those controls, enforce HTTPS, configure strict CORS, review privacy laws and retention, and obtain consent for any personal/contact information.

## 18. Future improvements

- Donor opt-in consent and verified contact exchange.
- Email/SMS notifications and request subscriptions.
- Admin moderation and reporting.
- Better location matching and donor distance filters.
- Account verification, password reset, and login audit logs.
- Automated integration tests and deployment pipeline.
