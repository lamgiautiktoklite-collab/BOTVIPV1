const axios = require('axios');

const DivineEngine = {
    async extract(url) {
        try {
            // --- XỬ LÝ TIKTOK (Dùng API TikWM) ---
            if (url.includes('tiktok.com')) {
                const res = await axios.post('https://www.tikwm.com/api/', { url: url });
                const data = res.data.data;
                if (!data) throw new Error("Link TikTok không hợp lệ hoặc riêng tư");

                return {
                    type: 'VIDEO',
                    title: data.title || "Video TikTok",
                    author: data.author.nickname,
                    avatar: "https://www.tikwm.com" + data.author.avatar,
                    videoUrl: "https://www.tikwm.com" + data.play, // Link không logo
                    size: (data.size / 1048576).toFixed(2),
                    platform: 'TIKTOK'
                };
            }

            // --- XỬ LÝ FACEBOOK (Dùng API SnapSave - Giả lập) ---
            if (url.includes('facebook.com') || url.includes('fb.watch')) {
                // Lưu ý: SnapSave không có API free chính thức, 
                // đây là cách gọi qua một đầu endpoint trung gian phổ biến
                const res = await axios.get(`https://api.vytub.com/facebook/info?url=${encodeURIComponent(url)}`);
                const data = res.data;

                return {
                    type: 'VIDEO',
                    title: data.title || "Video Facebook",
                    author: "Facebook User",
                    avatar: data.thumbnail || null,
                    videoUrl: data.sd || data.hd, // Lấy link HD nếu có
                    size: "N/A",
                    platform: 'FACEBOOK'
                };
            }

            throw new Error("Nền tảng này chưa được hỗ trợ API Siêu Tốc");

        } catch (err) {
            console.error("Lỗi API:", err.message);
            throw new Error("API đang bảo trì hoặc link không quét được!");
        }
    }
};

module.exports = DivineEngine;
