# Rental Collections Management System
## Vesla ERP - Invoice-Receipt Matching & Collection Workflow

---

## Overview

This system mirrors data from SPEED, matches invoices to receipts, and automatically assigns customers to collection stages based on configurable thresholds.

---

## 1. Data Synchronization

### Data Flow

**SPEED** → **ERP Mirror** → **Invoice Matching** → **Collection Queue**

### Sync Types

| Type | When | What |
|------|------|------|
| **Initial Setup** | Day 0 (one-time) | Full historical sync of all customers, invoices, receipts |
| **Daily Updates** | 6:00 AM GST | Delta sync - only new/modified transactions |

### Daily Sync Steps

1. **Fetch Delta** - Get transactions since last sync timestamp
2. **Upsert Records** - Insert new / Update modified records
3. **Match Receipts** - Link receipts to open invoices
4. **Calculate Aging** - Update days overdue for all open items
5. **Assign Stage** - Apply threshold rules, update collection stage

---

## 2. Collection Stages

Customers automatically progress through stages based on days overdue:

### Stage Flow

✅ Current **→** ⚠️ Warning **→** 💰 Forced Collection **→** 📄 Legal Notice **→** ⚖️ Legal Proceedings

### Stage Definitions

| Stage | Days Overdue | Status | Actions |
|-------|--------------|--------|---------|
| ✅ **Current** | 0 | Payment not yet due | No action needed |
| ⚠️ **Warning** | 2+ days | Friendly reminder | Email, SMS, courtesy call |
| 💰 **Forced Collection** | 5+ days | Escalated to collection | Vehicle recovery alert, collection calls, block new rentals |
| 📄 **Legal Notice** | 14+ days | Formal notice issued | Demand letter, 7-day payment deadline |
| ⚖️ **Legal Proceedings** | 21+ days | Legal action | Court case, police report, full documentation |

---

## 3. Threshold Configuration

Rental Admin/Accounts can configure these thresholds per company:

### Days Thresholds (Configurable)

| Setting | Default Value |
|---------|---------------|
| Warning Stage | 2 days |
| Forced Collection | 5 days |
| Legal Notice | 14 days |
| Legal Proceedings | 21 days |

### Amount Thresholds (AED)

| Setting | Default Value | Purpose |
|---------|---------------|---------|
| Minimum attention | 500 AED | Ignore balances below this |
| High priority | 5,000 AED | Prioritize in queue |
| Critical | 15,000 AED | Escalate faster |
| Immediate escalation | 50,000 AED | Skip stages, direct attention |

### Priority Calculation

```
Priority Score = (Days Overdue × Weight) + (Amount × Weight)
```

Higher amounts and longer overdue periods push customers up the queue.

---

## 4. Collection Queue (Output)

The system produces a prioritized list of customers requiring attention:

### Sample Queue

| # | Customer | Contract | Overdue | Days | Stage | Action |
|---|----------|----------|---------|------|-------|--------|
| 1 | Mohammed Al Rashid | RC-2026-0892 | AED 12,500 | 18 | 📄 Legal Notice | Escalate |
| 2 | Sarah Johnson | RC-2026-1024 | AED 8,200 | 9 | 💰 Collection | Call |
| 3 | Ahmed Trading LLC | RC-2026-0756 | AED 45,000 | 6 | 💰 Collection | Priority |
| 4 | Fatima Al Maktoum | RC-2026-1156 | AED 3,800 | 4 | ⚠️ Warning | Remind |
| 5 | Desert Logistics Co. | RC-2026-0934 | AED 2,100 | 3 | ⚠️ Warning | SMS |

### High Value Alerts

When a customer has high overdue amount (e.g., AED 45,000) but low days (e.g., 6 days), the system triggers a **High Value Alert** for priority handling regardless of stage.

---

## 5. System Architecture

### Components

| Step | Component | Description |
|:----:|-----------|-------------|
| 1️⃣ | **SPEED** (Source) | External system - customers, invoices, receipts |
| ⬇️ | | |
| 2️⃣ | **ERP Mirror** (Database) | Local copy of SPEED data, synced daily |
| ⬇️ | | |
| 3️⃣ | **Matching Engine** | Links receipts to invoices, calculates balances |
| ⬇️ | | |
| 4️⃣ | **Threshold Settings** | Configurable days/amounts per company |
| ⬇️ | | |
| 5️⃣ | **Collection Queue** | Prioritized list of customers needing attention |

**Flow:** SPEED → Mirror → Match → Thresholds → Queue

### Database Tables (New)

| Table | Purpose |
|-------|---------|
| `speed_customers` | Mirrored customer data |
| `speed_invoices` | Mirrored invoice data |
| `speed_receipts` | Mirrored receipt data |
| `invoice_receipt_match` | Linking receipts to invoices |
| `collection_settings` | Configurable thresholds per company |
| `collection_queue` | Current prioritized queue |
| `collection_actions` | Action history/audit trail |

---

## 6. User Interface

### Admin Settings Page

Location: **Admin → General Settings → Collection Thresholds**

- Configure days thresholds (Warning, Collection, Legal Notice, Legal Proceedings)
- Configure amount thresholds (Min, High, Critical, Immediate)
- Set priority weights (Days vs Amount)
- Enable/disable auto-actions (auto-SMS, auto-email)

### Collection Dashboard

Location: **Finance → Receivables → Collection Queue**

- View prioritized list of customers
- Filter by stage (Warning, Collection, Legal Notice, Legal)
- Quick actions (Send Reminder, Log Call, Escalate)
- High value alerts
- Sync status & manual sync trigger

---

## 7. Implementation Phases

### Phase 1: Foundation
- [ ] Create mirror database tables
- [ ] Implement SPEED sync (initial + daily)
- [ ] Build invoice-receipt matching engine

### Phase 2: Configuration
- [ ] Create threshold settings UI
- [ ] Implement stage assignment logic
- [ ] Build priority calculation

### Phase 3: Dashboard
- [ ] Create collection queue view
- [ ] Add quick actions
- [ ] Implement high value alerts

### Phase 4: Automation (Optional)
- [ ] Auto-send warning emails
- [ ] Auto-SMS notifications
- [ ] Integration with existing Legal Cases module

---

## Notes

- **Source of Truth**: SPEED remains the source. ERP is read-only mirror.
- **Sync Schedule**: Daily at 6:00 AM GST, with manual "Sync Now" option.
- **Existing Integration**: Connects to current Overdue Receivables and Legal Cases modules.

---

*Document Version: 1.0*  
*Created: January 29, 2026*  
*Author: Mia 🌸*
