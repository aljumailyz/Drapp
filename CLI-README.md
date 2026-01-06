# Drapp CLI

A terminal-friendly video archival tool for batch encoding videos using AV1/H.265.

## Quick Start

### Option 1: One-Command Setup (Recommended)

```bash
git clone <repo-url>
cd Drapp
./setup.sh
```

The setup script will:
- Check for Node.js (18+) and npm
- Check for FFmpeg
- Install dependencies
- Build the CLI
- Create a `drapp` alias

### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Build the CLI
npm run build:cli

# Run
node out/cli/index.cjs archive --help
```

## Usage

### Interactive Mode (Recommended for Beginners)

Launch the guided wizard that helps you:
- Browse and select files visually
- Choose output location
- Configure encoding settings step-by-step

```bash
drapp archive --interactive
# or
drapp archive -i
```

### Direct Mode (For Scripts/Automation)

```bash
# Basic usage
drapp archive /path/to/videos /path/to/output

# Encode a single file
drapp archive video.mp4 ./encoded/

# Encode a folder of videos
drapp archive ~/Videos/raw ~/Videos/archived

# Use H.265 instead of AV1
drapp archive -c h265 /input /output

# Maximum compression (slower, smaller files)
drapp archive -p max-compression /input /output

# Fast encoding (quicker, larger files)
drapp archive -p fast /input /output
```

## Common Options

| Option | Description |
|--------|-------------|
| `-i, --interactive` | Launch guided wizard |
| `-c, --codec` | `av1` (default) or `h265` |
| `-p, --preset` | `archive` (default), `max-compression`, or `fast` |
| `--resolution` | `source`, `4k`, `1440p`, `1080p`, `720p`, `480p` |
| `--simple` | Use simple text output instead of visual interface |

## Examples

### Archive family videos for long-term storage
```bash
drapp archive ~/Videos/Family ~/Videos/Archived -p archive
```

### Quick conversion for sharing
```bash
drapp archive video.mp4 ./output -p fast --resolution 1080p
```

### Maximum compression for large libraries
```bash
drapp archive /media/videos /media/compressed -p max-compression
```

### Use H.265 for better compatibility
```bash
drapp archive ~/Videos ~/Output -c h265
```

## Requirements

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org)
- **FFmpeg**: With AV1 (libsvtav1) and/or H.265 (libx265) support

### Installing FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Fedora:**
```bash
sudo dnf install ffmpeg
```

**Arch Linux:**
```bash
sudo pacman -S ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

## Keyboard Shortcuts (Interactive Mode)

### File Browser
- `↑/↓` or `j/k`: Navigate
- `Space`: Select/deselect file
- `Enter`: Open folder / Confirm selection
- `a`: Select all videos in folder
- `g`: Go to home directory
- `q`: Cancel

### During Encoding
- `Ctrl+C`: Cancel encoding gracefully

## Tips

1. **First time?** Just run `drapp archive -i` and follow the prompts
2. **AV1 vs H.265**: AV1 gives better compression but is slower. H.265 is faster with wider device support
3. **Presets**: Start with `archive` (balanced), try `fast` if too slow, use `max-compression` for archival
4. **Resolution**: Keep `source` unless you specifically want to downscale

## Troubleshooting

### "FFmpeg not found"
Install FFmpeg using your package manager (see Requirements above)

### "AV1 encoder not available"
Your FFmpeg may not have SVT-AV1/libaom-av1. Use `-c h265` instead, or install a full FFmpeg build

### Visual interface looks broken
Use `--simple` flag for plain text output:
```bash
drapp archive /input /output --simple
```
