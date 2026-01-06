const buildFolderBreadcrumbs = require("../utils/pathBuilder");

async function renderFiles(req, res, next) {
    if (!req.user) return res.redirect('/login');

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const foldersFromDb = await prisma.folder.findMany({
            where: { ownerId: req.user.id, parentId: null }
        });

        const filesFromDb = await prisma.file.findMany({
            where: { ownerId: req.user.id, folderId: null }
        });

        const path = require("node:path");
        const toPreviewUrl = require('../utils/getPreviewUrl');
        const results = filesFromDb.map(f => ({
            ...f,
            previewUrl: toPreviewUrl(f.storagePath),
        }));

        res.render('files', {
            title: "File Viewer",
            foldersFromDb,
            results,
            currentFolder: null
        });
    } catch (error) {
        return next(error);
    }
}

async function renderFileById(req, res, next) {
    if (!req.user) return res.redirect('/login');

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const userId = req.user.id;

        const fileFromDb = await prisma.file.findUnique({
            where: { id: Number(req.params.id) }
        });

        if (!fileFromDb) {
            return res.status(404).render("file", {
                // THIS WONT WORK
                // THIS WONT WORK
                // THIS WONT WORK
                // THIS WONT WORK
                title: "File not found",
                result: null
            });
        }

        const path = require("node:path");

        const toPreviewUrl = require('../utils/getPreviewUrl');
        const result = {
            ...fileFromDb,
            previewUrl: toPreviewUrl(fileFromDb.storagePath),
        };

        const breadcrumbs = result.folderId
            ? await buildFolderBreadcrumbs(prisma, userId, result.folderId)
            : [];

        res.render('filesId', {
            title: result.originalName,
            result,
            breadcrumbs,
            currentFolderId: null
        });
    } catch (error) {
        return next(error);
    }
}

function renderUploadForm(req, res) {
    if (!req.user) return res.redirect('/login');

    const folderId = req.query.folderId
        ? Number(req.query.folderId)
        : null;

    res.render('uploadForm', {
        title: "Upload a file",
        currentFolderId: folderId,
    });
}

async function postUploadFile(req, res, next) {
    if (!req.user) return res.redirect("/login");

    try {
        if (!req.file) {
            return res.redirect("/files/upload");
        }

        const folderIdRaw = req.body.folderId;
        const folderId = folderIdRaw ? Number(folderIdRaw) : null;

        const { prisma } = await import("../lib/prisma.mjs");

        if (folderId !== null) {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: folderId,
                    ownerId: req.user.id,
                },
                select: { id: true },
            });

            if (!folder) {
                return res.status(403).send("Invalid folder");
            }
        }

        const cloudinary = require("../utils/cloudinary");
        const fs = require("node:fs/promises");

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "auto",
            folder: "file-uploader",
            use_filename: true,
            unique_filename: true,
        });

        await fs.unlink(req.file.path);

        await prisma.file.create({
            data: {
                ownerId: req.user.id,
                folderId,
                originalName: req.file.originalname,
                storagePath: uploadResult.secure_url,
                cloudinaryPublicId: uploadResult.public_id,
                mimeType: req.file.mimetype,
                sizeBytes: req.file.size,

            },
        });

        if (folderId !== null) {
            return res.redirect(`/folders/${folderId}`);
        }

        return res.redirect("/files");
    } catch (err) {
        return next(err);
    }
}


async function deleteFile(req, res, next) {
    if (!req.user) return res.redirect("/login");

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const userId = req.user.id;
        const fileId = Number(req.params.id);

        const fileFromDb = await prisma.file.findFirst({
            where: { id: fileId, ownerId: userId },
            select: { id: true, folderId: true, cloudinaryPublicId: true, mimeType: true },
        });

        if (!fileFromDb) {
            return res.status(404).render("file", {
                title: "File not found",
                result: null,
            });
        }

        if (fileFromDb.cloudinaryPublicId) {
            const cloudinary = require("../utils/cloudinary");

            const candidates = [];

            if (fileFromDb.mimeType && fileFromDb.mimeType.startsWith("image/")) {
                candidates.push("image", "raw", "video");
            } else if (fileFromDb.mimeType && fileFromDb.mimeType.startsWith("video/")) {
                candidates.push("video", "raw", "image");
            } else {
                candidates.push("raw", "image", "video");
            }

            for (const resourceType of candidates) {
                const resp = await cloudinary.uploader.destroy(fileFromDb.cloudinaryPublicId, {
                    resource_type: resourceType,
                });

                if (resp && resp.result === "ok") break;
            }
        }

        const result = await prisma.file.deleteMany({
            where: { id: fileId, ownerId: userId },
        });

        if (result.count === 0) {
            return res.status(404).render("file", {
                title: "File not found",
                result: null,
            });
        }

        if (fileFromDb.folderId !== null) {
            return res.redirect(`/folders/${fileFromDb.folderId}`);
        }

        return res.redirect("/files");
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    renderFiles,
    renderFileById,
    renderUploadForm,
    postUploadFile,
    deleteFile
};