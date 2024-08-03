const mongoose = require("mongoose")

const dataSchema = mongoose.Schema({
    name:{type:String , required:false},
    email:{type:String, },
    password:{type:String,}

})

module.exports = mongoose.model("admins",dataSchema)