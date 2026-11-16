#!/usr/bin/env bun
// Fail closed: every job must use the approved GitHub-hosted Linux image.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? ".";
const dir = join(root, ".github/workflows");
const errors: string[] = [];
for (const path of [
  ".circleci/config.yml", ".circleci/config.yaml", ".rwx/ci.yml", ".rwx/perf.yml",
  ".cirrus.yml", ".cirrus.yaml", ".travis.yml", ".gitlab-ci.yml",
  "azure-pipelines.yml", "azure-pipelines.yaml", ".buildkite/pipeline.yml", ".buildkite/pipeline.yaml",
  ".woodpecker.yml", ".woodpecker.yaml", ".drone.yml", ".drone.yaml",
  "Jenkinsfile", "appveyor.yml", ".appveyor.yml", "bitrise.yml",
]) if (existsSync(join(root, path))) errors.push(`${path}: external provider activation must be removed`);
for (const name of readdirSync(dir).filter((name) => /\.ya?ml$/.test(name))) {
  const workflow = Bun.YAML.parse(readFileSync(join(dir, name), "utf8")) as any;
  if (!workflow?.jobs || typeof workflow.jobs !== "object") {
    errors.push(`${name}: missing jobs`);
    continue;
  }
  for (const [id, job] of Object.entries(workflow.jobs) as [string, any][]) {
    if (job?.["runs-on"] !== "ubuntu-24.04" || job?.uses)
      errors.push(`${name}#${id}: expected literal ubuntu-24.04`);
  }
}
if (errors.length) console.error(errors.join("\n"));
else console.log("All workflow jobs use GitHub-hosted ubuntu-24.04");
process.exitCode = errors.length ? 1 : 0;
