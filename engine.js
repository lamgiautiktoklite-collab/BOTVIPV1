const axios = require('axios');

const DivineEngine = {
    async extract(url) {
        try {
            // Sử dụng API Tikwm (Miễn phí và cực nhanh cho TikTok)
            if (url.includes('tiktok.com')) {
                const res = await axios.post('https://www.tikwm.com/api/', {
                    url: url
                });
                
                const data = res.data.data;
                if (!data) throw new Error("API_ERROR");

                return {
                    type: 'VIDEO',
                    title: data.title || "TikTok Video",
                    author: data.author.nickname,
                    avatar: "https://www.tikwm.com" + data.author.avatar,
                    videoUrl: "https://www.tikwm.com" + data.play,
                    size: (data.size / 1048576).toFixed(2),
                    platform: 'TIKTOK'
                };
            }

            // Với các nền tảng khác, vẫn dùng logic cũ nhưng nới lỏng timeout
            throw new Error("Hệ thống đang ưu tiên TikTok, nền tảng khác hãy thử lại sau!");
        } catch (err) {
            console.error(err);
            throw new Error("Server Render quá yếu hoặc API bị nghẽn!");
        }
    }
};

module.exports = DivineEngine;
