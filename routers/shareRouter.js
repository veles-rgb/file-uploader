const { Router } = require("express");
const router = Router();

const controller = require("../controllers/shareController");

router.get("/folder/:folderId", controller.renderShareForm);
router.post("/folder/:folderId", controller.postShareToken);

router.get("/:token/folders/:folderId", controller.renderShareFolder);
router.get("/:token/files/:fileId", controller.renderShareFile);

router.get("/:token", controller.renderShareView);

router.post("/:id/unshare", controller.deleteShare);


module.exports = router;