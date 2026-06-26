"use client";

import type { Candidate } from "@/lib/types";

type CandidateTableProps = {
  candidates: Candidate[];
  onChange: (id: string, field: keyof Candidate, value: string) => void;
  onDelete: (id: string) => void;
};

const visibleColumns: Array<{ label: string; key: keyof Candidate; compact?: boolean }> = [
  { label: "Name", key: "name" },
  { label: "Mobile", key: "mobile" },
  { label: "Email", key: "email" },
  { label: "College", key: "college" },
  { label: "Branch", key: "branch" },
  { label: "B.Tech", key: "btechScore", compact: true },
  { label: "CGPA", key: "cgpa", compact: true },
  { label: "JEE Rank", key: "jeeRank", compact: true },
  { label: "JEE %", key: "jeePercentile", compact: true },
  { label: "Comment", key: "comment" }
];

export function CandidateTable({ candidates, onChange, onDelete }: CandidateTableProps) {
  if (!candidates.length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-md border border-[#d7dce5] bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#172033] text-white">
            <tr>
              {visibleColumns.map((column) => (
                <th key={column.key} className={`px-3 py-3 font-semibold ${column.compact ? "w-32" : "w-48"}`}>
                  {column.label}
                </th>
              ))}
              <th className="w-28 px-3 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => (
              <tr key={candidate.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
                {visibleColumns.map((column) => (
                  <td key={column.key} className="border-t border-[#e5e9f0] px-3 py-3 align-top">
                    <input
                      className="field-input"
                      value={String(candidate[column.key] ?? "")}
                      onChange={(event) => onChange(candidate.id, column.key, event.target.value)}
                      aria-label={`${column.label} for ${candidate.fileName}`}
                    />
                  </td>
                ))}
                <td className="border-t border-[#e5e9f0] px-3 py-3 align-top">
                  <button
                    type="button"
                    onClick={() => onDelete(candidate.id)}
                    className="rounded-md border border-[#cf3341] px-3 py-2 text-sm font-semibold text-[#b4232f] hover:bg-[#fff1f2]"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

