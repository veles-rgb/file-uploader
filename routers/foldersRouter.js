const { Router } = require("express");
const router = Router();

const controller = require('../controllers/foldersController');

router.post('/create', controller.postCreateFolder);
router.get('/:id', controller.getFolderById);


module.exports = router;