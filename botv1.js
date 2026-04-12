const { Telegraf, Markup } = require('telegraf');
const youtubeDl = require('yt-dlp-exec');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error("❌ LỖI: Chưa cấu hình BOT_TOKEN!");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Mở port 2312 cho Render
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

        // 1. NHẬN DIỆN PROFILE (Facebook, TikTok, YouTube)
        const isProfile = info._type === 'playlist' || url.includes('/@') || url.includes('facebook.com') || url.includes('profile.php');

        if (isProfile) {
            const name = info.title || 'N/A';
            const platform = info.extractor_key || 'N/A';
            const uploaderId = info.uploader_id || info.id || 'N/A';
            const avatar = info.thumbnails?.pop()?.url || ''; // Lấy ảnh chất lượng cao nhất

            let profileMsg = `👤 **THÔNG TIN TÀI KHOẢN**\n\n` +
                             `🌐 **Nền tảng:** ${platform}\n` +
                             `📛 **Tên:** ${name}\n` +
                             `🆔 **ID:** \`${uploaderId}\`\n` +
                             `🎥 **Video/Post:** ${info.playlist_count || 'N/A'}`;

            if (avatar && (url.includes('tiktok') || url.includes('youtube'))) {
                await ctx.replyWithPhoto(avatar, { caption: profileMsg, parse_mode: 'Markdown' });
            } else {
                await ctx.reply(profileMsg, { parse_mode: 'Markdown' });
            }
            return;
        }

        // 2. NHẬN DIỆN VIDEO - TRẢ VỀ DIRECT LINK
        // Lọc lấy link video có cả hình lẫn tiếng (best)
        const bestFormat = info.formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none').pop() || info;
        const directLink = bestFormat.url;

        const videoMsg = `🎬 **KẾT QUẢ SOI LINK**\n\n` +
                         `📌 **Tiêu đề:** ${info.title}\n` +
                         `👤 **Tác giả:** ${info.uploader || 'N/A'}\n` +
                         `📦 **Dung lượng:** ${((info.filesize || info.filesize_approx || 0) / 1048576).toFixed(2)} MB`;

        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, videoMsg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('🚀 Tải Video (Direct Link)', directLink)],
                [Markup.button.url('🎵 Tải Nhạc (MP3)', info.url)]
            ])
        });

    } catch (error) {
        console.error("Lỗi soi link:", error);
        ctx.reply('❌ Không thể soi link này. Có thể do link riêng tư hoặc Facebook chặn.');
    }
});

bot.launch();
console.log('🤖 Bot VIP V1 đã sửa lỗi - Đang chạy...');
