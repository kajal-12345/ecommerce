const express = require("express");
const route = express.Router();
const { body } = require("express-validator");
const isAuth = require("../middleware/isAuth");
const {
  getAddProduct,
  postAddProduct,
  getProducts,
  getEditProduct,
  postEditProduct,
  deleteProduct,
} = require("../controllers/admin");

route.get("/edit-product", isAuth, getAddProduct);
route.post(
  "/add-product",
  [
    body("title").isString().trim().isLength({ min: 3 }),
    // body("imageurl").isURL(),
    body("description").trim().isString().isLength({ min: 5, max: 200 }),
    body("price").isFloat().trim(),
  ],
  isAuth,
  postAddProduct
);
route.get("/edit-product/:productId", isAuth, getEditProduct);
route.post(
  "/edit-product",
  [
    body("title").trim().isString().isLength({ min: 3 }),
    // body("image"),
    body("description","invalid description").trim().isString().isLength({ min: 5, max: 200 }),
    body("price").isFloat().trim(),
  ],
  isAuth,
  postEditProduct
);
route.delete("/product/:productId", isAuth,deleteProduct );
route.get("/products", isAuth, getProducts);



exports.routes = route;
