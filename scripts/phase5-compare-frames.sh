#!/usr/bin/env bash
# Compare the template-card frame with the exported MP4 frame at the card's rest
# time (t = 1.5 s) for every layout x aspect ratio produced by
# e2e/personalization-phase5-layout-export.spec.ts.
#   usage: scripts/phase5-compare-frames.sh <export-dir> [t-seconds]
# Writes <dir>/frames/<slug>-export.png, <dir>/frames/<slug>-compare.png
# (card | export frame | editor stage) and <dir>/metrics.csv. SSIM is computed
# between the card player screenshot and the export frame scaled to the same
# size; it is a similarity signal, not a pass/fail geometry test: video frames
# are scaled and the card is a screenshot, so identical layouts score ~0.8-0.95.
set -euo pipefail
dir="${1:?export dir}"; t="${2:-1.5}"
mkdir -p "$dir/frames"
echo "slug,sha256,bytes,codec,width,height,fps,duration,frames,ssim_card_vs_export,ssim_preview_vs_export" > "$dir/metrics.csv"
for mp4 in "$dir"/*.mp4; do
  slug="$(basename "$mp4" .mp4)"
  card="$dir/$slug-1-card.png"
  exp="$dir/frames/$slug-export.png"
  ffmpeg -v error -y -ss "$t" -i "$mp4" -frames:v 1 "$exp"
  IFS=, read -r cw ch < <(ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$card")
  info="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,duration,nb_frames -of csv=p=0 "$mp4")"
  ssim="$(ffmpeg -v info -i "$card" -i "$exp" -filter_complex "[1]scale=${cw}:${ch}[e];[0][e]ssim" -f null - 2>&1 | grep -o 'All:[0-9.]*' | cut -d: -f2 || echo n/a)"
  prev="$dir/$slug-3-preview.png"
  # the live preview screenshot includes a 52 px control bar; crop it off first
  ffmpeg -v error -y -i "$prev" -vf "crop=iw:ih-52:0:0" "$dir/frames/$slug-preview-crop.png"
  IFS=, read -r pw ph < <(ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$dir/frames/$slug-preview-crop.png")
  pssim="$(ffmpeg -v info -i "$dir/frames/$slug-preview-crop.png" -i "$exp" -filter_complex "[1]scale=${pw}:${ph}[e];[0][e]ssim" -f null - 2>&1 | grep -o 'All:[0-9.]*' | cut -d: -f2 || echo n/a)"
  echo "$slug,$(sha256sum "$mp4" | cut -c1-64),$(stat -c %s "$mp4"),$info,$ssim,$pssim" >> "$dir/metrics.csv"
  # card | live preview @1.5 s | exported frame @1.5 s | editor stage
  editor="$dir/$slug-2-editor.png"
  ffmpeg -v error -y -i "$card" -i "$dir/frames/$slug-preview-crop.png" -i "$exp" -i "$editor" -filter_complex \
    "[0]scale=-1:360[a];[1]scale=-1:360[b];[2]scale=-1:360[c];[3]scale=-1:360[d];[a][b][c][d]hstack=4" "$dir/frames/$slug-compare.png"
done
cat "$dir/metrics.csv"
