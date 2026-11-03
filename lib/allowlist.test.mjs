import { test } from "node:test";
import assert from "node:assert/strict";
import { isEmailAllowed } from "./allowlist.ts";

test("fail closed: bez konfigurace nepustí nikoho", () => {
  assert.equal(isEmailAllowed("user@example.com", undefined, undefined), false);
  assert.equal(isEmailAllowed("user@example.com", "", " , "), false);
});

test("povolený e-mail ze seznamu (case-insensitive, mezery)", () => {
  assert.equal(isEmailAllowed("Alice@Example.com", " alice@example.com , bob@example.org", undefined), true);
  assert.equal(isEmailAllowed("carol@example.com", "alice@example.com", undefined), false);
});

test("povolená doména – přesná shoda, volitelný @", () => {
  assert.equal(isEmailAllowed("someone@example.com", undefined, "example.com"), true);
  assert.equal(isEmailAllowed("someone@example.com", undefined, "@example.com"), true);
  assert.equal(isEmailAllowed("someone@sub.example.com", undefined, "example.com"), false);
  assert.equal(isEmailAllowed("someone@example.com.evil.test", undefined, "example.com"), false);
  assert.equal(isEmailAllowed("someone@evil-example.com", undefined, "example.com"), false);
});

test("kombinace seznamu e-mailů a domén", () => {
  assert.equal(isEmailAllowed("ext@partner.test", "ext@partner.test", "example.com"), true);
  assert.equal(isEmailAllowed("x@example.com", "ext@partner.test", "example.com"), true);
  assert.equal(isEmailAllowed("x@other.test", "ext@partner.test", "example.com"), false);
});

test("neplatný nebo chybějící e-mail", () => {
  for (const e of [null, undefined, "", "example.com", "@example.com", "user@"]) {
    assert.equal(isEmailAllowed(e, "user@example.com", "example.com"), false, String(e));
  }
});
