Task Manager Frontend

This is the frontend for the Task Management App.
It is built using React + Vite and connects to the Node.js backend.

How to Run

1. Go to the frontend folder
   cd task-frontend

2. Install dependencies
   npm install

3. Start the development server
   npm run dev

Vite will show a link like:

http://localhost:5173/

Open it in your browser.

Features

Add new tasks

Edit tasks

Delete tasks

Update task status (Pending / In-Progress / Completed)

Filter tasks by status

No page reloads (React state updates UI instantly)

Backend Connection

The frontend calls the backend API at:

http://localhost:3000/api/tasks

Make sure the backend is running before using the UI.

Folder Structure
task-frontend/
│── src/
│ ├── App.jsx
│ ├── App.css
│ └── main.jsx
└── index.html
