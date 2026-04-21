# Performance KPI Dashboard

A GitHub Pages–ready dashboard generated from **Performance_Sheet_2026(1).xlsx**.

## What is included
- Search by **Tahoe ID**
- Search by **ERP / HRMS ID**
- Search by **Staff Name**
- Filter by month, status, designation, location, and product
- KPI cards for headcount, active staff, revenue, cards, loans, and accounts
- Charts for monthly trend, headcount, designation split, and top performers
- Full staff drilldown modal with all KPI values
- Download filtered JSON from the browser

## KPI groups
### Compensation KPIs
- MOL Salary Tahoe
- Paid MOL Salary
- ENBD Inc
- Rak CC Inc
- RAK PF Inc
- DIB PF Inc
- EIB PF Inc
- CBD FAB DIB Inc
- EIB CC Inc
- Incentive
- Total MOL+Incentive
- Clawback Deduction

### Volume KPIs
- ENBD CC
- RAK CC
- FAB CC
- CBD CC
- DIB CC
- EIB CC
- Total CC
- ENBD Loan
- ENBD AL
- RAK Loan
- RAK SME
- DIB loan
- EIB loan
- DEEM Loan
- SIB Loan
- WIO Loan
- FAB Loan
- Total Loan
- WIO Accounts
- FAB Accounts
- Total Accounts

### Revenue KPIs
- ENBD CC Revenue
- ENBD PF Revenue
- RAK CC Revenue
- RAK PF Revenue
- EIB PF Revenue
- RAK SME Loan
- FAB CC Revenue
- CBD CC Revenue
- DIB CC Revenue
- DIB PF Revenue
- EIB CC Revenue
- DEEM Loan Revenue
- SIB Loan__2
- WIO Loan__2
- FAB Loan__2
- WIO Accounts Revenue
- FAB Accounts Revenue
- Total Card Revenue
- Total Loan Revenue
- Total Accounts Revenue
- Total Revenue

## Local preview
Open `index.html` directly, or use a simple local server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`

## Push to GitHub
```bash
git init
git add .
git commit -m "Initial performance dashboard"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/performance-dashboard.git
git push -u origin main
```

## Enable GitHub Pages
1. Go to **Settings**
2. Open **Pages**
3. Under **Build and deployment**, choose **Deploy from a branch**
4. Select **main** and the **root** folder
5. Save

Your dashboard will be published as a static site.

## Files
- `index.html`
- `styles.css`
- `app.js`
- `data/dashboard-data.json`


## Deployment note
This fixed version includes inline data loading for more reliable GitHub Pages deployment.
