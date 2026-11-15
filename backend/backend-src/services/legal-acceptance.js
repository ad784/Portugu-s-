const { legalVersions } = require("../config/photo-config");
function isAccepted(receipt) {
  const current = legalVersions();
  return (
    receipt?.terms_version === current.termsVersion &&
    receipt?.privacy_version === current.privacyVersion &&
    receipt?.ai_consent === true &&
    !receipt.revoked_at
  );
}

module.exports = { isAccepted };
