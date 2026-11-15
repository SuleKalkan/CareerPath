import { useRef, useState } from "react";

export const SUPPORTED_FILE_TYPES = [
  { extension: ".pdf", mimeType: "application/pdf" },
  { extension: ".doc", mimeType: "application/msword" },
  { extension: ".docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { extension: ".csv", mimeType: "text/csv" },
] as const;

export const SUPPORTED_FILE_ACCEPT = SUPPORTED_FILE_TYPES.map(({ extension }) => extension).join(",");
export const SUPPORTED_FILE_LABEL = "PDF, DOC, DOCX or CSV";

export type SelectedFile = {
  name: string;
  type: string;
  size: number;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isSupportedFile(file: File) {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
  return SUPPORTED_FILE_TYPES.some(({ extension: supportedExtension, mimeType }) =>
    extension === supportedExtension && (!file.type || file.type === mimeType),
  );
}

export default function FileUpload({
  file,
  onSelect,
  onRemove,
  onError,
  label = "Upload file",
}: {
  file: SelectedFile | null;
  onSelect: (file: SelectedFile) => void;
  onRemove: () => void;
  onError: (message: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const selectFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!isSupportedFile(candidate)) {
      onError(`Choose a supported file: ${SUPPORTED_FILE_LABEL}.`);
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      onError("Files must be 10 MB or smaller.");
      return;
    }
    onSelect({ name: candidate.name, type: candidate.type, size: candidate.size });
  };

  return (
    <div
      className={`upload-zone file-upload ${file ? "uploaded" : ""} ${dragActive ? "drag-active" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { event.preventDefault(); setDragActive(false); }}
      onDrop={(event) => { event.preventDefault(); setDragActive(false); selectFile(event.dataTransfer.files?.[0]); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_FILE_ACCEPT}
        onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }}
      />
      <span>{file ? "✓" : "↑"}</span>
      <div>
        <strong>{file?.name || label}</strong>
        <small>{file ? `${SUPPORTED_FILE_LABEL} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : `${SUPPORTED_FILE_LABEL} · Max 10 MB`}</small>
      </div>
      {file ? (
        <div className="file-upload-actions">
          <button type="button" onClick={() => inputRef.current?.click()}>Replace</button>
          <button type="button" className="file-remove" onClick={onRemove}>Remove</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}>Choose file</button>
      )}
    </div>
  );
}
