# VERITYX — Local Development Setup Guide

## Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Git

## Step 1: Clone and Enter Workspace
```bash
git clone <repository_url>
cd VERITYX
```

## Step 2: Supabase Database Setup
1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/cfdzutredjuweiszdias](https://supabase.com/dashboard/project/cfdzutredjuweiszdias)
2. Open the **SQL Editor**.
3. Copy the entire file `supabase/migrations/20261030000000_initial_schema.sql` and click **Run**.
4. All 16 tables, triggers, and Row Level Security policies are immediately applied.

## Step 3: Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt python-multipart
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be active at: `http://localhost:8000` (Swagger UI at `/docs`).

## Step 4: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend web application will be active at: `http://localhost:5173`.

## Step 5: Running Tests
From the root directory:
```bash
python -m pytest
```
All backend verification tests will execute.

