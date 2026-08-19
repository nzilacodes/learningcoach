/** Robust cross-browser microphone recorder that outputs a real WAV blob.
 *  Uses Web Audio API (AudioWorklet fallback: ScriptProcessorNode) to capture
 *  PCM samples and encodes them as a 16-bit mono WAV at 16 kHz — the format
 *  OpenAI's transcription endpoints reliably accept on every browser
 *  (including iOS Safari, where MediaRecorder produces fragmented MP4 that
 *  the model can't decode). */

export type WavRecorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

const TARGET_SR = 16000;

function downsample(input: Float32Array, inputSR: number, targetSR: number): Float32Array {
  if (targetSR >= inputSR) return input;
  const ratio = inputSR / targetSR;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  let o = 0;
  let i = 0;
  while (o < outLen) {
    const nextI = Math.floor((o + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let j = i; j < nextI && j < input.length; j++) {
      sum += input[j];
      count++;
    }
    out[o] = count ? sum / count : 0;
    o++;
    i = nextI;
  }
  return out;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

export async function startWavRecording(): Promise<WavRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  });
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const source = ctx.createMediaStreamSource(stream);
  // ScriptProcessor is deprecated but works everywhere including iOS Safari.
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  node.onaudioprocess = (e) => {
    const ch = e.inputBuffer.getChannelData(0);
    chunks.push(new Float32Array(ch));
  };
  source.connect(node);
  node.connect(ctx.destination);

  const cleanup = () => {
    try {
      node.disconnect();
    } catch (err) {
      console.warn("[wav-recorder] failed to disconnect processor node", err);
    }
    try {
      source.disconnect();
    } catch (err) {
      console.warn("[wav-recorder] failed to disconnect audio source", err);
    }
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };

  return {
    stop: async () => {
      // Let the last audio callback fire.
      await new Promise((r) => setTimeout(r, 100));
      const inputSR = ctx.sampleRate;
      cleanup();
      const total = chunks.reduce((n, c) => n + c.length, 0);
      const merged = new Float32Array(total);
      let off = 0;
      for (const c of chunks) {
        merged.set(c, off);
        off += c.length;
      }
      const down = downsample(merged, inputSR, TARGET_SR);
      return encodeWav(down, TARGET_SR);
    },
    cancel: () => cleanup(),
  };
}
