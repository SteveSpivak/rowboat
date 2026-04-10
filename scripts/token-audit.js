#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const STYLE_EXTENSIONS = new Set([".css", ".scss", ".sass", ".less"]);
const SKIP_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".venv",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "var",
  "worktrees"
]);
const ALLOWED_KEYWORDS = new Set([
  "0",
  "none",
  "auto",
  "inherit",
  "initial",
  "unset",
  "normal",
  "transparent",
  "currentcolor",
  "currentColor",
  "solid",
  "dashed",
  "absolute",
  "relative",
  "sticky",
  "fixed",
  "static",
  "block",
  "inline",
  "inline-block",
  "inline-flex",
  "flex",
  "grid",
  "contents",
  "row",
  "column",
  "wrap",
  "nowrap",
  "center",
  "start",
  "end",
  "stretch",
  "baseline",
  "space-between",
  "space-around",
  "space-evenly",
  "repeat-x",
  "repeat-y",
  "no-repeat",
  "cover",
  "contain",
  "hidden",
  "visible",
  "scroll"
]);
const RAW_VALUE_PATTERN = /(#(?:[0-9a-f]{3,8})\b|rgba?\(|hsla?\(|(?:^|[\s,(])-?\d*\.?\d+(?:px|rem|em|vw|vh|vmin|vmax|%|ch|lh|svh|svw|dvh|dvw)\b|linear-gradient\(|radial-gradient\(|conic-gradient\(|calc\(|min\(|max\(|clamp\()/i;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(fullPath));
      continue;
    }

    if (STYLE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function stripInlineComments(value) {
  return value.replace(/\/\*.*?\*\//g, "").trim();
}

function looksLikeRuleBoundary(line) {
  return (
    !line ||
    line.startsWith("@") ||
    line.endsWith("{") ||
    line === "}" ||
    line.indexOf(":") === -1
  );
}

function isAllowedValue(value) {
  if (!value) {
    return true;
  }

  if (value.includes("var(")) {
    return true;
  }

  if (ALLOWED_KEYWORDS.has(value)) {
    return true;
  }

  return !RAW_VALUE_PATTERN.test(value);
}

function auditFile(filePath) {
  const failures = [];
  const relativePath = path.relative(REPO_ROOT, filePath);
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  let insideRootBlock = false;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (line.startsWith(":root")) {
      insideRootBlock = true;
      continue;
    }

    if (insideRootBlock) {
      if (line === "}") {
        insideRootBlock = false;
      }
      continue;
    }

    if (line.startsWith("/*") || line.startsWith("//") || looksLikeRuleBoundary(line)) {
      continue;
    }

    const match = line.match(/^([a-zA-Z-]+)\s*:\s*(.+?);$/);
    if (!match) {
      continue;
    }

    const property = match[1].trim();
    const value = stripInlineComments(match[2].trim());
    if (!property || property.startsWith("--")) {
      continue;
    }

    if (!isAllowedValue(value)) {
      failures.push(`${relativePath}:${index + 1} uses a raw CSS value: ${value}`);
    }
  }

  return failures;
}

const styleFiles = walk(REPO_ROOT);
const failures = styleFiles.flatMap(auditFile);

if (failures.length > 0) {
  console.error("Token audit failed.\n");
  for (const failure of failures) {
    console.error(failure);
  }
  process.exit(1);
}

if (styleFiles.length === 0) {
  console.log("Token audit passed. No CSS-family files were found.");
  process.exit(0);
}

console.log(`Token audit passed for ${styleFiles.length} style file(s).`);
