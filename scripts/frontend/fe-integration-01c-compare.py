"""Exact Teams prototype comparisons; no tolerance or masking."""
from pathlib import Path
from PIL import Image, ImageChops
import json,sys,hashlib
folder=Path(sys.argv[1]).resolve()
result=[]
for theme in ['light','dark']:
 for width in [1440,390]:
  for surface in ['directory','hub','create','edit']:
   scene=f'team-{surface}-{width}-{theme}'
   with Image.open(folder/f'baseline-{scene}.png') as source, Image.open(folder/f'current-{scene}.png') as target:
    a=source.convert('RGB');b=target.convert('RGB');same=a.size==b.size
    row={'scene':scene,'sameDimensions':same,'baselineSize':list(a.size),'currentSize':list(b.size)}
    if same:
     diff=ImageChops.difference(a,b);row['differentPixels']=sum(pixel!=(0,0,0) for pixel in diff.getdata())
     if row['differentPixels']:diff.save(folder/f'diff-{scene}.png')
    result.append(row)
css={side:{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in (folder/f'{side}-dist'/'assets').glob('*.css')} for side in ['baseline','current']}
summary={'baseline':'894488746e134bd3cebb21091edbae2cb12dfb19','pairs':result,'css':css,'cssIdentical':sorted(css['baseline'].values())==sorted(css['current'].values()),'tolerance':0}
(folder/'team-pixel-comparison.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf8')
print(json.dumps(summary,indent=2))
if not summary['cssIdentical'] or any(not row['sameDimensions'] or row.get('differentPixels')!=0 for row in result):raise SystemExit('Exact prototype comparison differs; inspect evidence without altering the baseline.')
