import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attendancePercent,
  hashPassword,
  meetingUrlAllowed,
  safeEqual,
  verifyPassword,
} from "../server/security";

test("password hashes are salted and reject incorrect or malformed credentials", async () => {
  const first = await hashPassword("A-long-local-password!");
  assert.notEqual(first, await hashPassword("A-long-local-password!"));
  assert.equal(await verifyPassword("A-long-local-password!", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  assert.equal(await verifyPassword("anything", "not-a-hash"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});
test("meeting links reject lookalike domains, credentials, non-HTTPS and custom ports", () => {
  for (const value of [
    "https://meet.google.com/abc-defg-hij",
    "https://us02web.zoom.us/j/123",
  ])
    assert.equal(meetingUrlAllowed(value), true);
  for (const value of [
    "https://zoom.us.evil.test",
    "https://evilzoom.us",
    "https://user:secret@zoom.us/j/123",
    "http://zoom.us",
    "https://zoom.us:8443",
    "javascript:alert(1)",
    "https://meet.google.com.evil.test",
  ])
    assert.equal(meetingUrlAllowed(value), false, value);
});
test("attendance counts only the webinar interval and requires both timestamps", () => {
  const start = "2026-11-01T01:00:00Z";
  const end = "2026-11-01T02:00:00Z";
  assert.equal(attendancePercent(start, end, null, end), 0);
  assert.equal(
    attendancePercent(
      start,
      end,
      "2026-11-01T00:45:00Z",
      "2026-11-01T02:15:00Z",
    ),
    100,
  );
  assert.equal(
    attendancePercent(start, end, start, "2026-11-01T01:48:00Z"),
    80,
  );
  assert.equal(attendancePercent(start, end, end, start), 0);
});
