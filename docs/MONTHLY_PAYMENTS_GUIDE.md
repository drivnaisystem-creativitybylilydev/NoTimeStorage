# Monthly Payment Plan Implementation Guide
## NoTime Storage - Payment Plan Feature

**Last Updated:** March 2026  
**Objective:** Allow customers to choose between "Pay in Full" or "Pay Monthly" with $50 deposit credit applied to first monthly payment.

---

## 🎯 BUSINESS LOGIC

### Payment Options:

**Pay in Full:**
- Customer pays entire remaining balance today
- Example: $665 total - $50 deposit = $615 due today
- Single payment, done immediately

**Pay Monthly (3-month installments):**
- Split remaining balance into 3 equal monthly payments
- Apply $50 deposit credit to FIRST month only
- Example for $665 total:
  - Month 1: $222 - $50 deposit credit = $172 due today
  - Month 2: $222 (auto-charged 30 days later)
  - Month 3: $221 (auto-charged 60 days later)
  - Total: $665 (same total, different payment schedule)

### Key Rules:
- $50 deposit is ALWAYS collected first (existing flow, unchanged)
- Monthly option available for bookings ≥ $300 remaining balance
- Deposit credit shows on first monthly payment (psychological benefit)
- Use Square Invoices API with payment schedules (NOT Subscriptions)
- Card must be saved on file for auto-charging future payments

---

## 🏗️ TECHNICAL ARCHITECTURE

### Database Changes Required:

**Supabase `bookings` table - Add these columns:**
- payment_plan (TEXT, default 'full', only allows 'full' or 'monthly')
- monthly_payment_amount (INTEGER, stores amount in cents)
- monthly_payments_remaining (INTEGER)
- next_payment_date (DATE)
- square_invoice_id (TEXT, for tracking Square invoice)

### Square API Requirements:

**What we need:**
- Square Invoices API to create invoices with payment schedules
- Card on File / Customer API to save payment method
- Payments API to charge saved card

**What to verify in existing code:**
- Check if we save customer cards after deposit payment
- Check if we can charge a saved card later
- Review existing files: lib/square/deposit.ts and lib/square/charge-booking.ts

---

## 📋 IMPLEMENTATION PHASES

### PHASE 1: BACKEND PREPARATION (DO FIRST)

#### Step 1.1: Update Supabase Schema
**Location:** Supabase SQL Editor

**Task:** Add 5 new columns to bookings table (payment_plan, monthly_payment_amount, monthly_payments_remaining, next_payment_date, square_invoice_id)

#### Step 1.2: Create Payment Plan Utility Functions
**New File:** lib/payment-plan-calculator.ts

**Task:** Create two functions:
- calculateMonthlyBreakdown: Takes total amount, deposit paid, number of months → Returns first month amount (with $50 credit), subsequent month amounts, and total
- isEligibleForMonthlyPlan: Takes remaining balance → Returns true if ≥ $300

**Formula:** Remaining balance ÷ 3 months = monthly base. First month gets $50 credit applied. Last month gets any remainder cents.

#### Step 1.3: Verify Square Card-on-File Setup
**Files to check:** lib/square/deposit.ts and lib/square/charge-booking.ts

**Task:** Look for verification_token usage, Customer ID storage, Card ID storage. If cards are NOT being saved, we need to update deposit flow first.

#### Step 1.4: Create Square Invoice Helper
**New File:** lib/square/create-invoice.ts

**Task:** Function to create Square invoice with payment schedule using Square Invoices API. Should accept customer ID, card ID, and array of payments with amounts and due dates.

---

### PHASE 2: BOOKING PAGE UI (USER SELECTS PLAN)

#### Step 2.1: Add Payment Plan Toggle Component
**File:** app/booking/page.tsx (or wherever booking form lives)

**Location:** After storage configuration section, before "Continue to Payment" button

**Design Requirements:**
- Two-option toggle (radio button style)
- Left option: "Pay in Full" - shows total due today ($615)
- Right option: "Pay Monthly" - shows first payment ($172 today) + "Then 2× $222" + "💰 Save $50!" badge
- Use NoTime brand colors: coffee #4B2E25, latte #C9A47E, paper #F7F3EE
- Disable monthly option if remaining balance < $300
- Hover effect: lift card 2px with shadow
- Selected state: coffee border color, latte background tint

**CSS Classes to create in globals.css:**
- payment-plan-selector (white card with latte border, 32px padding)
- payment-plan-option (individual option card, latte border, 24px padding)
- payment-plan-option.selected (coffee border, latte background tint)
- Hover: translateY(-2px) with shadow

#### Step 2.2: Store Plan Selection
**Same File:** app/booking/page.tsx

**Task:** 
- Add React state for payment plan selection (default 'full')
- When user clicks "Continue to Payment", include paymentPlan in URL params
- Example URL: /booking/payment?boxes=2&dates=...&paymentPlan=monthly

---

### PHASE 3: PAYMENT PAGE (DISPLAY & PROCESS)

#### Step 3.1: Read Payment Plan from URL
**File:** app/booking/payment/page.tsx

**Task:** Read paymentPlan from searchParams, default to 'full' if not present

#### Step 3.2: Update Order Summary Display
**File:** app/booking/payment/page.tsx

**Current Display (Pay in Full):**
- Subtotal: $665
- Deposit paid: -$50
- Due today: $615

**New Display (Pay Monthly):**
Show payment schedule card with:
- Title: "PAYMENT SCHEDULE"
- Today (Month 1): First month $222, Deposit credit -$50, Due now $172 with ✓
- Future dates: Apr 15 (Month 2) $222 with 🔄, May 15 (Month 3) $221 with 🔄
- Total: $665
- Legend: ✓ = Charged today, 🔄 = Auto-charged on date shown

**CSS Classes to create:**
- payment-schedule-card (white background, latte border, 24px padding)
- payment-schedule-row (flex layout, space-between)
- payment-schedule-row.today (bold, coffee color, top border)
- payment-schedule-row.future (slightly transparent, smaller text)
- deposit-credit-highlight (coffee color, bold)

#### Step 3.3: Update Payment Handler Logic
**File:** app/booking/payment/page.tsx

**Current handlePayment function does:**
- Tokenize card
- Create booking
- Charge full amount
- Redirect to confirmation

**Update to add branch:**
- If paymentPlan is 'full': Use existing flow (no changes)
- If paymentPlan is 'monthly': 
  - Charge first month amount ($172)
  - Create Square invoice for remaining payments ($222, $221)
  - Save invoice ID to booking
  - Redirect to confirmation

**CRITICAL:** Do not break existing "Pay in Full" flow. Add new monthly logic as separate branch.

#### Step 3.4: Create Server Actions for Monthly Payments
**New File:** app/actions/monthly-payments.ts

**Task:** Create two server actions:
- chargeFirstMonthPayment: Charge first month using existing payment logic, save customer ID and card ID
- createMonthlyPaymentSchedule: Create Square invoice with payment schedule, link invoice ID to booking in Supabase

---

### PHASE 4: CONFIRMATION PAGE

#### Step 4.1: Update Confirmation Display
**File:** app/booking/confirmed/page.tsx

**Task:** Show different confirmation message based on payment plan:

**If Pay in Full:**
- ✓ Payment Complete
- You paid $615 today
- Your booking is confirmed!

**If Pay Monthly:**
- ✓ First Payment Complete
- You paid $172 today
- Remaining payments: Apr 15 $222 (auto-charged), May 15 $221 (auto-charged)
- We'll email you before each payment

---

### PHASE 5: EMAIL NOTIFICATIONS

#### Step 5.1: Update Confirmation Email
**File:** Wherever confirmation emails are sent

**Task:** Add payment plan details to confirmation email. If monthly plan, show payment schedule and remind about auto-charges.

---

## 🎨 BRAND CONSISTENCY

### NoTime Storage Colors:
- Coffee (Primary): #4B2E25
- Latte (Secondary): #C9A47E
- Paper (Background): #F7F3EE
- Ink (Text): #0B0B0B
- Latte Soft (Accent): #E7D3BF
- Coffee Dark: #3A231C

### Typography Standards:
- Headings: 700-800 weight, letter-spacing -0.02em
- Body text: 400-500 weight, line-height 1.6-1.7
- Labels: 600 weight, uppercase, letter-spacing 0.1em

### Spacing Standards:
- Section padding: 32px
- Card padding: 24px
- Element gaps: 16px
- Button padding: 14px 28px

### Animation Standards:
- Transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)
- Hover lift: translateY(-2px)
- Hover shadow: 0 4px 12px rgba(75, 46, 37, 0.15)

---

## 🧪 TESTING CHECKLIST

### Square Sandbox Testing:
- Test existing full payment flow (must not break)
- Test monthly payment first charge ($172)
- Verify Square invoice created with correct payment schedule
- Confirm card saved on file
- Test auto-charge simulation if possible

### UI Testing:
- Payment plan toggle displays correctly
- Monthly calculation shows correct amounts
- $50 deposit credit visible on first month
- Payment schedule dates are correct
- Confirmation page shows correct plan details
- Mobile responsive layout works

### Database Testing:
- Booking created with correct payment_plan value
- Monthly amounts stored correctly in cents
- Invoice ID linked to booking

---

## 🚨 CRITICAL RULES

### NEVER DO:
- Break existing "Pay in Full" flow
- Charge incorrect amounts
- Forget to save card on file for monthly plan
- Use Square Subscriptions API (use Invoices instead)
- Hide the $50 deposit credit from display

### ALWAYS DO:
- Keep existing chargeBookingPayment working for full payments
- Show $50 credit prominently on monthly option
- Use Square Invoices API (not Subscriptions)
- Save customer card for auto-charging
- Test in Square Sandbox before production
- Match NoTime brand colors exactly

---

## 🎯 EXECUTION ORDER

**Follow this exact sequence:**

1. Phase 1.1: Add database columns to Supabase
2. Phase 1.2: Create payment calculation utility functions
3. Phase 1.3: Verify Square saves cards (check existing code)
4. Phase 1.4: Create Square invoice helper function
5. Phase 2.1: Add payment plan toggle to booking page
6. Phase 2.2: Store plan selection and pass to payment page
7. Phase 3.1: Read plan from URL on payment page
8. Phase 3.2: Update order summary display with payment schedule
9. Phase 3.3: Add monthly payment branch to payment handler
10. Phase 3.4: Create monthly payment server actions
11. Phase 4.1: Update confirmation page display
12. Phase 5.1: Update confirmation email template
13. Test everything in Square Sandbox
14. Deploy to production

---

## 📐 VISUAL REFERENCE

### Booking Page Toggle Layout:
```
Choose Your Payment Plan
┌──────────────────┐  ┌──────────────────┐
│ ● Pay in Full    │  │ ○ Pay Monthly    │
│ $615 today       │  │ $172 today       │
│ One payment      │  │ Then 2× $222     │
│ ✓ Done & dusted  │  │ 💰 $50 off!      │
└──────────────────┘  └──────────────────┘
```

### Payment Page Schedule Display:
```
PAYMENT SCHEDULE
─────────────────────────
Today (Month 1):
  First month       $222
  Deposit credit    -$50 💰
  ─────────────────
  Due now:          $172 ✓

Apr 15 (Month 2):   $222 🔄
May 15 (Month 3):   $221 🔄
─────────────────────────
Total:              $665

✓ Charged today
🔄 Auto-charged later
```

---

## 🤖 VERIFICATION PROMPT FOR CURSOR

**PASTE THIS INTO CURSOR AFTER READING THIS GUIDE:**

"I have read the MONTHLY_PAYMENTS_GUIDE.md file. Before we start implementing, please generate a response that I can share with Claude.ai to verify you understood everything correctly.

Your response should include:

1. IMPLEMENTATION PLAN: List all 14 steps in order with brief description of what each step does

2. FILES TO CREATE: List all new files that need to be created

3. FILES TO MODIFY: List all existing files that will be modified

4. DATABASE CHANGES: Describe the Supabase schema changes in plain English

5. PAYMENT LOGIC: Explain in your own words how the monthly payment calculation works (including the $50 credit)

6. SQUARE API APPROACH: Confirm we're using Square Invoices API (NOT Subscriptions) and why

7. UI CHANGES: Describe where payment plan toggle appears and what it looks like

8. CRITICAL SAFETY CHECKS: List the things you will NOT break (e.g., existing pay in full flow)

9. TESTING REQUIREMENTS: What needs to be tested before production

10. QUESTIONS/CONCERNS: Any parts of the guide that are unclear or need clarification before starting

Format your response as a numbered list so it's easy to copy and paste back to Claude.ai for verification."

---

**END OF GUIDE**
