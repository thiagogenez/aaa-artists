# Privacy compliance working record

This is an engineering and operational checklist, not a declaration that the business is compliant. The controller must confirm the legal and business facts, and professional advice may be appropriate for UK/EU territorial-scope and representative questions.

## Current scope

AAA Artists is understood to operate from the United Kingdom. UK GDPR and the Data Protection Act 2018 therefore apply to its business processing. EU GDPR may also apply where the business intentionally offers services to people in the EU/EEA or monitors their behaviour there; mere website availability is not by itself the test.

Confirmed by the controller on 14 July 2026:

- Controller: AAA ARTISTS AND EVENTS LTD, a UK private limited company.
- Companies House number: 16082156.
- ICO registration reference: ZC159381.
- Booking enquiries: retained for no longer than 3 months.
- Booking contracts and related records: retained for up to 6 years.
- Individuals may request access by submitting a data subject access request under UK GDPR.

Independently verified on the official registers on 14 July 2026:

- Registered office and ICO address: 22 Brooker Street, Hove, England, BN3 3YX.
- ICO registration date: 28 May 2026; renewal due 27 May 2027.

Official guidance:

- [ICO: controllers and processors](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/controllers-and-processors/controllers-and-processors-a-guide/)
- [ICO: privacy information to provide](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/)
- [ICO: receiving personal information from the EEA](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/receiving-personal-information-from-the-eea/)
- [European Commission: territorial scope](https://commission.europa.eu/law/law-topic/data-protection/reform/rules-business-and-organisations/application-regulation/who-does-data-protection-law-apply_en)

## Data-flow inventory

| Activity | Personal data | Purpose | Likely basis to verify | Recipients/processors | Retention |
| --- | --- | --- | --- | --- | --- |
| Booking enquiry | Identity, email, phone/WhatsApp, event, artist, schedule, venue, audience, budget, lineup, message | Assess, quote, and take requested steps towards a booking | Pre-contract steps; legitimate interests for business contacts | Formspree, email provider, authorised booking staff, relevant artists/representatives | No longer than 3 months |
| Confirmed booking | Enquiry, correspondence, contract, payment/accounting records | Administer the contract, resolve disputes, meet accounting/legal duties | Contract; legal obligation; legitimate interests | Booking staff, artists/representatives, accountants and advisers as needed | Up to 6 years |
| Form security | IP-derived request context, token result, timing, hashed email rate-limit key, logs | Prevent spam, abuse, and security incidents | Legitimate interests | Cloudflare and Turnstile | Confirm provider/log retention |
| Theme preference | Light/dark setting in browser local storage | Remember the visitor's interface choice | User-requested functionality | Stored in the visitor's browser | Until removed by the visitor |
| Optional media | IP address, cookies/provider data after a user loads a player | Play third-party media | User action; provider terms apply | Spotify, SoundCloud, or YouTube | Provider-controlled |

The Worker hashes the lower-cased email address before using it as a rate-limit key and does not write enquiry bodies to application logs.

## Processor and transfer record

- Cloudflare: confirm the customer DPA, account region/settings, Turnstile configuration, log retention, and authorised administrators.
- Formspree: confirm the account plan, DPA/SCCs, submission retention, deletion workflow, notification recipients, and authorised administrators.
- Email provider: identify the provider, account owner, MFA, administrators, retention/deletion settings, and international-processing terms.
- Artists and representatives: document when enquiry details are shared, the minimum fields needed, locations, and whether each recipient acts as an independent controller or processor.
- Other systems: Paul must identify WhatsApp, CRM, accounting, spreadsheets, cloud drives, backups, and any other enquiry stores.

## Decisions required from the controller

- Registered postal address, VAT status if applicable, and confirmation that AAA Artists is the trading name used by the controller.
- Official privacy contact and the person responsible for rights requests.
- Retention periods for unsuccessful enquiries, confirmed bookings, correspondence, security logs, and backups.
- Whether data is used for marketing. If marketing is introduced, assess UK PECR/EU ePrivacy consent and provide a separate opt-in where required.
- Countries actively served and whether EU GDPR applies; if it does, assess the Article 27 EU representative requirement.
- Complete recipients, storage locations, international transfers, and safeguards.

## Operational procedures

### Data-protection complaint

1. Provide a clear route through the privacy email with “Data protection complaint” in the subject.
2. Record the complaint, owner, systems involved, requested outcome, and receipt date.
3. Acknowledge receipt within 30 days.
4. Investigate without undue delay, preserve relevant evidence, and involve processors or recipients where needed.
5. Communicate the outcome and action taken, explain any refusal, and retain a minimal complaint record.
6. Tell the person that they may complain to the ICO; record improvements arising from the complaint.

### Rights request

1. Record the date, request, requester, affected systems, and one-month response deadline.
2. Verify identity proportionately without collecting unnecessary documents.
3. Search Formspree, email, WhatsApp, CRM, spreadsheets, cloud storage, accounting systems, and relevant recipients.
4. Apply legal exceptions and preserve records that must be retained.
5. Respond securely and document the outcome, searches, disclosures, corrections, or deletion.

### Personal-data breach

1. Contain the incident, preserve evidence, and restrict further access.
2. Record what happened, affected data/people, likely consequences, and mitigation.
3. Notify the controller immediately and assess risk to individuals.
4. Where legally required, notify the ICO within 72 hours of awareness; assess any relevant EU authority and affected-person notification obligations.
5. Document the decision even when notification is not required, then remediate and review controls.

### Retention and access

- Use named accounts, MFA, least privilege, and prompt access removal for leavers.
- Review enquiry recipients and provider administrators periodically.
- Delete records according to the confirmed schedule across primary stores and applicable backups.
- Do not ask for or retain passwords, authentication codes, payment-card details, or sensitive data in free-text enquiries.

### Monthly retention evidence

The controller-designated privacy owner must complete this check monthly. Store the evidence without copying enquiry content into the log.

| Check | Evidence to record |
| --- | --- |
| Formspree | Oldest unsuccessful submission date, deletion/export action, account administrators |
| Booking mailbox | Search date, oldest unsuccessful enquiry, deletion action, retention-rule exceptions |
| WhatsApp/CRM/spreadsheets/cloud drives | Systems checked, records deleted, records converted to confirmed bookings |
| Backups | Backup retention window and next expiry date; document why immediate deletion is not technically possible |
| Confirmed bookings | Contract reference and six-year disposal date; do not duplicate customer details in this log |
| Access review | Current administrators, MFA status, leavers removed, exceptions and owner |

Record the review date, reviewer, result, exceptions, corrective owner, and completion date. Escalate overdue deletion or unknown data stores to the controller.

## Cookies and consent

The current site does not load Spotify, SoundCloud, or YouTube players until the visitor chooses to do so. Do not add analytics, advertising pixels, behavioural profiling, or other non-essential browser storage without first documenting it and implementing the consent controls required by UK PECR and, where applicable, EU rules.
