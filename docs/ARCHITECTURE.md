# VERITYX — System Architecture

## Overview
VERITYX is an enterprise-grade AI-assisted Information Gap Detection, Source Verification, and Opportunity Intelligence Platform. Its mission is captured in the core problem statement: **Digital Dark Spot** — uncovering what users are missing when cross-examining online announcements, government recruitment, scholarships, and academic admissions.

```
       +--------------------------------------------------------------+
       |                  VERITYX Frontend (Vite + React)             |
       |  - React Flow Knowledge Graph   - Decision Readiness Radar   |
       |  - Smart Deadline Guardian      - Living PDF Download Client |
       +-------------------------------+------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
    +------------------------------+       +------------------------------+
    |       Supabase Cloud         |       |      FastAPI Backend         |
    | - Supabase Auth (OAuth/Email)|       | - Google Gemini AI Engine    |
    | - 16 PostgreSQL Tables       |       | - Source Scraper & SSRF Guard|
    | - Row Level Security (RLS)   |       | - ReportLab PDF Generator    |
    | - Real-time Subscriptions    |       | - Hash & Change Detector     |
    +------------------------------+       +------------------------------+
```

## Architectural Components

### 1. Presentation Tier (Frontend)
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, PostCSS, Custom glassmorphism system in deep navy (`#0B0F19`) and charcoal (`#111827`)
- **State & Data Fetching**: TanStack Query (React Query)
- **Visual Graph Visualization**: React Flow (`@xyflow/react`)
- **Icons**: Lucide React
- **Validation**: Zod + React Hook Form

### 2. Application Logic Tier (Backend)
- **Framework**: FastAPI (Asynchronous Python)
- **Security**: JWT Bearer verification, IP-based SSRF filtration against AWS/GCP metadata endpoints and RFC 1918 subnets
- **AI Processing Engine**: Google Gemini API via async HTTP/REST client with structured Pydantic schema validation and robust heuristic extraction fallbacks
- **PDF Generation**: ReportLab Platypus engine with multi-page dynamic table formatting, page counts, and Living Version history
- **Change Detection**: SHA-256 content hashing with date and criteria regex tokenizers

### 3. Persistent Data Tier (Supabase PostgreSQL)
- **Project URL**: `https://cfdzutredjuweiszdias.supabase.co`
- **Security**: Strict Row Level Security (RLS) on all 16 tables
- **User Ownership**: Foreign keys pinned to `auth.users(id)` with automated user profile instantiation triggers

