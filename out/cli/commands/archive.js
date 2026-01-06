/**
 * Archive Command - Batch encode videos using AV1/H.265
 */
import { Command } from 'commander';
import { readdir, stat, access, mkdir } from 'node:fs/promises';
import { join, extname, basename, relative } from 'node:path';
import { ArchivalService } from '../../main/services/archival/archival.service.js';
import { DEFAULT_ARCHIVAL_CONFIG, formatEta, formatSpeed, ARCHIVAL_PRESETS } from '../../shared/types/archival.types.js';
// Supported video extensions
const VIDEO_EXTENSIONS = new Set([
    '.mp4', '.mkv', '.mov', '.webm', '.avi',
    '.m4v', '.ts', '.mts', '.m2ts', '.flv', '.wmv'
]);
// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    gray: '\x1b[90m'
};
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function clearLine() {
    process.stdout.write('\r\x1b[K');
}
function progressBar(percent, width = 30) {
    const filled = Math.round(width * percent / 100);
    const empty = width - filled;
    return `${colors.green}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(empty)}${colors.reset}`;
}
/**
 * Recursively find all video files in a directory
 */
async function findVideoFiles(rootPath, basePath = rootPath) {
    const files = [];
    const ignoredDirs = new Set(['.drapp', '.git', 'node_modules', '$RECYCLE.BIN', 'System Volume Information']);
    async function walk(dir) {
        try {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (ignoredDirs.has(entry.name) || entry.name.startsWith('.')) {
                        continue;
                    }
                    await walk(fullPath);
                }
                else if (entry.isFile()) {
                    const ext = extname(entry.name).toLowerCase();
                    if (VIDEO_EXTENSIONS.has(ext)) {
                        files.push({
                            absolutePath: fullPath,
                            relativePath: relative(basePath, fullPath)
                        });
                    }
                }
            }
        }
        catch {
            // Skip directories we can't read
        }
    }
    await walk(rootPath);
    return files;
}
/**
 * Handle progress events from the archival service
 */
function createProgressHandler() {
    let lastUpdate = 0;
    let currentFile = '';
    return (event) => {
        const now = Date.now();
        // Throttle updates
        if (now - lastUpdate < 100 && event.kind === 'item_progress') {
            return;
        }
        lastUpdate = now;
        switch (event.kind) {
            case 'item_start':
                currentFile = event.itemId;
                console.log(`\n${colors.cyan}→${colors.reset} Starting: analyzing video...`);
                break;
            case 'item_progress':
                if (event.progress !== undefined) {
                    const progress = event.progress;
                    const speed = event.encodingSpeed ? formatSpeed(event.encodingSpeed) : '--';
                    const eta = event.itemEtaSeconds !== undefined ? formatEta(event.itemEtaSeconds) : '--';
                    const batchProgress = event.batchProgress ?? 0;
                    const batchEta = event.batchEtaSeconds !== undefined ? formatEta(event.batchEtaSeconds) : '--';
                    clearLine();
                    process.stdout.write(`  ${progressBar(progress)} ${progress.toString().padStart(3)}%  ` +
                        `${colors.dim}Speed:${colors.reset} ${speed}  ` +
                        `${colors.dim}ETA:${colors.reset} ${eta}  ` +
                        `${colors.dim}Batch:${colors.reset} ${batchProgress}% (${batchEta})`);
                }
                break;
            case 'item_complete':
                clearLine();
                if (event.status === 'completed') {
                    const ratio = event.compressionRatio ? `${event.compressionRatio.toFixed(1)}x` : '--';
                    const size = event.outputSize ? formatBytes(event.outputSize) : '--';
                    console.log(`  ${colors.green}✓${colors.reset} Completed  ` +
                        `${colors.dim}Size:${colors.reset} ${size}  ` +
                        `${colors.dim}Ratio:${colors.reset} ${ratio}`);
                }
                else if (event.status === 'skipped') {
                    console.log(`  ${colors.yellow}○${colors.reset} Skipped: ${event.error || 'already exists'}`);
                }
                break;
            case 'item_error':
                clearLine();
                console.log(`  ${colors.red}✗${colors.reset} Failed: ${event.error || 'Unknown error'}`);
                break;
            case 'batch_complete':
                console.log(`\n${colors.green}${colors.bright}✓ Batch complete${colors.reset}`);
                console.log(`  Processed: ${event.processedItems}/${event.totalItems}`);
                break;
            case 'queue_paused':
                console.log(`\n${colors.yellow}⏸ Paused${colors.reset}`);
                break;
            case 'queue_resumed':
                console.log(`\n${colors.green}▶ Resumed${colors.reset}`);
                break;
        }
    };
}
export const archiveCommand = new Command('archive')
    .description('Batch encode videos using AV1 or H.265')
    .argument('<input>', 'Input file or directory')
    .argument('<output>', 'Output directory')
    .option('-c, --codec <codec>', 'Codec to use: av1 or h265', 'av1')
    .option('-p, --preset <preset>', 'Quality preset: archive, max-compression, or fast', 'archive')
    .option('--crf <number>', 'Custom CRF value (overrides preset)')
    .option('--container <format>', 'Container format: mkv, mp4, or webm', 'mkv')
    .option('--overwrite', 'Overwrite existing output files', false)
    .option('--preserve-structure', 'Preserve folder structure from input', false)
    .option('--delete-if-larger', 'Delete output if larger than input', true)
    .option('--two-pass', 'Enable two-pass encoding for better quality', false)
    .option('--threads <number>', 'Limit encoder threads (0 = unlimited)', '0')
    .option('-r, --recursive', 'Process directories recursively', true)
    .option('-v, --verbose', 'Show detailed progress', false)
    .action(async (input, output, options) => {
    try {
        console.log(`\n${colors.bright}Drapp Archive${colors.reset} - Video Encoding Tool\n`);
        // Validate input
        try {
            await access(input);
        }
        catch {
            console.error(`${colors.red}Error:${colors.reset} Input path not found: ${input}`);
            process.exit(1);
        }
        // Check if input is file or directory
        const inputStat = await stat(input);
        let inputPaths = [];
        let relativePaths = [];
        let folderRoot;
        if (inputStat.isDirectory()) {
            console.log(`${colors.dim}Scanning directory...${colors.reset}`);
            const files = await findVideoFiles(input);
            if (files.length === 0) {
                console.error(`${colors.red}Error:${colors.reset} No video files found in ${input}`);
                process.exit(1);
            }
            inputPaths = files.map(f => f.absolutePath);
            relativePaths = files.map(f => f.relativePath);
            folderRoot = input;
            console.log(`Found ${colors.cyan}${files.length}${colors.reset} video files\n`);
        }
        else {
            inputPaths = [input];
            relativePaths = [basename(input)];
        }
        // Create output directory
        await mkdir(output, { recursive: true });
        // Build config
        const codec = options.codec;
        const preset = options.preset;
        const presetConfig = ARCHIVAL_PRESETS[preset] || {};
        const config = {
            ...presetConfig,
            codec,
            container: options.container,
            overwriteExisting: options.overwrite,
            preserveStructure: options.preserveStructure,
            deleteOutputIfLarger: options.deleteIfLarger,
            threadLimit: parseInt(options.threads, 10)
        };
        // Apply custom CRF if specified
        if (options.crf) {
            const crf = parseInt(options.crf, 10);
            if (codec === 'av1') {
                config.av1 = { ...DEFAULT_ARCHIVAL_CONFIG.av1, ...config.av1, crf };
            }
            else {
                config.h265 = { ...DEFAULT_ARCHIVAL_CONFIG.h265, ...config.h265, crf };
            }
        }
        // Apply two-pass if specified
        if (options.twoPass) {
            if (codec === 'av1') {
                config.av1 = { ...DEFAULT_ARCHIVAL_CONFIG.av1, ...config.av1, twoPass: true };
            }
            else {
                config.h265 = { ...DEFAULT_ARCHIVAL_CONFIG.h265, ...config.h265, twoPass: true };
            }
        }
        // Show config summary
        console.log(`${colors.dim}Configuration:${colors.reset}`);
        console.log(`  Codec: ${colors.cyan}${codec.toUpperCase()}${colors.reset}`);
        console.log(`  Preset: ${colors.cyan}${preset}${colors.reset}`);
        console.log(`  Container: ${colors.cyan}${options.container}${colors.reset}`);
        console.log(`  Two-pass: ${colors.cyan}${options.twoPass ? 'yes' : 'no'}${colors.reset}`);
        console.log(`  Output: ${colors.cyan}${output}${colors.reset}`);
        console.log();
        // Create service with progress handler
        const service = new ArchivalService(createProgressHandler());
        // Start batch processing
        console.log(`${colors.bright}Starting encoding...${colors.reset}`);
        const job = await service.startBatch(inputPaths, output, config, folderRoot, relativePaths);
        // Wait for completion by polling status
        await new Promise((resolve) => {
            const checkStatus = setInterval(() => {
                const status = service.getStatus();
                if (!status || status.status === 'completed' || status.status === 'cancelled') {
                    clearInterval(checkStatus);
                    resolve();
                }
            }, 500);
        });
        // Final summary
        const finalStatus = service.getStatus();
        if (finalStatus) {
            console.log(`\n${colors.dim}─────────────────────────────────${colors.reset}`);
            console.log(`${colors.bright}Summary:${colors.reset}`);
            console.log(`  Total: ${finalStatus.totalItems}`);
            console.log(`  ${colors.green}Completed: ${finalStatus.completedItems}${colors.reset}`);
            if (finalStatus.skippedItems > 0) {
                console.log(`  ${colors.yellow}Skipped: ${finalStatus.skippedItems}${colors.reset}`);
            }
            if (finalStatus.failedItems > 0) {
                console.log(`  ${colors.red}Failed: ${finalStatus.failedItems}${colors.reset}`);
            }
            console.log();
        }
    }
    catch (error) {
        console.error(`\n${colors.red}Error:${colors.reset}`, error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
//# sourceMappingURL=archive.js.map