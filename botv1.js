const { Telegraf, Markup } = require('telegraf');
const DivineEngine = require('./engine');
const startServer = require('./server');

const bot = new Telegraf(process.env.BOT_TOKEN);
startServer(2312);

async function safeEdit(ctx, msgId, text, keyboard) {
    try {
        await ctx.telegram.editMessageText(ctx.chat.id, msgId, null, text, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (e) {
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
}

bot.on('text', async (ctx) => {
    if (ctx.message.from.is_bot) return;
    const text = ctx.message.text;
    if (!text.includes('http')) return;

    const statusMsg = await ctx.reply('📡 **Đại Thần đang truy quét...**');

    try {
        const result = await DivineEngine.extract(text);

        if (result.platform === 'TIKTOK') {
            const msg = `👤 **THÔNG TIN TIKTOK**\n\n` +
                        `📛 **Tên:** ${result.nickname}\n` +
                        `🆔 **ID:** \`${result.uniqueId}\`\n` +
                        `📊 **Followers:** ${result.stats.follower}\n` +
                        `❤️ **Tổng Tim:** ${result.stats.heart}`;

            const keyboard = Markup.inlineKeyboard([
                [Markup.button.url('🚀 Tải Video (Không Logo)', result.videoUrl)]
            ]);

            if (result.avatar) {
                await ctx.replyWithPhoto(result.avatar, { caption: msg, parse_mode: 'Markdown', ...keyboard });
                return ctx.deleteMessage(statusMsg.message_id).catch(() => {});
            }
            return safeEdit(ctx, statusMsg.message_id, msg, keyboard);
        }

        const otherMsg = `🎬 **DỮ LIỆU TRÍCH XUẤT**\n\n📌 **Tiêu đề:** ${result.title}\n🏛 **Nền tảng:** #${result.platform}`;
        const otherKeyboard = Markup.inlineKeyboard([[Markup.button.url('🚀 Tải Video', result.videoUrl)]]);
        await safeEdit(ctx, statusMsg.message_id, otherMsg, otherKeyboard);

    } catch (err) {
        await safeEdit(ctx, statusMsg.message_id, `💀 **Lỗi:** ${err.message}`);
    }
});

// Fix lỗi 409 bằng cách xóa webhook trước khi chạy
bot.telegram.deleteWebhook().then(() => {
    bot.launch({ dropPendingUpdates: true });
    console.log("Bot đã sẵn sàng!");
});
