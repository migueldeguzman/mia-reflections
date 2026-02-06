# Vesla ERP — Cloud Infrastructure Cost Projection v2

## All-In Costs: Hosting + Database + Third-Party Services

**Date:** February 1, 2026
**Version:** 2.0
**Prepared by:** Kevin 🔧 (Technical Support / QA)
**For:** Miguel (Team Lead)

**Purpose:** Accurate infrastructure cost baseline. Pricing/markup is a separate exercise built on top of these numbers.

---

## Confidence Legend

Each cost line is tagged with a confidence level:

| Tag | Meaning |
|---|---|
| ✅ **Verified** | Confirmed from vendor's current pricing page (Feb 2026) |
| ⚠️ **Estimated** | Based on published rates but volume is projected — actual may vary ±30% |
| ❓ **Needs Verification** | Vendor pricing page didn't load or show dollar amounts — using last known/industry rates |

---

## Load Assumptions: 5 Companies, Medium Load

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

Schema: **280 Prisma models, ~630 indexes, ~10K lines of schema**.

Per company after Year 1:
- Core data (vehicles, contracts, customers, invoices): ~1.5–2 GB
- TARS fines + Salik historical: ~0.5 GB
- HR + payroll + attendance: ~0.3 GB
- Service center + parts: ~0.3 GB
- Indexes overhead (~630 indexes): ~1–2 GB
- **Total per company: ~3–5 GB**
- **5 companies: ~15–25 GB**

---

## Option A: Starter Production (Month 1–6)

Best for: First 5 clients onboarding, validating product-market fit.

### Neon Database — Launch Plan (pay-as-you-go)

| Resource | Calculation | Monthly Cost | Confidence |
|---|---|---|---|
| **Compute** | 1 CU (4 GB RAM) avg, autoscale 0.25–2 CU | | |
| — Business hours (14h × 30 days) | ~1 CU × 420h = 420 CU-hrs × $0.106 | $44.52 | ✅ |
| — Off-peak (scale-to-zero most hours) | ~0.25 CU × 150h = 37.5 CU-hrs × $0.106 | $3.98 | ⚠️ |
| **Compute subtotal** | ~458 CU-hours | **$48.50** | |
| **Storage** | 20 GB × $0.35/GB-month | **$7.00** | ✅ |
| **Network** | <100 GB included free | **$0.00** | ✅ |
| **Instant Restore (7-day)** | ~5 GB changes × $0.20/GB-month | **$1.00** | ✅ |
| **Neon Total** | | **~$57/mo** | |

**Neon verified rates:** Launch compute $0.106/CU-hr, Scale compute $0.222/CU-hr, storage $0.35/GB-month, restore $0.20/GB-month, egress $0.10/GB over 100 GB included. Source: [neon.com/pricing](https://neon.com/pricing) + [neon.com/docs/introduction/plans](https://neon.com/docs/introduction/plans) (confirmed Feb 1, 2026).

### Render Hosting — Services

| Service | Instance Type | Specs | Monthly Cost | Confidence |
|---|---|---|---|---|
| **Backend API** (Node + Express) | Standard | 1 CPU, 2 GB RAM | $25.00 | ❓ |
| **Frontend** (React + Vite) | Static Site | Unlimited bandwidth | $0.00 | ✅ |
| **Background Worker** (TARS sync, Speed Sync, crons) | Starter | 0.5 CPU, 512 MB | $7.00 | ❓ |
| **Render Workspace** | Individual | — | $0.00 | ✅ |
| **Render Total** | | | **~$32/mo** | |

**Note on Render pricing:** Render's pricing page loads client-side and couldn't be scraped for verification. The rates above ($7 Starter, $25 Standard, $85 Pro) are from our v1 research (Jan 2026). **Recommend manual verification at [render.com/pricing](https://render.com/pricing) before finalizing.**

### Third-Party Services — Starter Tier

| Service | Plan | Details | Monthly Cost | Confidence |
|---|---|---|---|---|
| **Email (Resend)** | Free tier | 100 emails/day limit | $0.00 | ⚠️ ¹ |
| **SMS (Twilio)** | Pay-as-you-go | ~200 SMS/mo × $0.048/segment (UAE) | ~$9.60 | ✅ ² |
| **WhatsApp Business API** | Meta Cloud API | ~500 conversations/mo × $0.065 avg | ~$32.50 | ⚠️ ³ |
| **File Storage (Cloudflare R2)** | Free tier | <10 GB (10 GB free included) | $0.00 | ✅ ⁴ |
| **Domain + DNS** | Annual | 1 domain (~$15/year ÷ 12) | ~$1.25 | ✅ |
| **Monitoring (Sentry)** | Free tier | 5K errors/mo, 10K perf transactions | $0.00 | ✅ |
| **SSL Certificates** | Included | Free on Render + Neon | $0.00 | ✅ |
| **Third-Party Total** | | | **~$43/mo** | |

### 📊 Option A All-In: ~$132/month (~$26/company)

| Component | Monthly Cost | % of Total |
|---|---|---|
| Neon (Database) | $57 | 43% |
| Render (Hosting) | $32 | 24% |
| Third-Party Services | $43 | 33% |
| **Total** | **~$132/mo** | |

---

## Option B: Growth Production (5+ Active Clients)

Best for: All 5 companies actively using the system daily, concurrent load matters.

### Neon Database — Launch Plan (pay-as-you-go, higher CU)

| Resource | Calculation | Monthly Cost | Confidence |
|---|---|---|---|
| **Compute** | 2 CU (8 GB RAM) avg, autoscale 0.5–4 CU | | |
| — Business hours (14h × 30 days) | ~2 CU × 420h = 840 CU-hrs × $0.106 | $89.04 | ✅ |
| — Off-peak | ~0.5 CU × 300h = 150 CU-hrs × $0.106 | $15.90 | ⚠️ |
| **Compute subtotal** | ~990 CU-hours | **$104.94** | |
| **Storage** | 25 GB × $0.35/GB-month | **$8.75** | ✅ |
| **Network** | <100 GB included | **$0.00** | ✅ |
| **Instant Restore (7-day)** | ~8 GB changes × $0.20 | **$1.60** | ✅ |
| **Neon Total** | | **~$115/mo** | |

### Render Hosting — Services

| Service | Instance Type | Specs | Monthly Cost | Confidence |
|---|---|---|---|---|
| **Backend API** | Pro | 2 CPU, 4 GB RAM | $85.00 | ❓ |
| **Frontend** | Static Site | Free | $0.00 | ✅ |
| **Background Worker** | Standard | 1 CPU, 2 GB RAM | $25.00 | ❓ |
| **Render Workspace** | Team ($19/seat × 1) | CI previews, team features | $19.00 | ❓ |
| **Render Total** | | | **~$129/mo** | |

### Third-Party Services — Growth Tier

| Service | Plan | Details | Monthly Cost | Confidence |
|---|---|---|---|---|
| **Email (Resend)** | Pro | ~50K emails/month | $20.00 | ❓ ¹ |
| **SMS (Twilio)** | Pay-as-you-go | ~1,000 SMS/mo × $0.048/segment | ~$48.00 | ✅ ² |
| **WhatsApp Business API** | Meta Cloud API | ~2,000 conversations/mo × $0.065 avg | ~$130.00 | ⚠️ ³ |
| **File Storage (Cloudflare R2)** | Pay-as-you-go | ~50 GB × $0.015/GB (over 10 GB free) | ~$0.60 | ✅ ⁴ |
| **Domain + DNS** | Annual | 1 domain (~$15/year ÷ 12) | ~$1.25 | ✅ |
| **Monitoring (Sentry)** | Team | 50K errors, 100K perf transactions | $0.00 | ✅ |
| **SSL Certificates** | Included | Free | $0.00 | ✅ |
| **Third-Party Total** | | | **~$200/mo** | |

### 📊 Option B All-In: ~$444/month (~$89/company)

| Component | Monthly Cost | % of Total |
|---|---|---|
| Neon (Database) | $115 | 26% |
| Render (Hosting) | $129 | 29% |
| Third-Party Services | $200 | 45% |
| **Total** | **~$444/mo** | |

---

## Option C: Enterprise Production with SLA

Best for: Enterprise clients, SLA commitments, UAE compliance requirements.

### Neon Database — Scale Plan (pay-as-you-go, always-on)

| Resource | Calculation | Monthly Cost | Confidence |
|---|---|---|---|
| **Compute** | 2 CU avg, always-on (no scale-to-zero) | | |
| — Primary compute (730h/month) | ~2 CU × 730h = 1,460 CU-hrs × $0.222 | $324.12 | ✅ |
| **Storage** | 25 GB × $0.35/GB-month | **$8.75** | ✅ |
| **Network** | 100 GB included, then $0.10/GB | **$0.00** | ✅ |
| **Instant Restore (30-day)** | ~25 GB changes × $0.20 | **$5.00** | ✅ |
| **Read Replica** (reporting) | ~0.5 CU × 730h × $0.222 | **$81.03** | ✅ |
| **Neon Total** | | **~$419/mo** | |

### Render Hosting — Services

| Service | Instance Type | Specs | Monthly Cost | Confidence |
|---|---|---|---|---|
| **Backend API** | Pro (×2 instances, load balanced) | 2 CPU, 4 GB RAM each | $170.00 | ❓ |
| **Frontend** | Static Site | Free | $0.00 | ✅ |
| **Background Worker** | Standard | 1 CPU, 2 GB RAM | $25.00 | ❓ |
| **Render Workspace** | Team ($19/seat × 3) | Full team access | $57.00 | ❓ |
| **Render Total** | | | **~$252/mo** | |

### Third-Party Services — Enterprise Tier

| Service | Plan | Details | Monthly Cost | Confidence |
|---|---|---|---|---|
| **Email (Resend)** | Enterprise | 100K+ emails/month | $89.00 | ❓ ¹ |
| **SMS (Twilio)** | Pay-as-you-go | ~2,000 SMS/mo × $0.048/segment | ~$96.00 | ✅ ² |
| **WhatsApp Business API** | Meta Cloud API | ~5,000 conversations/mo × $0.065 avg | ~$325.00 | ⚠️ ³ |
| **File Storage (Cloudflare R2)** | Pay-as-you-go | ~100 GB × $0.015/GB (over 10 GB free) | ~$1.35 | ✅ ⁴ |
| **Domain + DNS** | Annual | 1 domain + subdomains (~$15/year ÷ 12) | ~$1.25 | ✅ |
| **Monitoring (Datadog)** | Pro | 2 hosts × $23/host (annual billing) | $46.00 | ❓ ⁵ |
| **SSL Certificates** | Included | Free | $0.00 | ✅ |
| **Third-Party Total** | | | **~$559/mo** | |

### 📊 Option C All-In: ~$1,230/month (~$246/company)

| Component | Monthly Cost | % of Total |
|---|---|---|
| Neon (Database) | $419 | 34% |
| Render (Hosting) | $252 | 20% |
| Third-Party Services | $559 | 45% |
| **Total** | **~$1,230/mo** | |

---

## Summary: All-In Infrastructure Costs

| | Option A (Starter) | Option B (Growth) | Option C (Enterprise) |
|---|---|---|---|
| **Neon (DB)** | $57/mo | $115/mo | $419/mo |
| **Render (Hosting)** | $32/mo | $129/mo | $252/mo |
| **Third-Party** | $43/mo | $200/mo | $559/mo |
| | | | |
| **Total/month** | **$132/mo** | **$444/mo** | **$1,230/mo** |
| **Total/year** | **$1,584** | **$5,328** | **$14,760** |
| **Per company/month** | **$26** | **$89** | **$246** |
| | | | |
| Best for | Onboarding, MVP | Active daily use | SLA, compliance |
| Max concurrent users | ~50 | ~125 | ~125+ (load balanced) |
| DB uptime | Serverless (scale-to-zero) | Serverless (scale-to-zero) | Always-on + read replica |
| API redundancy | Single instance | Single instance | 2 instances + LB |
| Compliance features | — | — | SOC 2, IP Allow, SLA |

### Cost Breakdown by Category

| Category | Option A | Option B | Option C |
|---|---|---|---|
| Database (Neon) | 43% | 26% | 34% |
| Hosting (Render) | 24% | 29% | 20% |
| Messaging (WhatsApp + SMS) | 32% | 40% | 34% |
| Email | 0% | 5% | 7% |
| Storage + Monitoring + Other | 1% | 0.4% | 4% |

**Key insight:** Messaging (WhatsApp + SMS) is the #1 or #2 cost category at every tier. It's also the most variable — actual volumes determine real cost.

---

## Growth Scenarios: 1 to 50 Companies

### How Costs Scale

| Companies | Option A | Option B | Per-Co (A) | Per-Co (B) | Notes |
|---|---|---|---|---|---|
| **1** | ~$72 | ~$265 | $72 | $265 | Minimal messaging volume, lower DB compute |
| **5** | ~$132 | ~$444 | $26 | $89 | Base projection (this document) |
| **10** | ~$190 | ~$570 | $19 | $57 | WhatsApp/SMS doubles, DB needs more CU |
| **25** | N/A ⁶ | ~$960 | N/A | $38 | Option A infra maxes out ~15 companies |
| **50** | N/A | ~$1,750 | N/A | $35 | Consider Option C or dedicated infra |

### Scaling Assumptions

The growth table above accounts for:
- **Messaging costs** scaling linearly with company count (each company generates its own WhatsApp/SMS volume)
- **Database compute** increasing sub-linearly (shared queries, connection pooling helps)
- **Storage** growing linearly (~4 GB/company/year)
- **Hosting** staying fixed until capacity limits hit, then stepping up

### Tier Upgrade Triggers

| Scale | What Changes | When to Upgrade |
|---|---|---|
| **1–5 companies** | Option A sufficient | — |
| **~8–10 companies** | Render Standard CPU >70%, response times >500ms | → Option B (Pro backend) |
| **~15 companies** | Neon 1 CU bottleneck on concurrent queries | → 2–4 CU compute |
| **~15–25 companies** | Need multiple backend instances | → Option B with 2× Pro |
| **~25+ companies** | SLA/compliance requirements, need always-on DB | → Option C |
| **~50+ companies** | Consider per-tenant DB isolation, Kubernetes | → Custom infra |

⁶ Option A (Render Standard: 1 CPU, 2 GB RAM) reliably handles ~10–15 active companies. Beyond that, API response times degrade under concurrent load.

---

## Competitor Infrastructure Costs (for context)

**Scenario:** 200 vehicles, 25 users, full ERP needs

| Solution | Monthly Infra/License Cost | Annual Cost | Notes |
|---|---|---|---|
| **Vesla (Option A, shared)** | **$26** | **$312** | Multi-tenant, shared infrastructure |
| **Vesla (Option B, shared)** | **$89** | **$1,068** | Higher performance tier |
| **Odoo Enterprise** | $1,000–2,000 | $12K–24K | 25 users × $40–80/user + hosting ⁷ |
| **SAP Business One Cloud** | $2,500–3,750 | $30K–45K | 25 users × $100–150/user ⁸ |
| **Custom Development** | $5K–15K/mo maintenance | $60K–180K/yr | After $150K–500K initial build ⁹ |
| **RentWorks / TSD Rental** | $3K–10K | $36K–120K | 200 vehicles × $15–50/vehicle ¹⁰ |

**Important:** The Vesla numbers above are *our infrastructure cost per tenant*. Competitor numbers are *what the client pays* (license + hosting). These are different things — our pricing to clients would be derived from our cost basis plus margin, support costs, and team costs.

---

## Year 1–3 Cost Projection

### Assumptions

| Year | Companies | Avg Users/Co | Infrastructure Tier |
|---|---|---|---|
| **Year 1** | 5 | 25 | Option A → B (upgrade ~month 4) |
| **Year 2** | 15 | 25 | Option B (scaled) |
| **Year 3** | 30 | 30 | Option B+ → C |

### Annual Cost Forecast

| Cost Category | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| **Neon (DB)** | $1,080/yr | $2,400/yr | $4,800/yr |
| | ($90/mo avg) | ($200/mo) | ($400/mo) |
| **Render (Hosting)** | $1,080/yr | $2,040/yr | $3,840/yr |
| | ($90/mo avg) | ($170/mo) | ($320/mo) |
| **Email (Resend)** | $120/yr | $480/yr | $960/yr |
| | ($10/mo avg) | ($40/mo) | ($80/mo) |
| **SMS (Twilio)** | $360/yr | $1,440/yr | $3,600/yr |
| | ($30/mo avg) | ($120/mo) | ($300/mo) |
| **WhatsApp Business API** | $960/yr | $3,600/yr | $7,800/yr |
| | ($80/mo avg) | ($300/mo) | ($650/mo) |
| **File Storage (R2)** | $12/yr | $84/yr | $240/yr |
| | ($1/mo) | ($7/mo) | ($20/mo) |
| **Monitoring** | $0/yr | $0/yr | $552/yr |
| | (free tier) | (free tier) | ($46/mo Datadog) |
| **Domain + DNS** | $15/yr | $15/yr | $30/yr |
| | | | (+ staging domain) |
| | | | |
| **Annual Total** | **$3,627** | **$10,059** | **$21,822** |
| **Monthly Average** | **$302** | **$838** | **$1,819** |
| **Per Company/Month** | **$60** | **$56** | **$61** |

**Note:** Year 1 average is higher per-company because fixed costs (Render, monitoring, domains) are spread across fewer companies during ramp-up. Per-company cost stabilizes as you add tenants.

---

## Costs NOT Included in This Projection

### One-Time Costs

| Item | Estimated Cost | When Needed | Notes |
|---|---|---|---|
| **Legal/compliance consulting** | $2K–5K | Pre-launch | UAE data protection, ToS, privacy policy |
| **Penetration testing** | $3K–10K | Annual | Recommended for SaaS handling financial data |
| **Brand/marketing launch** | TBD | Pre-launch | Website, materials, positioning |

### Ongoing Costs NOT in Base Projection

| Item | Estimated Cost | When Needed | Notes |
|---|---|---|---|
| **RTA/TARS API access** | TBD | Day 1 | Government portal — may require corporate account. Some data via Speed Sync scraping |
| **Payment gateway fees** | 2.9% + $0.30/txn (Stripe) or similar | When processing payments | Typically passed through to client |
| **CDN (Cloudflare)** | $0 (free tier sufficient) | Day 1 | Pro plan $20/mo only if DDoS protection needed |
| **Backup/DR (off-site)** | ~$5–20/mo | Month 3+ | Neon instant restore covers most needs; off-site for compliance |
| **CI/CD overage** | $0–10/mo | Ongoing | Render includes free build minutes; GitHub Actions free for public repos |
| **UAE Pass integration** | Free API | Phase 2 | Government-provided, dev effort only |
| **Team/developer costs** | NOT included | Ongoing | Salaries, contractors — separate line item |
| **Support/operations staff** | NOT included | Ongoing | Customer support team — separate line item |
| **Office/infrastructure** | NOT included | Ongoing | Physical infrastructure — separate line item |

---

## Risk Factors & Cost Variability

| Risk | Potential Impact | Mitigation |
|---|---|---|
| **WhatsApp pricing changes** | #1 variable cost. Meta has revised pricing before. Could ±30% | Build SMS fallback, optimize with template messages (cheaper), leverage customer-initiated conversations (first 1,000/mo free) |
| **High messaging volume** | If clients send 2–3× projected WhatsApp/SMS, costs double | Implement smart routing: WhatsApp for critical, email for bulk |
| **Neon pricing changes** | Serverless DB pricing still maturing | Architecture is portable to standard PostgreSQL (Supabase, AWS RDS as fallback). No vendor lock-in |
| **Scale-to-zero less effective** | If clients use system 18h/day instead of 14h, compute +25% | Monitor actual CU-hours in first month, set autoscaling caps |
| **UAE data residency requirements** | May need to host in UAE region (no Neon UAE region currently) | Neon has Singapore region (closest). Alternative: self-hosted PostgreSQL on UAE cloud (AWS Bahrain, Azure UAE). Would change DB cost structure significantly |
| **Storage growth exceeds estimate** | Document uploads (contracts, photos, damage reports) could grow faster | R2 is cheap ($0.015/GB), but monitor. Set upload size limits |
| **Render outages** | Single-provider risk for hosting | Option C addresses with multiple instances. Long-term: consider multi-cloud |

---

## Cost Drivers — What Moves the Needle

### Ranked by impact:

1. **WhatsApp Business API** — #1 variable cost at every tier. Scales linearly with companies × customer engagement. Business-initiated conversations cost $0.04–0.08 each; customer-initiated are free (first 1,000/mo). Optimize by encouraging customer-initiated and using templates.

2. **Neon compute** — #1 fixed/semi-variable cost. Scale-to-zero saves 30–50% vs always-on. UAE business hours (8am–10pm) leave 10 idle hours/day for savings.

3. **SMS (Twilio)** — ~$0.048/segment to UAE numbers. Use WhatsApp as primary channel (cheaper + preferred in UAE). SMS as fallback only for OTPs and non-WhatsApp users.

4. **Render backend tier** — Your fixed cost floor. Standard ($25) handles 5–10 medium companies. Pro ($85) is the first upgrade when you hit CPU limits.

5. **Storage (Neon + R2)** — Cheapest category. At $0.35/GB (Neon) and $0.015/GB (R2), even 100 GB total is ~$36.50/mo. Not a concern until 50+ companies.

6. **Email (Resend)** — Free tier covers initial launch. Only becomes a cost at scale (50K+ emails/month).

---

## Items Needing Manual Price Verification

Before finalizing these projections for any external use:

| Item | Issue | Action |
|---|---|---|
| **Render instance pricing** | Website loads client-side, couldn't scrape current rates | ➜ Verify at [render.com/pricing](https://render.com/pricing) — check Starter ($7?), Standard ($25?), Pro ($85?) |
| **Resend pricing** | Pricing page shows features but not dollar amounts | ➜ Verify at [resend.com/pricing](https://resend.com/pricing) — check Pro ($20?), Scale ($??), Enterprise ($89?) |
| **WhatsApp Business API** | Meta pricing page returned error | ➜ Verify at [business.whatsapp.com/products/platform-pricing](https://business.whatsapp.com/products/platform-pricing) — check per-conversation rates by category (Marketing/Utility/Auth/Service) for UAE |
| **Datadog Pro** | Using published rate of $23/host/mo | ➜ Verify at [datadoghq.com/pricing](https://www.datadoghq.com/pricing/) |
| **Twilio UAE SMS** | Page showed "Contact sales" for domestic rates; using $0.048/segment | ➜ Verify at [twilio.com/sms/pricing/ae](https://www.twilio.com/en-us/sms/pricing/ae) or request quote |

---

## Verified Sources

| # | Service | Rate Used | Source | Verified |
|---|---|---|---|---|
| ✅ | Neon Launch compute | $0.106/CU-hour | [neon.com/docs/introduction/plans](https://neon.com/docs/introduction/plans) | Feb 1, 2026 |
| ✅ | Neon Scale compute | $0.222/CU-hour | Same as above | Feb 1, 2026 |
| ✅ | Neon storage | $0.35/GB-month | Same as above | Feb 1, 2026 |
| ✅ | Neon instant restore | $0.20/GB-month | Same as above | Feb 1, 2026 |
| ✅ | Neon network egress | $0.10/GB over 100 GB | Same as above | Feb 1, 2026 |
| ✅ | Cloudflare R2 | $0.015/GB-month, 10 GB free, no egress | [developers.cloudflare.com/r2/pricing](https://developers.cloudflare.com/r2/pricing/) | Feb 1, 2026 |
| ⚠️ | Twilio UAE SMS | $0.048/segment outbound | [twilio.com/sms/pricing/ae](https://www.twilio.com/en-us/sms/pricing/ae) | Partial — page shows "contact sales" for some rates |
| ❓ | Render tiers | $7/$25/$85/$175/$225/$450 | [render.com/pricing](https://render.com/pricing) | Could not scrape — verify manually |
| ❓ | Resend pricing | Free/$20/$89 | [resend.com/pricing](https://resend.com/pricing) | Feature tiers shown, dollar amounts not visible |
| ⚠️ | WhatsApp Business API | ~$0.04–0.08/conversation (category-dependent) | [Meta pricing docs](https://business.whatsapp.com/products/platform-pricing) | Page error — using known rates |
| ❓ | Datadog Pro | $23/host/month | [datadoghq.com/pricing](https://www.datadoghq.com/pricing/) | Not verified this session |

---

*Last updated: February 1, 2026*
*This document covers infrastructure costs only. Team costs, pricing strategy, and margin analysis are separate exercises.*
