const express = require("express");
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const {
  getProducts,
  getIndex,
  getCart,
  getOrders,
  getProduct,
  postCart,
  postOrder,
  postDeleteCart,
  getInvoice,
  getCheckout,
  getCheckoutSuccess
} = require("../controllers/shop");
router.get("/products", getProducts);
router.get("/",getIndex);
router.get("/products/:productId",isAuth,getProduct);
router.get("/cart",isAuth, getCart);
router.post("/cart",isAuth,postCart);
router.post('/cart-delete-item',isAuth,postDeleteCart);
router.get('/checkout',isAuth,getCheckout);
router.get('/checkout/success',getCheckoutSuccess);
router.get('/checkout/cancel',getCheckout);
router.get("/orders",isAuth, getOrders);
router.post('/create-order',isAuth,postOrder);
router.get('/orders/:orderId',isAuth,getInvoice);

module.exports = router;
