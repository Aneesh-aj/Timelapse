const mongoose = require("mongoose")

const couponSchema = mongoose.Schema({
    coupon_type:{type:String},
    coupon_code:{type:String},
    expire_date:{type:Date},
    min_amount:{type:Number},
    max_amount:{type:Number},
    coupon_value:{type:Number}

})

module.exports = mongoose.model("coupons",couponSchema)