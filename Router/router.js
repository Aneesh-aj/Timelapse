const express = require("express")
const router= express.Router()
const nocache = require("nocache")


const {render} = require("ejs")


const usersModel = require("../model/users-model")
const adminsModel = require("../model/admin-model")
const session = require("express-session")
const cookieParser = require("cookie-parser")
const controller = require("../controllers/userController")
const { civicinfo } = require("googleapis/build/src/apis/civicinfo")


router.get("/" ,controller.checkUserStatus,controller.landing)
router.get("/home",controller.checkUserStatus,controller.homepageview)
router.post("/profile",controller.profilePost)
router.get("/profile",controller.checkUserStatus,controller.profileView)
router.get("/login",controller.loginView)
router.post("/login",controller.loginPost)
router.post("/logout",controller.userLogout)
router.get("/signup",controller.checkUserStatus, controller.singupView)
router.post("/signup",controller.signupPost)
router.post("/otpverification" ,controller.verficatiionPost )
router.get("/verification",controller.checkUserStatus,controller.verification)
router.get("/collection", controller.showCollection)
router.get("/product",controller.checkUserStatus,controller.productPageview)
router.get("/resend-otp",controller.checkUserStatus,controller.verificatioinResend)

router.get("/cart",controller.checkUserStatus,controller.cart)
 
router.post("/remove-from-cart",controller.checkUserStatus,controller.removeincart)

router.post("/api/add-to-cart",controller.checkUserStatus,controller.addToCart)
router.post("/add-address",controller.checkUserStatus,controller.addAdress)
router.post("/profile/edit",controller.checkUserStatus,controller.edituserDetalis)
router.post("/quantity-update",controller.checkUserStatus, controller.quantityUpdate);
router.get("/checkout",controller.checkUserStatus,controller.checkoutView)
router.post("/add-newaddress",controller.checkUserStatus,controller.newaddress)
router.post("/delete-address",controller.checkUserStatus,controller.deleteAddress)
router.post("/editAddress",controller.checkUserStatus,controller.addressEdit)
router.post("/placeorder",controller.checkUserStatus,controller.placeorder)
router.post("/checkout-editaddress",controller.checkUserStatus,controller.checkoutaddressEdit)
router.get("/order",controller.checkUserStatus,    controller.ordersPage)
router.get("/order/orderdetails",controller.checkUserStatus,controller.userOrderdetails)
router.post("/cancel-order",controller.cancelOrder)
router.get("/forgotpassword",controller.forgotpassword)
router.post("/forgotpassword",controller.forgotpasswordpost)
router.get("/verificationPassword",controller.verificationPassword)
router.post("/verificationPassotp",controller.otpverifyPassword)
router.post("/addtoWishlist",controller.addtoWishlist)
router.get("/wishlist",controller.wishlist)
router.post("/api/addingtocart",controller.addingtocart)
router.post("/removefromwishlist",controller.deletewishlist)
router.post("/ordercheckout",controller.ordercheckout)
router.get("/wallet",controller.wallet)
router.post("/returnrequest",controller.returnOrder)
router.post("/apply-coupon",controller.applycoupn)

module.exports = router
