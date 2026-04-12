const youtubeDl = require('yt-dlp-exec');

const DivineEngine = {
    async extract(url) {
        const options = {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: [
                'referer:https://www.tiktok.com/',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        };
        
        try {
            const data = await youtubeDl(url, options);
            return this.refineData(data, url);
        } catch (err) {
            console.error("Engine Error:", err.message);
            throw new Error("Không thể bóc tách link này!");
        }
    },

    refineData(data, originalUrl) {
        // Nhận diện Profile
        const isProfile = data._type === 'playlist' || originalUrl.includes('/@') || (originalUrl.includes('facebook.com') && !originalUrl.includes('/videos/'));
        
        // Lấy ảnh đại diện nét nhất
        const avatar = data.thumbnail || (data.thumbnails?.length ? data.thumbnails[data.thumbnails.length - 1].url : null);

        // Lấy link video trực tiếp (ưu tiên mp4 có tiếng)
        const bestFormat = data.formats?.filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4').pop() 
                           || data.formats?.filter(f => f.vcodec !== 'none' && f.acodec !== 'none').pop() 
                           || data;

        return {
            type: isProfile ? 'PROFILE' : 'VIDEO',
            title: data.title || "N/A",
            author: data.uploader || data.channel || "Người dùng ẩn danh",
            id: data.uploader_id || data.id || "N/A",
            avatar: avatar,
            videoUrl: bestFormat.url,
            duration: data.duration ? `${Math.floor(data.duration / 60)}p${data.duration % 60}s` : 'N/A',
            size: ((data.filesize || data.filesize_approx || 0) / 1048576).toFixed(2),
            platform: data.extractor_key?.toUpperCase() || 'UNKNOWN'
        };
    }
};

module.exports = DivineEngine;
