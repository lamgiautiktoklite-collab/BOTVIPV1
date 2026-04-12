const { Telegraf, Markup } = require('telegraf');
const youtubeDl = require('yt-dlp-exec');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Mở port 2312
http.createServer((req, res) => {
    res.write('Bot is running!');
    res.end();
}).listen(2312);

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.includes('http')) return;

    const statusMsg = await ctx.reply('🔍 Đang trích xuất dữ liệu...');

    try {
        const info = await youtubeDl(url, { 
            dumpSingleJson: true, 
            noCheckCertificates: true,
            playlistItems: '1'
        });

        const isProfile = info._type === 'playlist' || url.includes('/@') || url.includes('facebook.com') || url.includes('profile.php');

        if (isProfile) {
            const name = info.title || 'N/A';
            const platform = info.extractor_key || 'N/A';
            const uploaderId = info.uploader_id || info.id || 'N/A';
            
            // Cải tiến lấy Avatar: Thử lấy ảnh đầu tiên hoặc ảnh thumb mặc định
            const avatar = info.thumbnail || (info.thumbnails && info.thumbnails.length > 0 ? info.thumbnails[0].url : null);

            let profileMsg = `👤 **THÔNG TIN TÀI KHOẢN**\n\n` +
                             `🌐 **Nền tảng:** ${platform}\n` +
                             `📛 **Tên:** ${name}\n` +
                             `🆔 **ID:** \`${uploaderId}\`\n` +
                             `🎥 **Video/Post:** ${info.playlist_count || 'N/A'}`;

            if (avatar) {
                try {
                    await ctx.replyWithPhoto(avatar, { caption: profileMsg, parse_mode: 'Markdown' });
                    // Nếu gửi được ảnh thì xóa tin nhắn trạng thái cũ
                    return ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
                } catch (imgErr) {
                    // Nếu lỗi ảnh (do link ảnh bị chặn), gửi tin nhắn văn bản bình thường
                    return ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, profileMsg, { parse_mode: 'Markdown' });
                }
            } else {
                return ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, profileMsg, { parse_mode: 'Markdown' });
            }
        }

        // PHẦN VIDEO - DIRECT LINK
        const bestFormat = info.formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none').pop() || info;
        const directLink = bestFormat.url;

        const videoMsg = `🎬 **KẾT QUẢ SOI LINK**\n\n📌 **Tiêu đề:** ${info.title}\n👤 **Tác giả:** ${info.uploader || 'N/A'}\n📦 **Dung lượng:** ${((info.filesize || info.filesize_approx || 0) / 1048576).toFixed(2)} MB`;

        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, videoMsg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('🚀 Tải Video (Direct Link)', directLink)],
                [Markup.button.url('🎵 Tải Nhạc (MP3)', info.url)]
            ])
        });

    } catch (error) {
        ctx.reply('❌ Không lấy được dữ liệu. Link có thể bị chặn hoặc riêng tư.');
    }
});

bot.launch();
