import re
import os

files = [
    'src/data/seedance25Demos.ts',
    'src/data/seedance1Demos.ts',
    'src/data/promptFeedDemos.ts',
    'src/data/seedance2PromptDemos.ts'
]

total_all = 0
with_video_all = 0

for filepath in files:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Match both "videoSrc": and videoSrc:
    video_srcs = re.findall(r'["\']?videoSrc["\']?\s*:\s*["]([^"]+)["]', content)
    
    total = len(video_srcs)
    with_video = sum(1 for v in video_srcs if v and not v.startswith('data:'))
    
    total_all += total
    with_video_all += with_video
    
    print(f'{filepath}: {with_video}/{total} have videos')

print('')
print(f'SUMMARY: {with_video_all}/{total_all} demos have videos')
if total_all > 0:
    print(f'Coverage: {100 * with_video_all / total_all:.1f}%')
