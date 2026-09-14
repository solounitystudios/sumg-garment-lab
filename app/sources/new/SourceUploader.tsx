"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ALLOWED_SOURCE_MIME_TYPES,
  validateSourceUpload,
} from "@/lib/domain/upload-validation";
import formStyles from "@/app/forms.module.css";
import styles from "./uploader.module.css";

type PickedFile = {
  file: File;
  widthPx: number | null;
  heightPx: number | null;
};

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    image.src = objectUrl;
  });
}

export default function SourceUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setPicked(null);
    if (!file) return;

    const validation = validateSourceUpload({
      mimeType: file.type,
      byteSize: file.size,
    });
    if (!validation.ok) {
      setError(validation.message);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const dimensions = await readImageDimensions(file);
    setPicked({
      file,
      widthPx: dimensions?.width ?? null,
      heightPx: dimensions?.height ?? null,
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!picked || uploading) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.set("file", picked.file);
    if (picked.widthPx) formData.set("widthPx", String(picked.widthPx));
    if (picked.heightPx) formData.set("heightPx", String(picked.heightPx));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/sources");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      let body: { id?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // non-JSON response, fall through to generic error below
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.id) {
        router.push(`/sources/${body.id}`);
        return;
      }
      setError(body.error ?? `Upload failed (HTTP ${xhr.status}).`);
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Network error during upload.");
    };

    xhr.send(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.field}>
        <input
          ref={inputRef}
          className={styles.input}
          type="file"
          accept={ALLOWED_SOURCE_MIME_TYPES.join(",")}
          onChange={handleFileChange}
          disabled={uploading}
        />

        {picked && (
          <div className={styles.preview}>
            <span className={styles.previewName}>{picked.file.name}</span>
            <span>{picked.file.type}</span>
            <span>{(picked.file.size / (1024 * 1024)).toFixed(2)} MB</span>
            {picked.widthPx && picked.heightPx && (
              <span>
                {picked.widthPx}×{picked.heightPx}px
              </span>
            )}
          </div>
        )}

        {uploading && progress !== null && (
          <>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressLabel}>Uploading — {progress}%</div>
          </>
        )}

        {error && <div className={styles.error}>{error}</div>}
      </div>

      <button
        className={formStyles.submit}
        type="submit"
        disabled={!picked || uploading}
      >
        {uploading ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
