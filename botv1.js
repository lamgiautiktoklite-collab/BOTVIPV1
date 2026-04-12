const { Telegraf, Markup } = require('telegraf');
const youtubeDl = require('yt-dlp-exec');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// Server ảo giữ port 2312
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

        // 1. KIỂM TRA NẾU LÀ PROFILE (FB, TikTok, YT)
        const isProfile = info._type === 'playlist' || url.includes('/@') || url.includes('facebook.com/') || url.includes('profile.php');

        if (isProfile) {
            const name = info.title || 'N/A';
            const platform = info.extractor_key || 'N/A';
            const avatar = info.thumbnails?.[0]?.url || ''; // Lấy ảnh đại diện
            const uploaderId = info.uploader_id || info.id || 'N/A';

            let profileMsg = `👤 **THÔNG TIN TÀI KHOẢN**\n\n` +
                             `🌐 **Nền tảng:** ${platform}\n` +
                             `📛 **Tên:** ${name}\n` +
                             `🆔 **ID:** \`${uploaderId}\`\n` +
                             `🎥 **Video/Post:** ${info.playlist_count || 'N/A'}`;

            if (avatar && url.includes('tiktok')) {
                await ctx.replyWithPhoto(avatar, { caption: profileMsg, parse_mode: 'Markdown' });
            } else {
                await ctx.reply(profileMsg, { parse_mode: 'Markdown' });
            }
            return;
        }

        // 2. NẾU LÀ VIDEO - TRẢ VỀ DIRECT LINK
        // Lấy định dạng video tốt nhất có cả hình và tiếng
        const bestFormat = info.formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none').pop() || info;
        const directLink = bestFormat.url;

        const videoMsg = `🎬 **KẾT QUẢ SOI LINK**\n\n` +
                         `📌 **Tiêu đề:** ${info.title}\n` +
                         `👤 **Tác giả:** ${info.uploader || 'N/A'}\n` +
                         `📦 **Dung lượng:** ${( (info.filesize || info.filesize_approx || 0) / 1048576 ).toFixed(2)} MB`;

        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, videoMsg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('🚀 Tải Video (Direct Link)', directLink)],
                [Markup.button.url('🎵 Tải Nhạc (MP3 Link)', info.url)] // Link gốc thường hỗ trợ stream nhạc
            ])
        });

    } catch (error) {
        console.error(error);
        ctx.reply('❌ Lỗi: Link không công khai hoặc không lấy được Direct Link.');
    }
});

bot.launch();
console.log('🤖 Bot VIP V1 - Direct Link Mode đã sẵn sàng!');

    } catch (error) {
        ctx.reply('❌ Link không hỗ trợ hoặc lỗi hệ thống.');
    }
});

// 4. Xử lý nút tải Video
bot.action('dl_video', async (ctx) => {
    const data = userState.get(ctx.chat.id);
    if (!data) return ctx.answerCbQuery('Hết phiên! Gửi lại link nhé.');
    await ctx.answerCbQuery();

    if (data.fileSize > 50 * 1024 * 1024) {
        const info = await youtubeDl(data.url, { dumpSingleJson: true, format: 'best' });
        return ctx.reply(`⚠️ File > 50MB. Bạn tải tại đây:`, Markup.inlineKeyboard([[Markup.button.url('🚀 Tải ngay', info.url)]]));
    }

    const status = await ctx.reply('📥 Đang tải...');
    const filePath = path.join(__dirname, `vid_${Date.now()}.mp4`);

    try {
        const subprocess = youtubeDl.exec(data.url, { output: filePath, format: 'best', noCheckCertificates: true });
        let lastUpdate = 0;
        subprocess.stdout.on('data', (d) => {
            const match = d.toString().match(/(\d+\.\d+)%/);
            if (match && (Date.now() - lastUpdate > 3000)) {
                ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null, `📥 Tiến độ: ${match[1]}%`).catch(() => {});
                lastUpdate = Date.now();
            }
        });
        await subprocess;
        await ctx.replyWithVideo({ source: filePath }, { caption: `✅ Done: ${data.title}` });
        ctx.telegram.deleteMessage(ctx.chat.id, status.message_id);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) { ctx.reply('❌ Lỗi khi tải video!'); }
});

// 5. Xử lý nút tải MP3
bot.action('dl_audio', async (ctx) => {
    const data = userState.get(ctx.chat.id);
    await ctx.answerCbQuery();
    const status = await ctx.reply('🎵 Đang tách nhạc...');
    const audioPath = path.join(__dirname, `mus_${Date.now()}.mp3`);
    try {
        await youtubeDl(data.url, { extractAudio: true, audioFormat: 'mp3', output: audioPath, noCheckCertificates: true });
        await ctx.replyWithAudio({ source: audioPath });
        ctx.telegram.deleteMessage(ctx.chat.id, status.message_id);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    } catch (e) { ctx.reply('❌ Lỗi tách nhạc!'); }
});

bot.launch();
console.log('🤖 Bot đang chạy tại Port 2312...');
