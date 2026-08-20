/** Camera/mic recording engine for the Media Studio. Mirrors the structure of
 * lib/voice.ts's startRecording() (device access -> MediaRecorder -> Blob),
 * extended with combined video+audio capture, pause/resume, and device/
 * resolution/fps selection. Audio-only recording still goes through
 * lib/wav-recorder.ts instead (it already solves iOS Safari's fragmented-MP4
 * MediaRecorder output) — this module only replaces it for video. */

export type VideoRecordingOptions = {
  cameraId?: string;
  micId?: string;
  width?: number;
  height?: number;
  fps?: number;
};

export type ActiveRecording = {
  stream: MediaStream;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<Blob>;
  cancel: () => void;
};

/** Browsers without MediaRecorder (e.g. older Safari) would otherwise hit a
 * raw ReferenceError the first time `new MediaRecorder(...)` runs — callers
 * should check this before offering the record UI at all. */
export function isRecordingSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

function pickMimeType(candidates: string[]): string {
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

export function stopStreamTracks(stream: MediaStream) {
  stream.getTracks().forEach((t) => t.stop());
}

export async function startCameraPreview(opts: VideoRecordingOptions): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: opts.cameraId ? { exact: opts.cameraId } : undefined,
      width: opts.width ? { ideal: opts.width } : undefined,
      height: opts.height ? { ideal: opts.height } : undefined,
      frameRate: opts.fps ? { ideal: opts.fps } : undefined,
    },
    audio: opts.micId ? { deviceId: { exact: opts.micId } } : true,
  });
}

export async function startMicOnlyStream(micId?: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: micId ? { deviceId: { exact: micId } } : true,
  });
}

/** Starts recording an already-open stream (from startCameraPreview /
 * startMicOnlyStream) — kept separate from stream acquisition so the caller
 * can show a live preview before the user presses record. */
export function recordStream(stream: MediaStream, kind: "video" | "audio"): ActiveRecording {
  if (!isRecordingSupported()) {
    throw new Error("MediaRecorder is not supported in this browser");
  }
  const mimeType =
    kind === "video"
      ? pickMimeType([
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          "video/mp4",
        ])
      : pickMimeType(["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]);

  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  // 1s timeslice keeps memory bounded on long recordings instead of buffering
  // everything in one final blob-worth of chunks at stop() time.
  recorder.start(1000);

  return {
    stream,
    pause: () => {
      if (recorder.state === "recording") recorder.pause();
    },
    resume: () => {
      if (recorder.state === "paused") recorder.resume();
    },
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        if (recorder.state === "inactive") {
          reject(new Error("Recorder already stopped"));
          return;
        }
        recorder.onstop = () =>
          resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" }));
        recorder.stop();
      }),
    cancel: () => {
      if (recorder.state !== "inactive") recorder.stop();
      stopStreamTracks(stream);
    },
  };
}

/** Draws the current video frame to an offscreen canvas — the Studio's
 * "Câmera" (photo capture) mode, which needs no MediaRecorder at all. */
export function capturePhoto(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas not supported"));
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to capture photo"))),
      "image/jpeg",
      0.92,
    );
  });
}
