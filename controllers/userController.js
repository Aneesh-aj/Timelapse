const usersModel = require("../model/users-model")
const adminsModel = require("../model/admin-model")
const otpGenerator = require("otp-generator")
const nodemailer = require("nodemailer")
const productModel = require("../model/product-model")
const nocache = require("nocache")
const watchtypeModel = require("../model/watchtypeModel")
const brandModel = require("../model/brandModel")
const mongoose = require("mongoose")
const order = require("../model/orderModel")
const orderModel = require("../model/orderModel")
const { analytics } = require("googleapis/build/src/apis/analytics")

const Razorpay = require("razorpay")
const { render } = require("ejs")
const couponModel = require("../model/couponModel")
const bannerModel = require("../model/banner-Model")
const { consumers } = require("nodemailer/lib/xoauth2")
require('dotenv').config();

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

const RAXORPAY_ID_KEY = process.env.RAXORPAY_ID_KEY
const RAXORPAY_SCRETE_KEY = process.env.RAXORPAY_SECRET_KEY



const landing = (req, res) => {
    res.redirect("/home")
}

const forgotpassword = (req, res) => {
    try {

        if(req.session.errorMessage){
           
            errorMessage= req.session.errorMessage
            delete req.session.errorMessage
        }else{
            errorMessage =''
        }

        res.render("forgotpassword",{errorMessage})

    } catch (error) {
        res.redirect("/internal")

    }
}

const homepageview = async (req, res) => {

    try {
        const product = await productModel.find({list:true}).sort({_id:1}).limit(4)
        const banner = await bannerModel.find({}).sort({ index: 1 });
        const men = await productModel.find({gender:"men",list:true}).sort({_id:-1}).limit(4)
        const women = await productModel.find({gender:'women',list:true}).sort({_id:-1}).limit(4)
        const user = await usersModel.findOne({email:req.session.email})
        res.render("homePage", { user,men,product, banner,women})

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }

}
 
const profileView = async (req, res) => {

    try {

        const userid = await usersModel.findOne({ email: req.session.email }, { _id: 1 })
        const user = await usersModel.findOne({ email: req.session.email })
        const address = await usersModel.findOne({ email: req.session.email }, { address: 1 })
        res.render("profile", { userid, address, user })
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }


}


const profilePost = (req, res) => {
    try {

        if (req.session.email) {

            res.redirect("/profile")
        } else {
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}

const loginView = (req, res) => {

    
    try{
        if (!req.session.email) {
            return res.render("login")
        }
    
        if (req.session.email) {
            return res.redirect("/profile")
        }
        else if (req.cookies.currentadmin) {
    
            return res.redirect("/admin")
        }

    }catch(error){
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }

}

const loginPost = async (req, res) => {

    try {
        let user = await usersModel.findOne({ email: req.body.email, password: req.body.password })
        const admin = await adminsModel.findOne({ email: req.body.email, password: req.body.password })

        if (admin) {
            req.session.admin = req.body.email

            const admintoken = req.session.admin

            res.redirect("/admin")

        }
        else if (user) {

            req.session.email = req.body.email
            req.session.user_name = user.name
            const Token = req.session.email
            
            res.redirect("/home")
        } else {
            res.render("login", { errorMessage: "Incorrect email or password. Please try again." })
        }
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const userLogout = (req, res) => {
     
     try{
    req.session.destroy()
    res.clearCookie("currentUser")
    res.status(200).json({ success: true });
     }catch(error){
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

     }
}

const singupView = (req, res) => {
    try {
        if (req.session.email) {
            res.redirect("/profile")
        } else {
            res.render("sign-up")
        }
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const signupPost = async (req, res) => {


    try {
        const user = await usersModel.find({ name: req.body.name, email: req.body.email, password: req.body.password })

        if (user.length > 0) {
            return res.redirect("/signup?error=user%20already%20exists");
        }
        if (user.length === 0) {
            const otp = otpGenerator.generate(4, { digits: true, upperCase: false, specialChars: false, upperCaseAlphabets: false, lowerCaseAlphabets: false })
            req.session.otp = otp
            req.session.email = req.body.email
            req.session.name = req.body.name
            req.session.password = req.body.password

            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: EMAIL,
                    pass: PASSWORD
                }
            })

            const mailOption = {
                from: EMAIL,
                to: req.body.email,
                subject: "OTP verficatiion",
                text: `your OTP is:${otp}`,
            }

            transporter.sendMail(mailOption, (error, info) => {
              
            })
            req.session.enter_token = req.body.email

            res.redirect("/verification")

        }
        else {

            res.redirect("/signup", { error: "user currenly exist" })
        }
    } catch (error) {
        req.session.signmessage = "admin not found"
        res.redirect("/signup")
    }
}

const verification = (req, res) => {

    try{
        if (req.session.enter_token) {
                res.render("otp-sent", { error: false })
        }

    }catch(error){
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const verficatiionPost = async (req, res) => {
    
    try{
        
            if (req.session.otp === req.body.otp) {
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let code = '';

                for (let i = 0; i < 8; i++) {
                  const randomIndex = Math.floor(Math.random() * characters.length);
                  code += characters.charAt(randomIndex);
                }
                             

                await usersModel.create({
                    name: req.session.name,
                    email: req.session.email,
                    password: req.session.password,
                    block: false,
                    wallet:{refferalcode:code,balance:0}

                })
                const Token = req.session.email
                res.cookie("currentUser", Token)
                
                res.redirect("/home")
            } else {

                delete req.session.otp
                res.render("otp-sent", { error: 'Invalid OTP. Please try again.' })
            }

    }catch(error){
       
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const verificatioinResend = (async (req, res) => {
    try {
        const newOtp = otpGenerator.generate(4, { digits: true, upperCase: false, specialChars: false });
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: EMAIL,
                pass: PASSWORD
            }
        });

        const mailOptions = {
            from: 'rajuaneesh.p2020@gmail.com',
            to: req.session.enter_token, // Use the appropriate email address
            subject: 'New OTP Verification',
            text: `Your new OTP is: ${newOtp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {

        });

        // Update the session with the new OTP
        req.session.otp = newOtp;
        res.redirect('/verification');
    } catch (error) {
        res.redirect('/verification'); // Handle the error gracefully
    }
});
const showCollection = async (req, res) => {
    try {


        const watchtype = await watchtypeModel.find({ list: true });

        const page = parseInt(req.query.page) || 1;
        const pr1 = parseInt(req.query.price1) || 0;
        const pr2 = parseInt(req.query.price2) || Infinity;
        const gender = req.query.gender || '';
        const watchType = req.query.watch_type || '';
        const searchvalue = req.query.searchvalue || '';

        let filterQuery = { list: true };

        var message;

        if (pr1 !== 0 || pr2 !== Infinity) {
            filterQuery.price = { $gte: pr1, $lte: pr2 };
        }

        if (gender !== '') {
            filterQuery.gender = gender;
        }

        if (watchType !== '') {
            if (watchType.length > 0) {
                filterQuery.watch_type = new mongoose.Types.ObjectId(watchType);
            }
        }
        if (searchvalue !== '') {
            const regex = new RegExp(searchvalue, 'i');
            filterQuery.$or = [
                { product_name: { $regex: regex } }, // Search in the products collection
                { brand_category: { $regex: regex } } // Search in the brands collection
            ];
        }
        
        
        const itemsPerPage = 8; // Define itemsPerPage before using it
        const skip = (page - 1) * itemsPerPage;

        const database = await productModel.aggregate([
            {
                $match: filterQuery, // Use filterQuery here
            },
            {
                $lookup: {
                    from: 'watchtypes',
                    localField: 'watch_type',
                    foreignField: '_id',
                    as: 'watch_type',
                },
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brand',
                },
            },
            {
                $match: {
                    'watch_type.list': true, // Filter watch types with list: true
                    'brand.list': true, // Filter brands with list: true
                },
            },
            {
                $skip: skip,
            },
            {
                $limit: itemsPerPage,
            },
            
        ]);

        const totalItems = await productModel.countDocuments(filterQuery); // Count total items
        const totalPages = Math.ceil(totalItems / itemsPerPage);

     
        let currentPage = page;
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const slicedData = database;

        if (watchType.length != 0) {
            var watch = await watchtypeModel.findOne({ _id: watchType }, { watch_type: 1 });
        }

        const user = await usersModel.findOne({email:req.session.email})
        res.render("productCollection", { user,database, slicedData, totalPages, currentPage, watchtype, watch, pr1, pr2, gender, watchType, searchvalue, message });
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
};


const wallet = async (req, res) => {
    try {

        const user = await usersModel.findOne({ email: req.session.email })

        res.render("wallet", {user})
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}




const productPageview = async (req, res) => {
    try {
        const id = req.query.id

        let product = await productModel.findById(id)
        let productimage = await productModel.findOne({ _id: id }, { product_image: 1 })
        if (product) {
            const user = await usersModel.findOne({email:req.session.email})
            res.render("productPage", { user,product, productimage })
        }
    }
    catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}


const cart = async (req, res) => {
    try {
        const user = await usersModel.findOne({ email: req.session.email })
            .populate({
                path: "cart.product_id",
                model: productModel,
            })
            .exec();

        if (!user) {
            totalprice
        }

        let totalprice = 0
        for (let i = 0; i < user.cart.length; i++) {
            user.cart[i].totalPrice = user.cart[i].sellingprice * user.cart[i].quantity
            totalprice += user.cart[i].totalPrice
        }

        res.render("cart", { user, totalprice })

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const addToCart = async (req, res) => {
    try {

        if (!req.session.email) {
            return res.json({ noUser: true });
        }
        const useremail = req.session.email;
        const { productId, product_name, quantity, price } = req.body;
        const user = await usersModel.findOne({ email: useremail });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const produ = await productModel.findOne({ _id: productId }, {})
        const existingProduct = user.cart.find(item => item.product_id.toString() === productId);

        if (existingProduct) {
            if ((produ.stock - existingProduct.quantity) === 0) {
                return res.json({ outofStock: true })
            }
            existingProduct.quantity += quantity;
            existingProduct.totalPrice = existingProduct.quantity * existingProduct.sellingprice
        } else {

            user.cart.push({
                product_id: productId,
                product_name,
                quantity,
                price: produ.price,
                totalPrice: produ.sellingprice * quantity,
                sellingprice: produ.sellingprice
            });
        }


        await user.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
};


const removeincart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await usersModel.findOne({ email: req.session.email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.cart = user.cart.filter((item) => item.product_id.toString() !== productId);
        await user.save();
        res.status(200).json({ message: "Product removed from cart" });
    } catch (error) {
        console.error("Error removing product from cart:", error);
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}



const addAdress = async (req, res) => {
    try {

        const { address1, country, state, district, town, locality, userid } = req.body;
        if (!mongoose.Types.ObjectId.isValid(userid)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        const userId = await usersModel.findOne({ _id: userid });

        const result = await usersModel.findOneAndUpdate(
            { _id: userId },
            {
                $push: {
                    address: {
                        first_address: address1,
                        country: country,
                        state: state,
                        district: district,
                        town: town,
                        locality: locality
                    }
                }
            }
        );

        res.redirect("/profile");
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
};


const edituserDetalis = async (req, res) => {

    try {

        const id = req.body.userid

        await usersModel.findOneAndUpdate({ _id: id }, {
            $set: {
                name: req.body.name,
                second_name: req.body.second_name,
                number: req.body.number,
                gender: req.body.gender
            }
        })

        res.redirect("/profile")
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const quantityUpdate = async (req, res) => {
    try {
        const user = await usersModel.findOne({ email: req.session.email });

        const quantity = req.body.quantity
        const index = req.body.index
        const productid = req.body.productid

        const parsedQuantity = parseInt(quantity, 10);

        if (index) {

            user.cart[index].quantity = parsedQuantity;

            await user.save();
        }



        let totalprice = 0
        if (index) {

            for (let i = 0; i < user.cart.length; i++) {
                user.cart[i].totalPrice = user.cart[i].sellingprice * user.cart[i].quantity
                totalprice += user.cart[i].totalPrice
            }
        } else {
            const product = await productModel.findOne({ _id: productid }, {})
            totalprice += product.sellingprice * parsedQuantity

            product.totalPrice = totalprice
            req.session.quantity = parsedQuantity
        }

        await user.save()
        res.status(200).json({ message: 'Quantity updated successfully.', totalprice });
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
};

const checkoutView = async (req, res) => {
    try {
        const singleproductid = req.query.product_id
        const singleproduct = await productModel.findOne({ _id: singleproductid }, {})
        req.session.singleproductid = singleproductid

        const user = await usersModel.findOne({ email: req.session.email })
            .populate({
                path: "cart.product_id",
                model: productModel,
            })
            .exec();

        let totalprice = 0
        let totalpriceChecking =0
        if (!singleproductid) {
            for (let i = 0; i < user.cart.length; i++) {
                totalprice += user.cart[i].sellingprice * user.cart[i].quantity
                totalpriceChecking += user.cart[i].sellingprice * user.cart[i].quantity
            }
        } else {
            if (req.session.quantity) {
                totalprice += singleproduct.sellingprice * req.session.quantity
                totalpriceChecking+= singleproduct.sellingprice * req.session.quantity
            } else {
                totalprice += singleproduct.sellingprice
                totalpriceChecking += singleproduct.sellingprice * req.session.quantity
            }
        }

        const address = user.address
        let qnt = 1
        if (req.session.quantity) {
            qnt = req.session.quantity
        } else {
            req.session.quantity = qnt
        }
        const coupon = await couponModel.find({})
        let discountamount = 0
        res.render("checkoutpage", { discountamount,totalpriceChecking, user, qnt, coupon, totalprice, address, singleproduct, singleproductid })

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}



const newaddress = async (req, res) => {
    try {

        const { address1, country, state, district, town, locality, userid } = req.body;
        const user = await usersModel.findOne({ _id: req.body.userid })
        const userId = await usersModel.findOne({ _id: userid })
        const result = await usersModel.findOneAndUpdate(
            { _id: userId },
            {
                $push: {
                    address: {
                        first_address: address1,
                        country: country,
                        state: state,
                        district: district,
                        town: town,
                        locality: locality
                    }
                }
            }
        );

        res.redirect("/checkout")
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const deleteAddress = async (req, res) => {

    const addressIndex = req.body.addressIndex;
    const userId = req.body.userId

    try {
        const user = await usersModel.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (addressIndex >= 0 && addressIndex < user.address.length) {
            user.address.splice(addressIndex, 1);

            await user.save()


            return res.status(200).json({ message: 'Address deleted successfully' });
        } else {
            return res.status(404).json({ message: 'Address not found or deletion failed' });
        }
    } catch (error) {
        return  res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }



}

const addressEdit = async (req, res) => {
    try {
    
        const id = req.body.userid;
        const addressIdToUpdate = req.body.addressid;

        // Find the user by ID and get their existing address
        const user = await usersModel.findById(id);

        if (!user) {
            return res.status(404).send("User not found.");
        }

        // Find the specific address to update by its ID
        const addressToUpdate = user.address.id(addressIdToUpdate);

        if (!addressToUpdate) {
            return res.status(404).send("Address not found.");
        }

        // Update only the fields in req.body that are provided and not empty
        if (req.body.address1) {
            addressToUpdate.first_address = req.body.address1;
        }
        if (req.body.country) {
            addressToUpdate.country = req.body.country;
        }
        if (req.body.state) {
            addressToUpdate.state = req.body.state;
        }
        if (req.body.district) {
            addressToUpdate.district = req.body.district;
        }
        if (req.body.town) {
            addressToUpdate.town = req.body.town;
        }
        if (req.body.locality) {
            addressToUpdate.locality = req.body.locality;
        }
        if (req.body.pincode) {
            addressToUpdate.pincode = req.body.pincode;
        }

        // Save the updated user document
        const updatedUser = await user.save();

        return res.redirect("/profile");
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
};




const checkoutaddressEdit = async (req, res) => {
    try {

    
        const id = req.body.userid;

        const addressIdToUpdate = req.body.addressid;


        const user = await usersModel.findOne({ _id: id }, {});


        if (!user) {
        }


        const addressToUpdate = user.address.id(addressIdToUpdate);



        if (!addressToUpdate) {
            return res.status(404).send("Address not found.");
        }


        if (req.body.address1) {
            addressToUpdate.first_address = req.body.address1;
        }
        if (req.body.country) {
            addressToUpdate.country = req.body.country;
        }
        if (req.body.state) {
            addressToUpdate.state = req.body.state;
        }
        if (req.body.district) {
            addressToUpdate.district = req.body.district;
        }
        if (req.body.town) {
            addressToUpdate.town = req.body.town;
        }
        if (req.body.locality) {
            addressToUpdate.locality = req.body.locality;
        }
        if (req.body.pincode) {
            addressToUpdate.pincode = req.body.pincode;
        }

        // Save the updated user document
        const updatedUser = await user.save();



        return res.redirect("/checkout");
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
};


const placeorder = async (req, res) => {

    try {

        const paymentMethod = req.body.paymentMethod
        const addressId = req.body.addressId
        const productid = req.session.singleproductid
        const totalamount = req.body.alltotal
        let amount = req.body.amount
        const user = await usersModel.findOne({ email: req.session.email })

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (paymentMethod === "online") {
            if (req.body.alltotal > req.body.amount && req.body.useWallet == true) {
                let minus = req.body.alltotal - req.body.amount
                
                if(user.wallet.balance - minus <=0){
                }else{

                    user.wallet.balance =  user.wallet.balance - minus
                    await user.save()
                   
                }

                amount = (totalamount - req.body.discount)
            }
        }
   

        let neworder

        const orderaddr = await usersModel.findOne({ email: req.session.email, "address._id": addressId }, { address: 1, _id: 0 })

        const orderaddress = orderaddr.address.find(address => address._id.equals(addressId));

        if (productid) {
            const product = await productModel.findOne({ _id: productid }, {})
            let qntt = req.session.quantity
            let qnt
            if (qntt) {
                qnt = qntt
            } else {
                qnt = 1
            }

            product.stock = product.stock - qnt
            product.save()

            let amount = qnt * product.price
            const singlePrd = {
                product_id: product._id,
                quantity: qnt,
                price: product.price,
                totalPrice: amount
            }




            neworder = await order.create({
                user_id: user._id,
                first_address: orderaddress.first_address,
                country: orderaddress.country,
                state: orderaddress.state,
                town: orderaddress.town,
                locality: orderaddress.locality,
                pincode: orderaddress.pincode,
                paymentMethod: paymentMethod,
                totalamount: amount,
                status: "pending"
            })

            neworder.product.push(singlePrd)
            neworder.save()


            const singleorder = await usersModel.findOneAndUpdate({ email: req.session.email }, { $push: { order: neworder._id } })

            delete req.session.singleproductid


        } else {
            const cart = user.cart

            for (let i = 0; i < cart.length; i++) {
                const product = await productModel.findOne({ _id: cart[i].product_id });

                if (!product) {

                    continue;
                }

                product.stock -= cart[i].quantity;

                await product.save();
            }

            const newOrder = await order.create({
                product: cart,
                user_id: user._id,
                first_address: orderaddress.first_address,
                country: orderaddress.country,
                state: orderaddress.state,
                town: orderaddress.town,
                pincode: orderaddress.pincode,
                paymentMethod: paymentMethod,
                totalamount: amount,
                status: "pending"

            });
            user.cart = [];
            await user.save();
            const orderadd = await usersModel.findOneAndUpdate({ email: req.session.email }, { $push: { order: newOrder._id } })

        }

        res.status(201).json({ message: ' stored successfully', success: true });
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const ordersPage = async (req, res) => {
    try {
        const user = await usersModel.findOne({ email: req.session.email }).populate("order").exec()
        res.render("userOrderpage", { user })
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}

const userOrderdetails = async (req, res) => {
    try {

        const id = req.query.id

        const product = await orderModel.findOne({ _id: id }).populate("product.product_id").exec()
        const order = await orderModel.findOne({ _id: id }, {}).populate('user_id').exec()

        let  productdiscount =0
        let  coupondiscount =0
        let expectedtotal =0

        for(let i=0;i < order.product.length;i++){
            productdiscount += (order.product[i].quantity*order.product[i].price) - order.product[i].totalPrice
            coupondiscount += order.product[i].totalPrice
            expectedtotal += order.product[i].quantity*order.product[i].price

        }

        coupondiscount = coupondiscount - order.totalamount
        const user = await usersModel.findOne({email:req.session.email})
        res.render("userOrderDetails", { user,product, order,productdiscount ,coupondiscount,expectedtotal})

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}




const cancelOrder = async (req, res) => {
    try {


        const orderid = req.query.orderId
        const updated = await orderModel.findOneAndUpdate({ _id: orderid }, { $set: { status: "cancel-pending",cancelOrderReason:req.query.reason } });
        res.json({ message: "order cancelled" })

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const returnOrder = async (req, res) => {
    try {
        const orderid = req.query.orderId

        const updated = await orderModel.findOneAndUpdate({ _id: orderid }, { $set: { status: "return-pending",returnOrderReason:req.query.reason} })

        res.json({ message: "order return request sented" })

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const forgotpasswordpost = async (req, res) => {

    try {

        const email = req.body.email

        const user = await usersModel.find({ email: req.body.email })
        const admin = await adminsModel.find({ email: req.body.email })

        if (user.length ==0 && admin.length==0) {
            req.session.errorMessage = "email not found.  Please try again." 
            
            res.redirect("/forgotpassword")
        } else {
            if (user) {
                req.session.verifyuser = user
            } if (admin) {
                req.session.verifyadmin = admin
            }

            const otp = otpGenerator.generate(4, { digits: true, upperCase: false, specialChars: false, upperCaseAlphabets: false, lowerCaseAlphabets: false })
            req.session.otp = otp
            req.session.email = req.body.email
            req.session.name = req.body.name
            req.session.password = req.body.password


            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: EMAIL,
                    pass: PASSWORD
                }
            })

            const mailOption = {
                from: "jinugg79@gmail.com",
                to: req.body.email,
                subject: "OTP verficatiion",
                text: `your OTP is:${otp}`,
            }

            transporter.sendMail(mailOption, (error, info) => {
               
            })


            res.redirect("/verificationPassword")
        }
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}

const verificationPassword = (req, res) => {
    if(req.session.otperror){
        otpMessage = req.session.otperror
        delete req.session.otperror
    }else{
        otpMessage = ''
    }

    res.render("forgotPasswordotp",{otpMessage})
}


const otpverifyPassword = async (req, res) => {

    try {

        const otp = req.body.otp

        if (otp === req.session.otp) {

            if (req.session.verifyadmin) {
                const admin = req.session.verifyadmin
                req.session.admin = admin.email
                const admintoken = req.session.admin
                req.cookie("currentadmin", admintoken)

                req.cookie.save()
            }
            if (req.session.verifyuser) {

                const user = req.session.verifyuser
                req.session.email = user.email
                const Token = req.session.email
                req.cookie("currentUser", Token)

                req.cookies.currentUser.save()


            }
            res.redirect("/passwordchange")
        } else {
            req.session.otperror = 'otp not matchding'
            res.redirect("/verificationPassword")
        }

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }

}

const addtoWishlist = async (req, res) => {
    try {
        const user = await usersModel.findOne({ email: req.session.email })

        if (!user) {
            res.json({ noUser: true })
        }
        
        user.wishlist.push({ product_id: req.body.productId })

        user.save()

        res.json({ success: true })

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}

const wishlist = async (req, res) => {
    try {

        const user = await usersModel.findOne({ email: req.session.email }).populate('wishlist.product_id').exec()

        res.render("wishlist", { user })

    } catch (error) {
       
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const addingtocart = async (req, res) => {
    try {
        if (!req.session.email) {
            return res.json({ noUser: true });
        }


        const useremail = req.session.email;
       
        const { productId, product_name, quantity, price } = req.body;


        const user = await usersModel.findOne({ email: useremail });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const produ = await productModel.findOne({ _id: productId }, {})
        const existingProduct = user.cart.find(item => item.product_id.toString() === productId);



        if (existingProduct) {
            existingProduct.quantity += quantity;
            existingProduct.totalPrice = existingProduct.quantity * existingProduct.price
        
        } else {

            user.cart.push({
                product_id: productId,
                product_name,
                quantity,
                price: produ.price,
                totalPrice: produ.price * quantity
            });
        }
        const wishlistIndex = user.wishlist.findIndex(
            (item) => item.product_id.toString() === productId
        );
        if (wishlistIndex !== -1) {
            user.wishlist.splice(wishlistIndex, 1);
        }

        await user.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const deletewishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await usersModel.findOne({ email: req.session.email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.wishlist = user.wishlist.filter((item) => item.product_id.toString() !== productId);
        await user.save();
        res.status(200).json({ message: "Product removed from cart" });

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const ordercheckout = async (req, res) => {
    try {
       
       const user = await usersModel.findOne({email:req.session.email})
        const currentuser = req.body.cartValue
         if(!req.body.productId){

             if(currentuser.length != user.cart.length){
                    return res.json({change:true})
             }
     
             for(let i=0;i < user.cart.length;i++){
                  if(currentuser[i].quantity != user.cart[i].quantity){
                      return res.json({change:true})
                  }
             }
         }

        if (req.body.paymentMethod == "cod") {
            res.status(200).send({
                CODsuccess: true,
            });


        } else {
            const amount = req.body.amount * 100;
            let randomNumber = Math.floor(Math.random() * 1000000); // Generate a random number
            let paddedRandomNumber = randomNumber.toString().padStart(6, '0'); // Ensure it's 6 digits long
            let receiptID = `RTN${paddedRandomNumber}`;
            const options = {
                amount: amount,
                currency: "INR",
                receipt: "user@gmail.com",
            };

            var instance = new Razorpay({ key_id: RAXORPAY_ID_KEY, key_secret: RAXORPAY_SCRETE_KEY })

            instance.orders.create(options, (err, order) => {
                if (!err) {

                    res.status(200).send({
                        success: true,
                        msg: 'Order Created',
                        order_id: order.id,
                        amount: amount,
                        key_id: RAXORPAY_ID_KEY,
                        name: req.session.user_name,
                    });
                } else {
                    res.status(400).send({ success: false, msg: 'Something went wrong!' })
                }
            });
        }
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const applycoupn = async (req, res) => {
    try {
        const code = req.body.dataBody.couponCode;
        const amount = req.body.dataBody.amount;
        const coupon = await couponModel.findOne({ coupon_code: code })
         
        const currentDate = new Date();
        const couponExpireDate = new Date(coupon.expire_date);
        
        if (currentDate > couponExpireDate) {
            return res.json({ expired: true }); // Coupon has not expired
        } 

        
        if(coupon.min_amount > parseInt(amount) || coupon.max_amount < parseInt(amount)){
            return res.json({conditionnotmatched:true})
        }

        if (coupon) {
            if (coupon.coupon_value) {
              let  totalprice 
              let discountamount 
                
              if(coupon.coupon_type == 'flate'){
                totalprice = parseFloat(amount) - parseFloat(coupon.coupon_value);
                discountamount = parseFloat(coupon.coupon_value);
              }else{
                  discountamount = parseFloat(amount)*(parseFloat(coupon.coupon_value)/100)
                totalprice = parseFloat(amount) - discountamount;
              }

              return res.json({ success: true, totalprice, discountamount });
            } else {
           
              return res.status(400).json({ invalidcoupon: true, error: 'Invalid coupon or no discount amount' });
            }
          } else {
       
            return res.json({ nocoupon: true });
          }
          

    } catch (error) {
       
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const invoiceget = async (req, res) => {
    try {


        const order = await orderModel.findOne({ _id: req.query.productid }).populate("product.product_id")

        const user = await usersModel.find({ email: req.session.email })
       
         let coupondiscount=0
         let subtotal =0
        for(let i=0;i < order.product.length;i++){
            coupondiscount += order.product[i].totalPrice
            subtotal += order.product[i].sellingprice
        }

        coupondiscount = coupondiscount - order.totalamount

        res.render("invoice", { order, user ,coupondiscount,subtotal})


    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}

const passwordchange = async (req,res)=>{

     res.render("changepassword")

}

const passwordchangingpost = async ( req, res)=>{
    try{

        const email = req.session.email 
        const user= await usersModel.findOne({email:email})
        if(user){
            usersModel.findOneAndUpdate({email:email},{$set:{password:req.body.password}})
            res.redirect("/login")
        }else{
             res.redirect("/home")
        }


    }catch(error){
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}


const refferalpost = async (req,res)=>{
    try{        
     const code = req.body.userEnteredReferralCode
     const user = await usersModel.findOne({'wallet.refferalcode': code});

     const currentUser = await usersModel.findOne({email:req.session.email})
     if(user){

        currentUser.wallet.balance += 100
        currentUser.wallet.reffered = true
        
        await currentUser.save()         
         res.json({success:true})
     }else{
        res.status(404).json({ notfound: true });
    }



    }catch(error){
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}


const checkingstock = async (req, res) => {
    try {
      if(req.query.productId){
         return     res.json({});
      }
      const user = await usersModel.findOne({ email: req.session.email }).populate('cart.product_id');  
      let outOfStockProduct = null;
      let outOfQuantityProduct = null;
  
      for (let i = 0; i < user.cart.length; i++) {
        if (user.cart[i].product_id.stock === 0) {
          outOfStockProduct = user.cart[i].product_name;
        } else if (user.cart[i].product_id.stock < user.cart[i].quantity) {
          outOfQuantityProduct = user.cart[i].product_name;
        }
      }
  
      if (outOfStockProduct) {
        return res.json({ outofstock: true, product: outOfStockProduct });
      } else if (outOfQuantityProduct) {
        return res.json({ outofquantity: true, product: outOfQuantityProduct });
      }
        res.json({});
    } catch (error) {
      res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
  };
  

module.exports = {checkingstock,refferalpost,passwordchangingpost,passwordchange, invoiceget, applycoupn, returnOrder, wallet, ordercheckout, deletewishlist, addingtocart, wishlist, addtoWishlist, verificationPassword, otpverifyPassword, forgotpasswordpost, forgotpassword, cancelOrder, userOrderdetails, ordersPage, checkoutaddressEdit, placeorder, addressEdit, deleteAddress, newaddress, checkoutView, quantityUpdate, edituserDetalis, addAdress, removeincart, addToCart, cart, verificatioinResend, productPageview, showCollection, landing, homepageview, profileView, profilePost, loginView, loginPost, userLogout, singupView, signupPost, verficatiionPost, verification }