const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version || '1.0.0';
const distDir = path.join(rootDir, 'dist');
const zipFileName = `subtext-v${version}.zip`;
const zipFilePath = path.join(distDir, zipFileName);

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath);
}

const filesToInclude = ['manifest.json', 'icons', 'src', 'LICENSE', 'README.md'];

console.log(`📦 Packaging Subtext v${version} into ${zipFileName}...`);

try {
  if (process.platform === 'win32') {
    const includeStr = filesToInclude.map(f => `'${f}'`).join(',');
    const psCmd = `powershell -Command "$ProgressPreference = 'SilentlyContinue'; Compress-Archive -Path ${includeStr} -DestinationPath '${zipFilePath}' -Force"`;
    execSync(psCmd, { cwd: rootDir, stdio: 'inherit' });
  } else {
    const includeStr = filesToInclude.join(' ');
    execSync(`zip -r "${zipFilePath}" ${includeStr}`, { cwd: rootDir, stdio: 'inherit' });
  }
  console.log(`\n✅ Release package built successfully: dist/${zipFileName}`);
} catch (err) {
  console.error(`\n❌ Packaging failed:`, err.message);
  process.exit(1);
}
