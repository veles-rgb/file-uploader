const { Router } = require("express");
const router = Router();

const controller = require("../controllers/filesController");
const upload = require("../middleware/upload");

router.get('/', controller.renderFiles);
router.get('/upload', controller.renderUploadForm);
router.post(
    '/upload',
    upload.single('file'),
    (err, req, res, next) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).render('error', {
                    title: 'Upload Error',
                    message: 'File is too large. Maximum size is 10MB.',
                });
            }

            return res.status(500).render('error', {
                title: 'Upload Error',
                message: 'Something went wrong while uploading the file.',
            });
        }

        next();
    },
    controller.postUploadFile
);

router.post('/:id/delete', controller.deleteFile);
router.get('/:id', controller.renderFileById);

module.exports = router;