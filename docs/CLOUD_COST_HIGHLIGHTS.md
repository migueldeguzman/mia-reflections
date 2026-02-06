# Vesla ERP — Cloud Cost Highlights
**5 Companies | Medium Load | Neon + Render**

---

## What We're Hosting
- **Backend:** Node.js + Express + Prisma (275 models, 628 indexes)
- **Frontend:** React + Vite (static site)
- **Database:** PostgreSQL on Neon (serverless)
- **Workers:** TARS sync, Speed Sync, cron jobs

## Per Company Profile (Medium Load)
- 100–300 vehicles
- 10–25 concurrent staff users
- 300–800 contracts/month
- ~3–5 GB database after Year 1

## Total for 5 Companies: ~15–25 GB database

---

## Monthly Cost Options

### Option A: Starter — $81/mo ($16/company)
- Neon Launch: $49 (1 CU autoscale, scale-to-zero nights/weekends)
- Render Standard backend: $25 (1 CPU, 2 GB)
- Render Starter worker: $7
- Frontend: free (static site)

### Option B: Growth — $244/mo ($49/company)
- Neon Launch: $115 (2 CU autoscale, heavier traffic)
- Render Pro backend: $85 (2 CPU, 4 GB)
- Render Standard worker: $25
- Team workspace: $19

### Option C: Enterprise — $671/mo ($134/company)
- Neon Scale: $419 (always-on + read replica, SOC2/SLA)
- Render Pro ×2 backend: $170 (load balanced)
- Render Standard worker: $25
- Team workspace ×3: $57

---

## Key Takeaways
- **Start at $81/mo** — enough for 5 medium clients onboarding
- **Biggest cost driver:** Neon compute (usage-based, quiet hours = free)
- **Storage is cheap:** $0.35/GB — even 25 GB = $8.75/mo
- **Scale trigger:** upgrade when CPU consistently >70% or response times degrade
- **Not included:** domains, email service, file storage (S3), third-party APIs (RTA/payment gateways)
