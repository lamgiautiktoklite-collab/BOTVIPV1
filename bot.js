require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// --- TẠO WEB SERVER ĐỂ RENDER KHÔNG STOP BOT ---
http.createServer((req, res) => {
    res.write("Bot TikTok is Live!");
    res.end();
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN);

/**
 * Giải mã ngày tạo từ TikTok ID (Đã fix lỗi xuyên không)
 */
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
    } catch (e) {
        return "Không xác định";
    }
};

// Chào mừng
bot.start((ctx) => ctx.reply('🚀 Bot sẵn sàng! \n- Gửi link TikTok để tải video.\n- Gõ /tt [username] để check info.'));

// Lệnh /tt [username]
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
        } else {
            await ctx.reply('❌ Không tìm thấy user này.');
        }
    } catch (err) {
        await ctx.reply('⚠️ Lỗi API Info!');
    }
});

// Tự động tải video khi gửi link
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (!text.includes('tiktok.com') || text.startsWith('/')) return;

    try {
        await ctx.reply('⏳ Đang xử lý video không logo...');
        await ctx.sendChatAction('upload_video');
        const res = await axios.get(`https://www.tikwm.com/api/?url=${text}`);
        const data = res.data.data;

        if (res.data.code === 0) {
            if (data.play) {
                await ctx.replyWithVideo({ url: data.play }, { caption: `🎬 ${data.title || 'TikTok Video'}` });
            } else if (data.images) {
                for (let img of data.images) {
                    await ctx.replyWithPhoto({ url: img });
                }
            }
        } else {
            await ctx.reply('❌ Link không tải được (có thể video riêng tư).');
        }
    } catch (e) {
        await ctx.reply('⚠️ Lỗi tải video!');
    }
});

bot.launch().then(() => console.log('✅ Bot đang chạy trên Render...'));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
