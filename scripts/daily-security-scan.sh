#!/bin/bash
# Daily Security Scan — runs via cron, output → ~/fred/security-scan-results.md
# Improved: excludes node_modules, scans source only, adds npm audit summary

REPO="/Users/miguelitodeguzman/Projects/tech-project/web-erp-app"
MOBILE_REPO="/Users/miguelitodeguzman/Projects/tech-project/rent-a-car-mobile"

echo "# Security Scan Results"
echo "*Last checked: $(date +%Y-%m-%d)*"
echo ""
echo "## Findings"
echo ""

# ── 1. Git-tracked files with potential secrets ──
echo "### Potential Secrets in Tracked Files"
cd "$REPO"
git grep -lE "(api[_-]?key|secret|token|password|credential)\s*[:=]" -- '*.env' '*.env.*' '*.json' '*.yml' '*.yaml' 2>/dev/null | grep -v node_modules | grep -v package-lock || echo "None found"
echo ""

# ── 2. Hardcoded secrets in source code ──
echo "### Hardcoded Secrets in Source"
grep -rn "api[_-]?key\s*=\s*['\"][A-Za-z0-9]" "$REPO/backend/src/" "$REPO/frontend/src/" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process\.env\|config\.\|interface\|type \|example\|placeholder\|test\|mock\|TODO" | head -10 || echo "None found"
echo ""

# ── 3. Dependency vulnerabilities (backend) ──
echo "### npm audit — Backend"
cd "$REPO"
AUDIT=$(npm audit --json 2>/dev/null)
CRITICAL=$(echo "$AUDIT" | jq '[.vulnerabilities | to_entries[] | select(.value.severity == "critical")] | length' 2>/dev/null || echo "0")
HIGH=$(echo "$AUDIT" | jq '[.vulnerabilities | to_entries[] | select(.value.severity == "high")] | length' 2>/dev/null || echo "0")
MODERATE=$(echo "$AUDIT" | jq '[.vulnerabilities | to_entries[] | select(.value.severity == "moderate")] | length' 2>/dev/null || echo "0")
echo "- Critical: $CRITICAL"
echo "- High: $HIGH"
echo "- Moderate: $MODERATE"
if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
    echo ""
    echo "**Details (Critical/High):**"
    echo "$AUDIT" | jq -r '.vulnerabilities | to_entries[] | select(.value.severity | test("high|critical")) | "- \(.key) (\(.value.severity)): \(.value.via[0].title // "unknown")"' 2>/dev/null
fi
echo ""

# ── 4. Dependency vulnerabilities (mobile) ──
echo "### npm audit — Mobile"
if [ -d "$MOBILE_REPO" ]; then
    cd "$MOBILE_REPO"
    MOB_AUDIT=$(npm audit --json 2>/dev/null)
    MOB_CRITICAL=$(echo "$MOB_AUDIT" | jq '[.vulnerabilities | to_entries[] | select(.value.severity == "critical")] | length' 2>/dev/null || echo "0")
    MOB_HIGH=$(echo "$MOB_AUDIT" | jq '[.vulnerabilities | to_entries[] | select(.value.severity == "high")] | length' 2>/dev/null || echo "0")
    echo "- Critical: $MOB_CRITICAL"
    echo "- High: $MOB_HIGH"
else
    echo "Mobile repo not found"
fi
echo ""

# ── 5. Suspicious imports (SOURCE ONLY, not node_modules) ──
echo "### Suspicious Imports in Source Code"
grep -rn "require('child_process')\|exec(\|spawn(\|execSync(" "$REPO/backend/src/" "$REPO/frontend/src/" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v "__tests__" | grep -v "\.test\." | head -10 || echo "None found"
echo ""

# ── 6. .env files in git ──
echo "### .env Files Tracked in Git"
cd "$REPO"
git ls-files | grep -E "\.env" | grep -v "\.example\|\.sample\|node_modules" || echo "None tracked (good)"
echo ""

# ── 7. Large files in git ──
echo "### Large Files in Git (>1MB)"
cd "$REPO"
git rev-list --objects --all 2>/dev/null | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' 2>/dev/null | awk '/^blob/ && $3 > 1048576 {printf "- %s (%.1f MB)\n", $4, $3/1048576}' | head -5 || echo "None found"
echo ""

# ── 8. Summary ──
echo "## Summary"
TOTAL_ISSUES=$((CRITICAL + HIGH))
if [ "$TOTAL_ISSUES" -gt 0 ]; then
    echo "🚨 **$TOTAL_ISSUES Critical/High issues found — requires immediate attention**"
else
    echo "✅ No Critical/High vulnerabilities detected"
fi
echo ""
echo "*Scan completed: $(date '+%Y-%m-%d %H:%M:%S %Z')*"
