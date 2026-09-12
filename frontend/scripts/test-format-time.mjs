import assert from "node:assert";

function formatMessageTime(isoStringOrDate) {
  if (!isoStringOrDate) return "";
  try {
    const date =
      typeof isoStringOrDate === "string" ? new Date(isoStringOrDate) : isoStringOrDate;
    if (isNaN(date.getTime())) return "";

    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    return formatted.replace(/\u202f/g, " ");
  } catch {
    return "";
  }
}

// 1. Midnight edge cases
const midnight = new Date(2026, 8, 12, 0, 0, 0);
assert.strictEqual(formatMessageTime(midnight), "12:00 AM");

const midnightFive = new Date(2026, 8, 12, 0, 5, 0);
assert.strictEqual(formatMessageTime(midnightFive), "12:05 AM");

// 2. Noon edge cases
const noon = new Date(2026, 8, 12, 12, 0, 0);
assert.strictEqual(formatMessageTime(noon), "12:00 PM");

const noonThirty = new Date(2026, 8, 12, 12, 30, 0);
assert.strictEqual(formatMessageTime(noonThirty), "12:30 PM");

// 3. Single-digit hour
const morningNine = new Date(2026, 8, 12, 9, 5, 0);
assert.strictEqual(formatMessageTime(morningNine), "9:05 AM");

// 4. Double-digit afternoon
const afternoonTwo = new Date(2026, 8, 12, 14, 20, 0);
assert.strictEqual(formatMessageTime(afternoonTwo), "2:20 PM");

const lateNight = new Date(2026, 8, 12, 23, 59, 0);
assert.strictEqual(formatMessageTime(lateNight), "11:59 PM");

// 5. Invalid / empty inputs
assert.strictEqual(formatMessageTime(null), "");
assert.strictEqual(formatMessageTime(undefined), "");
assert.strictEqual(formatMessageTime(""), "");
assert.strictEqual(formatMessageTime("invalid-date-string"), "");

console.log("All formatMessageTime tests passed successfully!");
