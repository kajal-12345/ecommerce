const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const productSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  imageurl: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});
module.exports = mongoose.model("Product", productSchema);
// const mongodb = require("mongodb");
// const getDb = require("../util/database").getDb;
// class Product {
//   constructor(title, price, description, imageurl, id,userId) {
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imageurl = imageurl;
//     this._id = id ?  new mongodb.ObjectId(id) : null ;
//     this.userId = userId;
//   }
//   save() {
//     const db = getDb();
//     // console.log("save",this);
//     let dbOp;
//     if (this._id) {
//       // console.log("id present");
//       dbOp = db.collection("products").updateOne({ _id:this._id }, { $set: this });
//     } else {
//       // console.log("id not present");
//       dbOp = db.collection("products").insertOne(this);
//     }
//     return dbOp
//       .then((res) => {
//         // console.log("database123", db);
//         return res;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }
//   static fetchAll() {
//     const db = getDb();
//     return db
//       .collection("products")
//       .find()
//       .toArray()
//       .then((products) => {
//         // console.log(products);
//         return products;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }
//   static findById(prodId) {
//     const db = getDb();
//     return db
//       .collection("products")
//       .find({ _id: new mongodb.ObjectId(prodId) })
//       .next()
//       .then((product) => {
//         // console.log(product);
//         return product;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }
//   static deleteById(prodId){
//     const db = getDb();
//     return db.collection('products').deleteOne({_id:new mongodb.ObjectId(prodId)}).then(prod => {
//       return prod;
//     }).catch(err=>{
//       console.log(err);
//     });
//   }
// }
// module.exports = Product;
