# $1 repo, $2 project dir (already has current JOENESS block from scratch1)
R="$1"; P="$2"
cp "$R/skills/joeness-setup/assets/DESIGN.md" "$R/skills/joeness-setup/assets/ROADMAP.md" "$P/"
cd "$P" && git add -A && git -c user.name=Fixture -c user.email=fixture@example.invalid commit -qm "seed from templates" && echo "committed: $(git ls-files | tr '\n' ' ')"
powershell.exe -NoProfile -File "$R/skills/joeness-setup/scripts/project-setup.ps1" -Check -ProjectPath "$P" | node -e "const r=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('check:',r.status,'warnings',r.warnings.length)"
echo "DESIGN headings:"; grep -n '^## ' DESIGN.md
echo "DESIGN table header:"; grep -n '^| Rule' DESIGN.md
echo "ROADMAP anchor refs:"; grep -o 'DESIGN.md#[a-z-]*' ROADMAP.md | sort -u
echo "ROADMAP authority lines:"; grep -n 'Product authority\|Product revision' ROADMAP.md
echo "machine paths in committed files:"; git grep -nE '(^|[^A-Za-z0-9])[A-Za-z]:[\/]|/(Users|home)/' || echo none
