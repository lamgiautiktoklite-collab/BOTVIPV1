const { Telegraf, Markup } = require('telegraf');
const DivineEngine = require('./engine');
const startServer = require('./server');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN chưa được cài đặt!");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Khởi động Server ảo port 2312
startServer(2312);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`🔥 **VÔ CỰC MA THẦN - PHIÊN BẢN CHÍNH THỨC** 🔥\n\nHệ thống đã sẵn sàng. Gửi link TikTok, FB, YouTube để bắt đầu vắt dữ liệu!`);
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    if (!text.includes('http')) return;

    const statusMsg = await ctx.reply('📡 **Đang truy quét dữ liệu...**');

    try {
        const result = await DivineEngine.extract(text);

        if (result.type === 'PROFILE') {
            const msg = `👤 **THÔNG TIN ĐỐI TƯỢNG**\n\n` +
                        `🏛 **Nền tảng:** #${result.platform}\n` +
                        `📛 **Tên:** ${result.title}\n` +
                        `🆔 **ID:** \`${result.id}\`\n` +
                        `🔗 [Xem Profile gốc](${text})`;

            if (result.avatar) {
                await ctx.replyWithPhoto(result.avatar, { caption: msg, parse_mode: 'Markdown' });
                return ctx.deleteMessage(statusMsg.message_id).catch(() => {});
            }
            return ctx.editMessageText(msg, { parse_mode: 'Markdown' });
        }

        // Nếu là Video
        const videoMsg = `🎬 **DỮ LIỆU TRÍCH XUẤT**\n\n` +
                         `📌 **Tiêu đề:** ${result.title}\n` +
                         `👤 **Tác giả:** ${result.author}\n` +
                         `⏱ **Thời lượng:** ${result.duration}\n` +
                         `📦 **Dung lượng:** ${result.size} MB`;

        await ctx.editMessageText(videoMsg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('🚀 Tải Video (Direct Link)', result.videoUrl)],
                [Markup.button.url('🎵 Tải Nhạc MP3', text)]
            ])
        });

    } catch (err) {
        ctx.editMessageText(`💀 **Lỗi:** ${err.message}`);
    }
});

bot.launch().then(() => console.log('🤖 BOTVIPV1 Chính Thức Khởi Chạy!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
