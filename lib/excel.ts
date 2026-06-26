import ExcelJS from "exceljs";
import type { Candidate } from "@/lib/types";

const columns: Array<{ header: string; key: keyof Candidate; width: number }> = [
  { header: "Name", key: "name", width: 24 },
  { header: "Phone", key: "mobile", width: 18 },
  { header: "Email", key: "email", width: 30 },
  { header: "10th", key: "tenth", width: 14 },
  { header: "12th", key: "twelfth", width: 14 },
  { header: "Diploma", key: "diploma", width: 16 },
  { header: "Graduation", key: "graduation", width: 18 },
  { header: "Post Graduation", key: "postGraduation", width: 20 },
  { header: "B.Tech", key: "btechScore", width: 16 },
  { header: "CGPA", key: "cgpa", width: 12 },
  { header: "Percentage", key: "percentage", width: 14 },
  { header: "College", key: "college", width: 30 },
  { header: "Branch", key: "branch", width: 24 },
  { header: "Graduation Year", key: "graduationYear", width: 18 },
  { header: "JEE Rank", key: "jeeRank", width: 16 },
  { header: "JEE Percentile", key: "jeePercentile", width: 18 },
  { header: "Comment", key: "comment", width: 42 }
];

export async function createCandidateWorkbook(candidates: Candidate[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AI Resume Parser";
  const sheet = workbook.addWorksheet("Candidates");

  sheet.columns = columns;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length }
  };

  candidates.forEach((candidate) => {
    sheet.addRow(Object.fromEntries(columns.map((column) => [column.key, candidate[column.key] ?? ""])));
  });

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  sheet.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 24 : 22;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } }
      };
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
  });

  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
}

