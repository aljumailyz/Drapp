"use strict";
const electron = require("electron");
const api = {
  ping: () => electron.ipcRenderer.invoke("app/ping"),
  toFileUrl: (filePath) => {
    const normalized = filePath.replace(/\\/g, "/");
    if (normalized.startsWith("/")) {
      return `media://${normalized}`;
    }
    return `media://${normalized}`;
  },
  copyToClipboard: (text) => electron.ipcRenderer.invoke("app/copy-to-clipboard", text),
  revealInFolder: (path) => electron.ipcRenderer.invoke("app/reveal-path", path),
  downloadStart: (url) => electron.ipcRenderer.invoke("download/start", url),
  downloadBatch: (payload) => electron.ipcRenderer.invoke("download/batch", payload),
  downloadList: () => electron.ipcRenderer.invoke("download/list"),
  downloadCancel: (downloadId) => electron.ipcRenderer.invoke("download/cancel", downloadId),
  downloadRetry: (downloadId) => electron.ipcRenderer.invoke("download/retry", downloadId),
  getDownloadPath: () => electron.ipcRenderer.invoke("settings/get-download-path"),
  downloadGetSettings: () => electron.ipcRenderer.invoke("settings/get-download-settings"),
  downloadUpdateSettings: (payload) => electron.ipcRenderer.invoke("settings/update-download-settings", payload),
  uiGetSettings: () => electron.ipcRenderer.invoke("settings/get-ui-settings"),
  uiUpdateSettings: (payload) => electron.ipcRenderer.invoke("settings/update-ui-settings", payload),
  reportError: (payload) => electron.ipcRenderer.invoke("app/log-client-error", payload),
  selectDownloadPath: () => electron.ipcRenderer.invoke("settings/select-download-path"),
  getWhisperModel: () => electron.ipcRenderer.invoke("settings/get-whisper-model"),
  selectWhisperModel: () => electron.ipcRenderer.invoke("settings/select-whisper-model"),
  getWhisperProvider: () => electron.ipcRenderer.invoke("settings/get-whisper-provider"),
  setWhisperProvider: (payload) => electron.ipcRenderer.invoke("settings/set-whisper-provider", payload),
  getWhisperGpuSettings: () => electron.ipcRenderer.invoke("settings/get-whisper-gpu"),
  setWhisperGpuEnabled: (enabled) => electron.ipcRenderer.invoke("settings/set-whisper-gpu", enabled),
  libraryList: (includeHidden) => electron.ipcRenderer.invoke("library/list", includeHidden),
  librarySelectFolder: () => electron.ipcRenderer.invoke("library/select-folder"),
  libraryScan: (path) => electron.ipcRenderer.invoke("library/scan", path),
  libraryScanStart: (path) => electron.ipcRenderer.invoke("library/scan-start", path),
  libraryScanCancel: (scanId) => electron.ipcRenderer.invoke("library/scan-cancel", scanId),
  libraryGetTranscript: (videoId) => electron.ipcRenderer.invoke("library/get-transcript", videoId),
  libraryUpdateTranscript: (payload) => electron.ipcRenderer.invoke("library/update-transcript", payload),
  libraryExportCaptions: (payload) => electron.ipcRenderer.invoke("library/export-captions", payload),
  libraryIntegrityScan: () => electron.ipcRenderer.invoke("library/integrity-scan"),
  libraryIntegrityFix: (payload) => electron.ipcRenderer.invoke("library/integrity-fix", payload),
  librarySelectExportFolder: () => electron.ipcRenderer.invoke("library/select-export-folder"),
  libraryExportAssets: (payload) => electron.ipcRenderer.invoke("library/export-assets", payload),
  libraryStats: () => electron.ipcRenderer.invoke("library/stats"),
  librarySetHidden: (payload) => electron.ipcRenderer.invoke("library/set-hidden", payload),
  libraryDeleteVideo: (payload) => electron.ipcRenderer.invoke("library/delete", payload),
  onLibraryScanProgress: (listener) => {
    const handler = (_event, payload) => {
      listener(payload);
    };
    electron.ipcRenderer.on("library/scan-progress", handler);
    return () => {
      electron.ipcRenderer.removeListener("library/scan-progress", handler);
    };
  },
  onLibraryScanComplete: (listener) => {
    const handler = (_event, payload) => {
      listener(payload);
    };
    electron.ipcRenderer.on("library/scan-complete", handler);
    return () => {
      electron.ipcRenderer.removeListener("library/scan-complete", handler);
    };
  },
  libraryGetPlayback: (videoId) => electron.ipcRenderer.invoke("library/get-playback", videoId),
  librarySavePlayback: (payload) => electron.ipcRenderer.invoke("library/save-playback", payload),
  systemBinaries: () => electron.ipcRenderer.invoke("system/binaries"),
  systemRepairBinaries: () => electron.ipcRenderer.invoke("system/repair-binaries"),
  systemOpenBinariesFolder: () => electron.ipcRenderer.invoke("system/open-binaries-folder"),
  systemDownloadBinaries: () => electron.ipcRenderer.invoke("system/download-binaries"),
  systemCheckMissingBinaries: () => electron.ipcRenderer.invoke("system/check-missing-binaries"),
  onBinaryDownloadProgress: (listener) => {
    const handler = (_event, payload) => {
      listener(payload);
    };
    electron.ipcRenderer.on("binary-download/progress", handler);
    return () => {
      electron.ipcRenderer.removeListener("binary-download/progress", handler);
    };
  },
  llmGetSettings: () => electron.ipcRenderer.invoke("llm/get-settings"),
  llmUpdateSettings: (payload) => electron.ipcRenderer.invoke("llm/update-settings", payload),
  llmTestConnection: (provider) => electron.ipcRenderer.invoke("llm/test-connection", provider),
  llmSummarizeVideo: (videoId) => electron.ipcRenderer.invoke("llm/summarize-video", { videoId }),
  llmCleanupTranscript: (videoId) => electron.ipcRenderer.invoke("llm/cleanup-transcript", { videoId }),
  watchFolderGetSettings: () => electron.ipcRenderer.invoke("settings/get-watch-folder"),
  watchFolderSelectPath: () => electron.ipcRenderer.invoke("settings/select-watch-folder"),
  watchFolderUpdateSettings: (payload) => electron.ipcRenderer.invoke("settings/update-watch-folder", payload),
  watchFolderScanNow: () => electron.ipcRenderer.invoke("settings/watch-folder-scan"),
  authSelectCookieFile: () => electron.ipcRenderer.invoke("auth/select-cookie-file"),
  authImportCookies: (payload) => electron.ipcRenderer.invoke("auth/import-cookies", payload),
  authListSessions: () => electron.ipcRenderer.invoke("auth/list-sessions"),
  authSetActive: (sessionId) => electron.ipcRenderer.invoke("auth/set-active", sessionId),
  authDeleteSession: (sessionId) => electron.ipcRenderer.invoke("auth/delete-session", sessionId),
  privacyGetSettings: () => electron.ipcRenderer.invoke("settings/get-privacy"),
  privacyUpdateSettings: (payload) => electron.ipcRenderer.invoke("settings/update-privacy", payload),
  privacySetPin: (pin) => electron.ipcRenderer.invoke("settings/set-privacy-pin", pin),
  privacyClearPin: () => electron.ipcRenderer.invoke("settings/clear-privacy-pin"),
  privacyVerifyPin: (pin) => electron.ipcRenderer.invoke("settings/verify-privacy-pin", pin),
  processingSelectInput: () => electron.ipcRenderer.invoke("processing/select-input"),
  processingSelectBatch: () => electron.ipcRenderer.invoke("processing/select-batch"),
  processingPresets: () => electron.ipcRenderer.invoke("processing/presets"),
  processingTranscode: (payload) => electron.ipcRenderer.invoke("processing/transcode", payload),
  processingTranscribe: (payload) => electron.ipcRenderer.invoke("processing/transcribe", payload),
  processingList: (type) => electron.ipcRenderer.invoke("processing/list", type),
  processingDetails: (jobId) => electron.ipcRenderer.invoke("processing/details", jobId),
  processingCancel: (jobId) => electron.ipcRenderer.invoke("processing/cancel", jobId),
  processingDetectHWAccel: () => electron.ipcRenderer.invoke("processing/detect-hw-accel"),
  processingAdvancedTranscode: (payload) => electron.ipcRenderer.invoke("processing/advanced-transcode", payload),
  processingPreviewCommand: (payload) => electron.ipcRenderer.invoke("processing/preview-command", payload),
  processingProbeVideo: (filePath) => electron.ipcRenderer.invoke("processing/probe-video", filePath),
  processingAnalyzeVision: (payload) => electron.ipcRenderer.invoke("processing/analyze-video-vision", payload),
  processingGenerateThumbnail: (payload) => electron.ipcRenderer.invoke("processing/generate-thumbnail", payload),
  onProcessingEvent: (listener) => {
    const handler = (_event, payload) => {
      listener(payload);
    };
    electron.ipcRenderer.on("processing/event", handler);
    return () => {
      electron.ipcRenderer.removeListener("processing/event", handler);
    };
  },
  onDownloadEvent: (listener) => {
    const handler = (_event, payload) => {
      listener(payload);
    };
    electron.ipcRenderer.on("download/event", handler);
    return () => {
      electron.ipcRenderer.removeListener("download/event", handler);
    };
  },
  // Archival Processing API
  archivalSelectFiles: () => electron.ipcRenderer.invoke("archival/select-files"),
  archivalSelectOutputDir: () => electron.ipcRenderer.invoke("archival/select-output-dir"),
  archivalSelectFolder: () => electron.ipcRenderer.invoke("archival/select-folder"),
  archivalGetDefaultConfig: () => electron.ipcRenderer.invoke("archival/get-default-config"),
  archivalStartBatch: (payload) => electron.ipcRenderer.invoke("archival/start-batch", payload),
  archivalGetStatus: () => electron.ipcRenderer.invoke("archival/get-status"),
  archivalCancel: () => electron.ipcRenderer.invoke("archival/cancel"),
  archivalPause: () => electron.ipcRenderer.invoke("archival/pause"),
  archivalResume: () => electron.ipcRenderer.invoke("archival/resume"),
  archivalCheckRecovery: () => electron.ipcRenderer.invoke("archival/check-recovery"),
  archivalResumeRecovery: () => electron.ipcRenderer.invoke("archival/resume-recovery"),
  archivalDiscardRecovery: () => electron.ipcRenderer.invoke("archival/discard-recovery"),
  archivalGetPauseState: () => electron.ipcRenderer.invoke("archival/get-pause-state"),
  archivalPreviewCommand: (payload) => electron.ipcRenderer.invoke("archival/preview-command", payload),
  archivalEstimateSize: (inputPath) => electron.ipcRenderer.invoke("archival/estimate-size", inputPath),
  archivalAnalyzeVideo: (inputPath) => electron.ipcRenderer.invoke("archival/analyze-video", inputPath),
  archivalGetBatchInfo: (payload) => electron.ipcRenderer.invoke("archival/get-batch-info", payload),
  archivalDetectEncoders: () => electron.ipcRenderer.invoke("archival/detect-encoders"),
  archivalUpgradeFFmpeg: () => electron.ipcRenderer.invoke("archival/upgrade-ffmpeg"),
  onArchivalEvent: (listener) => {
    const handler = (_event, payload) => {
      listener(payload);
    };
    electron.ipcRenderer.on("archival/event", handler);
    return () => {
      electron.ipcRenderer.removeListener("archival/event", handler);
    };
  },
  onArchivalUpgradeProgress: (listener) => {
    const handler = (_event, payload) => {
      listener(payload);
    };
    electron.ipcRenderer.on("archival/upgrade-progress", handler);
    return () => {
      electron.ipcRenderer.removeListener("archival/upgrade-progress", handler);
    };
  },
  // Smart Tagging API
  smartTagging: {
    indexVideo: (videoId, videoPath) => electron.ipcRenderer.invoke("smart-tagging:index-video", { videoId, videoPath }),
    suggestTags: (params) => electron.ipcRenderer.invoke("smart-tagging:suggest-tags", params),
    applyDecision: (videoId, tagName, decision) => electron.ipcRenderer.invoke("smart-tagging:apply-decision", { videoId, tagName, decision }),
    addTag: (videoId, tagName, lock) => electron.ipcRenderer.invoke("smart-tagging:add-tag", { videoId, tagName, lock }),
    removeTag: (videoId, tagName, force) => electron.ipcRenderer.invoke("smart-tagging:remove-tag", { videoId, tagName, force }),
    lockTag: (videoId, tagName) => electron.ipcRenderer.invoke("smart-tagging:lock-tag", { videoId, tagName }),
    unlockTag: (videoId, tagName) => electron.ipcRenderer.invoke("smart-tagging:unlock-tag", { videoId, tagName }),
    regenerate: (videoId) => electron.ipcRenderer.invoke("smart-tagging:regenerate", { videoId }),
    getTaxonomy: () => electron.ipcRenderer.invoke("smart-tagging:get-taxonomy"),
    reloadTaxonomy: () => electron.ipcRenderer.invoke("smart-tagging:reload-taxonomy"),
    getVideoTags: (videoId) => electron.ipcRenderer.invoke("smart-tagging:get-video-tags", { videoId }),
    isIndexed: (videoId) => electron.ipcRenderer.invoke("smart-tagging:is-indexed", { videoId }),
    cleanup: (videoId) => electron.ipcRenderer.invoke("smart-tagging:cleanup", { videoId }),
    llmAvailable: () => electron.ipcRenderer.invoke("smart-tagging:llm-available"),
    llmModels: () => electron.ipcRenderer.invoke("smart-tagging:llm-models")
  },
  // App lock password
  appCheckPasswordSet: () => electron.ipcRenderer.invoke("app/check-password-set"),
  appSetPassword: (password) => electron.ipcRenderer.invoke("app/set-password", password),
  appVerifyPassword: (password) => electron.ipcRenderer.invoke("app/verify-password", password),
  appChangePassword: (payload) => electron.ipcRenderer.invoke("app/change-password", payload),
  appRemovePassword: (password) => electron.ipcRenderer.invoke("app/remove-password", password),
  appToggleLock: (enabled) => electron.ipcRenderer.invoke("app/toggle-lock", enabled)
};
electron.contextBridge.exposeInMainWorld("api", api);
