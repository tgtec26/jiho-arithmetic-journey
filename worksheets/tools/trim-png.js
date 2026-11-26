// 스티커 PNG의 흰색·투명 여백을 잘라 낸다 (외부 의존성 없음).
// 사용: node worksheets/tools/trim-png.js <file.png>...
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});
function crc32(buf) {
	let c = 0xffffffff;
	for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

/** 8비트 RGB/RGBA, 비인터레이스 PNG → { width, height, data(RGBA) } */
export function decodePng(buf) {
	if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('PNG 아님');
	let pos = 8;
	let width, height, colorType, bitDepth, interlace;
	const idat = [];
	while (pos < buf.length) {
		const len = buf.readUInt32BE(pos);
		const type = buf.toString('ascii', pos + 4, pos + 8);
		const body = buf.subarray(pos + 8, pos + 8 + len);
		if (type === 'IHDR') {
			width = body.readUInt32BE(0);
			height = body.readUInt32BE(4);
			bitDepth = body[8];
			colorType = body[9];
			interlace = body[12];
		} else if (type === 'IDAT') idat.push(body);
		else if (type === 'IEND') break;
		pos += 12 + len;
	}
	if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
		throw new Error(`지원하지 않는 PNG (bitDepth ${bitDepth}, colorType ${colorType}, interlace ${interlace})`);
	}
	const bpp = colorType === 6 ? 4 : 3;
	const raw = inflateSync(Buffer.concat(idat));
	const stride = width * bpp;
	const pixels = Buffer.alloc(height * stride);
	for (let y = 0; y < height; y++) {
		const filter = raw[y * (stride + 1)];
		const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
		const out = pixels.subarray(y * stride, (y + 1) * stride);
		const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
		for (let i = 0; i < stride; i++) {
			const a = i >= bpp ? out[i - bpp] : 0;
			const b = prev ? prev[i] : 0;
			const c = prev && i >= bpp ? prev[i - bpp] : 0;
			let v = line[i];
			if (filter === 1) v += a;
			else if (filter === 2) v += b;
			else if (filter === 3) v += (a + b) >> 1;
			else if (filter === 4) {
				const p = a + b - c;
				const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
				v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
			}
			out[i] = v & 0xff;
		}
	}
	if (bpp === 4) return { width, height, data: pixels };
	const data = Buffer.alloc(width * height * 4);
	for (let i = 0, j = 0; i < pixels.length; i += 3, j += 4) {
		data[j] = pixels[i];
		data[j + 1] = pixels[i + 1];
		data[j + 2] = pixels[i + 2];
		data[j + 3] = 255;
	}
	return { width, height, data };
}

function chunk(type, body) {
	const head = Buffer.alloc(8);
	head.writeUInt32BE(body.length, 0);
	head.write(type, 4, 'ascii');
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
	return Buffer.concat([head, body, crc]);
}

/** { width, height, data(RGBA) } → PNG (RGBA) */
export function encodePng({ width, height, data }) {
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	const stride = width * 4;
	const raw = Buffer.alloc(height * (stride + 1));
	for (let y = 0; y < height; y++) data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
	return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** 흰색(모든 채널 ≥ white) 또는 투명(alpha < 16) 여백을 잘라 냄. pad = 짧은 변 대비 여백 비율 */
export function trimPng(buf, { white = 245, pad = 0.02 } = {}) {
	const { width, height, data } = decodePng(buf);
	let x0 = width, y0 = height, x1 = -1, y1 = -1;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const empty = data[i + 3] < 16 || (data[i] >= white && data[i + 1] >= white && data[i + 2] >= white);
			if (!empty) {
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
		}
	}
	if (x1 < 0) return buf;
	const p = Math.round(Math.min(width, height) * pad);
	x0 = Math.max(0, x0 - p);
	y0 = Math.max(0, y0 - p);
	x1 = Math.min(width - 1, x1 + p);
	y1 = Math.min(height - 1, y1 + p);
	const w = x1 - x0 + 1;
	const h = y1 - y0 + 1;
	const out = Buffer.alloc(w * h * 4);
	for (let y = 0; y < h; y++) data.copy(out, y * w * 4, ((y0 + y) * width + x0) * 4, ((y0 + y) * width + x1 + 1) * 4);
	return encodePng({ width: w, height: h, data: out });
}

if (import.meta.url === `file://${process.argv[1]}`) {
	for (const file of process.argv.slice(2)) {
		const before = decodePng(readFileSync(file));
		const trimmed = trimPng(readFileSync(file));
		writeFileSync(file, trimmed);
		const after = decodePng(trimmed);
		console.log(`${file}: ${before.width}×${before.height} → ${after.width}×${after.height}`);
	}
}
