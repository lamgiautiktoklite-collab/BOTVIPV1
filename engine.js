const axios = require('axios');

const DivineEngine = {
    async extract(url) {
        try {
            // --- XỬ LÝ TIKTOK ---
            if (url.includes('tiktok.com')) {
                const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                const data = res.data.data;
                if (!data) throw new Error("Không lấy được dữ liệu, thử link khác xem ní!");

                // Logic xử lý link: Nếu có sẵn http thì lấy, không thì mới cộng thêm domain
                const getFullUrl = (path) => {
                    if (!path) return null;
                    return path.startsWith('http') ? path : "https://www.tikwm.com" + path;
                };

                return {
                    platform: 'TIKTOK',
                    nickname: data.author.nickname,
                    uniqueId: data.author.uniqueId,
                    avatar: getFullUrl(data.author.avatar),
                    videoUrl: getFullUrl(data.play || data.wmplay),
                    title: data.title || "Video TikTok",
                    stats: {
                        follower: data.author.followerCount || 0,
                        heart: data.author.heartCount || 0
                    }
                };
            }

            // --- XỬ LÝ FACEBOOK ---
            if (url.includes('facebook.com') || url.includes('fb.watch')) {
                const res = await axios.get(`https://api.vytub.com/facebook/info?url=${encodeURIComponent(url)}`);
                const data = res.data;

                return {
                    platform: 'FACEBOOK',
                    title: data.title || "Video Facebook",
                    videoUrl: data.hd || data.sd,
                    avatar: data.thumbnail,
                    stats: { follower: "N/A", heart: "N/A" }
                };
            }

            throw new Error("Nền tảng này tui chưa luyện tới!");

        } catch (err) {
            console.error("Lỗi Engine:", err.message);
            throw new Error("API đang nghẽn hoặc chặn IP rồi ní!");
        }
    }
};

module.exports = DivineEngine;
