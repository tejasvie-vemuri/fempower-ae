import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];

export function isVoiceRecordingSupported() {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

export async function startVoiceRecording(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  mediaRecorder.start();
}

export function stopVoiceRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error("Not recording"));
      return;
    }
    const recorder = mediaRecorder;
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      recorder.stream.getTracks().forEach((t) => t.stop());
      mediaRecorder = null;
      resolve(blob);
    };
    recorder.stop();
  });
}

export function cancelVoiceRecording() {
  if (!mediaRecorder) return;
  mediaRecorder.stream.getTracks().forEach((t) => t.stop());
  mediaRecorder = null;
}

// Sends the recording for transcription, the audio itself is never stored,
// only the resulting text comes back.
export async function transcribeAudio(blob: Blob): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");

  const form = new FormData();
  form.append("audio", blob, "recording.webm");

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-audio`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: form,
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || "Couldn't transcribe that");
  }

  const json = await resp.json();
  return (json.text ?? "").trim();
}
