# INDUSTRY BRANDING & CONTEXT
## Master Reference for Projects 13 (CRM) & 14 (ERP)

**Last Updated:** April 2, 2026
**Scope:** 10 fictional companies across 10 industries
**Status:** Complete reference document for both CRM and ERP platform implementations

---

## TABLE OF CONTENTS
1. [Overview & Architecture](#overview--architecture)
2. [Core Naming Conventions](#core-naming-conventions)
3. [Default User Accounts](#default-user-accounts)
4. [Company Profiles & Branding](#company-profiles--branding)
5. [Industry-Specific Terminology](#industry-specific-terminology)
6. [CRM Board Configurations](#crm-board-configurations)
7. [ERP Module Adaptations](#erp-module-adaptations)
8. [Demo Data Specifications](#demo-data-specifications)
9. [Cross-Platform Data Relationships](#cross-platform-data-relationships)
10. [Theme Application Guidelines](#theme-application-guidelines)

---

## OVERVIEW & ARCHITECTURE

This document defines the complete branding, organizational structure, and industry context for 10 fictional companies deployed across two integrated platforms:
- **Project 13 (CRM Platform):** Monday.com-style board-based interface with industry-specific workflow boards
- **Project 14 (ERP Platform):** Odoo-style modular system with industry-specific adaptations

The 5 original industries (NovaPay, MedVista, TrustGuard, UrbanNest, SwiftRoute) maintain data consistency with Project 05 (Portfolio Data Platform) where applicable, with optional future API synchronization points.

### Design Principles
- **Industry Authenticity:** Each company reflects real-world operations, terminology, and workflows
- **Cross-Platform Consistency:** Branding, user accounts, and role hierarchies remain consistent across CRM and ERP
- **Modular Configuration:** Each company's ERP module adaptations allow flexible deployment (not all modules required for each company)
- **Demo Data Realism:** Sample data includes realistic volumes, relationships, and statuses reflecting each industry

---

## CORE NAMING CONVENTIONS

### Workspace/Company Identifiers

**CRM Instance Format:**
```
{company-name}.crm.localhost
Example: novapay.crm.localhost
```

**ERP Instance Format:**
```
{company-name}.erp.localhost
Example: novapay.erp.localhost
```

### User Email Format
```
{role}@{company-domain}.com
Example: ceo@novapay.com, manager@medvista.com
```

### Demo Workspace Names
All instances use lowercase company name as workspace name within platform.

---

## DEFAULT USER ACCOUNTS

Every company instance includes these 5 baseline user accounts plus industry-specific roles. All demo passwords are `demo123` for development/testing.

### Universal User Set (ALL COMPANIES)

| Username | Email | Password | Role | Permissions | Board Access |
|----------|-------|----------|------|-------------|--------------|
| admin | admin@{company}.com | demo123 | System Administrator | Full system access, user management, settings | All boards |
| ceo | ceo@{company}.com | demo123 | CEO/Owner | Executive dashboards, all boards (read/write), reports, settings | All boards |
| manager | manager@{company}.com | demo123 | Department Manager | Department-specific boards, team management, approvals | Department boards |
| user | user@{company}.com | demo123 | Regular Employee | Assigned board tasks, personal tasks, team collaboration | Assigned boards |
| viewer | viewer@{company}.com | demo123 | Read-only Guest | View access only, no modifications | Read-only on all |

### Additional Industry-Specific Roles
Defined per company in Company Profiles section. These users should be created during instance setup with appropriate board assignments.

---

## COMPANY PROFILES & BRANDING

---

### 1. NOVAPAY — FINTECH
**Workspace URL:** novapay.crm.localhost | novapay.erp.localhost
**Industry:** Digital Payment Processing & FinTech

#### Brand Identity
- **Primary Color:** #2563EB (Electric Blue) — represents digital transactions, energy, forward momentum
- **Secondary Color:** #1E40AF (Dark Blue) — security, trust, stability
- **Accent Color:** #60A5FA (Light Blue) — highlights, success states, confirmations
- **Logo Concept:** Stylized "N" with payment wave flowing through center
- **Tagline:** "Moving Money Forward"

#### Company Story
NovaPay is a fast-growing digital payment processor serving 500+ merchants across the United States and Latin America. Founded in 2018, the company processes credit card, ACH, and digital wallet transactions for a diverse merchant base ranging from small e-commerce shops to mid-size retail chains. NovaPay differentiates through competitive payment processing rates, rapid settlement times (24-48 hours), and enterprise-grade security compliance (PCI-DSS Level 1).

**Key Operations:**
- Transaction volume: ~5M transactions/month
- Merchant retention: 94%
- Geographic coverage: US (50 states) + Latin America (6 countries)
- Revenue model: Per-transaction percentage + monthly gateway fees
- Settlement frequency: Daily batching, next-business-day fund delivery

#### Organizational Structure
- **C-Suite:** CEO, CFO, CRO (Chief Risk Officer)
- **Management:** VP Sales, VP Compliance, VP Engineering, VP Operations
- **Department Leads:** Account Managers (8), Risk Analysts (5), Compliance Officers (3), Support Team (12)
- **Total Headcount:** 45-50

#### CRM Boards
1. **Transaction Pipeline** — Real-time transaction monitoring, dispute tracking, reconciliation
2. **Merchant Onboarding** — New merchant signup workflow, KYC verification, contract management
3. **Compliance Tracker** — Regulatory filings, audit status, violation alerts, remediation tracking
4. **Risk Dashboard** — Fraud detection, chargeback monitoring, risk scoring by merchant
5. **Settlement Board** — Daily settlement batches, fund disbursement status, reserve tracking

#### Key Workflows
- Merchant application → KYC verification → risk assessment → contract signing → API key generation
- Transaction received → validation → fraud scoring → settlement batch → fund delivery
- Monthly compliance checks → regulatory updates → audit preparation → board reporting

#### Demo Data Volume
- **Merchants:** 75 active accounts across industries (e-commerce: 32, retail: 18, SaaS: 15, food service: 10)
- **Transactions:** 200 sample transactions (successful: 180, declined: 12, disputed: 8)
- **Compliance Cases:** 15 ongoing and historical (KYC updates: 8, AML reviews: 4, fraud investigations: 3)
- **Settlement Batches:** 3 recent batches with fund distributions
- **Risk Events:** 25 sample chargeback/fraud cases for analysis

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **Gateway Fee** | Monthly fee for transaction processing access | Pricing on merchant record |
| **Settlement** | Batch processing of authorized transactions for fund disbursement | Settlement Board status |
| **Chargeback** | Merchant customer disputes transaction, funds returned | Risk Dashboard tracking |
| **KYC** | Know Your Customer — identity & business verification | Onboarding Board checklist |
| **PCI-DSS** | Payment Card Industry Data Security Standard — compliance requirement | Compliance Tracker status |
| **Acquiring Bank** | Financial institution processing transactions on behalf of gateway | Partner reference on merchant |
| **Interchange** | Fee charged by card issuer; split between processor & acquiring bank | Transaction details view |
| **Fraud Score** | Risk algorithm output (0-100 scale); triggers transaction decline | Transaction detail card |
| **Merchant Category Code** | MCC — industry classification for transaction processing | Merchant profile field |
| **AML** | Anti-Money Laundering compliance reviews and screening | Compliance Tracker activity |

---

### 2. MEDVISTA — HEALTHCARE
**Workspace URL:** medvista.crm.localhost | medvista.erp.localhost
**Industry:** Multi-Specialty Medical Group

#### Brand Identity
- **Primary Color:** #059669 (Emerald Green) — health, care, growth, healing
- **Secondary Color:** #047857 (Dark Green) — stability, trust in medical care
- **Accent Color:** #34D399 (Light Green) — positive outcomes, wellness, success
- **Logo Concept:** Stylized "M" with health cross integrated into letterform
- **Tagline:** "Compassionate Care, Connected Technology"

#### Company Story
MedVista is a multi-specialty medical group operating 12 clinics across metropolitan areas, employing 80 board-certified physicians and serving 50,000+ active patients. Founded in 2012, MedVista specializes in primary care (4,000 active patients), cardiology (3,500 patients), orthopedic surgery (2,800 patients), and pediatrics (2,200 patients). All operations are fully HIPAA-compliant with electronic health records (EHR) integration across all locations. The organization emphasizes patient outcomes and evidence-based medicine.

**Key Operations:**
- Patient volume: 50,000+ active records
- Appointment capacity: 300+ appointments/week across all clinics
- Specialties: Primary Care, Cardiology, Orthopedics, Pediatrics, General Surgery
- Average patient tenure: 7.2 years
- Insurance network participation: 45+ plans

#### Organizational Structure
- **C-Suite:** CEO, Chief Medical Officer (CMO), CFO
- **Management:** Clinic Directors (12), Department Chiefs (4 by specialty), Compliance Officer
- **Clinical Staff:** Physicians (80), Nurses (120), Medical Assistants (60), Administrative staff (45)
- **Total Headcount:** 305

#### CRM Boards
1. **Patient Pipeline** — New patient intake, referrals, pre-registration, appointment scheduling
2. **Appointment Scheduler** — Real-time availability, patient confirmations, reminder tracking, no-show management
3. **Insurance Claims** — Claims submission, EOB tracking, appeals, payment reconciliation
4. **Medical Records Tracker** — Chart requests, record transfers, imaging/lab result routing
5. **Referral Board** — Incoming specialist referrals, outgoing patient referrals, specialist communication

#### Key Workflows
- New patient inquiry → pre-registration → insurance verification → appointment scheduling → check-in → clinical encounter → billing
- Patient lab order → testing completion → results review → patient notification → follow-up care plan
- Insurance claim submission → claim tracking → payment receipt → posting to patient account

#### Demo Data Volume
- **Patients:** 100 sample patient records (active: 85, inactive: 15)
- **Appointments:** 60 scheduled appointments across specialties (30 completed, 20 upcoming, 10 historical)
- **Insurance Claims:** 40 claims in various stages (submitted: 15, approved: 18, denied: 5, pending: 2)
- **Providers:** 12 sample provider profiles with credential information
- **Referrals:** 20 incoming and outgoing specialist referrals

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **EHR** | Electronic Health Record — patient's complete medical history system | Patient record integration |
| **EOB** | Explanation of Benefits — insurance documentation of claim payment | Claims Board status detail |
| **Referral** | Specialist recommendation by primary care physician | Referral Board entry |
| **Prior Auth** | Prior Authorization — insurance pre-approval for procedure/specialty visit | Insurance Claims notes |
| **Copay/Coinsurance** | Patient out-of-pocket payment responsibility | Appointment checklist item |
| **CPT Code** | Current Procedural Terminology — medical procedure classification | Claims Board procedure detail |
| **ICD Code** | Diagnosis classification code for medical conditions | Patient record diagnosis field |
| **No-Show** | Patient fails to arrive for scheduled appointment | Appointment Board status |
| **Chart Review** | Physician review of patient medical record before visit | Appointment Board pre-visit task |
| **Credentialing** | Verification of physician license, malpractice history, insurance network participation | Provider Board status |

---

### 3. TRUSTGUARD — INSURANCE
**Workspace URL:** trustguard.crm.localhost | trustguard.erp.localhost
**Industry:** Property & Casualty Insurance

#### Brand Identity
- **Primary Color:** #1E3A5F (Corporate Navy) — trust, security, authority, protection
- **Secondary Color:** #0F2744 (Dark Navy) — stability, dependability
- **Accent Color:** #60A5FA (Light Blue) — clarity, transparency, confidence
- **Logo Concept:** Shield with checkmark in center, representing protection and verification
- **Tagline:** "Protecting What Matters"

#### Company Story
TrustGuard is a mid-size Property & Casualty (P&C) insurance carrier founded in 2005, offering auto, home, commercial, and specialty insurance lines. The company serves 200,000 policyholders with 15,000 active claims under management. TrustGuard is licensed to operate in 30 states and maintains an A- rating from major rating agencies. The organization emphasizes rapid claims processing, local agent relationships, and competitive pricing.

**Key Operations:**
- Premium volume: $240M annual written premium
- Claims volume: 15,000 active claims under management
- Loss ratio: 65% (industry average: 70%)
- Agent network: 150+ independent agents across 30 states
- Policy retention: 88%

#### Organizational Structure
- **C-Suite:** CEO, CFO, Chief Actuary, Chief Claims Officer
- **Management:** VP Underwriting, VP Claims, VP Agency Relations, Regional Managers (5), Compliance Officer
- **Operations:** Underwriters (20), Claims Adjusters (40), Agents (150+), Administrative staff (35)
- **Total Headcount:** 290

#### CRM Boards
1. **Claims Pipeline** — New claims intake, assignments, adjuster workflow, settlement tracking
2. **Policy Management** — Active policies, renewals, cancellations, coverage changes
3. **Underwriting Queue** — New policy applications, risk assessment, quote generation, approval status
4. **Compliance Tracker** — Regulatory filings, state licensing, audit status, complaint management
5. **Renewals Board** — Policy expiration dates, renewal letters sent, customer outreach, retention tracking

#### Key Workflows
- Policy application → underwriting review → risk assessment → quote approval → policy issuance → renewal reminder (annually)
- Loss event → claim registration → initial contact → adjuster assignment → investigation → evaluation → settlement → closure
- Claims appeal → review by senior adjuster → policy language verification → decision → payment or denial

#### Demo Data Volume
- **Policies:** 80 active policy records (auto: 35, home: 25, commercial: 15, specialty: 5)
- **Claims:** 50 claims across various stages (open: 20, under investigation: 15, awaiting settlement: 10, closed: 5)
- **Prospects:** 30 new business leads in underwriting queue
- **Agents:** 10 sample agent profiles with performance metrics
- **Compliance Cases:** 8 regulatory or complaint-related items

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **Loss Ratio** | Claims paid divided by premiums received; lower is better | Dashboard KPI |
| **Underwriting** | Process of assessing insurance risk and determining rates | Underwriting Queue board |
| **Deductible** | Amount policyholder pays before insurance coverage kicks in | Policy detail field |
| **Claims Adjuster** | Insurance professional assigned to investigate and evaluate claims | Claims Pipeline assignment |
| **Liability Coverage** | Insurance protection against legal responsibility for injuries/damages | Policy coverage detail |
| **Premium** | Regular payment for insurance coverage | Policy record amount field |
| **Endorsement** | Policy modification during active period | Policy Management action |
| **Coverage Limit** | Maximum amount insurer will pay for a covered loss | Policy detail field |
| **Retention Rate** | Percentage of policies renewed annually | Dashboard metric |
| **Agent Commission** | Percentage of premium paid to insurance agent for sale | Agent record compensation field |

---

### 4. URBANNEST — REAL ESTATE
**Workspace URL:** urbannest.crm.localhost | urbannest.erp.localhost
**Industry:** Residential Real Estate Brokerage

#### Brand Identity
- **Primary Color:** #D97706 (Amber) — warmth, home, approachability, golden opportunity
- **Secondary Color:** #B45309 (Dark Amber) — stability, foundation, trust
- **Accent Color:** #FBBF24 (Gold) — premium positioning, value, achievement
- **Logo Concept:** Stylized house with "U" integrated as the doorway, suggesting entry into home ownership
- **Tagline:** "Home Is Here"

#### Company Story
UrbanNest is a residential real estate brokerage headquartered in Miami with 45 licensed agents operating across 3 office locations. Founded in 2014, the company specializes in residential sales, buyer representation, rental management, and property management services. UrbanNest maintains 500+ active listings with an average sales cycle of 35 days. The organization emphasizes personalized customer service, cutting-edge marketing, and strong community connections across the Miami metropolitan area.

**Key Operations:**
- Active listings: 500+
- Agent count: 45 across 3 offices
- Average sales price: $425,000
- Average days on market: 35 days
- Rental portfolio: 150+ rental properties under management
- Market share: 12% of Miami metro residential transactions

#### Organizational Structure
- **C-Suite:** CEO, COO, CFO
- **Management:** Broker (3 offices), Office Managers (3), Transaction Coordinators (4), Marketing Manager, Administrative staff (8)
- **Agents:** 45 licensed real estate agents
- **Total Headcount:** 73

#### CRM Boards
1. **Property Listings** — MLS integration, listing details, showings history, photos, market analysis
2. **Lead Pipeline** — Buyer prospects, seller inquiries, qualification, follow-up tracking
3. **Showing Scheduler** — Appointment booking, showing history, feedback collection, buyer feedback
4. **Transaction Tracker** — Under contract → inspection → appraisal → closing checklist → closed sales
5. **Marketing Campaigns** — Email campaigns, social media promotion, open house events, lead generation

#### Key Workflows
- Buyer inquiry → needs assessment → property matching → showings → offer preparation → negotiation → inspection → appraisal → closing
- Seller listing → property photography → MLS upload → showing requests → offer review → negotiation → inspection response → closing
- Rental inquiry → tenant application → background check → lease signing → move-in → ongoing management → renewal/exit

#### Demo Data Volume
- **Listings:** 60 active property listings (sold: 20, pending: 15, active: 25, expired: 5) across Miami-Dade County
- **Leads:** 80 qualified buyer and seller leads in pipeline
- **Showings:** 30 recent and upcoming showings with feedback
- **Transactions:** 15 active transactions at various closing stages
- **Agents:** 45 agent profiles with production metrics
- **Email Campaigns:** 8 recent marketing campaigns with engagement metrics

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **MLS** | Multiple Listing Service — shared database of property listings | Listings Board integration |
| **Listing Agent** | Real estate agent representing the property seller | Property record field |
| **Buyer's Agent** | Real estate agent representing the property buyer | Lead/Transaction record field |
| **Showing** | Property viewing by prospective buyer | Showing Scheduler entry |
| **Offer** | Buyer's formal purchase proposal for property | Transaction Tracker stage |
| **Under Contract** | Property has accepted offer pending inspection/appraisal | Transaction status |
| **Contingency** | Condition that must be satisfied before transaction closes | Transaction detail notes |
| **Earnest Money** | Deposit showing buyer's good faith in offer | Transaction detail field |
| **Appraisal** | Professional property valuation for lender purposes | Transaction Tracker checkpoint |
| **Closing** | Final transaction where deed transfers and funds exchange | Transaction completion stage |

---

### 5. SWIFTROUTE — LOGISTICS
**Workspace URL:** swiftroute.crm.localhost | swiftroute.erp.localhost
**Industry:** Regional Last-Mile Delivery

#### Brand Identity
- **Primary Color:** #7C3AED (Purple) — speed, innovation, movement, efficiency
- **Secondary Color:** #5B21B6 (Dark Purple) — reliability, strength, dependability
- **Accent Color:** #A78BFA (Light Purple) — highlights, status updates, confirmations
- **Logo Concept:** Arrow path flowing left-to-right with "S" integrated, suggesting rapid delivery routes
- **Tagline:** "Swift Delivery, Seamless Solutions"

#### Company Story
SwiftRoute is a regional last-mile delivery company founded in 2016, operating 120 full-time drivers across 3 distribution centers serving the Southeast United States. The company specializes in same-day and next-day deliveries for 2,000+ B2B clients including e-commerce merchants, retail stores, restaurants, and service providers. SwiftRoute differentiates through real-time tracking, flexible scheduling, and personalized customer service. The company processes 40,000+ deliveries monthly with a 98.5% on-time delivery rate.

**Key Operations:**
- Monthly deliveries: 40,000+
- Active drivers: 120
- Distribution centers: 3 (Atlanta, Charlotte, Jacksonville)
- Service area: 6-state Southeast region
- Average delivery distance: 12 miles
- On-time delivery rate: 98.5%

#### Organizational Structure
- **C-Suite:** CEO, COO, CTO (Chief Technology Officer)
- **Management:** Regional Managers (3), Dispatch Managers (5), Warehouse Managers (3), Operations Director, Customer Success Manager
- **Operations:** Drivers (120), Warehouse Associates (45), Customer Service Representatives (8), Tech/Dispatch team (12)
- **Total Headcount:** 200

#### CRM Boards
1. **Shipment Tracker** — Real-time shipment status, exception handling, proof of delivery, customer inquiries
2. **Fleet Management** — Driver assignments, vehicle maintenance, fuel tracking, safety incidents
3. **Route Planning** — Daily route optimization, stop sequencing, delivery windows, traffic management
4. **Client Orders** — Standing orders from corporate clients, custom delivery requirements, SLAs, pricing
5. **Warehouse Operations** — Inbound receiving, sorting, packing, staging, outbound dispatch

#### Key Workflows
- Order received → address validation → route planning → driver assignment → in-transit tracking → delivery attempt → proof of delivery → customer notification
- Vehicle maintenance alert → service scheduling → fleet downtime tracking → vehicle return to service
- Driver onboarding → background check → training → vehicle assignment → route qualification → active delivery

#### Demo Data Volume
- **Shipments:** 100 sample shipments across various statuses (delivered: 60, in transit: 25, pending pickup: 10, exceptions: 5)
- **Routes:** 50 daily routes with stop sequences and time windows
- **Drivers:** 120 driver profiles with performance metrics
- **Clients:** 30 major corporate clients with contract details and SLAs
- **Vehicles:** 40 delivery vehicles with maintenance histories
- **Warehouses:** 3 distribution center profiles with capacity and throughput metrics

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **Last-Mile** | Final segment of delivery from distribution center to customer | Service offering identifier |
| **Proof of Delivery** | Confirmation of successful delivery (signature, photo, GPS) | Shipment completion field |
| **Route Optimization** | Algorithm-based driver route planning for efficiency | Route Planning Board function |
| **Geofencing** | Location-based boundary triggering automatic events | Driver tracking feature |
| **Exception Handling** | Management of failed deliveries or delivery issues | Shipment detail flag |
| **Standing Order** | Recurring regular shipment with same origin/destination | Client Orders record type |
| **SLA** | Service Level Agreement defining delivery time commitments | Client Orders detail field |
| **Dwell Time** | Duration driver stops at single location for multiple stops | Route analytics metric |
| **Delivery Window** | Customer-specified time range for delivery | Shipment detail field |
| **Manifest** | Complete list of shipments for particular route/vehicle | Route Planning Board document |

---

### 6. DENTAFLOW — DENTAL CLINIC
**Workspace URL:** dentaflow.crm.localhost | dentaflow.erp.localhost
**Industry:** Multi-Location Dental Practice

#### Brand Identity
- **Primary Color:** #06B6D4 (Cyan/Teal) — clean, fresh, modern dentistry, trust, health
- **Secondary Color:** #0891B2 (Dark Cyan) — professionalism, precision, care
- **Accent Color:** #67E8F9 (Light Cyan) — positive outcomes, brightness (smile theme)
- **Logo Concept:** Stylized tooth with flow/motion lines suggesting movement and modern care
- **Tagline:** "Smiles in Motion"

#### Company Story
DentaFlow is a modern dental practice group established in 2010, operating 4 conveniently located clinics with 8 general dentists and 12 dental hygienists on staff. The practice serves 15,000+ active patients with comprehensive services including general dentistry, cosmetic procedures (whitening, veneers), orthodontics, and pediatric specialty care. DentaFlow emphasizes patient experience, advanced technology (CBCT imaging, digital scanning), and preventive care. The practice maintains 95% patient satisfaction ratings and implements a patient-centric appointment scheduling system.

**Key Operations:**
- Patient base: 15,000+ active records
- Appointment capacity: 150+ appointments/week across 4 locations
- Services: General, Cosmetic, Orthodontics, Pediatric
- Treatment plan acceptance rate: 78%
- Patient recall compliance: 62%
- Average visit duration: 45-60 minutes

#### Organizational Structure
- **C-Suite:** Practice Owner/CEO, Practice Manager/COO
- **Management:** Clinical Directors (4, one per location), Office Manager, Insurance Coordinator
- **Clinical Staff:** Dentists (8), Dental Hygienists (12), Dental Assistants (16)
- **Administrative Staff:** Receptionists (8), Insurance Coordinators (2), Billing Specialist (1)
- **Total Headcount:** 55

#### CRM Boards
1. **Patient Pipeline** — New patient consultations, examination schedules, treatment recommendations, patient onboarding
2. **Treatment Plans** — Proposed treatment by dentist, patient acceptance/decline, phased treatment schedules, case documentation
3. **Appointment Board** — Chair-side scheduling, availability by provider, patient confirmations, reminders, cancellations
4. **Insurance Claims** — Claim submission, EOB tracking, coverage verification, payment posting, patient balance
5. **Equipment Inventory** — Dental chairs, X-ray machines, autoclaves, handpieces, supplies, maintenance schedules

#### Key Workflows
- New patient consultation → examination → treatment plan proposal → insurance pre-authorization → treatment scheduling → completion → follow-up care plan
- Patient calls for appointment → availability check → chair assignment → confirmation → reminder → check-in → treatment → payment → next recall reminder
- Dental lab order (crown/bridge) → case documentation → lab send → delivery tracking → try-in appointment → final cementation → quality verification

#### Demo Data Volume
- **Patients:** 80 sample patient records (active: 70, inactive: 10)
- **Appointments:** 50 scheduled appointments (completed: 30, upcoming: 15, cancelled: 5)
- **Treatment Plans:** 30 proposed treatment plans (accepted: 20, pending: 7, declined: 3)
- **Insurance Claims:** 20 claims in processing (submitted: 8, approved: 9, denied: 2, pending EOB: 1)
- **Supply Inventory:** 40 consumable and equipment items with reorder levels
- **Lab Orders:** 15 pending and completed dental lab cases

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **Treatment Plan** | Proposed sequence of dental procedures with cost estimates | Treatment Plans Board entry |
| **Prophylaxis** | Professional teeth cleaning procedure; core hygiene visit | Appointment procedure code |
| **Restoration** | Filling or crown for cavity/damage repair | Treatment plan procedure |
| **Ortho Case** | Orthodontic treatment (braces/aligners) requiring multi-visit plan | Treatment plan project tracking |
| **Recall** | Routine follow-up appointment for prophylaxis/check-up | Appointment recurring task |
| **Coinsurance** | Patient percentage responsibility after insurance payment | Patient balance calculation field |
| **Pre-Auth** | Insurance pre-authorization for treatment before proceeding | Claims Board verification status |
| **CBCT** | Cone Beam CT scan — advanced 3D imaging for implant/ortho planning | Treatment documentation attachment |
| **Lab Case** | Restoration (crown, bridge, denture) sent to dental lab for fabrication | Lab Order tracking item |
| **Perio** | Periodontal (gum) disease evaluation and treatment | Treatment plan specialty service |

---

### 7. JURISPATH — LEGAL FIRM
**Workspace URL:** jurispath.crm.localhost | jurispath.erp.localhost
**Industry:** Mid-Size Law Firm (Multi-Practice Area)

#### Brand Identity
- **Primary Color:** #166534 (Forest Green) — justice, integrity, establishment, trust
- **Secondary Color:** #14532D (Dark Green) — authority, strength, legal expertise
- **Accent Color:** #4ADE80 (Light Green) — positive outcomes, successful resolutions, growth
- **Logo Concept:** Classical column/pillar representing law & justice, with path line suggesting case progression
- **Tagline:** "Your Path to Justice"

#### Company Story
JurisPath is a mid-size law firm founded in 1998 with 25 attorneys organized across 4 primary practice areas: Corporate Law, Litigation, Real Estate, and Family Law. The firm maintains 500+ active cases and 2,000+ client files with emphasis on personalized service and collaborative lawyering. JurisPath serves a mix of corporate clients, real estate developers, and high-net-worth individuals. The firm maintains an AV Preeminent rating from Martindale-Hubbell and is known for competitive hourly billing and transparent cost communication.

**Key Operations:**
- Active cases: 500+
- Total clients: 2,000+
- Attorneys: 25 (Partners: 4, Associates: 16, Counsel: 5)
- Billing model: Hourly rates ($250-$450/hour), retainers, flat fees
- Annual revenue: $6.5M
- Client retention: 91%

#### Organizational Structure
- **Partners:** 4 Managing/Senior Partners
- **Associates:** 16 Junior/Mid-Level Associates
- **Counsel:** 5 Of Counsel (part-time/contract)
- **Administrative:** Office Manager, Finance Manager, Paralegal Coordinator, Paralegals (8)
- **Support:** Receptionists (2), Legal Secretaries (4), Billing Coordinator (1)
- **Total Headcount:** 45

#### CRM Boards
1. **Case Management** — Active cases by practice area, matter stage (pre-suit, complaint, discovery, trial), opposing counsel, key deadlines
2. **Client Intake** — New client inquiries, consultation scheduling, engagement letter execution, conflict-of-interest checks
3. **Document Tracker** — Document assembly, discovery management, filing deadlines, evidence organization, revision history
4. **Billing/Invoicing** — Hourly entry tracking, retainer management, trust account management, invoice generation, payment tracking
5. **Court Calendar** — Hearing dates, trial dates, deadline tracking, motion deadlines, statute of limitation alerts

#### Key Workflows
- Client inquiry → intake interview → conflict check → engagement letter → matter creation → case team assignment
- Case filing → discovery exchange → motion practice → settlement negotiation or trial preparation → judgment/settlement → closure
- Hourly entry → weekly time collection → monthly invoicing → client payment → accounts receivable follow-up

#### Demo Data Volume
- **Active Cases:** 60 cases across practice areas (Corporate: 20, Litigation: 18, Real Estate: 15, Family: 7)
- **Clients:** 100 client profiles with contact and matter history
- **Attorneys:** 25 attorney profiles with specialty areas and billing rates
- **Upcoming Hearings:** 40 scheduled hearings/depositions/court dates in next 90 days
- **Invoices:** 50 recent invoices with payment status
- **Documents:** 500+ case documents tracked across cases

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **Matter** | Legal case or legal issue requiring attorney services | Case Management primary record |
| **Engagement Letter** | Contract defining scope, fees, and terms of legal representation | Client Intake document |
| **Billable Hour** | Time spent on client work at attorney's hourly rate | Billing entry unit of measure |
| **Discovery** | Exchange of evidence between parties in litigation | Case stage identifier |
| **Motion** | Formal written request to court for specific relief | Court Calendar entry type |
| **Deposition** | Recorded testimony under oath from witness/party | Court Calendar appointment type |
| **Statute of Limitations** | Time deadline for filing legal claims | Case deadline alert |
| **Retainer** | Advance payment for legal services held in trust | Billing/retainer account type |
| **Conflict of Interest** | Situation where attorney cannot represent client due to competing loyalty | Intake Board conflict check |
| **Precedent** | Previous case law setting legal standard for current case | Case detail research reference |

---

### 8. TABLESYNC — RESTAURANT GROUP
**Workspace URL:** tablesync.crm.localhost | tablesync.erp.localhost
**Industry:** Upscale Casual Restaurant Group

#### Brand Identity
- **Primary Color:** #9F1239 (Burgundy) — sophistication, culinary excellence, premium dining, warmth
- **Secondary Color:** #881337 (Dark Burgundy) — classic elegance, establishment, tradition
- **Accent Color:** #FB7185 (Rose) — hospitality, warmth, celebration, special moments
- **Logo Concept:** Table with synchronization arrows around perimeter, representing connected dining experience
- **Tagline:** "Dining in Perfect Harmony"

#### Company Story
TableSync is an upscale casual restaurant group founded in 2008 with 6 locations across the Southeast serving 180 employees and generating 500+ covers daily. The concept emphasizes fresh, locally-sourced ingredients, innovative seasonal menus, and exceptional table service. TableSync operates dine-in, takeout, catering, and private event services. The group maintains a 4.7-star average customer rating and is known for signature cocktails, wine selection, and culinary creativity. Average check size: $38/person for dine-in.

**Key Operations:**
- Locations: 6 restaurants
- Total employees: 180 (cooks, servers, bartenders, management, support)
- Daily covers: 500+ across all locations
- Annual revenue: $9.2M
- Menu items: 70+ dishes rotating seasonally
- Catering events: 2-3 events/week
- Reservation system: 100+ reservations/day during peak

#### Organizational Structure
- **C-Suite:** Owner/CEO, Chief Operations Officer
- **Management:** General Manager (1 per location), Head Chef, Sous Chef, Front-of-House Manager, Bar Manager
- **Kitchen Staff:** Line Cooks (60), Prep Cooks (20)
- **Service Staff:** Servers (50), Hosts (12), Bartenders (18), Bussers (20)
- **Support:** Delivery Drivers (8), Administrative (2)
- **Total Headcount:** 180

#### CRM Boards
1. **Reservation Board** — Table availability, reservation requests, walk-ins, party size, special occasions, dietary notes
2. **Menu Management** — Menu items, availability status, pricing, ingredient costs, seasonal rotation, item popularity tracking
3. **Staff Scheduling** — Shift assignments, availability tracking, time-off requests, payroll integration, coverage management
4. **Inventory Tracker** — Perishable tracking (expiration dates), ingredient par levels, reorder points, supplier management, waste tracking
5. **Event Planning** — Catering inquiries, event proposals, menu customization, setup/teardown coordination, revenue tracking

#### Key Workflows
- Reservation request → party availability check → table assignment → confirmation → reminder (24 hours prior) → seating → service → payment → feedback
- New menu item conception → recipe development → ingredient costing → testing → market launch → sales tracking → seasonal retirement
- Catering inquiry → proposal generation → menu selection → deposit collection → event day coordination → delivery/setup → event execution → billing

#### Demo Data Volume
- **Menu Items:** 70 items (appetizers: 15, entrees: 25, sides: 12, desserts: 8, cocktails: 10)
- **Reservations:** 100 reservations (completed: 60, upcoming: 35, cancelled: 5)
- **Staff Members:** 50 employee profiles (active: 45, on leave: 3, terminated: 2)
- **Inventory Items:** 80 tracked ingredients and supplies with par levels
- **Catering Events:** 10 past and upcoming catering events
- **Suppliers:** 15 vendor profiles with delivery schedules and pricing

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **Covers** | Number of customer meals served (unit of restaurant volume) | Reservation/daily metric |
| **Reservation** | Table booking by customer for specific date/time | Reservation Board entry |
| **Seating Chart** | Visual layout of tables and section assignments | Reservation Board tool |
| **Check Average** | Average revenue per customer meal | Dashboard KPI metric |
| **Table Turn** | Time duration from customer seating to departure | Reservation Board tracking |
| **Par Level** | Standard inventory quantity on hand for item | Inventory Tracker field |
| **Food Cost** | Percentage of revenue spent on ingredients (target: 28-32%) | Dashboard cost metric |
| **Menu Engineering** | Analysis of menu items by popularity and profitability | Menu Management report |
| **Mise en Place** | Preparation of ingredients before service (French culinary term) | Kitchen production prep |
| **Catering Minimum** | Minimum spend or number of guests for catering event | Event Planning proposal field |

---

### 9. CRANESTACK — CONSTRUCTION
**Workspace URL:** cranestack.crm.localhost | cranestack.erp.localhost
**Industry:** General Contractor (Commercial & Residential)

#### Brand Identity
- **Primary Color:** #EA580C (Safety Orange) — safety, construction, visibility, energy, reliability
- **Secondary Color:** #C2410C (Dark Orange) — stability, established expertise, dependability
- **Accent Color:** #FB923C (Light Orange) — progress highlights, milestone achievements, completion
- **Logo Concept:** Crane silhouette with stacked building blocks, representing heavy construction capabilities
- **Tagline:** "Building Strong Foundations"

#### Company Story
CraneStack is an established general contractor founded in 2002, specializing in commercial and residential construction with $50M annual revenue and 200 employees. The company manages 15-20 concurrent projects ranging from retail buildouts to multi-family residential developments. CraneStack maintains strong relationships with subcontractors, suppliers, and property owners through transparent communication and consistent project delivery. The firm is bonded for up to $20M single projects and maintains an exemplary safety record with OSHA compliance.

**Key Operations:**
- Annual revenue: $50M
- Employees: 200 (site staff, office staff, equipment operators)
- Active projects: 15-20 concurrent
- Project pipeline value: $120M (next 24 months)
- Safety record: 0.8 TRIR (industry average: 3.2)
- Subcontractor network: 250+ certified subcontractors

#### Organizational Structure
- **C-Suite:** President/CEO, VP Construction, VP Operations, CFO
- **Project Management:** Project Managers (12), Assistant PMs (8), Site Superintendents (15)
- **Field Operations:** Equipment Operators (30), Laborers (80), Safety Officer (1), QA/QC Inspector (1)
- **Support:** Estimators (5), Scheduler (1), Procurement (3), Administrative (10)
- **Total Headcount:** 200

#### CRM Boards
1. **Project Pipeline** — New project bids, pipeline opportunities, bid-to-project tracking, project profitability forecasts
2. **Equipment Tracker** — Heavy equipment (cranes, excavators, compactors), maintenance schedules, rental vs. own tracking, utilization rates
3. **Safety Compliance** — Incident tracking, OSHA reporting, safety meetings, worker training records, certifications
4. **Subcontractor Board** — Subcontractor performance ratings, bid quotes, insurance verification, contract tracking, payment status
5. **Material Orders** — POs to suppliers, delivery tracking, receiving inspection, inventory at site, waste/loss tracking

#### Key Workflows
- Bid request → estimate preparation → subcontractor quotes → bid assembly → bid submission → award notification
- Project kickoff → team assignment → schedule creation → material ordering → site setup → daily coordination → inspection → closure
- Safety incident → immediate reporting → investigation → corrective action → OSHA filing (if required) → preventive measures

#### Demo Data Volume
- **Projects:** 12 active projects (preconstruction: 2, foundation: 2, framing: 3, MEP: 2, finishing: 2, closeout: 1)
- **Subcontractors:** 50 active subcontractors with performance ratings
- **Equipment:** 30 equipment items (owned and leased) with maintenance history
- **Material Orders:** 100 active POs with vendors and delivery status
- **Employees:** 200 worker profiles with certifications and training records
- **Safety Events:** 10 logged incidents with corrective action tracking

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **Bid** | Contractor proposal for project with cost and schedule estimates | Project Pipeline entry |
| **Schedule** | Project timeline with phases, milestones, and critical path | Project detail document |
| **Subcontractor** | Specialty contractor hired for specific trade (HVAC, electrical, plumbing) | Subcontractor Board entry |
| **RFP** | Request for Proposal — formal bid solicitation from owner | Project Pipeline stage |
| **Change Order** | Modification to contract scope, cost, or schedule | Project detail tracking item |
| **Substantial Completion** | Date when construction substantially meets contract requirements | Project milestone date |
| **Punch List** | Final items to complete before project closure | Project closing checklist |
| **Daily Report** | Crew attendance, activities, material delivery, safety log | Project daily documentation |
| **OSHA** | Occupational Safety and Health Administration — federal safety regulator | Safety Compliance reference |
| **Retainage** | Percentage of progress payments held until project completion | Subcontractor payment terms |

---

### 10. EDUPULSE — EDUCATION
**Workspace URL:** edupulse.crm.localhost | edupulse.erp.localhost
**Industry:** Private K-12 School System

#### Brand Identity
- **Primary Color:** #6D28D9 (Indigo/Bright Purple) — education, growth, innovation, inspiration, future
- **Secondary Color:** #5B21B6 (Dark Purple) — achievement, academic excellence, tradition
- **Accent Color:** #A78BFA (Light Purple) — progress, learning moments, accomplishment
- **Logo Concept:** Pulse/heartbeat line combined with graduation cap, representing vitality of education
- **Tagline:** "Education That Inspires"

#### Company Story
EduPulse is a private K-12 school system founded in 2005 operating 3 campuses with 150 faculty members and 2,500 students. The institution emphasizes STEM (Science, Technology, Engineering, Mathematics) curriculum, project-based learning, and character development. EduPulse offers comprehensive extracurricular programs (sports, arts, clubs), summer camps, and college preparation. The school maintains a 96% college acceptance rate for graduating seniors and an average class size of 18 students. Tuition: $15,000-$22,000/year depending on grade level.

**Key Operations:**
- Total students: 2,500 across K-12
- Faculty: 150 full-time teachers
- Staff: 80 administrative and support personnel
- Class sizes: Average 18 students per classroom
- Tuition range: $15,000-$22,000/year
- College acceptance rate: 96% (graduating seniors)
- Graduation rate: 99%

#### Organizational Structure
- **C-Suite:** Head of School, Academic Dean, Chief Financial Officer
- **Academic Leadership:** Department Heads (4: English, Math, Science, Social Studies), Campus Directors (3)
- **Faculty:** 150 teachers across grade levels and subjects
- **Support Services:** Registrar, Admissions Director, Counselors (8), IT Director, Facilities Manager
- **Administrative:** Office Managers (3), Financial Aid Officer, Student Records Coordinator, Support staff (15)
- **Total Headcount:** 230

#### CRM Boards
1. **Student Enrollment** — Application tracking, admission decisions, enrollment confirmation, tuition contracts, profile updates
2. **Course Management** — Course offerings, section creation, teacher assignments, enrollment limits, schedule grid
3. **Assignment Tracker** — Academic assignment posting, submission deadline tracking, grade entry, performance analytics
4. **Faculty Board** — Teacher profiles, credential tracking, classroom assignments, professional development, performance reviews
5. **Event Calendar** — School events (assemblies, open house, sports, performances), academic calendar, parent conference scheduling

#### Key Workflows
- Student application → admissions review → acceptance/rejection notification → enrollment confirmation → payment plan setup
- New school year → course offerings publication → student course selection → teacher assignment → class roster creation → system setup
- Academic performance monitoring → parent notification → intervention planning → progress tracking → conference scheduling → outcome documentation

#### Demo Data Volume
- **Students:** 100 sample student records (active: 95, graduated: 3, transferred: 2)
- **Teachers:** 50 teacher profiles with credentials and classroom assignments
- **Courses:** 30 unique courses across grades/subjects (multiple sections per course)
- **Enrollments:** 80 student-course enrollments with grades
- **Upcoming Events:** 20 school events (sports, performances, academic events, conferences)
- **Faculty Credentials:** Tracking of licenses, certifications, professional development hours

#### Industry-Specific Terminology

| Term | Definition | CRM Context |
|------|-----------|-------------|
| **Enrollment** | Student registration in course or school | Student Enrollment board entry |
| **Transcript** | Official record of student coursework and grades | Student record documentation |
| **GPA** | Grade Point Average — numerical representation of academic performance | Student record calculation |
| **STEM** | Science, Technology, Engineering, Mathematics curriculum focus | School differentiator/program |
| **AP Course** | Advanced Placement — college-level course offered in high school | Course offering type |
| **Course Prerequisite** | Required prior course before enrollment eligibility | Course detail specification |
| **Parent-Teacher Conference** | Scheduled meeting between parent and teacher to discuss student progress | Event Calendar item |
| **Credential** | Teaching certificate or subject matter authorization | Faculty Board verification field |
| **Tuition** | Student payment for educational services | Enrollment contract field |
| **Alumni** | Former students who have graduated | Student record status |

---

## CRM BOARD CONFIGURATIONS

### Standard Board Structure (All Companies)

Each company CRM workspace includes 5 industry-specific boards with consistent configuration across platform:

**Board Type:** Task-based workflow (inspired by Monday.com)
**Columns (Standard):**
- Name/Title (text)
- Status (single select: To Do, In Progress, In Review, Done, On Hold)
- Owner (person select)
- Due Date (date)
- Priority (single select: Urgent, High, Medium, Low)
- Notes (long text)

**Company-Specific Columns:**
Each board adds industry-specific columns. Example - NovaPay Merchant Onboarding:
- Merchant ID (text)
- Merchant Category (single select)
- Risk Score (number)
- KYC Verification (single select: Pending, Approved, Rejected)
- Processing Fees (currency)

### Board Automation Examples

**TrustGuard Claims Pipeline:**
- When status → "Approved": Automatically alert adjuster, update reserve
- When due date → today: Send reminder notification
- When status → "Done": Calculate cycle time, add to monthly report

**MedVista Appointment Scheduler:**
- When appointment created: Auto-send patient confirmation email template
- When appointment → 24 hours before: Trigger reminder task
- When status → "Completed": Auto-create follow-up appointment task if needed

---

## ERP MODULE ADAPTATIONS

### ERP Module Suite (Odoo-style)

Each company implements a subset of these modules with industry-specific customizations:

1. **Sales** — Customer pipeline, quotes, orders, invoicing
2. **Accounting** — General ledger, invoice management, reporting
3. **Inventory** — Stock tracking, warehouse management, reorder automation
4. **Manufacturing** — Bill of Materials, production orders, work orders
5. **Calendar** — Shared calendaring, resource scheduling, room booking
6. **Fleet** — Vehicle management, maintenance, fuel tracking
7. **Project** — Project planning, tasks, resource allocation, timelines
8. **HR** — Employee management, payroll integration, leave tracking
9. **Helpdesk** — Ticket management, resolution tracking, customer support
10. **POS** — Point of Sale for retail transactions

### Company-Specific Module Implementations

**NovaPay (FinTech)**
- **Sales:** Merchant acquisition pipeline (replaces generic sales)
- **Accounting:** Multi-currency merchant fee accounting, reserve management
- **Helpdesk:** Merchant support tickets, issue escalation

**MedVista (Healthcare)**
- **Calendar:** Patient appointment scheduling with provider availability
- **Inventory:** Medical supplies inventory with reorder alerts
- **HR:** Physician credentialing, license/insurance verification tracking
- **Helpdesk:** Patient portal support, appointment modification requests

**TrustGuard (Insurance)**
- **Sales:** Policy sales pipeline, underwriting queue tracking
- **Accounting:** Premium accounting with reserve calculation, loss accounting
- **Invoicing:** Premium billing with renewal tracking, commission calculations
- **Helpdesk:** Claims support tickets, customer inquiries

**UrbanNest (Real Estate)**
- **Sales:** Property sales/rental pipeline with contract management
- **Calendar:** Showing scheduling with buyer/seller confirmation
- **Project:** Closing process management with milestone tracking
- **Invoicing:** Commission tracking by agent and property

**SwiftRoute (Logistics)**
- **Fleet:** Delivery vehicle tracking, maintenance scheduling, fuel management
- **Inventory:** Warehouse inventory across 3 distribution centers
- **Manufacturing:** Package processing as "production" (sorting, consolidation)
- **Calendar:** Driver shift scheduling, delivery window management
- **Project:** Route planning as repeating daily "projects"

**DentaFlow (Dental)**
- **Calendar:** Chair-side patient appointment scheduling by provider
- **Inventory:** Supply room management (dental materials, disposables, instruments)
- **Fleet:** Equipment management (dental chairs, X-ray machines, autoclaves, sterilizers)
- **Manufacturing:** Lab orders as production (crowns, bridges, dentures from partners)
- **POS:** Patient checkout system (co-pay collection, payment plans, insurance billing)

**JurisPath (Legal)**
- **Project:** Cases as projects with milestones (filing, discovery, depositions, trial)
- **Calendar:** Court dates, client meetings, internal team calendars
- **Invoicing:** Hourly billing from timesheet entries, retainer management
- **Sales:** Client intake pipeline, conflict-of-interest screening

**TableSync (Restaurant)**
- **Inventory:** Pantry/kitchen stock with perishable tracking and par levels
- **Manufacturing:** Kitchen production using recipes as BOM, prep scheduling
- **POS:** Restaurant POS system (table management, split bills, tip handling)
- **Calendar:** Reservation management, staff shift scheduling, catering events
- **Fleet:** Delivery vehicle management for catering/takeout deliveries

**CraneStack (Construction)**
- **Project:** Construction projects as primary module (phases: pre-construction, foundation, framing, MEP, finishing, closeout)
- **Manufacturing:** Construction production (material assembly, prefab management)
- **Inventory:** Materials yard inventory across job sites
- **Fleet:** Heavy equipment tracking (cranes, excavators, compactors) with maintenance
- **Purchasing:** Material purchasing with POs to suppliers, delivery tracking
- **Calendar:** Site inspection scheduling, project milestone dates

**EduPulse (Education)**
- **HR:** Teacher/staff management with credential tracking, professional development
- **Calendar:** Class schedules, parent-teacher conferences, school events, administrative calendar
- **Project:** Semester planning and curriculum development as project management
- **Inventory:** Textbooks, supplies, and lab equipment tracking
- **POS:** Campus bookstore and cafeteria sales system
- **Sales:** Enrollment pipeline for new student recruitment

---

## DEMO DATA SPECIFICATIONS

### Data Volume Guidelines

**Small Volume Companies:** 50-100 primary records
- NovaPay, TrustGuard, DentaFlow, JurisPath

**Medium Volume Companies:** 100-150 primary records
- MedVista, UrbanNest, TableSync

**High Volume Companies:** 200+ primary records
- SwiftRoute (120 drivers + shipments), CraneStack (200 employees + projects), EduPulse (2,500 students + faculty)

### Data Quality Standards

- **Completeness:** 90%+ field completion for primary records
- **Realism:** Data reflects actual industry volumes and relationships
- **Variety:** Include multiple statuses, outcomes, and edge cases for realistic demonstration
- **Relationships:** Cross-references between related records (e.g., claims linked to policies, cases linked to clients)

### Specific Data Examples

**NovaPay Merchants (Sample):**
- 75 total merchants
- Industries: E-commerce (32 merchants, $245K avg monthly volume), Retail (18 merchants, $520K avg), SaaS (15 merchants, $180K avg), Food Service (10 merchants, $95K avg)
- Status distribution: Active (68), Inactive (5), Suspended (2)

**MedVista Appointments (Sample):**
- 60 total appointments in system
- Completed: 30 (diverse date range, closed notes)
- Upcoming: 20 (next 30 days, reminder tracking)
- Historical: 10 (6+ months old, archive status)
- Cancellations/No-shows: various reasons documented

**CraneStack Projects (Sample):**
- 12 active projects ranging $2M-$8M
- Phases represented: 2 in preconstruction, 2 in foundation, 3 in framing, 2 in MEP, 2 in finishing, 1 in closeout
- 50 active subcontractors with payment terms
- 30 equipment items (owned: 20, leased: 10)

---

## CROSS-PLATFORM DATA RELATIONSHIPS

### Project 05 Continuity (Original 5 Companies)

The following companies exist in both Project 05 (Portfolio Data Platform) and Projects 13-14 (CRM/ERP):

1. **NovaPay** — FinTech payment processor
2. **MedVista** — Healthcare multi-specialty group
3. **TrustGuard** — P&C Insurance carrier
4. **UrbanNest** — Real estate brokerage
5. **SwiftRoute** — Logistics/delivery

### Optional Future API Integrations

**CRM → ERP Synchronization Points:**

1. **Calendar Sync (CalDAV-style)**
   - CRM board event (appointment, showing, meeting) → ERP calendar event
   - ERP event (project milestone, facility booking) → CRM board update
   - Bidirectional with conflict detection

2. **Contact/Customer Sync**
   - CRM contacts → ERP customer/vendor records
   - ERP customers → CRM account/contact records
   - Webhook-based synchronization with manual override option

3. **Deal-to-Order Automation** (Future enhancement)
   - CRM deal status → "Won" triggers ERP sales order creation
   - Order confirmation → CRM deal update with fulfillment status
   - Particularly relevant for UrbanNest, SwiftRoute, CraneStack

### Data Isolation Model

**Default Configuration:** CRM and ERP are independent systems
- No automatic synchronization
- Manual data entry in both systems for current design
- API layer designed but not activated for Phase 1

**Access Control:**
- CRM users do not automatically have ERP access (and vice versa)
- Company administrators manage separate user rosters per platform
- Future: SSO integration could enable unified authentication

---

## THEME APPLICATION GUIDELINES

### CRM Theme Implementation (Monday.com-style)

**Color Application:**
1. **Sidebar Active Item** — Apply brand primary color to selected board/view highlight
2. **Header Accent Bar** — Brand color horizontal accent bar at top of page
3. **Status Column Default** — Status "Done" defaults to brand primary color (customizable per board)
4. **Primary Button Color** — "Create", "Save", "Submit" buttons use brand primary color
5. **Progress Indicators** — Completion percentages/progress bars use brand color gradient (primary → accent)

**Typography:**
- Header font: Clean sans-serif (e.g., Inter, Helvetica)
- Body font: Readable sans-serif (same as header)
- Brand name appears in logo position (top-left sidebar)

**Layout Consistency:**
- White background (light mode default)
- Left sidebar with board list
- Main content area with task boards
- Right-side panel for record details/assignments

### ERP Theme Implementation (Odoo-style)

**Color Application:**
1. **Top Navigation Bar** — Brand primary color as background for top menu
2. **App Switcher Icons** — Brand color applied to active app icon
3. **Primary Buttons** — All action buttons (Save, Create, Confirm) use brand primary color
4. **Active Menu Items** — Left-side module menu highlights use brand primary color
5. **Status Badges** — "Confirmed", "Done", "Approved" badges use brand primary color

**Layout Consistency:**
- White background (light mode default)
- Top horizontal navigation with app switcher
- Left-side vertical module menu
- Main content area with forms/lists
- Mobile-responsive design

### Logo & Branding Assets

**Logo Placement:**
- CRM: Top-left sidebar (120px width)
- ERP: Top-left corner, adjacent to app menu (100px width)

**Favicon:**
- Stylized company logo (32x32px, scalable SVG preferred)
- Applied to browser tab

**Splash Screen (On Login):**
- Large company logo (200x200px)
- Company tagline beneath logo
- Brand color background or white with subtle branded accent

---

## WORKSPACE INITIALIZATION CHECKLIST

### Per-Company Setup Requirements

- [ ] **CRM Workspace Created**
  - [ ] Workspace name (lowercase company name)
  - [ ] 5 default users created
  - [ ] 5 industry-specific boards configured
  - [ ] Brand colors applied to UI elements
  - [ ] Demo data imported (see Demo Data Specifications)

- [ ] **ERP Company Created**
  - [ ] Company name (matches CRM workspace)
  - [ ] Fiscal year configuration
  - [ ] Base currency setting
  - [ ] Industry-specific modules activated
  - [ ] Demo data imported (see Demo Data Specifications)

- [ ] **Cross-Platform Verification**
  - [ ] URL format matches standard (company.crm.localhost, company.erp.localhost)
  - [ ] Branding consistent across platforms
  - [ ] User credentials documented
  - [ ] Data completeness verified

---

## FINAL NOTES

This document serves as the master reference for both Project 13 (CRM) and Project 14 (ERP) implementations. All 10 companies should be implemented with consistent structure while maintaining authentic industry-specific customizations.

**Document Version:** 1.0
**Next Review Date:** Q3 2026
**Maintained By:** Project Leads (Projects 13 & 14)

