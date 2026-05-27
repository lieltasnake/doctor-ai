# Doctor AI - Backend

This directory contains the Node.js Express server.

## Purpose
- Acts as the central hub connecting the frontend, AI module, and database.
- Handles user authentication (JWT) and authorization.
- Exposes RESTful APIs for the frontend (e.g., `/register`, `/login`, `/analyze-symptoms`, `/history`).
- Validates inputs, handles errors securely, and processes business logic.
