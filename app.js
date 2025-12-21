require("dotenv").config();

const express = require("express");
const app = express();
const path = require("node:path");

const session = require("express-session");
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');
const pgSession = require("connect-pg-simple")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const assetsPath = path.join(__dirname, "public");

// View engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Body parsing + static assets
app.use(express.urlencoded({ extended: false }));
app.use(express.static(assetsPath));

// Sessions store using PrismaSessionStore
app.use(
    expressSession({
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
        },
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        store: new PrismaSessionStore(
            new PrismaClient(),
            {
                checkPeriod: 2 * 60 * 1000,
                dbRecordIdIsSessionId: true,
                dbRecordIdFunction: undefined,
            }
        )
    })
);

// Passport init + session hookup
app.use(passport.initialize());
app.use(passport.session());

// Routers

// Passport Local Strategy (bcrypt)
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM users WHERE username = $1",
                [username]
            );

            const user = rows[0];
            if (!user) return done(null, false, { message: "Incorrect username" });

            const ok = await bcrypt.compare(password, user.password_hash);
            if (!ok) return done(null, false, { message: "Incorrect password" });

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        done(null, rows[0] || false);
    } catch (err) {
        done(err);
    }
});

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.use((req, res, next) => {
    res.locals.activePath = req.path;
    next();
});

// Routes

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});