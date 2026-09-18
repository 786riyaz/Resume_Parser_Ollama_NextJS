"use client";
import { useMemo, useState } from "react";
import { CandidateTable } from "@/components/CandidateTable";
import { Loader } from "@/components/Loader";
import { ProgressBar } from "@/components/ProgressBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UploadBox } from "@/components/UploadBox";
import type { Candidate, UploadResult } from "@/lib/types";
type ErrorItem = {
fileName: string;
message: string;
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;
export default function Home() {
const [files, setFiles] = useState<File[]>([]);
const [candidates, setCandidates] = useState<Candidate[]>([]);
const [errors, setErrors] = useState<ErrorItem[]>([]);
const [isProcessing, setIsProcessing] = useState(false);
const [isExporting, setIsExporting] = useState(false);
const [progress, setProgress] = useState(0);
const [status, setStatus] = useState("Ready");
const invalidFiles = useMemo(() => {
return files.filter((file) => file.size > MAX_FILE_SIZE || !(file.type === "application/pdf" || file.name.endsWith(".pdf")));
}, [files]);
function updateCandidate(id: string, field: keyof Candidate, value: string) {
setCandidates((current) =>
current.map((candidate) => (candidate.id === id ? { ...candidate, [field]: value || null } : candidate))
);
}
async function extractResumes() {
if (!files.length || invalidFiles.length) return;
setIsProcessing(true);
setProgress(12);
setStatus(`Uploading ${files.length} resume${files.length === 1 ? "" : "s"}...`);
setErrors([]);
try {
const collectedCandidates: Candidate[] = [];
const collectedErrors: ErrorItem[] = [];
for (const [index, file] of files.entries()) {
const formData = new FormData();
formData.append("files", file);
setProgress(Math.max(10, Math.round((index / files.length) * 90)));
setStatus(`Parsing resume ${index + 1}/${files.length}: ${file.name}`);
const response = await fetch("/api/upload", {
method: "POST",
body: formData
});
const data = await response.json() as UploadResult | { error: string };
if (!response.ok || "error" in data) {
collectedErrors.push({
fileName: file.name,
message: "error" in data ? data.error : "Unable to parse resume."
});
} else {
collectedCandidates.push(...data.candidates);
collectedErrors.push(...data.errors);
setCandidates((current) => [...current, ...data.candidates]);
setErrors([...collectedErrors]);
}
}
setProgress(100);
setStatus(`Parsed ${collectedCandidates.length} resume${collectedCandidates.length === 1 ? "" : "s"}.`);
setErrors(collectedErrors);
setFiles([]);
} catch (error) {
setProgress(0);
setStatus(error instanceof Error ? error.message : "Unable to parse resumes.");
} finally {
setIsProcessing(false);
}
}
async function downloadExcel() {
if (!candidates.length) return;
setIsExporting(true);
try {
const response = await fetch("/api/export", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ candidates })
});
if (!response.ok) {
const data = await response.json().catch(() => ({ error: "Unable to export Excel." }));
throw new Error(data.error ?? "Unable to export Excel.");
}
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = "Candidates.xlsx";
document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(url);
} catch (error) {
setErrors([{ fileName: "Excel export", message: error instanceof Error ? error.message : "Unable to export Excel." }]);
} finally {
setIsExporting(false);
}
}
return (
<main className="min-h-screen">
<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
<header className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
<div>
<h1 className="text-3xl font-bold tracking-normal text-[var(--text-primary)]">AI Resume Parser</h1>
<>
<p className="mt-2 text-sm text-[var(--text-secondary)]">Local PDF extraction powered by Next.js, Ollama, and Excel export. </p>
<p className="text-sm text-[var(--text-secondary)]">Please contact the administrator before using this service, as it requires the Ollama service to be running locally on your machine.</p>
</>
</div>
<div className="flex flex-wrap items-center gap-3">
<ThemeToggle />
<button
type="button"
disabled={!files.length || Boolean(invalidFiles.length) || isProcessing}
onClick={extractResumes}
className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
>
{isProcessing ? <Loader /> : null}
Extract
</button>
<button
type="button"
disabled={!candidates.length || isExporting}
onClick={downloadExcel}
className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-alt)]"
>
{isExporting ? <Loader /> : null}
Download Excel
</button>
</div>
</header>
<UploadBox files={files} disabled={isProcessing} onFilesChange={setFiles} />
{invalidFiles.length ? (
<div className="rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]">
{invalidFiles.length} file{invalidFiles.length === 1 ? "" : "s"} rejected. Use PDF files up to 10 MB each.
</div>
) : null}
{(isProcessing || progress > 0) ? <ProgressBar value={progress} label={status} /> : null}
{errors.length ? (
<section className="rounded-md border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4">
<h2 className="text-sm font-semibold text-[var(--warning-heading)]">Files needing attention</h2>
<div className="mt-3 grid gap-2 text-sm text-[var(--warning-text)]">
{errors.map((error) => (
<div key={`${error.fileName}-${error.message}`} className="rounded-md bg-[var(--surface)] px-3 py-2">
<strong>{error.fileName}</strong>: {error.message}
</div>
))}
</div>
</section>
) : null}
<section className="flex flex-col gap-4">
<div className="flex flex-wrap items-center justify-between gap-3">
<h2 className="text-xl font-semibold text-[var(--text-primary)]">Candidates</h2>
<span className="rounded-md bg-[var(--pill-bg)] px-3 py-2 text-sm font-semibold text-[var(--pill-text)]">
{candidates.length} total
</span>
</div>
<CandidateTable
candidates={candidates}
onChange={updateCandidate}
onDelete={(id) => setCandidates((current) => current.filter((candidate) => candidate.id !== id))}
/>
{!candidates.length ? (
<div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-secondary)]">
Uploaded candidate details will appear here.
</div>
) : null}
</section>
</div>
</main>
);
}
