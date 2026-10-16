"""Read-only pixel comparison; retain exact differences, with no tolerance or masking."""
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

folder = Path(sys.argv[1]).resolve()


def compare(left, right):
    with Image.open(folder / left) as a, Image.open(folder / right) as b:
        if a.size != b.size:
            return {"left": left, "right": right, "sameDimensions": False}
        diff = ImageChops.difference(a.convert("RGB"), b.convert("RGB"))
        return {
            "left": left, "right": right, "sameDimensions": True,
            "differentPixels": sum(1 for pixel in diff.get_flattened_data() if pixel != (0, 0, 0)),
            "bounds": diff.getbbox(),
        }


rows = []
for route in ["projects", "teams", "dependencies"]:
    for repeat in range(3):
        rows.append(compare(f"baseline-{route}-{repeat}.png", f"current-{route}-{repeat}.png"))
    for side in ["baseline", "current"]:
        for repeat in [1, 2]:
            rows.append(compare(f"{side}-{route}-0.png", f"{side}-{route}-{repeat}.png"))
for scene in ["drawer", "create-issue", "palette", "help", "project-filter",
              "dependency-matrix", "dependency-blockers", "test-roles", "mobile-light", "mobile-dark"]:
    rows.append(compare(f"baseline-{scene}.png", f"current-{scene}.png"))
(folder / "pixel-comparison.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
print(json.dumps(rows, indent=2))
