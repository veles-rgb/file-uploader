require("dotenv").config();

const express = require("express");
const app = express();
const path = require("node:path");

const session = require("express-session");
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const assetsPath = path.join(__dirname, "public");

(async () => {
    const { prisma } = await import("./lib/prisma.mjs");

    // View engine
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "ejs");

    // Body parsing + static assets
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(assetsPath));

    // Sessions store using PrismaSessionStore
    app.use(
        session({
            cookie: {
                maxAge: 1000 * 60 * 60 * 24,
            },
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            store: new PrismaSessionStore(prisma, {
                checkPeriod: 2 * 60 * 1000,
                dbRecordIdIsSessionId: true,
            })
        })
    );

    // Passport init + session hookup
    app.use(passport.initialize());
    app.use(passport.session());

    // Routers
    const authRouter = require("./routers/authRouter.js");
    const filesRouter = require("./routers/filesRouter.js");
    const foldersRouter = require("./routers/foldersRouter.js");
    const shareRouter = require("./routers/shareRouter.js");

    // Passport Local Strategy (bcrypt)
    passport.use(
        new LocalStrategy({ usernameField: "username" }, async (username, password, done) => {
            try {
                const user = await prisma.user.findUnique({
                    where: { username },
                });

                if (!user) return done(null, false, { message: "Incorrect username" });

                const ok = await bcrypt.compare(password, user.hashedPassword);
                if (!ok) return done(null, false, { message: "Incorrect password" });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: Number(id) },
            });

            done(null, user || false);
        } catch (err) {
            done(err);
        }
    });

    // Add currentUser on all requests
    app.use((req, res, next) => {
        res.locals.currentUser = req.user;
        next();
    });

    // Add activePath on all requests
    app.use((req, res, next) => {
        res.locals.activePath = req.path;
        next();
    });

    // Routes
    app.use('/', authRouter);
    app.use('/files', filesRouter);
    app.use('/folders', foldersRouter);
    app.use('/share', shareRouter);


    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
})();