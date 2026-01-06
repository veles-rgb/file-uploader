const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs");

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeBase = path
            .basename(file.originalname)
            .replace(/[^\w.\-]+/g, "_");
        cb(null, `${Date.now()}_${Math.random().toString(16).slice(2)}_${safeBase}`);
    },
});

const MAX_FILE_SIZE = 10 * 1024 * 1024;

module.exports = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});