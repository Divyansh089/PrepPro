import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { RunCodeInput } from '../validators/interview.validator';

// Judge0 language ids (see GET {JUDGE0_URL}/languages)
const LANGUAGE_IDS = {
  javascript: 102, // Node.js 22
  python: 100, // Python 3.12
  java: 91, // JDK 17, the class must be called Main
  cpp: 105, // GCC 14
};

const TIMEOUT_MS = 20000;

export type RunResult = {
  status: string; // "Accepted", "Compilation Error", "Time Limit Exceeded", ...
  stdout: string;
  stderr: string;
  time: number | null; // seconds
};

// Runs code on Judge0. User code never runs on our own server.
export async function runCode(input: RunCodeInput): Promise<RunResult> {
  if (!env.judge0Url) {
    throw new AppError(503, 'Code runner is not set up');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Only needed for the RapidAPI version of Judge0
  if (env.judge0ApiKey) {
    headers['X-RapidAPI-Key'] = env.judge0ApiKey;
    headers['X-RapidAPI-Host'] = new URL(env.judge0Url).host;
  }

  let data: any;
  try {
    const response = await fetch(`${env.judge0Url}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: input.code,
        language_id: LANGUAGE_IDS[input.language],
        stdin: input.stdin ?? '',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error('Judge0 error:', response.status, await response.text());
      throw new Error(`Judge0 returned ${response.status}`);
    }

    data = await response.json();
  } catch (err: any) {
    console.error('Code run failed:', err.message);
    throw new AppError(502, 'Could not run the code, please try again');
  }

  return {
    status: data.status?.description ?? 'Unknown',
    stdout: data.stdout ?? '',
    // Compile errors come back in compile_output, runtime errors in stderr
    stderr: data.compile_output || data.stderr || data.message || '',
    time: data.time ? Number(data.time) : null,
  };
}
