// ... (Phần đầu giữ nguyên)

    try {
        const result = await DivineEngine.extract(text);

        if (result.platform === 'TIKTOK') {
            const msg = `👤 **THÔNG TIN TIKTOK**\n\n` +
                        `📛 **Tên:** ${result.nickname}\n` +
                        `🆔 **ID:** \`${result.uniqueId}\`\n` +
                        `📊 **Followers:** ${result.stats.follower}\n` +
                        `❤️ **Tổng Tim:** ${result.stats.heart}\n` +
                        `🎥 **Số video:** ${result.stats.videoCount}`;

            if (result.avatar) {
                await ctx.replyWithPhoto(result.avatar, { 
                    caption: msg, 
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url('🚀 Tải Video (Nếu có)', result.videoUrl)]
                    ])
                });
                return ctx.deleteMessage(statusMsg.message_id).catch(() => {});
            }
        }
// ... (Phần sau giữ nguyên)
