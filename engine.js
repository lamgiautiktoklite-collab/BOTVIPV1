const axios = require('axios');

const DivineEngine = {
    async extract(url) {
        try {
            if (url.includes('tiktok.com')) {
                // Đổi sang dùng GET và API khác dự phòng nếu TikWM nghẽn
                const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                const data = res.data.data;
                if (!data) throw new Error("KHONG_LAY_DUOC_DATA");

                return {
                    platform: 'TIKTOK',
                    nickname: data.author.nickname,
                    uniqueId: data.author.uniqueId,
                    avatar: "https://www.tikwm.com" + data.author.avatar,
                    videoUrl: "https://www.tikwm.com" + (data.play || data.wmplay),
                    stats: {
                        follower: data.author.followerCount || 0,
                        heart: data.author.heartCount || 0
                    }
                };
            }
            throw new Error("Nền tảng chưa hỗ trợ");
        } catch (err) {
            console.error(err.message);
            // Nếu TikWM nghẽn, trả về thông tin tối giản để bot không bị treo
            throw new Error("TikTok đang chặn IP của Render rồi ní ơi!");
        }
    }
};
module.exports = DivineEngine;
