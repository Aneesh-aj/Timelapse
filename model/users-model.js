const mongoose = require("mongoose")

const dataSchema = mongoose.Schema({
    name:{type:String , required:true},
    second_name:{type:String},
    email:{type:String, required:true},
    password:{type:String, required:true},
    gender:{type:String, required:false},
    block:{type:Boolean },
    number:{type:Number},
    address:[{
        first_address:{type:String},
        country:{type:String},
        state:{type:String},
        district:{type:String},
        town:{type:String},
        locality:{type:String},
        pincode:{type:Number}
    }],
    cart:[{
        product_id:{type:mongoose.Schema.Types.ObjectId,ref:"products"},
        product_name:{type:String},
        price:{type:Number},
        quantity:{type:Number,default:1},
        totalPrice:{type:Number}

    }],
    order:[{type:mongoose.Schema.Types.ObjectId,ref:"orders"}],
    wishlist:[{
        product_id:{type:mongoose.Schema.Types.ObjectId,ref:"products"}
    }],
    wallet:{
       
        balance:{type:Number, default:0},

    }
    
 
})

module.exports = mongoose.model("users",dataSchema)

