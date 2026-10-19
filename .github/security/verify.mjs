import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const digest = (value) => createHash("sha256").update(value.toString().replaceAll("\r\n", "\n")).digest("hex");
export const policyFiles = [
  ".github/workflows/atualizacao-global.yml",
  ".github/workflows/atualizacao-vitrine.yml",
  ".github/workflows/execute.sh",
  ".github/workflows/security.yml",
  ".github/security/verify.mjs",
  ".github/security/verify.test.mjs",
];

// The approval digest lives in repository settings, not in the candidate PR.
// Never import or execute files from the candidate checkout.
export function verify(root, approval) {
  if (!/^[a-f0-9]{64}$/.test(approval || "")) throw new Error("POLICY_APPROVAL_REQUIRED");
  const manifestPath = path.join(root, ".github/security/policy.json");
  if (fs.lstatSync(manifestPath).isSymbolicLink()) throw new Error("INVALID_POLICY");
  const bytes = fs.readFileSync(manifestPath);
  if (digest(bytes) !== approval) throw new Error("POLICY_REVIEW_REQUIRED");
  const policy = JSON.parse(bytes);
  if (policy.version !== 1 || JSON.stringify(Object.keys(policy.files).sort()) !== JSON.stringify([...policyFiles].sort())) throw new Error("INVALID_POLICY");
  for (const relative of policyFiles) {
    const parts = relative.split("/");
    for (let index = 1; index <= parts.length; index++) {
      if (fs.lstatSync(path.join(root, ...parts.slice(0, index))).isSymbolicLink()) throw new Error("UNSAFE_LINK");
    }
    const file = path.join(root, relative);
    if (!fs.lstatSync(file).isFile() || !/^[a-f0-9]{64}$/.test(policy.files[relative]) || digest(fs.readFileSync(file)) !== policy.files[relative]) throw new Error("PROTECTED_FILE_CHANGED");
  }
  const allowedWorkflows = policyFiles.filter((file) => file.startsWith(".github/workflows/")).map((file) => path.basename(file));
  for (const entry of fs.readdirSync(path.join(root, ".github/workflows"))) {
    if (!allowedWorkflows.includes(entry)) throw new Error("UNREVIEWED_WORKFLOW");
  }
  const publicScripts = fs.readdirSync(path.join(root, ".github/security")).sort();
  if (JSON.stringify(publicScripts) !== JSON.stringify(["policy.json", "verify.mjs", "verify.test.mjs"].sort())) throw new Error("UNREVIEWED_GUARD");
  const allowed = new Set([...policyFiles, ".github/security/policy.json", "README.md"]);
  function inspect(directory, prefix = "") {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!prefix && entry.name === ".git") continue;
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error("UNSAFE_LINK");
      if (entry.isDirectory()) inspect(path.join(directory, entry.name), relative + "/");
      else if (!entry.isFile() || !allowed.has(relative)) throw new Error("UNREVIEWED_PUBLIC_FILE");
    }
  }
  inspect(root);
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    verify(path.resolve(process.argv[2] || "."), process.env.EXPECTED_POLICY_SHA256);
    console.log("Política de segurança aprovada.");
  } catch {
    // No candidate path, content or error message is echoed into public logs.
    console.error("Mudança não aprovada na proteção da execução. Revisão de segurança necessária.");
    process.exitCode = 1;
  }
}
