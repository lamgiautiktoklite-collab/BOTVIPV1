require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// Web Server giữ bot sống trên Render
http.createServer((req, res) => {
    res.write("Bot is running!");
    res.end();
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN);

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
    if (args.length < 2) return ctx.reply('⚠️ Cú pháp: /tt [username]');
    const username = args[1].trim().replace('@', '');
    try {
        await ctx.sendChatAction('upload_photo');
        const res = await axios.get(`https://www.tikwm.com/api/user/info?unique_id=${username}`);
        if (res.data.code === 0 && res.data.data) {
            const { user, stats } = res.data.data;
            const caption = `╭─────────────⭓
│ 𝗜𝗗: ${user.id}
│ 𝗡𝗮𝗺𝗲: ${user.nickname}
│ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: ${user.uniqueId}
│ 𝗟𝗶𝗻𝗸: https://www.tiktok.com/@${user.uniqueId}
│ 𝗩𝗲𝗿𝗶𝗳𝗶𝗲𝗱: ${user.verified ? 'Đã xác minh ✅' : 'Chưa xác minh ❌'}
│ 𝗦𝘁𝗮𝘁𝘂𝘀:
│ | -> Cá Nhân
│ | -> ${user.privateAccount ? 'Riêng Tư' : 'Công khai'}
│ 𝗖𝗿𝗲𝗮𝘁𝗲𝗱: ${getCreateTime(user.id)}
│ 𝗕𝗶𝗼: ${user.signature || 'Không có'}
├─────────────⭔
│ 𝗙𝗼𝗹𝗹𝗼𝘄𝗲𝗿𝘀: ${stats.followerCount.toLocaleString()}
│ 𝗙𝗼𝗹𝗹𝗼𝘄𝗶𝗻𝗴: ${stats.followingCount.toLocaleString()}
│ 𝗟𝗶𝗸𝗲𝘀: ${stats.heartCount.toLocaleString()}
│ 𝗩𝗶𝗱𝗲𝗼𝘀: ${stats.videoCount.toLocaleString()}
╰─────────────⭓`;
            await ctx.replyWithPhoto({ url: user.avatarLarger }, { caption });
        }
    } catch (e) {}
});

// Tự động tải video (Đã bỏ tin nhắn thừa)
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (!text.includes('tiktok.com') || text.startsWith('/')) return;

    try {
        // Chỉ hiện hiệu ứng "đang gửi video" ở trên cùng, không gửi tin nhắn rác vào chat
        await ctx.sendChatAction('upload_video');
        
        const res = await axios.get(`https://www.tikwm.com/api/?url=${text}`);
        const data = res.data.data;

        if (res.data.code === 0) {
            if (data.play) {
                await ctx.replyWithVideo(
                    { url: data.play },
                    { caption: `🎬 ${data.title || 'TikTok Video'}` }
                );
            } else if (data.images) {
                // Đối với bộ ảnh thì vẫn nên báo một câu cho user biết
                const msg = await ctx.reply('📸 Đang gửi bộ ảnh...');
                for (let img of data.images) {
                    await ctx.replyWithPhoto({ url: img });
                }
                // Gửi xong thì xóa câu thông báo đi cho sạch
                await ctx.deleteMessage(msg.message_id).catch(() => {});
            }
        }
    } catch (e) {
        console.error("Lỗi tải!");
    }
});

bot.launch().then(() => console.log('✅ Bot TikTok xịn xò đã chạy!'));
