import json
import re

with open('.rork/history/main/00mreeqh4p000_frg2ktrty7hq95ojq7jh0_assistant.json', 'r') as f:
    data = json.load(f)

contents = data.get('responseMessageContents', [])

mapping = {}
failed = []

for c in contents:
    if not isinstance(c, dict):
        continue
    if c.get('type') != 'tool' or c.get('toolName') != 'callTool':
        continue

    inp = c.get('inputArgsStr', '')
    out_raw = c.get('output', '')

    # Extract asset name from input
    idx = inp.find('assetName')
    if idx < 0:
        continue
    rest = inp[idx + 9:]
    m = re.match(r'[\\\":\s]+([a-z][a-z0-9-]+)', rest)
    asset_name = m.group(1) if m else ''
    if not asset_name:
        continue

    peak = asset_name.replace('-cutout', '').replace('-retry', '').replace('-test', '').replace('-peak2', '')

    # Get imageUrl from output dict
    if isinstance(out_raw, dict):
        image_url = out_raw.get('imageUrl', '')
        if not image_url:
            # Try nested images array
            images = out_raw.get('images', [])
            if images and isinstance(images, list) and len(images) > 0:
                image_url = images[0].get('imageUrl', '') or images[0].get('url', '')
        error = out_raw.get('error', '')
    else:
        out_str = str(out_raw)
        url_match = re.search(r'https://r2-pub\.rork\.com/projects/[a-f0-9]+/assets/[a-f0-9-]+\.png', out_str)
        image_url = url_match.group(0) if url_match else ''
        error_match = re.search(r'"error":\s*"([^"]+)"', out_str)
        error = error_match.group(1) if error_match else ''

    if image_url:
        if peak not in mapping:
            mapping[peak] = image_url
    elif error:
        if peak not in failed:
            failed.append(peak)

# Write to JSON
result = {'mapping': mapping, 'failed': failed}
with open('mapping_result.json', 'w') as f:
    json.dump(result, f, indent=2)

print("=== SUCCESSFUL MAPPINGS (%d) ===" % len(mapping))
for peak in sorted(mapping.keys()):
    print("  '%s': '%s'," % (peak, mapping[peak]))

print()
print("=== FAILED (%d) ===" % len(failed))
for p in failed:
    print("  %s" % p)
