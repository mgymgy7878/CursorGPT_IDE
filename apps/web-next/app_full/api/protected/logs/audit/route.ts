import { NextRequest, NextResponse } from "next/server";
import { existsSync, statSync, watch } from "fs";
import { promises as fsp } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getAuditPath() {
	const p = process.env.AUDIT_LOG_PATH || path.join(process.cwd(), "apps/web-next/.data/audit.log");
	return path.resolve(p);
}

function encoder() { return new TextEncoder(); }
function sseLine(data: string) { return `data: ${data}\n\n`; }
function sseEvent(ev: string, data: string) { return `event: ${ev}\ndata: ${data}\n\n`; }

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const auditPath = getAuditPath();

	const backlogBytes = Math.max(0, parseInt(url.searchParams.get("backlog") || "0", 10) || 0);
	const heartbeatMs = Math.max(25000, parseInt(url.searchParams.get("hb") || "25000", 10) || 25000);
	const pollMs = Math.max(500, parseInt(url.searchParams.get("poll") || "800", 10) || 800);
	const maxChunk = Math.max(1024, parseInt(url.searchParams.get("max") || "16384", 10) || 16384);

	await fsp.mkdir(path.dirname(auditPath), { recursive: true });
	if (!existsSync(auditPath)) {
		// create empty file if missing
		await fsp.writeFile(auditPath, "", "utf8");
	}

	let lastSize = 0;
	try { lastSize = statSync(auditPath).size; } catch { lastSize = 0; }

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const enc = encoder();

			// headers
			controller.enqueue(enc.encode(sseEvent("ready", JSON.stringify({ file: auditPath, ts: Date.now() }))));

			// send backlog (tail by bytes from end)
			if (backlogBytes > 0 && lastSize > 0) {
				const start = Math.max(0, lastSize - backlogBytes);
				const fh = await fsp.open(auditPath, "r");
				try {
					const buf = Buffer.allocUnsafe(Math.min(maxChunk, backlogBytes));
					let pos = start;
					let carry = "";
					while (pos < lastSize) {
						const toRead = Math.min(buf.length, lastSize - pos);
						const { bytesRead } = await fh.read(buf, 0, toRead, pos);
						if (!bytesRead) break;
						pos += bytesRead;
						const chunk = carry + buf.subarray(0, bytesRead).toString("utf8");
						const parts = chunk.split(/\r?\n/);
						carry = parts.pop() || "";
						for (const line of parts) {
							if (line.trim().length === 0) continue;
							controller.enqueue(enc.encode(sseLine(line)));
						}
					}
					if (carry.trim().length) {
						controller.enqueue(enc.encode(sseLine(carry)));
					}
				} finally {
					await fh.close();
				}
			}

			// heartbeat
			let hbTimer: NodeJS.Timeout | null = setInterval(() => {
				controller.enqueue(enc.encode(sseEvent("hb", JSON.stringify({ ts: Date.now() }))));
			}, heartbeatMs);

			// live tail
			let watcher: ReturnType<typeof watch> | null = null;
			let stop = false;

			const pumpAppend = async () => {
				if (stop) return;
				let sizeNow = 0;
				try { sizeNow = statSync(auditPath).size; } catch { sizeNow = 0; }
				// rotation or truncate
				if (sizeNow < lastSize) {
					lastSize = 0;
				}
				if (sizeNow > lastSize) {
					const fh = await fsp.open(auditPath, "r");
					try {
						let pos = lastSize;
						const buf = Buffer.allocUnsafe(Math.min(maxChunk, sizeNow - lastSize));
						let carry = "";
						while (pos < sizeNow) {
							const toRead = Math.min(buf.length, sizeNow - pos);
							const { bytesRead } = await fh.read(buf, 0, toRead, pos);
							if (!bytesRead) break;
							pos += bytesRead;
							const chunk = carry + buf.subarray(0, bytesRead).toString("utf8");
							const parts = chunk.split(/\r?\n/);
							carry = parts.pop() || "";
							for (const line of parts) {
								if (line.trim().length === 0) continue;
								controller.enqueue(enc.encode(sseLine(line)));
							}
						}
						if (carry.trim().length) {
							controller.enqueue(enc.encode(sseLine(carry)));
						}
						lastSize = sizeNow;
					} finally {
						await fh.close();
					}
				}
			};

			// fs.watch with fallback polling (Windows-friendly)
			try {
				watcher = watch(auditPath, { persistent: false }, (_event, _fname) => {
					pumpAppend().catch(() => { /* swallow */ });
				});
			} catch {
				watcher = null;
			}

			let pollTimer: NodeJS.Timeout | null = null;
			if (!watcher) {
				pollTimer = setInterval(() => { pumpAppend().catch(()=>{}); }, pollMs);
			}

			// initial pump to catch early writes
			pumpAppend().catch(()=>{});

			// cleanup on close
			const abort = req.signal;
			const onAbort = () => {
				stop = true;
				if (hbTimer) clearInterval(hbTimer), hbTimer = null;
				if (pollTimer) clearInterval(pollTimer), pollTimer = null;
				if (watcher) watcher.close(), watcher = null;
				try { controller.close(); } catch {}
			};
			if ((abort as any)?.aborted) onAbort();
			abort.addEventListener("abort", onAbort);
		}
	});

	return new NextResponse(stream as any, {
		status: 200,
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			"X-Accel-Buffering": "no",
			"Connection": "keep-alive",
		}
	});
} 
