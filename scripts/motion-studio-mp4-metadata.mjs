#!/usr/bin/env node
/**
 * Reads the REAL metadata of an MP4 file by parsing its ISO-BMFF boxes.
 *
 * No ffprobe / no ffmpeg: the file is parsed in pure Node so the evidence
 * metadata can never drift from the artifact that is actually in the repo.
 *
 *   node scripts/motion-studio-mp4-metadata.mjs docs/motion-studio-evidence/export.mp4
 *
 * Prints the metadata object as JSON on stdout.
 */
import fs from 'node:fs';

const CONTAINER_BOXES = new Set([
  'moov',
  'trak',
  'mdia',
  'minf',
  'stbl',
  'edts',
  'dinf',
  'udta',
  'mvex',
  'moof',
  'traf',
]);

/** ISO-BMFF epoch: 1904-01-01T00:00:00Z (seconds since the Unix epoch). */
const MP4_EPOCH_OFFSET_SECONDS = 2082844800;

const CODEC_NAMES = {
  avc1: 'h264',
  avc3: 'h264',
  hvc1: 'h265',
  hev1: 'h265',
  vp08: 'vp8',
  vp09: 'vp9',
  av01: 'av1',
  mp4a: 'aac',
  opus: 'opus',
  alac: 'alac',
  'ac-3': 'ac3',
  'ec-3': 'eac3',
};

function parseBoxes(buf, start, end) {
  const boxes = [];
  let offset = start;
  while (offset + 8 <= end) {
    let size = buf.readUInt32BE(offset);
    const type = buf.toString('latin1', offset + 4, offset + 8);
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > end) break;
      const high = buf.readUInt32BE(offset + 8);
      const low = buf.readUInt32BE(offset + 12);
      size = high * 2 ** 32 + low;
      headerSize = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < headerSize || offset + size > end) break;
    boxes.push({
      type,
      start: offset,
      size,
      headerSize,
      bodyStart: offset + headerSize,
      bodyEnd: offset + size,
    });
    offset += size;
  }
  return boxes;
}

function findChild(buf, parent, type) {
  if (!parent) return null;
  const boxes = parseBoxes(buf, parent.bodyStart, parent.bodyEnd);
  return boxes.find((b) => b.type === type) ?? null;
}

function findPath(buf, path, start, end) {
  let scope = { bodyStart: start, bodyEnd: end };
  let box = null;
  for (const type of path) {
    box = findChild(buf, scope, type);
    if (!box) return null;
    scope = box;
  }
  return box;
}

/** Seconds between 1904-01-01 and the Unix epoch. */
function mp4TimeToIso(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const unix = seconds - MP4_EPOCH_OFFSET_SECONDS;
  const date = new Date(unix * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** mvhd → movie timescale / duration / creation time. */
function readMovieHeader(buf, moov) {
  const mvhd = findChild(buf, moov, 'mvhd');
  if (!mvhd) return null;
  const version = buf.readUInt8(mvhd.bodyStart);
  let timescale;
  let duration;
  let creation;
  if (version === 1) {
    creation = Number(buf.readBigUInt64BE(mvhd.bodyStart + 4));
    timescale = buf.readUInt32BE(mvhd.bodyStart + 16);
    duration = Number(buf.readBigUInt64BE(mvhd.bodyStart + 20));
  } else {
    creation = buf.readUInt32BE(mvhd.bodyStart + 4);
    timescale = buf.readUInt32BE(mvhd.bodyStart + 12);
    duration = buf.readUInt32BE(mvhd.bodyStart + 16);
  }
  return { version, timescale, duration, creation };
}

/** tkhd → display width/height (16.16 fixed point). */
function readTrackHeader(buf, trak) {
  const tkhd = findChild(buf, trak, 'tkhd');
  if (!tkhd) return null;
  const version = buf.readUInt8(tkhd.bodyStart);
  const base = version === 1 ? 88 : 76;
  const width = buf.readUInt32BE(tkhd.bodyStart + base) / 65536;
  const height = buf.readUInt32BE(tkhd.bodyStart + base + 4) / 65536;
  return { version, width, height };
}

/** stsd → the sample description fourcc of the first entry. */
function readSampleEntry(buf, trak) {
  const stsd = findPath(buf, ['mdia', 'minf', 'stbl', 'stsd'], trak.bodyStart, trak.bodyEnd);
  if (!stsd) return null;
  const entryStart = stsd.bodyStart + 8; // version/flags + entry_count
  if (entryStart + 8 > stsd.bodyEnd) return null;
  const format = buf.toString('latin1', entryStart + 4, entryStart + 8);
  // Visual sample entries carry the coded width/height as two uint16.
  let width = 0;
  let height = 0;
  if (entryStart + 32 <= stsd.bodyEnd) {
    width = buf.readUInt16BE(entryStart + 24);
    height = buf.readUInt16BE(entryStart + 26);
  }
  return { format, width, height };
}

/** hdlr → the track handler type ('vide', 'soun', …). */
function readHandler(buf, trak) {
  const hdlr = findPath(buf, ['mdia', 'hdlr'], trak.bodyStart, trak.bodyEnd);
  if (!hdlr) return null;
  return buf.toString('latin1', hdlr.bodyStart + 8, hdlr.bodyStart + 12);
}

/** mdhd → media timescale / duration (used to cross-check the movie header). */
function readMediaHeader(buf, trak) {
  const mdhd = findPath(buf, ['mdia', 'mdhd'], trak.bodyStart, trak.bodyEnd);
  if (!mdhd) return null;
  const version = buf.readUInt8(mdhd.bodyStart);
  if (version === 1) {
    return {
      timescale: buf.readUInt32BE(mdhd.bodyStart + 16),
      duration: Number(buf.readBigUInt64BE(mdhd.bodyStart + 20)),
    };
  }
  return {
    timescale: buf.readUInt32BE(mdhd.bodyStart + 12),
    duration: buf.readUInt32BE(mdhd.bodyStart + 16),
  };
}

/**
 * Parse an MP4 buffer into a metadata object.
 * @param {Buffer} buf
 * @param {{ filePath?: string, fileSize?: number, fileMtime?: Date }} [extra]
 */
export function parseMp4Metadata(buf, extra = {}) {
  const top = parseBoxes(buf, 0, buf.length);
  const ftyp = top.find((b) => b.type === 'ftyp');
  const moov = top.find((b) => b.type === 'moov');

  const ftypInfo = ftyp
    ? {
        major_brand: buf.toString('latin1', ftyp.bodyStart, ftyp.bodyStart + 4),
        minor_version: buf.readUInt32BE(ftyp.bodyStart + 4),
        compatible_brands: [],
      }
    : null;
  if (ftypInfo) {
    for (let o = ftyp.bodyStart + 8; o + 4 <= ftyp.bodyEnd; o += 4) {
      ftypInfo.compatible_brands.push(buf.toString('latin1', o, o + 4));
    }
  }

  const mvhd = moov ? readMovieHeader(buf, moov) : null;
  const traks = moov ? parseBoxes(buf, moov.bodyStart, moov.bodyEnd).filter((b) => b.type === 'trak') : [];

  let video = null;
  let audio = null;
  for (const trak of traks) {
    const handler = readHandler(buf, trak);
    const tkhd = readTrackHeader(buf, trak);
    const stsd = readSampleEntry(buf, trak);
    const mdhd = readMediaHeader(buf, trak);
    const track = {
      handler,
      width: tkhd?.width ?? 0,
      height: tkhd?.height ?? 0,
      codec: stsd ? CODEC_NAMES[stsd.format] ?? stsd.format : '',
      codec_fourcc: stsd?.format ?? '',
      coded_width: stsd?.width ?? 0,
      coded_height: stsd?.height ?? 0,
      duration_seconds:
        mdhd && mdhd.timescale ? Number((mdhd.duration / mdhd.timescale).toFixed(3)) : null,
    };
    if (handler === 'vide' && !video) video = track;
    if (handler === 'soun' && !audio) audio = track;
  }

  const durationSeconds = mvhd && mvhd.timescale
    ? Number((mvhd.duration / mvhd.timescale).toFixed(3))
    : null;

  const width = video?.coded_width || video?.width || 0;
  const height = video?.coded_height || video?.height || 0;

  const stat = extra.filePath ? fs.statSync(extra.filePath) : null;

  return {
    file: extra.filePath ?? null,
    size_bytes: extra.fileSize ?? stat?.size ?? buf.length,
    container: 'MP4',
    ftyp_brand: ftypInfo?.major_brand ?? null,
    ftyp_compatible_brands: ftypInfo?.compatible_brands ?? [],
    width,
    height,
    duration_seconds: durationSeconds,
    video_codec: video?.codec ?? '',
    video_codec_fourcc: video?.codec_fourcc ?? '',
    audio_codec: audio?.codec ?? '',
    audio_codec_fourcc: audio?.codec_fourcc ?? '',
    movie_timescale: mvhd?.timescale ?? null,
    creation_time: mvhd ? mp4TimeToIso(mvhd.creation) : null,
    date: stat ? stat.mtime.toISOString() : null,
    tracks: traks.length,
  };
}

/** Read + parse a file from disk. */
export function readMp4Metadata(filePath) {
  const buf = fs.readFileSync(filePath);
  const stat = fs.statSync(filePath);
  return parseMp4Metadata(buf, {
    filePath,
    fileSize: stat.size,
    fileMtime: stat.mtime,
  });
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node scripts/motion-studio-mp4-metadata.mjs <file.mp4>');
    process.exit(1);
  }
  console.log(JSON.stringify(readMp4Metadata(file), null, 2));
}
