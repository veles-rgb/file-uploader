const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

function renderIndex(req, res) {
    res.render('index', {
        title: "Veles File"
    });
}

function renderRegisterForm(req, res) {
    if (req.user) return res.redirect("/");

    res.render("registerForm", {
        title: "Register Account",
        errors: [],
        values: { fullname: "", username: "" },
    });
}

async function postRegisterForm(req, res, next) {
    if (req.user) return res.redirect("/");

    const errors = validationResult(req);
    const { fullname, username } = req.body;

    if (!errors.isEmpty()) {
        return res.status(400).render("registerForm", {
            title: "Register Account",
            errors: errors.array(),
            values: { fullname, username },
        });
    }

    try {
        const { prisma } = await import("../lib/prisma.mjs");

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        await prisma.user.create({
            data: {
                username,
                hashedPassword,
                email: req.body.email,
            },
        });

        return res.redirect("/login");
    } catch (error) {
        return next(error);
    }
}

function renderLoginForm(req, res) {
    if (req.user) return res.redirect("/");

    res.render("loginForm", {
        title: "Login",
    });
}

module.exports = {
    renderIndex,
    renderRegisterForm,
    postRegisterForm,
    renderLoginForm,
};