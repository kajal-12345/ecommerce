const User = require("../models/User");
// const dotenv = require('dotenv');
// const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
// const http = require('http');
const bcrypt = require("bcrypt");
// const jwt = require('jsonwebtoken');
// process.env.TOKEN_KEY = "wertyuuio";
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);
exports.getLogin = (req, res, next) => {
  // const isLoggedIn = req.cookie;
  // console.log("session",req.session.save);
  // req.flash();
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  // console.log(message);
  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
  });
};
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  // console.log(errors.isEmpty())
  if (!errors.isEmpty()) {
    // console.log(errors.isEmpty())
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
    });
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "invalid email or password");
        return res.redirect("/login");
      }
      bcrypt.compare(password, user.password).then((doMatch) => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
           if(err){
            throw(err);
           }
          //  res.setHeader('token',user.token);
            res.redirect("/");
          });
        }
        req.flash("error", "invalid email or password");
        return res.redirect("/login");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    pageTitle: "signup",
    path: "/signup",
    isAuthenticated: false,
    errorMessage: message,
    oldInput: {
      email: "",
      username: "",
      password: "",
      conf_password: "",
    },
  });
};
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  // const conf_password = req.body.conf_password;
  const error = validationResult(req);
  if (!error.isEmpty()) {
    // console.log(error.array());
    return res.status(422).render("auth/signup", {
      pageTitle: "signup",
      path: "/signup",
      isAuthenticated: false,
      errorMessage: error.array()[0].msg,
      oldInput: {
        username: username,
        email: email,
        password: password,
        conf_password: req.body.conf_password,
      },
    });
  }
  // User.findOne({ email: email })
  //   .then((userDoc) => {
  //     req.flash("error", "email already exist");
  //     if (userDoc) {
  //       return res.redirect("/signup");
  //     }
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        username: username,
        email: email,
        password: hashedPassword,
        cart: {
          items: [],
        },
      });
      // const token = jwt.sign(
      //   { user_id: user._id, email },
      //   "SECRET_KEY"
      // );
      // user.token = token;
      // console.log(token);
      return user.save();
    })
    .then(() => {
      res.redirect("/login");
      try {
        return transporter.sendMail({
          to: email,
          from: "chaurasiyakajal103@gmail.com",
          subject: "account created successfully",
          html: "<h1>you succesfully signedup</h1>",
        });
      } catch (err) {
        console.log(err);
      }
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};
exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    pageTitle: "Reset",
    path: "/reset password",
    // isAuthenticated: true,
    errorMessage: message,
  });
};
exports.postReset = (req, res, next) => {
  console.log("body", req.body);
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    const email = req.body.email;
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          req.flash("error", "account not found");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.tokenExpires = Date.now() + 3600000;
        return user.save();
      })
      .then(() => {
        res.redirect("/");
        return transporter.sendMail({
          to: email,
          from: "chaurasiyakajal103@gmail.com",
          subject: "password reset",
          html: `<p>you requested a password reset</p>
            <p> click this <a href="http://localhost:3000/reset/${token}">link<a/> to reset a password</p>
      `,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};
exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, tokenExpires: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        pageTitle: "new Password",
        path: "/new-password",
        isAuthenticated: false,
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({
    _id: userId,
    resetToken: passwordToken,
    tokenExpires: { $gt: Date.now() },
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.tokenExpires = undefined;
      return resetUser.save();
    })
    .then(() => {
      return res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
