const youtubeDl = require('yt-dlp-exec');

const DivineEngine = {
    async extract(url) {
        try {
            // Sử dụng Promise.race để chặn đứng việc treo vĩnh viễn
            const data = await Promise.race([
                youtubeDl(url, {
                    dumpSingleJson: true,
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true,
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 15000))
            ]);

            const isProfile = url.includes('/@') || (url.includes('facebook.com') && !url.includes('/videos/'));
            const bestFormat = data.formats?.filter(f => f.vcodec !== 'none' && f.acodec !== 'none').pop() || data;

            return {
                type: isProfile ? 'PROFILE' : 'VIDEO',
                title: data.title || "N/A",
                avatar: data.thumbnail || (data.thumbnails?.[0]?.url),
                videoUrl: bestFormat.url,
                size: ((data.filesize || data.filesize_approx || 0) / 1048576).toFixed(2),
                platform: data.extractor_key?.toUpperCase() || 'WEB'
            };
        } catch (err) {
            throw new Error(err.message === 'TIMEOUT_EXCEEDED' ? "Server Render quá yếu, hãy thử lại!" : "Lỗi bóc tách!");
        }
    }
};

module.exports = DivineEngine;
