const axios = require('axios');

const DivineEngine = {
    async extract(url) {
        try {
            // 1. XỬ LÝ TRA PROFILE (Nếu link chứa @ nhưng không phải link video cụ thể)
            if (url.includes('@') && !url.includes('/video/')) {
                // Sử dụng API quét profile
                const res = await axios.get(`https://www.tikwm.com/api/user/info?uniqueId=${url.split('@')[1].split('?')[0]}`);
                const u = res.data.data;
                if (!u) throw new Error("Không tìm thấy Profile này!");

                return {
                    type: 'PROFILE',
                    nickname: u.user.nickname,
                    uniqueId: u.user.uniqueId,
                    avatar: "https://www.tikwm.com" + u.user.avatarThumb,
                    signature: u.user.signature || "Không có tiểu sử",
                    stats: {
                        follower: u.stats.followerCount,
                        heart: u.stats.heartCount,
                        videoCount: u.stats.videoCount
                    }
                };
            }

            // 2. XỬ LÝ DOWNLOAD VIDEO (Link video hoặc link rút gọn vt.tiktok)
            if (url.includes('tiktok.com')) {
                const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
                const v = res.data.data;
                if (!v) throw new Error("API Download đang nghẽn!");

                return {
                    type: 'VIDEO',
                    nickname: v.author.nickname,
                    title: v.title || "Video TikTok",
                    videoUrl: v.play.startsWith('http') ? v.play : "https://www.tikwm.com" + v.play,
                    cover: "https://www.tikwm.com" + v.cover
                };
            }
        } catch (err) {
            throw new Error("Lỗi hệ thống rồi ní!");
        }
    }
};
module.exports = DivineEngine;
