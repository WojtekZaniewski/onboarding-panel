"use client";

import { useRef, useState, useTransition } from "react";

export function Dropzone({
  action,
  accept,
  multiple = false,
  hint,
  extraFields,
}: {
  action: (formData: FormData) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  hint?: string;
  extraFields?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [over, setOver] = useState(false);
  const [pending, start] = useTransition();
  const [filename, setFilename] = useState<string>("");

  function submit() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    start(async () => {
      await action(fd);
      formRef.current?.reset();
      setFilename("");
    });
  }

  return (
    <form ref={formRef} className="dropzone" encType="multipart/form-data">
      {extraFields}
      <label
        className={"dropzone__area" + (over ? " dropzone__area--over" : "") + (pending ? " dropzone__area--pending" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length && inputRef.current) {
            inputRef.current.files = e.dataTransfer.files;
            setFilename(e.dataTransfer.files[0]?.name ?? "");
            submit();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFilename(f?.name ?? "");
            if (f) submit();
          }}
        />
        <div className="dropzone__icon">⬆</div>
        <div className="dropzone__text">
          {pending ? "Wgrywam…" : filename || (over ? "Upuść tutaj" : "Przeciągnij plik lub kliknij")}
        </div>
        {hint && <div className="dropzone__hint">{hint}</div>}
      </label>
    </form>
  );
}
