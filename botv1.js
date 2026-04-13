bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    if (!text.includes('http')) return;

    const statusMsg = await ctx.reply('📡 **Đại Thần đang phân tích...**');

    try {
        const result = await DivineEngine.extract(text);

        // NẾU LÀ PROFILE
        if (result.type === 'PROFILE') {
            const profileMsg = `👤 **HỒ SƠ ĐẠI THẦN**\n\n` +
                               `📛 **Tên:** ${result.nickname}\n` +
                               `🆔 **ID:** \`${result.uniqueId}\`\n` +
                               `📝 **Bio:** ${result.signature}\n\n` +
                               `📊 **Followers:** ${result.stats.follower}\n` +
                               `❤️ **Tổng Tim:** ${result.stats.heart}\n` +
                               `🎥 **Số video:** ${result.stats.videoCount}`;
            
            await ctx.replyWithPhoto(result.avatar, { caption: profileMsg, parse_mode: 'Markdown' });
        } 
        
        // NẾU LÀ VIDEO
        else if (result.type === 'VIDEO') {
            const videoMsg = `🎬 **VIDEO TRÍCH XUẤT**\n\n📌 **Tiêu đề:** ${result.title}\n👤 **Tác giả:** ${result.nickname}`;
            const keyboard = Markup.inlineKeyboard([[Markup.button.url('🚀 Tải Video (Không Logo)', result.videoUrl)]]);
            
            await ctx.replyWithPhoto(result.cover, { caption: videoMsg, reply_markup: keyboard.reply_markup });
        }

        await ctx.deleteMessage(statusMsg.message_id).catch(() => {});

    } catch (err) {
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, `💀 **Lỗi:** ${err.message}`);
    }
});
