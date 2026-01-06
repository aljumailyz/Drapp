import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function platformDir() {
    if (process.platform === 'darwin')
        return 'darwin';
    if (process.platform === 'win32')
        return 'win32';
    return 'linux';
}
function findInSystemPath(name) {
    if (process.platform === 'win32')
        return null;
    try {
        const result = execSync(`which ${name}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        const path = result.trim();
        if (path && existsSync(path))
            return path;
    }
    catch {
        // Not found
    }
    const commonPaths = [
        `/usr/bin/${name}`,
        `/usr/local/bin/${name}`,
        `/opt/homebrew/bin/${name}`,
        `/home/linuxbrew/.linuxbrew/bin/${name}`
    ];
    for (const path of commonPaths) {
        if (existsSync(path))
            return path;
    }
    return null;
}
/**
 * Get the resources directory for CLI mode
 * Works from both development and built states
 */
function getResourcesPath() {
    // Try to find resources relative to the CLI output location
    // In dev: src/cli/utils/binary.ts -> resources/
    // In built: out/cli/utils/binary.js -> resources/
    const possiblePaths = [
        // Development path (from src)
        join(__dirname, '..', '..', '..', 'resources'),
        // Built path (from out/cli)
        join(__dirname, '..', '..', '..', 'resources'),
        // If running from project root
        join(process.cwd(), 'resources')
    ];
    for (const p of possiblePaths) {
        if (existsSync(p))
            return p;
    }
    return join(process.cwd(), 'resources');
}
/**
 * Resolve path to a binary - CLI version without Electron dependency
 * Falls back to system PATH on Linux/macOS
 */
export function resolveBundledBinary(name) {
    const resourcesPath = getResourcesPath();
    const binaryName = process.platform === 'win32' ? `${name}.exe` : name;
    const bundledPath = join(resourcesPath, 'bin', platformDir(), binaryName);
    if (existsSync(bundledPath)) {
        return bundledPath;
    }
    // Fall back to system PATH on Linux/macOS
    if (process.platform !== 'win32') {
        const systemPath = findInSystemPath(name);
        if (systemPath)
            return systemPath;
    }
    return bundledPath;
}
export function isBinaryAvailable(name) {
    const path = resolveBundledBinary(name);
    return existsSync(path);
}
//# sourceMappingURL=binary.js.map