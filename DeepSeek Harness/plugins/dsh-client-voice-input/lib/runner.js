import { spawn } from 'node:child_process';

/**
 * Run one short-lived helper process and capture its output. The child owns its
 * own process group on POSIX so cancellation terminates any grandchildren; the
 * timeout and abort signal both funnel through the same kill path.
 * @param command - executable to start.
 * @param args - arguments.
 * @param input - bytes for stdin, or null.
 * @param signal - cancellation signal.
 * @param timeoutMs - hard limit before the child is killed.
 * @returns stdout on a zero exit.
 */
export function run(command, args, input, signal, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, detached: process.platform !== 'win32' });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const kill = () => {
      try { if (process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM'); else child.kill(); }
      catch { child.kill(); }
    };
    const timer = setTimeout(kill, timeoutMs);
    const abort = () => kill();
    signal?.addEventListener('abort', abort, { once: true });
    child.stdout.on('data', chunk => { stdout = (stdout + chunk).slice(-4096); });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-4096); });
    child.stdin.on('error', () => {});
    child.on('error', finishError);
    child.on('close', code => {
      if (settled) return;
      settled = true;
      cleanup();
      if (signal?.aborted) reject(new Error('Operation cancelled'));
      else if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || stdout.trim() || `Worker exited (${code})`));
    });
    function finishError(error) { if (!settled) { settled = true; cleanup(); reject(error); } }
    function cleanup() { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
    if (input) child.stdin.end(input); else child.stdin.end();
  });
}

/**
 * Read a request body without ever buffering more than the caller allows.
 * @param request - incoming request.
 * @param limit - maximum accepted byte count.
 * @returns the buffered body.
 */
export async function readLimited(request, limit) {
  if (Number(request.headers.get('content-length')) > limit) throw new Error('Recording is too long');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Empty recording');
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) { await reader.cancel(); throw new Error('Recording is too long'); }
    chunks.push(value);
  }
  return Buffer.concat(chunks, total);
}
