/** Shared silence/duration gate for voice.ts (MediaRecorder) and
 * wav-recorder.ts (ScriptProcessor/WAV) — rejects a recording before it's
 * ever uploaded, instead of letting an accidental tap or a silent/near-silent
 * clip reach the STT endpoint (where it's likely to come back as a
 * hallucinated "you"/"thank you"/etc.). */

// Below this, a tap-and-release is virtually certain to be accidental, not
// speech — no legitimate word takes less than half a second to say.
export const MIN_RECORDING_MS = 500;

// RMS threshold on audio-level-meter.ts's 0..1 scale (same *4 headroom
// scaling). Ambient room noise/breath sits below this; normal speech peaks
// well above it.
export const SILENCE_RMS_THRESHOLD = 0.02;

export class RecordingRejectedError extends Error {
  constructor(public reason: "too_short" | "silent") {
    super(`recording rejected: ${reason}`);
    this.name = "RecordingRejectedError";
  }
}

/** Given the elapsed recording time and the peak RMS level observed during
 * it, throws RecordingRejectedError if the clip should never be uploaded. */
export function assertRecordingIsUsable(elapsedMs: number, peakLevel: number): void {
  if (elapsedMs < MIN_RECORDING_MS) throw new RecordingRejectedError("too_short");
  if (peakLevel < SILENCE_RMS_THRESHOLD) throw new RecordingRejectedError("silent");
}
