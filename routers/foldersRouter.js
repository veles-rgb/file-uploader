const { Router } = require("express");
const router = Router();

const controller = require('../controllers/foldersController');

router.post('/create', controller.postCreateFolder);
router.post("/:id/rename", controller.renameFolder);
router.post("/:id/delete", controller.deleteFolder);
router.get('/:id', controller.getFolderById);


module.exports = router;