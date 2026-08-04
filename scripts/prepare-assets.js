import fs from 'fs';
import path from 'path';
import https from 'https';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const rootDir = path.resolve(__dirname, '..');

const wasmSrcDir = path.join(rootDir, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const publicWasmDir = path.join(rootDir, 'public', 'wasm');
const publicModelsDir = path.join(rootDir, 'public', 'models');

// Ensure directories exist
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Copy directory contents
function copyDir(src, dest) {
  ensureDirExists(dest);
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to ${dest}`);
  }
}

// Download file helper
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      console.log(`File already exists: ${destPath}`);
      return resolve();
    }

    console.log(`Downloading ${url} to ${destPath}...`);
    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status code ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Download completed: ${destPath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  try {
    console.log('Preparing offline MediaPipe assets...');
    ensureDirExists(publicWasmDir);
    ensureDirExists(publicModelsDir);

    // Copy WASM files
    if (fs.existsSync(wasmSrcDir)) {
      copyDir(wasmSrcDir, publicWasmDir);
    } else {
      console.warn('WASM source directory not found in node_modules! Run npm install first.');
    }

    // Download hand landmarker task file
    const taskUrl = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
    const taskDest = path.join(publicModelsDir, 'hand_landmarker.task');
    await downloadFile(taskUrl, taskDest);

    console.log('MediaPipe assets prepared successfully!');
  } catch (err) {
    console.error('Error preparing MediaPipe assets:', err);
    process.exit(1);
  }
}

run();
