import re
import os

files = [
    'src/data/seedance25Demos.ts',
    'src/data/seedance1Demos.ts',
    'src/data/seedancePromptsDemos.ts',
    'src/data/promptFeedDemos.ts',
    'src/data/seedance2PromptDemos.ts'
]

for filepath in files:
    if not os.path.exists(filepath):
        print(f'{filepath}: FILE NOT FOUND')
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find all videoSrc values - handle both "videoSrc": and videoSrc:
    video_srcs = re.findall(r'["\']?videoSrc["\']?\s*:\s*["]([^"]+)["]', content)
    
    total = len(video_srcs)
    with_video = sum(1 for v in video_srcs if v and not v.startswith('data:'))
    without_video = total - with_video
    
    print(f'{filepath}:')
    print(f'  Total entries: {total}')
    print(f'  With real video: {with_video}')
    print(f'  Without video/placeholder: {without_video}')
    if without_video > 0:
        print(f'  WARNING: Some entries missing videos!')
    print()
