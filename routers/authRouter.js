const { Router } = require("express");
const router = Router();
const passport = require("passport");

const controller = require("../controllers/authController");
const validateRegister = require("../validators/validateRegister");

router.get('/', controller.renderIndex);
router.get('/register', controller.renderRegisterForm);
router.post('/register', validateRegister, controller.postRegisterForm);
router.get('/login', controller.renderLoginForm);
router.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
    })
);
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

module.exports = router;