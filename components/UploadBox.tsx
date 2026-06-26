"use client";

import { useRef, useState } from "react";

type UploadBoxProps = {
  files: File[];
  disabled: boolean;
  onFilesChange: (files: File[]) => void;
};

export function UploadBox({ files, disabled, onFilesChange }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const pdfs = Array.from(fileList).filter((file) => file.type === "application/pdf" || file.name.endsWith(".pdf"));
    onFilesChange(pdfs);
  }

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        addFiles(event.dataTransfer.files);
      }}
      className={`rounded-md border-2 border-dashed p-8 transition ${
        isDragging ? "border-[#2f6fed] bg-[#edf4ff]" : "border-[#b9c2d0] bg-white"
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#e7eefc] text-2xl text-[#2f6fed]">
          PDF
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-[#172033]">Resume Parser</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#5d697c]">
            Drop PDF resumes here or choose files from your computer.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(event) => addFiles(event.target.files)}
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-[#172033] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#27344b]"
          >
            Choose Files
          </button>
          <span className="text-sm text-[#5d697c]">{files.length ? `${files.length} PDF selected` : "No files selected"}</span>
        </div>
      </div>
    </section>
  );
}

