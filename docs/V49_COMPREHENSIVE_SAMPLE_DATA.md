# DCAM v49 Comprehensive Sample Data

## Purpose

The Settings sample-data control now creates a connected example company operation rather than a few isolated records.

## Example operation

The dataset models a Romanian technical compliance contractor serving:

- a multi-site property manager
- a live hotel
- an industrial production plant
- an education prospect

It includes current, upcoming, completed and overdue activity using dates relative to installation day.

## Records created

- customers, contacts, buildings and assets
- planned, reactive, remedial and survey work orders
- schedule assignments, checklists and customer sign-offs
- preventive maintenance plans
- compliance inspections
- defects and corrective actions
- service requests
- CRM opportunities
- quotations, priced quotation lines and contracts
- recurring contract services and renewals
- reports and certificates
- reusable inspection forms
- Customer 360 activity
- a staff profile and qualifications when the installer account has no staff profile

## Safety

Every directly removable sample record has the private marker `dcam-operating-company-sample-v49`.
Child records such as quotation lines are removed by database cascade with their marked parent.
The delete action also recognises and removes the older v24 sample marker.

Installation and deletion remain protected by the `settings.admin` permission and run inside a transaction.
Real records without a sample marker are not selected for deletion.

## Languages

The Settings explanation and Help Centre guide are available in English and Romanian.

The selected interface language also controls the currency used when installing the sample commercial records:

- English installs GBP quotations and contracts with a 20% default quotation tax rate.
- Romanian installs RON quotations and contracts with a 19% default quotation tax rate.

Changing language does not convert existing real or sample financial values. Currency is selected when a quotation or sample dataset is created.
