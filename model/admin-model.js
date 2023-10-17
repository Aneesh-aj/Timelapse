const mongoose = require("mongoose")

const dataSchema = mongoose.Schema({
    name:{type:String , required:false},
    email:{type:String, required:true},
    password:{type:String, required:true}

})

module.exports = mongoose.model("admins",dataSchema)