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

        res.render("share", {
            title: "Shared Folder",
        });

    } catch (err) {
        return next(err);
    }
}

async function renderShareFolder(req, res, next) {

}

async function renderShareFile(req, res, next) {

}

module.exports = {
    postShareToken,
    renderShareForm,
    renderShareView,
    renderShareFolder,
    renderShareFile
};