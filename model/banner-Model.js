const mongoose = require("mongoose")
const bannerSchema = mongoose.Schema({
    banner:{type:String},
    index:{type:Number}
})

module.exports = mongoose.model("banners",bannerSchema)