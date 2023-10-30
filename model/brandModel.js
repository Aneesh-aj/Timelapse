const mongoose = require("mongoose")

const  brandcategorySchema = mongoose.Schema({
    brand_category:{type:String},
    list:{type:Boolean},
    offer:{type:Number}
})

module.exports = mongoose.model("brands",brandcategorySchema)