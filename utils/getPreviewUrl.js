function toPreviewUrl(storagePath) {
    if (!storagePath) return "";
    if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
        return storagePath;
    }
    const path = require("node:path");
    return `/uploads/${path.basename(storagePath)}`;
}

module.exports = toPreviewUrl;