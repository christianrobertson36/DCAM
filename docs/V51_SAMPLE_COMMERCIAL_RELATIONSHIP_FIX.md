# DCAM v51 Sample Commercial Relationship Fix

## Fix

Corrected the comprehensive sample quotation relationship mapping so each quotation references:

- the correct customer
- a building belonging to that customer where applicable
- the correct CRM opportunity

The sample quotation tax rate and totals now also remain internally consistent:

- English / GBP uses 20%
- Romanian / RON uses 19%

The failed v50 sample installation is transactionally rolled back and can be safely retried after deploying v51.
