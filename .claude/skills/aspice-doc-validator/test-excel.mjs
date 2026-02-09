import XLSX from 'xlsx';
const workbook = XLSX.readFile("/Users/skytxy/Downloads/Safari/CARIAD-Cnn_Switch-软件详细说明书-V0.1.xlsx");
console.log("Sheet names:", workbook.SheetNames);
console.log("First sheet:", workbook.SheetNames[0]);
const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
console.log("Sheet ref:", firstSheet['!ref']);
