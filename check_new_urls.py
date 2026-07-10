import json, re

# Load the history
with open('.rork/history/main/00mreeqh4p000_frg2ktrty7hq95ojq7jh0_assistant.json', 'r') as f:
    data = json.load(f)

contents = data.get('responseMessageContents', [])

# Get all image-generation URLs
gen_urls = []
for c in contents:
    if not isinstance(c, dict):
        continue
    if c.get('type') == 'image-generation':
        url = c.get('imageUrl', '')
        if url:
            gen_urls.append(url)

print("Total image-generation URLs: %d" % len(gen_urls))
unique_urls = list(set(gen_urls))
print("Unique URLs: %d" % len(unique_urls))

# Load current mountainIcons.ts and mountainImages.ts
with open('expo/constants/mountainIcons.ts', 'r') as f:
    icons_content = f.read()
with open('expo/constants/mountainImages.ts', 'r') as f:
    images_content = f.read()

# Extract all URLs currently in the files
existing_urls = set()
for m in re.finditer(r"'https://[^']+'", icons_content):
    existing_urls.add(m.group(0).strip("'"))
for m in re.finditer(r"'https://[^']+'", images_content):
    existing_urls.add(m.group(0).strip("'"))

print("Existing URLs in icons+images files: %d" % len(existing_urls))

# Find new URLs not in existing files
new_urls = [u for u in unique_urls if u not in existing_urls]
print("New URLs (not in existing files): %d" % len(new_urls))

# Also check which new URLs appear in the callTool mappings
# Load mapping_result.json
with open('mapping_result.json', 'r') as f:
    mapping_data = json.load(f)
mapped_urls = set(mapping_data['mapping'].values())
print("Mapped URLs from callTool: %d" % len(mapped_urls))

# How many new URLs are NOT in the mapping?
unmapped_new = [u for u in new_urls if u not in mapped_urls]
print("New URLs not in callTool mapping: %d" % len(unmapped_new))
for u in sorted(unmapped_new)[:20]:
    print("  %s" % u)
