const { Telegraf, Markup } = require('telegraf');
const DivineEngine = require('./engine');
const startServer = require('./server');

const bot = new Telegraf(process.env.BOT_TOKEN);
startServer(2312); // Chạy server giữ live cho Render

bot.on('text', async (ctx) => {
    let text = ctx.message.text.trim();
    if (ctx.message.from.is_bot) return;

    // Tự động nhận diện: Có http là Video, không có là Profile
    const isLink = text.includes('http');
    const statusMsg = await ctx.reply('📡 **Đại Thần đang lùng sục...**');

    try {
        let query = text;
        if (!isLink) {
            // Xử lý tên người dùng, bỏ @ nếu có
            query = text.startsWith('@') ? text.replace('@', '') : text;
        }

        const result = await DivineEngine.extract(query, isLink);

        // HIỂN THỊ PROFILE
        if (result.type === 'PROFILE') {
            const profileMsg = `👤 **HỒ SƠ TIKTOK**\n\n` +
                               `📛 **Tên:** ${result.nickname}\n` +
                               `🆔 **ID:** \`${result.uniqueId}\`\n` +
                               `📝 **Bio:** ${result.signature}\n\n` +
                               `📊 **Followers:** ${result.stats.follower}\n` +
                               `❤️ **Tổng Tim:** ${result.stats.heart}\n` +
                               `🎥 **Số video:** ${result.stats.videoCount}`;
            
            await ctx.replyWithPhoto(result.avatar, { caption: profileMsg, parse_mode: 'Markdown' });
        } 
        
        // HIỂN THỊ VIDEO TẢI
        else if (result.type === 'VIDEO') {
            const videoMsg = `🎬 **VIDEO TRÍCH XUẤT**\n\n📌 **Tiêu đề:** ${result.title}\n👤 **Tác giả:** ${result.nickname}`;
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.url('🚀 Tải Video (Không Logo)', result.videoUrl)]
            ]);
            
            await ctx.replyWithPhoto(result.cover, { caption: videoMsg, reply_markup: keyboard.reply_markup });
        }

        await ctx.deleteMessage(statusMsg.message_id).catch(() => {});

    } catch (err) {
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, `💀 **Lỗi:** ${err.message}`);
    }
});

// Fix lỗi 409 Conflict bằng cách xóa Webhook cũ
bot.telegram.deleteWebhook().then(() => {
    bot.launch({ dropPendingUpdates: true });
    console.log("Bot đã sẵn sàng chiến đấu!");
});
