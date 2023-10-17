const mongoose = require("mongoose")

const watchTypeSchema = mongoose.Schema({
    watch_type:{type:String},
    list:{type:Boolean}
})

module.exports = mongoose.model("watchtypes",watchTypeSchema)