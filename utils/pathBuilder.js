async function buildFolderBreadcrumbs(prisma, userId, folderId) {
    const crumbs = [];
    let currentId = folderId;

    while (currentId) {
        const folder = await prisma.folder.findFirst({
            where: { id: currentId, ownerId: userId },
            select: { id: true, name: true, parentId: true },
        });

        if (!folder) break;
        crumbs.push({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
    }

    crumbs.reverse();
    return crumbs;
}

module.exports = buildFolderBreadcrumbs;