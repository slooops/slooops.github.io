"""
SQL Validator Module for Natural Language to SQL queries.
Provides security safeguards and semantic mapping for subscription data.
"""

import re
from typing import Dict, List, Optional

# Allowed tables (Oracle views)
ALLOWED_TABLES = [
    # Subscription views
    "XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V",
    "XXCFIANR.XXCFIR_SUBSCRIPTION_ORDERS_V",
    "XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V",
    "XXCFIR_SUBSCRIPTION_HEADERS_V",
    "XXCFIR_SUBSCRIPTION_ORDERS_V",
    "XXCFIR_SUBSCRIPTION_ORDER_LINES_V",
    "HEADERS_V",
    "ORDERS_V",
    "ORDER_LINES_V",
    # Invoice views
    "XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V",
    "XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICE_LINES_V",
    "XXCFIANR.XXCFIR_SUBSCRIPTION_AR_DISTRIBUTIONS_V",
    "XXCFIANR.XXCFIR_SUBSCRIPTION_ROL_DISTRIBUTIONS_V",
    "XXCFIR_SUBSCRIPTION_INVOICES_V",
    "XXCFIR_SUBSCRIPTION_INVOICE_LINES_V",
    "XXCFIR_SUBSCRIPTION_AR_DISTRIBUTIONS_V",
    "XXCFIR_SUBSCRIPTION_ROL_DISTRIBUTIONS_V",
    "INVOICES_V",
    "INVOICE_LINES_V",
    "AR_DISTRIBUTIONS_V",
    "ROL_DISTRIBUTIONS_V",
    # Common aliases
    "H",
    "O",
    "L",
    "I",
    "IL",
    "AR",
    "ROL",
]

# Blocked SQL keywords - operations that modify data
BLOCKED_KEYWORDS = [
    "DELETE", "DROP", "UPDATE", "INSERT", "TRUNCATE", "ALTER", 
    "CREATE", "GRANT", "REVOKE", "EXECUTE", "MERGE", "CALL",
    "COMMIT", "ROLLBACK", "SAVEPOINT", "LOCK", "UNLOCK"
]

# Maximum rows to return
MAX_ROWS = 500

# Query timeout in seconds
QUERY_TIMEOUT = 30

# Schema context for LLM
SCHEMA_CONTEXT = """
DATABASE SCHEMA - Oracle Views for Cisco Subscription Finance Data:

================================================================================
TABLE 1: XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V (alias: h)
Purpose: Master subscription records with customer and contract metadata
================================================================================
Columns:
- SUBSCRIPTION_REF_ID (VARCHAR2) - Primary key, unique subscription identifier (e.g., 'Sub2249000', 'Sub399987')
- BILL_TO_CUSTOMER (VARCHAR2) - Customer/partner name (e.g., 'INGRAM MICRO', 'TD SYNNEX CORPORATION', 'RED RIVER COMPUTER CO INC')
- OFFER_TYPE (VARCHAR2) - Product offer category (e.g., 'WEBEX', 'UMBRELLA', 'ELA2', 'DNASUB', 'C1N9300', 'Meraki', 'Duo Standard')
- SUBSC_START_DATE (DATE) - Subscription start date
- SUBSC_END_DATE (DATE) - Subscription end date
- "Term In Months" (NUMBER) - Contract term in months (NOTE: column name has spaces, MUST use double quotes in SQL)
- ENTITY (VARCHAR2) - Cisco business entity (e.g., 'CISCO US OPERATING UNIT', 'CISCO UK HOME OPERATING UNIT', 'CISCO AUSTRALIA OPERATING UNIT')

NOTE: This table has NO financial/amount columns. Use ORDER_LINES_V for values.

================================================================================
TABLE 2: XXCFIANR.XXCFIR_SUBSCRIPTION_ORDERS_V (alias: o)
Purpose: Order-level transactions linked to subscriptions
================================================================================
Columns:
- SUBSCRIPTION_REF_ID (VARCHAR2) - Foreign key to subscription headers
- WEB_ORDER_ID (VARCHAR2) - Unique order identifier
- ATO_ACTION_TYPE_DESC (VARCHAR2) - Order action type:
  * 'NEW' - New subscription order
  * 'AUTO RENEWAL' - Automatic renewal
  * 'MANUAL RENEWAL' - Manual renewal by sales
  * 'MANUAL EXTENSION' - Contract extension
  * 'MODIFY' - Order modification
  * 'REPLACE' - Replacement order
  * 'NONE' - No specific action
- ACTIVATION_DATE (DATE) - When order was activated
- ATO_SKU_NAME (VARCHAR2) - SKU/product name
- END_CUSTOMER (VARCHAR2) - End customer name (may differ from BILL_TO_CUSTOMER)
- CURRENCY (VARCHAR2) - Currency code (e.g., 'USD', 'EUR', 'GBP', 'JPY', 'AUD')
- ROUTE_TO_MARKET (VARCHAR2) - Sales channel
- DEAL_ID (VARCHAR2) - Deal/opportunity identifier
- CUST_PO_NUMBER (VARCHAR2) - Customer purchase order number
- ORDER_REQUESTED_START_DATE (DATE) - Requested service start
- ORDER_BOOKED_DATE (DATE) - When order was booked
- ORDER_END_COMPLETE_DATE (DATE) - Order completion/end date

NOTE: This table has NO financial/amount columns. Use ORDER_LINES_V for values.

================================================================================
TABLE 3: XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V (alias: l)
Purpose: Line-item details with ALL financial amounts and revenue metrics
================================================================================
Columns:
- SUBSCRIPTION_REF_ID (VARCHAR2) - Foreign key to subscription
- WEB_ORDER_ID (VARCHAR2) - Foreign key to order
- LINE_ID (VARCHAR2) - Unique line identifier
- ITEM (VARCHAR2) - Product/item name
- ATO_SKU_NAME (VARCHAR2) - SKU name
- MINOR_LINE_ACTION_TYPE (VARCHAR2) - Line-level action type
- OFFER_TYPE (VARCHAR2) - Offer type for this line
- BILLING_MODEL (VARCHAR2) - Billing model (e.g., 'PREPAID', 'ARREARS')
- CHARGE_TYPE (VARCHAR2) - Type of charge
- LINE_LEVEL_CONTRACT_TERM (NUMBER) - Contract term for this line in months
- START_DATE (DATE) - Line billing start date
- END_DATE (DATE) - Line billing end date
- CURRENCY (VARCHAR2) - Currency code (e.g., 'USD', 'EUR', 'GBP')

FINANCIAL COLUMNS (ALL amounts are in ORDER_LINES_V only):
- SALE_VALUE (NUMBER) - Total sales value for this line
- REVENUE_ACCRUED (NUMBER) - Revenue accrued (earned but not yet recognized)
- REVENUE_RECOGNIZED (NUMBER) - Revenue already recognized
- REVENUE_DEFERRED (NUMBER) - Deferred revenue (collected but not earned)
- INVOICED_AMOUNT (NUMBER) - Amount already invoiced to customer
- CM_AMOUNT (NUMBER) - Credit memo amount
- UNBILLED_AMOUNT (NUMBER) - Amount not yet billed

ELIGIBILITY FLAGS:
- TSV_PROCESS_STATUS (VARCHAR2) - TSV/accruals eligibility ('P' = eligible/processing, other values = not eligible)
- TSV_ELIGIBLE (VARCHAR2) - Legacy TSV eligibility flag (deprecated, use TSV_PROCESS_STATUS instead)
- OA_FLAG (VARCHAR2) - OA indicator flag

================================================================================
RELATIONSHIPS AND JOINS
================================================================================
- HEADERS_V → ORDERS_V: JOIN ON SUBSCRIPTION_REF_ID
- ORDERS_V → ORDER_LINES_V: JOIN ON WEB_ORDER_ID
- HEADERS_V → ORDER_LINES_V: JOIN ON SUBSCRIPTION_REF_ID

Example 3-way join:
SELECT h.BILL_TO_CUSTOMER, o.ATO_ACTION_TYPE_DESC, SUM(l.SALE_VALUE)
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V h
JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_ORDERS_V o ON h.SUBSCRIPTION_REF_ID = o.SUBSCRIPTION_REF_ID
JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V l ON o.WEB_ORDER_ID = l.WEB_ORDER_ID
GROUP BY h.BILL_TO_CUSTOMER, o.ATO_ACTION_TYPE_DESC

================================================================================
CRITICAL RULES - READ CAREFULLY
================================================================================
1. FINANCIAL DATA LOCATION:
   - ALL money amounts (SALE_VALUE, REVENUE_*, UNBILLED_AMOUNT, etc.) are ONLY in ORDER_LINES_V
   - HEADERS_V and ORDERS_V have NO amount columns
   - To get "subscription value" → SUM(l.SALE_VALUE) from ORDER_LINES_V grouped by SUBSCRIPTION_REF_ID

2. CURRENCY FILTERING:
   - Always filter by CURRENCY when comparing amounts (e.g., WHERE CURRENCY = 'USD')
   - CURRENCY is in ORDERS_V and ORDER_LINES_V, NOT in HEADERS_V

3. COUNTING WITH AGGREGATION:
   - To count subscriptions meeting a criteria: use subquery with GROUP BY, then COUNT(*) on outer query
   - Example: SELECT COUNT(*) FROM (SELECT SUBSCRIPTION_REF_ID FROM ... GROUP BY ... HAVING ...)

4. COLUMN WITH SPACES:
   - "Term In Months" must be quoted with double quotes in SQL

================================================================================
BUSINESS TERMINOLOGY MAPPINGS
================================================================================
User says...                    → Use this SQL...
"subscriptions"                 → XXCFIR_SUBSCRIPTION_HEADERS_V
"orders"                        → XXCFIR_SUBSCRIPTION_ORDERS_V
"line items" / "order lines"    → XXCFIR_SUBSCRIPTION_ORDER_LINES_V
"renewals"                      → ATO_ACTION_TYPE_DESC IN ('AUTO RENEWAL', 'MANUAL RENEWAL', 'MANUAL EXTENSION')
"new orders" / "new business"   → ATO_ACTION_TYPE_DESC = 'NEW'
"amendments" / "modifications"  → ATO_ACTION_TYPE_DESC IN ('MODIFY', 'REPLACE')
"customer" / "partner"          → BILL_TO_CUSTOMER (headers) or END_CUSTOMER (orders)
"product" / "offer"             → OFFER_TYPE
"accruals eligible"             → TSV_PROCESS_STATUS = 'P'
"unbilled" / "not billed"       → UNBILLED_AMOUNT > 0
"deferred revenue"              → REVENUE_DEFERRED
"recognized revenue"            → REVENUE_RECOGNIZED
"total value" / "sales value"   → SUM(SALE_VALUE)
"active subscriptions"          → SUBSC_END_DATE >= SYSDATE
"expired subscriptions"         → SUBSC_END_DATE < SYSDATE
"expiring soon" / "expiring in X days" → SUBSC_END_DATE BETWEEN SYSDATE AND SYSDATE + X
"this month"                    → TRUNC(date, 'MM') = TRUNC(SYSDATE, 'MM')
"last month"                    → date >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -1) AND date < TRUNC(SYSDATE, 'MM')
"this quarter"                  → TRUNC(date, 'Q') = TRUNC(SYSDATE, 'Q')
"this year" / "YTD"             → TRUNC(date, 'YYYY') = TRUNC(SYSDATE, 'YYYY')

================================================================================
COMMON QUERY PATTERNS
================================================================================
PATTERN 1: Count with threshold (How many X have Y > N)
SELECT COUNT(*) FROM (
  SELECT SUBSCRIPTION_REF_ID 
  FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V 
  WHERE CURRENCY = 'USD'
  GROUP BY SUBSCRIPTION_REF_ID 
  HAVING SUM(SALE_VALUE) > [threshold]
)

PATTERN 2: Top N by value
SELECT SUBSCRIPTION_REF_ID, SUM(SALE_VALUE) as TOTAL_VALUE 
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V 
WHERE CURRENCY = 'USD'
GROUP BY SUBSCRIPTION_REF_ID 
ORDER BY TOTAL_VALUE DESC
FETCH FIRST 10 ROWS ONLY

PATTERN 3: Breakdown by category
SELECT OFFER_TYPE, COUNT(DISTINCT SUBSCRIPTION_REF_ID) as SUB_COUNT, SUM(SALE_VALUE) as TOTAL_VALUE
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V
GROUP BY OFFER_TYPE
ORDER BY TOTAL_VALUE DESC

PATTERN 4: Date range analysis
SELECT TO_CHAR(ACTIVATION_DATE, 'YYYY-MM') as MONTH, COUNT(*) as ORDER_COUNT
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDERS_V
WHERE ACTIVATION_DATE >= ADD_MONTHS(SYSDATE, -12)
GROUP BY TO_CHAR(ACTIVATION_DATE, 'YYYY-MM')
ORDER BY MONTH

PATTERN 5: Customer summary
SELECT h.BILL_TO_CUSTOMER, COUNT(DISTINCT h.SUBSCRIPTION_REF_ID) as SUB_COUNT, SUM(l.SALE_VALUE) as TOTAL_VALUE
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V h
JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V l ON h.SUBSCRIPTION_REF_ID = l.SUBSCRIPTION_REF_ID
GROUP BY h.BILL_TO_CUSTOMER
ORDER BY TOTAL_VALUE DESC

PATTERN 6: Expiring subscriptions
SELECT SUBSCRIPTION_REF_ID, BILL_TO_CUSTOMER, SUBSC_END_DATE
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V
WHERE SUBSC_END_DATE BETWEEN SYSDATE AND SYSDATE + 30
ORDER BY SUBSC_END_DATE

PATTERN 7: Revenue metrics comparison
SELECT SUBSCRIPTION_REF_ID, 
       SUM(REVENUE_ACCRUED) as ACCRUED,
       SUM(REVENUE_RECOGNIZED) as RECOGNIZED,
       SUM(REVENUE_DEFERRED) as DEFERRED,
       SUM(UNBILLED_AMOUNT) as UNBILLED
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V
GROUP BY SUBSCRIPTION_REF_ID
ORDER BY ACCRUED DESC

================================================================================
TABLE 4: XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V (alias: i)
Purpose: Invoice header records linked to orders and subscriptions
================================================================================
Columns:
- CUSTOMER_TRX_ID (NUMBER) - Primary key, unique invoice transaction identifier
- TRX_NUMBER (VARCHAR2) - Invoice number (human-readable)
- TRANSACTION_TYPE (VARCHAR2) - Type of transaction (e.g., 'Invoice', 'Credit Memo')
- OPERATING_UNIT (VARCHAR2) - Business operating unit
- BATCH_SOURCE_NAME (VARCHAR2) - Invoice batch source
- TRX_DATE (DATE) - Invoice transaction date
- WEB_ORDER_ID (VARCHAR2) - Foreign key to orders
- SUBSCRIPTION_REF_ID (VARCHAR2) - Foreign key to subscription headers
- ATO_SKU_NAME (VARCHAR2) - SKU name for the invoice
- INVOICE_CURRENCY_CODE (VARCHAR2) - Currency code (e.g., 'USD', 'EUR')
- INVOICE_AMOUNT (NUMBER) - Total invoice amount
- AMOUNT_APPLIED (NUMBER) - Amount already applied/paid
- AMOUNT_DUE_REMAINING (NUMBER) - Outstanding balance
- DUE_DATE (DATE) - Payment due date
- TERM_NAME (VARCHAR2) - Payment term name (e.g., 'NET 30', 'NET 60')
- STATUS (VARCHAR2) - Invoice status (e.g., 'OPEN', 'CLOSED', 'PENDING')

================================================================================
TABLE 5: XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICE_LINES_V (alias: il)
Purpose: Invoice line item details
================================================================================
Columns:
- CUSTOMER_TRX_ID (NUMBER) - Foreign key to invoice header
- CUSTOMER_TRX_LINE_ID (NUMBER) - Unique line identifier
- LINE_NUMBER (NUMBER) - Line sequence number
- DESCRIPTION (VARCHAR2) - Line item description
- QUANTITY (NUMBER) - Quantity billed
- UNIT_SELLING_PRICE (NUMBER) - Price per unit
- EXTENDED_AMOUNT (NUMBER) - Line total amount (qty * price)
- REVENUE_AMOUNT (NUMBER) - Revenue amount for this line
- UOM_CODE (VARCHAR2) - Unit of measure
- TAX_AMOUNT (NUMBER) - Tax amount for line
- LINE_TYPE (VARCHAR2) - Type of line (e.g., 'LINE', 'TAX', 'FREIGHT')

================================================================================
TABLE 6: XXCFIANR.XXCFIR_SUBSCRIPTION_AR_DISTRIBUTIONS_V (alias: ar)
Purpose: Accounts Receivable distribution details for invoices
================================================================================
Columns:
- CUSTOMER_TRX_ID (NUMBER) - Foreign key to invoice
- CUST_TRX_LINE_GL_DIST_ID (NUMBER) - Distribution line ID
- ACCOUNT_CLASS (VARCHAR2) - Account classification (e.g., 'REC', 'REV', 'TAX')
- AMOUNT (NUMBER) - Distribution amount
- ACCTD_AMOUNT (NUMBER) - Accounted amount (in functional currency)
- GL_DATE (DATE) - General ledger posting date
- CODE_COMBINATION_ID (NUMBER) - GL account code combination
- SEGMENT1 through SEGMENT6 (VARCHAR2) - GL account segments

================================================================================
TABLE 7: XXCFIANR.XXCFIR_SUBSCRIPTION_ROL_DISTRIBUTIONS_V (alias: rol)
Purpose: Revenue recognition distributions (Revenue Organization Ledger)
================================================================================
Columns:
- CUSTOMER_TRX_ID (NUMBER) - Foreign key to invoice
- REVENUE_DIST_ID (NUMBER) - Revenue distribution ID
- REVENUE_TYPE (VARCHAR2) - Type of revenue (e.g., 'DEFERRED', 'RECOGNIZED')
- AMOUNT (NUMBER) - Revenue distribution amount
- RECOGNITION_DATE (DATE) - When revenue was recognized
- ACCOUNTING_PERIOD (VARCHAR2) - Accounting period name
- DEFERRAL_START_DATE (DATE) - Start of deferral period
- DEFERRAL_END_DATE (DATE) - End of deferral period

================================================================================
INVOICE RELATIONSHIPS AND JOINS
================================================================================
- ORDERS_V → INVOICES_V: JOIN ON WEB_ORDER_ID
- HEADERS_V → INVOICES_V: JOIN ON SUBSCRIPTION_REF_ID
- INVOICES_V → INVOICE_LINES_V: JOIN ON CUSTOMER_TRX_ID
- INVOICES_V → AR_DISTRIBUTIONS_V: JOIN ON CUSTOMER_TRX_ID
- INVOICES_V → ROL_DISTRIBUTIONS_V: JOIN ON CUSTOMER_TRX_ID

Example Invoice Analysis:
SELECT i.TRX_NUMBER, i.INVOICE_AMOUNT, i.AMOUNT_DUE_REMAINING, i.STATUS
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i
WHERE i.STATUS = 'OPEN' AND i.AMOUNT_DUE_REMAINING > 0
ORDER BY i.AMOUNT_DUE_REMAINING DESC

Example Invoice with Lines:
SELECT i.TRX_NUMBER, il.DESCRIPTION, il.EXTENDED_AMOUNT
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i
JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICE_LINES_V il ON i.CUSTOMER_TRX_ID = il.CUSTOMER_TRX_ID
WHERE i.TRX_NUMBER = '12345'

Example Order to Invoice:
SELECT o.WEB_ORDER_ID, i.TRX_NUMBER, i.INVOICE_AMOUNT, i.STATUS
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDERS_V o
JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i ON o.WEB_ORDER_ID = i.WEB_ORDER_ID
WHERE o.SUBSCRIPTION_REF_ID = 'Sub123456'

================================================================================
INVOICE TERMINOLOGY MAPPINGS
================================================================================
User says...                           → Use this SQL...
"invoices"                             → XXCFIR_SUBSCRIPTION_INVOICES_V
"invoice lines" / "line items"         → XXCFIR_SUBSCRIPTION_INVOICE_LINES_V
"AR" / "accounts receivable"           → XXCFIR_SUBSCRIPTION_AR_DISTRIBUTIONS_V
"revenue recognition" / "ROL"          → XXCFIR_SUBSCRIPTION_ROL_DISTRIBUTIONS_V
"open invoices" / "unpaid invoices"    → STATUS = 'OPEN' AND AMOUNT_DUE_REMAINING > 0
"overdue invoices" / "past due"        → DUE_DATE < SYSDATE AND AMOUNT_DUE_REMAINING > 0
"paid invoices"                        → STATUS = 'CLOSED' OR AMOUNT_DUE_REMAINING = 0
"invoice amount" / "billed amount"     → INVOICE_AMOUNT
"outstanding" / "balance due"          → AMOUNT_DUE_REMAINING
"payment applied"                      → AMOUNT_APPLIED
"credit memo"                          → TRANSACTION_TYPE = 'Credit Memo'
"deferred revenue"                     → REVENUE_TYPE = 'DEFERRED' in ROL_DISTRIBUTIONS_V
"recognized revenue"                   → REVENUE_TYPE = 'RECOGNIZED' in ROL_DISTRIBUTIONS_V

================================================================================
INVOICE QUERY PATTERNS
================================================================================
PATTERN 8: Open invoices by customer
SELECT h.BILL_TO_CUSTOMER, COUNT(*) as INVOICE_COUNT, SUM(i.AMOUNT_DUE_REMAINING) as TOTAL_DUE
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V h
JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i ON h.SUBSCRIPTION_REF_ID = i.SUBSCRIPTION_REF_ID
WHERE i.STATUS = 'OPEN' AND i.AMOUNT_DUE_REMAINING > 0
GROUP BY h.BILL_TO_CUSTOMER
ORDER BY TOTAL_DUE DESC

PATTERN 9: Overdue invoices
SELECT i.TRX_NUMBER, i.INVOICE_AMOUNT, i.AMOUNT_DUE_REMAINING, i.DUE_DATE,
       ROUND(SYSDATE - i.DUE_DATE) as DAYS_OVERDUE
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i
WHERE i.DUE_DATE < SYSDATE AND i.AMOUNT_DUE_REMAINING > 0
ORDER BY DAYS_OVERDUE DESC

PATTERN 10: Invoice aging summary
SELECT 
  CASE 
    WHEN SYSDATE - DUE_DATE <= 30 THEN '0-30 days'
    WHEN SYSDATE - DUE_DATE <= 60 THEN '31-60 days'
    WHEN SYSDATE - DUE_DATE <= 90 THEN '61-90 days'
    ELSE 'Over 90 days'
  END as AGING_BUCKET,
  COUNT(*) as INVOICE_COUNT,
  SUM(AMOUNT_DUE_REMAINING) as TOTAL_DUE
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V
WHERE AMOUNT_DUE_REMAINING > 0 AND DUE_DATE < SYSDATE
GROUP BY CASE 
    WHEN SYSDATE - DUE_DATE <= 30 THEN '0-30 days'
    WHEN SYSDATE - DUE_DATE <= 60 THEN '31-60 days'
    WHEN SYSDATE - DUE_DATE <= 90 THEN '61-90 days'
    ELSE 'Over 90 days'
  END
ORDER BY AGING_BUCKET

PATTERN 11: Revenue recognition trend
SELECT TO_CHAR(RECOGNITION_DATE, 'YYYY-MM') as MONTH, 
       SUM(CASE WHEN REVENUE_TYPE = 'RECOGNIZED' THEN AMOUNT ELSE 0 END) as RECOGNIZED,
       SUM(CASE WHEN REVENUE_TYPE = 'DEFERRED' THEN AMOUNT ELSE 0 END) as DEFERRED
FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ROL_DISTRIBUTIONS_V
WHERE RECOGNITION_DATE >= ADD_MONTHS(SYSDATE, -12)
GROUP BY TO_CHAR(RECOGNITION_DATE, 'YYYY-MM')
ORDER BY MONTH
"""

# SQL generation prompt
SQL_GENERATION_PROMPT = f"""You are a SQL expert. Generate Oracle SQL queries based on natural language questions.

{SCHEMA_CONTEXT}

RULES:
1. ONLY generate SELECT queries - no modifications allowed
2. Always use the full schema prefix: XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V, etc.
3. Use table aliases (h, o, l) for readability
4. Always add ROWNUM <= {MAX_ROWS} or FETCH FIRST {MAX_ROWS} ROWS ONLY to limit results
5. Use proper Oracle SQL syntax (not MySQL or PostgreSQL)
6. For date comparisons, use SYSDATE for current date
7. Format dates using TO_DATE() or TO_CHAR() as needed
8. Return ONLY the SQL query, no explanations

Examples:
Q: Show all subscriptions
A: SELECT * FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V h WHERE ROWNUM <= {MAX_ROWS}

Q: Show renewals from last month
A: SELECT * FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDERS_V o WHERE o.ATO_ACTION_TYPE_DESC IN ('AUTO RENEWAL', 'MANUAL RENEWAL', 'MANUAL EXTENSION') AND o.ACTIVATION_DATE >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -1) AND o.ACTIVATION_DATE < TRUNC(SYSDATE, 'MM') AND ROWNUM <= {MAX_ROWS}

Q: How many subscriptions have a total value greater than 100000 USD
A: SELECT COUNT(*) as SUBSCRIPTION_COUNT FROM (SELECT SUBSCRIPTION_REF_ID FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V WHERE CURRENCY = 'USD' GROUP BY SUBSCRIPTION_REF_ID HAVING SUM(SALE_VALUE) > 100000)

Q: Subscriptions with total value greater than 100000
A: SELECT SUBSCRIPTION_REF_ID, CURRENCY, SUM(SALE_VALUE) as TOTAL_VALUE FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V WHERE CURRENCY = 'USD' GROUP BY SUBSCRIPTION_REF_ID, CURRENCY HAVING SUM(SALE_VALUE) > 100000 ORDER BY TOTAL_VALUE DESC

Q: Top 10 customers by total sales value
A: SELECT h.BILL_TO_CUSTOMER, SUM(l.SALE_VALUE) as TOTAL_VALUE FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V h JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V l ON h.SUBSCRIPTION_REF_ID = l.SUBSCRIPTION_REF_ID WHERE l.CURRENCY = 'USD' GROUP BY h.BILL_TO_CUSTOMER ORDER BY TOTAL_VALUE DESC FETCH FIRST 10 ROWS ONLY

Q: Subscriptions expiring in the next 30 days
A: SELECT SUBSCRIPTION_REF_ID, BILL_TO_CUSTOMER, OFFER_TYPE, SUBSC_END_DATE FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V WHERE SUBSC_END_DATE BETWEEN SYSDATE AND SYSDATE + 30 ORDER BY SUBSC_END_DATE

Q: Total revenue by offer type
A: SELECT l.OFFER_TYPE, SUM(l.SALE_VALUE) as TOTAL_SALES, SUM(l.REVENUE_RECOGNIZED) as RECOGNIZED, SUM(l.REVENUE_DEFERRED) as DEFERRED FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V l GROUP BY l.OFFER_TYPE ORDER BY TOTAL_SALES DESC

Q: Count of orders by action type
A: SELECT o.ATO_ACTION_TYPE_DESC, COUNT(*) as ORDER_COUNT FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDERS_V o GROUP BY o.ATO_ACTION_TYPE_DESC ORDER BY ORDER_COUNT DESC

Q: Total unbilled amount by customer
A: SELECT h.BILL_TO_CUSTOMER, SUM(l.UNBILLED_AMOUNT) as TOTAL_UNBILLED FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V h JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V l ON h.SUBSCRIPTION_REF_ID = l.SUBSCRIPTION_REF_ID WHERE l.CURRENCY = 'USD' GROUP BY h.BILL_TO_CUSTOMER HAVING SUM(l.UNBILLED_AMOUNT) > 0 ORDER BY TOTAL_UNBILLED DESC

Q: Monthly order trend for the last 12 months
A: SELECT TO_CHAR(o.ACTIVATION_DATE, 'YYYY-MM') as MONTH, COUNT(*) as ORDER_COUNT FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDERS_V o WHERE o.ACTIVATION_DATE >= ADD_MONTHS(SYSDATE, -12) GROUP BY TO_CHAR(o.ACTIVATION_DATE, 'YYYY-MM') ORDER BY MONTH

Q: Subscriptions by entity
A: SELECT ENTITY, COUNT(*) as SUB_COUNT FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V GROUP BY ENTITY ORDER BY SUB_COUNT DESC

Q: Average subscription value by offer type
A: SELECT OFFER_TYPE, AVG(TOTAL_VALUE) as AVG_VALUE FROM (SELECT SUBSCRIPTION_REF_ID, OFFER_TYPE, SUM(SALE_VALUE) as TOTAL_VALUE FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V WHERE CURRENCY = 'USD' GROUP BY SUBSCRIPTION_REF_ID, OFFER_TYPE) GROUP BY OFFER_TYPE ORDER BY AVG_VALUE DESC

Q: Subscriptions with deferred revenue greater than recognized revenue
A: SELECT SUBSCRIPTION_REF_ID, SUM(REVENUE_DEFERRED) as DEFERRED, SUM(REVENUE_RECOGNIZED) as RECOGNIZED FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V GROUP BY SUBSCRIPTION_REF_ID HAVING SUM(REVENUE_DEFERRED) > SUM(REVENUE_RECOGNIZED) ORDER BY DEFERRED DESC

Q: New orders this quarter
A: SELECT * FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDERS_V o WHERE o.ATO_ACTION_TYPE_DESC = 'NEW' AND o.ACTIVATION_DATE >= TRUNC(SYSDATE, 'Q') AND ROWNUM <= {MAX_ROWS}

Q: What is the total value of WEBEX subscriptions
A: SELECT SUM(l.SALE_VALUE) as TOTAL_VALUE, l.CURRENCY FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ORDER_LINES_V l WHERE l.OFFER_TYPE = 'WEBEX' GROUP BY l.CURRENCY ORDER BY TOTAL_VALUE DESC

Q: Show all open invoices
A: SELECT i.TRX_NUMBER, i.INVOICE_AMOUNT, i.AMOUNT_DUE_REMAINING, i.DUE_DATE, i.STATUS FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i WHERE i.STATUS = 'OPEN' AND i.AMOUNT_DUE_REMAINING > 0 ORDER BY i.AMOUNT_DUE_REMAINING DESC FETCH FIRST {MAX_ROWS} ROWS ONLY

Q: Show overdue invoices
A: SELECT i.TRX_NUMBER, i.INVOICE_AMOUNT, i.AMOUNT_DUE_REMAINING, i.DUE_DATE, ROUND(SYSDATE - i.DUE_DATE) as DAYS_OVERDUE FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i WHERE i.DUE_DATE < SYSDATE AND i.AMOUNT_DUE_REMAINING > 0 ORDER BY DAYS_OVERDUE DESC FETCH FIRST {MAX_ROWS} ROWS ONLY

Q: Total outstanding amount by customer
A: SELECT h.BILL_TO_CUSTOMER, COUNT(*) as INVOICE_COUNT, SUM(i.AMOUNT_DUE_REMAINING) as TOTAL_DUE FROM XXCFIANR.XXCFIR_SUBSCRIPTION_HEADERS_V h JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i ON h.SUBSCRIPTION_REF_ID = i.SUBSCRIPTION_REF_ID WHERE i.AMOUNT_DUE_REMAINING > 0 GROUP BY h.BILL_TO_CUSTOMER ORDER BY TOTAL_DUE DESC

Q: Invoice aging report
A: SELECT CASE WHEN SYSDATE - DUE_DATE <= 30 THEN '0-30 days' WHEN SYSDATE - DUE_DATE <= 60 THEN '31-60 days' WHEN SYSDATE - DUE_DATE <= 90 THEN '61-90 days' ELSE 'Over 90 days' END as AGING_BUCKET, COUNT(*) as INVOICE_COUNT, SUM(AMOUNT_DUE_REMAINING) as TOTAL_DUE FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V WHERE AMOUNT_DUE_REMAINING > 0 AND DUE_DATE < SYSDATE GROUP BY CASE WHEN SYSDATE - DUE_DATE <= 30 THEN '0-30 days' WHEN SYSDATE - DUE_DATE <= 60 THEN '31-60 days' WHEN SYSDATE - DUE_DATE <= 90 THEN '61-90 days' ELSE 'Over 90 days' END ORDER BY AGING_BUCKET

Q: Total invoiced amount this month
A: SELECT SUM(i.INVOICE_AMOUNT) as TOTAL_INVOICED, i.INVOICE_CURRENCY_CODE FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i WHERE TRUNC(i.TRX_DATE, 'MM') = TRUNC(SYSDATE, 'MM') GROUP BY i.INVOICE_CURRENCY_CODE

Q: Invoices for a specific subscription
A: SELECT i.TRX_NUMBER, i.INVOICE_AMOUNT, i.AMOUNT_DUE_REMAINING, i.TRX_DATE, i.STATUS FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i WHERE i.SUBSCRIPTION_REF_ID = 'Sub123456' ORDER BY i.TRX_DATE DESC

Q: Credit memos this year
A: SELECT i.TRX_NUMBER, i.INVOICE_AMOUNT, i.TRX_DATE, i.SUBSCRIPTION_REF_ID FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i WHERE i.TRANSACTION_TYPE = 'Credit Memo' AND TRUNC(i.TRX_DATE, 'YYYY') = TRUNC(SYSDATE, 'YYYY') ORDER BY i.TRX_DATE DESC

Q: Revenue recognized vs deferred by month
A: SELECT TO_CHAR(RECOGNITION_DATE, 'YYYY-MM') as MONTH, SUM(CASE WHEN REVENUE_TYPE = 'RECOGNIZED' THEN AMOUNT ELSE 0 END) as RECOGNIZED, SUM(CASE WHEN REVENUE_TYPE = 'DEFERRED' THEN AMOUNT ELSE 0 END) as DEFERRED FROM XXCFIANR.XXCFIR_SUBSCRIPTION_ROL_DISTRIBUTIONS_V WHERE RECOGNITION_DATE >= ADD_MONTHS(SYSDATE, -12) GROUP BY TO_CHAR(RECOGNITION_DATE, 'YYYY-MM') ORDER BY MONTH

Q: Top 10 invoices by amount
A: SELECT i.TRX_NUMBER, i.INVOICE_AMOUNT, i.INVOICE_CURRENCY_CODE, i.TRX_DATE, i.STATUS FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i ORDER BY i.INVOICE_AMOUNT DESC FETCH FIRST 10 ROWS ONLY

Q: Show invoice line items for invoice 12345
A: SELECT il.LINE_NUMBER, il.DESCRIPTION, il.QUANTITY, il.UNIT_SELLING_PRICE, il.EXTENDED_AMOUNT FROM XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICES_V i JOIN XXCFIANR.XXCFIR_SUBSCRIPTION_INVOICE_LINES_V il ON i.CUSTOMER_TRX_ID = il.CUSTOMER_TRX_ID WHERE i.TRX_NUMBER = '12345' ORDER BY il.LINE_NUMBER

Q: AR distributions summary by account class
A: SELECT ACCOUNT_CLASS, COUNT(*) as DIST_COUNT, SUM(AMOUNT) as TOTAL_AMOUNT FROM XXCFIANR.XXCFIR_SUBSCRIPTION_AR_DISTRIBUTIONS_V GROUP BY ACCOUNT_CLASS ORDER BY TOTAL_AMOUNT DESC
"""


def validate_sql(sql: str) -> Dict:
    """
    Validate SQL query for safety and correctness.
    
    Returns:
        dict with keys:
        - valid: bool
        - error: str (if not valid)
        - sql: str (sanitized SQL if valid)
        - tables: list of tables used
    """
    if not sql or not sql.strip():
        return {"valid": False, "error": "Empty SQL query"}
    
    sql = sql.strip()
    sql_upper = sql.upper()
    
    # 1. Must start with SELECT
    if not sql_upper.startswith("SELECT"):
        return {"valid": False, "error": "Only SELECT queries are allowed"}
    
    # 2. Check for blocked keywords
    for keyword in BLOCKED_KEYWORDS:
        # Use word boundary to avoid false positives (e.g., "UPDATED_DATE")
        pattern = r'\b' + keyword + r'\b'
        if re.search(pattern, sql_upper):
            return {"valid": False, "error": f"Blocked operation: {keyword}"}
    
    # 3. Check for multiple statements (SQL injection attempt)
    # Remove strings first to avoid false positives
    sql_no_strings = re.sub(r"'[^']*'", "", sql)
    if ";" in sql_no_strings[:-1]:  # Allow trailing semicolon
        return {"valid": False, "error": "Multiple statements not allowed"}
    
    # 4. Extract table names (basic extraction)
    tables = extract_tables(sql)
    
    # 5. Validate tables against whitelist
    for table in tables:
        table_upper = table.upper()
        if not any(allowed.upper() in table_upper or table_upper in allowed.upper() 
                   for allowed in ALLOWED_TABLES):
            # Allow if it's a subquery alias or CTE
            if not re.match(r'^[A-Z][A-Z0-9_]*$', table_upper) or len(table) > 3:
                # More strict check - must contain our view names (including invoice views)
                valid_patterns = ["SUBSCRIPTION", "HEADERS", "ORDERS", "LINES", "INVOICES", "AR_DISTRIBUTIONS", "ROL_DISTRIBUTIONS"]
                if not any(view in table_upper for view in valid_patterns):
                    return {"valid": False, "error": f"Table not allowed: {table}"}
    
    # 6. Add row limit if not present (skip for aggregate queries)
    has_row_limit = "ROWNUM" in sql_upper or "FETCH FIRST" in sql_upper or "FETCH NEXT" in sql_upper
    has_aggregate = bool(re.search(r'\b(COUNT|SUM|AVG|MIN|MAX)\s*\(', sql_upper))
    has_group_by = "GROUP BY" in sql_upper
    
    # Skip row limit for:
    # - Queries that already have a row limit
    # - Simple aggregate queries (COUNT(*), SUM(*) without GROUP BY)
    # - Aggregate queries with GROUP BY (the grouping naturally limits results)
    # - Subqueries with COUNT(*) wrapping (like counting grouped results)
    skip_row_limit = has_row_limit or has_aggregate or has_group_by
    
    if not skip_row_limit:
        # For non-aggregate queries, wrap with row limit
        sql = f"SELECT * FROM ({sql.rstrip(';')}) WHERE ROWNUM <= {MAX_ROWS}"
    
    # Remove trailing semicolon if present
    sql = sql.rstrip(';')
    
    return {
        "valid": True,
        "sql": sql,
        "tables": tables
    }


def extract_tables(sql: str) -> List[str]:
    """Extract table names from SQL query (basic extraction)."""
    tables = []
    sql_upper = sql.upper()
    
    # Pattern for FROM and JOIN clauses
    patterns = [
        r'\bFROM\s+([A-Za-z_][A-Za-z0-9_\.]*)',
        r'\bJOIN\s+([A-Za-z_][A-Za-z0-9_\.]*)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, sql_upper)
        tables.extend(matches)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_tables = []
    for t in tables:
        if t not in seen:
            seen.add(t)
            unique_tables.append(t)
    
    return unique_tables


def get_schema_context() -> str:
    """Return the schema context for LLM."""
    return SCHEMA_CONTEXT


def get_sql_generation_prompt() -> str:
    """Return the SQL generation prompt for LLM."""
    return SQL_GENERATION_PROMPT
