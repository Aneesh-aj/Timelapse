const mongoose = require("mongoose")

const orderSchema = mongoose.Schema({
      product:[{
          product_id:{type:mongoose.Schema.Types.ObjectId,ref:"products"},
          quantity:{type:Number},
          price:{type:Number},
          totalPrice:{type:Number},
          return:{type:Boolean},
          ret_date:{types:Date}

      }],
      user_id:{type:mongoose.Schema.Types.ObjectId,ref:"users"},
     first_address:{type:String},
     country:{type:String},
      state:{type:String},
      town:{type:String},
      locality:{type:String},
      paymentMethod:{type:String},
      pincode:{type:Number},
      orderdate:{type:Date},
      totalamount:{type:Number},
      status:{type:String}
    
},{timestamps: true})


module.exports = mongoose.model("orders",orderSchema)