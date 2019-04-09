"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserType_1 = require("../../test/UserType");
const SyntaxParseError_1 = require("../errors/SyntaxParseError");
const ChannelType_1 = require("../types/ChannelType");
const DurationType_1 = require("../types/DurationType");
const MemberType_1 = require("../types/MemberType");
const NumberType_1 = require("../types/NumberType");
const RoleType_1 = require("../types/RoleType");
const StringType_1 = require("../types/StringType");
exports.DEFAULT_SYNTAX_ERRORS = {
    NOT_ENOUGH_ARGS: (index, arg) => `expected arg type \`${arg.string}\` at position \`${index}\``,
    TOO_MANY_ARGS: (args) => `expected \`${args || "none"}\``,
};
class SyntaxParser {
    constructor(options) {
        this.options = options;
        if (!this.options.args) {
            this.syntax = [];
        }
        else if (this.options.args instanceof Array) {
            this.syntax = this.options.args;
        }
        else {
            // string syntax parser
            // split string at spaces between args
            this.syntax = [];
            this.options.args.split(" ").map((arg) => {
                let required;
                let rest;
                const argName = arg.split(":")[0].slice(1);
                if (arg.slice(0, -1).endsWith("...")) {
                    rest = true;
                }
                if (arg.startsWith("<")) {
                    // if < is present, arg is not optional
                    required = true;
                }
                const type = rest
                    ? arg.split(":")[1].slice(0, -4)
                    : arg.split(":")[1].slice(0, -1);
                // split at name:type
                switch (type) {
                    case "number":
                        this.syntax.push(new NumberType_1.NumberType({
                            argName,
                            required,
                            rest,
                        }));
                        break;
                    case "string": {
                        this.syntax.push(new StringType_1.StringType({
                            argName,
                            required,
                            rest,
                        }));
                        break;
                    }
                    case "user": {
                        this.syntax.push(new UserType_1.UserType({
                            argName,
                            required,
                            rest,
                        }));
                        break;
                    }
                    case "member": {
                        this.syntax.push(new MemberType_1.MemberType({
                            argName,
                            required,
                            rest,
                        }));
                        break;
                    }
                    case "channel": {
                        this.syntax.push(new ChannelType_1.ChannelType({
                            argName,
                            required,
                            rest,
                        }));
                        break;
                    }
                    case "role": {
                        this.syntax.push(new RoleType_1.RoleType({
                            argName,
                            required,
                            rest,
                        }));
                    }
                    case "duration": {
                        this.syntax.push(new DurationType_1.DurationType({
                            argName,
                            required,
                            rest,
                        }));
                    }
                }
            });
        }
    }
    parse(client, message, args) {
        const parsedArgs = [];
        if (!args) {
            return [];
        }
        args.map((arg, i) => {
            // if argument does not exist, and there are no rest args, throw error.
            if (!this.syntax[i] &&
                !this.syntax.find((v) => v.options.rest === true)) {
                return;
                /*
                throw new SyntaxParseError({
                    message: this.options.errorMessages
                        ? this.options.errorMessages.TOO_MANY_ARGS(
                                this.syntax.map((v) => v.string).join(" "),
                          )
                        : DEFAULT_SYNTAX_ERRORS.TOO_MANY_ARGS(
                                this.syntax.map((v) => v.string).join(" "),
                          ),
                    recievedArgument: {
                        index: i,
                        value: arg,
                    },
                    type: "TOO_MANY_ARGS",
                });
                */
            }
            else if (!this.syntax[i]) {
                return (parsedArgs[this.syntax.length - 1] = parsedArgs[this.syntax.length - 1].concat(" ", this.syntax[this.syntax.length - 1].match(client, message, {
                    index: this.syntax.length - 1,
                    value: arg,
                })));
            }
            else if (this.syntax[i].options.required &&
                this.syntax[i - 1] &&
                !this.syntax[i - 1].options.required) {
                client.logger.error("A required arg has appeared after an unrequired arg.");
                throw Error(`Internal error. Please contact the developer.`);
            }
            let preHasRequired = { failed: false, index: 0, string: "" };
            this.syntax.map((s, ix) => {
                if (s.options.required && !args[ix] && !preHasRequired.failed) {
                    preHasRequired = {
                        failed: true,
                        index: ix,
                        string: s.string,
                    };
                }
            });
            if (preHasRequired.failed) {
                throw new SyntaxParseError_1.SyntaxParseError({
                    expectedArgument: this.syntax[preHasRequired.index],
                    message: this.options.errorMessages
                        ? this.options.errorMessages.NOT_ENOUGH_ARGS(preHasRequired.index, this.syntax[preHasRequired.index])
                        : exports.DEFAULT_SYNTAX_ERRORS.NOT_ENOUGH_ARGS(preHasRequired.index, this.syntax[preHasRequired.index]),
                    recievedArgument: {
                        index: i,
                        value: arg,
                    },
                    type: "NOT_ENOUGH_ARGS",
                });
            }
            else {
                return parsedArgs.push(this.syntax[i].match(client, message, {
                    index: i,
                    value: arg,
                }));
            }
        });
        let hasRequired = { failed: false, index: 0, string: "" };
        this.syntax.map((s, ix) => {
            if (s.options.required && !args[ix] && !hasRequired.failed) {
                hasRequired = {
                    failed: true,
                    index: ix,
                    string: s.string,
                };
            }
        });
        if (hasRequired.failed) {
            throw new SyntaxParseError_1.SyntaxParseError({
                expectedArgument: this.syntax[hasRequired.index],
                message: this.options.errorMessages
                    ? this.options.errorMessages.NOT_ENOUGH_ARGS(hasRequired.index, this.syntax[hasRequired.index])
                    : exports.DEFAULT_SYNTAX_ERRORS.NOT_ENOUGH_ARGS(hasRequired.index, this.syntax[hasRequired.index]),
                type: "NOT_ENOUGH_ARGS",
            });
        }
        return parsedArgs;
    }
}
exports.SyntaxParser = SyntaxParser;
