const { title } = require("node:process");

async function renderFiles(req, res, next) {
    if (!req.user) return res.redirect('/login');

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const filesFromDb = await prisma.file.findMany({
            where: { ownerId: req.user.id }
        });

        const path = require("node:path");
        const results = filesFromDb.map(f => ({
            ...f,
            previewUrl: `/uploads/${path.basename(f.storagePath)}`
        }));

        res.render('files', {
            title: "File Viewer",
            results
        });
    } catch (error) {
        return next(error);
    }
}

async function renderFileById(req, res, next) {
    if (!req.user) return res.redirect('/login');

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const fileFromDb = await prisma.file.findFirst({
            where: { id: Number(req.params.id) }
        });

        if (!fileFromDb) {
            return res.status(404).render("file", {
                title: "File not found",
                result: null
            });
        }

        const path = require("node:path");

        const result = {
            ...fileFromDb,
            previewUrl: `/uploads/${path.basename(fileFromDb.storagePath)}`
        };

        res.render('filesId', {
            title: result.originalName,
            result
        });
    } catch (error) {
        return next(error);
    }
}

function renderUploadForm(req, res) {
    if (!req.user) return res.redirect('/login');

    res.render('uploadForm', {
        title: "Upload a file"
    });
}

async function postUploadFile(req, res, next) {
    if (!req.user) return res.redirect('/login');

    try {
        if (!req.file) {
            return res.status(400).redirect("/files/upload");
        }

        // const folderIdRaw = req.body.folderId;
        // const folderId = folderIdRaw ? Number(folderIdRaw) : null;

        const { prisma } = await import("../lib/prisma.mjs");

        await prisma.file.create({
            data: {
                ownerId: req.user.id,
                folderId: null,
                originalName: req.file.originalname,
                storagePath: req.file.path,
                mimeType: req.file.mimetype,
                sizeBytes: req.file.size,
            }
        });

        // if (folderId) return res.redirect(`/folders/${folderId}`);
        return res.redirect('/');
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    renderFiles,
    renderFileById,
    renderUploadForm,
    postUploadFile,
};