const { v4: uuidv4 } = require('uuid');

async function postShareToken(req, res, next) {
    if (!req.user) return res.redirect("/login");

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const folderId = Number(req.params.folderId);
        if (!Number.isInteger(folderId)) return res.status(404).render("error", { title: "Folder not found", message: "Folder Not Found." });
        const ownerId = req.user.id;

        const expiresRaw = req.body.expires;
        const expiresAt = expiresRaw ? new Date(expiresRaw) : null;

        const token = uuidv4();

        const share = await prisma.share.create({
            data: {
                expiresAt: expiresAt,
                folderId: folderId,
                ownerId: ownerId,
                token: token
            }
        });

        return res.redirect(`/share/${share.token}`);

    } catch (err) {
        return next(err);
    }
}

async function getFolder(folderId, ownerId) {
    const { prisma } = await import("../lib/prisma.mjs");

    const folder = await prisma.folder.findFirst({
        where: {
            id: folderId,
            ownerId: ownerId
        }
    });

    return folder;
}

async function renderShareForm(req, res, next) {
    if (!req.user) return res.redirect("/login");

    try {
        const folderId = Number(req.params.folderId);
        if (!Number.isInteger(folderId)) return res.status(404).render("error", { title: "Folder not found", message: "Folder Not Found." });
        const ownerId = req.user.id;
        const folder = await getFolder(folderId, ownerId);

        res.render('shareForm', {
            title: "Share a folder",
            folderId,
            ownerId,
            folder
        });

    } catch (error) {
        return next(error);
    }
}

async function renderShareView(req, res, next) {
    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const token = req.params.token;

        const share = await prisma.share.findFirst({
            where: { token },
            select: { folderId: true, ownerId: true, expiresAt: true },
        });

        if (!share) {
            return res.status(404).render("error", { title: "Share not found", message: "Share not found" });
        }

        if (share.expiresAt && share.expiresAt < new Date()) {
            return res.status(410).render("error", { title: "Share link expired", message: "Share link expired" });
        }

        const folder = await prisma.folder.findFirst({
            where: { id: share.folderId, ownerId: share.ownerId },
        });

        if (!folder) {
            return res.status(404).render("error", { title: "Shared folder not found", message: "Shared folder not found" });
        }

        const childFolders = await prisma.folder.findMany({
            where: {
                parentId: share.folderId,
                ownerId: share.ownerId,
            },
            orderBy: { createdAt: "asc" },
        });

        const childFiles = await prisma.file.findMany({
            where: {
                folderId: share.folderId,
                ownerId: share.ownerId,
            },
            orderBy: { createdAt: "desc" },
        });

        const toPreviewUrl = require('../utils/getPreviewUrl');
        const files = childFiles.map((f) => ({
            ...f,
            previewUrl: toPreviewUrl(f.storagePath),
        }));

        res.render("share", {
            title: "Shared Folder",
            token,
            folder,
            childFolders,
            files,
        });
    } catch (err) {
        return next(err);
    }
}

async function isDescendantFolder(prisma, folderId, rootFolderId) {
    let currentId = folderId;

    while (currentId !== null) {
        if (currentId === rootFolderId) return true;

        const folder = await prisma.folder.findUnique({
            where: { id: currentId },
            select: { parentId: true },
        });

        if (!folder) return false;
        currentId = folder.parentId;
    }

    return false;
}

const buildFolderBreadcrumbs = require("../utils/pathBuilder");

async function renderShareFolder(req, res, next) {
    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const token = req.params.token;
        const folderId = Number(req.params.folderId);

        if (!Number.isInteger(folderId)) {
            return res.status(404).render("error", {
                title: "Folder not found",
                message: "Folder not found",
            });
        }

        const share = await prisma.share.findFirst({
            where: { token },
            select: { folderId: true, ownerId: true, expiresAt: true },
        });

        if (!share) {
            return res.status(404).render("error", {
                title: "Share not found",
                message: "Share not found",
            });
        }

        if (share.expiresAt && share.expiresAt < new Date()) {
            return res.status(403).render("error", {
                title: "Share link expired",
                message: "This share link has expired.",
            });
        }

        const isAllowed = await isDescendantFolder(prisma, folderId, share.folderId);
        if (!isAllowed) {
            return res.status(403).render("error", {
                title: "Access denied",
                message: "You don’t have access to this folder via this share link.",
            });
        }

        const folder = await prisma.folder.findFirst({
            where: { id: folderId, ownerId: share.ownerId },
        });

        if (!folder) {
            return res.status(404).render("error", {
                title: "Folder not found",
                message: "Folder not found",
            });
        }

        const childFolders = await prisma.folder.findMany({
            where: { parentId: folder.id, ownerId: share.ownerId },
            orderBy: { createdAt: "asc" },
        });

        const childFilesRaw = await prisma.file.findMany({
            where: { folderId: folder.id, ownerId: share.ownerId },
            orderBy: { createdAt: "desc" },
        });

        const toPreviewUrl = require("../utils/getPreviewUrl");
        const childFiles = childFilesRaw.map((f) => ({
            ...f,
            previewUrl: toPreviewUrl(f.storagePath),
        }));

        const fullCrumbs = await buildFolderBreadcrumbs(prisma, share.ownerId, folder.id);

        const startIdx = fullCrumbs.findIndex((c) => c.id === share.folderId);
        const crumbsInShare = startIdx >= 0 ? fullCrumbs.slice(startIdx) : [];

        const breadcrumbs = crumbsInShare.map((c) => ({
            id: c.id,
            name: c.name,
            href: `/share/${token}/folders/${c.id}`,
        }));

        res.render("shareFolderId", {
            title: folder.name,
            token,
            folder,
            childFolders,
            childFiles,
            breadcrumbs,
            shareRootFolderId: share.folderId,
        });
    } catch (error) {
        return next(error);
    }
}

async function renderShareFile(req, res, next) {
    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const token = req.params.token;
        const fileId = Number(req.params.fileId);

        if (!Number.isInteger(fileId)) {
            return res.status(404).render("error", { title: "File not found", message: "File not found" });
        }

        const share = await prisma.share.findFirst({
            where: { token },
            select: { folderId: true, ownerId: true, expiresAt: true },
        });

        if (!share) {
            return res.status(404).render("error", { title: "Share not found", message: "Share not found" });
        }

        if (share.expiresAt && share.expiresAt < new Date()) {
            return res.status(410).render("error", { title: "Share expired", message: "Share expired" });
        }

        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                ownerId: share.ownerId,
            },
        });

        if (!file) {
            return res.status(404).render("error", { title: "File not found", message: "File not found" });
        }

        const isAllowed = await isDescendantFolder(prisma, file.folderId, share.folderId);

        if (!isAllowed) {
            return res.status(403).render("error", { title: "Access denied", message: "Access denied" });
        }

        const toPreviewUrl = require("../utils/getPreviewUrl");
        const fileWithPreview = {
            ...file,
            previewUrl: toPreviewUrl(file.storagePath),
        };

        const buildFolderBreadcrumbs = require("../utils/pathBuilder");

        const fullCrumbs = await buildFolderBreadcrumbs(prisma, share.ownerId, file.folderId);

        const startIdx = fullCrumbs.findIndex((c) => c.id === share.folderId);
        const crumbsInShare = startIdx >= 0 ? fullCrumbs.slice(startIdx) : [];

        const breadcrumbs = crumbsInShare.map((c) => ({
            id: c.id,
            name: c.name,
            href: `/share/${token}/folders/${c.id}`,
        }));

        return res.render("shareFileId", {
            title: file.originalName,
            token,
            file: fileWithPreview,
            breadcrumbs,
        });
    } catch (error) {
        return next(error);
    }
}

async function deleteShare(req, res, next) {
    if (!req.user) return res.redirect("/login");

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const userId = req.user.id;
        const folderId = Number(req.params.id);

        if (!Number.isInteger(folderId)) {
            return res.status(404).render("error", { title: "Folder not found", message: "Folder not found" });
        }

        const result = await prisma.share.deleteMany({
            where: {
                folderId: folderId,
                ownerId: userId,
            },
        });

        if (result.count === 0) {
            return res.status(404).render("error", { title: "Share not found", message: "Share not found" });
        }

        return res.redirect(`/folders/${folderId}`);
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    postShareToken,
    renderShareForm,
    renderShareView,
    renderShareFolder,
    renderShareFile,
    deleteShare
};