const mongoose = require("mongoose")

const  brandcategorySchema = mongoose.Schema({
    brand_category:{type:String},
    list:{type:Boolean}
})

module.exports = mongoose.model("brands",brandcategorySchema)