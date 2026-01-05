const { Router } = require("express");
const router = Router();

const controller = require("../controllers/filesController");
const upload = require("../middleware/upload");

router.get('/', controller.renderFiles);
router.get('/upload', controller.renderUploadForm);
router.post('/upload', upload.single('file'), controller.postUploadFile);
router.post('/:id/delete', controller.deleteFile);
router.get('/:id', controller.renderFileById);

module.exports = router;