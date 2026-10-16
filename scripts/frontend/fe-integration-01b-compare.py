"""Exact comparison; no pixel tolerance or masking. Requires the existing Pillow tooling."""
import contextlib
import io
import json
import runpy
import sys
from pathlib import Path
folder = Path(sys.argv[1]).resolve()
with contextlib.redirect_stdout(io.StringIO()):
    functions = runpy.run_path(str(Path(__file__).with_name("fe-integration-01a-compare.py")))
rows = json.loads((folder / "pixel-comparison.json").read_text())
member_rows = []
for scene in ["members-light", "members-dark", "invite-light", "invite-dark", "members-mobile-light", "members-mobile-dark"]:
    member_rows.append(functions["compare"](f"baseline-{scene}.png", f"current-{scene}.png"))
(folder / "member-pixel-comparison.json").write_text(json.dumps(member_rows, indent=2), encoding="utf8")
print(json.dumps({"originalComparisons": len(rows), "originalNonidentical": sum(r.get("differentPixels", -1) != 0 for r in rows), "memberComparisons": member_rows}, indent=2))
if any(not r.get("sameDimensions") or r["differentPixels"] != 0 for r in member_rows):
    raise SystemExit("Member prototype raster comparison failed; inspect exact evidence without altering the prototype.")
