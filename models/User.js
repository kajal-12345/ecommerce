const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  // token: {
  //   type: String,
  //   required: true,
  // },
  resetToken: String,
  tokenExpires: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

// const mongodb = require("mongodb");
// const ObjectId = mongodb.ObjectId;
// const getDb = require("../util/database").getDb;
// class User {
//   constructor(username, email, cart, id) {
//     this.username = username;
//     this.email = email;
//     this.cart = cart;
//     this._id = id;
//   }
//   save() {
//     const db = getDb();
//     return db.collection("users").insertOne(this);
//   }
userSchema.methods.addToCart = function (product) {
  // console.log("product", product);
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    //   console.log("cp", cp);
    return cp.productId.toString() === product._id.toString();
  });
  let newQty = 1;
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex >= 0) {
    newQty = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQty;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: 1,
    });
  }
  const updatedCart = { items: updatedCartItems };
  this.cart = updatedCart;
  return this.save();
};

//   static findById(userId) {
//     const db = getDb();
//     return db
//       .collection("users")
//       .findOne({ _id: new ObjectId(userId) })
//       .then((user) => {
//         // console.log(user);
//         return user;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

userSchema.methods.getCart = function () {
  const productIds = this.cart.items.map((p) => {
    return p.productId;
  });
  return user
    .find({ _id: { $in: productIds } })
    .toArray()
    .then((products) => {
      return products.map((product) => {
        // console.log(product);
        return {
          ...product,
          quantity: this.cart.items.find((p) => {
            return p.productId.toString() === product._id.toString();
          }).quantity,
        };
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

userSchema.methods.deleteCartProduct = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.addOrder = function () {
  const db = getDb();
  return this.getCart()
    .then((products) => {
      const order = {
        items: products,
        user: {
          _id: new ObjectId(this._id),
          username: this.username,
          email: this.email,
        },
      };
      return db.collection("orders").insertOne(order);
    })
    .then(() => {
      this.cart = { items: [] };
      return db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(this._id) },
          { $set: { cart: { items: [] } } }
        );
    })
    .catch((err) => {
      console.log(err);
    });
};

userSchema.methods.getOrders = function () {
  const db = getDb();
  return db
    .collection("orders")
    .find({ "user._id": new ObjectId(this._id) })
    .toArray();
};

// module.exports = User;
module.exports = mongoose.model("User", userSchema);
