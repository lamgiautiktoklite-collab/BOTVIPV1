const { Telegraf, Markup } = require('telegraf');
const DivineEngine = require('./engine');
const startServer = require('./server');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

startServer(2312);

// Hàm safeEdit để né lỗi 400 Bad Request
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

// CHỖ NÀY PHẢI CÓ CHỮ ASYNC NE NI
bot.on('text', async (ctx) => {
    if (ctx.message.from.is_bot) return;
    const text = ctx.message.text;
    if (!text.includes('http')) return;

    const statusMsg = await ctx.reply('📡 **Đại Thần đang truy quét...**');

    try {
        // Có async ở trên thì await ở đây mới chạy được
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

        // Xử lý Facebook hoặc nền tảng khác
        const videoMsg = `🎬 **DỮ LIỆU TRÍCH XUẤT**\n\n📌 **Tiêu đề:** ${result.title}\n🏛 **Nền tảng:** #${result.platform}`;
        const fbKeyboard = Markup.inlineKeyboard([[Markup.button.url('🚀 Tải Video', result.videoUrl)]]);
        
        await safeEdit(ctx, statusMsg.message_id, videoMsg, fbKeyboard);

    } catch (err) {
        await safeEdit(ctx, statusMsg.message_id, `💀 **Lỗi:** ${err.message}`);
    }
});

bot.launch({ dropPendingUpdates: true });
