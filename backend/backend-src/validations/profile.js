function normalizeProfileName(value) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

module.exports = { normalizeProfileName };
