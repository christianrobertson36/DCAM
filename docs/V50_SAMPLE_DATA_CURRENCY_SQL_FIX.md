# DCAM v50 Sample Data Currency and SQL Fix

## Fixes

- Corrected skipped PostgreSQL parameter numbers in the comprehensive work-order and compliance-service sample inserts.
- Strengthened the automated query validator to reject any missing placeholder number.
- English sample-data installation now creates GBP commercial records.
- Romanian sample-data installation now creates RON commercial records.
- New quotation defaults follow the selected language: GBP/20% for English and RON/19% for Romanian.

Existing financial records are never converted when the interface language changes.
