import XLSX from 'xlsx';
const workbook = XLSX.readFile("/Users/skytxy/Downloads/Safari/CARIAD-Cnn_Switch-软件详细说明书-V0.1.xlsx");

// Check cover sheet
const cover = workbook.Sheets['封面'];
const coverData = XLSX.utils.sheet_to_json(cover, { header: 1 });
console.log("Cover data rows:", coverData.length);
console.log("Cover sample:", coverData.slice(0, 5).map(row => row.filter(cell => cell !== undefined && cell !== '')));

// Check change log
const changeLog = workbook.Sheets['变更履历'];
const clData = XLSX.utils.sheet_to_json(changeLog, { header: 1 });
console.log("\nChange log rows:", clData.length);
console.log("Change log header:", clData[0]);
