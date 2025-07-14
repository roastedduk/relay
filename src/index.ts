import { Bot, webhookCallback } from "grammy";

export interface Env {
	BOT_TOKEN: string;
}

// The following line of code assumes that you have configured the secrets BOT_TOKEN and BOT_INFO.
// See https://developers.cloudflare.com/workers/platform/environment-variables/#secrets-on-deployed-workers.
// The BOT_INFO is obtained from `bot.api.getMe()`.
const bot = new Bot(BOT_TOKEN);

bot.command("start", async (ctx) => {
	await ctx.reply("Hello, I'm Relay! I can forward messages to your DM from a group. Just add me to a group then reply to the message with /relay and I'll forward it to your DM.");
});

bot.command("relaydebug", async (ctx) => {
	await ctx.reply(JSON.stringify(ctx.message, null, 2));
});

bot.command("relay", async (ctx) => {
	const messageToForward = ctx.message?.reply_to_message;
	const sender = ctx.message?.from;
	const senderUsername = sender?.username;

	console.log(messageToForward, sender);

	if (messageToForward && sender) {
		// await ctx.forwardMessage(sender.id, messageToForward);

		const photo = messageToForward.photo;
		const video = messageToForward.video;
		const audio = messageToForward.audio;
		const document = messageToForward.document;
		const text = messageToForward.text;
		const caption = messageToForward.caption;
		const sticker = messageToForward.sticker;
		const videoNote = messageToForward.video_note;

		const promises = [];

		try {
			if (photo) {
				promises.push(ctx.api.sendPhoto(sender.id, photo[photo.length - 1].file_id, {
					caption: caption
				}));
			} else if (video) {
				promises.push(ctx.api.sendVideo(sender.id, video.file_id, {
					caption: caption
				}));
			} else if (audio) {
				promises.push(ctx.api.sendAudio(sender.id, audio.file_id, {
					caption: caption
				}));
			} else if (document) {
				promises.push(ctx.api.sendDocument(sender.id, document.file_id, {
					caption: caption
				}));
			} else if (sticker) {
				promises.push(ctx.api.sendSticker(sender.id, sticker.file_id))
			} else if (text) {
				promises.push(ctx.api.sendMessage(sender.id, text))
			} else if (videoNote) {
				promises.push(ctx.api.sendVideoNote(sender.id, videoNote.file_id));
			} else {
				await ctx.reply("Unsupported message type.", {
					reply_parameters: {
						message_id: messageToForward.message_id,
					}
				});
				return;
			}

			if (senderUsername) {
				promises.push(ctx.reply(`Message forwarded to @${senderUsername}!`, {
					reply_parameters: {
						message_id: messageToForward.message_id,
					}
				}));
			} else {
				promises.push(ctx.reply(`Message forwarded to <a href="tg://user?id=${sender.id}">${sender.first_name}</a>!`, {
					parse_mode: "HTML",
					reply_parameters: {
						message_id: messageToForward.message_id,
					}
				}));
			}

			await Promise.all(promises);

		} catch (e) {
			console.error(e);
			await ctx.reply("Failed to forward message to your DM. Have you started Relay bot in DM?", {
				reply_parameters: {
					message_id: ctx.message?.message_id!,
				}
			});
			return;
		}

	} else {
		await ctx.reply("Please reply to a message to forward it to your DM.");
	}
});

addEventListener("fetch", webhookCallback(bot, "cloudflare"));