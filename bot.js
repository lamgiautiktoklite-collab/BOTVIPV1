require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const http = require('http');

// Web Server cho Render
http.createServer((req, res) => {
    res.write("Bot is running!");
    res.end();
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN);

// Hàm giải mã ngày tạo (Chuẩn BigInt)
const getCreateTime = (id) => {
    try {
        const bigId = BigInt(id);
        const f = (n) => String(n).padStart(2, '0');
        let timestamp = Number(bigId / 2147483648n);
        let date = new Date(timestamp * 1000);
        if (date.getFullYear() > 2028 || date.getFullYear() < 2015) {
            timestamp = Number(bigId / 4294967296n);
            date = new Date(timestamp * 1000);
        }
        return `${f(date.getHours())}:${f(date.getMinutes())}:${f(date.getSeconds())} || ${f(date.getDate())}/${f(date.getMonth() + 1)}/${date.getFullYear()}`;
    } catch (e) { return "Không xác định"; }
};

// Check Info User
bot.command('tt', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return;
    const username = args[1].trim().replace('@', '');
    try {
        await ctx.sendChatAction('upload_photo');
        const res = await axios.get(`https://www.tikwm.com/api/user/info?unique_id=${username}`);
        if (res.data.code === 0 && res.data.data) {
            const { user, stats } = res.data.data;
            const caption = `╭─────────────⭓\n│ 𝗜𝗗: ${user.id}\n│ 𝗡𝗮𝗺𝗲: ${user.nickname}\n│ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: ${user.uniqueId}\n│ 𝗟𝗶𝗻𝗸: https://www.tiktok.com/@${user.uniqueId}\n│ 𝗩𝗲𝗿𝗶𝗳𝗶𝗲𝗱: ${user.verified ? 'Đã xác minh ✅' : 'Chưa xác minh ❌'}\n│ 𝗦𝘁𝗮𝘁𝘂𝘀:\n│ | -> Cá Nhân\n│ | -> ${user.privateAccount ? 'Riêng Tư' : 'Công khai'}\n│ 𝗖𝗿𝗲𝗮𝘁𝗲𝗱: ${getCreateTime(user.id)}\n│ 𝗕𝗶𝗼: ${user.signature || 'Không có'}\n├─────────────⭔\n│ 𝗙𝗼𝗹𝗹𝗼𝘄𝗲𝗿𝘀: ${stats.followerCount.toLocaleString()}\n│ 𝗙𝗼𝗹𝗹𝗼𝘄𝗶𝗻𝗴: ${stats.followingCount.toLocaleString()}\n│ 𝗟𝗶𝗸𝗲𝘀: ${stats.heartCount.toLocaleString()}\n│ 𝗩𝗶𝗱𝗲𝗼𝘀: ${stats.videoCount.toLocaleString()}\n╰─────────────⭓`;
            await ctx.replyWithPhoto({ url: user.avatarLarger }, { caption });
        }
    } catch (e) {}
});

// Tự động tải video & Tắt Preview Link
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (!text.includes('tiktok.com') || text.startsWith('/')) return;

    try {
        await ctx.sendChatAction('upload_video');
        
        const res = await axios.get(`https://www.tikwm.com/api/?url=${text}`);
        const data = res.data.data;

        if (res.data.code === 0) {
            // 1. Gửi video/ảnh
            if (data.play) {
                await ctx.replyWithVideo(
                    { url: data.play },
                    { 
                        caption: `🎬 ${data.title || 'TikTok Video'}`,
                        // Thêm nút bấm tải nhạc bên dưới video
                        ...Markup.inlineKeyboard([
                            [Markup.button.url('🎵 Tải Nhạc (MP3)', data.music)]
                        ])
                    }
                );
            } else if (data.images) {
                for (let img of data.images) {
                    await ctx.replyWithPhoto({ url: img });
                }
            }

            // 2. PHẦN QUAN TRỌNG: Gửi xong thì xóa cái link gốc của bạn để mất cái Preview thừa
            await ctx.deleteMessage().catch(() => {});
            
        }
    } catch (e) {
        console.error("Lỗi!");
    }
});

bot.launch().then(() => console.log('✅ Bot TikTok Siêu Sạch đã chạy!'));
