/**
 * Drapp CLI - Video Archival Tool
 *
 * A command-line interface for batch video encoding using AV1/H.265
 * Designed for Linux terminal-only environments
 */

import { Command } from 'commander'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { archiveCommand } from './commands/archive.js'
import { style } from './ui/tui.js'

// Config directory
const CONFIG_DIR = join(homedir(), '.drapp')
const CONFIG_FILE = join(CONFIG_DIR, 'cli-config.json')

interface CLIConfig {
  firstRunComplete: boolean
  version: string
}

function loadConfig(): CLIConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch {
    // Ignore errors, return default
  }
  return { firstRunComplete: false, version: '0.1.0' }
}

function saveConfig(config: CLIConfig): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true })
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  } catch {
    // Ignore errors
  }
}

function showFirstRunWelcome(): void {
  console.log(`
${style.cyan}╭────────────────────────────────────────────────────────────╮${style.reset}
${style.cyan}│${style.reset}                                                            ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.bold}Welcome to Drapp CLI!${style.reset}                                   ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.dim}Video archival made simple${style.reset}                              ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}                                                            ${style.cyan}│${style.reset}
${style.cyan}├────────────────────────────────────────────────────────────┤${style.reset}
${style.cyan}│${style.reset}                                                            ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.bold}Quick Start:${style.reset}                                           ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}                                                            ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.green}Interactive mode${style.reset} (recommended for beginners):          ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}    ${style.cyan}drapp archive --interactive${style.reset}                          ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}    ${style.cyan}drapp archive -i${style.reset}                                     ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}                                                            ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.green}Direct mode${style.reset} (for automation/scripts):                  ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}    ${style.cyan}drapp archive /path/to/videos /path/to/output${style.reset}        ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}                                                            ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.green}Get help:${style.reset}                                              ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}    ${style.cyan}drapp archive --help${style.reset}                                 ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}                                                            ${style.cyan}│${style.reset}
${style.cyan}├────────────────────────────────────────────────────────────┤${style.reset}
${style.cyan}│${style.reset}                                                            ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.dim}Tip: Use the interactive wizard to browse files and${style.reset}      ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.dim}configure settings without memorizing command flags!${style.reset}     ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}                                                            ${style.cyan}│${style.reset}
${style.cyan}╰────────────────────────────────────────────────────────────╯${style.reset}
`)
}

// Check for first run
const config = loadConfig()
const args = process.argv.slice(2)

// Show welcome on first run (only if no arguments or just 'help')
if (!config.firstRunComplete && (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h')) {
  showFirstRunWelcome()
  config.firstRunComplete = true
  saveConfig(config)

  // If no arguments, exit after showing welcome
  if (args.length === 0) {
    process.exit(0)
  }
}

const program = new Command()

program
  .name('drapp')
  .description('Video archival tool - batch encode videos using AV1/H.265')
  .version('0.1.0')

// Register commands
program.addCommand(archiveCommand)

// Default action - show help or launch interactive
program.action(() => {
  // No subcommand provided, suggest interactive mode
  console.log(`
${style.bold}Drapp CLI${style.reset} - Video archival tool

${style.dim}Usage:${style.reset}
  drapp archive [options] <input> <output>
  drapp archive --interactive

${style.dim}Quick start:${style.reset}
  ${style.cyan}drapp archive -i${style.reset}  Launch interactive wizard

${style.dim}For more options:${style.reset}
  ${style.cyan}drapp archive --help${style.reset}
`)
})

// Parse arguments
program.parse()
