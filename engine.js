const axios = require('axios');

const DivineEngine = {
    async extract(url) {
        try {
            if (url.includes('tiktok.com')) {
                // ĐỔI SANG API TIKLYDOWN ĐỂ LẤY FULL INFO
                const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
                const result = res.data;

                if (!result || !result.author) {
                    throw new Error("API này cũng nghẽn rồi!");
                }

                return {
                    platform: 'TIKTOK',
                    nickname: result.author.nickname || "User",
                    uniqueId: result.author.uniqueId || "hidden",
                    avatar: result.author.avatar,
                    // Lấy link video không logo chuẩn
                    videoUrl: result.video.noWatermark || result.video.watermark,
                    title: result.title || "Video TikTok",
                    stats: {
                        // Thằng này lấy stats cực chuẩn nè ní
                        follower: result.author.stats?.followerCount || result.statistics?.followerCount || "N/A",
                        heart: result.statistics?.likeCount || result.statistics?.diggCount || 0
                    }
                };
            }

            // FB GIỮ NGUYÊN VÌ NÓ ĐANG CHẠY NGON
            if (url.includes('facebook.com') || url.includes('fb.watch')) {
                const res = await axios.get(`https://api.vytub.com/facebook/info?url=${encodeURIComponent(url)}`);
                return {
                    platform: 'FACEBOOK',
                    title: res.data.title || "Video Facebook",
                    videoUrl: res.data.hd || res.data.sd,
                    avatar: res.data.thumbnail,
                    stats: { follower: "N/A", heart: "N/A" }
                };
            }
        } catch (err) {
            console.error("Lỗi Engine:", err.message);
            throw new Error("Tất cả cổng API đều bị TikTok chặn rồi, mai thử lại ní ơi!");
        }
    }
};

module.exports = DivineEngine;
