// Do not replace missing legal facts with plausible-looking dummy information.
// Set `detailsConfirmed` to true only after the controller has confirmed every
// required value below and the completed notice has been reviewed for release.
export const PRIVACY_CONFIG = Object.freeze({
  detailsConfirmed: false,
  lastUpdated: "2026-07-17",
  controller: {
    legalName: "AAA ARTISTS AND EVENTS LTD",
    tradingName: "AAA Artists",
    postalAddress: "22 Brooker Street, Hove, England, BN3 3YX",
    establishmentCountry: "United Kingdom",
    companyNumber: "16082156",
    vatNumber: null,
    icoRegistrationNumber: "ZC159381",
    icoRegisteredOn: "2026-05-28",
    icoRegistrationExpires: "2027-05-27",
  },
  retention: {
    unsuccessfulEnquiries: "no longer than 3 months",
    successfulBookings: "up to 6 years",
  },
  complaints: {
    acknowledgementDays: 30,
  },
  decisions: {
    // Tri-state values stay null until the controller confirms them.
    marketingUse: null,
    euGdprApplies: null,
    icoRegistrationStatus: "registered",
    dataFlowConfirmed: false,
  },
  euRepresentative: null,
});

export function privacyMissingFields(config = PRIVACY_CONFIG) {
  return [
    !config.detailsConfirmed && "detailsConfirmed",
    !config.controller.legalName && "controller.legalName",
    !config.controller.postalAddress && "controller.postalAddress",
    !config.controller.establishmentCountry && "controller.establishmentCountry",
    !config.retention.unsuccessfulEnquiries && "retention.unsuccessfulEnquiries",
    !config.retention.successfulBookings && "retention.successfulBookings",
    config.decisions.marketingUse === null && "decisions.marketingUse",
    config.decisions.euGdprApplies === null && "decisions.euGdprApplies",
    config.decisions.icoRegistrationStatus === null && "decisions.icoRegistrationStatus",
    !config.decisions.dataFlowConfirmed && "decisions.dataFlowConfirmed",
  ].filter(Boolean);
}

export const PRIVACY_DETAILS_READY = privacyMissingFields().length === 0;
