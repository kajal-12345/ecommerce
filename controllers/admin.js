// const mongodb = require("mongodb");
const deleteFile = require('../util/file');
// const ObjectId =  mongodb.ObjectId;
const { validationResult } = require("express-validator");
const Product = require("../models/product");
const product = require("../models/product");
exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "add product",
    path: "/admin/add-product",
    editing: false,
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: null,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  console.log(image);
  const imageurl = image.path;
  const price = req.body.price;
  const description = req.body.description;
  const userId = req.user;
  if(!image){
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit product",
      path: "/admin/edit-product",
      editing: true,
      product: {
        // _id:prodId,
        title: title,
        price: price,
        description: description, 
      },
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: "attached file is not an image",
    });
  }
  const product = new Product({ title, price, description, imageurl, userId });
  const errors = validationResult(req);
  console.log(errors.array());
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add product",
      path: "/admin/add-product",
      editing: false, 
      product: product,
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
    });
  }
  product
    .save()
    .then(() => {
      console.log("created product");
      // console.log(product);
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getProducts = (req, res, next) => {
  // Product.findAll()
  // { userId: req.user._id }
  // Product.find({ userId: req.user._id })
  //   .then((products) => {
  //     res.render("admin/products", {
  //       prods: products,
  //       pageTitle: "admin products",
  //       path: "admin/products",
  //       isAuthenticated: req.session.isLoggedIn,
  //     });
  //   })
  const page = +req.query.page || 1;
  // console.log(page);
  let totalItems;
  const products_per_page = 2;
  Product.find({ userId: req.user._id }).countDocuments().then(no_of_prods => {
    totalItems = no_of_prods;
    return Product.find()
    .skip((page - 1) * products_per_page)
    .limit(products_per_page)
  }).then((products) => {
    // console.log(products);
    res.render("shop/index", {
      prods: products,
      pageTitle: "shop",
      path: "/",
      isAuthenticated: req.session.isLoggedIn,
      totalItems:totalItems,
      currentPage : page,
      hasNext : products_per_page * page < totalItems,
      hasPrev : page > 1,
      nextPage : page + 1,
      prevPage : page - 1,
      lastPage : Math.ceil(totalItems/products_per_page)
    });
  })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const edit = req.query.edit;
  if (!edit) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  // console.log(req);
  Product.findById(prodId)
    .then((product) => {
      if(!product){
        return res.redirect('/');
      }
      if (product.userId.toString() === req.user._id.toString()) {
        return res.render("admin/edit-product", {
          pageTitle: "Edit product",
          path: "/admin/edit-product",
          editing: edit,
          product: product,
          isAuthenticated: req.session.isLoggedIn,
          errorMessage: null,
        });
      } else {
        return res.redirect("/");
      }
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedimage = req.file;
  const updatedDescription = req.body.description;
  const updatedPrice = req.body.price;
 
  // console.log(updatedDescription);
  // const product = new Product(updatedTitle,updatedPrice,updatedDescription,updatedimageurl,new ObjectId(prodId));
  const errors = validationResult(req);
  console.log(errors.array());
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit product",
      path: "/admin/edit-product",
      editing: true,
      product: {
        _id:prodId,
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
      },
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
    });
  }
  // console.log(prodId);
  Product.findById(prodId)
    .then((product) => {
      // throw new Error("dummy");
      // console.log(product);
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      if(updatedimage){
        deleteFile(product.imageurl);
        product.imageurl = updatedimage.path;
      }
     
      return product.save().then(() => {
        // console.log(result);
        console.log("updated sucessfully");
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      // return res.status(500).render("admin/edit-product", {
      //   pageTitle: "Edit product",
      //   path: "/admin/edit-product",
      //   editing: true,
      //   product: {
      //     _id:prodId,
      //     title: updatedTitle,
      //     price: updatedPrice,
      //     description: updatedDescription,
      //     imageurl: updatedimageurl,
      //   },
      //   isAuthenticated: req.session.isLoggedIn,
      //   errorMessage: "Database operation failed,please try again",
      // });
      // res.redirect('/500');
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
    });
};
exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  product.findById(prodId).then(prod => {
    if(!prod){
      next (new Error("product not found!"))
    }
    deleteFile(prod.imageurl);
    return Product.deleteOne({ _id: prodId })
  }).then(() => {
    // return res.redirect("/admin/products");
    return res.status(200).json({message:"sucess"});
  }).catch((err) => {
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
      return res.status(500).json({message : "deleting product failed"})
    });
};
