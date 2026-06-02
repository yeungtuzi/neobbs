import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const execFileAsync = promisify(execFile);

const MODEL_PATH = path.join(process.cwd(), '..', '..', 'models', 'ggml-small.bin');

@Injectable()
export class SpeechService {
  async transcribe(audioBuffer: Buffer): Promise<string> {
    const tmpDir = path.join(process.env.UPLOAD_DIR || './uploads', 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });

    const id = crypto.randomUUID();
    const rawFile = path.join(tmpDir, `${id}.webm`);
    const wavFile = path.join(tmpDir, `${id}.wav`);

    try {
      // Write raw buffer
      fs.writeFileSync(rawFile, audioBuffer);

      // Convert to 16kHz mono WAV (whisper-cli requirement)
      console.log('[whisper] converting audio, size:', audioBuffer.length);
      const { stderr: ffErr } = await execFileAsync('ffmpeg', [
        '-i', rawFile,
        '-ar', '16000',
        '-ac', '1',
        '-f', 'wav',
        wavFile,
        '-y',
      ], { timeout: 10000 });
      if (ffErr) console.log('[whisper] ffmpeg stderr:', ffErr.slice(0, 200));

      const wavSize = fs.statSync(wavFile).size;
      console.log('[whisper] wav size:', wavSize);

      if (wavSize < 100) return '[录音太短或无声]';

      // Run whisper
      const { stdout, stderr: whErr } = await execFileAsync('whisper-cli', [
        '-m', MODEL_PATH,
        '-f', wavFile,
        '-l', 'zh',
        '--no-timestamps',
        '-t', '4',
      ], { timeout: 30000 });

      console.log('[whisper] stderr:', whErr?.slice(0, 200) || 'none');
      console.log('[whisper] stdout:', JSON.stringify(stdout));

      const text = stdout
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('whisper_') && !line.match(/^\[/))
        .join('')
        .trim();

      console.log('[whisper] parsed text:', JSON.stringify(text));
      return text || '[未能识别语音]';
    } finally {
      try { fs.unlinkSync(rawFile); } catch {}
      try { fs.unlinkSync(wavFile); } catch {}
    }
  }
}
