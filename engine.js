const axios = require('axios');

const DivineEngine = {
    async extract(url) {
        try {
            if (url.includes('tiktok.com')) {
                const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                const data = res.data.data;
                if (!data) throw new Error("API nghẽn rồi ní ơi, thử lại sau nhé!");

                const getFullUrl = (path) => {
                    if (!path) return null;
                    return path.startsWith('http') ? path : "https://www.tikwm.com" + path;
                };

                // FIX FOLLOW: Kiểm tra nhiều nguồn dữ liệu trong JSON trả về
                const author = data.author || {};
                const stats = data.statistics || {}; // Thử lấy từ statistics nếu author không có

                return {
                    platform: 'TIKTOK',
                    nickname: author.nickname || "Người dùng TikTok",
                    uniqueId: author.uniqueId || author.id || "hidden",
                    avatar: getFullUrl(author.avatar),
                    videoUrl: getFullUrl(data.play || data.wmplay),
                    title: data.title || "Video TikTok",
                    stats: {
                        // Ưu tiên lấy từ author, nếu 0 thì lấy từ các trường phụ của API
                        follower: author.followerCount || data.author_follower_count || 0,
                        heart: author.heartCount || stats.digg_count || data.collect_count || 0
                    }
                };
            }

            // --- GIỮ NGUYÊN FB ---
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
        } catch (err) {
            console.error("Lỗi Engine:", err.message);
            throw new Error("API đang bận, ní đợi tí dán lại nhé!");
        }
    }
};

module.exports = DivineEngine;
