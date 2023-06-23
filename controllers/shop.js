// const Cart = require("../models/Cart");
const fs = require("fs");
const stripe = require("stripe")(process.env.STRIPE_KEY);
// const fileHelper = require('../util/file');
const pdfDocument = require("pdfkit");
const path = require("path");
const Product = require("../models/product");
const Order = require("../models/Order");
// const product = require("../models/product");
exports.getProducts = (req, res, next) => {
  // Product.find()
  //   .then((products) => {
  //     res.render("shop/product-list", {
  //       prods: products,
  //       pageTitle: "All products",
  //       path: "/products",
  //       isAuthenticated: req.session.isLoggedIn,
  //     });
  //   })
  const page = +req.query.page || 1;
  let totalItems;
  const products_per_page = 2;
  Product.find()
    .countDocuments()
    .then((no_of_prods) => {
      totalItems = no_of_prods;
      return Product.find()
        .skip((page - 1) * products_per_page)
        .limit(products_per_page);
    })
    .then((products) => {
      // console.log(products);
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All products",
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
        totalItems: totalItems,
        currentPage: page,
        hasNext: products_per_page * page < totalItems,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / products_per_page),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      // console.log(product);
      res.render("shop/product-detail", {
        product: product,
        path: "shop/product-detail",
        pageTitle: "product detail",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  // console.log(page);
  let totalItems;
  const products_per_page = 2;
  Product.find()
    .countDocuments()
    .then((no_of_prods) => {
      totalItems = no_of_prods;
      return Product.find()
        .skip((page - 1) * products_per_page)
        .limit(products_per_page);
    })
    .then((products) => {
      // console.log(products);
      res.render("shop/index", {
        prods: products,
        pageTitle: "shop",
        path: "/",
        isAuthenticated: req.session.isLoggedIn,
        totalItems: totalItems,
        currentPage: page,
        hasNext: products_per_page * page < totalItems,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / products_per_page),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteCart = (req, res, next) => {
  const prodId = req.body.productId;
  // console.log(prodId);
  req.user
    .deleteCartProduct(prodId)
    .then(() => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((p) => {
        return { quantity: p.quantity, product: { ...p.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => {
      req.user.clearCart();
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((p) => {
        return { quantity: p.quantity, product: { ...p.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => {
      req.user.clearCart();
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      console.log(products);
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "cart",
        products: products,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      console.log("products", product);
      console.log("req.user", req.user);
      return req.user.addToCart(product);
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  res.redirect("/cart");
};

exports.getCheckout = (req, res, next) => {
  req.user.populate("cart.items.productId").then((user) => {
    const products = user.cart.items;
    // console.log("products",products);
    let total = 0;
    products.forEach((p) => {
      total += p.quantity * p.productId.price;
    });

    return stripe.checkout.sessions
      .create({
        line_items: products.map((p) => {
          return    {
            price_data: {
              currency: 'usd',
              product_data: {
                name: p.productId.title,
              },
              unit_amount: p.productId.price * 100,
              // unit_amount: 897,
            },
            quantity: p.quantity,
          }
        }),
        mode: "payment",
        success_url: "http://localhost:3000/checkout/success",
        cancel_url: "http://localhost:3000/checkout/cancel",
      })
      .then((session) => {
        res.render("shop/checkout", {
          path: "/checkout",
          pageTitle: "checkout",
          products: products,
          total: total,
          isAuthenticated: req.session.isLoggedIn,
          sessionId: session.id,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};
exports.getOrders = (req, res, next) => {
  Order.find()
    .then((orders) => {
      const userOrder = orders.filter(
        (order) => order.user.userId.toString() === req.user._id.toString()
      );
      console.log(userOrder);
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "your orders",
        orders: userOrder,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (order?.user?.userId.toString() !== req?.user?._id.toString()) {
        return next(new Error("unauthorized user"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "inVoices", invoiceName);
      const pdfDoc = new pdfDocument();
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename ="' + invoiceName + '" '
      );
      pdfDoc.fontSize(20).text("invoice");
      pdfDoc
        .fontSize(14)
        .text("--------------------------------------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              " $ " +
              prod.product.price
          );
      });
      pdfDoc.text("------------------------------------------------------");
      pdfDoc.fontSize(20).text("total price is $" + totalPrice.toPrecision(4));
      pdfDoc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     // console.log(err);
      //     return next(err);
      //   }
      //   res.setHeader("Content-Type", "application/pdf");
      //   res.setHeader('Content-Disposition','attachment; filename ="' +invoiceName + '" ');
      //   res.send(data);
      // });
      // const file = createReadStream(invoicePath);
      // res.setHeader("Content-Type", "application/pdf");
      //   res.setHeader('Content-Disposition','attachment; filename ="' +invoiceName + '" ');
      //   file.pipe(res);
    })
    .catch((err) => {
      return next(err);
    });
};
