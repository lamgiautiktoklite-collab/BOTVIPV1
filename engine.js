const axios = require('axios');

const DivineEngine = {
    async extract(url) {
        try {
            // --- XỬ LÝ TIKTOK (API TikWM - Cực mạnh) ---
            if (url.includes('tiktok.com')) {
                const res = await axios.post('https://www.tikwm.com/api/', { url: url });
                const data = res.data.data;
                
                if (!data) throw new Error("Không tìm thấy dữ liệu TikTok");

                // Nếu là link video, nó vẫn trả về info của tác giả (author)
                return {
                    type: url.includes('/video/') ? 'VIDEO' : 'PROFILE',
                    title: data.title || "Video TikTok",
                    nickname: data.author.nickname,
                    uniqueId: data.author.uniqueId,
                    avatar: "https://www.tikwm.com" + data.author.avatar,
                    videoUrl: "https://www.tikwm.com" + (data.play || data.wmplay),
                    size: data.size ? (data.size / 1048576).toFixed(2) : "0",
                    // Thêm thông số profile
                    stats: {
                        follower: data.author.followerCount || "N/A",
                        heart: data.author.heartCount || "N/A",
                        videoCount: data.author.videoCount || "N/A"
                    },
                    platform: 'TIKTOK'
                };
            }

            // --- XỬ LÝ FACEBOOK (API Vytub - Fix lỗi treo) ---
            if (url.includes('facebook.com') || url.includes('fb.watch')) {
                const res = await axios.get(`https://api.vytub.com/facebook/info?url=${encodeURIComponent(url)}`);
                const data = res.data;

                return {
                    type: 'VIDEO',
                    title: data.title || "Video Facebook",
                    author: "Facebook User",
                    avatar: data.thumbnail,
                    videoUrl: data.hd || data.sd,
                    size: "N/A",
                    platform: 'FACEBOOK'
                };
            }

            throw new Error("Nền tảng chưa hỗ trợ");
        } catch (err) {
            throw new Error("API nghẽn rồi ní ơi, thử lại sau nhé!");
        }
    }
};

module.exports = DivineEngine;
