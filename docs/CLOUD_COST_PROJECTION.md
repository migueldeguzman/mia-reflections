# Vesla ERP — Cloud Cost Projection
## 5 Companies × Medium Load (Neon + Render)

**Date:** January 31, 2026  
**Prepared by:** Kevin (Technical Support / QA)  
**For:** Miguel (Team Lead)

---

## Assumptions: "Medium Load" per Company

| Metric | Per Company | × 5 Companies |
|---|---|---|
| Fleet size | 100–300 vehicles | 500–1,500 |
| Active contracts/month | 300–800 | 1,500–4,000 |
| Concurrent users (peak) | 10–25 staff | 50–125 |
| API requests/hour (peak) | 500–2,000 | 2,500–10,000 |
| Traffic fines (TARS)/month | 100–300 | 500–1,500 |
| Invoices/month | 300–800 | 1,500–4,000 |
| Employees (HR) | 30–80 | 150–400 |
| Customers in DB | 1,000–3,000 | 5,000–15,000 |

### Database Size Estimate

Our schema: **275 Prisma models, 628 indexes, ~10K lines**.

Per company after Year 1 of operation:
- Core data (vehicles, contracts, customers, invoices): ~1.5–2 GB
- TARS fines + Salik historical: ~0.5 GB
- HR + payroll + attendance: ~0.3 GB
- Service center + parts: ~0.3 GB
- Indexes overhead (~628 indexes): ~1–2 GB
- **Total per company: ~3–5 GB**
- **5 companies: ~15–25 GB**

---

## Option A: Starter Production (Recommended — Month 1-6)

Best for: First 5 clients onboarding, validating product-market fit.

### Neon — Launch Plan (pay-as-you-go)

| Resource | Calculation | Monthly Cost |
|---|---|---|
| **Compute** | 1 CU (4 GB RAM) avg, autoscale 0.25–2 CU | |
| — Business hours (12h × 22 weekdays) | ~1 CU × 264h = 264 CU-hrs | $27.98 |
| — Off-peak (nights + weekends) | ~0.25 CU × 480h = 120 CU-hrs | $12.72 |
| — Scale-to-zero savings | Idle evenings/weekends auto-suspend | -$0 (built-in) |
| **Compute subtotal** | ~384 CU-hours | **$40.70** |
| **Storage** | 20 GB × $0.35/GB-month | **$7.00** |
| **Network** | <100 GB included free | **$0.00** |
| **Instant Restore (7-day)** | ~5 GB changes × $0.20/GB-month | **$1.00** |
| | | |
| **Neon Total** | | **~$49/mo** |

### Render — Services

| Service | Instance Type | Specs | Monthly Cost |
|---|---|---|---|
| **Backend API** (Node + Express) | Standard | 1 CPU, 2 GB RAM | $25.00 |
| **Frontend** (React + Vite) | Static Site | Unlimited bandwidth | $0.00 |
| **Background Worker** (TARS sync, Speed Sync, crons) | Starter | 0.5 CPU, 512 MB | $7.00 |
| **Render Workspace** | Individual | — | $0.00 |
| | | | |
| **Render Total** | | | **~$32/mo** |

### 📊 Option A Total: ~$81/month

---

## Option B: Growth Production (Recommended — 5 active clients, steady traffic)

Best for: All 5 companies actively using the system daily, concurrent load matters.

### Neon — Launch Plan (pay-as-you-go)

| Resource | Calculation | Monthly Cost |
|---|---|---|
| **Compute** | 2 CU (8 GB RAM) avg, autoscale 0.5–4 CU | |
| — Business hours (14h × 30 days) | ~2 CU × 420h = 840 CU-hrs | $89.04 |
| — Off-peak | ~0.5 CU × 300h = 150 CU-hrs | $15.90 |
| **Compute subtotal** | ~990 CU-hours | **$104.94** |
| **Storage** | 25 GB × $0.35/GB-month | **$8.75** |
| **Network** | <100 GB included | **$0.00** |
| **Instant Restore (7-day)** | ~8 GB changes × $0.20 | **$1.60** |
| | | |
| **Neon Total** | | **~$115/mo** |

### Render — Services

| Service | Instance Type | Specs | Monthly Cost |
|---|---|---|---|
| **Backend API** | Pro | 2 CPU, 4 GB RAM | $85.00 |
| **Frontend** | Static Site | Free | $0.00 |
| **Background Worker** | Standard | 1 CPU, 2 GB RAM | $25.00 |
| **Render Workspace** | Team ($19/seat × 1) | CI previews, team features | $19.00 |
| | | | |
| **Render Total** | | | **~$129/mo** |

### 📊 Option B Total: ~$244/month

---

## Option C: Production-Grade with SLA (If clients demand uptime guarantees)

Best for: Enterprise clients, SLA commitments, compliance requirements.

### Neon — Scale Plan (pay-as-you-go)

| Resource | Calculation | Monthly Cost |
|---|---|---|
| **Compute** | 2 CU avg, autoscale 1–4 CU, always-on | |
| — Always-on (730h/month) | ~2 CU × 730h = 1,460 CU-hrs | $324.12 |
| **Compute subtotal** | ~1,460 CU-hours | **$324.12** |
| **Storage** | 25 GB × $0.35/GB-month | **$8.75** |
| **Network** | 100 GB included, then $0.10/GB | **$0.00** |
| **Instant Restore (30-day)** | ~25 GB × $0.20 | **$5.00** |
| **Read Replica** (reporting queries) | ~0.5 CU × 730h × $0.222 | **$81.03** |
| | | | |
| **Neon Total** | | **~$419/mo** |

### Render — Services

| Service | Instance Type | Specs | Monthly Cost |
|---|---|---|---|
| **Backend API** | Pro (×2 instances) | 2 CPU, 4 GB RAM each | $170.00 |
| **Frontend** | Static Site | Free | $0.00 |
| **Background Worker** | Standard | 1 CPU, 2 GB RAM | $25.00 |
| **Render Workspace** | Team ($19/seat × 3) | Full team access | $57.00 |
| | | | |
| **Render Total** | | | **~$252/mo** |

### 📊 Option C Total: ~$671/month

---

## Summary Comparison

| | Option A (Starter) | Option B (Growth) | Option C (Enterprise) |
|---|---|---|---|
| **Neon (DB)** | $49/mo | $115/mo | $419/mo |
| **Render (Hosting)** | $32/mo | $129/mo | $252/mo |
| **Total/month** | **$81/mo** | **$244/mo** | **$671/mo** |
| **Total/year** | **$972** | **$2,928** | **$8,052** |
| **Per company/month** | **$16.20** | **$48.80** | **$134.20** |
| Best for | Onboarding, MVP | Active daily use | SLA, compliance |
| Concurrent users | ~50 | ~125 | ~125+ (load balanced) |
| DB uptime | Serverless (auto-suspend) | Serverless (auto-suspend) | Always-on + replica |
| API redundancy | Single instance | Single instance | 2 instances + LB |

---

## Cost Drivers to Watch

1. **Neon compute is the #1 variable.** Scale-to-zero saves big. If clients work 8am–10pm, you save ~30% vs always-on.

2. **Storage grows linearly.** At $0.35/GB, even 50 GB is only $17.50. Not a concern for 5 companies.

3. **Render backend instance** is your fixed cost floor. A $25 Standard handles 5 medium clients fine unless you see slow response times — then step up to Pro ($85).

4. **628 indexes** inflate DB size but speed up queries. Worth it for ERP workloads (lots of filtered reads). Monitor actual storage vs data ratio.

5. **Background worker** matters for TARS sync, Speed Sync (Puppeteer), and scheduled jobs. If Puppeteer runs frequently, may need Standard ($25) instead of Starter ($7).

6. **Bandwidth** is unlikely to be a concern. Neon includes 100 GB on paid plans. Render static sites have generous bandwidth.

---

## Recommendation

**Start with Option A (~$81/mo).** Here's why:

- Neon's serverless autoscaling means you only pay for actual query load. 5 medium companies won't saturate 1 CU during most of the day.
- Render Standard ($25) backend handles Node.js + Express + Prisma for this load comfortably — 2 GB RAM is enough for our connection pooling needs.
- Scale-to-zero during quiet hours (late night, weekends) is free money saved.
- **Move to Option B when:** response times degrade, or you're consistently seeing >70% CPU on the Render instance, or Neon compute regularly autoscales above 2 CU.

**Per client cost at Option A: ~$16/month for infrastructure.** Very competitive for a full ERP.

---

## Not Included in This Estimate

- Domain registration & DNS (~$12/year)
- Email service (SendGrid, Resend, etc.)
- File storage (S3/R2 for document uploads)
- Monitoring/APM tools
- SSL certificates (free on both Neon and Render)
- CI/CD pipeline minutes (Render includes free build minutes)
- Third-party API costs (RTA/TARS, payment gateways)

---

*Last updated: January 31, 2026*
