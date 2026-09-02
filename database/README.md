# 🗄️ BATTLEVERSE Database Setup Guide

This folder contains database schemas and seed datasets for both **PostgreSQL** and **MySQL / MariaDB**.

---

## 🐘 Option A: PostgreSQL (Supabase / Neon / Local Postgres / RDS)

Use the PostgreSQL files:
1. **Schema**: `database/schema.postgres.sql`
2. **Seed Data**: `database/seed.postgres.sql`

### How to Run:
```bash
# Using psql CLI:
psql -U postgres -d battleverse_db -f database/schema.postgres.sql
psql -U postgres -d battleverse_db -f database/seed.postgres.sql

# Or inside pgAdmin / Supabase SQL Editor / Neon Console:
# Copy & Paste the entire content of schema.postgres.sql, then seed.postgres.sql
```

---

## 🐬 Option B: MySQL / MariaDB (Docker / AWS RDS MySQL / Local)

Use the MySQL files:
1. **Schema**: `database/schema.sql`
2. **Seed Data**: `database/seed.sql`

### How to Run:
```bash
# Using mysql CLI:
mysql -u root -p < database/schema.sql
mysql -u root -p battleverse_db < database/seed.sql

# Or using Docker Compose (automatic on startup):
docker compose up -d mysql
```
