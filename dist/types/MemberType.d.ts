import { Message } from "discord.js";
import { TailClient } from "../client/Client";
import { BaseType, BaseTypeOptions, IBaseTypeArg } from "./BaseType";
export declare class MemberType extends BaseType {
    options: BaseTypeOptions;
    constructor(opts: BaseTypeOptions);
    match(client: TailClient, message: Message, arg: IBaseTypeArg): import("discord.js").GuildMember | undefined;
}