# Accountant Salary Calculation System - Complete Guide

## Overview
The accountant calculates salaries for three staff categories:
1. **Field Staff** - Weekly wages
2. **Delivery Staff** - Weekly wages  
3. **Lab Staff** - Monthly salary

## Current System Features

### ✅ Already Implemented:
1. **Wage Calculator** - Real-time calculation with earnings and deductions
2. **Staff Selection** - Select individual staff or "All Staff"
3. **Salary Generation** - Generate salary records for selected period
4. **Approval Workflow** - Draft → Approved → Paid
5. **Edit Functionality** - Edit draft salary records
6. **Payslip Generation** - Download/view payslips
7. **Salary History** - View all salary records by year

## Salary Calculation Rules

### 1. Field Staff (Weekly Wages)

**Formula:**
```
Base Earnings = Daily Wage × Days Worked
Overtime Earnings = OT Hours × OT Rate
Gross Salary = Base Earnings + Overtime + Allowances
Total Deductions = PF + Professional Tax + Income Tax + Other
Net Pay = Gross Salary - Total Deductions
```

**Example Calculation:**
```
Daily Wage: ₹500
Days Worked: 6 days
OT Hours: 4 hours
OT Rate: ₹75/hour
Allowance: ₹200

Base Earnings = ₹500 × 6 = ₹3,000
OT Earnings = 4 × ₹75 = ₹300
Gross = ₹3,000 + ₹300 + ₹200 = ₹3,500

Deductions:
- PF (5%): ₹175
- Prof Tax: ₹0
- Income Tax: ₹0
Total Deductions = ₹175

Net Pay = ₹3,500 - ₹175 = ₹3,325
```

### 2. Delivery Staff (Weekly Wages)

**Formula:**
```
Base Earnings = Daily Wage × Days Worked
Delivery Bonus = Performance-based bonus
Overtime Earnings = OT Hours × OT Rate
Gross Salary = Base Earnings + Delivery Bonus + Overtime + Allowances
Total Deductions = PF + Professional Tax + Income Tax + Other
Net Pay = Gross Salary - Total Deductions
```

**Example Calculation:**
```
Daily Wage: ₹600
Days Worked: 6 days
Delivery Bonus: ₹500
OT Hours: 2 hours
OT Rate: ₹90/hour
Allowance: ₹300

Base Earnings = ₹600 × 6 = ₹3,600
Delivery Bonus = ₹500
OT Earnings = 2 × ₹90 = ₹180
Gross = ₹3,600 + ₹500 + ₹180 + ₹300 = ₹4,580

Deductions:
- PF (5%): ₹229
- Prof Tax: ₹0
- Income Tax: ₹0
Total Deductions = ₹229

Net Pay = ₹4,580 - ₹229 = ₹4,351
```

### 3. Lab Staff (Monthly Salary)

**Formula:**
```
Basic Pay = Fixed monthly salary
HRA = 40% of Basic Pay
Medical Allowance = Fixed amount
Transport Allowance = Fixed amount
Gross Salary = Basic + HRA + Medical + Transport + Other Allowances
Total Deductions = PF (12% of Basic) + Professional Tax + Income Tax + Other
Net Salary = Gross Salary - Total Deductions
```

**Example Calculation:**
```
Basic Pay: ₹25,000
HRA (40%): ₹10,000
Medical: ₹2,000
Transport: ₹1,500

Gross = ₹25,000 + ₹10,000 + ₹2,000 + ₹1,500 = ₹38,500

Deductions:
- PF (12% of Basic): ₹3,000
- Prof Tax: ₹200
- Income Tax (5%): ₹1,925
Total Deductions = ₹5,125

Net Salary = ₹38,500 - ₹5,125 = ₹33,375
```

## How to Use the System

### Step 1: Open Wage Calculator
1. Navigate to **Salaries** page
2. Click **"Show Calculator"** button
3. Calculator appears with Earnings and Deductions columns

### Step 2: Calculate Salary

**For Field Staff / Delivery Staff (Weekly):**
1. Enter **Daily Wage** (e.g., 500)
2. Enter **Days Worked** (e.g., 6)
3. Enter **OT Hours** (e.g., 4)
4. Enter **OT Rate** (e.g., 75)
5. Enter **Allowance** (e.g., 200)
6. Enter **PF** (usually 5% of gross)
7. Enter **Professional Tax** (if applicable)
8. Enter **Income Tax** (if applicable)
9. System automatically calculates:
   - **Gross**: Total earnings
   - **Deductions**: Total deductions
   - **Net**: Final pay amount

**For Lab Staff (Monthly):**
1. Calculate manually:
   - Basic Pay + HRA (40%) + Allowances = Gross
   - PF (12% of Basic) + Taxes = Deductions
2. Enter **Gross Salary** in calculator
3. Enter all deductions
4. System shows Net Salary

### Step 3: Generate Salary Record
1. Select **Staff Member** from dropdown
2. Select **Month** (1-12)
3. Select **Year**
4. Click **"Generate Record"**
5. System creates salary record with status "draft"

### Step 4: Review & Edit (if needed)
1. View generated record in table
2. Click **"Edit"** button if adjustments needed
3. Modify Gross Salary or Deductions
4. Click **"Update"** to save changes

### Step 5: Approve Salary
1. Review the salary record
2. Click **"Approve"** button
3. Status changes to "approved"

### Step 6: Mark as Paid
1. Click **"Mark Paid"** button
2. Enter payment method (cash/bank/upi)
3. Enter payment reference (optional)
4. Confirm payment
5. Status changes to "paid"

### Step 7: Generate Payslip
1. Click **"Payslip"** link
2. Payslip opens in new tab
3. Download or print for employee

## Payslip Format

### Weekly Payslip (Field Staff / Delivery Staff)
```
═══════════════════════════════════════════════════════════
                    HOLY FAMILY POLYMERS
                      WEEKLY WAGE SLIP
═══════════════════════════════════════════════════════════

Employee: John Doe                         ID: FS001
Role: Field Staff                          Week: 1/2026
Period: Jan 1 - Jan 7, 2026               Payment: Jan 8, 2026

───────────────────────────────────────────────────────────
EARNINGS                                           AMOUNT (₹)
───────────────────────────────────────────────────────────
Daily Wage (₹500 × 6 days)                          3,000.00
Overtime (4 hrs @ ₹75/hr)                             300.00
Allowance                                             200.00
                                                  ───────────
GROSS EARNINGS                                      3,500.00

───────────────────────────────────────────────────────────
DEDUCTIONS                                         AMOUNT (₹)
───────────────────────────────────────────────────────────
Provident Fund (5%)                                   175.00
                                                  ───────────
TOTAL DEDUCTIONS                                      175.00

───────────────────────────────────────────────────────────
NET PAY                                             3,325.00
═══════════════════════════════════════════════════════════
```

### Monthly Payslip (Lab Staff)
```
═══════════════════════════════════════════════════════════
                    HOLY FAMILY POLYMERS
                      MONTHLY SALARY SLIP
═══════════════════════════════════════════════════════════

Employee: Jane Smith                       ID: LAB001
Role: Lab Technician                       Month: Jan 2026
Department: Laboratory                     Payment: Feb 1, 2026

───────────────────────────────────────────────────────────
EARNINGS                                           AMOUNT (₹)
───────────────────────────────────────────────────────────
Basic Pay                                          25,000.00
House Rent Allowance (40%)                         10,000.00
Medical Allowance                                   2,000.00
Transport Allowance                                 1,500.00
                                                  ───────────
GROSS SALARY                                       38,500.00

───────────────────────────────────────────────────────────
DEDUCTIONS                                         AMOUNT (₹)
───────────────────────────────────────────────────────────
Provident Fund (12%)                                3,000.00
Professional Tax                                      200.00
Income Tax (5%)                                     1,925.00
                                                  ───────────
TOTAL DEDUCTIONS                                    5,125.00

───────────────────────────────────────────────────────────
NET SALARY                                         33,375.00
═══════════════════════════════════════════════════════════
```

## Quick Reference

### Deduction Rates
- **PF (Provident Fund)**:
  - Weekly Staff: 5% of gross
  - Monthly Staff: 12% of basic pay
- **Professional Tax**: ₹200/month (for monthly staff)
- **Income Tax**: 
  - Weekly Staff: Usually 0% (low income)
  - Monthly Staff: 5-10% based on salary slab

### Payment Cycles
- **Field Staff**: Weekly (every 7 days)
- **Delivery Staff**: Weekly (every 7 days)
- **Lab Staff**: Monthly (end of month)

### Status Workflow
```
Draft → Approved → Paid
  ↓        ↓         ↓
 Edit    Mark Paid  Final
```

## Tips for Accountant

1. **Use Calculator First**: Always calculate salary in calculator before generating record
2. **Copy Net Amount**: Use "Copy Net" button to copy calculated amount
3. **Bulk Generation**: Use "All Staff" option to generate salaries for everyone at once
4. **Review Before Approval**: Always review draft records before approving
5. **Keep Records**: Download payslips for company records
6. **Track Payments**: Mark as paid only after actual payment is made

## System Benefits

✅ **Automated Calculations** - Real-time calculation with instant results
✅ **Error Prevention** - Validation ensures correct calculations
✅ **Audit Trail** - Complete history of all salary records
✅ **Workflow Management** - Draft → Approved → Paid workflow
✅ **Payslip Generation** - Professional payslips for employees
✅ **Bulk Processing** - Generate salaries for all staff at once
✅ **Edit Capability** - Modify draft records before approval
✅ **Payment Tracking** - Track payment status and method

## Summary

The Accountant Salary System provides a complete solution for calculating and managing salaries for Field Staff, Delivery Staff, and Lab Staff. The system handles:

- **Weekly wages** for field and delivery staff
- **Monthly salaries** for lab staff
- **Automatic calculations** with real-time updates
- **Professional payslips** for all staff
- **Complete workflow** from draft to payment
- **Audit trail** for all transactions

The accountant can efficiently calculate, generate, approve, and track all salary payments through this comprehensive system.
