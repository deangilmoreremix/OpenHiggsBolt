import json

with open('src/data/seedance2PromptDemos.ts', 'r') as f:
    content = f.read()

lines = content.split('\n')
entries_with_video = 0
entries_without_video = 0
current_entry = {}

for line in lines:
    if line.strip().startswith('id:'):
        if current_entry.get('has_video'):
            entries_with_video += 1
        else:
            entries_without_video += 1
        current_entry = {}
    if 'videoSrc:' in line:
        val = line.split('videoSrc:', 1)[1].strip().strip('",')
        current_entry['has_video'] = bool(val) and not val.startswith('data:')

print(f'Entries with real video URL: {entries_with_video}')
print(f'Entries without real video: {entries_without_video}')
print(f'Total: {entries_with_video + entries_without_video}')
