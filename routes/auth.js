const express = require("express");
const { body } = require("express-validator");
const User = require("../models/User");
const {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
} = require("../controllers/auth");
const route = express.Router();
route.get("/login", getLogin);
route.post(
  "/login",
  [
    body("email", "email does not exist")
      .isEmail().normalizeEmail()  ,
      body("password","invalid password").isLength({min:6}).isAlphanumeric().trim()
  ],
  postLogin
);
route.post("/logout", postLogout);
route.get("/signup", getSignup);
route.post(
  "/signup",
  [
    body("email", "please enter valid email address")
      .isEmail().normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("email already exist!");
          }
        });
      }),
    body("password", "password must be alphanumeric and  minimum length 6")
      .isLength({ min: 6 })
      .isAlphanumeric().trim(),
    body("conf_password", "passwords have to match").custom(
      (value, { req }) => {
        // console.log(value);
        if (value !== req.body.password) {
          throw new Error("passwords have to match");
        }
        return true;
      }
    ).trim(),
  ],
  postSignup
);
route.get("/reset", getReset);
route.post("/reset", postReset);
route.get("/reset/:token", getNewPassword);
route.post("/new-password", postNewPassword);
module.exports = route;
