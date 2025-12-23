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
        const results = filesFromDb.map(f => ({
            ...f,
            previewUrl: `/uploads/${path.basename(f.storagePath)}`
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

    const folderId = req.query.folderId
        ? Number(req.query.folderId)
        : null;

    res.render('uploadForm', {
        title: "Upload a file",
        currentFolderId: folderId,
    });
}

async function postUploadFile(req, res, next) {
    if (!req.user) return res.redirect('/login');

    try {
        if (!req.file) {
            return res.redirect('/files/upload');
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
            });

            if (!folder) {
                return res.status(403).send("Invalid folder");
            }
        }

        await prisma.file.create({
            data: {
                ownerId: req.user.id,
                folderId,
                originalName: req.file.originalname,
                storagePath: req.file.path,
                mimeType: req.file.mimetype,
                sizeBytes: req.file.size,
            },
        });

        if (folderId !== null) {
            return res.redirect(`/folders/${folderId}`);
        }

        return res.redirect('/files');
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