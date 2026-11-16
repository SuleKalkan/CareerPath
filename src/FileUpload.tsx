import { useRef, useState } from "react";
import {
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_FILE_LABEL,
  SUPPORTED_FILE_TYPES,
  validateUpload,
} from "./lib/validateUpload";

export { SUPPORTED_FILE_LABEL, SUPPORTED_FILE_TYPES } from "./lib/validateUpload";

export const SUPPORTED_FILE_ACCEPT = SUPPORTED_FILE_TYPES.map(({ extension }) => extension).join(",");

export type SelectedFile = {
  name: string;
  type: string;
  size: number;
};

export default function FileUpload({
  file,
  onSelect,
  onRemove,
  onError,
  disabled = false,
  label = "Upload file",
}: {
  file: SelectedFile | null;
  onSelect: (file: SelectedFile, originalFile: File) => void;
  onRemove: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const selectFile = (candidate: File | undefined) => {
    if (!candidate || disabled) return;
    const validation = validateUpload(candidate);
    if (!validation.valid) {
      onError(validation.error);
      return;
    }
    onSelect({ name: candidate.name, type: candidate.type, size: candidate.size }, candidate);
  };

  return (
    <div
      className={`upload-zone file-upload ${file ? "uploaded" : ""} ${dragActive ? "drag-active" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragActive(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { event.preventDefault(); if (!disabled) setDragActive(false); }}
      onDrop={(event) => { event.preventDefault(); setDragActive(false); selectFile(event.dataTransfer.files?.[0]); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_FILE_ACCEPT}
        onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }}
        disabled={disabled}
      />
      <span>{file ? "✓" : "↑"}</span>
      <div>
        <strong>{file?.name || label}</strong>
        <small>{file ? `${SUPPORTED_FILE_LABEL} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : `${SUPPORTED_FILE_LABEL} · Max ${(MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)} MB`}</small>
      </div>
      {file ? (
        <div className="file-upload-actions">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled}>Replace</button>
          <button type="button" className="file-remove" onClick={onRemove} disabled={disabled}>Remove</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled}>Choose file</button>
      )}
    </div>
  );
}
