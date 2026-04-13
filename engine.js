const axios = require('axios');

const DivineEngine = {
    async extract(input, isLink) {
        try {
            // --- TRƯỜNG HỢP TRA PROFILE BẰNG USERNAME ---
            if (!isLink) {
                const res = await axios.get(`https://www.tikwm.com/api/user/info?uniqueId=${input}`);
                const u = res.data.data;
                if (!u) throw new Error("Không tìm thấy profile này rồi ní!");

                return {
                    type: 'PROFILE',
                    nickname: u.user.nickname,
                    uniqueId: u.user.uniqueId,
                    avatar: "https://www.tikwm.com" + u.user.avatarThumb,
                    signature: u.user.signature || "Không có tiểu sử",
                    stats: {
                        follower: u.stats.followerCount || 0,
                        heart: u.stats.heartCount || 0,
                        videoCount: u.stats.videoCount || 0
                    }
                };
            }

            // --- TRƯỜNG HỢP TẢI VIDEO BẰNG LINK ---
            const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(input)}`);
            const v = res.data.data;
            if (!v) throw new Error("API Download đang nghẽn!");

            const getFullUrl = (path) => {
                if (!path) return null;
                return path.startsWith('http') ? path : "https://www.tikwm.com" + path;
            };

            return {
                type: 'VIDEO',
                nickname: v.author.nickname,
                title: v.title || "Video TikTok",
                videoUrl: getFullUrl(v.play || v.wmplay),
                cover: getFullUrl(v.cover)
            };
        } catch (err) {
            console.error(err.message);
            throw new Error("Hệ thống nghẽn, mai dán lại nha ní!");
        }
    }
};

module.exports = DivineEngine;
