const { Telegraf, Markup } = require('telegraf');
const youtubeDl = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 1. Cấu hình Token từ biến môi trường (Environment Variable)
// Bạn cần vào Render -> Environment -> Thêm BOT_TOKEN vào đó.
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("❌ LỖI: Chưa có BOT_TOKEN! Hãy thêm vào mục Environment trên Render.");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const userState = new Map();

// 2. Tạo server ảo để mở port 2312
// Việc này giúp Render không báo lỗi "Port timeout"
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Bot is running on port 2312!');
    res.end();
}).listen(2312, () => {
    console.log('🌐 Server đang lắng nghe tại cổng 2312');
});

// 3. Xử lý tin nhắn chứa Link
bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.includes('http')) return;

    const statusMsg = await ctx.reply('🔍 Đang tra cứu dữ liệu...');

    try {
        const info = await youtubeDl(url, { 
            dumpSingleJson: true, 
            noCheckCertificates: true,
            playlistItems: '1' 
        });

        const isProfile = info._type === 'playlist' || url.includes('/@') || url.includes('/channel/');

        if (isProfile) {
            const profileText = `👤 **TÀI KHOẢN**\n\n` +
                                `🌐 **Nguồn:** ${info.extractor_key}\n` +
                                `📛 **Tên:** ${info.title || 'N/A'}\n` +
                                `🆔 **ID:** \`${info.uploader_id || info.id || 'N/A'}\`\n` +
                                `🎥 **Video:** ${info.playlist_count || 'N/A'}\n` +
                                `🔗 [Link Profile](${info.webpage_url})`;

            await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, profileText, { parse_mode: 'Markdown' });
            return;
        }

        const fileSize = info.filesize || info.filesize_approx || 0;
        const duration = info.duration ? `${Math.floor(info.duration / 60)}p ${info.duration % 60}s` : 'N/A';
        
        const videoInfoText = `🎬 **VIDEO INFO**\n\n📌 **Tiêu đề:** ${info.title}\n👤 **Tác giả:** ${info.uploader || 'N/A'}\n⏱ **Thời lượng:** ${duration}\n📦 **Dung lượng:** ${(fileSize / (1024 * 1024)).toFixed(2)} MB`;

        userState.set(ctx.chat.id, { url, title: info.title, fileSize });

        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, videoInfoText, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📥 Tải Video', 'dl_video'), Markup.button.callback('🎵 Tải MP3', 'dl_audio')]
            ])
        });

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
