// Archival Processing Types for SVT-AV1 Encoding
// Designed for long-term video archival with optimal compression
/**
 * Default CRF values for archival encoding
 * These are tuned for SVT-AV1 and optimized for archival quality:
 * - HDR content uses lower CRF (higher quality) to preserve dynamic range
 * - Lower resolutions can use higher CRF while maintaining perceptual quality
 *
 * CRF Scale:
 * - 18-24: Visually lossless (large files)
 * - 25-30: Very high quality (good archival)
 * - 31-35: Good quality (aggressive archival)
 * - 36+: Acceptable quality (very aggressive)
 */
export const ARCHIVAL_CRF_DEFAULTS = {
    hdr: {
        '4k': 29, // Ultra-safe: 28, aggressive: 30 max
        '1440p': 28, // aggressive: 29 max
        '1080p': 28, // default 28, aggressive: 29 max
        '720p': 27, // aggressive: 28 max
        '480p': 27,
        '360p': 27
    },
    sdr: {
        '4k': 30, // aggressive: 31 max
        '1440p': 31, // aggressive: 32 max
        '1080p': 29, // aggressive: 31-32 max
        '720p': 32, // default 32, aggressive: 34 max
        '480p': 34, // default 34
        '360p': 36 // default 36, aggressive: 37 max
    }
};
/**
 * Maximum CRF values - going beyond these will cause visible quality loss
 */
export const ARCHIVAL_CRF_MAX = {
    hdr: {
        '4k': 30,
        '1440p': 29,
        '1080p': 29,
        '720p': 28,
        '480p': 28,
        '360p': 28
    },
    sdr: {
        '4k': 32,
        '1440p': 33,
        '1080p': 32,
        '720p': 34,
        '480p': 36,
        '360p': 38
    }
};
/**
 * Bitrate thresholds for CRF adjustment (in bits per second)
 *
 * If source bitrate is below these thresholds, we raise CRF to avoid
 * over-compressing already-compressed content. This prevents quality loss
 * from re-encoding low-bitrate sources.
 *
 * - Below `low`: Source is very compressed, raise CRF by 3
 * - Below `medium`: Source is moderately compressed, raise CRF by 1
 * - Above `medium`: High bitrate source, use default CRF
 */
export const BITRATE_THRESHOLDS = {
    '4k': { low: 8_000_000, medium: 15_000_000 }, // 8 Mbps / 15 Mbps
    '1440p': { low: 4_000_000, medium: 8_000_000 }, // 4 Mbps / 8 Mbps
    '1080p': { low: 2_500_000, medium: 5_000_000 }, // 2.5 Mbps / 5 Mbps
    '720p': { low: 1_500_000, medium: 3_000_000 }, // 1.5 Mbps / 3 Mbps
    '480p': { low: 800_000, medium: 1_500_000 }, // 800 kbps / 1.5 Mbps
    '360p': { low: 400_000, medium: 800_000 } // 400 kbps / 800 kbps
};
/**
 * Adjust CRF based on source bitrate to avoid over-compression
 *
 * Low-bitrate sources are already compressed and re-encoding them with
 * aggressive CRF can cause generation loss. This function raises CRF
 * for such sources to preserve quality.
 *
 * @returns Object with adjusted CRF, the adjustment amount, and optional reason
 */
export function getBitrateAdjustedCrf(sourceInfo, baseCrf) {
    if (!sourceInfo.bitrate || sourceInfo.bitrate <= 0) {
        return { adjustedCrf: baseCrf, adjustment: 0 };
    }
    const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
    if (resolution === 'source') {
        return { adjustedCrf: baseCrf, adjustment: 0 };
    }
    const thresholds = BITRATE_THRESHOLDS[resolution];
    if (!thresholds) {
        return { adjustedCrf: baseCrf, adjustment: 0 };
    }
    const bitrateMbps = (sourceInfo.bitrate / 1_000_000).toFixed(1);
    if (sourceInfo.bitrate < thresholds.low) {
        // Very low bitrate source - significant CRF increase to avoid artifacts
        const adjustment = 3;
        return {
            adjustedCrf: Math.min(baseCrf + adjustment, 45), // Cap at CRF 45
            adjustment,
            reason: `Low bitrate source (${bitrateMbps} Mbps) - raising CRF to avoid over-compression`
        };
    }
    if (sourceInfo.bitrate < thresholds.medium) {
        // Moderately compressed source - small CRF increase
        const adjustment = 1;
        return {
            adjustedCrf: Math.min(baseCrf + adjustment, 45),
            adjustment,
            reason: `Moderate bitrate source (${bitrateMbps} Mbps) - slight CRF adjustment`
        };
    }
    // High bitrate source - use default CRF
    return { adjustedCrf: baseCrf, adjustment: 0 };
}
/**
 * Default archival configuration
 *
 * These defaults are optimized for long-term video archival:
 * - SVT-AV1 (libsvtav1): Fast encoding with excellent quality
 * - Preset 6: Balanced quality/speed (recommended for archival)
 * - 240-frame GOP with scene detection: Good compression without crossing scene cuts
 * - enable-tf (temporal filtering): Reduces bitrate for noisy/low-light footage
 * - Film grain synthesis: Preserves grain appearance while improving compression
 * - Audio copy: Preserves original audio losslessly
 * - MKV container: Best compatibility with AV1 and various audio codecs
 */
export const DEFAULT_ARCHIVAL_CONFIG = {
    resolution: 'source',
    colorMode: 'auto',
    codec: 'av1', // Default to AV1 for best compression
    av1: {
        encoder: 'libsvtav1', // Faster than libaom with excellent quality
        preset: 6, // SVT-AV1: 0-13, lower=slower/better. 6 is balanced
        keyframeInterval: 240, // ~8-10 seconds at 24-30fps
        sceneChangeDetection: true, // CRITICAL: prevents GOP crossing scene cuts
        filmGrainSynthesis: 10, // Helps with noisy footage, disable for screen recordings
        tune: 0, // VQ (visual quality) - best for archival viewing
        adaptiveQuantization: true, // Better detail in complex areas
        crf: 30, // Will be auto-adjusted based on resolution/HDR
        twoPass: false // Single-pass by default for faster encoding
    },
    h265: {
        encoder: 'libx265',
        preset: 'medium', // Balanced speed/quality for web delivery
        crf: 23, // Visually transparent for most content
        keyframeInterval: 250, // ~10 seconds, good for streaming
        bframes: 4, // Standard B-frame count for good compression
        twoPass: false // Single-pass by default for faster encoding
    },
    audioCopy: true, // Preserve original audio losslessly
    audioCodec: 'aac', // AAC is best for H.265/MP4 web delivery
    audioBitrate: 160, // 160kbps for music, 128k for speech
    container: 'mkv', // Best for AV1 + various audio formats
    preserveStructure: false,
    overwriteExisting: false,
    fillMode: false,
    deleteOriginal: false, // Safety: never auto-delete originals
    deleteOutputIfLarger: true, // Smart: delete output if it's larger than original
    extractThumbnail: false, // Disabled by default
    extractCaptions: false, // Disabled by default - uses Whisper for transcription
    threadLimit: 0 // Use all available threads by default
};
/**
 * Preset configurations
 */
export const ARCHIVAL_PRESETS = {
    // Recommended: Good balance of quality and speed
    archive: {
        av1: {
            ...DEFAULT_ARCHIVAL_CONFIG.av1,
            preset: 6,
            filmGrainSynthesis: 10,
            twoPass: false
        },
        h265: {
            ...DEFAULT_ARCHIVAL_CONFIG.h265,
            preset: 'medium',
            crf: 23,
            twoPass: false
        }
    },
    // Maximum compression: Slower but smaller files (~3-5% smaller)
    'max-compression': {
        av1: {
            ...DEFAULT_ARCHIVAL_CONFIG.av1,
            preset: 4, // Slower, better compression
            filmGrainSynthesis: 12, // More aggressive grain synthesis
            twoPass: false
        },
        h265: {
            ...DEFAULT_ARCHIVAL_CONFIG.h265,
            preset: 'slow', // Slower for better compression
            crf: 24, // Slightly higher CRF for smaller files
            twoPass: false
        }
    },
    // Fast: Faster encoding, slightly larger files
    fast: {
        av1: {
            ...DEFAULT_ARCHIVAL_CONFIG.av1,
            preset: 8, // Faster
            filmGrainSynthesis: 8,
            twoPass: false
        },
        h265: {
            ...DEFAULT_ARCHIVAL_CONFIG.h265,
            preset: 'fast', // Faster encoding
            crf: 22, // Lower CRF to compensate for speed
            twoPass: false
        }
    }
};
/**
 * Determine resolution category from video dimensions
 */
export function getResolutionCategory(width, height) {
    const pixels = Math.max(width, height);
    if (pixels >= 3840)
        return '4k';
    if (pixels >= 2560)
        return '1440p';
    if (pixels >= 1920)
        return '1080p';
    if (pixels >= 1280)
        return '720p';
    if (pixels >= 854)
        return '480p';
    return '360p';
}
/**
 * Get optimal CRF for given video parameters
 */
export function getOptimalCrf(sourceInfo, customMatrix, enableBitrateAdjustment = true) {
    const matrix = { ...ARCHIVAL_CRF_DEFAULTS, ...customMatrix };
    const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
    // Handle 'source' resolution by defaulting to 1080p CRF
    const lookupResolution = resolution === 'source' ? '1080p' : resolution;
    let baseCrf;
    if (sourceInfo.isHdr) {
        baseCrf = matrix.hdr[lookupResolution] ?? matrix.hdr['1080p'];
    }
    else {
        baseCrf = matrix.sdr[lookupResolution] ?? matrix.sdr['1080p'];
    }
    // Apply bitrate-aware adjustment if enabled and bitrate is available
    if (enableBitrateAdjustment && sourceInfo.bitrate) {
        const { adjustedCrf } = getBitrateAdjustedCrf(sourceInfo, baseCrf);
        return adjustedCrf;
    }
    return baseCrf;
}
/**
 * Detect if video is HDR based on metadata
 */
export function detectHdr(colorSpace, hdrFormat, bitDepth) {
    // Check explicit HDR format
    if (hdrFormat) {
        const hdrFormats = ['hdr10', 'hdr10+', 'hlg', 'dolby vision', 'dv', 'pq'];
        if (hdrFormats.some(fmt => hdrFormat.toLowerCase().includes(fmt))) {
            return true;
        }
    }
    // Check color space
    if (colorSpace) {
        const hdrColorSpaces = ['bt2020', 'rec2020', 'smpte2084', 'arib-std-b67'];
        if (hdrColorSpaces.some(cs => colorSpace.toLowerCase().includes(cs))) {
            return true;
        }
    }
    // 10-bit or higher often indicates HDR (but not always)
    // Only use as hint when combined with other factors
    if (bitDepth && bitDepth >= 10 && colorSpace?.toLowerCase().includes('2020')) {
        return true;
    }
    return false;
}
/**
 * Check if a video is already efficiently encoded and might not benefit from re-encoding
 * Returns a reason string if skipping is recommended, null otherwise
 */
export function shouldSkipEncoding(sourceInfo, codec, bitrate) {
    const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
    const isHevc = codec.toLowerCase().includes('hevc') || codec.toLowerCase().includes('h265');
    const isAv1 = codec.toLowerCase().includes('av1');
    // Already AV1 encoded - skip unless very high bitrate
    if (isAv1) {
        return 'Already encoded with AV1. Re-encoding is unlikely to provide significant savings.';
    }
    // Check bitrate thresholds for HEVC (already efficient codec)
    if (isHevc) {
        const bitrateKbps = bitrate / 1000;
        const thresholds = {
            '4k': 15000, // 15 Mbps
            '1440p': 8000, // 8 Mbps
            '1080p': 4000, // 4 Mbps
            '720p': 2000, // 2 Mbps
            '480p': 1000, // 1 Mbps
            '360p': 500 // 0.5 Mbps
        };
        const threshold = thresholds[resolution];
        if (threshold && bitrateKbps <= threshold) {
            return `Already efficient HEVC at ${(bitrateKbps / 1000).toFixed(1)} Mbps. Re-encoding may not provide significant savings.`;
        }
    }
    // Very low resolution and already small
    if (resolution === '360p' && bitrate < 500000) { // < 500 kbps
        return 'Very low resolution with low bitrate. Re-encoding may not improve quality or size.';
    }
    return null;
}
/**
 * Check if source has Dolby Vision which cannot be preserved in AV1
 */
export function hasDolbyVision(hdrFormat) {
    if (!hdrFormat)
        return false;
    const lower = hdrFormat.toLowerCase();
    return lower.includes('dolby') || lower.includes('dv');
}
/**
 * Classify error from FFmpeg stderr or error message
 */
export function classifyError(errorMessage) {
    const lower = errorMessage.toLowerCase();
    // Disk space errors
    if (lower.includes('no space left') ||
        lower.includes('disk full') ||
        lower.includes('not enough space') ||
        lower.includes('enospc')) {
        return 'disk_full';
    }
    // Permission errors
    if (lower.includes('permission denied') ||
        lower.includes('access denied') ||
        lower.includes('eacces') ||
        lower.includes('eperm')) {
        return 'permission_denied';
    }
    // File not found
    if (lower.includes('no such file') ||
        lower.includes('file not found') ||
        lower.includes('enoent') ||
        lower.includes('does not exist')) {
        return 'file_not_found';
    }
    // Codec/format errors
    if (lower.includes('decoder') ||
        lower.includes('codec not found') ||
        lower.includes('unsupported codec') ||
        lower.includes('unknown encoder')) {
        return 'codec_unsupported';
    }
    // Corrupt input
    if (lower.includes('invalid data') ||
        lower.includes('corrupt') ||
        lower.includes('moov atom not found') ||
        lower.includes('invalid nal unit')) {
        return 'corrupt_input';
    }
    // Encoder errors
    if (lower.includes('encoder') ||
        lower.includes('encoding') ||
        lower.includes('svtav1') ||
        lower.includes('libaom')) {
        return 'encoder_error';
    }
    // Cancelled
    if (lower.includes('cancel') || lower.includes('abort') || lower.includes('killed')) {
        return 'cancelled';
    }
    return 'unknown';
}
/**
 * Get user-friendly error message for error type
 */
export function getErrorMessage(errorType, details) {
    const messages = {
        disk_full: 'Not enough disk space to complete encoding. Free up space and try again.',
        permission_denied: 'Cannot write to output location. Check folder permissions.',
        file_not_found: 'Input file not found. It may have been moved or deleted.',
        codec_unsupported: 'Video format not supported. The input file may use an unsupported codec.',
        corrupt_input: 'Input file appears to be corrupted or incomplete.',
        encoder_error: 'Encoder error occurred. Try a different encoder preset.',
        cancelled: 'Encoding was cancelled.',
        output_larger: 'Output file is larger than original. Source may already be well-optimized.',
        unknown: 'An unexpected error occurred.'
    };
    const base = messages[errorType];
    return details ? `${base} (${details})` : base;
}
/**
 * Format seconds to human-readable duration (e.g., "2h 15m" or "45s")
 */
export function formatEta(seconds) {
    if (!isFinite(seconds) || seconds < 0)
        return '--';
    if (seconds < 60)
        return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
/**
 * Format encoding speed (e.g., "0.5x realtime" or "2.3x realtime")
 */
export function formatSpeed(speed) {
    if (!isFinite(speed) || speed <= 0)
        return '--';
    return `${speed.toFixed(1)}x`;
}
/**
 * Encoding speed multipliers for different codecs and presets
 * These are approximate values based on typical encoding performance
 * Speed is relative to realtime (1.0x = encodes as fast as playback)
 *
 * Factors affecting speed:
 * - Codec: H.265 is generally faster than AV1
 * - Preset: Faster presets = higher speed multiplier
 * - Resolution: Higher resolution = slower encoding (normalized in estimateEncodingTime)
 * - Two-pass: Approximately doubles encoding time
 */
const ENCODING_SPEED_MULTIPLIERS = {
    // AV1 SVT speed multipliers by preset (0-12)
    // Based on typical 1080p encoding speeds
    av1_svt: {
        0: 0.05, // Very slow
        1: 0.08,
        2: 0.12,
        3: 0.18,
        4: 0.25,
        5: 0.35,
        6: 0.5, // Default balanced
        7: 0.7,
        8: 1.0,
        9: 1.4,
        10: 2.0,
        11: 2.8,
        12: 4.0 // Very fast
    },
    // AV1 libaom speed multipliers by preset (0-8)
    av1_libaom: {
        0: 0.02, // Extremely slow
        1: 0.04,
        2: 0.07,
        3: 0.12,
        4: 0.2,
        5: 0.3,
        6: 0.45,
        7: 0.65,
        8: 0.9
    },
    // H.265 libx265 speed multipliers by preset
    h265: {
        'ultrafast': 5.0,
        'superfast': 3.5,
        'veryfast': 2.5,
        'faster': 1.8,
        'fast': 1.3,
        'medium': 0.9,
        'slow': 0.5,
        'slower': 0.3,
        'veryslow': 0.15
    }
};
/**
 * Resolution scaling factors for encoding speed
 * Higher resolutions take proportionally longer to encode
 */
const RESOLUTION_SPEED_FACTORS = {
    '360p': 4.0, // Much faster
    '480p': 2.5,
    '720p': 1.5,
    '1080p': 1.0, // Reference baseline
    '1440p': 0.6,
    '4k': 0.35, // Much slower
    'source': 1.0 // Assume 1080p for source
};
/**
 * Estimate encoding time in seconds
 * Returns an estimate with min/max range
 *
 * @param durationSeconds - Total video duration in seconds
 * @param codec - 'av1' or 'h265'
 * @param preset - Encoder preset (number for AV1, string for H.265)
 * @param encoder - 'libsvtav1', 'libaom-av1', or 'libx265'
 * @param resolution - Target resolution
 * @param twoPass - Whether two-pass encoding is enabled
 * @returns Object with estimated, min, and max encoding times in seconds
 */
export function estimateEncodingTime(durationSeconds, codec, preset, encoder, resolution = '1080p', twoPass = false) {
    // Get base speed multiplier based on codec and preset
    let speedMultiplier;
    if (codec === 'h265') {
        const presetStr = preset;
        speedMultiplier = ENCODING_SPEED_MULTIPLIERS.h265[presetStr] ?? 0.9;
    }
    else {
        // AV1
        const presetNum = preset;
        if (encoder === 'libsvtav1') {
            speedMultiplier = ENCODING_SPEED_MULTIPLIERS.av1_svt[presetNum] ?? 0.5;
        }
        else {
            speedMultiplier = ENCODING_SPEED_MULTIPLIERS.av1_libaom[presetNum] ?? 0.2;
        }
    }
    // Apply resolution factor
    const resolutionFactor = RESOLUTION_SPEED_FACTORS[resolution] ?? 1.0;
    const adjustedSpeed = speedMultiplier * resolutionFactor;
    // Calculate base encoding time
    // If speed is 0.5x realtime, encoding 60s video takes 120s
    let encodingTime = durationSeconds / adjustedSpeed;
    // Double time for two-pass encoding
    if (twoPass) {
        encodingTime *= 2;
    }
    // Add 10% variance for min/max estimates
    return {
        estimatedSeconds: Math.round(encodingTime),
        minSeconds: Math.round(encodingTime * 0.7),
        maxSeconds: Math.round(encodingTime * 1.5)
    };
}
/**
 * Format estimated encoding time as human-readable string
 * Returns format like "~2h 30m" or "~45m"
 */
export function formatEstimatedTime(seconds) {
    if (!isFinite(seconds) || seconds <= 0)
        return '--';
    if (seconds < 60)
        return `~${Math.round(seconds)}s`;
    if (seconds < 3600) {
        const mins = Math.round(seconds / 60);
        return `~${mins}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
}
//# sourceMappingURL=archival.types.js.map