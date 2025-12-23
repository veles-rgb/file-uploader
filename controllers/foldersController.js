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

        const files = filesInFolder.map((f) => ({
            ...f,
            previewUrl: `/uploads/${path.basename(f.storagePath)}`,
        }));

        res.render("folderId", {
            title: folder.name,
            currentFolderId: folder.id,
            folder,
            children,
            files,
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    postCreateFolder,
    getFolderById
};