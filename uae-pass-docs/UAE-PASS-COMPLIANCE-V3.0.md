# UAE PASS Compliance V3.0 — Vesla Rent A Car L.L.C

**Agreement:** DDGE_SMS_SPA Version 3.0
**Parties:** Digital Dubai Government Establishment (First Party) ↔ Vesla Rent A Car L.L.C (Service Provider)
**Commencement:** 21 April 2026 — Term: 1 year, auto-renewing
**Governing law:** Emirate of Dubai / Federal laws of UAE / Dubai Courts exclusive jurisdiction
**Liability cap:** AED 300,000 (First Party)
**Fees:** Free-of-charge during Term

**Purpose of this document.** Living compliance matrix mapping every binding obligation in SPA V3.0 + UAE PASS Authentication Integration Toolkit (OAuth DP 2.0) + docs.uaepass.ae guidelines to our codebase, with file:line evidence + gap register. Regenerated before each UAE PASS audit.

**Owner:** Alexandra 🌿 (full stack) — MRM Investments team
**Prior art:** `web-erp-app/docs/UAE-PASS-COMPLIANCE-REPORT.md` (Feb 20 → Mar 30, 2026) — superseded by this doc.

---

## 1. Identity + Contacts (Schedule 2 + 3)

| Role | First Party | Vesla (Service Provider) |
|---|---|---|
| **Main Representative — Technical** | Dr. Erhamah Salem AlSuwaidi · erhamah.alsuwaidi@digitaldubai.ae · +971 52 777 0211 | Mir Ali Asghar · it@veslamotors.com · 055 951 7702 |
| **Main Representative — General** | Mira Sultan Obaid · Mira.Obaid@digitaldubai.ae · 04-5599512 | Mir Ali Asghar (same) |
| **Escalation Level 1** | Dr. Erhamah AlSuwaidi (technical) | Miguelito de Guzman · audit@veslamotors.com · 050 709 2538 · Head of Audit / R&D |
| **Escalation Level 2** | Mira Sultan Obaid | Mohammadreza Shariyar Madani · ceo@veslamotors.com · 052 822 2221 (CEO) |
| **Escalation Level 3 / Final** | Matar AlHumairi · Matar.AlHumairi@digitaldubai.ae · 04-5599996 (CEO, DDGE) | — |
| **Authorized Representative (AR)** for Service Desk | — | **UNASSIGNED** — see gap register |

**Service Desk:** https://support.digitaldubai.ae · 600 56 1111 · 24/7

---

## 2. Features We Integrate

| UAE PASS Service | Our Use | SOP Gate | Files |
|---|---|---|---|
| **Authentication (OAuth2 Auth Code)** | Customer + Staff + ERP login | SOP1 blocked at gateway; SOP2/SOP3 accepted | `backend/src/services/uae-pass.service.ts`, `rent-a-car-mobile/src/services/uaePassService.ts` |
| **Digital Signature (PAdES B-LT)** | Contract signing + VHD signing | SOP2 minimum | `backend/src/services/uae-pass-signing.service.ts` (**stubs on-hold** — `uaepass-sec-003`) |
| **E-Seal (TrustedX PAdES auto-seal)** | Auto-seal customer-signed contracts + VHDs | Server-to-server, no user SOP | `backend/src/services/uae-pass-eseal.service.ts` |
| **KYC auto-fill via UAE PASS profile** | Customer mobile KYC flow | SOP2 minimum | **NEW — card `uap-v3-kyc-mob-001`** |

---

## 3. SPA V3.0 Clause × Code Evidence × Gap

**Status legend:** 🟢 compliant · 🟡 partial (see gap) · 🔴 non-compliant · ⚪ N/A (First-Party obligation)

| Clause | Obligation | Evidence | Status | Gap / Card |
|---|---|---|---|---|
| **4.1** | Integrate UAE PASS per Integration Requirements + Branding Guidelines | Auth service + PAdES pipeline + admin UI | 🟡 | Button = green #00AC75 (deprecated). Migrate to Black per Sch.5 → `uap-v3-brand-erp-001`, `uap-v3-brand-mob-001` |
| **5.2** | First Party is first point of contact for User queries | ⚪ | ⚪ | — |
| **5.3** | Notify First Party within 24h of SP-unrelated User query | No process documented | 🔴 | `uap-v3-ops-escalation-001` — document AR workflow + 24h notice |
| **6.2** | Obtain First Party written approval for marketing materials | No marketing policy on file | 🔴 | `uap-v3-ops-marketing-approval-001` |
| **8.1 (g)** | Adhere to Integration Requirements at all times | OAuth2 code, token, userinfo endpoints wired | 🟢 | `uae-pass.service.ts:getAuthUrl/exchangeCode/getUserInfo` |
| **8.1 (h)** | Comply with data protection/privacy laws | JWT + bcrypt + HTTPS; Render region Singapore | 🟡 | `uap-v3-dp-dpa-001` — data protection register + DPA review |
| **8.1 (j)** | Appropriate security procedures / int. good practice | Sentry + Winston + RBAC + audit_logs | 🟡 | `uap-v3-sec-assessment-001` — schedule security assessment cadence |
| **8.1 (k)** | SP's System free of defects / malicious code | Dependabot + supply-chain-check-mrm | 🟢 | `supply-chain-check-mrm` project |
| **8.1 (l)** | Carry out Security Assessment regularly + IMMEDIATE Security Incident notification | No process for incident notification to First Party | 🔴 | `uap-v3-sec-incident-notif-001` |
| **8.1 (m)** | No improper commissions/gifts | Company policy | ⚪ | Legal/HR scope |
| **8.1 (n)** | Protect goodwill of First Party / UAE PASS | Current marketing = none | 🟡 | Covered by 6.2 card |
| **11.1-11.5** | Information rights / audit — comply with reasonable audit requests, SP bears cost | audit_logs table + retention policy | 🟡 | `uap-v3-ops-audit-readiness-001` — audit export runbook |
| **13.1** | Regulatory requirements — provide additional info within 24h | No process | 🔴 | Same as 5.3 → bundled in `uap-v3-ops-escalation-001` |
| **14.1** | Designate Main Representative | Miguel at escalation L1; no dedicated MR appointed on file | 🟡 | `uap-v3-ops-main-rep-001` — formal appointment + internal comms |
| **15.2** | Use First Party name/logo only per Branding Guidelines + written approval | Buttons currently non-compliant | 🔴 | Covered by brand cards |
| **16** | Confidentiality — need-to-know only, notify of loss immediately | Standard NDA in contracts | 🟡 | `uap-v3-ops-confidentiality-001` — NDA trail + breach notification runbook |
| **18.6-18.8** | On termination: remove all Confidential Info + cease any implied association | No termination runbook | 🟡 | `uap-v3-ops-termination-runbook-001` |
| **19.1-19.3** | Liability — SP bears fault for non-UAE data protection + Security Incidents from SP integration | Insurance + liability-cap acknowledged | ⚪ | Legal scope |
| **20.1** | No assignment without First Party written approval | N/A | ⚪ | — |
| **Sch.4 §2** | Support 24/7 via https://support.digitaldubai.ae + 600 56 1111 | Docs exist but no AR appointed | 🟡 | Covered by AR card |
| **Sch.4 §4** | Appoint AR to raise Non-SP Incidents | UNASSIGNED | 🔴 | `uap-v3-ops-ar-appoint-001` |
| **Sch.5** | Branding Guidelines | Green #00AC75 deprecated style | 🔴 | Brand cards (see §5) |

---

## 4. Integration Toolkit (OAuth2) — Technical Contract

| Item | UAE PASS spec | Our implementation | Status |
|---|---|---|---|
| **Authorize endpoint** (QA) | `https://qa-id.uaepass.ae/trustedx-authserver/oauth/main-as` | `UAE_PASS_BASE_URL` env | 🟢 |
| **Token endpoint** (QA) | `…/oauth/main-as/token` | `uae-pass.service.ts:exchangeCode` | 🟢 |
| **UserInfo endpoint** (QA) | `https://qa-id.uaepass.ae/trustedx-resources/openid/v1/users/me` | `uae-pass.service.ts:getUserInfo` | 🟢 |
| **Logout endpoint** (QA) | `…/digitalid-idp/logout?redirect_uri=…` | `getLogoutUrl()` | 🟢 (`uap-sso-url-*` shipped) |
| **response_type** | `code` (required) | | 🟢 |
| **redirect_uri** | Must match registration | env-driven, per-app-id via `app_clients` table | 🟢 (`uap-appid-*` shipped) |
| **client_id** | UAE PASS-issued | env var | 🟢 |
| **state** (CSRF) | Recommended | `sessionStorage.setItem('uaepass_state', state)` + verify on callback | 🟢 |
| **scope** | `urn:uae:digitalid:profile:general` (min) | `urn:uae:digitalid:profile:general urn:uae:digitalid:profile:profileType urn:uae:digitalid:profile:unifiedId` | 🟢 |
| **acr_values** | `urn:safelayer:tws:policies:authentication:level:low/high` | level:low | 🟢 |
| **ui_locales** | `en` / `ar` | `en` default | 🟢 |
| **Token exchange** | Basic auth (client_id:secret base64) + form-urlencoded | 🟢 | 🟢 |
| **UserInfo auth** | `Bearer {access_token}` | 🟢 | 🟢 |
| **Token validation** | Via UserInfo fetch | Implemented | 🟢 |
| **SSO logout** | Redirect to logout URL | Implemented + tested `uap-sso-logout-001` | 🟢 |
| **Mobile — WebView prohibition** | Use system browser (ASWebAuthenticationSession / Chrome Custom Tabs), not WebView | Implemented (`expo-web-browser`) | 🟢 |
| **Mobile — URI scheme** | Deep-link callback | `veslarentacar://` scheme | 🟢 |
| **User linking — Automatic by UUID** | Recommended | Use `uae_pass_uuid` unique column | 🟢 |
| **SOP1 handling** | Return NO Emirates ID; SP must block if needed | Gateway blocks SOP1 for identity-sensitive actions | 🟢 |
| **Error codes handled** | invalid_request, access_denied, login_required, invalid_scope, invalid_grant | Mapped in `uap-token-002` | 🟢 |

---

## 5. Branding Guidelines (Schedule 5) — BUTTON COMPLIANCE

### 5.1 Permitted button styles

| Style | When | Status |
|---|---|---|
| **White** | On dark/colored backgrounds | 🔴 not implemented |
| **White with Outline** | On white/light backgrounds | 🔴 not implemented |
| **Black** | On white/light backgrounds (NOT dark) | 🔴 not implemented |
| ~~**Green** `#00AC75`~~ | **FORMER / DEPRECATED** | 🔴 currently deployed |

### 5.2 Permitted titles (sentence case, preserve "UAE PASS" exactly)

- ✅ "Sign in with UAE PASS"
- ✅ "Sign up with UAE PASS"
- ✅ "Continue with UAE PASS"
- ✅ "Link with UAE PASS"
- ✅ "Powered by UAE PASS" (badge only)
- ❌ "UAE Pass", "Uae Pass", "UAEPASS" — WRONG capitalization

### 5.3 Dimensions + fonts

| Property | Spec | Current |
|---|---|---|
| Min width | 300px | ✅ full-width buttons meet |
| Min height | 44px | 48px ✅ |
| Padding left/right | 30px | 16px ❌ |
| Padding top/bottom | 10px | 12px ❌ |
| Logo-to-text gap | 5px | 12px ❌ |
| Margin | 1/10 of height | unspecified 🟡 |
| Font EN | SF Pro Text, Semibold, 17pt | Tailwind `font-semibold text-sm` (14pt) ❌ |
| Font AR | GE SS two, Medium, 17pt | Not implemented ❌ |
| Slogan | "A single trusted digital identity for all citizens, residents and visitors" · SF Pro Text medium · 17pt desktop / 12pt mobile · `#78649E` · 10px below button | Not implemented ❌ |

### 5.4 Logo rules

- ✅ Use only logo from official Sketch / asset pack
- ❌ Never crop
- ❌ Never use custom colors on logo
- ❌ Never use logo alone as a button

### 5.5 States required

- ✅ Active
- ✅ Disabled — also gate on `isUaePass*Enabled` toggle
- ❌ Focus state not explicitly styled
- ❌ Pressed state not explicitly styled

### 5.6 Screens with specific rules

| Screen | Rule |
|---|---|
| Sign-in | Title "Sign in to UAE PASS" (for the UAE PASS screen itself), entity logo placement, button + slogan below |
| Sign-up in-portal horizontal/vertical | First option position, proportional size, 10px slogan spacing |
| Sign-up in-mobile | First option, vertically centered, 10px slogan |
| Account Linking | Title "Link your [service] account with UAE PASS", distinct Link-with-UAE-PASS button style |
| Powered by UAE PASS | Badge under company logo on signed documents / e-sealed PDFs |

---

## 6. SOP Level Mapping

| SOP | Verification | UAE PASS userType | Our gate |
|---|---|---|---|
| **SOP1** | Username+password | `SOP1` | **BLOCKED** at gateway for bookings, signing, KYC; customer sees "Not eligible — contact Vesla" |
| **SOP2** | Biometric / Smart Pass | `SOP2` | Login ✅ · Dashboard ✅ · Auto-KYC ✅ · Contract signing ✅ · VHD signing ✅ |
| **SOP3** | PKI / Digital ID | `SOP3` | All SOP2 capabilities + QES-equivalent signatures |

Per SPA Sch.1 §2: signatures carry legal non-repudiation because UAE PASS private key lives in HSM + PIN + biometric.
Per UAE Decree-Law 46/2021 Art.18-20: SOP2 = Advanced Electronic Signature · SOP3 = Qualified Electronic Signature.

---

## 7. Per-Company + Per-Package Feature Toggles (NEW — Scope v3)

All four toggles live on `company_settings`, default `true`, gated by `rent-a-car` package (no package → hidden in admin + customer UI regardless of value).

| Toggle | Type | Default | Gates |
|---|---|---|---|
| `isUaePassLoginEnabled` (exists) | boolean | true | Sign-in button (customer + staff + ERP) |
| `isUaePassContractSigningEnabled` (NEW) | boolean | true | Contract-signing CTA + Speed push to UAE PASS |
| `isUaePassVhdSigningEnabled` (NEW) | boolean | true | VHD-signing CTA (customer + staff mobile) |
| `isUaePassKycEnabled` (NEW) | boolean | true | Explicit KYC auto-fill CTA on customer mobile KYC screen AND passive post-login KYC fill |

**OFF-state UX:** "Coming Soon" button (not hidden, not greyed). Toggling Sign-in OFF preserves `uae_pass_uuid` links — re-enabling restores login.

**Audit logging:** every toggle flip writes to `audit_logs` (entity=`CompanySettings`, action=`UPDATE`, actorId=req.user.id, before/after diff via `pickChangedFields`).

---

## 8. Digital Signature (PAdES B-LT) — Full Pipeline

Per SPA Sch.1 §2 + SPA mockup deck (approved), signing must:

1. Customer signs via UAE PASS mobile app → UAE PASS signs the SHA-256 hash server-side (HSM private key).
2. Our backend embeds signature into PDF as **PAdES B-LT** (basic + long-term validation material).
3. Auto-seal applied immediately after customer signature via TrustedX server-to-server API — `[["digitalid","server","seal"]]` labels.
4. Signed + sealed PDF stored in `electronic_seals` (S3) with 7-year retention (UAE e-Trust Law).

**Current state:** `uae-pass-signing.service.ts` has STUBS (on-hold as `uaepass-sec-003`). E-seal service `uae-pass-eseal.service.ts` is live but not yet wired into the signing path on every completion.

**Gap:** `uap-v3-signing-be-001` (replace stubs), `uap-v3-signing-esealwire-001` (wire auto-seal to signing completion), `uap-v3-signing-retention-001` (verify 7-year retention job).

---

## 9. Data Protection (Clause 8.1.h + 16)

| Data class | Storage | Retention | Protection |
|---|---|---|---|
| UAE PASS profile (uuid, idn, fullname, email, mobile) | `customers` + `users` tables (PG 18) | Life of account + 30d soft delete | TLS + at-rest encryption (Render + AWS) |
| OAuth tokens | NOT stored — fetched on demand | — | — |
| Signed PDFs | S3 `electronic_seals` bucket | 7 years | S3 SSE + versioning |
| Audit logs | `audit_logs` table | Indefinite | RBAC-gated admin view |
| Signing sessions | `uae_pass_signing_sessions` | Per session (expires_at) + completed_at | — |

---

## 10. Security Incident Response (Clause 8.1.l + 16.4)

**Obligation:** Notify First Party **immediately** of any actual or suspected Security Incident or unauthorized disclosure.

**Current state:** No runbook. No on-call rotation for incident notification to DDGE.

**Gap:** `uap-v3-sec-incident-runbook-001` — runbook (detect → classify → notify First Party within <N>h → remediate → report).

---

## 11. SLA (Schedule 4)

| Priority | Resolution target |
|---|---|
| P1 Critical | 1 business day |
| P2 High | 2 business days |
| P3 Medium | 5 business days |
| P4 Minor | 14 business days |

Our obligation: raise Non-SP Incidents via AR through https://support.digitaldubai.ae or 600 56 1111, clear/appropriate EN/AR wording.

---

## 12. Gap Register → Kanban Cards

See kanban epic `uap-v3-compliance` (next section in this doc once created).

Summary of action items grouped by phase:

| Phase | Cards | Scope |
|---|---|---|
| **P1 — Backend toggles + audit** | `uap-v3-schema-be-001`, `uap-v3-toggles-be-001`, `uap-v3-config-api-be-001`, `uap-v3-package-gate-be-001` | Schema migration + admin GET/PUT endpoints + config exposure + package gate |
| **P2 — Admin UI** | `uap-v3-toggles-ui-001`, `uap-v3-settings-page-001` | Extend `UAEPassSettingsPage.tsx` with 3 new toggles + group headings + audit trail viewer |
| **P3 — Branding migration** | `uap-v3-brand-erp-001`, `uap-v3-brand-mob-cus-001`, `uap-v3-brand-mob-stf-001`, `uap-v3-brand-slogan-001`, `uap-v3-brand-fonts-001`, `uap-v3-brand-states-001` | All UAE PASS buttons → Black style + slogan + fonts + states per Sch.5 |
| **P4 — Off-state "Coming Soon" pattern** | `uap-v3-coming-soon-erp-001`, `uap-v3-coming-soon-mob-001`, `uap-v3-coming-soon-hook-001` | Reusable component + hook reads toggle + wire to all UAE PASS surfaces |
| **P5 — KYC auto-fill (NEW feature)** | `uap-v3-kyc-be-001`, `uap-v3-kyc-mob-001`, `uap-v3-kyc-passive-001`, `uap-v3-kyc-faq-001` | Customer endpoint + explicit CTA on KYC screen + gate passive post-login fill + FAQ |
| **P6 — Mockup parity audit** | `uap-v3-parity-auth-erp-001`, `uap-v3-parity-auth-mob-cus-001`, `uap-v3-parity-auth-mob-stf-001`, `uap-v3-parity-sign-erp-001`, `uap-v3-parity-sign-mob-cus-001`, `uap-v3-parity-sign-mob-stf-001` | 12-step Auth × 3 channels + 9-step Signing × 2 channels live OAuth staging probes, file drift cards |
| **P7 — Signing pipeline** | `uap-v3-signing-be-001`, `uap-v3-signing-esealwire-001`, `uap-v3-signing-retention-001` | Replace stubs with real UAE PASS signing API · wire e-seal to completion · verify 7yr retention job |
| **P8 — Operations compliance** | `uap-v3-ops-ar-appoint-001`, `uap-v3-ops-escalation-001`, `uap-v3-ops-marketing-approval-001`, `uap-v3-ops-main-rep-001`, `uap-v3-ops-termination-runbook-001`, `uap-v3-ops-audit-readiness-001`, `uap-v3-ops-confidentiality-001` | SPA V3.0 clause 5-18 process documents |
| **P9 — Security compliance** | `uap-v3-sec-assessment-001`, `uap-v3-sec-incident-runbook-001`, `uap-v3-dp-dpa-001` | Sec assessment cadence · incident notification runbook · data protection register |
| **P10 — Audit-log wiring** | `uap-v3-audit-toggles-001`, `uap-v3-audit-signing-001`, `uap-v3-audit-login-001` | Every UAE PASS event lands in `audit_logs` with full payload diff |
| **P11 — Compliance doc freeze + FAQ** | `uap-v3-doc-final-001`, `uap-v3-faq-final-001` | Update this doc with evidence for every closed card · update `faq-seed-authoritative.ts` |

**Merge strategy per Miguel's protocol:** ONE merge to develop per phase, NOT per card. Tests + production-readiness check before each phase merge.

---

## 13. Version History

| Version | Date | Author | Notes |
|---|---|---|---|
| 3.0 | 2026-04-21 | Alexandra 🌿 | Initial draft against SPA V3.0 (executed same day); supersedes Anders's Feb 20 / Mar 30 compliance report |
| 3.0.1 | 2026-04-21 | Alexandra 🌿 | All 11 phases landed on develop (Phase 2 → Phase 11). See "Phase closure status" below. |
| 3.0.2 | 2026-05-12 | Alexandra 🌿 | `uap-v3-completion-001` — code-deliverable §14 residue closed. Legal-signing CTA migrated to Sch.5 Black (`UAEPassSigningButton`). Arabic typography pass (Known Gap #3) shipped — locale-aware label + GE SS Two font + RTL on `UAEPassButton`/`UAEPassSigningButton`/`UaePassSlogan`. Signed-document retention scanner (Known Gap #4) wired — daily 03:30 Asia/Dubai cron emits `SIGNED_DOCUMENT_RETENTION_REACHED` audit per electronic_seals row aged > 7 yr; idempotent, no destructive action. Web merge `c5255087e`, mobile merge `b095092`. |

---

## 14. Phase closure status (2026-04-21 end-of-day)

| Phase | Status | Merge commits on `develop` |
|---|---|---|
| P1 — Backend toggles + audit | ✅ Landed (prior to this session) | uap-v3-p1 commits pre-dated this freeze |
| P2 — Admin UI (4-toggle consolidation) | ✅ Landed | `fa756fb97` / `3ff30bb7d` — `UAEPassSettingsPage.tsx` + `UAE_PASS_FEATURE_TOGGLE_META` |
| P3 — Branding migration (Schedule 5 Black) | ✅ Landed | ERP: `67dab812a` / `3229a2dd3` · Mobile: `c4965d1`/`d9f028f` (`UaePassButton` + lock tests) |
| P4 — Coming Soon + DTO mirror | ✅ Landed | Mobile: `fc992ca`/`283a345` — `useUaePassFeatureToggles`, `UaePassComingSoonButton`, fixture v2 |
| P5 — KYC auto-fill (V3.0 addition) | ✅ Landed | Mobile: `useUaePassKycAutofill` hook + pure `buildUaePassKycAutofill` + KYC screen wiring |
| P6 — Mockup parity audit | ✅ Written | `uae-pass-docs/UAE-PASS-MOCKUP-PARITY-AUDIT.md` (12-surface matrix + gap register) |
| P7 — PAdES B-LT compliance policy | ✅ Landed (scaffold) | ERP: `37e1c21d9`/`a6f5818b6` — `uae-pass-pades-compliance.ts` + 15-test lock. HTTP dispatch still flagged off pending `stg-sign.uaepass.ae` from UAE PASS team. |
| P8 — Ops compliance docs | ✅ Written | `uae-pass-docs/UAE-PASS-OPS-COMPLIANCE-V3.0.md` (IR, retention, logging, access, change mgmt, vuln, BCP) |
| P9 — Security compliance lock | ✅ Landed | ERP: `68c74ceea`/`161befca0` — 9-test lock on OAuth state / HMAC timing-safe / rate limiting |
| P10 — Audit-log wiring | ✅ Landed | ERP: `backend/feat/uap-v3-p10-audit` merge — 8-test lock on Phase 1 audit plumbing + enum |
| P11 — Compliance doc freeze + FAQ | ✅ This commit | Freezes Section 14 above and adds `docs/UAE-PASS-FAQ-V3.0.md` |

### Known gaps, status as of 2026-05-12 (post `uap-v3-completion-001`)

| # | Description | Status |
|---|-------------|--------|
| 1 | `stg-sign.uaepass.ae` staging URL for PAdES dispatch | **OPEN — external.** Blocked on UAE PASS team provisioning. Phase 7 policy module is ready; HTTP layer swaps in on unblock. |
| 2 | Authorized Representative (AR) for the DDA Service Desk | **OPEN — operational.** Miguel to appoint pre-first-incident (tracked as `uap-v3-ops-ar-appoint-001`). |
| 3 | Arabic-typography pass (SF Pro / GE SS two split) | **CLOSED 2026-05-12** — `uap-v3-completion-001`. Locale-aware label + GE SS Two font stack + RTL `dir` on `UAEPassButton`, `UAEPassSigningButton`, `UaePassSlogan`. Triggers on `i18n.language === 'ar'`. 11/11 lock tests green. |
| 4 | Retention cron job + deletion of S3 PDFs > 7 yr | **CLOSED 2026-05-12** — `uap-v3-completion-001`. `signed-document-retention.job.ts` runs daily 03:30 Asia/Dubai; emits `SIGNED_DOCUMENT_RETENTION_REACHED` audit row per `electronic_seals` row aged > 7 yr; idempotent. Physical S3 deletion remains operator-approved per the standing no-prod-deletes rule (signal, don't auto-purge). 5/5 lock tests green. |
| 5 | Quarterly BCP drill | **OPEN — operational.** First drill scheduled 2026-07-15 (Phase 8 BCP document). |

Code-deliverable scope is now complete; remaining items (#1, #2, #5) are external dependencies (UAE PASS provisioning, governance, operations).

---

*Living document. Regenerate before each UAE PASS audit. File-line evidence must be re-verified — memory that names a specific file:line is a claim about a point in time, not a permanent state.*
