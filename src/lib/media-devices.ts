import { useCallback, useEffect, useState } from "react";

export type MediaDeviceOption = { deviceId: string; label: string };
export type DevicePermissionState = "unknown" | "granted" | "denied" | "prompt";

/** Camera/microphone lists for the Studio's device pickers. Labels are only
 * populated by the browser once permission has been granted at least once —
 * before that they read "Câmara 1"/"Microfone 1" etc. */
export function useMediaDevices() {
  const [cameras, setCameras] = useState<MediaDeviceOption[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceOption[]>([]);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    setCameras(
      devices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Câmara ${i + 1}` })),
    );
    setMicrophones(
      devices
        .filter((d) => d.kind === "audioinput")
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microfone ${i + 1}` })),
    );
  }, []);

  useEffect(() => {
    void refresh();
    const md = navigator.mediaDevices;
    md?.addEventListener?.("devicechange", refresh);
    return () => md?.removeEventListener?.("devicechange", refresh);
  }, [refresh]);

  return { cameras, microphones, refresh };
}

/** Best-effort permission read via the Permissions API — Safari doesn't
 * support querying "camera"/"microphone", so callers must still fall back to
 * actually calling getUserMedia() and handling the rejection either way. */
export async function queryPermission(
  name: "camera" | "microphone",
): Promise<DevicePermissionState> {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const status = await navigator.permissions.query({ name: name as PermissionName });
    return status.state as DevicePermissionState;
  } catch {
    return "unknown";
  }
}

export type MediaDeviceErrorReason = "denied" | "not-found" | "in-use" | "unknown";

/** Maps getUserMedia()'s DOMException names onto the doc's three "causas
 * possíveis" (permission blocked / device in use elsewhere / disconnected). */
export function classifyGetUserMediaError(err: unknown): MediaDeviceErrorReason {
  if (!(err instanceof DOMException)) return "unknown";
  switch (err.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "denied";
    case "NotFoundError":
    case "OverconstrainedError":
      return "not-found";
    case "NotReadableError":
    case "TrackStartError":
      return "in-use";
    default:
      return "unknown";
  }
}
