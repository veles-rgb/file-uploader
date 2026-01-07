const { Router } = require("express");
const router = Router();

const controller = require("../controllers/shareController");

router.get("/folder/:folderId", controller.renderShareForm);
router.post("/folder/:folderId", controller.postShareToken);
router.get('/:token', controller.renderShareView);
// Navigate to a subfolder within shared folder
router.get("/:token/folders/:folderId", controller.renderShareFolder);
// View a file within shared folder
router.get("/:token/files/:fileId", controller.renderShareFile);

module.exports = router;