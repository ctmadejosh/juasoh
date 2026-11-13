import test from "node:test";
import assert from "node:assert/strict";
import { createVCard, profile } from "../src/profile.js";
import { parseArgs, renderCard } from "../src/cli.js";

test("profile card uses verified portfolio details", () => {
  const card = renderCard({ color: false });
  assert.match(card, /JOSHUA ASOH/);
  assert.match(card, /PLATFORM ENGINEER/);
  assert.match(card, /AT THE HARTFORD/);
  assert.match(card, /https:\/\/juasoh\.com/);
  assert.match(card, /╔═+/);
  assert.match(card, /JUASOH \/ ENGINEERING PROFILE/);
});

test("argument parser accepts supported shortcuts and options", () => {
  assert.equal(parseArgs(["--help"]).action, "help");
  assert.equal(parseArgs(["-v"]).action, "version");
  assert.equal(parseArgs(["--qr"]).action, "qr");
  assert.equal(parseArgs(["--no-color"]).color, false);
  assert.deepEqual(parseArgs(["--vcard"]), {
    action: "vcard",
    color: true,
    path: "joshua-asoh.vcf",
  });
  assert.equal(parseArgs(["--vcard=contact.vcf"]).path, "contact.vcf");
});

test("argument parser rejects unknown and empty vCard options", () => {
  assert.throws(() => parseArgs(["--other"]), /Unknown option: --other/);
  assert.throws(() => parseArgs(["--vcard="]), /Provide a file path/);
});

test("vCard output contains the public contact information", () => {
  const card = createVCard();
  assert.match(card, /BEGIN:VCARD/);
  assert.match(card, new RegExp(`FN:${profile.name}`));
  assert.match(card, new RegExp(`EMAIL;TYPE=WORK:${profile.email}`));
  assert.match(card, /TEL;TYPE=WORK,VOICE:2036130475/);
  assert.match(card, /END:VCARD\r\n$/);
});
