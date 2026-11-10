const rules = require("../../shared/writing-rules.json");
function estimateLines(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .reduce(
      (total, line) =>
        total +
        (line.trim()
          ? Math.ceil([...line.trim()].length / rules.charactersPerLine)
          : 0),
      0,
    );
}
module.exports = { ...rules, estimateLines };
