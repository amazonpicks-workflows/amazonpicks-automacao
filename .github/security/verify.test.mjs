import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { digest, policyFiles, verify } from "./verify.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "runner-policy-test-"));
  const files = {};
  for (const file of policyFiles) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), "approved-test-content\n");
    files[file] = digest(fs.readFileSync(path.join(root, file)));
  }
  const policy = JSON.stringify({ version: 1, files });
  fs.writeFileSync(path.join(root, ".github/security/policy.json"), policy);
  return { root, approval: digest(policy) };
}

const mutations = {
  "public logging": (root) => fs.appendFileSync(path.join(root, ".github/workflows/execute.sh"), "\necho PRIVATE_TEST_CANARY\n"),
  "artifact upload": (root) => fs.appendFileSync(path.join(root, ".github/workflows/atualizacao-global.yml"), "\nuses: actions/upload-artifact\n"),
  "private dispatch": (root) => fs.appendFileSync(path.join(root, ".github/workflows/atualizacao-vitrine.yml"), "\nrun: gh workflow run private.yml\n"),
  "new workflow": (root) => fs.writeFileSync(path.join(root, ".github/workflows/unreviewed.yaml"), "on: pull_request_target"),
  "guard replacement": (root) => fs.writeFileSync(path.join(root, ".github/security/verify.mjs"), "process.exit(0)"),
  "CI replacement": (root) => fs.writeFileSync(path.join(root, ".github/workflows/security.yml"), "run: echo passed"),
  "changed approval manifest": (root) => fs.appendFileSync(path.join(root, ".github/security/policy.json"), " "),
  "unexpected data file": (root) => fs.writeFileSync(path.join(root, "backup.json"), "PRIVATE_TEST_CANARY"),
  "symlink": (root) => {
    const file = path.join(root, ".github/workflows/execute.sh");
    fs.unlinkSync(file);
    fs.symlinkSync(path.join(root, ".github/security/policy.json"), file);
  },
};

test("approved policy passes; unrelated documentation is allowed; missing settings fail closed", () => {
  const { root, approval } = fixture();
  try {
    assert.equal(verify(root, approval), true);
    fs.writeFileSync(path.join(root, "README.md"), "Routine documentation");
    assert.equal(verify(root, approval), true);
    assert.throws(() => verify(root, ""));
  } finally { cleanup(root); }
});

for (const [name, mutate] of Object.entries(mutations)) test(`policy blocks ${name}`, { skip: name === "symlink" && process.platform === "win32" }, () => {
  const { root, approval } = fixture();
  try { mutate(root); assert.throws(() => verify(root, approval)); }
  finally { cleanup(root); }
});

function cleanup(root) {
  assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(root).startsWith("runner-policy-test-"));
  fs.rmSync(root, { recursive: true });
}
