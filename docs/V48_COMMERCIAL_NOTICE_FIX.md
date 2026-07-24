# DCAM v48 Commercial Notice Fix

Corrects the Quotes & Contracts runtime error caused by the due-work success notice state being declared in the Pipeline component instead of the commercial component.

The notice state now lives in `CommercialPage`, where it is read and updated.
