const http = require("http");
const path = require("path");
const fs = require("fs");
// const https = require("https");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const helmet = require("helmet");
const morgan = require("morgan");
const adminController = require('./controllers/admin');
const compression = require("compression");
const MongoDBStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const User = require("./models/User");
const firebaseConfig = require("./firebase.config");
// const addImage = require('./util/storeFile');
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const multer = require("multer");
const express = require("express");
const app = express();
const MONGODB_URI = `mongodb+srv://techmini1234:tech1mini@cluster0.euerznh.mongodb.net/shop`;
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
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
app.set("view engine", "ejs");
const adminData = require("./routes/admin");
const shopRoute = require("./routes/shop");
const authRoute = require("./routes/auth");
app.use(bodyParser.urlencoded({ extended: false }));
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
}).single("image");

const fileStorage = async (req, res, next) => {
  const dateTime = new Date().toISOString();
  // console.log(req.file);
  const storageRef = ref(
    storage,
    `images/${dateTime + "-" + req.file.originalname}`
  );
  const metadata = {
    contentType: req.file.mimetype,
  };
  // console.log("storageRef",storageRef);
  // console.log("req.file",req.file);
  const snapshot = await uploadBytesResumable(storageRef, req.file.buffer,metadata);
  const downloadURL = await getDownloadURL(snapshot.ref);
  // console.log(downloadURL);
  req.filePath = downloadURL;
  if(downloadURL){
    adminController.postAddProduct(req,res);
  }
  // res.redirect("/admin/products");
  // return res.status(200).json({ message: "file stored", url: downloadURL });
};

app.post('/admin/add-product',upload, fileStorage);
const webapp = initializeApp(firebaseConfig);
const storage = getStorage(webapp);
const { get404, get500 } = require("./controllers/error");
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(
  session({
    secret: "qwertyuiopasdfghjkl",
    resave: false,
    cookie: { httpOnly: true },
    saveUninitialized: false,
    store: store,
  })
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
// app.use(webapp);
app.use(flash());
// app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "https: data:"]
    }
  })
)

app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));
//  const {engine} = require('express-handlebars');
//  creating middleware
// app.engine('hbs',engine({layoutsDir:'views/layout',defaultLayout:'main-layout',extname:'hbs'}));
// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString() + "-" + file.originalname);
//   },
// });
// const privateKey = fs.readFileSync("server.key");
// const buf  = Buffer.from(privateKey)
// console.log(buf.toString());
// const certificate = fs.readFileSync("server.csr");
// const certBuf  = Buffer.from(certificate)
// console.log(certificate);
// module.exports = fileStorage;
// const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.bfjuxm8.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

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
    console.log("connected");
    server.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });
