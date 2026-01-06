"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/commander/lib/error.js
var require_error = __commonJS({
  "node_modules/commander/lib/error.js"(exports2) {
    var CommanderError2 = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {number} exitCode suggested exit code which could be used with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
        this.nestedError = void 0;
      }
    };
    var InvalidArgumentError2 = class extends CommanderError2 {
      /**
       * Constructs the InvalidArgumentError class
       * @param {string} [message] explanation of why argument is invalid
       */
      constructor(message) {
        super(1, "commander.invalidArgument", message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }
    };
    exports2.CommanderError = CommanderError2;
    exports2.InvalidArgumentError = InvalidArgumentError2;
  }
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS({
  "node_modules/commander/lib/argument.js"(exports2) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Argument2 = class {
      /**
       * Initialize a new command argument with the given name and description.
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @param {string} name
       * @param {string} [description]
       */
      constructor(name, description) {
        this.description = description || "";
        this.variadic = false;
        this.parseArg = void 0;
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.argChoices = void 0;
        switch (name[0]) {
          case "<":
            this.required = true;
            this._name = name.slice(1, -1);
            break;
          case "[":
            this.required = false;
            this._name = name.slice(1, -1);
            break;
          default:
            this.required = true;
            this._name = name;
            break;
        }
        if (this._name.length > 3 && this._name.slice(-3) === "...") {
          this.variadic = true;
          this._name = this._name.slice(0, -3);
        }
      }
      /**
       * Return argument name.
       *
       * @return {string}
       */
      name() {
        return this._name;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Argument}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Set the custom handler for processing CLI command arguments into argument values.
       *
       * @param {Function} [fn]
       * @return {Argument}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Only allow argument value to be one of choices.
       *
       * @param {string[]} values
       * @return {Argument}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Make argument required.
       *
       * @returns {Argument}
       */
      argRequired() {
        this.required = true;
        return this;
      }
      /**
       * Make argument optional.
       *
       * @returns {Argument}
       */
      argOptional() {
        this.required = false;
        return this;
      }
    };
    function humanReadableArgName(arg) {
      const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    exports2.Argument = Argument2;
    exports2.humanReadableArgName = humanReadableArgName;
  }
});

// node_modules/commander/lib/help.js
var require_help = __commonJS({
  "node_modules/commander/lib/help.js"(exports2) {
    var { humanReadableArgName } = require_argument();
    var Help2 = class {
      constructor() {
        this.helpWidth = void 0;
        this.sortSubcommands = false;
        this.sortOptions = false;
        this.showGlobalOptions = false;
      }
      /**
       * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
       *
       * @param {Command} cmd
       * @returns {Command[]}
       */
      visibleCommands(cmd) {
        const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
        const helpCommand = cmd._getHelpCommand();
        if (helpCommand && !helpCommand._hidden) {
          visibleCommands.push(helpCommand);
        }
        if (this.sortSubcommands) {
          visibleCommands.sort((a, b) => {
            return a.name().localeCompare(b.name());
          });
        }
        return visibleCommands;
      }
      /**
       * Compare options for sort.
       *
       * @param {Option} a
       * @param {Option} b
       * @returns {number}
       */
      compareOptions(a, b) {
        const getSortKey = (option) => {
          return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
        };
        return getSortKey(a).localeCompare(getSortKey(b));
      }
      /**
       * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleOptions(cmd) {
        const visibleOptions = cmd.options.filter((option) => !option.hidden);
        const helpOption = cmd._getHelpOption();
        if (helpOption && !helpOption.hidden) {
          const removeShort = helpOption.short && cmd._findOption(helpOption.short);
          const removeLong = helpOption.long && cmd._findOption(helpOption.long);
          if (!removeShort && !removeLong) {
            visibleOptions.push(helpOption);
          } else if (helpOption.long && !removeLong) {
            visibleOptions.push(
              cmd.createOption(helpOption.long, helpOption.description)
            );
          } else if (helpOption.short && !removeShort) {
            visibleOptions.push(
              cmd.createOption(helpOption.short, helpOption.description)
            );
          }
        }
        if (this.sortOptions) {
          visibleOptions.sort(this.compareOptions);
        }
        return visibleOptions;
      }
      /**
       * Get an array of the visible global options. (Not including help.)
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleGlobalOptions(cmd) {
        if (!this.showGlobalOptions)
          return [];
        const globalOptions = [];
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          const visibleOptions = ancestorCmd.options.filter(
            (option) => !option.hidden
          );
          globalOptions.push(...visibleOptions);
        }
        if (this.sortOptions) {
          globalOptions.sort(this.compareOptions);
        }
        return globalOptions;
      }
      /**
       * Get an array of the arguments if any have a description.
       *
       * @param {Command} cmd
       * @returns {Argument[]}
       */
      visibleArguments(cmd) {
        if (cmd._argsDescription) {
          cmd.registeredArguments.forEach((argument) => {
            argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
          });
        }
        if (cmd.registeredArguments.find((argument) => argument.description)) {
          return cmd.registeredArguments;
        }
        return [];
      }
      /**
       * Get the command term to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandTerm(cmd) {
        const args2 = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
        return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
        (args2 ? " " + args2 : "");
      }
      /**
       * Get the option term to show in the list of options.
       *
       * @param {Option} option
       * @returns {string}
       */
      optionTerm(option) {
        return option.flags;
      }
      /**
       * Get the argument term to show in the list of arguments.
       *
       * @param {Argument} argument
       * @returns {string}
       */
      argumentTerm(argument) {
        return argument.name();
      }
      /**
       * Get the longest command term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestSubcommandTermLength(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command) => {
          return Math.max(max, helper.subcommandTerm(command).length);
        }, 0);
      }
      /**
       * Get the longest option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestOptionTermLength(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option) => {
          return Math.max(max, helper.optionTerm(option).length);
        }, 0);
      }
      /**
       * Get the longest global option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestGlobalOptionTermLength(cmd, helper) {
        return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
          return Math.max(max, helper.optionTerm(option).length);
        }, 0);
      }
      /**
       * Get the longest argument term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestArgumentTermLength(cmd, helper) {
        return helper.visibleArguments(cmd).reduce((max, argument) => {
          return Math.max(max, helper.argumentTerm(argument).length);
        }, 0);
      }
      /**
       * Get the command usage to be displayed at the top of the built-in help.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandUsage(cmd) {
        let cmdName = cmd._name;
        if (cmd._aliases[0]) {
          cmdName = cmdName + "|" + cmd._aliases[0];
        }
        let ancestorCmdNames = "";
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
        }
        return ancestorCmdNames + cmdName + " " + cmd.usage();
      }
      /**
       * Get the description for the command.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the subcommand summary to show in the list of subcommands.
       * (Fallback to description for backwards compatibility.)
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandDescription(cmd) {
        return cmd.summary() || cmd.description();
      }
      /**
       * Get the option description to show in the list of options.
       *
       * @param {Option} option
       * @return {string}
       */
      optionDescription(option) {
        const extraInfo = [];
        if (option.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (option.defaultValue !== void 0) {
          const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
          if (showDefault) {
            extraInfo.push(
              `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
            );
          }
        }
        if (option.presetArg !== void 0 && option.optional) {
          extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
        }
        if (option.envVar !== void 0) {
          extraInfo.push(`env: ${option.envVar}`);
        }
        if (extraInfo.length > 0) {
          return `${option.description} (${extraInfo.join(", ")})`;
        }
        return option.description;
      }
      /**
       * Get the argument description to show in the list of arguments.
       *
       * @param {Argument} argument
       * @return {string}
       */
      argumentDescription(argument) {
        const extraInfo = [];
        if (argument.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (argument.defaultValue !== void 0) {
          extraInfo.push(
            `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
          );
        }
        if (extraInfo.length > 0) {
          const extraDescripton = `(${extraInfo.join(", ")})`;
          if (argument.description) {
            return `${argument.description} ${extraDescripton}`;
          }
          return extraDescripton;
        }
        return argument.description;
      }
      /**
       * Generate the built-in help text.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {string}
       */
      formatHelp(cmd, helper) {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth || 80;
        const itemIndentWidth = 2;
        const itemSeparatorWidth = 2;
        function formatItem(term, description) {
          if (description) {
            const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
            return helper.wrap(
              fullText,
              helpWidth - itemIndentWidth,
              termWidth + itemSeparatorWidth
            );
          }
          return term;
        }
        function formatList(textArray) {
          return textArray.join("\n").replace(/^/gm, " ".repeat(itemIndentWidth));
        }
        let output = [`Usage: ${helper.commandUsage(cmd)}`, ""];
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
          output = output.concat([
            helper.wrap(commandDescription, helpWidth, 0),
            ""
          ]);
        }
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
          return formatItem(
            helper.argumentTerm(argument),
            helper.argumentDescription(argument)
          );
        });
        if (argumentList.length > 0) {
          output = output.concat(["Arguments:", formatList(argumentList), ""]);
        }
        const optionList = helper.visibleOptions(cmd).map((option) => {
          return formatItem(
            helper.optionTerm(option),
            helper.optionDescription(option)
          );
        });
        if (optionList.length > 0) {
          output = output.concat(["Options:", formatList(optionList), ""]);
        }
        if (this.showGlobalOptions) {
          const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
            return formatItem(
              helper.optionTerm(option),
              helper.optionDescription(option)
            );
          });
          if (globalOptionList.length > 0) {
            output = output.concat([
              "Global Options:",
              formatList(globalOptionList),
              ""
            ]);
          }
        }
        const commandList = helper.visibleCommands(cmd).map((cmd2) => {
          return formatItem(
            helper.subcommandTerm(cmd2),
            helper.subcommandDescription(cmd2)
          );
        });
        if (commandList.length > 0) {
          output = output.concat(["Commands:", formatList(commandList), ""]);
        }
        return output.join("\n");
      }
      /**
       * Calculate the pad width from the maximum term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      padWidth(cmd, helper) {
        return Math.max(
          helper.longestOptionTermLength(cmd, helper),
          helper.longestGlobalOptionTermLength(cmd, helper),
          helper.longestSubcommandTermLength(cmd, helper),
          helper.longestArgumentTermLength(cmd, helper)
        );
      }
      /**
       * Wrap the given string to width characters per line, with lines after the first indented.
       * Do not wrap if insufficient room for wrapping (minColumnWidth), or string is manually formatted.
       *
       * @param {string} str
       * @param {number} width
       * @param {number} indent
       * @param {number} [minColumnWidth=40]
       * @return {string}
       *
       */
      wrap(str, width, indent, minColumnWidth = 40) {
        const indents = " \\f\\t\\v\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF";
        const manualIndent = new RegExp(`[\\n][${indents}]+`);
        if (str.match(manualIndent))
          return str;
        const columnWidth = width - indent;
        if (columnWidth < minColumnWidth)
          return str;
        const leadingStr = str.slice(0, indent);
        const columnText = str.slice(indent).replace("\r\n", "\n");
        const indentString = " ".repeat(indent);
        const zeroWidthSpace = "\u200B";
        const breaks = `\\s${zeroWidthSpace}`;
        const regex = new RegExp(
          `
|.{1,${columnWidth - 1}}([${breaks}]|$)|[^${breaks}]+?([${breaks}]|$)`,
          "g"
        );
        const lines = columnText.match(regex) || [];
        return leadingStr + lines.map((line, i) => {
          if (line === "\n")
            return "";
          return (i > 0 ? indentString : "") + line.trimEnd();
        }).join("\n");
      }
    };
    exports2.Help = Help2;
  }
});

// node_modules/commander/lib/option.js
var require_option = __commonJS({
  "node_modules/commander/lib/option.js"(exports2) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Option2 = class {
      /**
       * Initialize a new `Option` with the given `flags` and `description`.
       *
       * @param {string} flags
       * @param {string} [description]
       */
      constructor(flags, description) {
        this.flags = flags;
        this.description = description || "";
        this.required = flags.includes("<");
        this.optional = flags.includes("[");
        this.variadic = /\w\.\.\.[>\]]$/.test(flags);
        this.mandatory = false;
        const optionFlags = splitOptionFlags(flags);
        this.short = optionFlags.shortFlag;
        this.long = optionFlags.longFlag;
        this.negate = false;
        if (this.long) {
          this.negate = this.long.startsWith("--no-");
        }
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.presetArg = void 0;
        this.envVar = void 0;
        this.parseArg = void 0;
        this.hidden = false;
        this.argChoices = void 0;
        this.conflictsWith = [];
        this.implied = void 0;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Option}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Preset to use when option used without option-argument, especially optional but also boolean and negated.
       * The custom processing (parseArg) is called.
       *
       * @example
       * new Option('--color').default('GREYSCALE').preset('RGB');
       * new Option('--donate [amount]').preset('20').argParser(parseFloat);
       *
       * @param {*} arg
       * @return {Option}
       */
      preset(arg) {
        this.presetArg = arg;
        return this;
      }
      /**
       * Add option name(s) that conflict with this option.
       * An error will be displayed if conflicting options are found during parsing.
       *
       * @example
       * new Option('--rgb').conflicts('cmyk');
       * new Option('--js').conflicts(['ts', 'jsx']);
       *
       * @param {(string | string[])} names
       * @return {Option}
       */
      conflicts(names) {
        this.conflictsWith = this.conflictsWith.concat(names);
        return this;
      }
      /**
       * Specify implied option values for when this option is set and the implied options are not.
       *
       * The custom processing (parseArg) is not called on the implied values.
       *
       * @example
       * program
       *   .addOption(new Option('--log', 'write logging information to file'))
       *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
       *
       * @param {object} impliedOptionValues
       * @return {Option}
       */
      implies(impliedOptionValues) {
        let newImplied = impliedOptionValues;
        if (typeof impliedOptionValues === "string") {
          newImplied = { [impliedOptionValues]: true };
        }
        this.implied = Object.assign(this.implied || {}, newImplied);
        return this;
      }
      /**
       * Set environment variable to check for option value.
       *
       * An environment variable is only used if when processed the current option value is
       * undefined, or the source of the current value is 'default' or 'config' or 'env'.
       *
       * @param {string} name
       * @return {Option}
       */
      env(name) {
        this.envVar = name;
        return this;
      }
      /**
       * Set the custom handler for processing CLI option arguments into option values.
       *
       * @param {Function} [fn]
       * @return {Option}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Whether the option is mandatory and must have a value after parsing.
       *
       * @param {boolean} [mandatory=true]
       * @return {Option}
       */
      makeOptionMandatory(mandatory = true) {
        this.mandatory = !!mandatory;
        return this;
      }
      /**
       * Hide option in help.
       *
       * @param {boolean} [hide=true]
       * @return {Option}
       */
      hideHelp(hide = true) {
        this.hidden = !!hide;
        return this;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Only allow option value to be one of choices.
       *
       * @param {string[]} values
       * @return {Option}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Return option name.
       *
       * @return {string}
       */
      name() {
        if (this.long) {
          return this.long.replace(/^--/, "");
        }
        return this.short.replace(/^-/, "");
      }
      /**
       * Return option name, in a camelcase format that can be used
       * as a object attribute key.
       *
       * @return {string}
       */
      attributeName() {
        return camelcase(this.name().replace(/^no-/, ""));
      }
      /**
       * Check if `arg` matches the short or long flag.
       *
       * @param {string} arg
       * @return {boolean}
       * @package
       */
      is(arg) {
        return this.short === arg || this.long === arg;
      }
      /**
       * Return whether a boolean option.
       *
       * Options are one of boolean, negated, required argument, or optional argument.
       *
       * @return {boolean}
       * @package
       */
      isBoolean() {
        return !this.required && !this.optional && !this.negate;
      }
    };
    var DualOptions = class {
      /**
       * @param {Option[]} options
       */
      constructor(options) {
        this.positiveOptions = /* @__PURE__ */ new Map();
        this.negativeOptions = /* @__PURE__ */ new Map();
        this.dualOptions = /* @__PURE__ */ new Set();
        options.forEach((option) => {
          if (option.negate) {
            this.negativeOptions.set(option.attributeName(), option);
          } else {
            this.positiveOptions.set(option.attributeName(), option);
          }
        });
        this.negativeOptions.forEach((value, key) => {
          if (this.positiveOptions.has(key)) {
            this.dualOptions.add(key);
          }
        });
      }
      /**
       * Did the value come from the option, and not from possible matching dual option?
       *
       * @param {*} value
       * @param {Option} option
       * @returns {boolean}
       */
      valueFromOption(value, option) {
        const optionKey = option.attributeName();
        if (!this.dualOptions.has(optionKey))
          return true;
        const preset = this.negativeOptions.get(optionKey).presetArg;
        const negativeValue = preset !== void 0 ? preset : false;
        return option.negate === (negativeValue === value);
      }
    };
    function camelcase(str) {
      return str.split("-").reduce((str2, word) => {
        return str2 + word[0].toUpperCase() + word.slice(1);
      });
    }
    function splitOptionFlags(flags) {
      let shortFlag;
      let longFlag;
      const flagParts = flags.split(/[ |,]+/);
      if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1]))
        shortFlag = flagParts.shift();
      longFlag = flagParts.shift();
      if (!shortFlag && /^-[^-]$/.test(longFlag)) {
        shortFlag = longFlag;
        longFlag = void 0;
      }
      return { shortFlag, longFlag };
    }
    exports2.Option = Option2;
    exports2.DualOptions = DualOptions;
  }
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS({
  "node_modules/commander/lib/suggestSimilar.js"(exports2) {
    var maxDistance = 3;
    function editDistance(a, b) {
      if (Math.abs(a.length - b.length) > maxDistance)
        return Math.max(a.length, b.length);
      const d = [];
      for (let i = 0; i <= a.length; i++) {
        d[i] = [i];
      }
      for (let j = 0; j <= b.length; j++) {
        d[0][j] = j;
      }
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          let cost = 1;
          if (a[i - 1] === b[j - 1]) {
            cost = 0;
          } else {
            cost = 1;
          }
          d[i][j] = Math.min(
            d[i - 1][j] + 1,
            // deletion
            d[i][j - 1] + 1,
            // insertion
            d[i - 1][j - 1] + cost
            // substitution
          );
          if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
            d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
          }
        }
      }
      return d[a.length][b.length];
    }
    function suggestSimilar(word, candidates) {
      if (!candidates || candidates.length === 0)
        return "";
      candidates = Array.from(new Set(candidates));
      const searchingOptions = word.startsWith("--");
      if (searchingOptions) {
        word = word.slice(2);
        candidates = candidates.map((candidate) => candidate.slice(2));
      }
      let similar = [];
      let bestDistance = maxDistance;
      const minSimilarity = 0.4;
      candidates.forEach((candidate) => {
        if (candidate.length <= 1)
          return;
        const distance = editDistance(word, candidate);
        const length = Math.max(word.length, candidate.length);
        const similarity = (length - distance) / length;
        if (similarity > minSimilarity) {
          if (distance < bestDistance) {
            bestDistance = distance;
            similar = [candidate];
          } else if (distance === bestDistance) {
            similar.push(candidate);
          }
        }
      });
      similar.sort((a, b) => a.localeCompare(b));
      if (searchingOptions) {
        similar = similar.map((candidate) => `--${candidate}`);
      }
      if (similar.length > 1) {
        return `
(Did you mean one of ${similar.join(", ")}?)`;
      }
      if (similar.length === 1) {
        return `
(Did you mean ${similar[0]}?)`;
      }
      return "";
    }
    exports2.suggestSimilar = suggestSimilar;
  }
});

// node_modules/commander/lib/command.js
var require_command = __commonJS({
  "node_modules/commander/lib/command.js"(exports2) {
    var EventEmitter = require("node:events").EventEmitter;
    var childProcess = require("node:child_process");
    var path = require("node:path");
    var fs = require("node:fs");
    var process2 = require("node:process");
    var { Argument: Argument2, humanReadableArgName } = require_argument();
    var { CommanderError: CommanderError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2, DualOptions } = require_option();
    var { suggestSimilar } = require_suggestSimilar();
    var Command2 = class _Command extends EventEmitter {
      /**
       * Initialize a new `Command`.
       *
       * @param {string} [name]
       */
      constructor(name) {
        super();
        this.commands = [];
        this.options = [];
        this.parent = null;
        this._allowUnknownOption = false;
        this._allowExcessArguments = true;
        this.registeredArguments = [];
        this._args = this.registeredArguments;
        this.args = [];
        this.rawArgs = [];
        this.processedArgs = [];
        this._scriptPath = null;
        this._name = name || "";
        this._optionValues = {};
        this._optionValueSources = {};
        this._storeOptionsAsProperties = false;
        this._actionHandler = null;
        this._executableHandler = false;
        this._executableFile = null;
        this._executableDir = null;
        this._defaultCommandName = null;
        this._exitCallback = null;
        this._aliases = [];
        this._combineFlagAndOptionalValue = true;
        this._description = "";
        this._summary = "";
        this._argsDescription = void 0;
        this._enablePositionalOptions = false;
        this._passThroughOptions = false;
        this._lifeCycleHooks = {};
        this._showHelpAfterError = false;
        this._showSuggestionAfterError = true;
        this._outputConfiguration = {
          writeOut: (str) => process2.stdout.write(str),
          writeErr: (str) => process2.stderr.write(str),
          getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : void 0,
          getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : void 0,
          outputError: (str, write) => write(str)
        };
        this._hidden = false;
        this._helpOption = void 0;
        this._addImplicitHelpCommand = void 0;
        this._helpCommand = void 0;
        this._helpConfiguration = {};
      }
      /**
       * Copy settings that are useful to have in common across root command and subcommands.
       *
       * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
       *
       * @param {Command} sourceCommand
       * @return {Command} `this` command for chaining
       */
      copyInheritedSettings(sourceCommand) {
        this._outputConfiguration = sourceCommand._outputConfiguration;
        this._helpOption = sourceCommand._helpOption;
        this._helpCommand = sourceCommand._helpCommand;
        this._helpConfiguration = sourceCommand._helpConfiguration;
        this._exitCallback = sourceCommand._exitCallback;
        this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
        this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
        this._allowExcessArguments = sourceCommand._allowExcessArguments;
        this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
        this._showHelpAfterError = sourceCommand._showHelpAfterError;
        this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
        return this;
      }
      /**
       * @returns {Command[]}
       * @private
       */
      _getCommandAndAncestors() {
        const result = [];
        for (let command = this; command; command = command.parent) {
          result.push(command);
        }
        return result;
      }
      /**
       * Define a command.
       *
       * There are two styles of command: pay attention to where to put the description.
       *
       * @example
       * // Command implemented using action handler (description is supplied separately to `.command`)
       * program
       *   .command('clone <source> [destination]')
       *   .description('clone a repository into a newly created directory')
       *   .action((source, destination) => {
       *     console.log('clone command called');
       *   });
       *
       * // Command implemented using separate executable file (description is second parameter to `.command`)
       * program
       *   .command('start <service>', 'start named service')
       *   .command('stop [service]', 'stop named service, or all if no name supplied');
       *
       * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
       * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
       * @param {object} [execOpts] - configuration options (for executable)
       * @return {Command} returns new command for action handler, or `this` for executable command
       */
      command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
        let desc = actionOptsOrExecDesc;
        let opts = execOpts;
        if (typeof desc === "object" && desc !== null) {
          opts = desc;
          desc = null;
        }
        opts = opts || {};
        const [, name, args2] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const cmd = this.createCommand(name);
        if (desc) {
          cmd.description(desc);
          cmd._executableHandler = true;
        }
        if (opts.isDefault)
          this._defaultCommandName = cmd._name;
        cmd._hidden = !!(opts.noHelp || opts.hidden);
        cmd._executableFile = opts.executableFile || null;
        if (args2)
          cmd.arguments(args2);
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd.copyInheritedSettings(this);
        if (desc)
          return this;
        return cmd;
      }
      /**
       * Factory routine to create a new unattached command.
       *
       * See .command() for creating an attached subcommand, which uses this routine to
       * create the command. You can override createCommand to customise subcommands.
       *
       * @param {string} [name]
       * @return {Command} new command
       */
      createCommand(name) {
        return new _Command(name);
      }
      /**
       * You can customise the help with a subclass of Help by overriding createHelp,
       * or by overriding Help properties using configureHelp().
       *
       * @return {Help}
       */
      createHelp() {
        return Object.assign(new Help2(), this.configureHelp());
      }
      /**
       * You can customise the help by overriding Help properties using configureHelp(),
       * or with a subclass of Help by overriding createHelp().
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureHelp(configuration) {
        if (configuration === void 0)
          return this._helpConfiguration;
        this._helpConfiguration = configuration;
        return this;
      }
      /**
       * The default output goes to stdout and stderr. You can customise this for special
       * applications. You can also customise the display of errors by overriding outputError.
       *
       * The configuration properties are all functions:
       *
       *     // functions to change where being written, stdout and stderr
       *     writeOut(str)
       *     writeErr(str)
       *     // matching functions to specify width for wrapping help
       *     getOutHelpWidth()
       *     getErrHelpWidth()
       *     // functions based on what is being written out
       *     outputError(str, write) // used for displaying errors, and not used for displaying help
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureOutput(configuration) {
        if (configuration === void 0)
          return this._outputConfiguration;
        Object.assign(this._outputConfiguration, configuration);
        return this;
      }
      /**
       * Display the help or a custom message after an error occurs.
       *
       * @param {(boolean|string)} [displayHelp]
       * @return {Command} `this` command for chaining
       */
      showHelpAfterError(displayHelp = true) {
        if (typeof displayHelp !== "string")
          displayHelp = !!displayHelp;
        this._showHelpAfterError = displayHelp;
        return this;
      }
      /**
       * Display suggestion of similar commands for unknown commands, or options for unknown options.
       *
       * @param {boolean} [displaySuggestion]
       * @return {Command} `this` command for chaining
       */
      showSuggestionAfterError(displaySuggestion = true) {
        this._showSuggestionAfterError = !!displaySuggestion;
        return this;
      }
      /**
       * Add a prepared subcommand.
       *
       * See .command() for creating an attached subcommand which inherits settings from its parent.
       *
       * @param {Command} cmd - new subcommand
       * @param {object} [opts] - configuration options
       * @return {Command} `this` command for chaining
       */
      addCommand(cmd, opts) {
        if (!cmd._name) {
          throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
        }
        opts = opts || {};
        if (opts.isDefault)
          this._defaultCommandName = cmd._name;
        if (opts.noHelp || opts.hidden)
          cmd._hidden = true;
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd._checkForBrokenPassThrough();
        return this;
      }
      /**
       * Factory routine to create a new unattached argument.
       *
       * See .argument() for creating an attached argument, which uses this routine to
       * create the argument. You can override createArgument to return a custom argument.
       *
       * @param {string} name
       * @param {string} [description]
       * @return {Argument} new argument
       */
      createArgument(name, description) {
        return new Argument2(name, description);
      }
      /**
       * Define argument syntax for command.
       *
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @example
       * program.argument('<input-file>');
       * program.argument('[output-file]');
       *
       * @param {string} name
       * @param {string} [description]
       * @param {(Function|*)} [fn] - custom argument processing function
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      argument(name, description, fn, defaultValue) {
        const argument = this.createArgument(name, description);
        if (typeof fn === "function") {
          argument.default(defaultValue).argParser(fn);
        } else {
          argument.default(fn);
        }
        this.addArgument(argument);
        return this;
      }
      /**
       * Define argument syntax for command, adding multiple at once (without descriptions).
       *
       * See also .argument().
       *
       * @example
       * program.arguments('<cmd> [env]');
       *
       * @param {string} names
       * @return {Command} `this` command for chaining
       */
      arguments(names) {
        names.trim().split(/ +/).forEach((detail) => {
          this.argument(detail);
        });
        return this;
      }
      /**
       * Define argument syntax for command, adding a prepared argument.
       *
       * @param {Argument} argument
       * @return {Command} `this` command for chaining
       */
      addArgument(argument) {
        const previousArgument = this.registeredArguments.slice(-1)[0];
        if (previousArgument && previousArgument.variadic) {
          throw new Error(
            `only the last argument can be variadic '${previousArgument.name()}'`
          );
        }
        if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
          throw new Error(
            `a default value for a required argument is never used: '${argument.name()}'`
          );
        }
        this.registeredArguments.push(argument);
        return this;
      }
      /**
       * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
       *
       * @example
       *    program.helpCommand('help [cmd]');
       *    program.helpCommand('help [cmd]', 'show help');
       *    program.helpCommand(false); // suppress default help command
       *    program.helpCommand(true); // add help command even if no subcommands
       *
       * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
       * @param {string} [description] - custom description
       * @return {Command} `this` command for chaining
       */
      helpCommand(enableOrNameAndArgs, description) {
        if (typeof enableOrNameAndArgs === "boolean") {
          this._addImplicitHelpCommand = enableOrNameAndArgs;
          return this;
        }
        enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
        const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
        const helpDescription = description ?? "display help for command";
        const helpCommand = this.createCommand(helpName);
        helpCommand.helpOption(false);
        if (helpArgs)
          helpCommand.arguments(helpArgs);
        if (helpDescription)
          helpCommand.description(helpDescription);
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Add prepared custom help command.
       *
       * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
       * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
       * @return {Command} `this` command for chaining
       */
      addHelpCommand(helpCommand, deprecatedDescription) {
        if (typeof helpCommand !== "object") {
          this.helpCommand(helpCommand, deprecatedDescription);
          return this;
        }
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Lazy create help command.
       *
       * @return {(Command|null)}
       * @package
       */
      _getHelpCommand() {
        const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
        if (hasImplicitHelpCommand) {
          if (this._helpCommand === void 0) {
            this.helpCommand(void 0, void 0);
          }
          return this._helpCommand;
        }
        return null;
      }
      /**
       * Add hook for life cycle event.
       *
       * @param {string} event
       * @param {Function} listener
       * @return {Command} `this` command for chaining
       */
      hook(event, listener) {
        const allowedValues = ["preSubcommand", "preAction", "postAction"];
        if (!allowedValues.includes(event)) {
          throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        if (this._lifeCycleHooks[event]) {
          this._lifeCycleHooks[event].push(listener);
        } else {
          this._lifeCycleHooks[event] = [listener];
        }
        return this;
      }
      /**
       * Register callback to use as replacement for calling process.exit.
       *
       * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
       * @return {Command} `this` command for chaining
       */
      exitOverride(fn) {
        if (fn) {
          this._exitCallback = fn;
        } else {
          this._exitCallback = (err) => {
            if (err.code !== "commander.executeSubCommandAsync") {
              throw err;
            } else {
            }
          };
        }
        return this;
      }
      /**
       * Call process.exit, and _exitCallback if defined.
       *
       * @param {number} exitCode exit code for using with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @return never
       * @private
       */
      _exit(exitCode, code, message) {
        if (this._exitCallback) {
          this._exitCallback(new CommanderError2(exitCode, code, message));
        }
        process2.exit(exitCode);
      }
      /**
       * Register callback `fn` for the command.
       *
       * @example
       * program
       *   .command('serve')
       *   .description('start service')
       *   .action(function() {
       *      // do work here
       *   });
       *
       * @param {Function} fn
       * @return {Command} `this` command for chaining
       */
      action(fn) {
        const listener = (args2) => {
          const expectedArgsCount = this.registeredArguments.length;
          const actionArgs = args2.slice(0, expectedArgsCount);
          if (this._storeOptionsAsProperties) {
            actionArgs[expectedArgsCount] = this;
          } else {
            actionArgs[expectedArgsCount] = this.opts();
          }
          actionArgs.push(this);
          return fn.apply(this, actionArgs);
        };
        this._actionHandler = listener;
        return this;
      }
      /**
       * Factory routine to create a new unattached option.
       *
       * See .option() for creating an attached option, which uses this routine to
       * create the option. You can override createOption to return a custom option.
       *
       * @param {string} flags
       * @param {string} [description]
       * @return {Option} new option
       */
      createOption(flags, description) {
        return new Option2(flags, description);
      }
      /**
       * Wrap parseArgs to catch 'commander.invalidArgument'.
       *
       * @param {(Option | Argument)} target
       * @param {string} value
       * @param {*} previous
       * @param {string} invalidArgumentMessage
       * @private
       */
      _callParseArg(target, value, previous, invalidArgumentMessage) {
        try {
          return target.parseArg(value, previous);
        } catch (err) {
          if (err.code === "commander.invalidArgument") {
            const message = `${invalidArgumentMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      /**
       * Check for option flag conflicts.
       * Register option if no conflicts found, or throw on conflict.
       *
       * @param {Option} option
       * @private
       */
      _registerOption(option) {
        const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
        if (matchingOption) {
          const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
          throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
        }
        this.options.push(option);
      }
      /**
       * Check for command name and alias conflicts with existing commands.
       * Register command if no conflicts found, or throw on conflict.
       *
       * @param {Command} command
       * @private
       */
      _registerCommand(command) {
        const knownBy = (cmd) => {
          return [cmd.name()].concat(cmd.aliases());
        };
        const alreadyUsed = knownBy(command).find(
          (name) => this._findCommand(name)
        );
        if (alreadyUsed) {
          const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
          const newCmd = knownBy(command).join("|");
          throw new Error(
            `cannot add command '${newCmd}' as already have command '${existingCmd}'`
          );
        }
        this.commands.push(command);
      }
      /**
       * Add an option.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addOption(option) {
        this._registerOption(option);
        const oname = option.name();
        const name = option.attributeName();
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, "--");
          if (!this._findOption(positiveLongFlag)) {
            this.setOptionValueWithSource(
              name,
              option.defaultValue === void 0 ? true : option.defaultValue,
              "default"
            );
          }
        } else if (option.defaultValue !== void 0) {
          this.setOptionValueWithSource(name, option.defaultValue, "default");
        }
        const handleOptionValue = (val, invalidValueMessage, valueSource) => {
          if (val == null && option.presetArg !== void 0) {
            val = option.presetArg;
          }
          const oldValue = this.getOptionValue(name);
          if (val !== null && option.parseArg) {
            val = this._callParseArg(option, val, oldValue, invalidValueMessage);
          } else if (val !== null && option.variadic) {
            val = option._concatValue(val, oldValue);
          }
          if (val == null) {
            if (option.negate) {
              val = false;
            } else if (option.isBoolean() || option.optional) {
              val = true;
            } else {
              val = "";
            }
          }
          this.setOptionValueWithSource(name, val, valueSource);
        };
        this.on("option:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "cli");
        });
        if (option.envVar) {
          this.on("optionEnv:" + oname, (val) => {
            const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
            handleOptionValue(val, invalidValueMessage, "env");
          });
        }
        return this;
      }
      /**
       * Internal implementation shared by .option() and .requiredOption()
       *
       * @return {Command} `this` command for chaining
       * @private
       */
      _optionEx(config2, flags, description, fn, defaultValue) {
        if (typeof flags === "object" && flags instanceof Option2) {
          throw new Error(
            "To add an Option object use addOption() instead of option() or requiredOption()"
          );
        }
        const option = this.createOption(flags, description);
        option.makeOptionMandatory(!!config2.mandatory);
        if (typeof fn === "function") {
          option.default(defaultValue).argParser(fn);
        } else if (fn instanceof RegExp) {
          const regex = fn;
          fn = (val, def) => {
            const m = regex.exec(val);
            return m ? m[0] : def;
          };
          option.default(defaultValue).argParser(fn);
        } else {
          option.default(fn);
        }
        return this.addOption(option);
      }
      /**
       * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
       * option-argument is indicated by `<>` and an optional option-argument by `[]`.
       *
       * See the README for more details, and see also addOption() and requiredOption().
       *
       * @example
       * program
       *     .option('-p, --pepper', 'add pepper')
       *     .option('-p, --pizza-type <TYPE>', 'type of pizza') // required option-argument
       *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
       *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      option(flags, description, parseArg, defaultValue) {
        return this._optionEx({}, flags, description, parseArg, defaultValue);
      }
      /**
       * Add a required option which must have a value after parsing. This usually means
       * the option must be specified on the command line. (Otherwise the same as .option().)
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      requiredOption(flags, description, parseArg, defaultValue) {
        return this._optionEx(
          { mandatory: true },
          flags,
          description,
          parseArg,
          defaultValue
        );
      }
      /**
       * Alter parsing of short flags with optional values.
       *
       * @example
       * // for `.option('-f,--flag [value]'):
       * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
       * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
       *
       * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
       * @return {Command} `this` command for chaining
       */
      combineFlagAndOptionalValue(combine = true) {
        this._combineFlagAndOptionalValue = !!combine;
        return this;
      }
      /**
       * Allow unknown options on the command line.
       *
       * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
       * @return {Command} `this` command for chaining
       */
      allowUnknownOption(allowUnknown = true) {
        this._allowUnknownOption = !!allowUnknown;
        return this;
      }
      /**
       * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
       *
       * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
       * @return {Command} `this` command for chaining
       */
      allowExcessArguments(allowExcess = true) {
        this._allowExcessArguments = !!allowExcess;
        return this;
      }
      /**
       * Enable positional options. Positional means global options are specified before subcommands which lets
       * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
       * The default behaviour is non-positional and global options may appear anywhere on the command line.
       *
       * @param {boolean} [positional]
       * @return {Command} `this` command for chaining
       */
      enablePositionalOptions(positional = true) {
        this._enablePositionalOptions = !!positional;
        return this;
      }
      /**
       * Pass through options that come after command-arguments rather than treat them as command-options,
       * so actual command-options come before command-arguments. Turning this on for a subcommand requires
       * positional options to have been enabled on the program (parent commands).
       * The default behaviour is non-positional and options may appear before or after command-arguments.
       *
       * @param {boolean} [passThrough] for unknown options.
       * @return {Command} `this` command for chaining
       */
      passThroughOptions(passThrough = true) {
        this._passThroughOptions = !!passThrough;
        this._checkForBrokenPassThrough();
        return this;
      }
      /**
       * @private
       */
      _checkForBrokenPassThrough() {
        if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
          throw new Error(
            `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
          );
        }
      }
      /**
       * Whether to store option values as properties on command object,
       * or store separately (specify false). In both cases the option values can be accessed using .opts().
       *
       * @param {boolean} [storeAsProperties=true]
       * @return {Command} `this` command for chaining
       */
      storeOptionsAsProperties(storeAsProperties = true) {
        if (this.options.length) {
          throw new Error("call .storeOptionsAsProperties() before adding options");
        }
        if (Object.keys(this._optionValues).length) {
          throw new Error(
            "call .storeOptionsAsProperties() before setting option values"
          );
        }
        this._storeOptionsAsProperties = !!storeAsProperties;
        return this;
      }
      /**
       * Retrieve option value.
       *
       * @param {string} key
       * @return {object} value
       */
      getOptionValue(key) {
        if (this._storeOptionsAsProperties) {
          return this[key];
        }
        return this._optionValues[key];
      }
      /**
       * Store option value.
       *
       * @param {string} key
       * @param {object} value
       * @return {Command} `this` command for chaining
       */
      setOptionValue(key, value) {
        return this.setOptionValueWithSource(key, value, void 0);
      }
      /**
       * Store option value and where the value came from.
       *
       * @param {string} key
       * @param {object} value
       * @param {string} source - expected values are default/config/env/cli/implied
       * @return {Command} `this` command for chaining
       */
      setOptionValueWithSource(key, value, source) {
        if (this._storeOptionsAsProperties) {
          this[key] = value;
        } else {
          this._optionValues[key] = value;
        }
        this._optionValueSources[key] = source;
        return this;
      }
      /**
       * Get source of option value.
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSource(key) {
        return this._optionValueSources[key];
      }
      /**
       * Get source of option value. See also .optsWithGlobals().
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSourceWithGlobals(key) {
        let source;
        this._getCommandAndAncestors().forEach((cmd) => {
          if (cmd.getOptionValueSource(key) !== void 0) {
            source = cmd.getOptionValueSource(key);
          }
        });
        return source;
      }
      /**
       * Get user arguments from implied or explicit arguments.
       * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
       *
       * @private
       */
      _prepareUserArgs(argv, parseOptions) {
        if (argv !== void 0 && !Array.isArray(argv)) {
          throw new Error("first parameter to parse must be array or undefined");
        }
        parseOptions = parseOptions || {};
        if (argv === void 0 && parseOptions.from === void 0) {
          if (process2.versions?.electron) {
            parseOptions.from = "electron";
          }
          const execArgv = process2.execArgv ?? [];
          if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
            parseOptions.from = "eval";
          }
        }
        if (argv === void 0) {
          argv = process2.argv;
        }
        this.rawArgs = argv.slice();
        let userArgs;
        switch (parseOptions.from) {
          case void 0:
          case "node":
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
            break;
          case "electron":
            if (process2.defaultApp) {
              this._scriptPath = argv[1];
              userArgs = argv.slice(2);
            } else {
              userArgs = argv.slice(1);
            }
            break;
          case "user":
            userArgs = argv.slice(0);
            break;
          case "eval":
            userArgs = argv.slice(1);
            break;
          default:
            throw new Error(
              `unexpected parse option { from: '${parseOptions.from}' }`
            );
        }
        if (!this._name && this._scriptPath)
          this.nameFromFilename(this._scriptPath);
        this._name = this._name || "program";
        return userArgs;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Use parseAsync instead of parse if any of your action handlers are async.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * program.parse(); // parse process.argv and auto-detect electron and special node flags
       * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
       * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv] - optional, defaults to process.argv
       * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
       * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
       * @return {Command} `this` command for chaining
       */
      parse(argv, parseOptions) {
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
       * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
       * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv]
       * @param {object} [parseOptions]
       * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
       * @return {Promise}
       */
      async parseAsync(argv, parseOptions) {
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        await this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Execute a sub-command executable.
       *
       * @private
       */
      _executeSubCommand(subcommand, args2) {
        args2 = args2.slice();
        let launchWithNode = false;
        const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
        function findFile(baseDir, baseName) {
          const localBin = path.resolve(baseDir, baseName);
          if (fs.existsSync(localBin))
            return localBin;
          if (sourceExt.includes(path.extname(baseName)))
            return void 0;
          const foundExt = sourceExt.find(
            (ext) => fs.existsSync(`${localBin}${ext}`)
          );
          if (foundExt)
            return `${localBin}${foundExt}`;
          return void 0;
        }
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
        let executableDir = this._executableDir || "";
        if (this._scriptPath) {
          let resolvedScriptPath;
          try {
            resolvedScriptPath = fs.realpathSync(this._scriptPath);
          } catch (err) {
            resolvedScriptPath = this._scriptPath;
          }
          executableDir = path.resolve(
            path.dirname(resolvedScriptPath),
            executableDir
          );
        }
        if (executableDir) {
          let localFile = findFile(executableDir, executableFile);
          if (!localFile && !subcommand._executableFile && this._scriptPath) {
            const legacyName = path.basename(
              this._scriptPath,
              path.extname(this._scriptPath)
            );
            if (legacyName !== this._name) {
              localFile = findFile(
                executableDir,
                `${legacyName}-${subcommand._name}`
              );
            }
          }
          executableFile = localFile || executableFile;
        }
        launchWithNode = sourceExt.includes(path.extname(executableFile));
        let proc;
        if (process2.platform !== "win32") {
          if (launchWithNode) {
            args2.unshift(executableFile);
            args2 = incrementNodeInspectorPort(process2.execArgv).concat(args2);
            proc = childProcess.spawn(process2.argv[0], args2, { stdio: "inherit" });
          } else {
            proc = childProcess.spawn(executableFile, args2, { stdio: "inherit" });
          }
        } else {
          args2.unshift(executableFile);
          args2 = incrementNodeInspectorPort(process2.execArgv).concat(args2);
          proc = childProcess.spawn(process2.execPath, args2, { stdio: "inherit" });
        }
        if (!proc.killed) {
          const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
          signals.forEach((signal) => {
            process2.on(signal, () => {
              if (proc.killed === false && proc.exitCode === null) {
                proc.kill(signal);
              }
            });
          });
        }
        const exitCallback = this._exitCallback;
        proc.on("close", (code) => {
          code = code ?? 1;
          if (!exitCallback) {
            process2.exit(code);
          } else {
            exitCallback(
              new CommanderError2(
                code,
                "commander.executeSubCommandAsync",
                "(close)"
              )
            );
          }
        });
        proc.on("error", (err) => {
          if (err.code === "ENOENT") {
            const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
            const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
            throw new Error(executableMissing);
          } else if (err.code === "EACCES") {
            throw new Error(`'${executableFile}' not executable`);
          }
          if (!exitCallback) {
            process2.exit(1);
          } else {
            const wrappedError = new CommanderError2(
              1,
              "commander.executeSubCommandAsync",
              "(error)"
            );
            wrappedError.nestedError = err;
            exitCallback(wrappedError);
          }
        });
        this.runningCommand = proc;
      }
      /**
       * @private
       */
      _dispatchSubcommand(commandName, operands, unknown) {
        const subCommand = this._findCommand(commandName);
        if (!subCommand)
          this.help({ error: true });
        let promiseChain;
        promiseChain = this._chainOrCallSubCommandHook(
          promiseChain,
          subCommand,
          "preSubcommand"
        );
        promiseChain = this._chainOrCall(promiseChain, () => {
          if (subCommand._executableHandler) {
            this._executeSubCommand(subCommand, operands.concat(unknown));
          } else {
            return subCommand._parseCommand(operands, unknown);
          }
        });
        return promiseChain;
      }
      /**
       * Invoke help directly if possible, or dispatch if necessary.
       * e.g. help foo
       *
       * @private
       */
      _dispatchHelpCommand(subcommandName) {
        if (!subcommandName) {
          this.help();
        }
        const subCommand = this._findCommand(subcommandName);
        if (subCommand && !subCommand._executableHandler) {
          subCommand.help();
        }
        return this._dispatchSubcommand(
          subcommandName,
          [],
          [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
        );
      }
      /**
       * Check this.args against expected this.registeredArguments.
       *
       * @private
       */
      _checkNumberOfArguments() {
        this.registeredArguments.forEach((arg, i) => {
          if (arg.required && this.args[i] == null) {
            this.missingArgument(arg.name());
          }
        });
        if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
          return;
        }
        if (this.args.length > this.registeredArguments.length) {
          this._excessArguments(this.args);
        }
      }
      /**
       * Process this.args using this.registeredArguments and save as this.processedArgs!
       *
       * @private
       */
      _processArguments() {
        const myParseArg = (argument, value, previous) => {
          let parsedValue = value;
          if (value !== null && argument.parseArg) {
            const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
            parsedValue = this._callParseArg(
              argument,
              value,
              previous,
              invalidValueMessage
            );
          }
          return parsedValue;
        };
        this._checkNumberOfArguments();
        const processedArgs = [];
        this.registeredArguments.forEach((declaredArg, index) => {
          let value = declaredArg.defaultValue;
          if (declaredArg.variadic) {
            if (index < this.args.length) {
              value = this.args.slice(index);
              if (declaredArg.parseArg) {
                value = value.reduce((processed, v) => {
                  return myParseArg(declaredArg, v, processed);
                }, declaredArg.defaultValue);
              }
            } else if (value === void 0) {
              value = [];
            }
          } else if (index < this.args.length) {
            value = this.args[index];
            if (declaredArg.parseArg) {
              value = myParseArg(declaredArg, value, declaredArg.defaultValue);
            }
          }
          processedArgs[index] = value;
        });
        this.processedArgs = processedArgs;
      }
      /**
       * Once we have a promise we chain, but call synchronously until then.
       *
       * @param {(Promise|undefined)} promise
       * @param {Function} fn
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCall(promise, fn) {
        if (promise && promise.then && typeof promise.then === "function") {
          return promise.then(() => fn());
        }
        return fn();
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallHooks(promise, event) {
        let result = promise;
        const hooks = [];
        this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
          hookedCommand._lifeCycleHooks[event].forEach((callback) => {
            hooks.push({ hookedCommand, callback });
          });
        });
        if (event === "postAction") {
          hooks.reverse();
        }
        hooks.forEach((hookDetail) => {
          result = this._chainOrCall(result, () => {
            return hookDetail.callback(hookDetail.hookedCommand, this);
          });
        });
        return result;
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {Command} subCommand
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallSubCommandHook(promise, subCommand, event) {
        let result = promise;
        if (this._lifeCycleHooks[event] !== void 0) {
          this._lifeCycleHooks[event].forEach((hook) => {
            result = this._chainOrCall(result, () => {
              return hook(this, subCommand);
            });
          });
        }
        return result;
      }
      /**
       * Process arguments in context of this command.
       * Returns action result, in case it is a promise.
       *
       * @private
       */
      _parseCommand(operands, unknown) {
        const parsed = this.parseOptions(unknown);
        this._parseOptionsEnv();
        this._parseOptionsImplied();
        operands = operands.concat(parsed.operands);
        unknown = parsed.unknown;
        this.args = operands.concat(unknown);
        if (operands && this._findCommand(operands[0])) {
          return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
        }
        if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
          return this._dispatchHelpCommand(operands[1]);
        }
        if (this._defaultCommandName) {
          this._outputHelpIfRequested(unknown);
          return this._dispatchSubcommand(
            this._defaultCommandName,
            operands,
            unknown
          );
        }
        if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
          this.help({ error: true });
        }
        this._outputHelpIfRequested(parsed.unknown);
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        const checkForUnknownOptions = () => {
          if (parsed.unknown.length > 0) {
            this.unknownOption(parsed.unknown[0]);
          }
        };
        const commandEvent = `command:${this.name()}`;
        if (this._actionHandler) {
          checkForUnknownOptions();
          this._processArguments();
          let promiseChain;
          promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
          promiseChain = this._chainOrCall(
            promiseChain,
            () => this._actionHandler(this.processedArgs)
          );
          if (this.parent) {
            promiseChain = this._chainOrCall(promiseChain, () => {
              this.parent.emit(commandEvent, operands, unknown);
            });
          }
          promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
          return promiseChain;
        }
        if (this.parent && this.parent.listenerCount(commandEvent)) {
          checkForUnknownOptions();
          this._processArguments();
          this.parent.emit(commandEvent, operands, unknown);
        } else if (operands.length) {
          if (this._findCommand("*")) {
            return this._dispatchSubcommand("*", operands, unknown);
          }
          if (this.listenerCount("command:*")) {
            this.emit("command:*", operands, unknown);
          } else if (this.commands.length) {
            this.unknownCommand();
          } else {
            checkForUnknownOptions();
            this._processArguments();
          }
        } else if (this.commands.length) {
          checkForUnknownOptions();
          this.help({ error: true });
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      }
      /**
       * Find matching command.
       *
       * @private
       * @return {Command | undefined}
       */
      _findCommand(name) {
        if (!name)
          return void 0;
        return this.commands.find(
          (cmd) => cmd._name === name || cmd._aliases.includes(name)
        );
      }
      /**
       * Return an option matching `arg` if any.
       *
       * @param {string} arg
       * @return {Option}
       * @package
       */
      _findOption(arg) {
        return this.options.find((option) => option.is(arg));
      }
      /**
       * Display an error message if a mandatory option does not have a value.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForMissingMandatoryOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd.options.forEach((anOption) => {
            if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
              cmd.missingMandatoryOptionValue(anOption);
            }
          });
        });
      }
      /**
       * Display an error message if conflicting options are used together in this.
       *
       * @private
       */
      _checkForConflictingLocalOptions() {
        const definedNonDefaultOptions = this.options.filter((option) => {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === void 0) {
            return false;
          }
          return this.getOptionValueSource(optionKey) !== "default";
        });
        const optionsWithConflicting = definedNonDefaultOptions.filter(
          (option) => option.conflictsWith.length > 0
        );
        optionsWithConflicting.forEach((option) => {
          const conflictingAndDefined = definedNonDefaultOptions.find(
            (defined) => option.conflictsWith.includes(defined.attributeName())
          );
          if (conflictingAndDefined) {
            this._conflictingOption(option, conflictingAndDefined);
          }
        });
      }
      /**
       * Display an error message if conflicting options are used together.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForConflictingOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd._checkForConflictingLocalOptions();
        });
      }
      /**
       * Parse options from `argv` removing known options,
       * and return argv split into operands and unknown arguments.
       *
       * Examples:
       *
       *     argv => operands, unknown
       *     --known kkk op => [op], []
       *     op --known kkk => [op], []
       *     sub --unknown uuu op => [sub], [--unknown uuu op]
       *     sub -- --unknown uuu op => [sub --unknown uuu op], []
       *
       * @param {string[]} argv
       * @return {{operands: string[], unknown: string[]}}
       */
      parseOptions(argv) {
        const operands = [];
        const unknown = [];
        let dest = operands;
        const args2 = argv.slice();
        function maybeOption(arg) {
          return arg.length > 1 && arg[0] === "-";
        }
        let activeVariadicOption = null;
        while (args2.length) {
          const arg = args2.shift();
          if (arg === "--") {
            if (dest === unknown)
              dest.push(arg);
            dest.push(...args2);
            break;
          }
          if (activeVariadicOption && !maybeOption(arg)) {
            this.emit(`option:${activeVariadicOption.name()}`, arg);
            continue;
          }
          activeVariadicOption = null;
          if (maybeOption(arg)) {
            const option = this._findOption(arg);
            if (option) {
              if (option.required) {
                const value = args2.shift();
                if (value === void 0)
                  this.optionMissingArgument(option);
                this.emit(`option:${option.name()}`, value);
              } else if (option.optional) {
                let value = null;
                if (args2.length > 0 && !maybeOption(args2[0])) {
                  value = args2.shift();
                }
                this.emit(`option:${option.name()}`, value);
              } else {
                this.emit(`option:${option.name()}`);
              }
              activeVariadicOption = option.variadic ? option : null;
              continue;
            }
          }
          if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
            const option = this._findOption(`-${arg[1]}`);
            if (option) {
              if (option.required || option.optional && this._combineFlagAndOptionalValue) {
                this.emit(`option:${option.name()}`, arg.slice(2));
              } else {
                this.emit(`option:${option.name()}`);
                args2.unshift(`-${arg.slice(2)}`);
              }
              continue;
            }
          }
          if (/^--[^=]+=/.test(arg)) {
            const index = arg.indexOf("=");
            const option = this._findOption(arg.slice(0, index));
            if (option && (option.required || option.optional)) {
              this.emit(`option:${option.name()}`, arg.slice(index + 1));
              continue;
            }
          }
          if (maybeOption(arg)) {
            dest = unknown;
          }
          if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
            if (this._findCommand(arg)) {
              operands.push(arg);
              if (args2.length > 0)
                unknown.push(...args2);
              break;
            } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
              operands.push(arg);
              if (args2.length > 0)
                operands.push(...args2);
              break;
            } else if (this._defaultCommandName) {
              unknown.push(arg);
              if (args2.length > 0)
                unknown.push(...args2);
              break;
            }
          }
          if (this._passThroughOptions) {
            dest.push(arg);
            if (args2.length > 0)
              dest.push(...args2);
            break;
          }
          dest.push(arg);
        }
        return { operands, unknown };
      }
      /**
       * Return an object containing local option values as key-value pairs.
       *
       * @return {object}
       */
      opts() {
        if (this._storeOptionsAsProperties) {
          const result = {};
          const len = this.options.length;
          for (let i = 0; i < len; i++) {
            const key = this.options[i].attributeName();
            result[key] = key === this._versionOptionName ? this._version : this[key];
          }
          return result;
        }
        return this._optionValues;
      }
      /**
       * Return an object containing merged local and global option values as key-value pairs.
       *
       * @return {object}
       */
      optsWithGlobals() {
        return this._getCommandAndAncestors().reduce(
          (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
          {}
        );
      }
      /**
       * Display error message and exit (or call exitOverride).
       *
       * @param {string} message
       * @param {object} [errorOptions]
       * @param {string} [errorOptions.code] - an id string representing the error
       * @param {number} [errorOptions.exitCode] - used with process.exit
       */
      error(message, errorOptions) {
        this._outputConfiguration.outputError(
          `${message}
`,
          this._outputConfiguration.writeErr
        );
        if (typeof this._showHelpAfterError === "string") {
          this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
        } else if (this._showHelpAfterError) {
          this._outputConfiguration.writeErr("\n");
          this.outputHelp({ error: true });
        }
        const config2 = errorOptions || {};
        const exitCode = config2.exitCode || 1;
        const code = config2.code || "commander.error";
        this._exit(exitCode, code, message);
      }
      /**
       * Apply any option related environment variables, if option does
       * not have a value from cli or client code.
       *
       * @private
       */
      _parseOptionsEnv() {
        this.options.forEach((option) => {
          if (option.envVar && option.envVar in process2.env) {
            const optionKey = option.attributeName();
            if (this.getOptionValue(optionKey) === void 0 || ["default", "config", "env"].includes(
              this.getOptionValueSource(optionKey)
            )) {
              if (option.required || option.optional) {
                this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
              } else {
                this.emit(`optionEnv:${option.name()}`);
              }
            }
          }
        });
      }
      /**
       * Apply any implied option values, if option is undefined or default value.
       *
       * @private
       */
      _parseOptionsImplied() {
        const dualHelper = new DualOptions(this.options);
        const hasCustomOptionValue = (optionKey) => {
          return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
        };
        this.options.filter(
          (option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(
            this.getOptionValue(option.attributeName()),
            option
          )
        ).forEach((option) => {
          Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
            this.setOptionValueWithSource(
              impliedKey,
              option.implied[impliedKey],
              "implied"
            );
          });
        });
      }
      /**
       * Argument `name` is missing.
       *
       * @param {string} name
       * @private
       */
      missingArgument(name) {
        const message = `error: missing required argument '${name}'`;
        this.error(message, { code: "commander.missingArgument" });
      }
      /**
       * `Option` is missing an argument.
       *
       * @param {Option} option
       * @private
       */
      optionMissingArgument(option) {
        const message = `error: option '${option.flags}' argument missing`;
        this.error(message, { code: "commander.optionMissingArgument" });
      }
      /**
       * `Option` does not have a value, and is a mandatory option.
       *
       * @param {Option} option
       * @private
       */
      missingMandatoryOptionValue(option) {
        const message = `error: required option '${option.flags}' not specified`;
        this.error(message, { code: "commander.missingMandatoryOptionValue" });
      }
      /**
       * `Option` conflicts with another option.
       *
       * @param {Option} option
       * @param {Option} conflictingOption
       * @private
       */
      _conflictingOption(option, conflictingOption) {
        const findBestOptionFromValue = (option2) => {
          const optionKey = option2.attributeName();
          const optionValue = this.getOptionValue(optionKey);
          const negativeOption = this.options.find(
            (target) => target.negate && optionKey === target.attributeName()
          );
          const positiveOption = this.options.find(
            (target) => !target.negate && optionKey === target.attributeName()
          );
          if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) {
            return negativeOption;
          }
          return positiveOption || option2;
        };
        const getErrorMessage = (option2) => {
          const bestOption = findBestOptionFromValue(option2);
          const optionKey = bestOption.attributeName();
          const source = this.getOptionValueSource(optionKey);
          if (source === "env") {
            return `environment variable '${bestOption.envVar}'`;
          }
          return `option '${bestOption.flags}'`;
        };
        const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
        this.error(message, { code: "commander.conflictingOption" });
      }
      /**
       * Unknown option `flag`.
       *
       * @param {string} flag
       * @private
       */
      unknownOption(flag) {
        if (this._allowUnknownOption)
          return;
        let suggestion = "";
        if (flag.startsWith("--") && this._showSuggestionAfterError) {
          let candidateFlags = [];
          let command = this;
          do {
            const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
            candidateFlags = candidateFlags.concat(moreFlags);
            command = command.parent;
          } while (command && !command._enablePositionalOptions);
          suggestion = suggestSimilar(flag, candidateFlags);
        }
        const message = `error: unknown option '${flag}'${suggestion}`;
        this.error(message, { code: "commander.unknownOption" });
      }
      /**
       * Excess arguments, more than expected.
       *
       * @param {string[]} receivedArgs
       * @private
       */
      _excessArguments(receivedArgs) {
        if (this._allowExcessArguments)
          return;
        const expected = this.registeredArguments.length;
        const s = expected === 1 ? "" : "s";
        const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
        const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
        this.error(message, { code: "commander.excessArguments" });
      }
      /**
       * Unknown command.
       *
       * @private
       */
      unknownCommand() {
        const unknownName = this.args[0];
        let suggestion = "";
        if (this._showSuggestionAfterError) {
          const candidateNames = [];
          this.createHelp().visibleCommands(this).forEach((command) => {
            candidateNames.push(command.name());
            if (command.alias())
              candidateNames.push(command.alias());
          });
          suggestion = suggestSimilar(unknownName, candidateNames);
        }
        const message = `error: unknown command '${unknownName}'${suggestion}`;
        this.error(message, { code: "commander.unknownCommand" });
      }
      /**
       * Get or set the program version.
       *
       * This method auto-registers the "-V, --version" option which will print the version number.
       *
       * You can optionally supply the flags and description to override the defaults.
       *
       * @param {string} [str]
       * @param {string} [flags]
       * @param {string} [description]
       * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
       */
      version(str, flags, description) {
        if (str === void 0)
          return this._version;
        this._version = str;
        flags = flags || "-V, --version";
        description = description || "output the version number";
        const versionOption = this.createOption(flags, description);
        this._versionOptionName = versionOption.attributeName();
        this._registerOption(versionOption);
        this.on("option:" + versionOption.name(), () => {
          this._outputConfiguration.writeOut(`${str}
`);
          this._exit(0, "commander.version", str);
        });
        return this;
      }
      /**
       * Set the description.
       *
       * @param {string} [str]
       * @param {object} [argsDescription]
       * @return {(string|Command)}
       */
      description(str, argsDescription) {
        if (str === void 0 && argsDescription === void 0)
          return this._description;
        this._description = str;
        if (argsDescription) {
          this._argsDescription = argsDescription;
        }
        return this;
      }
      /**
       * Set the summary. Used when listed as subcommand of parent.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      summary(str) {
        if (str === void 0)
          return this._summary;
        this._summary = str;
        return this;
      }
      /**
       * Set an alias for the command.
       *
       * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
       *
       * @param {string} [alias]
       * @return {(string|Command)}
       */
      alias(alias) {
        if (alias === void 0)
          return this._aliases[0];
        let command = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command = this.commands[this.commands.length - 1];
        }
        if (alias === command._name)
          throw new Error("Command alias can't be the same as its name");
        const matchingCommand = this.parent?._findCommand(alias);
        if (matchingCommand) {
          const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
          throw new Error(
            `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
          );
        }
        command._aliases.push(alias);
        return this;
      }
      /**
       * Set aliases for the command.
       *
       * Only the first alias is shown in the auto-generated help.
       *
       * @param {string[]} [aliases]
       * @return {(string[]|Command)}
       */
      aliases(aliases) {
        if (aliases === void 0)
          return this._aliases;
        aliases.forEach((alias) => this.alias(alias));
        return this;
      }
      /**
       * Set / get the command usage `str`.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      usage(str) {
        if (str === void 0) {
          if (this._usage)
            return this._usage;
          const args2 = this.registeredArguments.map((arg) => {
            return humanReadableArgName(arg);
          });
          return [].concat(
            this.options.length || this._helpOption !== null ? "[options]" : [],
            this.commands.length ? "[command]" : [],
            this.registeredArguments.length ? args2 : []
          ).join(" ");
        }
        this._usage = str;
        return this;
      }
      /**
       * Get or set the name of the command.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      name(str) {
        if (str === void 0)
          return this._name;
        this._name = str;
        return this;
      }
      /**
       * Set the name of the command from script filename, such as process.argv[1],
       * or require.main.filename, or __filename.
       *
       * (Used internally and public although not documented in README.)
       *
       * @example
       * program.nameFromFilename(require.main.filename);
       *
       * @param {string} filename
       * @return {Command}
       */
      nameFromFilename(filename) {
        this._name = path.basename(filename, path.extname(filename));
        return this;
      }
      /**
       * Get or set the directory for searching for executable subcommands of this command.
       *
       * @example
       * program.executableDir(__dirname);
       * // or
       * program.executableDir('subcommands');
       *
       * @param {string} [path]
       * @return {(string|null|Command)}
       */
      executableDir(path2) {
        if (path2 === void 0)
          return this._executableDir;
        this._executableDir = path2;
        return this;
      }
      /**
       * Return program help documentation.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
       * @return {string}
       */
      helpInformation(contextOptions) {
        const helper = this.createHelp();
        if (helper.helpWidth === void 0) {
          helper.helpWidth = contextOptions && contextOptions.error ? this._outputConfiguration.getErrHelpWidth() : this._outputConfiguration.getOutHelpWidth();
        }
        return helper.formatHelp(this, helper);
      }
      /**
       * @private
       */
      _getHelpContext(contextOptions) {
        contextOptions = contextOptions || {};
        const context = { error: !!contextOptions.error };
        let write;
        if (context.error) {
          write = (arg) => this._outputConfiguration.writeErr(arg);
        } else {
          write = (arg) => this._outputConfiguration.writeOut(arg);
        }
        context.write = contextOptions.write || write;
        context.command = this;
        return context;
      }
      /**
       * Output help information for this command.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      outputHelp(contextOptions) {
        let deprecatedCallback;
        if (typeof contextOptions === "function") {
          deprecatedCallback = contextOptions;
          contextOptions = void 0;
        }
        const context = this._getHelpContext(contextOptions);
        this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", context));
        this.emit("beforeHelp", context);
        let helpInformation = this.helpInformation(context);
        if (deprecatedCallback) {
          helpInformation = deprecatedCallback(helpInformation);
          if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
            throw new Error("outputHelp callback must return a string or a Buffer");
          }
        }
        context.write(helpInformation);
        if (this._getHelpOption()?.long) {
          this.emit(this._getHelpOption().long);
        }
        this.emit("afterHelp", context);
        this._getCommandAndAncestors().forEach(
          (command) => command.emit("afterAllHelp", context)
        );
      }
      /**
       * You can pass in flags and a description to customise the built-in help option.
       * Pass in false to disable the built-in help option.
       *
       * @example
       * program.helpOption('-?, --help' 'show help'); // customise
       * program.helpOption(false); // disable
       *
       * @param {(string | boolean)} flags
       * @param {string} [description]
       * @return {Command} `this` command for chaining
       */
      helpOption(flags, description) {
        if (typeof flags === "boolean") {
          if (flags) {
            this._helpOption = this._helpOption ?? void 0;
          } else {
            this._helpOption = null;
          }
          return this;
        }
        flags = flags ?? "-h, --help";
        description = description ?? "display help for command";
        this._helpOption = this.createOption(flags, description);
        return this;
      }
      /**
       * Lazy create help option.
       * Returns null if has been disabled with .helpOption(false).
       *
       * @returns {(Option | null)} the help option
       * @package
       */
      _getHelpOption() {
        if (this._helpOption === void 0) {
          this.helpOption(void 0, void 0);
        }
        return this._helpOption;
      }
      /**
       * Supply your own option to use for the built-in help option.
       * This is an alternative to using helpOption() to customise the flags and description etc.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addHelpOption(option) {
        this._helpOption = option;
        return this;
      }
      /**
       * Output help information and exit.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      help(contextOptions) {
        this.outputHelp(contextOptions);
        let exitCode = process2.exitCode || 0;
        if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
          exitCode = 1;
        }
        this._exit(exitCode, "commander.help", "(outputHelp)");
      }
      /**
       * Add additional text to be displayed with the built-in help.
       *
       * Position is 'before' or 'after' to affect just this command,
       * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
       *
       * @param {string} position - before or after built-in help
       * @param {(string | Function)} text - string to add, or a function returning a string
       * @return {Command} `this` command for chaining
       */
      addHelpText(position, text) {
        const allowedValues = ["beforeAll", "before", "after", "afterAll"];
        if (!allowedValues.includes(position)) {
          throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        const helpEvent = `${position}Help`;
        this.on(helpEvent, (context) => {
          let helpStr;
          if (typeof text === "function") {
            helpStr = text({ error: context.error, command: context.command });
          } else {
            helpStr = text;
          }
          if (helpStr) {
            context.write(`${helpStr}
`);
          }
        });
        return this;
      }
      /**
       * Output help information if help flags specified
       *
       * @param {Array} args - array of options to search for help flags
       * @private
       */
      _outputHelpIfRequested(args2) {
        const helpOption = this._getHelpOption();
        const helpRequested = helpOption && args2.find((arg) => helpOption.is(arg));
        if (helpRequested) {
          this.outputHelp();
          this._exit(0, "commander.helpDisplayed", "(outputHelp)");
        }
      }
    };
    function incrementNodeInspectorPort(args2) {
      return args2.map((arg) => {
        if (!arg.startsWith("--inspect")) {
          return arg;
        }
        let debugOption;
        let debugHost = "127.0.0.1";
        let debugPort = "9229";
        let match;
        if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
          debugOption = match[1];
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
          debugOption = match[1];
          if (/^\d+$/.test(match[3])) {
            debugPort = match[3];
          } else {
            debugHost = match[3];
          }
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
          debugOption = match[1];
          debugHost = match[3];
          debugPort = match[4];
        }
        if (debugOption && debugPort !== "0") {
          return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
        }
        return arg;
      });
    }
    exports2.Command = Command2;
  }
});

// node_modules/commander/index.js
var require_commander = __commonJS({
  "node_modules/commander/index.js"(exports2) {
    var { Argument: Argument2 } = require_argument();
    var { Command: Command2 } = require_command();
    var { CommanderError: CommanderError2, InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2 } = require_option();
    exports2.program = new Command2();
    exports2.createCommand = (name) => new Command2(name);
    exports2.createOption = (flags, description) => new Option2(flags, description);
    exports2.createArgument = (name, description) => new Argument2(name, description);
    exports2.Command = Command2;
    exports2.Option = Option2;
    exports2.Argument = Argument2;
    exports2.Help = Help2;
    exports2.CommanderError = CommanderError2;
    exports2.InvalidArgumentError = InvalidArgumentError2;
    exports2.InvalidOptionArgumentError = InvalidArgumentError2;
  }
});

// mock-electron:electron
var electron_exports = {};
__export(electron_exports, {
  app: () => app,
  default: () => electron_default
});
var app, electron_default;
var init_electron = __esm({
  "mock-electron:electron"() {
    app = null;
    electron_default = { app: null };
  }
});

// node_modules/commander/esm.mjs
var import_index = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  // deprecated old name
  Command,
  Argument,
  Option,
  Help
} = import_index.default;

// src/cli/index.ts
var import_node_fs4 = require("node:fs");
var import_node_path7 = require("node:path");
var import_node_os4 = require("node:os");

// src/cli/commands/archive.ts
var import_promises4 = require("node:fs/promises");
var import_node_path6 = require("node:path");

// src/main/services/archival/archival.service.ts
var import_node_child_process6 = require("node:child_process");
var import_node_crypto = require("node:crypto");
var import_promises2 = require("node:fs/promises");
var import_node_path4 = require("node:path");

// src/main/utils/logger.ts
var Logger = class {
  constructor(scope) {
    this.scope = scope;
  }
  write(level, message, meta) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
    console[level](`[${timestamp}] [${this.scope}] ${message}${suffix}`);
  }
  debug(message, meta) {
    this.write("debug", message, meta);
  }
  info(message, meta) {
    this.write("info", message, meta);
  }
  warn(message, meta) {
    this.write("warn", message, meta);
  }
  error(message, meta) {
    this.write("error", message, meta);
  }
};

// src/main/utils/binary.ts
var import_node_path = require("node:path");
var import_node_fs = require("node:fs");
var import_node_child_process = require("node:child_process");
var import_meta = {};
function getCurrentDir() {
  if (typeof __dirname !== "undefined") {
    return __dirname;
  }
  try {
    const { fileURLToPath } = require("node:url");
    return (0, import_node_path.dirname)(fileURLToPath(import_meta.url));
  } catch {
    return process.cwd();
  }
}
function isElectron() {
  if (true)
    return false;
  return typeof process !== "undefined" && process.versions != null && process.versions.electron != null;
}
var cachedApp = void 0;
function getElectronApp() {
  if (cachedApp !== void 0)
    return cachedApp;
  if (!isElectron()) {
    cachedApp = null;
    return null;
  }
  try {
    const { app: app2 } = (init_electron(), __toCommonJS(electron_exports));
    cachedApp = app2;
    return app2;
  } catch {
    cachedApp = null;
    return null;
  }
}
function getResourcesPath() {
  const app2 = getElectronApp();
  if (app2) {
    return app2.isPackaged ? process.resourcesPath : (0, import_node_path.join)(app2.getAppPath(), "resources");
  }
  const possiblePaths = [
    (0, import_node_path.join)(process.cwd(), "resources"),
    (0, import_node_path.join)(getCurrentDir(), "..", "..", "..", "resources")
  ];
  for (const p of possiblePaths) {
    if ((0, import_node_fs.existsSync)(p))
      return p;
  }
  return (0, import_node_path.join)(process.cwd(), "resources");
}
function platformDir() {
  if (process.platform === "darwin") {
    return "darwin";
  }
  if (process.platform === "win32") {
    return "win32";
  }
  return "linux";
}
function findInSystemPath(name) {
  if (process.platform === "win32") {
    return null;
  }
  try {
    const result = (0, import_node_child_process.execSync)(`which ${name}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    const path = result.trim();
    if (path && (0, import_node_fs.existsSync)(path)) {
      return path;
    }
  } catch {
  }
  const commonPaths = [
    `/usr/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/opt/homebrew/bin/${name}`,
    // macOS Homebrew ARM
    `/home/linuxbrew/.linuxbrew/bin/${name}`
    // Linux Homebrew
  ];
  for (const path of commonPaths) {
    if ((0, import_node_fs.existsSync)(path)) {
      return path;
    }
  }
  return null;
}
function resolveBundledBinary(name) {
  const resourcesPath = getResourcesPath();
  const binaryName = process.platform === "win32" ? `${name}.exe` : name;
  const bundledPath = (0, import_node_path.join)(resourcesPath, "bin", platformDir(), binaryName);
  if ((0, import_node_fs.existsSync)(bundledPath)) {
    return bundledPath;
  }
  if (process.platform !== "win32") {
    const systemPath = findInSystemPath(name);
    if (systemPath) {
      return systemPath;
    }
  }
  return bundledPath;
}
function isBinaryAvailable(name) {
  const path = resolveBundledBinary(name);
  return (0, import_node_fs.existsSync)(path);
}
function detectFasterWhisper() {
  const cliTools = [
    "faster-whisper",
    // Main CLI (from faster-whisper package with CLI extras)
    "whisper-ctranslate2"
    // Alternative CLI that uses faster-whisper
  ];
  for (const tool of cliTools) {
    try {
      (0, import_node_child_process.execSync)(`${tool} --help`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
      return { available: true, command: [tool] };
    } catch {
    }
  }
  return { available: false, command: [] };
}
function detectBestWhisperBackend() {
  const whisperCppAvailable = isBinaryAvailable("whisper");
  const fasterWhisper = detectFasterWhisper();
  if (process.platform === "linux") {
    if (fasterWhisper.available) {
      return {
        backend: "faster-whisper",
        reason: "faster-whisper provides better CPU performance on Linux",
        command: fasterWhisper.command
      };
    }
    if (whisperCppAvailable) {
      return {
        backend: "whisper.cpp",
        reason: "whisper.cpp is available (consider installing faster-whisper for better performance)",
        command: void 0
      };
    }
    return {
      backend: "none",
      reason: "No whisper backend available. Install faster-whisper: pip install faster-whisper"
    };
  }
  if (process.platform === "darwin") {
    if (whisperCppAvailable) {
      return {
        backend: "whisper.cpp",
        reason: "whisper.cpp with Metal GPU acceleration",
        command: void 0
      };
    }
    if (fasterWhisper.available) {
      return {
        backend: "faster-whisper",
        reason: "faster-whisper (whisper.cpp not available)",
        command: fasterWhisper.command
      };
    }
    return {
      backend: "none",
      reason: "No whisper backend available"
    };
  }
  if (whisperCppAvailable) {
    return {
      backend: "whisper.cpp",
      reason: "whisper.cpp",
      command: void 0
    };
  }
  if (fasterWhisper.available) {
    return {
      backend: "faster-whisper",
      reason: "faster-whisper (whisper.cpp not available)",
      command: fasterWhisper.command
    };
  }
  return {
    backend: "none",
    reason: "No whisper backend available"
  };
}

// src/main/services/library/metadata.service.ts
var import_node_child_process2 = require("node:child_process");
var import_node_fs2 = require("node:fs");
var MetadataService = class {
  constructor() {
    this.logger = new Logger("MetadataService");
  }
  async extract(request) {
    this.logger.info("metadata extraction requested", { file: request.filePath });
    const binaryPath = resolveBundledBinary("ffprobe");
    const args2 = ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", request.filePath];
    const raw = await new Promise((resolve, reject) => {
      const child = (0, import_node_child_process2.spawn)(binaryPath, args2, { stdio: "pipe" });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        reject(error);
      });
      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `ffprobe exited with code ${code ?? "unknown"}`));
        }
      });
    });
    const parsed = JSON.parse(raw);
    const format = parsed.format ?? {};
    const streams = parsed.streams ?? [];
    const videoStream = streams.find((stream) => stream.codec_type === "video");
    const duration = this.parseFloatOrNull(format.duration);
    const bitrate = this.parseIntOrNull(format.bit_rate);
    const container = format.format_name ? format.format_name.split(",")[0] : null;
    const fileSize = this.parseIntOrNull(format.size) ?? this.statSize(request.filePath);
    return {
      duration,
      width: videoStream?.width ?? null,
      height: videoStream?.height ?? null,
      fps: this.parseFps(videoStream?.avg_frame_rate ?? videoStream?.r_frame_rate),
      codec: videoStream?.codec_name ?? null,
      container,
      bitrate,
      fileSize
    };
  }
  parseFloatOrNull(value) {
    if (!value) {
      return null;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  parseIntOrNull(value) {
    if (!value) {
      return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  parseFps(value) {
    if (!value) {
      return null;
    }
    const [num, den] = value.split("/").map((part) => Number.parseFloat(part));
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) {
      return null;
    }
    return num / den;
  }
  statSize(filePath) {
    try {
      return (0, import_node_fs2.statSync)(filePath).size;
    } catch {
      return null;
    }
  }
};

// src/main/services/transcription/whisper.service.ts
var import_node_child_process3 = require("node:child_process");
var import_node_fs3 = require("node:fs");
var import_node_path2 = require("node:path");
var WhisperService = class {
  constructor() {
    this.logger = new Logger("WhisperService");
    this.cachedBackend = null;
  }
  /**
   * Get the best available whisper backend for this platform
   */
  getBackend() {
    if (!this.cachedBackend) {
      this.cachedBackend = detectBestWhisperBackend();
      this.logger.info("detected whisper backend", {
        backend: this.cachedBackend.backend,
        reason: this.cachedBackend.reason
      });
    }
    return this.cachedBackend;
  }
  /**
   * Check if any whisper backend is available
   */
  isAvailable() {
    return this.getBackend().backend !== "none";
  }
  async transcribe(request) {
    const backend = this.getBackend();
    this.logger.info("transcription requested", {
      audio: request.audioPath,
      backend: backend.backend,
      useGpu: request.useGpu ?? "default"
    });
    if (backend.backend === "none") {
      throw new Error(`No whisper backend available. ${backend.reason}`);
    }
    if (backend.backend === "faster-whisper") {
      return this.transcribeWithFasterWhisper(request, backend.command);
    }
    return this.transcribeWithWhisperCpp(request);
  }
  /**
   * Transcribe using whisper.cpp binary
   */
  async transcribeWithWhisperCpp(request) {
    const binaryPath = resolveBundledBinary("whisper");
    const outputDir = request.outputDir ?? (0, import_node_path2.dirname)(request.audioPath);
    const baseName = (0, import_node_path2.parse)(request.audioPath).name;
    const outputPrefix = (0, import_node_path2.join)(outputDir, baseName);
    const outputPath = `${outputPrefix}.txt`;
    try {
      (0, import_node_fs3.accessSync)(binaryPath, import_node_fs3.constants.X_OK);
    } catch {
      throw new Error(`whisper not executable at ${binaryPath}`);
    }
    (0, import_node_fs3.mkdirSync)(outputDir, { recursive: true });
    await this.runProcess(
      binaryPath,
      this.buildWhisperCppArgs(request, outputPrefix),
      request.signal,
      request.onLog
    );
    if (!(0, import_node_fs3.existsSync)(outputPath)) {
      throw new Error(`Transcription completed but output file not found: ${outputPath}`);
    }
    const transcript = (0, import_node_fs3.readFileSync)(outputPath, "utf-8");
    return { transcript, outputPath };
  }
  /**
   * Transcribe using faster-whisper (Python-based)
   */
  async transcribeWithFasterWhisper(request, command) {
    if (command.length === 0) {
      throw new Error("faster-whisper command not configured");
    }
    const outputDir = request.outputDir ?? (0, import_node_path2.dirname)(request.audioPath);
    const baseName = (0, import_node_path2.parse)(request.audioPath).name;
    const outputPath = (0, import_node_path2.join)(outputDir, `${baseName}.txt`);
    (0, import_node_fs3.mkdirSync)(outputDir, { recursive: true });
    const modelArg = this.resolveModelForFasterWhisper(request.modelPath, request.modelSize);
    const [cmd, ...baseArgs] = command;
    const args2 = [
      ...baseArgs,
      request.audioPath,
      "--model",
      modelArg,
      "--output_dir",
      outputDir,
      "--output_format",
      "txt"
    ];
    if (request.language) {
      args2.push("--language", request.language);
    }
    if (request.useGpu === false) {
      args2.push("--device", "cpu");
    }
    await this.runProcess(cmd, args2, request.signal, request.onLog);
    if (!(0, import_node_fs3.existsSync)(outputPath)) {
      throw new Error(`Transcription completed but output file not found: ${outputPath}`);
    }
    const transcript = (0, import_node_fs3.readFileSync)(outputPath, "utf-8");
    return { transcript, outputPath };
  }
  /**
   * Build arguments for whisper.cpp
   */
  buildWhisperCppArgs(request, outputPrefix) {
    const args2 = [
      "-m",
      request.modelPath,
      "-f",
      request.audioPath,
      "-otxt",
      "-ovtt",
      "-of",
      outputPrefix
    ];
    if (request.language) {
      args2.push("-l", request.language);
    }
    if (request.useGpu === false) {
      args2.push("-ng");
    }
    return args2;
  }
  /**
   * Resolve model argument for faster-whisper
   * Can be a model size name (tiny, base, small, medium, large-v3) or a path
   */
  resolveModelForFasterWhisper(modelPath, modelSize) {
    if (modelSize) {
      return modelSize;
    }
    const modelName = (0, import_node_path2.basename)(modelPath).toLowerCase();
    const sizePatterns = [
      { pattern: /large-v3/i, size: "large-v3" },
      { pattern: /large-v2/i, size: "large-v2" },
      { pattern: /large/i, size: "large" },
      { pattern: /medium/i, size: "medium" },
      { pattern: /small/i, size: "small" },
      { pattern: /base/i, size: "base" },
      { pattern: /tiny/i, size: "tiny" }
    ];
    for (const { pattern, size } of sizePatterns) {
      if (pattern.test(modelName)) {
        this.logger.info(`inferred model size '${size}' from path`);
        return size;
      }
    }
    if ((0, import_node_fs3.existsSync)(modelPath)) {
      return modelPath;
    }
    this.logger.warn("could not infer model size, defaulting to base");
    return "base";
  }
  /**
   * Run a process with abort signal support
   */
  async runProcess(command, args2, signal, onLog) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        const error = new Error("canceled");
        error.name = "AbortError";
        reject(error);
        return;
      }
      const child = (0, import_node_child_process3.spawn)(command, args2, { stdio: "pipe" });
      let stderr = "";
      let settled = false;
      const finalize = (error) => {
        if (settled)
          return;
        settled = true;
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };
      const onAbort = () => {
        child.kill();
        const error = new Error("canceled");
        error.name = "AbortError";
        finalize(error);
      };
      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }
      child.stdout?.on("data", (chunk) => {
        const text = chunk.toString();
        onLog?.(text);
      });
      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        onLog?.(text);
        stderr += text;
        if (stderr.length > 8e3) {
          stderr = stderr.slice(-8e3);
        }
      });
      child.on("error", (error) => {
        finalize(error);
      });
      child.on("close", (code) => {
        if (code === 0) {
          finalize();
        } else {
          finalize(new Error(stderr || `process exited with code ${code ?? "unknown"}`));
        }
      });
    });
  }
};

// src/shared/types/archival.types.ts
var ARCHIVAL_CRF_DEFAULTS = {
  hdr: {
    "4k": 29,
    // Ultra-safe: 28, aggressive: 30 max
    "1440p": 28,
    // aggressive: 29 max
    "1080p": 28,
    // default 28, aggressive: 29 max
    "720p": 27,
    // aggressive: 28 max
    "480p": 27,
    "360p": 27
  },
  sdr: {
    "4k": 30,
    // aggressive: 31 max
    "1440p": 31,
    // aggressive: 32 max
    "1080p": 29,
    // aggressive: 31-32 max
    "720p": 32,
    // default 32, aggressive: 34 max
    "480p": 34,
    // default 34
    "360p": 36
    // default 36, aggressive: 37 max
  }
};
var BITRATE_THRESHOLDS = {
  "4k": { low: 8e6, medium: 15e6 },
  // 8 Mbps / 15 Mbps
  "1440p": { low: 4e6, medium: 8e6 },
  // 4 Mbps / 8 Mbps
  "1080p": { low: 25e5, medium: 5e6 },
  // 2.5 Mbps / 5 Mbps
  "720p": { low: 15e5, medium: 3e6 },
  // 1.5 Mbps / 3 Mbps
  "480p": { low: 8e5, medium: 15e5 },
  // 800 kbps / 1.5 Mbps
  "360p": { low: 4e5, medium: 8e5 }
  // 400 kbps / 800 kbps
};
function getBitrateAdjustedCrf(sourceInfo, baseCrf) {
  if (!sourceInfo.bitrate || sourceInfo.bitrate <= 0) {
    return { adjustedCrf: baseCrf, adjustment: 0 };
  }
  const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
  if (resolution === "source") {
    return { adjustedCrf: baseCrf, adjustment: 0 };
  }
  const thresholds = BITRATE_THRESHOLDS[resolution];
  if (!thresholds) {
    return { adjustedCrf: baseCrf, adjustment: 0 };
  }
  const bitrateMbps = (sourceInfo.bitrate / 1e6).toFixed(1);
  if (sourceInfo.bitrate < thresholds.low) {
    const adjustment = 3;
    return {
      adjustedCrf: Math.min(baseCrf + adjustment, 45),
      // Cap at CRF 45
      adjustment,
      reason: `Low bitrate source (${bitrateMbps} Mbps) - raising CRF to avoid over-compression`
    };
  }
  if (sourceInfo.bitrate < thresholds.medium) {
    const adjustment = 1;
    return {
      adjustedCrf: Math.min(baseCrf + adjustment, 45),
      adjustment,
      reason: `Moderate bitrate source (${bitrateMbps} Mbps) - slight CRF adjustment`
    };
  }
  return { adjustedCrf: baseCrf, adjustment: 0 };
}
var DEFAULT_ARCHIVAL_CONFIG = {
  resolution: "source",
  colorMode: "auto",
  codec: "av1",
  // Default to AV1 for best compression
  av1: {
    encoder: "libsvtav1",
    // Faster than libaom with excellent quality
    preset: 6,
    // SVT-AV1: 0-13, lower=slower/better. 6 is balanced
    keyframeInterval: 240,
    // ~8-10 seconds at 24-30fps
    sceneChangeDetection: true,
    // CRITICAL: prevents GOP crossing scene cuts
    filmGrainSynthesis: 10,
    // Helps with noisy footage, disable for screen recordings
    tune: 0,
    // VQ (visual quality) - best for archival viewing
    adaptiveQuantization: true,
    // Better detail in complex areas
    crf: 30,
    // Will be auto-adjusted based on resolution/HDR
    twoPass: false
    // Single-pass by default for faster encoding
  },
  h265: {
    encoder: "libx265",
    preset: "medium",
    // Balanced speed/quality for web delivery
    crf: 23,
    // Visually transparent for most content
    keyframeInterval: 250,
    // ~10 seconds, good for streaming
    bframes: 4,
    // Standard B-frame count for good compression
    twoPass: false
    // Single-pass by default for faster encoding
  },
  audioCopy: true,
  // Preserve original audio losslessly
  audioCodec: "aac",
  // AAC is best for H.265/MP4 web delivery
  audioBitrate: 160,
  // 160kbps for music, 128k for speech
  container: "mkv",
  // Best for AV1 + various audio formats
  preserveStructure: false,
  overwriteExisting: false,
  fillMode: false,
  deleteOriginal: false,
  // Safety: never auto-delete originals
  deleteOutputIfLarger: true,
  // Smart: delete output if it's larger than original
  extractThumbnail: false,
  // Disabled by default
  extractCaptions: false,
  // Disabled by default - uses Whisper for transcription
  threadLimit: 0
  // Use all available threads by default
};
var ARCHIVAL_PRESETS = {
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
      preset: "medium",
      crf: 23,
      twoPass: false
    }
  },
  // Maximum compression: Slower but smaller files (~3-5% smaller)
  "max-compression": {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 4,
      // Slower, better compression
      filmGrainSynthesis: 12,
      // More aggressive grain synthesis
      twoPass: false
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265,
      preset: "slow",
      // Slower for better compression
      crf: 24,
      // Slightly higher CRF for smaller files
      twoPass: false
    }
  },
  // Fast: Faster encoding, slightly larger files
  fast: {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 8,
      // Faster
      filmGrainSynthesis: 8,
      twoPass: false
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265,
      preset: "fast",
      // Faster encoding
      crf: 22,
      // Lower CRF to compensate for speed
      twoPass: false
    }
  }
};
function getResolutionCategory(width, height) {
  const pixels = Math.max(width, height);
  if (pixels >= 3840)
    return "4k";
  if (pixels >= 2560)
    return "1440p";
  if (pixels >= 1920)
    return "1080p";
  if (pixels >= 1280)
    return "720p";
  if (pixels >= 854)
    return "480p";
  return "360p";
}
function getOptimalCrf(sourceInfo, customMatrix, enableBitrateAdjustment = true) {
  const matrix = { ...ARCHIVAL_CRF_DEFAULTS, ...customMatrix };
  const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
  const lookupResolution = resolution === "source" ? "1080p" : resolution;
  let baseCrf;
  if (sourceInfo.isHdr) {
    baseCrf = matrix.hdr[lookupResolution] ?? matrix.hdr["1080p"];
  } else {
    baseCrf = matrix.sdr[lookupResolution] ?? matrix.sdr["1080p"];
  }
  if (enableBitrateAdjustment && sourceInfo.bitrate) {
    const { adjustedCrf } = getBitrateAdjustedCrf(sourceInfo, baseCrf);
    return adjustedCrf;
  }
  return baseCrf;
}
function detectHdr(colorSpace, hdrFormat, bitDepth) {
  if (hdrFormat) {
    const hdrFormats = ["hdr10", "hdr10+", "hlg", "dolby vision", "dv", "pq"];
    if (hdrFormats.some((fmt) => hdrFormat.toLowerCase().includes(fmt))) {
      return true;
    }
  }
  if (colorSpace) {
    const hdrColorSpaces = ["bt2020", "rec2020", "smpte2084", "arib-std-b67"];
    if (hdrColorSpaces.some((cs) => colorSpace.toLowerCase().includes(cs))) {
      return true;
    }
  }
  if (bitDepth && bitDepth >= 10 && colorSpace?.toLowerCase().includes("2020")) {
    return true;
  }
  return false;
}
function classifyError(errorMessage) {
  const lower = errorMessage.toLowerCase();
  if (lower.includes("no space left") || lower.includes("disk full") || lower.includes("not enough space") || lower.includes("enospc")) {
    return "disk_full";
  }
  if (lower.includes("permission denied") || lower.includes("access denied") || lower.includes("eacces") || lower.includes("eperm")) {
    return "permission_denied";
  }
  if (lower.includes("no such file") || lower.includes("file not found") || lower.includes("enoent") || lower.includes("does not exist")) {
    return "file_not_found";
  }
  if (lower.includes("decoder") || lower.includes("codec not found") || lower.includes("unsupported codec") || lower.includes("unknown encoder")) {
    return "codec_unsupported";
  }
  if (lower.includes("invalid data") || lower.includes("corrupt") || lower.includes("moov atom not found") || lower.includes("invalid nal unit")) {
    return "corrupt_input";
  }
  if (lower.includes("encoder") || lower.includes("encoding") || lower.includes("svtav1") || lower.includes("libaom")) {
    return "encoder_error";
  }
  if (lower.includes("cancel") || lower.includes("abort") || lower.includes("killed")) {
    return "cancelled";
  }
  return "unknown";
}
function formatEta(seconds) {
  if (!isFinite(seconds) || seconds < 0)
    return "--";
  if (seconds < 60)
    return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins2 = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins2}m ${secs}s` : `${mins2}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round(seconds % 3600 / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
function formatSpeed(speed) {
  if (!isFinite(speed) || speed <= 0)
    return "--";
  return `${speed.toFixed(1)}x`;
}

// src/main/services/archival/archival-command-builder.ts
function getH265Level(width, height) {
  const lumaSamples = width * height;
  if (lumaSamples > 8912896) {
    return 62;
  } else if (lumaSamples > 2228224) {
    return 51;
  } else if (lumaSamples > 983040) {
    return 41;
  }
  return 40;
}
function buildArchivalFFmpegArgs(inputPath, outputPath, config2, sourceInfo, cpuCapabilities) {
  if (config2.codec === "h265") {
    return buildH265FFmpegArgs(inputPath, outputPath, config2, sourceInfo, cpuCapabilities);
  }
  return buildAv1FFmpegArgs(inputPath, outputPath, config2, sourceInfo);
}
function isTwoPassEnabled(config2) {
  if (config2.codec === "h265") {
    return config2.h265.twoPass === true;
  }
  if (config2.av1.encoder === "libaom-av1") {
    return config2.av1.twoPass === true;
  }
  return false;
}
function buildTwoPassArgs(inputPath, outputPath, config2, sourceInfo, passLogDir, cpuCapabilities) {
  const { basename: basename5, join: join8 } = require("node:path");
  const inputName = basename5(inputPath, require("node:path").extname(inputPath));
  const passLogFile = join8(passLogDir, `${inputName}-pass`);
  if (config2.codec === "h265") {
    return buildH265TwoPassArgs(inputPath, outputPath, config2, sourceInfo, passLogFile, cpuCapabilities);
  }
  return buildAv1TwoPassArgs(inputPath, outputPath, config2, sourceInfo, passLogFile);
}
function buildAv1TwoPassArgs(inputPath, outputPath, config2, sourceInfo, passLogFile) {
  const options = config2.av1;
  const encoder = options.encoder;
  const effectiveCrf = options.crf !== 30 ? options.crf : getOptimalCrf(sourceInfo);
  const pass1 = [];
  pass1.push("-i", inputPath);
  if (config2.threadLimit > 0) {
    pass1.push("-threads", String(config2.threadLimit));
  }
  pass1.push("-c:v", encoder);
  pass1.push("-crf", effectiveCrf.toString());
  if (encoder === "libaom-av1") {
    pass1.push("-cpu-used", options.preset.toString());
    pass1.push(...buildLibaomParams(options, sourceInfo));
    pass1.push("-pass", "1");
    pass1.push("-passlogfile", passLogFile);
  }
  if (sourceInfo.isHdr) {
    pass1.push(...buildHdrArgs(sourceInfo));
  } else {
    pass1.push("-pix_fmt", "yuv420p");
  }
  pass1.push("-an");
  pass1.push("-f", "null");
  pass1.push("-y");
  pass1.push(process.platform === "win32" ? "NUL" : "/dev/null");
  const pass2 = [];
  pass2.push("-i", inputPath);
  if (config2.threadLimit > 0) {
    pass2.push("-threads", String(config2.threadLimit));
  }
  pass2.push("-c:v", encoder);
  pass2.push("-crf", effectiveCrf.toString());
  if (encoder === "libaom-av1") {
    pass2.push("-cpu-used", options.preset.toString());
    pass2.push(...buildLibaomParams(options, sourceInfo));
    pass2.push("-pass", "2");
    pass2.push("-passlogfile", passLogFile);
  }
  if (sourceInfo.isHdr) {
    pass2.push(...buildHdrArgs(sourceInfo));
  } else {
    pass2.push("-pix_fmt", "yuv420p");
  }
  const needsWebmAudioReencode = config2.container === "webm" && config2.audioCopy && !isWebmCompatibleAudio(sourceInfo.audioCodec);
  const needsMp4AudioReencode = config2.container === "mp4" && config2.audioCopy && isPcmAudio(sourceInfo.audioCodec);
  if (needsWebmAudioReencode) {
    pass2.push("-c:a", "libopus");
    pass2.push("-b:a", `${config2.audioBitrate ?? 128}k`);
    pass2.push("-ar", "48000");
  } else if (needsMp4AudioReencode) {
    pass2.push("-c:a", "aac");
    pass2.push("-b:a", `${config2.audioBitrate ?? 192}k`);
  } else if (config2.audioCopy) {
    pass2.push("-c:a", "copy");
  } else {
    pass2.push(...buildAudioArgs(config2));
  }
  pass2.push("-map", "0:v:0");
  pass2.push("-map", "0:a?");
  if (config2.container === "mp4") {
    pass2.push("-movflags", "+faststart");
  }
  pass2.push("-y");
  pass2.push(outputPath);
  return { pass1, pass2, passLogFile };
}
function buildH265TwoPassArgs(inputPath, outputPath, config2, sourceInfo, passLogFile, cpuCapabilities) {
  const options = config2.h265;
  const pass1 = [];
  pass1.push("-i", inputPath);
  if (config2.threadLimit > 0) {
    pass1.push("-threads", String(config2.threadLimit));
  }
  pass1.push("-c:v", options.encoder);
  pass1.push("-crf", options.crf.toString());
  pass1.push("-preset", options.preset);
  const x265ParamsPass1 = buildX265ParamsWithPass(options, sourceInfo, 1, passLogFile, cpuCapabilities);
  if (x265ParamsPass1) {
    pass1.push("-x265-params", x265ParamsPass1);
  }
  if (options.tune) {
    pass1.push("-tune", options.tune);
  }
  if (sourceInfo.isHdr) {
    pass1.push(...buildHdrArgsH265(sourceInfo));
  } else {
    pass1.push("-pix_fmt", "yuv420p");
  }
  pass1.push("-an");
  pass1.push("-f", "null");
  pass1.push("-y");
  pass1.push(process.platform === "win32" ? "NUL" : "/dev/null");
  const pass2 = [];
  pass2.push("-i", inputPath);
  if (config2.threadLimit > 0) {
    pass2.push("-threads", String(config2.threadLimit));
  }
  pass2.push("-c:v", options.encoder);
  pass2.push("-crf", options.crf.toString());
  pass2.push("-preset", options.preset);
  const x265ParamsPass2 = buildX265ParamsWithPass(options, sourceInfo, 2, passLogFile, cpuCapabilities);
  if (x265ParamsPass2) {
    pass2.push("-x265-params", x265ParamsPass2);
  }
  if (options.tune) {
    pass2.push("-tune", options.tune);
  }
  if (sourceInfo.isHdr) {
    pass2.push(...buildHdrArgsH265(sourceInfo));
  } else {
    pass2.push("-pix_fmt", "yuv420p");
  }
  const needsMp4AudioReencode = config2.container === "mp4" && config2.audioCopy && isPcmAudio(sourceInfo.audioCodec);
  if (needsMp4AudioReencode) {
    pass2.push("-c:a", "aac");
    pass2.push("-b:a", `${config2.audioBitrate ?? 192}k`);
  } else if (config2.audioCopy) {
    pass2.push("-c:a", "copy");
  } else {
    pass2.push(...buildAudioArgs(config2));
  }
  pass2.push("-map", "0:v:0");
  pass2.push("-map", "0:a?");
  if (config2.container === "mp4") {
    pass2.push("-movflags", "+faststart");
    pass2.push("-tag:v", "hvc1");
  }
  pass2.push("-y");
  pass2.push(outputPath);
  return { pass1, pass2, passLogFile };
}
function buildX265ParamsWithPass(options, sourceInfo, passNumber, statsFile, cpuCapabilities) {
  const params = [];
  params.push(`pass=${passNumber}`);
  params.push(`stats=${statsFile}.log`);
  const vbvMaxrate = estimateVbvMaxrate(sourceInfo.width, sourceInfo.height, sourceInfo.frameRate);
  params.push(`vbv-maxrate=${vbvMaxrate}`);
  params.push(`vbv-bufsize=${vbvMaxrate * 2}`);
  params.push(`keyint=${options.keyframeInterval}`);
  params.push(`min-keyint=${Math.min(options.keyframeInterval, 25)}`);
  params.push(`bframes=${options.bframes}`);
  params.push("scenecut=40");
  params.push("ref=4");
  params.push("rc-lookahead=40");
  params.push("sao=1");
  if (sourceInfo.isHdr) {
    params.push("hdr10=1");
    params.push("hdr10-opt=1");
    const masterDisplayStr = buildMasterDisplayString(sourceInfo.masteringDisplay);
    if (masterDisplayStr) {
      params.push(`master-display=${masterDisplayStr}`);
    }
    const maxCllStr = buildMaxCllString(sourceInfo.contentLightLevel);
    if (maxCllStr) {
      params.push(`max-cll=${maxCllStr}`);
    }
  }
  params.push("aq-mode=3");
  const level = getH265Level(sourceInfo.width, sourceInfo.height);
  params.push(`level-idc=${level}`);
  if (cpuCapabilities?.avx512) {
    params.push("asm=avx512");
  }
  return params.join(":");
}
function estimateVbvMaxrate(width, height, frameRate) {
  const pixels = width * height;
  const fps = frameRate || 30;
  let baseBitrate;
  if (pixels >= 3840 * 2160) {
    baseBitrate = 4e4;
  } else if (pixels >= 2560 * 1440) {
    baseBitrate = 2e4;
  } else if (pixels >= 1920 * 1080) {
    baseBitrate = 12e3;
  } else if (pixels >= 1280 * 720) {
    baseBitrate = 8e3;
  } else {
    baseBitrate = 4e3;
  }
  if (fps > 30) {
    baseBitrate = Math.round(baseBitrate * (fps / 30));
  }
  return baseBitrate;
}
function buildAv1FFmpegArgs(inputPath, outputPath, config2, sourceInfo) {
  const args2 = [];
  args2.push("-i", inputPath);
  if (config2.threadLimit > 0) {
    args2.push("-threads", String(config2.threadLimit));
  }
  const encoder = config2.av1.encoder;
  args2.push("-c:v", encoder);
  const effectiveCrf = config2.av1.crf !== 30 ? config2.av1.crf : getOptimalCrf(sourceInfo);
  args2.push("-crf", effectiveCrf.toString());
  if (encoder === "libsvtav1") {
    args2.push("-preset", config2.av1.preset.toString());
    const svtParams = buildSvtAv1Params(config2.av1, sourceInfo);
    if (svtParams) {
      args2.push("-svtav1-params", svtParams);
    }
  } else {
    args2.push("-cpu-used", config2.av1.preset.toString());
    args2.push(...buildLibaomParams(config2.av1, sourceInfo));
  }
  if (sourceInfo.isHdr) {
    args2.push(...buildHdrArgs(sourceInfo));
  } else {
    args2.push("-pix_fmt", "yuv420p");
  }
  const needsWebmAudioReencode = config2.container === "webm" && config2.audioCopy && !isWebmCompatibleAudio(sourceInfo.audioCodec);
  const needsMp4AudioReencode = config2.container === "mp4" && config2.audioCopy && isPcmAudio(sourceInfo.audioCodec);
  if (needsWebmAudioReencode) {
    args2.push("-c:a", "libopus");
    args2.push("-b:a", `${config2.audioBitrate ?? 128}k`);
    args2.push("-ar", "48000");
  } else if (needsMp4AudioReencode) {
    args2.push("-c:a", "aac");
    args2.push("-b:a", `${config2.audioBitrate ?? 192}k`);
  } else if (config2.audioCopy) {
    args2.push("-c:a", "copy");
  } else {
    args2.push(...buildAudioArgs(config2));
  }
  args2.push("-map", "0:v:0");
  args2.push("-map", "0:a?");
  if (config2.container === "mp4") {
    args2.push("-movflags", "+faststart");
  }
  args2.push("-y");
  args2.push(outputPath);
  return args2;
}
function buildH265FFmpegArgs(inputPath, outputPath, config2, sourceInfo, cpuCapabilities) {
  const args2 = [];
  args2.push("-i", inputPath);
  if (config2.threadLimit > 0) {
    args2.push("-threads", String(config2.threadLimit));
  }
  args2.push("-c:v", config2.h265.encoder);
  args2.push("-crf", config2.h265.crf.toString());
  args2.push("-preset", config2.h265.preset);
  const x265Params = buildX265Params(config2.h265, sourceInfo, cpuCapabilities);
  if (x265Params) {
    args2.push("-x265-params", x265Params);
  }
  if (config2.h265.tune) {
    args2.push("-tune", config2.h265.tune);
  }
  if (sourceInfo.isHdr) {
    args2.push(...buildHdrArgsH265(sourceInfo));
  } else {
    args2.push("-pix_fmt", "yuv420p");
  }
  const needsMp4AudioReencode = config2.container === "mp4" && config2.audioCopy && isPcmAudio(sourceInfo.audioCodec);
  if (needsMp4AudioReencode) {
    args2.push("-c:a", "aac");
    args2.push("-b:a", `${config2.audioBitrate ?? 192}k`);
  } else if (config2.audioCopy) {
    args2.push("-c:a", "copy");
  } else {
    args2.push(...buildAudioArgs(config2));
  }
  args2.push("-map", "0:v:0");
  args2.push("-map", "0:a?");
  if (config2.container === "mp4") {
    args2.push("-movflags", "+faststart");
  }
  if (config2.container === "mp4") {
    args2.push("-tag:v", "hvc1");
  }
  args2.push("-y");
  args2.push(outputPath);
  return args2;
}
function buildLibaomParams(options, sourceInfo) {
  const args2 = [];
  args2.push("-g", options.keyframeInterval.toString());
  if (options.sceneChangeDetection) {
    args2.push("-sc_threshold", "40");
  } else {
    args2.push("-sc_threshold", "0");
  }
  if (sourceInfo.width >= 1920) {
    args2.push("-tile-columns", "2");
    args2.push("-tile-rows", "1");
  }
  args2.push("-row-mt", "1");
  if (options.adaptiveQuantization) {
    args2.push("-aq-mode", "1");
  }
  if (sourceInfo.isHdr) {
    args2.push("-enable-cdef", "1");
  }
  args2.push("-usage", "good");
  args2.push("-lag-in-frames", "48");
  args2.push("-auto-alt-ref", "1");
  return args2;
}
function buildSvtAv1Params(options, sourceInfo) {
  const params = [];
  params.push(`keyint=${options.keyframeInterval}`);
  if (options.sceneChangeDetection) {
    params.push("scd=1");
  } else {
    params.push("scd=0");
  }
  if (options.filmGrainSynthesis > 0) {
    params.push(`film-grain=${options.filmGrainSynthesis}`);
    params.push("film-grain-denoise=1");
  }
  params.push(`tune=${options.tune}`);
  if (options.adaptiveQuantization) {
    params.push("enable-qm=1");
    params.push("aq-mode=2");
  }
  params.push("lookahead=120");
  if (sourceInfo.isHdr) {
    params.push("enable-hdr=1");
    const masterDisplayStr = buildMasterDisplayString(sourceInfo.masteringDisplay);
    if (masterDisplayStr) {
      params.push(`mastering-display=${masterDisplayStr}`);
    }
    const maxCllStr = buildMaxCllString(sourceInfo.contentLightLevel);
    if (maxCllStr) {
      params.push(`content-light=${maxCllStr}`);
    }
  }
  params.push("fast-decode=0");
  params.push("enable-tf=1");
  return params.join(":");
}
function buildX265Params(options, sourceInfo, cpuCapabilities) {
  const params = [];
  params.push(`keyint=${options.keyframeInterval}`);
  params.push(`min-keyint=${Math.min(options.keyframeInterval, 25)}`);
  params.push(`bframes=${options.bframes}`);
  params.push("scenecut=40");
  params.push("ref=4");
  params.push("rc-lookahead=40");
  params.push("sao=1");
  if (sourceInfo.isHdr) {
    params.push("hdr10=1");
    params.push("hdr10-opt=1");
    const masterDisplayStr = buildMasterDisplayString(sourceInfo.masteringDisplay);
    if (masterDisplayStr) {
      params.push(`master-display=${masterDisplayStr}`);
    }
    const maxCllStr = buildMaxCllString(sourceInfo.contentLightLevel);
    if (maxCllStr) {
      params.push(`max-cll=${maxCllStr}`);
    }
  }
  params.push("aq-mode=3");
  const level = getH265Level(sourceInfo.width, sourceInfo.height);
  params.push(`level-idc=${level}`);
  if (cpuCapabilities?.avx512) {
    params.push("asm=avx512");
  }
  return params.join(":");
}
function buildMasterDisplayString(metadata) {
  if (!metadata)
    return null;
  if (!metadata.greenX || !metadata.blueX || !metadata.redX)
    return null;
  const maxL = Math.round(metadata.maxLuminance * 1e4);
  const minL = Math.round(metadata.minLuminance * 1e4);
  return `G(${metadata.greenX},${metadata.greenY})B(${metadata.blueX},${metadata.blueY})R(${metadata.redX},${metadata.redY})WP(${metadata.whitePointX},${metadata.whitePointY})L(${maxL},${minL})`;
}
function buildMaxCllString(metadata) {
  if (!metadata)
    return null;
  if (metadata.maxCll === 0 && metadata.maxFall === 0)
    return null;
  return `${metadata.maxCll},${metadata.maxFall}`;
}
function buildHdrArgsH265(sourceInfo) {
  const args2 = [];
  args2.push("-pix_fmt", "yuv420p10le");
  if (sourceInfo.colorPrimaries || sourceInfo.colorTransfer || sourceInfo.colorMatrix) {
    if (sourceInfo.colorPrimaries) {
      args2.push("-color_primaries", sourceInfo.colorPrimaries);
    }
    if (sourceInfo.colorTransfer) {
      args2.push("-color_trc", sourceInfo.colorTransfer);
    }
    if (sourceInfo.colorMatrix) {
      args2.push("-colorspace", sourceInfo.colorMatrix);
    }
  } else if (sourceInfo.colorSpace) {
    const colorParams = parseColorSpace(sourceInfo.colorSpace);
    if (colorParams.primaries) {
      args2.push("-color_primaries", colorParams.primaries);
    }
    if (colorParams.transfer) {
      args2.push("-color_trc", colorParams.transfer);
    }
    if (colorParams.matrix) {
      args2.push("-colorspace", colorParams.matrix);
    }
  } else {
    args2.push("-color_primaries", "bt2020");
    args2.push("-color_trc", "smpte2084");
    args2.push("-colorspace", "bt2020nc");
  }
  return args2;
}
function buildHdrArgs(sourceInfo) {
  const args2 = [];
  args2.push("-pix_fmt", "yuv420p10le");
  if (sourceInfo.colorPrimaries || sourceInfo.colorTransfer || sourceInfo.colorMatrix) {
    if (sourceInfo.colorPrimaries) {
      args2.push("-color_primaries", sourceInfo.colorPrimaries);
    }
    if (sourceInfo.colorTransfer) {
      args2.push("-color_trc", sourceInfo.colorTransfer);
    }
    if (sourceInfo.colorMatrix) {
      args2.push("-colorspace", sourceInfo.colorMatrix);
    }
  } else if (sourceInfo.colorSpace) {
    const colorParams = parseColorSpace(sourceInfo.colorSpace);
    if (colorParams.primaries) {
      args2.push("-color_primaries", colorParams.primaries);
    }
    if (colorParams.transfer) {
      args2.push("-color_trc", colorParams.transfer);
    }
    if (colorParams.matrix) {
      args2.push("-colorspace", colorParams.matrix);
    }
  } else {
    args2.push("-color_primaries", "bt2020");
    args2.push("-color_trc", "smpte2084");
    args2.push("-colorspace", "bt2020nc");
  }
  return args2;
}
function parseColorSpace(colorSpace) {
  const lower = colorSpace.toLowerCase();
  if (lower.includes("bt2020") || lower.includes("rec2020") || lower.includes("2020")) {
    return {
      primaries: "bt2020",
      transfer: lower.includes("hlg") ? "arib-std-b67" : "smpte2084",
      matrix: "bt2020nc"
    };
  }
  if (lower.includes("bt709") || lower.includes("rec709") || lower.includes("709")) {
    return {
      primaries: "bt709",
      transfer: "bt709",
      matrix: "bt709"
    };
  }
  if (lower.includes("pq") || lower.includes("smpte2084") || lower.includes("2084")) {
    return {
      primaries: "bt2020",
      transfer: "smpte2084",
      matrix: "bt2020nc"
    };
  }
  if (lower.includes("hlg") || lower.includes("arib") || lower.includes("b67")) {
    return {
      primaries: "bt2020",
      transfer: "arib-std-b67",
      matrix: "bt2020nc"
    };
  }
  return {};
}
function isWebmCompatibleAudio(audioCodec) {
  if (!audioCodec)
    return false;
  const codec = audioCodec.toLowerCase();
  return codec === "opus" || codec === "vorbis";
}
function isPcmAudio(audioCodec) {
  if (!audioCodec)
    return false;
  const codec = audioCodec.toLowerCase();
  return codec.startsWith("pcm_");
}
function buildAudioArgs(config2) {
  const args2 = [];
  switch (config2.audioCodec) {
    case "opus":
      args2.push("-c:a", "libopus");
      args2.push("-b:a", `${config2.audioBitrate ?? 128}k`);
      args2.push("-ar", "48000");
      break;
    case "flac":
      args2.push("-c:a", "flac");
      break;
    case "aac":
      args2.push("-c:a", "aac");
      args2.push("-b:a", `${config2.audioBitrate ?? 192}k`);
      break;
    default:
      args2.push("-c:a", "copy");
  }
  return args2;
}
function describeArchivalSettings(config2, sourceInfo) {
  const lines = [];
  lines.push(`Codec: ${config2.codec === "h265" ? "H.265/HEVC" : "AV1"}`);
  if (config2.codec === "h265") {
    lines.push(`Encoder: libx265`);
    lines.push(`Preset: ${config2.h265.preset}`);
    if (sourceInfo) {
      const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
      lines.push(`Resolution: ${sourceInfo.width}x${sourceInfo.height} (${resolution})`);
      lines.push(`CRF: ${config2.h265.crf}`);
      lines.push(`Frame Rate: ${sourceInfo.frameRate.toFixed(2)} fps`);
      lines.push(`Color: ${sourceInfo.isHdr ? "HDR (10-bit)" : "SDR (8-bit)"}`);
    } else {
      lines.push(`CRF: ${config2.h265.crf}`);
    }
    lines.push(`GOP Size: ${config2.h265.keyframeInterval} frames`);
    lines.push(`B-frames: ${config2.h265.bframes}`);
    if (config2.h265.tune) {
      lines.push(`Tune: ${config2.h265.tune}`);
    }
  } else {
    const encoder = config2.av1.encoder;
    const encoderName = encoder === "libsvtav1" ? "SVT-AV1 (libsvtav1)" : "libaom-av1";
    lines.push(`Encoder: ${encoderName}`);
    lines.push(`Preset: ${config2.av1.preset} (${describePreset(config2.av1.preset, encoder)})`);
    if (sourceInfo) {
      const effectiveCrf = getOptimalCrf(sourceInfo);
      const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
      lines.push(`Resolution: ${sourceInfo.width}x${sourceInfo.height} (${resolution})`);
      lines.push(`CRF: ${effectiveCrf} (${sourceInfo.isHdr ? "HDR" : "SDR"} profile)`);
      lines.push(`Frame Rate: ${sourceInfo.frameRate.toFixed(2)} fps`);
      lines.push(`Color: ${sourceInfo.isHdr ? "HDR (10-bit)" : "SDR (8-bit)"}`);
    } else {
      lines.push(`CRF: ${config2.av1.crf} (auto-adjusted per video)`);
    }
    lines.push(`GOP Size: ${config2.av1.keyframeInterval} frames (scene-aware)`);
    if (encoder === "libsvtav1") {
      lines.push(`Film Grain: ${config2.av1.filmGrainSynthesis > 0 ? `Level ${config2.av1.filmGrainSynthesis}` : "Disabled"}`);
    }
  }
  let audioDesc;
  if (config2.audioCopy) {
    const needsWebmReencode = config2.container === "webm" && sourceInfo && !isWebmCompatibleAudio(sourceInfo.audioCodec);
    const needsMp4Reencode = config2.container === "mp4" && sourceInfo && isPcmAudio(sourceInfo.audioCodec);
    if (needsWebmReencode) {
      audioDesc = `Opus (re-encoded for WebM, source: ${sourceInfo.audioCodec || "unknown"})`;
    } else if (needsMp4Reencode) {
      audioDesc = `AAC (re-encoded for MP4, source: ${sourceInfo.audioCodec || "PCM"})`;
    } else {
      audioDesc = "Copy (lossless)";
    }
  } else {
    audioDesc = config2.audioCodec?.toUpperCase() ?? "Copy";
  }
  lines.push(`Audio: ${audioDesc}`);
  lines.push(`Container: ${config2.container.toUpperCase()}`);
  return lines.join("\n");
}
function describePreset(preset, encoder) {
  if (encoder === "libsvtav1") {
    if (preset <= 2)
      return "Very Slow - Maximum Quality";
    if (preset <= 4)
      return "Slow - High Quality";
    if (preset <= 6)
      return "Balanced Quality/Speed";
    if (preset <= 8)
      return "Fast - Good Quality";
    if (preset <= 10)
      return "Very Fast - Acceptable Quality";
    return "Ultra Fast - Lower Quality";
  } else {
    if (preset <= 1)
      return "Very Slow - Maximum Quality";
    if (preset <= 3)
      return "Slow - High Quality";
    if (preset <= 5)
      return "Balanced Quality/Speed";
    if (preset <= 6)
      return "Fast - Good Quality";
    return "Very Fast - Acceptable Quality";
  }
}
function estimateArchivalFileSize(sourceInfo, crf) {
  const baseBitrateKbps = 2500;
  const pixels = sourceInfo.width * sourceInfo.height;
  const basePixels = 1920 * 1080;
  const resolutionFactor = pixels / basePixels;
  const baseFps = 30;
  const fpsFactor = sourceInfo.frameRate / baseFps;
  const crfDiff = crf - 30;
  const crfFactor = Math.pow(0.87, crfDiff);
  const hdrFactor = sourceInfo.isHdr ? 1.2 : 1;
  const estimatedBitrateKbps = baseBitrateKbps * resolutionFactor * fpsFactor * crfFactor * hdrFactor;
  const durationSeconds = sourceInfo.duration;
  const estimatedBits = estimatedBitrateKbps * 1e3 * durationSeconds;
  const estimatedMB = estimatedBits / 8 / 1024 / 1024;
  return {
    minMB: Math.round(estimatedMB * 0.6),
    maxMB: Math.round(estimatedMB * 1.5),
    estimatedMB: Math.round(estimatedMB)
  };
}

// src/main/services/archival/encoder-detector.ts
var import_node_child_process4 = require("node:child_process");
var logger = new Logger("EncoderDetector");
var cachedEncoderInfo = null;
async function detectAv1Encoders() {
  if (cachedEncoderInfo) {
    return cachedEncoderInfo;
  }
  const ffmpegPath = resolveBundledBinary("ffmpeg");
  const available = [];
  const h265Available = [];
  try {
    const encoders = await getEncoderList(ffmpegPath);
    if (encoders.includes("libaom-av1")) {
      available.push("libaom-av1");
    }
    if (encoders.includes("libsvtav1")) {
      available.push("libsvtav1");
    }
    if (encoders.includes("libx265")) {
      h265Available.push("libx265");
    }
  } catch {
  }
  let recommended = null;
  if (available.includes("libsvtav1")) {
    recommended = "libsvtav1";
  } else if (available.includes("libaom-av1")) {
    recommended = "libaom-av1";
  }
  const canUpgrade = !available.includes("libsvtav1") && (process.platform === "darwin" || process.platform === "win32");
  cachedEncoderInfo = {
    available,
    recommended,
    hasAv1Support: available.length > 0,
    h265Available,
    hasH265Support: h265Available.length > 0,
    canUpgrade
  };
  return cachedEncoderInfo;
}
async function getBestEncoder(preferred) {
  const info = await detectAv1Encoders();
  if (!info.hasAv1Support) {
    return null;
  }
  if (preferred && info.available.includes(preferred)) {
    return preferred;
  }
  return info.recommended;
}
function getEncoderList(ffmpegPath) {
  return new Promise((resolve, reject) => {
    const proc = (0, import_node_child_process4.spawn)(ffmpegPath, ["-encoders", "-hide_banner"]);
    let stdout = "";
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}`));
        return;
      }
      const encoders = [];
      const lines = stdout.split("\n");
      for (const line of lines) {
        const match = line.match(/^\s*V[.\w]+\s+(\S+)/);
        if (match) {
          encoders.push(match[1]);
        }
      }
      resolve(encoders);
    });
    proc.on("error", reject);
  });
}

// src/main/services/archival/archival-state-persistence.ts
var import_promises = require("node:fs/promises");
var import_node_path3 = require("node:path");
init_electron();
var STATE_FILE_NAME = "archival-queue-state.json";
var CURRENT_VERSION = 1;
var ArchivalStatePersistence = class {
  // 30 seconds for periodic saves during encoding
  constructor() {
    this.logger = new Logger("ArchivalStatePersistence");
    this.saveDebounceTimer = null;
    this.saveDebounceMs = 3e4;
    this.statePath = (0, import_node_path3.join)(app.getPath("userData"), STATE_FILE_NAME);
  }
  /**
   * Save state to disk immediately
   */
  async saveState(state) {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    try {
      const stateWithMeta = {
        ...state,
        version: CURRENT_VERSION,
        savedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await (0, import_promises.writeFile)(this.statePath, JSON.stringify(stateWithMeta, null, 2), "utf-8");
      this.logger.debug("State saved", { itemCount: state.job.items.length });
    } catch (error) {
      this.logger.error("Failed to save state", { error });
      throw error;
    }
  }
  /**
   * Schedule a debounced save (used during encoding for periodic saves)
   * The save will be executed after saveDebounceMs unless another save is triggered
   */
  scheduleSave(state) {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveDebounceTimer = null;
      void this.saveState(state);
    }, this.saveDebounceMs);
  }
  /**
   * Cancel any pending debounced save
   */
  cancelPendingSave() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
  }
  /**
   * Load state from disk
   * Returns null if no state file exists or if it's corrupted
   */
  async loadState() {
    try {
      const content = await (0, import_promises.readFile)(this.statePath, "utf-8");
      const state = JSON.parse(content);
      if (state.version !== CURRENT_VERSION) {
        this.logger.warn("State file version mismatch, discarding", {
          fileVersion: state.version,
          currentVersion: CURRENT_VERSION
        });
        await this.clearState();
        return null;
      }
      if (!state.job || !state.job.id || !Array.isArray(state.job.items)) {
        this.logger.warn("State file is corrupted, discarding");
        await this.clearState();
        return null;
      }
      this.logger.info("State loaded", {
        jobId: state.job.id,
        itemCount: state.job.items.length,
        savedAt: state.savedAt
      });
      return state;
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }
      this.logger.warn("Failed to load state", { error });
      return null;
    }
  }
  /**
   * Clear state file from disk
   */
  async clearState() {
    this.cancelPendingSave();
    try {
      await (0, import_promises.unlink)(this.statePath);
      this.logger.debug("State file cleared");
    } catch (error) {
      if (error.code !== "ENOENT") {
        this.logger.warn("Failed to clear state", { error });
      }
    }
  }
  /**
   * Check if a persisted state file exists
   */
  async hasPersistedState() {
    try {
      await (0, import_promises.access)(this.statePath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get the path to the state file (for debugging/logging)
   */
  getStatePath() {
    return this.statePath;
  }
};

// src/main/services/hw-accel-detector.ts
var import_node_child_process5 = require("node:child_process");
var import_node_util = require("node:util");
var import_node_os = __toESM(require("node:os"), 1);
var execFileAsync = (0, import_node_util.promisify)(import_node_child_process5.execFile);
async function detectCPUSIMDCapabilities() {
  const platform2 = import_node_os.default.platform();
  const capabilities = {
    // x86
    sse: false,
    sse2: false,
    sse3: false,
    ssse3: false,
    sse41: false,
    sse42: false,
    avx: false,
    avx2: false,
    avx512: false,
    // ARM
    neon: false,
    sve: false,
    sve2: false,
    // Info
    cpuModel: null,
    architecture: "unknown"
  };
  try {
    if (platform2 === "win32") {
      await detectWindowsCPUCapabilities(capabilities);
    } else if (platform2 === "linux") {
      await detectLinuxCPUCapabilities(capabilities);
    } else if (platform2 === "darwin") {
      await detectMacOSCPUCapabilities(capabilities);
    }
  } catch (error) {
    console.warn("CPU SIMD detection failed:", error);
    return null;
  }
  return capabilities;
}
async function detectWindowsCPUCapabilities(capabilities) {
  try {
    const { stdout: cpuName } = await execFileAsync("wmic", ["cpu", "get", "name"], {
      timeout: 5e3
    });
    const lines = cpuName.trim().split("\n").filter((l) => l.trim() && !l.includes("Name"));
    capabilities.cpuModel = lines[0]?.trim() || null;
  } catch {
  }
  try {
    const { stdout: psOutput } = await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      `
      $cpu = Get-CimInstance -ClassName Win32_Processor
      $procName = $cpu.Name.ToLower()

      # Conservative heuristics for AVX-512 capable CPUs
      # Intel: Only specific generations have AVX-512 enabled
      #   - Ice Lake (10th gen mobile): i[3579]-10xxGx patterns
      #   - Tiger Lake (11th gen mobile): i[3579]-11xxGx patterns
      #   - Rocket Lake (11th gen desktop): i[3579]-11xxx (non-G suffix)
      #   - Xeon Scalable (various gens), Xeon W
      # Note: Intel 12th+ gen (Alder Lake, Raptor Lake) had AVX-512 disabled via microcode
      # AMD: Zen 4+ (Ryzen 7000/8000/9000 series, EPYC Genoa)

      $hasAVX512 = $false

      # Intel 10th gen mobile (Ice Lake) - pattern: i7-1065G7, i5-1035G1, etc.
      if ($procName -match 'i[3579]-10[0-9]{2}g') { $hasAVX512 = $true }

      # Intel 11th gen (Tiger Lake mobile + Rocket Lake desktop)
      if ($procName -match 'i[3579]-11[0-9]{2,3}') { $hasAVX512 = $true }

      # Intel Xeon W series (various generations with AVX-512)
      if ($procName -match 'xeon.*w-[0-9]{4,5}') { $hasAVX512 = $true }

      # Intel Xeon Scalable (Gold, Platinum, Silver, Bronze)
      if ($procName -match 'xeon.*(gold|platinum|silver|bronze)') { $hasAVX512 = $true }

      # Intel Xeon with 4-5 digit model numbers (Scalable, etc.)
      if ($procName -match 'xeon.*[0-9]{4,5}' -and $procName -notmatch 'e[357]-') { $hasAVX512 = $true }

      # AMD Ryzen 7000 series (Zen 4) - pattern: Ryzen 5 7600, Ryzen 9 7950X, etc.
      if ($procName -match 'ryzen.*[3579].*7[0-9]{3}') { $hasAVX512 = $true }

      # AMD Ryzen 8000 series (Zen 4 APUs, e.g., 8700G)
      if ($procName -match 'ryzen.*[3579].*8[0-9]{3}') { $hasAVX512 = $true }

      # AMD Ryzen 9000 series (Zen 5)
      if ($procName -match 'ryzen.*[3579].*9[0-9]{3}') { $hasAVX512 = $true }

      # AMD Ryzen AI 300 series (Strix Point, Zen 5)
      if ($procName -match 'ryzen.*ai.*3[0-9]{2}') { $hasAVX512 = $true }

      # AMD EPYC 9000 series (Genoa, Zen 4)
      if ($procName -match 'epyc.*9[0-9]{3}') { $hasAVX512 = $true }

      # AMD EPYC 8000 series (Siena, Zen 4c)
      if ($procName -match 'epyc.*8[0-9]{3}') { $hasAVX512 = $true }

      Write-Output "MODEL:$($cpu.Name)"
      Write-Output "AVX512:$hasAVX512"
      `
    ], { timeout: 1e4 });
    const modelMatch = psOutput.match(/MODEL:(.+)/i);
    if (modelMatch && !capabilities.cpuModel) {
      capabilities.cpuModel = modelMatch[1].trim();
    }
    if (psOutput.toLowerCase().includes("avx512:true")) {
      capabilities.avx512 = true;
    }
  } catch {
    console.warn("PowerShell CPU detection failed, using baseline assumptions");
  }
  const arch = import_node_os.default.arch();
  if (arch === "arm64") {
    capabilities.architecture = "arm64";
    capabilities.neon = true;
    capabilities.sse = false;
    capabilities.sse2 = false;
    capabilities.sse3 = false;
    capabilities.ssse3 = false;
    capabilities.sse41 = false;
    capabilities.sse42 = false;
    capabilities.avx = false;
    capabilities.avx2 = false;
    capabilities.avx512 = false;
  } else {
    capabilities.architecture = "x86_64";
    capabilities.sse = true;
    capabilities.sse2 = true;
    capabilities.sse3 = true;
    capabilities.ssse3 = true;
    capabilities.sse41 = true;
    capabilities.sse42 = true;
    capabilities.avx = true;
    capabilities.avx2 = true;
  }
}
async function detectLinuxCPUCapabilities(capabilities) {
  const { stdout } = await execFileAsync("cat", ["/proc/cpuinfo"], {
    timeout: 5e3
  });
  const arch = import_node_os.default.arch();
  const isARM = arch === "arm64" || arch === "aarch64";
  if (isARM) {
    capabilities.architecture = "arm64";
    const modelMatch = stdout.match(/model name\s*:\s*(.+)/i) || stdout.match(/Hardware\s*:\s*(.+)/i) || stdout.match(/CPU implementer\s*:\s*(.+)/i);
    capabilities.cpuModel = modelMatch ? modelMatch[1].trim() : null;
    const featuresMatch = stdout.match(/^Features\s*:\s*(.+)$/im);
    if (featuresMatch) {
      const features = ` ${featuresMatch[1].toLowerCase()} `;
      capabilities.neon = / asimd /.test(features) || / neon /.test(features);
      if (!capabilities.neon) {
        capabilities.neon = true;
      }
      capabilities.sve = / sve /.test(features);
      capabilities.sve2 = / sve2 /.test(features);
    } else {
      capabilities.neon = true;
    }
    if (!capabilities.cpuModel) {
      try {
        const { stdout: lscpuOut } = await execFileAsync("lscpu", [], { timeout: 3e3 });
        const modelNameMatch = lscpuOut.match(/Model name:\s*(.+)/i);
        if (modelNameMatch) {
          capabilities.cpuModel = modelNameMatch[1].trim();
        }
      } catch {
      }
    }
  } else {
    capabilities.architecture = "x86_64";
    const modelMatch = stdout.match(/model name\s*:\s*(.+)/i);
    capabilities.cpuModel = modelMatch ? modelMatch[1].trim() : null;
    const flagsMatch = stdout.match(/^flags\s*:\s*(.+)$/im);
    if (flagsMatch) {
      const flags = ` ${flagsMatch[1].toLowerCase()} `;
      capabilities.sse = / sse /.test(flags);
      capabilities.sse2 = / sse2 /.test(flags);
      capabilities.sse3 = / sse3 /.test(flags) || / pni /.test(flags);
      capabilities.ssse3 = / ssse3 /.test(flags);
      capabilities.sse41 = / sse4_1 /.test(flags);
      capabilities.sse42 = / sse4_2 /.test(flags);
      capabilities.avx = / avx /.test(flags);
      capabilities.avx2 = / avx2 /.test(flags);
      capabilities.avx512 = /avx512/.test(flags);
    }
  }
}
async function detectMacOSCPUCapabilities(capabilities) {
  try {
    const { stdout: archOutput } = await execFileAsync("uname", ["-m"], { timeout: 2e3 });
    const isAppleSilicon = archOutput.trim().toLowerCase() === "arm64";
    if (isAppleSilicon) {
      capabilities.architecture = "arm64";
      try {
        const { stdout: brandOutput } = await execFileAsync(
          "sysctl",
          ["-n", "machdep.cpu.brand_string"],
          { timeout: 2e3 }
        );
        capabilities.cpuModel = brandOutput.trim() || "Apple Silicon";
      } catch {
        try {
          const { stdout: chipOutput } = await execFileAsync(
            "sysctl",
            ["-n", "hw.chip"],
            { timeout: 2e3 }
          );
          capabilities.cpuModel = chipOutput.trim() || "Apple Silicon";
        } catch {
          capabilities.cpuModel = "Apple Silicon";
        }
      }
      capabilities.neon = true;
      capabilities.sve = false;
      capabilities.sve2 = false;
      return;
    }
  } catch {
  }
  capabilities.architecture = "x86_64";
  try {
    const { stdout: brandOutput } = await execFileAsync(
      "sysctl",
      ["-n", "machdep.cpu.brand_string"],
      { timeout: 2e3 }
    );
    capabilities.cpuModel = brandOutput.trim();
  } catch {
  }
  try {
    const { stdout: featuresOutput } = await execFileAsync(
      "sysctl",
      ["-n", "machdep.cpu.features"],
      { timeout: 2e3 }
    );
    const features = ` ${featuresOutput.toLowerCase()} `;
    capabilities.sse = features.includes("sse");
    capabilities.sse2 = features.includes("sse2");
    capabilities.sse3 = features.includes("sse3");
    capabilities.ssse3 = features.includes("ssse3") || features.includes("supplementalsse3");
    capabilities.sse41 = features.includes("sse4.1");
    capabilities.sse42 = features.includes("sse4.2");
    capabilities.avx = features.includes("avx1.0") || / avx /.test(features);
  } catch {
  }
  try {
    const { stdout: leaf7Output } = await execFileAsync(
      "sysctl",
      ["-n", "machdep.cpu.leaf7_features"],
      { timeout: 2e3 }
    );
    const leaf7 = leaf7Output.toLowerCase();
    capabilities.avx2 = leaf7.includes("avx2");
    capabilities.avx512 = leaf7.includes("avx512");
  } catch {
  }
}

// src/main/services/archival/archival.service.ts
var import_node_os2 = require("node:os");
var import_node_child_process7 = require("node:child_process");
var import_node_util2 = require("node:util");
var execAsync = (0, import_node_util2.promisify)(import_node_child_process7.exec);
var ArchivalService = class {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.logger = new Logger("ArchivalService");
    this.metadata = new MetadataService();
    this.whisperService = new WhisperService();
    this.persistence = new ArchivalStatePersistence();
    this.activeJob = null;
    this.activeProcess = null;
    this.abortController = null;
    this.fillModeSeenOutputs = null;
    // Pause/Resume state
    this.isPaused = false;
    this.currentEncodingItemId = null;
    // ETA tracking
    this.encodingStartTime = 0;
    this.speedSamples = [];
    this.maxSpeedSamples = 10;
    // Moving average window
    // CPU capabilities for SIMD optimizations (AVX-512, etc.)
    this.cpuCapabilities = null;
    this.cpuCapabilitiesDetected = false;
    // Whisper model path getter (injected from outside)
    this.whisperModelPathGetter = null;
    // Whisper provider settings getter
    this.whisperProviderGetter = null;
    // Whisper GPU settings getter
    this.whisperGpuEnabledGetter = null;
  }
  /**
   * Detect and cache CPU SIMD capabilities
   * Called lazily on first encoding job
   */
  async ensureCpuCapabilities() {
    if (this.cpuCapabilitiesDetected) {
      return this.cpuCapabilities;
    }
    try {
      this.cpuCapabilities = await detectCPUSIMDCapabilities();
      this.cpuCapabilitiesDetected = true;
      if (this.cpuCapabilities) {
        this.logger.info("CPU capabilities detected", {
          architecture: this.cpuCapabilities.architecture,
          avx512: this.cpuCapabilities.avx512,
          avx2: this.cpuCapabilities.avx2,
          neon: this.cpuCapabilities.neon,
          sve: this.cpuCapabilities.sve,
          model: this.cpuCapabilities.cpuModel
        });
      }
    } catch (error) {
      this.logger.warn("Failed to detect CPU capabilities", { error });
      this.cpuCapabilitiesDetected = true;
    }
    return this.cpuCapabilities;
  }
  /**
   * Set the function to get the Whisper model path from settings
   * This is called from the IPC handler to inject the settings getter
   */
  setWhisperModelPathGetter(getter) {
    this.whisperModelPathGetter = getter;
  }
  /**
   * Set the function to get the Whisper provider settings
   * This is called from the IPC handler to inject the settings getter
   */
  setWhisperProviderGetter(getter) {
    this.whisperProviderGetter = getter;
  }
  /**
   * Set the function to get the Whisper GPU enabled setting
   * GPU acceleration is only available on Apple Silicon (Metal)
   */
  setWhisperGpuEnabledGetter(getter) {
    this.whisperGpuEnabledGetter = getter;
  }
  /**
   * Get available AV1 encoders
   * Useful for UI to show available options
   */
  async getAvailableEncoders() {
    return detectAv1Encoders();
  }
  /**
   * Check if there's enough disk space for the encoding job
   * Returns estimated required space and available space
   */
  async checkDiskSpace(outputDir, inputPaths) {
    let totalInputSize = 0;
    for (const inputPath of inputPaths) {
      try {
        const inputStat = await (0, import_promises2.stat)(inputPath);
        totalInputSize += inputStat.size;
      } catch {
      }
    }
    const estimatedOutputSize = Math.ceil(totalInputSize * 0.7);
    const safetyMargin = Math.ceil(estimatedOutputSize * 0.1);
    const requiredSpace = estimatedOutputSize + safetyMargin;
    try {
      const freeSpace = await this.getFreeDiskSpace(outputDir);
      return {
        ok: freeSpace >= requiredSpace,
        requiredBytes: requiredSpace,
        availableBytes: freeSpace,
        safetyMarginBytes: safetyMargin
      };
    } catch (error) {
      this.logger.warn("Could not check disk space", { error });
      return {
        ok: true,
        requiredBytes: requiredSpace,
        availableBytes: Number.MAX_SAFE_INTEGER,
        safetyMarginBytes: safetyMargin
      };
    }
  }
  /**
   * Get free disk space for a given path
   * Uses platform-specific commands
   */
  async getFreeDiskSpace(dirPath) {
    const os2 = (0, import_node_os2.platform)();
    if (os2 === "win32") {
      const driveMatch = dirPath.match(/^([A-Za-z]):/);
      const isUncPath = dirPath.startsWith("\\\\");
      if (driveMatch) {
        const driveLetter = driveMatch[1];
        try {
          const { stdout } = await execAsync(
            `powershell -Command "(Get-PSDrive ${driveLetter}).Free"`,
            { timeout: 5e3 }
          );
          const freeBytes = parseInt(stdout.trim(), 10);
          if (!isNaN(freeBytes)) {
            return freeBytes;
          }
        } catch {
          try {
            const { stdout } = await execAsync(
              `wmic logicaldisk where "DeviceID='${driveLetter}:'" get FreeSpace /value`,
              { timeout: 5e3 }
            );
            const match = stdout.match(/FreeSpace=(\d+)/);
            if (match) {
              return parseInt(match[1], 10);
            }
          } catch {
          }
        }
      } else if (isUncPath) {
        try {
          const escapedPath = dirPath.replace(/\\/g, "\\\\");
          const { stdout } = await execAsync(
            `powershell -Command "(Get-PSDrive -PSProvider FileSystem | Where-Object { '${escapedPath}'.StartsWith($_.Root) } | Select-Object -First 1).Free"`,
            { timeout: 5e3 }
          );
          const freeBytes = parseInt(stdout.trim(), 10);
          if (!isNaN(freeBytes)) {
            return freeBytes;
          }
        } catch {
        }
      } else {
        try {
          const { stdout } = await execAsync(
            `powershell -Command "(Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Name -eq (Get-Location).Drive.Name } | Select-Object -First 1).Free"`,
            { timeout: 5e3 }
          );
          const freeBytes = parseInt(stdout.trim(), 10);
          if (!isNaN(freeBytes)) {
            return freeBytes;
          }
        } catch {
        }
      }
    } else {
      try {
        const { stdout } = await execAsync(`df -k "${dirPath}" | tail -1`, { timeout: 5e3 });
        const parts = stdout.trim().split(/\s+/);
        const freeKB = parseInt(parts[3], 10);
        if (!isNaN(freeKB)) {
          return freeKB * 1024;
        }
      } catch {
      }
    }
    throw new Error("Could not determine free disk space");
  }
  /**
   * Start a batch archival job
   */
  async startBatch(inputPaths, outputDir, configOverrides, folderRoot, relativePaths) {
    if (this.activeJob && this.activeJob.status === "running") {
      throw new Error("Another archival job is already running");
    }
    await this.persistence.clearState();
    if (!inputPaths || inputPaths.length === 0) {
      throw new Error("No input files provided");
    }
    if (!outputDir || outputDir.trim() === "") {
      throw new Error("No output directory provided");
    }
    try {
      await (0, import_promises2.mkdir)(outputDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create output directory: ${outputDir}`);
    }
    const diskCheck = await this.checkDiskSpace(outputDir, inputPaths);
    if (!diskCheck.ok) {
      const requiredGB = (diskCheck.requiredBytes / (1024 * 1024 * 1024)).toFixed(1);
      const availableGB = (diskCheck.availableBytes / (1024 * 1024 * 1024)).toFixed(1);
      throw new Error(
        `Not enough disk space. Need approximately ${requiredGB} GB but only ${availableGB} GB available.`
      );
    }
    const config2 = {
      ...DEFAULT_ARCHIVAL_CONFIG,
      ...configOverrides,
      outputDir
    };
    if (config2.fillMode) {
      config2.overwriteExisting = false;
    }
    this.fillModeSeenOutputs = config2.fillMode ? /* @__PURE__ */ new Set() : null;
    const bestEncoder = await getBestEncoder(config2.av1.encoder);
    if (!bestEncoder) {
      throw new Error(
        "No AV1 encoder available. The bundled FFmpeg does not support libaom-av1 or libsvtav1."
      );
    }
    if (bestEncoder !== config2.av1.encoder) {
      this.logger.info(`Encoder ${config2.av1.encoder} not available, using ${bestEncoder}`);
      config2.av1 = { ...config2.av1, encoder: bestEncoder };
    }
    const batchId = (0, import_node_crypto.randomUUID)();
    const items = inputPaths.map((inputPath, index) => ({
      id: (0, import_node_crypto.randomUUID)(),
      inputPath,
      outputPath: this.buildOutputPath(
        inputPath,
        outputDir,
        config2,
        relativePaths?.[index]
      ),
      status: "queued",
      progress: 0
    }));
    if (!config2.fillMode) {
      this.deduplicateOutputPaths(items);
    }
    this.activeJob = {
      id: batchId,
      items,
      config: config2,
      status: "pending",
      totalItems: items.length,
      completedItems: 0,
      failedItems: 0,
      skippedItems: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      // Initialize batch-level tracking
      totalDurationSeconds: 0,
      processedDurationSeconds: 0,
      batchEtaSeconds: void 0,
      averageSpeed: void 0,
      estimatedTotalOutputBytes: diskCheck.requiredBytes,
      actualOutputBytes: 0
    };
    this.speedSamples = [];
    void this.processQueue();
    return this.activeJob;
  }
  /**
   * Get current job status
   */
  getStatus() {
    return this.activeJob;
  }
  /**
   * Cancel the active batch job
   */
  cancel() {
    if (!this.activeJob || this.activeJob.status !== "running") {
      return false;
    }
    this.abortController?.abort();
    this.activeJob.status = "cancelled";
    if (this.activeProcess) {
      if ((0, import_node_os2.platform)() === "win32") {
        this.activeProcess.kill();
      } else {
        this.activeProcess.kill("SIGTERM");
      }
      this.activeProcess = null;
    }
    void this.persistence.clearState();
    return true;
  }
  /**
   * Pause the active batch job immediately
   * Kills the current FFmpeg process and saves state for later resume
   */
  async pause() {
    if (!this.activeJob || this.activeJob.status !== "running") {
      return false;
    }
    this.logger.info("Pausing encoding job", { jobId: this.activeJob.id });
    this.isPaused = true;
    if (this.activeProcess) {
      if ((0, import_node_os2.platform)() === "win32") {
        this.activeProcess.kill();
      } else {
        this.activeProcess.kill("SIGTERM");
      }
      this.activeProcess = null;
    }
    if (this.currentEncodingItemId) {
      const currentItem = this.activeJob.items.find((i) => i.id === this.currentEncodingItemId);
      if (currentItem && currentItem.status === "encoding") {
        await this.cleanupPartialOutput(currentItem.outputPath);
        currentItem.status = "queued";
        currentItem.progress = 0;
        currentItem.startedAt = void 0;
        currentItem.encodingSpeed = void 0;
        currentItem.etaSeconds = void 0;
        currentItem.elapsedSeconds = void 0;
      }
    }
    await this.saveCurrentState();
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: "",
      kind: "queue_paused",
      queueState: "paused"
    });
    this.logger.info("Encoding job paused", { jobId: this.activeJob.id });
    return true;
  }
  /**
   * Resume a paused batch job
   */
  async resume() {
    if (!this.activeJob || !this.isPaused) {
      return false;
    }
    this.logger.info("Resuming encoding job", { jobId: this.activeJob.id });
    this.isPaused = false;
    const remainingInputPaths = this.activeJob.items.filter((i) => i.status === "queued").map((i) => i.inputPath);
    if (remainingInputPaths.length > 0) {
      const diskCheck = await this.checkDiskSpace(this.activeJob.config.outputDir, remainingInputPaths);
      if (!diskCheck.ok) {
        this.logger.error("Not enough disk space to resume", { diskCheck });
        this.isPaused = true;
        throw new Error("Not enough disk space to resume encoding");
      }
    }
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: "",
      kind: "queue_resumed",
      queueState: "running"
    });
    void this.processQueue();
    return true;
  }
  /**
   * Check if a job is currently paused
   */
  getIsPaused() {
    return this.isPaused;
  }
  /**
   * Check if there's a recoverable state from a previous crash or exit
   * Returns null if there's already an active job (nothing to recover)
   */
  async checkForRecovery() {
    if (this.activeJob && (this.activeJob.status === "running" || this.isPaused)) {
      return null;
    }
    try {
      const state = await this.persistence.loadState();
      if (state && state.job.status === "running") {
        this.logger.info("Found recoverable job state", {
          jobId: state.job.id,
          totalItems: state.job.totalItems,
          completedItems: state.job.completedItems,
          savedAt: state.savedAt
        });
        return state;
      }
      return null;
    } catch (error) {
      this.logger.warn("Failed to check for recovery state", { error });
      return null;
    }
  }
  /**
   * Resume from a recovered state after crash/restart
   * Validates files and restarts the queue
   */
  async resumeFromRecovery(state) {
    if (this.activeJob && this.activeJob.status === "running") {
      throw new Error("Another archival job is already running");
    }
    this.logger.info("Resuming from recovery state", { jobId: state.job.id });
    this.activeJob = state.job;
    for (const item of this.activeJob.items) {
      if (item.status === "encoding" || item.status === "analyzing") {
        await this.cleanupPartialOutput(item.outputPath);
        item.status = "queued";
        item.progress = 0;
        item.startedAt = void 0;
        item.encodingSpeed = void 0;
        item.etaSeconds = void 0;
        item.elapsedSeconds = void 0;
      }
      if (item.status === "queued") {
        try {
          await (0, import_promises2.access)(item.inputPath);
        } catch {
          item.status = "failed";
          item.error = "Source file no longer exists";
          item.errorType = "file_not_found";
          item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
          this.activeJob.failedItems++;
          this.logger.warn("Source file missing during recovery", { inputPath: item.inputPath });
        }
      }
    }
    if (state.twoPassState) {
      try {
        await (0, import_promises2.rm)(state.twoPassState.passLogDir, { recursive: true, force: true });
        this.logger.debug("Cleaned up two-pass log files", { dir: state.twoPassState.passLogDir });
      } catch {
      }
    }
    this.speedSamples = [];
    this.isPaused = false;
    try {
      await (0, import_promises2.access)(this.activeJob.config.outputDir);
    } catch {
      this.activeJob = null;
      throw new Error("Output directory no longer exists or is not accessible");
    }
    const remainingInputPaths = this.activeJob.items.filter((i) => i.status === "queued").map((i) => i.inputPath);
    if (remainingInputPaths.length > 0) {
      const diskCheck = await this.checkDiskSpace(this.activeJob.config.outputDir, remainingInputPaths);
      if (!diskCheck.ok) {
        this.activeJob = null;
        throw new Error("Not enough disk space to resume encoding");
      }
    }
    void this.processQueue();
    return this.activeJob;
  }
  /**
   * Discard a recovered state and clean up
   */
  async discardRecovery(state) {
    this.logger.info("Discarding recovery state", { jobId: state.job.id });
    for (const item of state.job.items) {
      if (item.status === "encoding" || item.status === "analyzing") {
        await this.cleanupPartialOutput(item.outputPath);
      }
    }
    if (state.twoPassState) {
      try {
        await (0, import_promises2.rm)(state.twoPassState.passLogDir, { recursive: true, force: true });
      } catch {
      }
    }
    await this.persistence.clearState();
    this.logger.info("Recovery state discarded");
  }
  /**
   * Check if there's an active job (running or paused)
   */
  hasActiveJob() {
    return this.activeJob !== null && (this.activeJob.status === "running" || this.isPaused);
  }
  /**
   * Save current state for graceful shutdown or crash recovery
   */
  async saveCurrentState() {
    if (!this.activeJob)
      return;
    const state = {
      version: 1,
      savedAt: (/* @__PURE__ */ new Date()).toISOString(),
      job: this.activeJob,
      currentItemId: this.currentEncodingItemId
    };
    await this.persistence.saveState(state);
    this.logger.debug("State saved", { jobId: this.activeJob.id });
  }
  /**
   * Preview the FFmpeg command for a single file
   */
  async previewCommand(inputPath, outputDir, configOverrides) {
    const config2 = {
      ...DEFAULT_ARCHIVAL_CONFIG,
      ...configOverrides,
      outputDir
    };
    const sourceInfo = await this.analyzeVideo(inputPath);
    const outputPath = this.buildOutputPath(inputPath, outputDir, config2);
    const command = buildArchivalFFmpegArgs(inputPath, outputPath, config2, sourceInfo);
    const description = describeArchivalSettings(config2, sourceInfo);
    return { command, description, sourceInfo };
  }
  /**
   * Get estimated output size for a video
   */
  async estimateSize(inputPath) {
    const sourceInfo = await this.analyzeVideo(inputPath);
    const effectiveCrf = getOptimalCrf(sourceInfo);
    const estimate = estimateArchivalFileSize(sourceInfo, effectiveCrf);
    return {
      sourceInfo,
      effectiveCrf,
      ...estimate
    };
  }
  /**
   * Get batch info including total duration and existing files count
   * Used for pre-flight checks before starting encoding
   */
  async getBatchInfo(inputPaths, outputDir) {
    let totalDurationSeconds = 0;
    let totalInputBytes = 0;
    let existingCount = 0;
    const containerExtensions = ["mkv", "mp4", "webm"];
    for (const inputPath of inputPaths) {
      try {
        const inputStat = await (0, import_promises2.stat)(inputPath);
        totalInputBytes += inputStat.size;
        const meta = await this.metadata.extract({ filePath: inputPath });
        if (meta.duration) {
          totalDurationSeconds += meta.duration;
        }
        const inputName = (0, import_node_path4.basename)(inputPath, (0, import_node_path4.extname)(inputPath));
        for (const ext of containerExtensions) {
          const outputPath = (0, import_node_path4.join)(outputDir, `${inputName}.${ext}`);
          try {
            await (0, import_promises2.access)(outputPath);
            existingCount++;
            break;
          } catch {
          }
        }
      } catch {
      }
    }
    return {
      totalDurationSeconds,
      totalInputBytes,
      existingCount
    };
  }
  /**
   * Process the job queue
   */
  async processQueue() {
    if (!this.activeJob)
      return;
    this.activeJob.status = "running";
    if (!this.activeJob.startedAt) {
      this.activeJob.startedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.abortController = new AbortController();
    for (const item of this.activeJob.items) {
      if (item.status === "completed" || item.status === "failed" || item.status === "skipped") {
        continue;
      }
      if (this.isPaused) {
        this.logger.info("Queue paused, stopping processing");
        this.abortController = null;
        return;
      }
      if (this.abortController.signal.aborted) {
        item.status = "cancelled";
        continue;
      }
      this.currentEncodingItemId = item.id;
      await this.saveCurrentState();
      try {
        await this.processItem(item);
      } catch (error) {
        this.logger.error("Failed to process item", {
          itemId: item.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
      await this.saveCurrentState();
    }
    this.currentEncodingItemId = null;
    const finalStatus = this.abortController.signal.aborted ? "cancelled" : "completed";
    this.activeJob.status = finalStatus;
    this.activeJob.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: "",
      kind: "batch_complete",
      // Include final stats for UI
      processedItems: this.activeJob.completedItems,
      totalItems: this.activeJob.totalItems
    });
    await this.persistence.clearState();
    this.abortController = null;
    this.fillModeSeenOutputs = null;
    this.isPaused = false;
  }
  /**
   * Process a single item in the batch
   */
  async processItem(item) {
    if (!this.activeJob)
      return;
    item.status = "analyzing";
    item.startedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: item.id,
      kind: "item_start",
      status: "analyzing"
    });
    try {
      if (this.activeJob.config.fillMode) {
        const shouldSkip = await this.shouldSkipForFillMode(item.outputPath);
        if (shouldSkip) {
          this.logger.info("Skipping due to name conflict (fill mode)", {
            outputPath: item.outputPath
          });
          this.markItemSkipped(item);
          return;
        }
      }
      await (0, import_promises2.access)(item.inputPath);
      const inputStat = await (0, import_promises2.stat)(item.inputPath);
      item.inputSize = inputStat.size;
      const sourceInfo = await this.analyzeVideo(item.inputPath);
      item.sourceInfo = sourceInfo;
      item.effectiveCrf = getOptimalCrf(sourceInfo);
      if (!this.activeJob.config.overwriteExisting) {
        try {
          await (0, import_promises2.access)(item.outputPath);
          this.logger.info("Skipping existing output", { outputPath: item.outputPath });
          this.markItemSkipped(item);
          return;
        } catch {
        }
      }
      await (0, import_promises2.mkdir)((0, import_node_path4.dirname)(item.outputPath), { recursive: true });
      item.status = "encoding";
      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: "item_progress",
        progress: 0,
        status: "encoding",
        sourceInfo,
        effectiveCrf: item.effectiveCrf
      });
      await this.encodeVideo(item, sourceInfo);
      const outputStat = await (0, import_promises2.stat)(item.outputPath);
      item.outputSize = outputStat.size;
      item.compressionRatio = item.inputSize ? item.inputSize / item.outputSize : void 0;
      const outputLarger = item.inputSize && item.outputSize > item.inputSize;
      if (outputLarger && this.activeJob.config.deleteOutputIfLarger) {
        await this.cleanupPartialOutput(item.outputPath);
        item.status = "skipped";
        item.error = `Output (${this.formatBytes(item.outputSize)}) larger than input (${this.formatBytes(item.inputSize)})`;
        item.errorType = "output_larger";
        item.outputDeleted = true;
        item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
        this.activeJob.skippedItems++;
        this.emitEvent({
          batchId: this.activeJob.id,
          itemId: item.id,
          kind: "item_complete",
          progress: 100,
          status: "skipped",
          error: item.error,
          errorType: "output_larger",
          outputSize: item.outputSize,
          compressionRatio: item.compressionRatio
        });
        this.logger.info("Skipped - output larger than input", {
          input: (0, import_node_path4.basename)(item.inputPath),
          inputSize: item.inputSize,
          outputSize: item.outputSize
        });
        return;
      }
      if (this.activeJob) {
        this.activeJob.actualOutputBytes = (this.activeJob.actualOutputBytes ?? 0) + item.outputSize;
        if (sourceInfo.duration) {
          this.activeJob.processedDurationSeconds = (this.activeJob.processedDurationSeconds ?? 0) + sourceInfo.duration;
        }
      }
      if (this.activeJob.config.extractThumbnail) {
        try {
          const thumbnailPath = await this.extractThumbnail(
            item.outputPath,
            sourceInfo,
            this.activeJob.config.thumbnailTimestamp
          );
          item.thumbnailPath = thumbnailPath;
        } catch (thumbnailError) {
          this.logger.warn("Thumbnail extraction failed, continuing without thumbnail", {
            input: item.inputPath,
            error: thumbnailError instanceof Error ? thumbnailError.message : "Unknown error"
          });
        }
      }
      if (this.activeJob.config.extractCaptions) {
        try {
          const captionPath = await this.extractCaptions(
            item.outputPath,
            this.activeJob.config.captionLanguage
          );
          item.captionPath = captionPath;
        } catch (captionError) {
          this.logger.warn("Caption extraction failed, continuing without captions", {
            input: item.inputPath,
            error: captionError instanceof Error ? captionError.message : "Unknown error"
          });
        }
      }
      item.status = "completed";
      item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      item.progress = 100;
      this.activeJob.completedItems++;
      const warningMsg = outputLarger ? ` (WARNING: output larger than input)` : "";
      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: "item_complete",
        progress: 100,
        status: "completed",
        outputSize: item.outputSize,
        compressionRatio: item.compressionRatio,
        thumbnailPath: item.thumbnailPath,
        captionPath: item.captionPath
      });
      this.logger.info(`Completed archival encoding${warningMsg}`, {
        input: (0, import_node_path4.basename)(item.inputPath),
        output: (0, import_node_path4.basename)(item.outputPath),
        ratio: item.compressionRatio?.toFixed(2),
        outputLarger
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const errorType = error.errorType ?? classifyError(message);
      item.status = "failed";
      item.error = message;
      item.errorType = errorType;
      item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.activeJob.failedItems++;
      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: "item_error",
        status: "failed",
        error: message,
        errorType
      });
      this.logger.error("Failed to encode", {
        input: item.inputPath,
        error: message,
        errorType
      });
    }
  }
  /**
   * Analyze video to get source info
   */
  async analyzeVideo(filePath) {
    const meta = await this.metadata.extract({ filePath });
    const extendedMeta = await this.getExtendedMetadata(filePath);
    const isHdr = detectHdr(
      extendedMeta.colorSpace,
      extendedMeta.hdrFormat,
      extendedMeta.bitDepth
    );
    const container = (0, import_node_path4.extname)(filePath).toLowerCase().replace(".", "") || void 0;
    return {
      width: meta.width ?? 1920,
      height: meta.height ?? 1080,
      frameRate: meta.fps ?? 30,
      duration: meta.duration ?? 0,
      bitDepth: extendedMeta.bitDepth,
      colorSpace: extendedMeta.colorSpace,
      hdrFormat: extendedMeta.hdrFormat,
      isHdr,
      bitrate: meta.bitrate ?? void 0,
      videoCodec: extendedMeta.videoCodec,
      audioCodec: extendedMeta.audioCodec,
      container,
      // HDR10 static metadata
      masteringDisplay: extendedMeta.masteringDisplay,
      contentLightLevel: extendedMeta.contentLightLevel,
      // Individual color components for precise encoder configuration
      colorPrimaries: extendedMeta.colorPrimaries,
      colorTransfer: extendedMeta.colorTransfer,
      colorMatrix: extendedMeta.colorMatrix
    };
  }
  /**
   * Get extended metadata including HDR info, HDR10 static metadata, and audio codec
   */
  async getExtendedMetadata(filePath) {
    const ffprobePath = resolveBundledBinary("ffprobe");
    return new Promise((resolve) => {
      const proc = (0, import_node_child_process6.spawn)(ffprobePath, [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_streams",
        "-show_frames",
        "-read_intervals",
        "%+#1",
        // Read first frame for side_data
        filePath
      ]);
      let stdout = "";
      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      proc.on("close", () => {
        try {
          const parsed = JSON.parse(stdout);
          const videoStream = parsed.streams?.find((s) => s.codec_type === "video");
          const audioStream = parsed.streams?.find((s) => s.codec_type === "audio");
          if (!videoStream) {
            resolve({ audioCodec: audioStream?.codec_name, videoCodec: void 0 });
            return;
          }
          const videoCodec = videoStream.codec_name;
          const bitDepth = videoStream.bits_per_raw_sample ? parseInt(videoStream.bits_per_raw_sample, 10) : void 0;
          const colorPrimaries = videoStream.color_primaries;
          const colorTransfer = videoStream.color_transfer;
          const colorMatrix = videoStream.color_space;
          const colorParts = [colorPrimaries, colorTransfer, colorMatrix].filter(Boolean);
          const colorSpace = colorParts.length > 0 ? colorParts.join("/") : void 0;
          let hdrFormat = null;
          let masteringDisplay;
          let contentLightLevel;
          const allSideData = [
            ...videoStream.side_data_list || [],
            ...parsed.frames?.[0]?.side_data_list || []
          ];
          for (const sideData of allSideData) {
            const sideDataType = sideData.side_data_type?.toLowerCase() || "";
            if (sideDataType.includes("mastering display") || sideDataType.includes("hdr")) {
              if (!hdrFormat)
                hdrFormat = "HDR10";
              if (sideData.red_x && sideData.green_x && sideData.blue_x) {
                const parseCoord = (val) => {
                  if (!val)
                    return 0;
                  if (val.includes("/")) {
                    const [num, den] = val.split("/");
                    return Math.round(parseInt(num, 10) / parseInt(den, 10) * 5e4);
                  }
                  return parseInt(val, 10);
                };
                const parseLuminance = (val) => {
                  if (!val)
                    return 0;
                  if (val.includes("/")) {
                    const [num, den] = val.split("/");
                    return parseInt(num, 10) / parseInt(den, 10);
                  }
                  return parseFloat(val);
                };
                masteringDisplay = {
                  redX: parseCoord(sideData.red_x),
                  redY: parseCoord(sideData.red_y),
                  greenX: parseCoord(sideData.green_x),
                  greenY: parseCoord(sideData.green_y),
                  blueX: parseCoord(sideData.blue_x),
                  blueY: parseCoord(sideData.blue_y),
                  whitePointX: parseCoord(sideData.white_point_x),
                  whitePointY: parseCoord(sideData.white_point_y),
                  maxLuminance: parseLuminance(sideData.max_luminance),
                  minLuminance: parseLuminance(sideData.min_luminance)
                };
              }
            }
            if (sideDataType.includes("content light level")) {
              if (sideData.max_content !== void 0 && sideData.max_average !== void 0) {
                contentLightLevel = {
                  maxCll: sideData.max_content,
                  maxFall: sideData.max_average
                };
              }
            }
            if (sideDataType.includes("dolby")) {
              hdrFormat = "Dolby Vision";
            }
          }
          if (!hdrFormat && colorTransfer) {
            const transfer = colorTransfer.toLowerCase();
            if (transfer.includes("smpte2084") || transfer.includes("pq")) {
              hdrFormat = "HDR10";
            } else if (transfer.includes("arib-std-b67") || transfer.includes("hlg")) {
              hdrFormat = "HLG";
            }
          }
          const audioCodec = audioStream?.codec_name;
          resolve({
            bitDepth,
            colorSpace,
            hdrFormat,
            videoCodec,
            audioCodec,
            colorPrimaries,
            colorTransfer,
            colorMatrix,
            masteringDisplay,
            contentLightLevel
          });
        } catch {
          resolve({});
        }
      });
      proc.on("error", () => resolve({}));
    });
  }
  /**
   * Encode video using FFmpeg with SVT-AV1 or H.265
   * Supports both single-pass and two-pass encoding
   */
  async encodeVideo(item, sourceInfo) {
    if (!this.activeJob) {
      throw new Error("No active job");
    }
    const config2 = this.activeJob.config;
    const cpuCapabilities = await this.ensureCpuCapabilities();
    if (isTwoPassEnabled(config2)) {
      await this.encodeTwoPass(item, sourceInfo, cpuCapabilities);
    } else {
      await this.encodeSinglePass(item, sourceInfo, cpuCapabilities);
    }
  }
  /**
   * Perform two-pass encoding
   */
  async encodeTwoPass(item, sourceInfo, cpuCapabilities) {
    if (!this.activeJob) {
      throw new Error("No active job");
    }
    const config2 = this.activeJob.config;
    const batchId = this.activeJob.id;
    const passLogDir = (0, import_node_path4.join)((0, import_node_path4.dirname)(item.outputPath), ".pass-logs");
    await (0, import_promises2.mkdir)(passLogDir, { recursive: true });
    try {
      const twoPassArgs = buildTwoPassArgs(
        item.inputPath,
        item.outputPath,
        config2,
        sourceInfo,
        passLogDir,
        cpuCapabilities
      );
      this.logger.info("Starting two-pass encoding - Pass 1", { input: (0, import_node_path4.basename)(item.inputPath) });
      this.emitEvent({
        batchId,
        itemId: item.id,
        kind: "item_progress",
        progress: 0,
        status: "encoding"
      });
      await this.runFFmpegPass(item, sourceInfo, twoPassArgs.pass1, 1, batchId);
      if (this.abortController?.signal.aborted) {
        throw new Error("Encoding cancelled");
      }
      this.logger.info("Starting two-pass encoding - Pass 2", { input: (0, import_node_path4.basename)(item.inputPath) });
      await this.runFFmpegPass(item, sourceInfo, twoPassArgs.pass2, 2, batchId);
    } finally {
      try {
        await (0, import_promises2.rm)(passLogDir, { recursive: true, force: true });
      } catch {
      }
    }
  }
  /**
   * Run a single FFmpeg pass (for two-pass encoding)
   */
  runFFmpegPass(item, sourceInfo, args2, passNumber, batchId) {
    return new Promise((resolve, reject) => {
      const ffmpegPath = resolveBundledBinary("ffmpeg");
      const fullArgs = ["-progress", "pipe:1", "-nostats", ...args2];
      const isPass2 = passNumber === 2;
      const outputPath = isPass2 ? item.outputPath : null;
      this.logger.debug(`Starting FFmpeg pass ${passNumber}`, { args: fullArgs.join(" ") });
      const proc = (0, import_node_child_process6.spawn)(ffmpegPath, fullArgs, { stdio: ["ignore", "pipe", "pipe"] });
      this.activeProcess = proc;
      const startTime = Date.now();
      const durationMs = (sourceInfo.duration ?? 0) * 1e3;
      const durationSeconds = sourceInfo.duration ?? 0;
      let lastProgressUpdate = 0;
      proc.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        let encodedTimeMs = null;
        for (const line of lines) {
          if (line.startsWith("out_time_ms=")) {
            const timeMs = parseInt(line.split("=")[1], 10);
            if (!isNaN(timeMs)) {
              encodedTimeMs = timeMs;
            }
          }
          if (line.startsWith("out_time=")) {
            const timeStr = line.split("=")[1];
            const timeMs = this.parseTimeToMs(timeStr);
            if (timeMs !== null) {
              encodedTimeMs = timeMs;
            }
          }
        }
        if (encodedTimeMs !== null) {
          const now = Date.now();
          const elapsedMs = now - startTime;
          const elapsedSeconds = elapsedMs / 1e3;
          let passProgress;
          if (durationMs > 0) {
            passProgress = Math.min(99, Math.max(0, Math.round(encodedTimeMs / durationMs * 100)));
          } else {
            passProgress = Math.min(99, Math.round(elapsedSeconds / 60));
          }
          const overallProgress = passNumber === 1 ? Math.round(passProgress / 2) : 50 + Math.round(passProgress / 2);
          if (now - lastProgressUpdate > 500) {
            lastProgressUpdate = now;
            item.progress = overallProgress;
            this.emitEvent({
              batchId,
              itemId: item.id,
              kind: "item_progress",
              progress: overallProgress,
              status: "encoding",
              elapsedSeconds
            });
          }
        }
      });
      let stderr = "";
      proc.stderr.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (stderr.length > 8192) {
          stderr = stderr.slice(-8192);
        }
      });
      proc.on("close", (code) => {
        this.activeProcess = null;
        if (code === 0) {
          resolve();
        } else if (this.abortController?.signal.aborted) {
          if (outputPath) {
            void this.cleanupPartialOutput(outputPath);
          }
          const error = new Error("Encoding cancelled");
          error.errorType = "cancelled";
          reject(error);
        } else {
          if (outputPath) {
            void this.cleanupPartialOutput(outputPath);
          }
          const errorPatterns = [
            /Error[^\n]*/i,
            /error[^\n]*/i,
            /Invalid[^\n]*/i
          ];
          let errorMsg = `FFmpeg pass ${passNumber} exited with code ${code}`;
          for (const pattern of errorPatterns) {
            const match = stderr.match(pattern);
            if (match) {
              errorMsg = match[0].trim();
              break;
            }
          }
          const errorType = classifyError(stderr || errorMsg);
          const error = new Error(errorMsg);
          error.errorType = errorType;
          reject(error);
        }
      });
      proc.on("error", (error) => {
        this.activeProcess = null;
        if (outputPath) {
          void this.cleanupPartialOutput(outputPath);
        }
        const typedError = error;
        typedError.errorType = classifyError(error.message);
        reject(typedError);
      });
      const abortHandler = () => {
        if ((0, import_node_os2.platform)() === "win32") {
          proc.kill();
        } else {
          proc.kill("SIGTERM");
        }
      };
      if (this.abortController) {
        this.abortController.signal.addEventListener("abort", abortHandler, { once: true });
      }
    });
  }
  /**
   * Perform single-pass encoding (original implementation)
   */
  encodeSinglePass(item, sourceInfo, cpuCapabilities) {
    return new Promise((resolve, reject) => {
      if (!this.activeJob) {
        reject(new Error("No active job"));
        return;
      }
      const ffmpegPath = resolveBundledBinary("ffmpeg");
      const batchId = this.activeJob.id;
      const args2 = buildArchivalFFmpegArgs(
        item.inputPath,
        item.outputPath,
        this.activeJob.config,
        sourceInfo,
        cpuCapabilities
      );
      args2.unshift("-progress", "pipe:1", "-nostats");
      this.logger.debug("Starting FFmpeg", { args: args2.join(" ") });
      const proc = (0, import_node_child_process6.spawn)(ffmpegPath, args2, { stdio: ["ignore", "pipe", "pipe"] });
      this.activeProcess = proc;
      this.encodingStartTime = Date.now();
      const durationMs = (sourceInfo.duration ?? 0) * 1e3;
      const durationSeconds = sourceInfo.duration ?? 0;
      let lastProgressUpdate = 0;
      proc.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        let encodedTimeMs = null;
        for (const line of lines) {
          if (line.startsWith("out_time_ms=")) {
            const timeMs = parseInt(line.split("=")[1], 10);
            if (!isNaN(timeMs)) {
              encodedTimeMs = timeMs;
            }
          }
          if (line.startsWith("out_time=")) {
            const timeStr = line.split("=")[1];
            const timeMs = this.parseTimeToMs(timeStr);
            if (timeMs !== null) {
              encodedTimeMs = timeMs;
            }
          }
        }
        if (encodedTimeMs !== null) {
          const now = Date.now();
          const elapsedMs = now - this.encodingStartTime;
          const elapsedSeconds = elapsedMs / 1e3;
          let progress;
          if (durationMs > 0) {
            progress = Math.min(99, Math.max(0, Math.round(encodedTimeMs / durationMs * 100)));
          } else {
            progress = Math.min(99, Math.round(elapsedSeconds / 60));
          }
          const encodedSeconds = encodedTimeMs / 1e3;
          let speed = 0;
          if (elapsedSeconds > 0) {
            speed = encodedSeconds / elapsedSeconds;
            this.speedSamples.push(speed);
            if (this.speedSamples.length > this.maxSpeedSamples) {
              this.speedSamples.shift();
            }
          }
          const avgSpeed = this.speedSamples.length > 0 ? this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length : speed;
          let itemEtaSeconds;
          if (durationSeconds > 0 && avgSpeed > 0) {
            const remainingSeconds = durationSeconds - encodedSeconds;
            itemEtaSeconds = remainingSeconds / avgSpeed;
          }
          let batchEtaSeconds;
          if (this.activeJob && avgSpeed > 0) {
            const currentItemRemaining = durationSeconds > 0 ? Math.max(0, durationSeconds - encodedSeconds) : 0;
            let remainingItemsDuration = 0;
            let knownDurations = [];
            let unknownCount = 0;
            for (const i of this.activeJob.items) {
              if (i.status === "queued") {
                if (i.sourceInfo?.duration) {
                  remainingItemsDuration += i.sourceInfo.duration;
                  knownDurations.push(i.sourceInfo.duration);
                } else {
                  unknownCount++;
                }
              }
            }
            if (unknownCount > 0) {
              const avgDuration = knownDurations.length > 0 ? knownDurations.reduce((a, b) => a + b, 0) / knownDurations.length : durationSeconds > 0 ? durationSeconds : 300;
              remainingItemsDuration += avgDuration * unknownCount;
            }
            const totalRemainingDuration = currentItemRemaining + remainingItemsDuration;
            batchEtaSeconds = totalRemainingDuration / avgSpeed;
          }
          item.progress = progress;
          item.encodingSpeed = avgSpeed;
          item.etaSeconds = itemEtaSeconds;
          item.elapsedSeconds = elapsedSeconds;
          if (this.activeJob) {
            this.activeJob.averageSpeed = avgSpeed;
            this.activeJob.batchEtaSeconds = batchEtaSeconds;
          }
          if (now - lastProgressUpdate > 500) {
            lastProgressUpdate = now;
            const processedItems = this.activeJob?.completedItems ?? 0;
            const totalItems = Math.max(1, this.activeJob?.totalItems ?? 1);
            const batchProgress = Math.round(
              (processedItems + progress / 100) / totalItems * 100
            );
            this.emitEvent({
              batchId,
              itemId: item.id,
              kind: "item_progress",
              progress,
              status: "encoding",
              encodingSpeed: avgSpeed,
              itemEtaSeconds,
              batchEtaSeconds,
              elapsedSeconds,
              batchProgress,
              processedItems,
              totalItems
            });
          }
        }
      });
      let stderr = "";
      proc.stderr.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (stderr.length <= 8192) {
          this.logger.debug("FFmpeg stderr", { chunk: chunk.trim() });
        }
        if (stderr.length > 8192) {
          stderr = stderr.slice(-8192);
        }
      });
      proc.on("close", (code) => {
        this.activeProcess = null;
        if (code === 0) {
          resolve();
        } else if (this.abortController?.signal.aborted) {
          void this.cleanupPartialOutput(item.outputPath);
          const error = new Error("Encoding cancelled");
          error.errorType = "cancelled";
          reject(error);
        } else {
          void this.cleanupPartialOutput(item.outputPath);
          this.logger.error("FFmpeg encoding failed", {
            input: item.inputPath,
            exitCode: code,
            stderr: stderr.slice(-2048)
            // Last 2KB in log
          });
          const errorPatterns = [
            /Error[^\n]*/i,
            /error[^\n]*/i,
            /Invalid[^\n]*/i,
            /No space[^\n]*/i,
            /Unknown encoder[^\n]*/i,
            /Encoder .* not found[^\n]*/i,
            /Option .* not found[^\n]*/i,
            /Unrecognized option[^\n]*/i,
            /Could not[^\n]*/i,
            /Cannot[^\n]*/i
          ];
          let errorMsg = `FFmpeg exited with code ${code}`;
          for (const pattern of errorPatterns) {
            const match = stderr.match(pattern);
            if (match) {
              errorMsg = match[0].trim();
              break;
            }
          }
          const stderrLines = stderr.trim().split("\n").filter((l) => l.trim());
          const lastLines = stderrLines.slice(-3).join(" | ");
          if (lastLines && !errorMsg.includes(lastLines.slice(0, 50))) {
            errorMsg = `${errorMsg} - ${lastLines.slice(0, 200)}`;
          }
          const errorType = classifyError(stderr || errorMsg);
          const error = new Error(errorMsg);
          error.errorType = errorType;
          reject(error);
        }
      });
      proc.on("error", (error) => {
        this.activeProcess = null;
        void this.cleanupPartialOutput(item.outputPath);
        const typedError = error;
        typedError.errorType = classifyError(error.message);
        reject(typedError);
      });
      const abortHandler = () => {
        if ((0, import_node_os2.platform)() === "win32") {
          proc.kill();
        } else {
          proc.kill("SIGTERM");
        }
      };
      if (this.abortController) {
        this.abortController.signal.addEventListener("abort", abortHandler, { once: true });
      }
    });
  }
  /**
   * Determine whether an item should be skipped in fill mode.
   * Fill mode avoids output name conflicts by skipping items that would collide.
   */
  async shouldSkipForFillMode(outputPath) {
    if (!this.activeJob?.config.fillMode)
      return false;
    if (!this.fillModeSeenOutputs) {
      this.fillModeSeenOutputs = /* @__PURE__ */ new Set();
    }
    const normalizedOutput = this.normalizeOutputPath(outputPath);
    if (this.fillModeSeenOutputs.has(normalizedOutput)) {
      return true;
    }
    try {
      await (0, import_promises2.access)(outputPath);
      this.fillModeSeenOutputs.add(normalizedOutput);
      return true;
    } catch {
    }
    this.fillModeSeenOutputs.add(normalizedOutput);
    return false;
  }
  /**
   * Mark an item as skipped and emit a completion event.
   */
  markItemSkipped(item) {
    if (!this.activeJob)
      return;
    item.status = "skipped";
    item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.activeJob.skippedItems++;
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: item.id,
      kind: "item_complete",
      progress: 100,
      status: "skipped"
    });
  }
  normalizeOutputPath(filePath) {
    const normalized = filePath.replace(/\\/g, "/");
    return (0, import_node_os2.platform)() === "win32" ? normalized.toLowerCase() : normalized;
  }
  /**
   * Clean up partial output file on error/cancel
   */
  async cleanupPartialOutput(outputPath) {
    try {
      await (0, import_promises2.unlink)(outputPath);
      this.logger.debug("Cleaned up partial output", { outputPath });
    } catch {
    }
  }
  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes < 1024)
      return `${bytes} B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  /**
   * Parse time string (HH:MM:SS.mmm or HH:MM:SS) to milliseconds
   */
  parseTimeToMs(timeStr) {
    if (!timeStr || typeof timeStr !== "string")
      return null;
    const matchWithMs = timeStr.match(/(\d+):(\d+):(\d+)\.(\d+)/);
    if (matchWithMs) {
      const hours = parseInt(matchWithMs[1], 10);
      const minutes = parseInt(matchWithMs[2], 10);
      const seconds = parseInt(matchWithMs[3], 10);
      const ms = parseInt(matchWithMs[4].padEnd(3, "0").slice(0, 3), 10);
      return (hours * 3600 + minutes * 60 + seconds) * 1e3 + ms;
    }
    const matchNoMs = timeStr.match(/(\d+):(\d+):(\d+)/);
    if (matchNoMs) {
      const hours = parseInt(matchNoMs[1], 10);
      const minutes = parseInt(matchNoMs[2], 10);
      const seconds = parseInt(matchNoMs[3], 10);
      return (hours * 3600 + minutes * 60 + seconds) * 1e3;
    }
    return null;
  }
  /**
   * Build output path for a video, handling duplicates
   * Also handles the case where input and output would be the same file
   */
  buildOutputPath(inputPath, outputDir, config2, relativePath) {
    const inputName = (0, import_node_path4.basename)(inputPath, (0, import_node_path4.extname)(inputPath));
    const extension = config2.container;
    let outputPath;
    if (config2.preserveStructure && relativePath) {
      const relativeDir = (0, import_node_path4.dirname)(relativePath);
      if (relativeDir && relativeDir !== ".") {
        outputPath = (0, import_node_path4.join)(outputDir, relativeDir, `${inputName}.${extension}`);
      } else {
        outputPath = (0, import_node_path4.join)(outputDir, `${inputName}.${extension}`);
      }
    } else {
      outputPath = (0, import_node_path4.join)(outputDir, `${inputName}.${extension}`);
    }
    const normalizedInput = inputPath.toLowerCase().replace(/\\/g, "/");
    const normalizedOutput = outputPath.toLowerCase().replace(/\\/g, "/");
    if (normalizedInput === normalizedOutput) {
      const codecSuffix = config2.codec === "h265" ? ".hevc" : ".av1";
      outputPath = (0, import_node_path4.join)(
        (0, import_node_path4.dirname)(outputPath),
        `${inputName}${codecSuffix}.${extension}`
      );
    }
    return outputPath;
  }
  /**
   * Deduplicate output paths to handle files with same name from different folders
   * Uses a set to track all used paths and finds unique suffixes
   */
  deduplicateOutputPaths(items) {
    const usedPaths = /* @__PURE__ */ new Set();
    for (const item of items) {
      let outputPath = item.outputPath;
      let counter = 1;
      while (usedPaths.has(outputPath)) {
        const ext = (0, import_node_path4.extname)(item.outputPath);
        const base = item.outputPath.slice(0, -ext.length);
        outputPath = `${base}_${counter}${ext}`;
        counter++;
      }
      item.outputPath = outputPath;
      usedPaths.add(outputPath);
    }
  }
  /**
   * Extract a thumbnail from the encoded video
   */
  async extractThumbnail(videoPath, sourceInfo, thumbnailTimestamp) {
    if (this.abortController?.signal.aborted) {
      throw new Error("Thumbnail extraction cancelled");
    }
    const ffmpegPath = resolveBundledBinary("ffmpeg");
    const duration = sourceInfo.duration ?? 10;
    let timestampSec;
    if (thumbnailTimestamp !== void 0) {
      timestampSec = Math.min(thumbnailTimestamp, Math.max(0, duration - 0.1));
    } else {
      timestampSec = Math.min(Math.max(0.5, duration * 0.1), Math.max(0, duration - 0.1));
    }
    const videoDir = (0, import_node_path4.dirname)(videoPath);
    const videoName = (0, import_node_path4.basename)(videoPath, (0, import_node_path4.extname)(videoPath));
    const thumbnailPath = (0, import_node_path4.join)(videoDir, `${videoName}.jpg`);
    return new Promise((resolve, reject) => {
      const args2 = [
        "-ss",
        String(timestampSec),
        "-i",
        videoPath,
        "-vf",
        "scale='min(480,iw)':-2",
        "-vframes",
        "1",
        "-q:v",
        "5",
        "-y",
        thumbnailPath
      ];
      this.logger.debug("Extracting thumbnail", { videoPath, thumbnailPath, timestampSec });
      const proc = (0, import_node_child_process6.spawn)(ffmpegPath, args2, { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      const abortHandler = () => {
        proc.kill();
        void (0, import_promises2.unlink)(thumbnailPath).catch(() => {
        });
      };
      this.abortController?.signal.addEventListener("abort", abortHandler, { once: true });
      proc.on("close", async (code) => {
        this.abortController?.signal.removeEventListener("abort", abortHandler);
        if (this.abortController?.signal.aborted) {
          await (0, import_promises2.unlink)(thumbnailPath).catch(() => {
          });
          reject(new Error("Thumbnail extraction cancelled"));
          return;
        }
        if (code === 0) {
          this.logger.info("Thumbnail extracted", { thumbnailPath });
          resolve(thumbnailPath);
        } else {
          await (0, import_promises2.unlink)(thumbnailPath).catch(() => {
          });
          this.logger.warn("Thumbnail extraction failed", { code, stderr: stderr.slice(-500) });
          reject(new Error(`Thumbnail extraction failed with code ${code}`));
        }
      });
      proc.on("error", async (error) => {
        this.abortController?.signal.removeEventListener("abort", abortHandler);
        await (0, import_promises2.unlink)(thumbnailPath).catch(() => {
        });
        this.logger.warn("Thumbnail extraction error", { error: error.message });
        reject(error);
      });
    });
  }
  /**
   * Extract captions from video using Whisper (bundled or LM Studio)
   * Extracts audio, runs transcription, produces VTT subtitles
   */
  async extractCaptions(videoPath, language) {
    if (this.abortController?.signal.aborted) {
      throw new Error("Caption extraction cancelled");
    }
    const providerSettings = this.whisperProviderGetter?.() ?? { provider: "bundled", endpoint: "" };
    const useLmStudio = providerSettings.provider === "lmstudio";
    if (!useLmStudio) {
      const modelPath = this.whisperModelPathGetter?.();
      if (!modelPath) {
        throw new Error("Whisper model not configured. Please select a model in Settings.");
      }
      try {
        await (0, import_promises2.access)(modelPath);
      } catch {
        throw new Error(`Whisper model not found at: ${modelPath}`);
      }
    }
    const ffmpegPath = resolveBundledBinary("ffmpeg");
    const videoDir = (0, import_node_path4.dirname)(videoPath);
    const videoName = (0, import_node_path4.parse)(videoPath).name;
    const tempAudioName = `${videoName}_whisper_temp`;
    const audioPath = (0, import_node_path4.join)(videoDir, `${tempAudioName}.wav`);
    const vttOutputPath = (0, import_node_path4.join)(videoDir, `${tempAudioName}.vtt`);
    const txtOutputPath = (0, import_node_path4.join)(videoDir, `${tempAudioName}.txt`);
    const finalVttPath = (0, import_node_path4.join)(videoDir, `${videoName}.vtt`);
    this.logger.info("Starting caption extraction", {
      videoPath,
      language,
      provider: useLmStudio ? "lmstudio" : "bundled"
    });
    try {
      await this.extractAudioForWhisper(videoPath, audioPath, ffmpegPath);
      if (useLmStudio) {
        await this.transcribeWithLmStudio(audioPath, finalVttPath, providerSettings.endpoint, language);
        this.logger.info("Caption extraction completed (LM Studio)", { vttPath: finalVttPath });
        return finalVttPath;
      } else {
        const modelPath = this.whisperModelPathGetter?.();
        const useGpu = this.whisperGpuEnabledGetter?.() ?? true;
        this.logger.info("Running Whisper transcription", { audioPath, modelPath, useGpu });
        await this.whisperService.transcribe({
          audioPath,
          modelPath,
          outputDir: videoDir,
          language: language || void 0,
          signal: this.abortController?.signal,
          useGpu,
          onLog: (chunk) => {
            this.logger.debug("Whisper output", { chunk: chunk.trim() });
          }
        });
        try {
          await (0, import_promises2.unlink)(finalVttPath).catch(() => {
          });
          await (0, import_promises2.rename)(vttOutputPath, finalVttPath);
        } catch (renameError) {
          this.logger.warn("Failed to rename VTT file, using temp name", {
            from: vttOutputPath,
            to: finalVttPath,
            error: renameError instanceof Error ? renameError.message : "Unknown"
          });
          this.logger.info("Caption extraction completed", { vttPath: vttOutputPath });
          return vttOutputPath;
        }
        this.logger.info("Caption extraction completed", { vttPath: finalVttPath });
        return finalVttPath;
      }
    } finally {
      await (0, import_promises2.unlink)(audioPath).catch(() => {
      });
      await (0, import_promises2.unlink)(txtOutputPath).catch(() => {
      });
    }
  }
  /**
   * Extract audio from video to WAV format for Whisper transcription
   */
  async extractAudioForWhisper(videoPath, audioPath, ffmpegPath) {
    return new Promise((resolve, reject) => {
      const args2 = [
        "-i",
        videoPath,
        "-vn",
        // No video
        "-acodec",
        "pcm_s16le",
        // 16-bit PCM
        "-ar",
        "16000",
        // 16kHz sample rate (required by Whisper)
        "-ac",
        "1",
        // Mono
        "-y",
        // Overwrite
        audioPath
      ];
      this.logger.debug("Extracting audio for transcription", { args: args2.join(" ") });
      const proc = (0, import_node_child_process6.spawn)(ffmpegPath, args2, { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      const abortHandler = () => {
        proc.kill();
        void (0, import_promises2.unlink)(audioPath).catch(() => {
        });
      };
      this.abortController?.signal.addEventListener("abort", abortHandler, { once: true });
      proc.on("close", (code) => {
        this.abortController?.signal.removeEventListener("abort", abortHandler);
        if (this.abortController?.signal.aborted) {
          void (0, import_promises2.unlink)(audioPath).catch(() => {
          });
          reject(new Error("Caption extraction cancelled"));
          return;
        }
        if (code === 0) {
          resolve();
        } else {
          void (0, import_promises2.unlink)(audioPath).catch(() => {
          });
          if (stderr.includes("does not contain any stream") || stderr.includes("Output file is empty")) {
            reject(new Error("Video has no audio stream"));
          } else {
            reject(new Error(`Audio extraction failed with code ${code}`));
          }
        }
      });
      proc.on("error", (error) => {
        this.abortController?.signal.removeEventListener("abort", abortHandler);
        void (0, import_promises2.unlink)(audioPath).catch(() => {
        });
        reject(error);
      });
    });
  }
  /**
   * Transcribe audio using LM Studio's OpenAI-compatible API
   * Sends audio to the /v1/audio/transcriptions endpoint
   */
  async transcribeWithLmStudio(audioPath, outputVttPath, endpoint, language) {
    const { readFile: readFile2, writeFile: writeFile2 } = await import("node:fs/promises");
    this.logger.info("Transcribing with LM Studio", { endpoint, audioPath });
    const audioData = await readFile2(audioPath);
    const audioBlob = new Blob([audioData], { type: "audio/wav" });
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "whisper-1");
    formData.append("response_format", "vtt");
    if (language) {
      formData.append("language", language);
    }
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      signal: this.abortController?.signal
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`LM Studio transcription failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const vttContent = await response.text();
    await writeFile2(outputVttPath, vttContent, "utf-8");
    this.logger.info("LM Studio transcription completed", { outputVttPath });
  }
  /**
   * Emit progress event
   */
  emitEvent(event) {
    this.onEvent?.(event);
  }
};

// src/cli/ui/tui.ts
var ESC = "\x1B[";
var HIDE_CURSOR = `${ESC}?25l`;
var SHOW_CURSOR = `${ESC}?25h`;
var CLEAR_SCREEN = `${ESC}2J${ESC}H`;
var MOVE_TO = (row, col) => `${ESC}${row};${col}H`;
var CLEAR_LINE = `${ESC}2K`;
var style = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  // Colors
  green: `${ESC}38;5;114m`,
  blue: `${ESC}38;5;75m`,
  cyan: `${ESC}38;5;80m`,
  yellow: `${ESC}38;5;221m`,
  red: `${ESC}38;5;203m`,
  gray: `${ESC}38;5;245m`,
  white: `${ESC}38;5;255m`,
  // Backgrounds
  bgDark: `${ESC}48;5;236m`,
  bgGreen: `${ESC}48;5;114m`,
  bgBlue: `${ESC}48;5;75m`
};
var box = {
  topLeft: "\u256D",
  topRight: "\u256E",
  bottomLeft: "\u2570",
  bottomRight: "\u256F",
  horizontal: "\u2500",
  vertical: "\u2502",
  teeRight: "\u251C",
  teeLeft: "\u2524"
};
var progressChars = {
  filled: "\u2588",
  partial: ["", "\u258F", "\u258E", "\u258D", "\u258C", "\u258B", "\u258A", "\u2589"],
  empty: "\u2591"
};
var TUI = class {
  constructor() {
    this.lastRender = 0;
    this.renderThrottle = 50;
    // ms
    this.isRendering = false;
    this.resizeHandler = null;
    this.cleanupBound = null;
    this.width = Math.min(process.stdout.columns || 60, 70);
    this.state = {
      title: "Drapp Archive",
      currentFile: "",
      currentFileIndex: 0,
      totalFiles: 0,
      fileProgress: 0,
      batchProgress: 0,
      speed: "--",
      fileEta: "--",
      batchEta: "--",
      completed: 0,
      skipped: 0,
      failed: 0,
      savedBytes: 0,
      status: "idle",
      codec: "AV1",
      preset: "archive"
    };
  }
  formatBytes(bytes) {
    if (bytes < 1024)
      return `${bytes} B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  truncate(str, maxLen) {
    if (str.length <= maxLen)
      return str;
    return "..." + str.slice(-(maxLen - 3));
  }
  progressBar(percent, width) {
    const filledWidth = percent / 100 * width;
    const fullBlocks = Math.floor(filledWidth);
    const partialIndex = Math.floor((filledWidth - fullBlocks) * 8);
    const emptyBlocks = width - fullBlocks - (partialIndex > 0 ? 1 : 0);
    return `${style.green}${progressChars.filled.repeat(fullBlocks)}${partialIndex > 0 ? progressChars.partial[partialIndex] : ""}${style.gray}${progressChars.empty.repeat(Math.max(0, emptyBlocks))}${style.reset}`;
  }
  boxTop(width) {
    return `${style.cyan}${box.topLeft}${box.horizontal.repeat(width - 2)}${box.topRight}${style.reset}`;
  }
  boxBottom(width) {
    return `${style.cyan}${box.bottomLeft}${box.horizontal.repeat(width - 2)}${box.bottomRight}${style.reset}`;
  }
  boxLine(content, width) {
    const visibleLen = this.visibleLength(content);
    const padding = Math.max(0, width - 4 - visibleLen);
    return `${style.cyan}${box.vertical}${style.reset} ${content}${" ".repeat(padding)} ${style.cyan}${box.vertical}${style.reset}`;
  }
  boxDivider(width) {
    return `${style.cyan}${box.teeRight}${box.horizontal.repeat(width - 2)}${box.teeLeft}${style.reset}`;
  }
  visibleLength(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, "").length;
  }
  centerText(text, width) {
    const visibleLen = this.visibleLength(text);
    const padding = Math.max(0, Math.floor((width - 4 - visibleLen) / 2));
    return " ".repeat(padding) + text;
  }
  getStatusIcon() {
    switch (this.state.status) {
      case "scanning":
        return `${style.blue}\u25C9${style.reset}`;
      case "analyzing":
        return `${style.yellow}\u25C9${style.reset}`;
      case "encoding":
        return `${style.green}\u25C9${style.reset}`;
      case "complete":
        return `${style.green}\u2713${style.reset}`;
      case "error":
        return `${style.red}\u2717${style.reset}`;
      default:
        return `${style.gray}\u25CB${style.reset}`;
    }
  }
  getStatusText() {
    switch (this.state.status) {
      case "scanning":
        return `${style.blue}Scanning for videos...${style.reset}`;
      case "analyzing":
        return `${style.yellow}Analyzing video...${style.reset}`;
      case "encoding":
        return `${style.green}Encoding${style.reset}`;
      case "complete":
        return `${style.green}${style.bold}All done!${style.reset}`;
      case "error":
        return `${style.red}Error occurred${style.reset}`;
      default:
        return `${style.gray}Ready${style.reset}`;
    }
  }
  render() {
    const now = Date.now();
    if (now - this.lastRender < this.renderThrottle)
      return;
    if (this.isRendering)
      return;
    this.isRendering = true;
    this.lastRender = now;
    const w = this.width;
    const lines = [];
    lines.push("");
    lines.push(this.boxTop(w));
    const badge = `${style.bgBlue}${style.white}${style.bold} ${this.state.codec} ${style.reset}`;
    const title = `${style.bold}${style.white}${this.state.title}${style.reset}`;
    lines.push(this.boxLine(`${title}  ${badge}`, w));
    if (this.state.subtitle) {
      lines.push(this.boxLine(`${style.dim}${this.state.subtitle}${style.reset}`, w));
    }
    lines.push(this.boxDivider(w));
    lines.push(this.boxLine(`${this.getStatusIcon()} ${this.getStatusText()}`, w));
    if (this.state.status === "encoding" || this.state.status === "analyzing") {
      lines.push(this.boxLine("", w));
      const fileNum = `[${this.state.currentFileIndex}/${this.state.totalFiles}]`;
      const fileName = this.truncate(this.state.currentFile, w - 20);
      lines.push(this.boxLine(`${style.dim}File:${style.reset} ${fileName} ${style.gray}${fileNum}${style.reset}`, w));
      const barWidth = w - 24;
      const fileBar = this.progressBar(this.state.fileProgress, barWidth);
      const filePct = `${this.state.fileProgress.toString().padStart(3)}%`;
      lines.push(this.boxLine(`     ${fileBar} ${filePct}`, w));
      lines.push(this.boxLine(
        `     ${style.dim}Speed:${style.reset} ${this.state.speed}  ${style.dim}ETA:${style.reset} ${this.state.fileEta}`,
        w
      ));
      lines.push(this.boxLine("", w));
      lines.push(this.boxLine(`${style.dim}Overall Progress${style.reset}`, w));
      const batchBar = this.progressBar(this.state.batchProgress, barWidth);
      const batchPct = `${this.state.batchProgress.toString().padStart(3)}%`;
      lines.push(this.boxLine(`     ${batchBar} ${batchPct}`, w));
      lines.push(this.boxLine(`     ${style.dim}Remaining:${style.reset} ${this.state.batchEta}`, w));
    }
    lines.push(this.boxDivider(w));
    const statsLine = `${style.green}\u2713 ${this.state.completed}${style.reset}  ${style.yellow}\u25CB ${this.state.skipped}${style.reset}  ${style.red}\u2717 ${this.state.failed}${style.reset}  ${style.dim}\u2502${style.reset}  ${style.cyan}Saved: ${this.formatBytes(this.state.savedBytes)}${style.reset}`;
    lines.push(this.boxLine(statsLine, w));
    lines.push(this.boxBottom(w));
    lines.push("");
    process.stdout.write(HIDE_CURSOR);
    process.stdout.write(MOVE_TO(1, 1));
    for (const line of lines) {
      process.stdout.write(CLEAR_LINE + line + "\n");
    }
    this.isRendering = false;
  }
  update(partial) {
    this.state = { ...this.state, ...partial };
    this.render();
  }
  start() {
    process.stdout.write(CLEAR_SCREEN);
    process.stdout.write(HIDE_CURSOR);
    this.render();
    this.resizeHandler = () => {
      this.width = Math.min(process.stdout.columns || 60, 70);
      process.stdout.write(CLEAR_SCREEN);
      this.render();
    };
    process.stdout.on("resize", this.resizeHandler);
    this.cleanupBound = () => this.cleanup();
    process.on("SIGINT", this.cleanupBound);
    process.on("SIGTERM", this.cleanupBound);
    process.on("exit", this.cleanupBound);
  }
  cleanup() {
    process.stdout.write(SHOW_CURSOR);
  }
  stop() {
    this.cleanup();
    if (this.resizeHandler) {
      process.stdout.removeListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.cleanupBound) {
      process.removeListener("SIGINT", this.cleanupBound);
      process.removeListener("SIGTERM", this.cleanupBound);
      process.removeListener("exit", this.cleanupBound);
      this.cleanupBound = null;
    }
  }
  // Print a message below the TUI
  log(message) {
    console.log(message);
  }
};
function printWelcome(codec, preset) {
  console.log(`
${style.cyan}\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E${style.reset}
${style.cyan}\u2502${style.reset}  ${style.bold}${style.white}Drapp Archive${style.reset}                         ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.dim}Video encoding made simple${style.reset}              ${style.cyan}\u2502${style.reset}
${style.cyan}\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524${style.reset}
${style.cyan}\u2502${style.reset}  Codec: ${style.green}${codec.toUpperCase().padEnd(8)}${style.reset}  Preset: ${style.green}${preset.padEnd(8)}${style.reset}  ${style.cyan}\u2502${style.reset}
${style.cyan}\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F${style.reset}
`);
}
function printError(message, hint) {
  console.log(`
${style.red}\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E${style.reset}
${style.red}\u2502${style.reset}  ${style.red}${style.bold}Oops! Something went wrong${style.reset}              ${style.red}\u2502${style.reset}
${style.red}\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524${style.reset}
${style.red}\u2502${style.reset}  ${message.slice(0, 40).padEnd(40)} ${style.red}\u2502${style.reset}
${hint ? `${style.red}\u2502${style.reset}  ${style.dim}${hint.slice(0, 40).padEnd(40)}${style.reset} ${style.red}\u2502${style.reset}
` : ""}${style.red}\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F${style.reset}
`);
}
function printSummary(completed, skipped, failed, savedBytes) {
  const formatBytes = (bytes) => {
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };
  const total = completed + skipped + failed;
  const successRate = total > 0 ? Math.round(completed / total * 100) : 0;
  console.log(`
${style.green}\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E${style.reset}
${style.green}\u2502${style.reset}  ${style.green}${style.bold}\u2713 Encoding Complete!${style.reset}                    ${style.green}\u2502${style.reset}
${style.green}\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524${style.reset}
${style.green}\u2502${style.reset}  ${style.green}Completed:${style.reset}  ${completed.toString().padEnd(6)}  ${style.dim}(${successRate}% success)${style.reset}     ${style.green}\u2502${style.reset}
${style.green}\u2502${style.reset}  ${style.yellow}Skipped:${style.reset}    ${skipped.toString().padEnd(6)}                      ${style.green}\u2502${style.reset}
${style.green}\u2502${style.reset}  ${style.red}Failed:${style.reset}     ${failed.toString().padEnd(6)}                      ${style.green}\u2502${style.reset}
${style.green}\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524${style.reset}
${style.green}\u2502${style.reset}  ${style.cyan}Space Saved:${style.reset} ${formatBytes(savedBytes).padEnd(27)} ${style.green}\u2502${style.reset}
${style.green}\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F${style.reset}
`);
}

// src/cli/ui/browser.ts
var import_promises3 = require("node:fs/promises");
var import_node_path5 = require("node:path");
var import_node_os3 = require("node:os");
var import_node_readline = require("node:readline");
var VIDEO_EXTENSIONS = /* @__PURE__ */ new Set([
  ".mp4",
  ".mkv",
  ".mov",
  ".webm",
  ".avi",
  ".m4v",
  ".ts",
  ".mts",
  ".m2ts",
  ".flv",
  ".wmv"
]);
var ESC2 = "\x1B[";
var CLEAR_SCREEN2 = `${ESC2}2J${ESC2}H`;
var HIDE_CURSOR2 = `${ESC2}?25l`;
var SHOW_CURSOR2 = `${ESC2}?25h`;
var MOVE_TO2 = (row, col) => `${ESC2}${row};${col}H`;
var CLEAR_LINE2 = `${ESC2}2K`;
function formatSize(bytes) {
  if (bytes < 1024)
    return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
async function getEntries(dirPath) {
  const entries = [];
  try {
    const items = await (0, import_promises3.readdir)(dirPath, { withFileTypes: true });
    if (dirPath !== "/") {
      entries.push({
        name: "..",
        path: (0, import_node_path5.dirname)(dirPath),
        isDirectory: true,
        isVideo: false
      });
    }
    const dirs = [];
    const files = [];
    for (const item of items) {
      if (item.name.startsWith("."))
        continue;
      const fullPath = (0, import_node_path5.join)(dirPath, item.name);
      if (item.isDirectory()) {
        dirs.push({
          name: item.name,
          path: fullPath,
          isDirectory: true,
          isVideo: false
        });
      } else {
        const ext = (0, import_node_path5.extname)(item.name).toLowerCase();
        const isVideo = VIDEO_EXTENSIONS.has(ext);
        try {
          const stats = await (0, import_promises3.stat)(fullPath);
          files.push({
            name: item.name,
            path: fullPath,
            isDirectory: false,
            isVideo,
            size: stats.size
          });
        } catch {
        }
      }
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    entries.push(...dirs, ...files);
  } catch {
    if (dirPath !== "/") {
      entries.push({
        name: "..",
        path: (0, import_node_path5.dirname)(dirPath),
        isDirectory: true,
        isVideo: false
      });
    }
  }
  return entries;
}
function renderBrowser(state, height) {
  const width = Math.min(process.stdout.columns || 80, 100);
  const listHeight = height - 10;
  process.stdout.write(MOVE_TO2(1, 1));
  const modeText = state.mode === "select-input" ? "Select Input (files or folder)" : "Select Output Folder";
  console.log(CLEAR_LINE2 + `${style.cyan}\u256D${"\u2500".repeat(width - 2)}\u256E${style.reset}`);
  console.log(CLEAR_LINE2 + `${style.cyan}\u2502${style.reset} ${style.bold}${modeText}${style.reset}${" ".repeat(width - 4 - modeText.length)} ${style.cyan}\u2502${style.reset}`);
  console.log(CLEAR_LINE2 + `${style.cyan}\u251C${"\u2500".repeat(width - 2)}\u2524${style.reset}`);
  const pathDisplay = state.currentPath.length > width - 10 ? "..." + state.currentPath.slice(-(width - 13)) : state.currentPath;
  console.log(CLEAR_LINE2 + `${style.cyan}\u2502${style.reset} ${style.dim}${pathDisplay}${style.reset}${" ".repeat(Math.max(0, width - 4 - pathDisplay.length))} ${style.cyan}\u2502${style.reset}`);
  console.log(CLEAR_LINE2 + `${style.cyan}\u251C${"\u2500".repeat(width - 2)}\u2524${style.reset}`);
  const visibleEntries = state.entries.slice(state.scrollOffset, state.scrollOffset + listHeight);
  for (let i = 0; i < listHeight; i++) {
    const entry = visibleEntries[i];
    const absoluteIndex = state.scrollOffset + i;
    if (entry) {
      const isSelected = absoluteIndex === state.selectedIndex;
      const isChecked = state.selectedFiles.has(entry.path);
      let icon = "  ";
      let nameStyle = "";
      if (entry.isDirectory) {
        icon = `${style.blue}/${style.reset} `;
        nameStyle = style.blue;
      } else if (entry.isVideo) {
        icon = `${style.green}>${style.reset} `;
        nameStyle = style.green;
      } else {
        icon = "  ";
        nameStyle = style.dim;
      }
      const checkbox = state.mode === "select-input" ? isChecked ? `${style.green}[x]${style.reset} ` : `${style.dim}[ ]${style.reset} ` : "";
      const cursor = isSelected ? `${style.bgDark}` : "";
      const cursorEnd = isSelected ? `${style.reset}` : "";
      const sizeStr = entry.size ? ` ${style.dim}${formatSize(entry.size)}${style.reset}` : "";
      const maxNameLen = width - 20 - (entry.size ? 10 : 0);
      const displayName = entry.name.length > maxNameLen ? entry.name.slice(0, maxNameLen - 3) + "..." : entry.name;
      const line = `${cursor}${checkbox}${icon}${nameStyle}${displayName}${style.reset}${sizeStr}${cursorEnd}`;
      const visibleLen = displayName.length + (entry.size ? formatSize(entry.size).length + 1 : 0) + 4 + (state.mode === "select-input" ? 4 : 0);
      const padding = Math.max(0, width - 4 - visibleLen);
      console.log(CLEAR_LINE2 + `${style.cyan}\u2502${style.reset} ${line}${" ".repeat(padding)} ${style.cyan}\u2502${style.reset}`);
    } else {
      console.log(CLEAR_LINE2 + `${style.cyan}\u2502${style.reset}${" ".repeat(width - 2)}${style.cyan}\u2502${style.reset}`);
    }
  }
  console.log(CLEAR_LINE2 + `${style.cyan}\u251C${"\u2500".repeat(width - 2)}\u2524${style.reset}`);
  if (state.mode === "select-input" && state.selectedFiles.size > 0) {
    const countText = `${state.selectedFiles.size} item(s) selected`;
    console.log(CLEAR_LINE2 + `${style.cyan}\u2502${style.reset} ${style.green}${countText}${style.reset}${" ".repeat(width - 4 - countText.length)} ${style.cyan}\u2502${style.reset}`);
  } else {
    console.log(CLEAR_LINE2 + `${style.cyan}\u2502${style.reset}${" ".repeat(width - 2)}${style.cyan}\u2502${style.reset}`);
  }
  const controls = state.mode === "select-input" ? "[\u2191\u2193] Navigate  [Space] Select  [Enter] Confirm  [a] Select All Videos  [q] Cancel" : "[\u2191\u2193] Navigate  [Enter] Select Folder  [n] New Folder  [q] Cancel";
  const controlsDisplay = controls.length > width - 4 ? controls.slice(0, width - 7) + "..." : controls;
  console.log(CLEAR_LINE2 + `${style.cyan}\u2502${style.reset} ${style.dim}${controlsDisplay}${style.reset}${" ".repeat(Math.max(0, width - 4 - controlsDisplay.length))} ${style.cyan}\u2502${style.reset}`);
  console.log(CLEAR_LINE2 + `${style.cyan}\u2570${"\u2500".repeat(width - 2)}\u256F${style.reset}`);
  if (state.message) {
    console.log(CLEAR_LINE2 + `
${state.message}`);
  }
}
async function browseForInput(startPath) {
  return browse(startPath || (0, import_node_os3.homedir)(), "select-input");
}
async function browseForOutput(startPath) {
  return browse(startPath || (0, import_node_os3.homedir)(), "select-output");
}
async function browse(startPath, mode) {
  const state = {
    currentPath: startPath,
    entries: await getEntries(startPath),
    selectedIndex: 0,
    selectedFiles: /* @__PURE__ */ new Set(),
    scrollOffset: 0,
    mode,
    message: void 0
  };
  const height = process.stdout.rows || 24;
  process.stdout.write(CLEAR_SCREEN2);
  process.stdout.write(HIDE_CURSOR2);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  return new Promise((resolve) => {
    const cleanup = () => {
      process.stdout.write(SHOW_CURSOR2);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.removeListener("data", onKeypress);
      process.stdin.pause();
    };
    const onKeypress = async (key) => {
      const keyStr = key.toString();
      const listHeight = height - 10;
      if (keyStr === "" || keyStr === "q") {
        cleanup();
        resolve({ cancelled: true, paths: [] });
        return;
      }
      if (keyStr === "\x1B[A" || keyStr === "k") {
        if (state.selectedIndex > 0) {
          state.selectedIndex--;
          if (state.selectedIndex < state.scrollOffset) {
            state.scrollOffset = state.selectedIndex;
          }
        }
      } else if (keyStr === "\x1B[B" || keyStr === "j") {
        if (state.selectedIndex < state.entries.length - 1) {
          state.selectedIndex++;
          if (state.selectedIndex >= state.scrollOffset + listHeight) {
            state.scrollOffset = state.selectedIndex - listHeight + 1;
          }
        }
      } else if (keyStr === " " && mode === "select-input") {
        const entry = state.entries[state.selectedIndex];
        if (entry && entry.name !== "..") {
          if (state.selectedFiles.has(entry.path)) {
            state.selectedFiles.delete(entry.path);
          } else {
            state.selectedFiles.add(entry.path);
          }
        }
      } else if (keyStr === "a" && mode === "select-input") {
        for (const entry of state.entries) {
          if (entry.isVideo) {
            state.selectedFiles.add(entry.path);
          }
        }
        state.message = `${style.green}Selected all videos in this folder${style.reset}`;
        setTimeout(() => {
          state.message = void 0;
          renderBrowser(state, height);
        }, 1500);
      } else if (keyStr === "\r" || keyStr === "\n") {
        const entry = state.entries[state.selectedIndex];
        if (entry?.isDirectory) {
          state.currentPath = entry.path;
          state.entries = await getEntries(entry.path);
          state.selectedIndex = 0;
          state.scrollOffset = 0;
        } else if (mode === "select-input") {
          if (state.selectedFiles.size > 0) {
            cleanup();
            resolve({ cancelled: false, paths: Array.from(state.selectedFiles) });
            return;
          } else if (entry && !entry.isDirectory) {
            cleanup();
            resolve({ cancelled: false, paths: [entry.path] });
            return;
          }
        }
        if (mode === "select-output") {
          cleanup();
          resolve({ cancelled: false, paths: [state.currentPath] });
          return;
        }
      } else if (keyStr === "n" && mode === "select-output") {
        cleanup();
        const rl = (0, import_node_readline.createInterface)({
          input: process.stdin,
          output: process.stdout
        });
        rl.question("New folder name: ", async (name) => {
          rl.close();
          if (name && name.trim()) {
            const newPath = (0, import_node_path5.join)(state.currentPath, name.trim());
            resolve({ cancelled: false, paths: [newPath] });
          } else {
            const result = await browse(state.currentPath, mode);
            resolve(result);
          }
        });
        return;
      } else if (keyStr === "g") {
        state.currentPath = (0, import_node_os3.homedir)();
        state.entries = await getEntries(state.currentPath);
        state.selectedIndex = 0;
        state.scrollOffset = 0;
      }
      renderBrowser(state, height);
    };
    process.stdin.on("data", onKeypress);
    renderBrowser(state, height);
  });
}
function confirm(message) {
  const rl = (0, import_node_readline.createInterface)({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}
function prompt(message, defaultValue) {
  const rl = (0, import_node_readline.createInterface)({
    input: process.stdin,
    output: process.stdout
  });
  const displayDefault = defaultValue ? ` [${defaultValue}]` : "";
  return new Promise((resolve) => {
    rl.question(`${message}${displayDefault}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}
async function menu(title, options) {
  console.log(`
${style.bold}${title}${style.reset}
`);
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    console.log(`  ${style.cyan}${i + 1}.${style.reset} ${opt.label}`);
    if (opt.description) {
      console.log(`     ${style.dim}${opt.description}${style.reset}`);
    }
  }
  console.log();
  const answer = await prompt("Select option", "1");
  const index = parseInt(answer, 10) - 1;
  if (index >= 0 && index < options.length) {
    return options[index].value;
  }
  return options[0].value;
}

// src/cli/ui/wizard.ts
function clearScreen() {
  process.stdout.write("\x1B[2J\x1B[H");
}
function printSection(title) {
  console.log(`
${style.cyan}\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500${style.reset}`);
  console.log(`${style.bold}${title}${style.reset}`);
  console.log(`${style.cyan}\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500${style.reset}
`);
}
async function runWizard() {
  clearScreen();
  console.log(`
${style.cyan}\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E${style.reset}
${style.cyan}\u2502${style.reset}                                                  ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.bold}Welcome to Drapp Archive${style.reset}                       ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.dim}Video encoding made simple${style.reset}                      ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}                                                  ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  This wizard will help you:                      ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.green}1.${style.reset} Select videos to encode                     ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.green}2.${style.reset} Choose where to save them                   ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.green}3.${style.reset} Pick encoding settings                      ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}                                                  ${style.cyan}\u2502${style.reset}
${style.cyan}\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F${style.reset}
`);
  const proceed = await confirm("Ready to begin?");
  if (!proceed) {
    return { cancelled: true, inputPaths: [], outputPath: "", options: {} };
  }
  printSection("Step 1: Select Videos");
  console.log("Choose how to select your videos:\n");
  const inputMethod = await menu("Input method", [
    { label: "Browse files", value: "browse", description: "Navigate and select individual files" },
    { label: "Enter path", value: "path", description: "Type or paste a file/folder path" },
    { label: "Current folder", value: "current", description: "Encode all videos in current directory" }
  ]);
  let inputPaths = [];
  if (inputMethod === "browse") {
    const result = await browseForInput();
    if (result.cancelled) {
      return { cancelled: true, inputPaths: [], outputPath: "", options: {} };
    }
    inputPaths = result.paths;
  } else if (inputMethod === "path") {
    clearScreen();
    printSection("Step 1: Select Videos");
    const path = await prompt("Enter path to video file or folder");
    if (!path) {
      return { cancelled: true, inputPaths: [], outputPath: "", options: {} };
    }
    inputPaths = [path];
  } else {
    inputPaths = [process.cwd()];
  }
  clearScreen();
  console.log(`
${style.green}\u2713${style.reset} Selected ${inputPaths.length} item(s)`);
  if (inputPaths.length <= 3) {
    for (const p of inputPaths) {
      console.log(`  ${style.dim}${p}${style.reset}`);
    }
  }
  printSection("Step 2: Choose Output Location");
  console.log("Where should the encoded videos be saved?\n");
  const outputMethod = await menu("Output location", [
    { label: "Browse folders", value: "browse", description: "Navigate to select a folder" },
    { label: "Enter path", value: "path", description: "Type or paste a folder path" },
    { label: "Same as input", value: "same", description: "Save alongside original files" }
  ]);
  let outputPath;
  if (outputMethod === "browse") {
    const result = await browseForOutput();
    if (result.cancelled) {
      return { cancelled: true, inputPaths: [], outputPath: "", options: {} };
    }
    outputPath = result.paths[0];
  } else if (outputMethod === "path") {
    clearScreen();
    printSection("Step 2: Choose Output Location");
    const path = await prompt("Enter output folder path");
    if (!path) {
      return { cancelled: true, inputPaths: [], outputPath: "", options: {} };
    }
    outputPath = path;
  } else {
    outputPath = inputPaths[0];
  }
  clearScreen();
  console.log(`
${style.green}\u2713${style.reset} Output: ${outputPath}`);
  printSection("Step 3: Encoding Settings");
  console.log("How would you like to configure encoding?\n");
  const configMode = await menu("Configuration", [
    { label: "Quick (Recommended)", value: "quick", description: "Just choose quality level, we handle the rest" },
    { label: "Standard", value: "standard", description: "Choose codec and basic settings" },
    { label: "Advanced", value: "advanced", description: "Full control over all settings" }
  ]);
  const options = {
    codec: "av1",
    preset: "archive",
    resolution: "source",
    container: "mkv",
    av1Encoder: "libsvtav1",
    av1Preset: 6,
    filmGrain: 10,
    h265Preset: "medium",
    audioCopy: true,
    audioCodec: "aac",
    audioBitrate: 160,
    twoPass: false,
    overwrite: false,
    deleteIfLarger: true,
    deleteOriginal: false,
    simple: false
  };
  if (configMode === "quick") {
    clearScreen();
    printSection("Quick Setup");
    const quality = await menu("Quality vs Speed", [
      { label: "Balanced (Recommended)", value: "balanced", description: "Good compression, reasonable speed" },
      { label: "Maximum Compression", value: "max", description: "Smallest files, slowest encoding" },
      { label: "Fast", value: "fast", description: "Quick encoding, larger files" }
    ]);
    if (quality === "max") {
      options.preset = "max-compression";
    } else if (quality === "fast") {
      options.preset = "fast";
    }
  } else if (configMode === "standard") {
    clearScreen();
    printSection("Standard Setup");
    options.codec = await menu("Video Codec", [
      { label: "AV1 (Recommended)", value: "av1", description: "Best compression, modern codec" },
      { label: "H.265/HEVC", value: "h265", description: "Wide compatibility, good compression" }
    ]);
    options.preset = await menu("Quality Preset", [
      { label: "Archive (Recommended)", value: "archive", description: "Balanced quality and size" },
      { label: "Maximum Compression", value: "max-compression", description: "Smallest files" },
      { label: "Fast", value: "fast", description: "Quick encoding" }
    ]);
    console.log();
    const changeRes = await confirm("Resize videos? (default: keep original)");
    if (changeRes) {
      options.resolution = await menu("Target Resolution", [
        { label: "Keep Original", value: "source" },
        { label: "4K (2160p)", value: "4k" },
        { label: "1440p", value: "1440p" },
        { label: "1080p", value: "1080p" },
        { label: "720p", value: "720p" }
      ]);
    }
  } else {
    clearScreen();
    printSection("Advanced Setup");
    options.codec = await menu("Video Codec", [
      { label: "AV1", value: "av1" },
      { label: "H.265/HEVC", value: "h265" }
    ]);
    if (options.codec === "av1") {
      console.log(`
${style.bold}AV1 Settings${style.reset}
`);
      options.av1Encoder = await menu("AV1 Encoder", [
        { label: "SVT-AV1 (Recommended)", value: "libsvtav1", description: "Fast, good quality" },
        { label: "libaom-av1", value: "libaom-av1", description: "Reference encoder, slower" }
      ]);
      const presetStr = await prompt("Speed preset (0-13 for SVT, lower=slower/better)", "6");
      options.av1Preset = parseInt(presetStr, 10) || 6;
      const crfStr = await prompt("CRF (0-63, lower=better quality, leave empty for preset default)", "");
      if (crfStr) {
        options.av1Crf = parseInt(crfStr, 10);
      }
      const grainStr = await prompt("Film grain synthesis (0-50, 0=off)", "10");
      options.filmGrain = parseInt(grainStr, 10) || 0;
    } else {
      console.log(`
${style.bold}H.265 Settings${style.reset}
`);
      options.h265Preset = await menu("Speed Preset", [
        { label: "medium (Recommended)", value: "medium" },
        { label: "slow (Better quality)", value: "slow" },
        { label: "fast (Quicker)", value: "fast" },
        { label: "veryslow (Best quality)", value: "veryslow" }
      ]);
      const crfStr = await prompt("CRF (0-51, lower=better quality, leave empty for default)", "");
      if (crfStr) {
        options.h265Crf = parseInt(crfStr, 10);
      }
      const tune = await menu("Tune (optimize for content type)", [
        { label: "None (Default)", value: "" },
        { label: "Film", value: "film", description: "For live action content" },
        { label: "Animation", value: "animation", description: "For animated content" },
        { label: "Grain", value: "grain", description: "For grainy/noisy video" }
      ]);
      if (tune) {
        options.h265Tune = tune;
      }
    }
    console.log();
    options.resolution = await menu("Target Resolution", [
      { label: "Keep Original", value: "source" },
      { label: "4K (2160p)", value: "4k" },
      { label: "1440p", value: "1440p" },
      { label: "1080p", value: "1080p" },
      { label: "720p", value: "720p" },
      { label: "480p", value: "480p" }
    ]);
    options.container = await menu("Output Container", [
      { label: "MKV (Recommended)", value: "mkv", description: "Best compatibility with AV1" },
      { label: "MP4", value: "mp4", description: "Wide device support" },
      { label: "WebM", value: "webm", description: "Web optimized" }
    ]);
    console.log(`
${style.bold}Audio Settings${style.reset}
`);
    options.audioCopy = await confirm("Copy audio without re-encoding? (recommended)");
    if (!options.audioCopy) {
      options.audioCodec = await menu("Audio Codec", [
        { label: "AAC", value: "aac" },
        { label: "Opus", value: "opus" },
        { label: "FLAC (Lossless)", value: "flac" }
      ]);
      const bitrateStr = await prompt("Audio bitrate (kbps)", "160");
      options.audioBitrate = parseInt(bitrateStr, 10) || 160;
    }
    console.log(`
${style.bold}Other Options${style.reset}
`);
    options.twoPass = await confirm("Enable two-pass encoding? (better quality, slower)");
    options.overwrite = await confirm("Overwrite existing output files?");
    options.deleteIfLarger = await confirm("Delete output if larger than input? (recommended)");
  }
  clearScreen();
  printSection("Summary");
  console.log(`${style.bold}Input:${style.reset}`);
  if (inputPaths.length === 1) {
    console.log(`  ${inputPaths[0]}`);
  } else {
    console.log(`  ${inputPaths.length} items selected`);
  }
  console.log(`
${style.bold}Output:${style.reset}`);
  console.log(`  ${outputPath}`);
  console.log(`
${style.bold}Settings:${style.reset}`);
  console.log(`  Codec: ${style.cyan}${options.codec.toUpperCase()}${style.reset}`);
  console.log(`  Quality: ${style.cyan}${options.preset}${style.reset}`);
  console.log(`  Resolution: ${style.cyan}${options.resolution}${style.reset}`);
  console.log(`  Container: ${style.cyan}${options.container}${style.reset}`);
  console.log(`  Audio: ${style.cyan}${options.audioCopy ? "copy" : options.audioCodec}${style.reset}`);
  console.log();
  const confirmed = await confirm("Start encoding?");
  if (!confirmed) {
    return { cancelled: true, inputPaths: [], outputPath: "", options: {} };
  }
  return {
    cancelled: false,
    inputPaths,
    outputPath,
    options
  };
}

// src/cli/commands/archive.ts
var VIDEO_EXTENSIONS2 = /* @__PURE__ */ new Set([
  ".mp4",
  ".mkv",
  ".mov",
  ".webm",
  ".avi",
  ".m4v",
  ".ts",
  ".mts",
  ".m2ts",
  ".flv",
  ".wmv"
]);
async function findVideoFiles(rootPath, basePath = rootPath) {
  const files = [];
  const ignoredDirs = /* @__PURE__ */ new Set([".drapp", ".git", "node_modules", "$RECYCLE.BIN", "System Volume Information"]);
  async function walk(dir) {
    try {
      const entries = await (0, import_promises4.readdir)(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = (0, import_node_path6.join)(dir, entry.name);
        if (entry.isDirectory()) {
          if (ignoredDirs.has(entry.name) || entry.name.startsWith(".")) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = (0, import_node_path6.extname)(entry.name).toLowerCase();
          if (VIDEO_EXTENSIONS2.has(ext)) {
            files.push({
              absolutePath: fullPath,
              relativePath: (0, import_node_path6.relative)(basePath, fullPath)
            });
          }
        }
      }
    } catch {
    }
  }
  await walk(rootPath);
  return files;
}
function createTUIProgressHandler(tui, fileNames, tracker) {
  return (event) => {
    switch (event.kind) {
      case "item_start":
        tui.update({
          status: "analyzing",
          currentFile: fileNames[event.processedItems ?? 0] || "Unknown",
          currentFileIndex: (event.processedItems ?? 0) + 1,
          fileProgress: 0
        });
        break;
      case "item_progress":
        tui.update({
          status: "encoding",
          fileProgress: event.progress ?? 0,
          batchProgress: event.batchProgress ?? 0,
          speed: event.encodingSpeed ? formatSpeed(event.encodingSpeed) : "--",
          fileEta: event.itemEtaSeconds !== void 0 ? formatEta(event.itemEtaSeconds) : "--",
          batchEta: event.batchEtaSeconds !== void 0 ? formatEta(event.batchEtaSeconds) : "--",
          currentFileIndex: (event.processedItems ?? 0) + 1
        });
        break;
      case "item_complete":
        if (event.status === "completed") {
          tracker.completed++;
          if (event.outputSize && event.compressionRatio && event.compressionRatio > 1) {
            const inputSize = event.outputSize * event.compressionRatio;
            tracker.savedBytes += inputSize - event.outputSize;
          }
          tui.update({
            completed: tracker.completed,
            savedBytes: tracker.savedBytes,
            fileProgress: 100
          });
        } else if (event.status === "skipped") {
          tracker.skipped++;
          tui.update({ skipped: tracker.skipped });
        }
        break;
      case "item_error":
        tracker.failed++;
        tui.update({ failed: tracker.failed });
        break;
      case "batch_complete":
        tui.update({
          status: "complete",
          batchProgress: 100,
          fileProgress: 100
        });
        break;
    }
  };
}
function createSimpleProgressHandler() {
  let lastUpdate = 0;
  return (event) => {
    const now = Date.now();
    if (now - lastUpdate < 200 && event.kind === "item_progress") {
      return;
    }
    lastUpdate = now;
    switch (event.kind) {
      case "item_start":
        console.log(`
${style.cyan}\u2192${style.reset} Starting video...`);
        break;
      case "item_progress":
        if (event.progress !== void 0) {
          const progress = event.progress;
          const speed = event.encodingSpeed ? formatSpeed(event.encodingSpeed) : "--";
          const eta = event.itemEtaSeconds !== void 0 ? formatEta(event.itemEtaSeconds) : "--";
          process.stdout.write(`\r  Progress: ${progress}%  Speed: ${speed}  ETA: ${eta}    `);
        }
        break;
      case "item_complete":
        process.stdout.write("\r\x1B[K");
        if (event.status === "completed") {
          console.log(`  ${style.green}\u2713${style.reset} Completed`);
        } else if (event.status === "skipped") {
          console.log(`  ${style.yellow}\u25CB${style.reset} Skipped`);
        }
        break;
      case "item_error":
        process.stdout.write("\r\x1B[K");
        console.log(`  ${style.red}\u2717${style.reset} Failed: ${event.error || "Unknown error"}`);
        break;
      case "batch_complete":
        console.log(`
${style.green}\u2713 Batch complete${style.reset}`);
        break;
    }
  };
}
var archiveCommand = new Command("archive").description("Batch encode videos using AV1 or H.265").argument("[input]", "Input file or directory (optional with --interactive)").argument("[output]", "Output directory (optional with --interactive)").option("-i, --interactive", "Launch interactive wizard to select files and configure settings", false).option("-c, --codec <codec>", "Codec: av1 or h265", "av1").option("-p, --preset <preset>", "Quality preset: archive, max-compression, or fast", "archive").option("--container <format>", "Container: mkv, mp4, or webm", "mkv").option("--resolution <res>", "Target resolution: source, 4k, 1440p, 1080p, 720p, 480p, 360p", "source").option("--av1-encoder <encoder>", "AV1 encoder: libsvtav1 (fast) or libaom-av1 (quality)", "libsvtav1").option("--av1-preset <number>", "AV1 speed preset: 0-13 for SVT, 0-8 for libaom (lower=slower/better)", "6").option("--av1-crf <number>", "AV1 CRF value: 0-63 (lower=better quality)").option("--film-grain <number>", "Film grain synthesis: 0-50 (0=off, helps with noisy video)", "10").option("--h265-preset <preset>", "H.265 speed: ultrafast,superfast,veryfast,faster,fast,medium,slow,slower,veryslow", "medium").option("--h265-crf <number>", "H.265 CRF value: 0-51 (lower=better quality)").option("--h265-tune <tune>", "H.265 tune: film, animation, grain, fastdecode, zerolatency").option("--h265-bframes <number>", "H.265 B-frames: 0-16", "4").option("--audio-copy", "Copy audio without re-encoding (default)", true).option("--no-audio-copy", "Re-encode audio").option("--audio-codec <codec>", "Audio codec if re-encoding: opus, aac, flac", "aac").option("--audio-bitrate <kbps>", "Audio bitrate in kbps", "160").option("--two-pass", "Enable two-pass encoding (better quality, slower)", false).option("--threads <number>", "Limit encoder threads: 0, 4, or 6 (0=unlimited)", "0").option("--overwrite", "Overwrite existing output files", false).option("--fill-mode", "Skip files that would conflict with existing outputs", false).option("--preserve-structure", "Preserve folder structure from input", false).option("--delete-if-larger", "Delete output if larger than input", true).option("--no-delete-if-larger", "Keep output even if larger than input").option("--delete-original", "Delete original files after successful encoding (DANGEROUS)", false).option("--thumbnail", "Extract thumbnail from encoded video", false).option("--captions", "Extract captions using Whisper transcription", false).option("--caption-lang <lang>", "Language for captions: en, es, auto, etc.", "auto").option("--simple", "Use simple text output instead of visual interface", false).action(async (input, output, options) => {
  if (options.interactive || !input && !output) {
    if (!process.stdout.isTTY) {
      console.error(`${style.red}Error:${style.reset} Interactive mode requires a terminal`);
      process.exit(1);
    }
    const wizardResult = await runWizard();
    if (wizardResult.cancelled) {
      console.log(`
${style.yellow}Cancelled${style.reset}`);
      process.exit(0);
    }
    input = wizardResult.inputPaths[0];
    output = wizardResult.outputPath;
    options = {
      ...options,
      codec: wizardResult.options.codec,
      preset: wizardResult.options.preset,
      resolution: wizardResult.options.resolution,
      container: wizardResult.options.container,
      av1Encoder: wizardResult.options.av1Encoder,
      av1Preset: String(wizardResult.options.av1Preset),
      av1Crf: wizardResult.options.av1Crf ? String(wizardResult.options.av1Crf) : void 0,
      filmGrain: String(wizardResult.options.filmGrain),
      h265Preset: wizardResult.options.h265Preset,
      h265Crf: wizardResult.options.h265Crf ? String(wizardResult.options.h265Crf) : void 0,
      h265Tune: wizardResult.options.h265Tune,
      audioCopy: wizardResult.options.audioCopy,
      audioCodec: wizardResult.options.audioCodec,
      audioBitrate: String(wizardResult.options.audioBitrate),
      twoPass: wizardResult.options.twoPass,
      overwrite: wizardResult.options.overwrite,
      deleteIfLarger: wizardResult.options.deleteIfLarger,
      deleteOriginal: wizardResult.options.deleteOriginal,
      simple: wizardResult.options.simple
    };
    if (wizardResult.inputPaths.length > 1) {
      options._wizardInputPaths = wizardResult.inputPaths;
    }
  }
  if (!input || !output) {
    console.error(`${style.red}Error:${style.reset} Input and output paths are required`);
    console.log(`
Usage: drapp archive <input> <output>`);
    console.log(`   or: drapp archive --interactive`);
    process.exit(1);
  }
  const useTUI = !options.simple && process.stdout.isTTY;
  let tui = null;
  let service = null;
  const tracker = { completed: 0, skipped: 0, failed: 0, savedBytes: 0 };
  const shutdown = () => {
    if (tui) {
      tui.stop();
    }
    if (service) {
      service.cancel();
    }
    console.log(`
${style.yellow}Encoding cancelled${style.reset}`);
    process.exit(130);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  try {
    try {
      await (0, import_promises4.access)(input);
    } catch {
      if (useTUI) {
        printError("Input path not found", input);
      } else {
        console.error(`${style.red}Error:${style.reset} Input path not found: ${input}`);
      }
      process.exit(1);
    }
    const codec = options.codec;
    const preset = options.preset;
    if (!useTUI) {
      printWelcome(codec, preset);
    }
    const inputStat = await (0, import_promises4.stat)(input);
    let inputPaths = [];
    let relativePaths = [];
    let folderRoot;
    let fileNames = [];
    const wizardPaths = options._wizardInputPaths;
    if (wizardPaths && wizardPaths.length > 0) {
      inputPaths = wizardPaths;
      relativePaths = wizardPaths.map((p) => (0, import_node_path6.basename)(p));
      fileNames = relativePaths;
      if (!useTUI) {
        console.log(`Selected ${style.cyan}${inputPaths.length}${style.reset} files
`);
      }
    } else if (inputStat.isDirectory()) {
      if (!useTUI) {
        console.log(`${style.dim}Scanning directory...${style.reset}`);
      }
      const files = await findVideoFiles(input);
      if (files.length === 0) {
        if (useTUI) {
          printError("No video files found", `in ${input}`);
        } else {
          console.error(`${style.red}Error:${style.reset} No video files found in ${input}`);
        }
        process.exit(1);
      }
      inputPaths = files.map((f) => f.absolutePath);
      relativePaths = files.map((f) => f.relativePath);
      fileNames = files.map((f) => f.relativePath);
      folderRoot = input;
      if (!useTUI) {
        console.log(`Found ${style.cyan}${files.length}${style.reset} video files
`);
      }
    } else {
      inputPaths = [input];
      relativePaths = [(0, import_node_path6.basename)(input)];
      fileNames = [(0, import_node_path6.basename)(input)];
    }
    await (0, import_promises4.mkdir)(output, { recursive: true });
    const presetConfig = ARCHIVAL_PRESETS[preset] || {};
    const config2 = {
      ...DEFAULT_ARCHIVAL_CONFIG,
      ...presetConfig,
      codec,
      container: options.container,
      resolution: options.resolution,
      overwriteExisting: options.overwrite,
      fillMode: options.fillMode,
      preserveStructure: options.preserveStructure,
      deleteOutputIfLarger: options.deleteIfLarger,
      deleteOriginal: options.deleteOriginal,
      extractThumbnail: options.thumbnail,
      extractCaptions: options.captions,
      captionLanguage: options.captionLang,
      audioCopy: options.audioCopy,
      audioCodec: options.audioCodec,
      audioBitrate: parseInt(options.audioBitrate, 10),
      threadLimit: parseInt(options.threads, 10)
    };
    config2.av1 = {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      ...presetConfig.av1,
      encoder: options.av1Encoder,
      preset: parseInt(options.av1Preset, 10),
      filmGrainSynthesis: parseInt(options.filmGrain, 10),
      twoPass: options.twoPass
    };
    if (options.av1Crf) {
      config2.av1.crf = parseInt(options.av1Crf, 10);
    }
    config2.h265 = {
      ...DEFAULT_ARCHIVAL_CONFIG.h265,
      ...presetConfig.h265,
      preset: options.h265Preset,
      bframes: parseInt(options.h265Bframes, 10),
      twoPass: options.twoPass
    };
    if (options.h265Crf) {
      config2.h265.crf = parseInt(options.h265Crf, 10);
    }
    if (options.h265Tune) {
      config2.h265.tune = options.h265Tune;
    }
    let progressHandler;
    if (useTUI) {
      tui = new TUI();
      tui.update({
        codec: codec.toUpperCase(),
        preset,
        totalFiles: inputPaths.length,
        subtitle: `Output: ${output}`,
        status: "scanning"
      });
      tui.start();
      progressHandler = createTUIProgressHandler(tui, fileNames, tracker);
    } else {
      console.log(`${style.dim}Configuration:${style.reset}`);
      console.log(`  Codec: ${style.cyan}${codec.toUpperCase()}${style.reset}`);
      console.log(`  Preset: ${style.cyan}${preset}${style.reset}`);
      console.log(`  Resolution: ${style.cyan}${options.resolution}${style.reset}`);
      console.log(`  Container: ${style.cyan}${options.container}${style.reset}`);
      if (codec === "av1") {
        console.log(`  AV1 Encoder: ${style.cyan}${options.av1Encoder}${style.reset}`);
        console.log(`  AV1 Preset: ${style.cyan}${options.av1Preset}${style.reset}`);
        console.log(`  Film Grain: ${style.cyan}${options.filmGrain}${style.reset}`);
      } else {
        console.log(`  H.265 Preset: ${style.cyan}${options.h265Preset}${style.reset}`);
        if (options.h265Tune) {
          console.log(`  H.265 Tune: ${style.cyan}${options.h265Tune}${style.reset}`);
        }
      }
      console.log(`  Two-pass: ${style.cyan}${options.twoPass ? "yes" : "no"}${style.reset}`);
      console.log(`  Audio: ${style.cyan}${options.audioCopy ? "copy" : options.audioCodec}${style.reset}`);
      if (options.captions) {
        console.log(`  Captions: ${style.cyan}${options.captionLang}${style.reset}`);
      }
      console.log(`  Output: ${style.cyan}${output}${style.reset}`);
      console.log();
      console.log(`${style.bold}Starting encoding...${style.reset}
`);
      progressHandler = createSimpleProgressHandler();
    }
    service = new ArchivalService(progressHandler);
    await service.startBatch(
      inputPaths,
      output,
      config2,
      folderRoot,
      relativePaths
    );
    await new Promise((resolve) => {
      const checkStatus = setInterval(() => {
        const status = service.getStatus();
        if (!status || status.status === "completed" || status.status === "cancelled") {
          clearInterval(checkStatus);
          resolve();
        }
      }, 500);
    });
    if (tui) {
      tui.stop();
    }
    const finalStatus = service.getStatus();
    if (finalStatus) {
      let totalSaved = 0;
      for (const item of finalStatus.items) {
        if (item.status === "completed" && item.inputSize && item.outputSize) {
          totalSaved += item.inputSize - item.outputSize;
        }
      }
      printSummary(
        finalStatus.completedItems,
        finalStatus.skippedItems,
        finalStatus.failedItems,
        Math.max(0, totalSaved)
      );
    }
  } catch (error) {
    if (tui) {
      tui.stop();
    }
    const message = error instanceof Error ? error.message : String(error);
    if (useTUI) {
      printError(message.slice(0, 40));
    } else {
      console.error(`
${style.red}Error:${style.reset}`, message);
    }
    process.exit(1);
  }
});

// src/cli/index.ts
var CONFIG_DIR = (0, import_node_path7.join)((0, import_node_os4.homedir)(), ".drapp");
var CONFIG_FILE = (0, import_node_path7.join)(CONFIG_DIR, "cli-config.json");
function loadConfig() {
  try {
    if ((0, import_node_fs4.existsSync)(CONFIG_FILE)) {
      return JSON.parse((0, import_node_fs4.readFileSync)(CONFIG_FILE, "utf-8"));
    }
  } catch {
  }
  return { firstRunComplete: false, version: "0.1.0" };
}
function saveConfig(config2) {
  try {
    if (!(0, import_node_fs4.existsSync)(CONFIG_DIR)) {
      (0, import_node_fs4.mkdirSync)(CONFIG_DIR, { recursive: true });
    }
    (0, import_node_fs4.writeFileSync)(CONFIG_FILE, JSON.stringify(config2, null, 2));
  } catch {
  }
}
function showFirstRunWelcome() {
  console.log(`
${style.cyan}\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E${style.reset}
${style.cyan}\u2502${style.reset}                                                            ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.bold}Welcome to Drapp CLI!${style.reset}                                   ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.dim}Video archival made simple${style.reset}                              ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}                                                            ${style.cyan}\u2502${style.reset}
${style.cyan}\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524${style.reset}
${style.cyan}\u2502${style.reset}                                                            ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.bold}Quick Start:${style.reset}                                           ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}                                                            ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.green}Interactive mode${style.reset} (recommended for beginners):          ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}    ${style.cyan}drapp archive --interactive${style.reset}                          ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}    ${style.cyan}drapp archive -i${style.reset}                                     ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}                                                            ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.green}Direct mode${style.reset} (for automation/scripts):                  ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}    ${style.cyan}drapp archive /path/to/videos /path/to/output${style.reset}        ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}                                                            ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.green}Get help:${style.reset}                                              ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}    ${style.cyan}drapp archive --help${style.reset}                                 ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}                                                            ${style.cyan}\u2502${style.reset}
${style.cyan}\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524${style.reset}
${style.cyan}\u2502${style.reset}                                                            ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.dim}Tip: Use the interactive wizard to browse files and${style.reset}      ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}  ${style.dim}configure settings without memorizing command flags!${style.reset}     ${style.cyan}\u2502${style.reset}
${style.cyan}\u2502${style.reset}                                                            ${style.cyan}\u2502${style.reset}
${style.cyan}\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F${style.reset}
`);
}
var config = loadConfig();
var args = process.argv.slice(2);
if (!config.firstRunComplete && (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h")) {
  showFirstRunWelcome();
  config.firstRunComplete = true;
  saveConfig(config);
  if (args.length === 0) {
    process.exit(0);
  }
}
var program2 = new Command();
program2.name("drapp").description("Video archival tool - batch encode videos using AV1/H.265").version("0.1.0");
program2.addCommand(archiveCommand);
program2.action(() => {
  console.log(`
${style.bold}Drapp CLI${style.reset} - Video archival tool

${style.dim}Usage:${style.reset}
  drapp archive [options] <input> <output>
  drapp archive --interactive

${style.dim}Quick start:${style.reset}
  ${style.cyan}drapp archive -i${style.reset}  Launch interactive wizard

${style.dim}For more options:${style.reset}
  ${style.cyan}drapp archive --help${style.reset}
`);
});
program2.parse();
//# sourceMappingURL=index.cjs.map
