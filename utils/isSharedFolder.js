async function isSharedFolder(folderId, userId) {
    const { prisma } = await import("../lib/prisma.mjs");

    const share = await prisma.share.findFirst({
        where: {
            folderId: Number(folderId),
            ownerId: Number(userId),
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
            ],
        },
        select: {
            token: true,
        },
    });

    return share ? share.token : null;
}

module.exports = isSharedFolder;
