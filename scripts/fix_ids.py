import re

filepath = 'src/data/promptFeedDemos.ts'

with open(filepath, 'r') as f:
    content = f.read()

# Find all "id": N, patterns and replace with sequential IDs
pattern = re.compile(r'"id":\s*\d+,')

matches = list(pattern.finditer(content))
print(f'Found {len(matches)} id entries')

# Replace each with sequential id starting from 1
new_content = content
offset = 0
for i, match in enumerate(matches, start=1):
    new_id = f'"id": {i},'
    start = match.start() + offset
    end = match.end() + offset
    new_content = new_content[:start] + new_id + new_content[end:]
    offset += len(new_id) - (end - start)

with open(filepath, 'w') as f:
    f.write(new_content)

print('Fixed IDs to be sequential 1-29')

# Verify
with open(filepath, 'r') as f:
    content = f.read()
    
ids = re.findall(r'"id":\s*(\d+),', content)
print(f'IDs: {ids[:10]}...{ids[-5:]}')
print(f'Total: {len(ids)}')
print(f'Sequential: {ids == [str(i) for i in range(1, len(ids)+1)]}')
