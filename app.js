const http = require("http");
const path = require("path");
const fs = require("fs");
const https = require("https");
const multer = require("multer");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const MongoDBStore = require("connect-mongodb-session")(session);
// const mongoConnect = require("./util/database").mongoConnect;
const mongoose = require("mongoose");
const User = require("./models/User");
const adminData = require("./routes/admin");
const shopRoute = require("./routes/shop");
const authRoute = require("./routes/auth");

// const sequelize = require('./util/database');
const { get404, get500 } = require("./controllers/error");

const express = require("express");

const app = express();
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));
//  const {engine} = require('express-handlebars');
//  creating middleware
app.use(bodyParser.urlencoded({ extended: false }));
// app.engine('hbs',engine({layoutsDir:'views/layout',defaultLayout:'main-layout',extname:'hbs'}));
app.set("view engine", "ejs");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.bfjuxm8.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.use(
  session({
    secret: "qwertyuiopasdfghjkl",
    resave: false,
    cookie: { httpOnly: true },
    saveUninitialized: false,
    store: store,
  })
);
app.use(flash());
// const privateKey = fs.readFileSync("server.key");
// const buf  = Buffer.from(privateKey)
// console.log(buf.toString());
// const certificate = fs.readFileSync("server.csr");
// const certBuf  = Buffer.from(certificate)

// console.log(certificate);
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});
app.use("/admin", adminData.routes);
app.use(shopRoute);
app.use(authRoute);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.get("/500", get500);
app.use(get404);
// app.use((error, req, res, next) => {
//   res.redirect("/500");
// });
const server = http.createServer(app);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    // https
    //   .createServer({ key: buf.toString(), cert: certBuf.toString() }, app)
    //   .listen(process.env.PORT || 3000);
    server.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });