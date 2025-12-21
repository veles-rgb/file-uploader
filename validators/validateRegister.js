const { body } = require("express-validator");

const validateRegister = [
    body("username")
        .trim()
        .notEmpty().withMessage("Username cannot be empty.")
        .isLength({ min: 3, max: 20 }).withMessage("Username must be between 3 & 20 characters")
        .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores")
        .isLowercase().withMessage("Username changed to lowercase. Please retype your passwords")
        .toLowerCase(),

    body("email")
        .trim()
        .notEmpty().withMessage("Email cannot be empty")
        .isEmail().withMessage("Must be a valid email address")
        .isLength({ min: 6, max: 264 }).withMessage("Email must be between 6 & 264 characters"),

    body("password")
        .notEmpty().withMessage("Password cannot be empty")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

    body("confirmPassword")
        .notEmpty().withMessage("Confirm password cannot be empty")
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Confirm password does not match password");
            }
            return true;
        }),
];

module.exports = validateRegister;