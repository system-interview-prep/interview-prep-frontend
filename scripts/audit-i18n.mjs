import fs from 'fs';
import path from 'path';

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const appDir = path.resolve('src/app');
const featuresDir = path.resolve('src/features');
const componentsDir = path.resolve('src/components');

const allFiles = [
  ...scanDirectory(appDir),
  ...scanDirectory(featuresDir),
  ...scanDirectory(componentsDir),
];

let totalWarnings = 0;
const vietnameseRegex = /"[^"]*[À-ỹ][^"]*"/g;

console.log('=== INTERVIA i18n Audit Helper ===\n');

allFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(process.cwd(), file);
  const matches = content.match(vietnameseRegex);

  if (matches) {
    console.log(`[WARNING] Potential raw Vietnamese literal in ${relPath}:`);
    matches.forEach((m) => console.log(`   ${m}`));
    totalWarnings += matches.length;
  }
});

console.log(`\nAudit completed. Total literal warnings found: ${totalWarnings}`);
