const { Telegraf, Markup } = require('telegraf');
const DivineEngine = require('./engine');
const startServer = require('./server');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) process.exit(1);

const bot = new Telegraf(BOT_TOKEN);

// Khởi động Server ảo port 2312
startServer(2312);

// 1. CHẶN VÒNG LẶP: Bot không xử lý tin nhắn từ chính nó hoặc bot khác
bot.use(async (ctx, next) => {
    if (ctx.message && ctx.message.from.is_bot) return; 
    await next();
});

bot.start((ctx) => {
    ctx.replyWithMarkdown(`🔥 **VÔ CỰC MA THẦN v2.1**\nHệ thống đã fix lỗi lặp. Hãy gửi link!`);
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    if (!text.includes('http')) return;

    // Trả lời ngay để Telegram biết Bot đã nhận tin (tránh gửi lại webhook)
    const statusMsg = await ctx.reply('📡 **Đang truy quét...**');

    try {
        const result = await DivineEngine.extract(text);

        if (result.type === 'PROFILE') {
            const msg = `👤 **THÔNG TIN ĐỐI TƯỢNG**\n\n` +
                        `🏛 **Nền tảng:** #${result.platform}\n` +
                        `📛 **Tên:** ${result.title}\n` +
                        `🆔 **ID:** \`${result.id}\``;

            if (result.avatar) {
                await ctx.replyWithPhoto(result.avatar, { caption: msg, parse_mode: 'Markdown' });
                return ctx.deleteMessage(statusMsg.message_id).catch(() => {});
            }
            return ctx.editMessageText(msg, { parse_mode: 'Markdown' });
        }

        const videoMsg = `🎬 **DỮ LIỆU TRÍCH XUẤT**\n\n` +
                         `📌 **Tiêu đề:** ${result.title}\n` +
                         `📦 **Size:** ${result.size} MB`;

        await ctx.editMessageText(videoMsg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('🚀 Tải Video (Direct Link)', result.videoUrl)]
            ])
        });

    } catch (err) {
        // Nếu lỗi, sửa tin nhắn cũ thay vì gửi tin mới (để tránh rác)
        ctx.editMessageText(`💀 **Lỗi:** Link không hợp lệ hoặc bị chặn.`).catch(() => {});
    }
});

// Chế độ xử lý lỗi crash để bot tự khởi động lại
bot.catch((err) => {
    console.error('Bot Error:', err);
});

bot.launch().then(() => console.log('🤖 BOTVIPV1 Đã Fix Lỗi Lặp!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
