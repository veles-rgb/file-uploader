const buildFolderBreadcrumbs = require('../utils/pathBuilder');

async function postCreateFolder(req, res, next) {
    if (!req.user) return res.redirect('/login');

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const folder = await prisma.folder.create({
            data: {
                ownerId: req.user.id,
                parentId: req.body.parentId ? Number(req.body.parentId) : null,
                name: req.body.name.trim(),
            }
        });

        return res.redirect(`/folders/${folder.id}`);

    } catch (error) {
        return next(error);
    }
}

async function getFolderById(req, res, next) {
    if (!req.user) return res.redirect("/login");

    try {
        const { prisma } = await import("../lib/prisma.mjs");
        const path = require("node:path");

        const folderId = Number(req.params.id);
        const userId = req.user.id;

        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
        });

        if (!folder || folder.ownerId !== userId) {
            return res.status(404).render("notFound", {
                title: "Folder not found",
            });
        }

        const children = await prisma.folder.findMany({
            where: {
                ownerId: userId,
                parentId: folder.id,
            },
            orderBy: { createdAt: "asc" },
        });

        const filesInFolder = await prisma.file.findMany({
            where: {
                ownerId: userId,
                folderId: folder.id,
            },
            orderBy: { createdAt: "desc" },
        });

        const toPreviewUrl = require('../utils/getPreviewUrl');
        const files = filesInFolder.map((f) => ({
            ...f,
            previewUrl: toPreviewUrl(f.storagePath),
        }));

        const breadcrumbs = await buildFolderBreadcrumbs(prisma, userId, folder.id);

        res.render("folderId", {
            title: folder.name,
            currentFolderId: folder.id,
            folder,
            children,
            files,
            breadcrumbs
        });
    } catch (error) {
        next(error);
    }
}

async function renameFolder(req, res, next) {
    if (!req.user) return res.redirect("/login");

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const folderId = Number(req.params.id);
        const userId = req.user.id;
        const name = req.body.name?.trim();

        if (!name) {
            return res.redirect(`/folders/${folderId}`);
        }

        const result = await prisma.folder.updateMany({
            where: {
                id: folderId,
                ownerId: userId,
            },
            data: { name },
        });

        if (result.count === 0) {
            return res.status(404).render("file", {
                title: "Folder not found",
                result: null,
            });
        }

        res.redirect(`/folders/${folderId}`);
    } catch (err) {
        next(err);
    }
}

async function deleteFolderTree(prisma, folderId, userId) {
    const cloudinary = require("../utils/cloudinary");

    const filesInFolder = await prisma.file.findMany({
        where: { folderId, ownerId: userId },
        select: { id: true, cloudinaryPublicId: true, mimeType: true },
    });

    for (const f of filesInFolder) {
        if (!f.cloudinaryPublicId) continue;

        let resourceType = "raw";
        if (f.mimeType && f.mimeType.startsWith("image/")) resourceType = "image";
        else if (f.mimeType && f.mimeType.startsWith("video/")) resourceType = "video";

        await cloudinary.uploader.destroy(f.cloudinaryPublicId, {
            resource_type: resourceType,
        });
    }

    await prisma.file.deleteMany({
        where: { folderId, ownerId: userId }
    });

    const children = await prisma.folder.findMany({
        where: { parentId: folderId, ownerId: userId },
        select: { id: true }
    });

    for (const child of children) {
        await deleteFolderTree(prisma, child.id, userId);
    }

    await prisma.folder.deleteMany({
        where: { id: folderId, ownerId: userId }
    });
}

async function deleteFolder(req, res, next) {
    if (!req.user) return res.redirect("/login");

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const folderId = Number(req.params.id);
        const userId = req.user.id;

        const folder = await prisma.folder.findFirst({
            where: { id: folderId, ownerId: userId },
            select: { id: true, parentId: true }
        });

        if (!folder) {
            return res.status(404).render("file", {
                title: "Folder not found",
                result: null
            });
        }

        await deleteFolderTree(prisma, folderId, userId);

        if (folder.parentId) return res.redirect(`/folders/${folder.parentId}`);
        return res.redirect("/files");
    } catch (err) {
        next(err);
    }
}


module.exports = {
    postCreateFolder,
    getFolderById,
    renameFolder,
    deleteFolder
};