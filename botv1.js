const { Telegraf, Markup } = require('telegraf');
const DivineEngine = require('./engine');
const startServer = require('./server');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

startServer(2312);

// Hàm hỗ trợ gửi/sửa tin nhắn cực mạnh (né lỗi 400)
async function safeEdit(ctx, msgId, text, keyboard) {
    try {
        await ctx.telegram.editMessageText(ctx.chat.id, msgId, null, text, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (e) {
        // Nếu không edit được thì gửi tin nhắn mới luôn cho máu
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

        if (result.type === 'PROFILE') {
            const msg = `👤 **THÔNG TIN ĐỐI TƯỢNG**\n\n🏛 **Nền tảng:** #${result.platform}\n📛 **Tên:** ${result.title}\n🆔 **ID:** \`${result.id}\``;
            
            if (result.avatar) {
                await ctx.replyWithPhoto(result.avatar, { caption: msg, parse_mode: 'Markdown' });
                return ctx.deleteMessage(statusMsg.message_id).catch(() => {});
            }
            return safeEdit(ctx, statusMsg.message_id, msg);
        }

        const videoMsg = `🎬 **DỮ LIỆU TRÍCH XUẤT**\n\n📌 **Tiêu đề:** ${result.title}\n📦 **Size:** ${result.size} MB`;
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url('🚀 Tải Video (Direct Link)', result.videoUrl)]
        ]);

        await safeEdit(ctx, statusMsg.message_id, videoMsg, keyboard);

    } catch (err) {
        console.error("Lỗi thực thi:", err.message);
        await safeEdit(ctx, statusMsg.message_id, `💀 **Lỗi:** ${err.message}`);
    }
});

bot.launch({ dropPendingUpdates: true });
