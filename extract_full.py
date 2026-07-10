import json, re

with open('.rork/history/main/00mreeqh4p000_frg2ktrty7hq95ojq7jh0_assistant.json', 'r') as f:
    data = json.load(f)

contents = data.get('responseMessageContents', [])

# Build a map of original_icon_uuid -> peak_id from mountainIcons.ts
# We'll read the file content
with open('expo/constants/mountainIcons.ts', 'r') as f:
    icons_content = f.read()

# Parse the icon map
icon_map = {}
for m in re.finditer(r"'([^']+)':\s*'(https://[^']+)'", icons_content):
    peak_id = m.group(1)
    url = m.group(2)
    # Extract UUID from URL
    uuid_m = re.search(r'assets/([a-f0-9-]+)\.png', url)
    if uuid_m:
        icon_map[uuid_m.group(1)] = peak_id
    # Also store the generated-images UUIDs
    uuid_m2 = re.search(r'generated-images/([a-f0-9-]+)\.png', url)
    if uuid_m2:
        icon_map[uuid_m2.group(1)] = peak_id

# Now go through all callTool calls, extract inputImages and output imageUrl
mapping = {}
failed = []

for c in contents:
    if not isinstance(c, dict):
        continue
    if c.get('type') != 'tool' or c.get('toolName') != 'callTool':
        continue

    inp = c.get('inputArgsStr', '')
    out_raw = c.get('output', '')

    # Extract assetName from input
    idx = inp.find('assetName')
    if idx < 0:
        continue
    rest = inp[idx + 9:]
    m = re.match(r'[\\\":\s]+([a-z][a-z0-9-]+)', rest)
    asset_name = m.group(1) if m else ''
    if not asset_name:
        continue

    peak_from_name = asset_name.replace('-cutout', '').replace('-retry', '').replace('-test', '').replace('-peak2', '')

    # Extract inputImages URLs from input
    input_urls = re.findall(r'https://r2-pub\.rork\.com/[^"\\]+\.png', inp)
    # Also try generated-images pattern
    input_urls += re.findall(r'https://r2-pub\.rork\.com/generated-images/[^"\\]+\.png', inp)

    # Match input UUIDs to peak IDs
    peak_from_input = ''
    for url in input_urls:
        uuid_m = re.search(r'(?:assets|generated-images)/([a-f0-9-]+)\.png', url)
        if uuid_m:
            uuid = uuid_m.group(1)
            if uuid in icon_map:
                peak_from_input = icon_map[uuid]
                break

    peak = peak_from_input or peak_from_name

    # Get imageUrl from output
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
