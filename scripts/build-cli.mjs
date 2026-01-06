#!/usr/bin/env node
/**
 * Build script for CLI using esbuild
 * Bundles the CLI into a single file that works standalone
 */

import * as esbuild from 'esbuild'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

// Plugin to mock electron module for CLI builds
const mockElectronPlugin = {
  name: 'mock-electron',
  setup(build) {
    // Intercept electron imports and return a mock
    build.onResolve({ filter: /^electron$/ }, args => ({
      path: args.path,
      namespace: 'mock-electron'
    }))

    build.onLoad({ filter: /.*/, namespace: 'mock-electron' }, () => ({
      contents: `
        // Mock electron module for CLI
        export const app = null
        export default { app: null }
      `,
      loader: 'js'
    }))
  }
}

async function build() {
  console.log('Building CLI...')

  // Ensure output directory exists
  mkdirSync(join(projectRoot, 'out', 'cli'), { recursive: true })

  try {
    await esbuild.build({
      entryPoints: [join(projectRoot, 'src', 'cli', 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: join(projectRoot, 'out', 'cli', 'index.cjs'),
      sourcemap: true,
      minify: false,
      plugins: [mockElectronPlugin],
      // External - don't bundle these native modules
      external: [
        'better-sqlite3',
        'sharp',
        'onnxruntime-node'
      ],
      define: {
        'process.env.CLI_MODE': '"true"'
      }
    })

    console.log('CLI built successfully!')
    console.log('Run with: node out/cli/index.cjs archive <input> <output>')

  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

build()
