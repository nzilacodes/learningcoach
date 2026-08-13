/** Live microphone input-level meter (0..1 RMS) for the Studio's "Entrada de
 * áudio" bars. Uses the same AudioContext/AnalyserNode approach as
 * wav-recorder.ts's capture pipeline, but only reads levels — it taps the
 * stream, it doesn't own or record it. */
export type LevelMeter = {
  getLevel: () => number;
  stop: () => void;
};

export function createLevelMeter(stream: MediaStream): LevelMeter {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);

  return {
    getLevel: () => {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i]! - 128) / 128;
        sumSquares += v * v;
      }
      // *4 headroom so ordinary speech visibly moves the meter instead of
      // sitting near the bottom (RMS of typical speech is quiet relative to 1.0).
      return Math.min(1, Math.sqrt(sumSquares / data.length) * 4);
    },
    stop: () => {
      try {
        source.disconnect();
      } catch {
        // already disconnected
      }
      void ctx.close();
    },
  };
}
