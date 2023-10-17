const mongoose = require("mongoose")

const productSchema = mongoose.Schema({
    product_name:{type:String, required:false},
    watch_type:{type:mongoose.Schema.Types.ObjectId,ref:"watchtypes"},
    gender:{type:String, required:false},
    price:{type:Number, required:false},
    product_image:[{type:String}],
    brand:{type:mongoose.Schema.Types.ObjectId,ref:"brands",required:true},
    list:{type:Boolean, required:false},
    discription:{type:String, required:false},
    dial_color:{type:String , required:false},
    display_type:{type:String, required:false},
    shape:{type:String, requried:false},
    stock:{type:Number},
    
    strap_color:{type:String, required:false},
    watch_case:{type:String , required:false}

})

module.exports = mongoose.model("products",productSchema)