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
       
        console.log("home showing")
        const product = await productModel.find({}).limit(4)
        const banner = await bannerModel.find({}).sort({ index: 1 });
        res.render("homePage", { product, banner })

    } catch (error) {
        console.error(error, "9")
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
        console.log("coming for logout here")

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




            console.log("data added to database")
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
                if (error) {
                    console.log("error sending email:", error)
                } else {
                    console.log("email sent :", info.response)
                }
            })
            req.session.enter_token = req.body.email
            console.log("-----------otp----------", req.session.otp)

            res.redirect("/verification")

        }
        else {

            res.redirect("/signup", { error: "user currenly exist" })
        }
    } catch (error) {
        req.session.signmessage = "admin not found"
        console.log(error)
        console.log("in the catch")
        res.redirect("/signup")
    }
}

const verification = (req, res) => {

    try{
        if (req.session.enter_token) {
    
            console.log("otp :--  ", req.session.otp)
            res.render("otp-sent", { error: false })
        }

    }catch(error){
        console.log(error)
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const verficatiionPost = async (req, res) => {
    
    try{
        
            if (req.session.otp === req.body.otp) {
                console.log("the otp is correct")
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
        console.log("hiiiii")
        console.log(error)
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
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        // Update the session with the new OTP
        req.session.otp = newOtp;

        console.log("=====-------resend otp-------", req.session.otp)

        res.redirect('/verification');
    } catch (error) {
        console.error('Error resending OTP:', error);
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
            filterQuery.$and = [
                { product_name: { $regex: regex } },
                { brand: { $in: await brandModel.find({ brand_category: regex }, '_id') } }
            ];
        }
        const itemsPerPage = 8; // Define itemsPerPage before using it
        const skip = (page - 1) * itemsPerPage;

        const database = await productModel.find(filterQuery).populate("watch_type").skip(skip)
        .limit(itemsPerPage).exec();

        const totalItems = await productModel.countDocuments(filterQuery); // Count total items
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Correct setting of currentPage
        let currentPage = page;
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const slicedData = database;

        if (watchType.length != 0) {
            var watch = await watchtypeModel.findOne({ _id: watchType }, { watch_type: 1 });
        }

        console.log("totalItems:", totalItems);
        console.log("totalPages:", totalPages);
        console.log("currentPage:", currentPage);

        res.render("productCollection", { database, slicedData, totalPages, currentPage, watchtype, watch, pr1, pr2, gender, watchType, searchvalue, message });
    } catch (error) {
        console.error("Error in showCollection route:", error);
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
            res.render("productPage", { product, productimage })
        } else {
            console.log(" nooooooooooooooooooooooooooooob")
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
}


const cart = async (req, res) => {
    try {
        console.log('resss sesion', req.session.email)
        const user = await usersModel.findOne({ email: req.session.email })
            .populate({
                path: "cart.product_id",
                model: productModel,
            })
            .exec();

        if (!user) {
            totalprice
            console.log("User not found in the database.");
        }

        let totalprice = 0
        console.log("the cart", user.cart)
        for (let i = 0; i < user.cart.length; i++) {
            user.cart[i].totalPrice = user.cart[i].sellingprice * user.cart[i].quantity
            console.log("user.cart.totalprice", user.cart[i].totalPrice);
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
            console.log("it comming here")
            return res.json({ noUser: true });
        }

        const useremail = req.session.email;
        console.log("any thing on the seesiionio ", req.session);

        console.log("in the api for add to cart ", useremail)
        console.log("hiii cooki", req.cookies)
        const { productId, product_name, quantity, price } = req.body;


        const user = await usersModel.findOne({ email: useremail });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const produ = await productModel.findOne({ _id: productId }, {})
        console.log("--------------------produ", produ)
        const existingProduct = user.cart.find(item => item.product_id.toString() === productId);




        if (existingProduct) {
            if ((produ.stock - existingProduct.quantity) === 0) {

                console.log("it entering ")
                return res.json({ outofStock: true })
            }
            existingProduct.quantity += quantity;
            existingProduct.totalPrice = existingProduct.quantity * existingProduct.sellingprice
            console.log("---quant", existingProduct.quantity)

            console.log("------totall", produ.totalPrice)
        } else {

            console.log("================>produ.price , produ.quantity", produ.price, produ.quantity)
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

        console.log("============>", user.cart)


        res.json({ success: true });
    } catch (error) {
        console.error('Error adding to cart:', error);
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

        console.log("came to the addres adding route");
        const { address1, country, state, district, town, locality, userid } = req.body;

        console.log("it the body ", req.body);


        console.log("user idddd", req.body.userid)
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



        console.log(" the result :", result);
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
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

        console.log("it is from =========the router of quatity update", req.body)

        const user = await usersModel.findOne({ email: req.session.email });

        const quantity = req.body.quantity
        const index = req.body.index
        const productid = req.body.productid

        console.log("=============req.body.id", productid)




        const parsedQuantity = parseInt(quantity, 10);

        if (index) {

            user.cart[index].quantity = parsedQuantity;

            await user.save();
        }



        let totalprice = 0
        if (index) {
            console.log("it is in the if condition")

            for (let i = 0; i < user.cart.length; i++) {
                console.log("in every quantity inde , qnt", i, user.cart[i].quantity)
                user.cart[i].totalPrice = user.cart[i].sellingprice * user.cart[i].quantity
                totalprice += user.cart[i].totalPrice
            }
            console.log("toal price ", totalprice)
        } else {
            console.log("it is came to else")
            const product = await productModel.findOne({ _id: productid }, {})
            totalprice += product.sellingprice * parsedQuantity

            product.totalPrice = totalprice
            req.session.quantity = parsedQuantity

            console.log("req/sessopm/quamtii-", parsedQuantity)
            console.log("--------------------session", req.session.quantity)
            console.log(" the total if the single ", totalprice)

        }

        await user.save()
        res.status(200).json({ message: 'Quantity updated successfully.', totalprice });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
};

const checkoutView = async (req, res) => {



    try {


        console.log("======================> check out viewww")
        console.log("befreo", req.query)
        console.log("the query id", req.query.product_id)
        const singleproductid = req.query.product_id
        const singleproduct = await productModel.findOne({ _id: singleproductid }, {})
        console.log("after the finding product", singleproduct)

        req.session.singleproductid = singleproductid
        console.log('resss sesion', req.session.email)



        const user = await usersModel.findOne({ email: req.session.email })
            .populate({
                path: "cart.product_id",
                model: productModel,
            })
            .exec();

        if (!user) {
            console.log("User not found in the database.");
        }


        let totalprice = 0
        let totalpriceChecking =0
        console.log("befroe  the condition ", totalprice)
        if (!singleproductid) {
            for (let i = 0; i < user.cart.length; i++) {
                totalprice += user.cart[i].sellingprice * user.cart[i].quantity
                totalpriceChecking += user.cart[i].sellingprice * user.cart[i].quantity
            }
            console.log("total price from the cart products", totalprice)
        } else {
            if (req.session.quantity) {
                totalprice += singleproduct.sellingprice * req.session.quantity
                totalpriceChecking+= singleproduct.sellingprice * req.session.quantity
                console.log("total price form session", totalprice)
            } else {
                totalprice += singleproduct.sellingprice
                totalpriceChecking += singleproduct.sellingprice * req.session.quantity
                console.log("total price form else session", totalprice)
            }
        }

        console.log(" the user ----->", user, "and also ----", user.address)
        const address = user.address

        console.log("address of user ", address)

        console.log("its caaart  ", user)

        let qnt = 1
        if (req.session.quantity) {
            qnt = req.session.quantity
        } else {
            req.session.quantity = qnt
        }


        console.log("and the user id is ", user._id)



        const coupon = await couponModel.find({})
        let discountamount = 0
        res.render("checkoutpage", { discountamount,totalpriceChecking, user, qnt, coupon, totalprice, address, singleproduct, singleproductid })

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}



const newaddress = async (req, res) => {
    try {

        console.log("its entering to the router for  adding the address")
        console.log("the body id", req.body)
        const { address1, country, state, district, town, locality, userid } = req.body;

        console.log("user id is ", userid)

        // if (!mongoose.Types.ObjectId.isValid(userid)) {
        //     return res.status(400).json({ error: 'Invalid user ID' });
        // }
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



        console.log("new addres has been added to database", result)
        res.redirect("/checkout")
    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const deleteAddress = async (req, res) => {


    console.log("it is enering to the delete routr of address")

    const addressIndex = req.body.addressIndex;
    const userId = req.body.userId

    try {
        console.log("its user id", userId, addressIndex)

        const user = await usersModel.findOne({ _id: userId });
        console.log("the user by assing", user)

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
        console.error('Error:', error);
        return  res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }



}

const addressEdit = async (req, res) => {
    try {
        console.log("in the editing router of address");
        console.log("the req.body", req.body);
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

        console.log("User with updated address:", updatedUser);
        return res.redirect("/profile");
    } catch (error) {
        console.log(error);
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
};




const checkoutaddressEdit = async (req, res) => {
    try {

        console.log("in the editing router of address");
        console.log("the req.body", req.body);
        const id = req.body.userid;

        console.log(" the id  id:", id)
        const addressIdToUpdate = req.body.addressid;
        console.log("the  addres id", addressIdToUpdate)


        const user = await usersModel.findOne({ _id: id }, {});

        console.log("user datails ", user)

        if (!user) {
            return res.status(404).send("User not found.");
        }


        const addressToUpdate = user.address.id(addressIdToUpdate);


        console.log("addressto update", addressToUpdate)

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



        console.log("User with updated address++++++++===========>:", updatedUser);
        return res.redirect("/checkout");
    } catch (error) {
        console.log(error);
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

        console.log(req.body.useWallet,"wallet-----------------")


        if (paymentMethod === "online") {
            if (req.body.alltotal > req.body.amount && req.body.useWallet == true) {
                console.log("entring here")
                let minus = req.body.alltotal - req.body.amount
                
                if(user.wallet.balance - minus <=0){
                }else{

                    user.wallet.balance =  user.wallet.balance - minus
                    await user.save()
                   
                }

                amount = (totalamount - req.body.discount)
            }
        }
        console.log("req.body.alltotal",req.body.alltotal)
        console.log("req.body.amount",req.body.amount)

        let neworder

        console.log("address id", addressId)

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
            console.log("after qnt", qnt)

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

            console.log(" --- fulll order", neworder)

            const singleorder = await usersModel.findOneAndUpdate({ email: req.session.email }, { $push: { order: neworder._id } })

            console.log("the single order ", singleorder)
            delete req.session.singleproductid


        } else {
            const cart = user.cart

            for (let i = 0; i < cart.length; i++) {
                const product = await productModel.findOne({ _id: cart[i].product_id });

                if (!product) {

                    console.log(`Product not found for _id: ${cart[i].product_id}`);
                    continue;
                }

                product.stock -= cart[i].quantity;

                await product.save();
            }

            console.log("its the cart ", cart)
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



            console.log("its the new newOder", newOrder)
            user.cart = [];
            await user.save();
            const orderadd = await usersModel.findOneAndUpdate({ email: req.session.email }, { $push: { order: newOrder._id } })

            console.log("the order added ", orderadd)
        }


        res.status(201).json({ message: ' stored successfully', success: true });
    } catch (error) {

        console.error('Error storing address:', error);
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
         
        console.log("---orders",order)

        let  productdiscount =0
        let  coupondiscount =0
        let expectedtotal =0

        for(let i=0;i < order.product.length;i++){
            productdiscount += (order.product[i].quantity*order.product[i].price) - order.product[i].totalPrice
            coupondiscount += order.product[i].totalPrice
            expectedtotal += order.product[i].quantity*order.product[i].price
            console.log("------------------>")

        }

        coupondiscount = coupondiscount - order.totalamount
        console.log("the coupn",coupondiscount,"and teh coupoundis",order.totalamount,"also",coupondiscount - order.totalamount)
        
        console.log("product otot",productdiscount)
        res.render("userOrderDetails", { product, order,productdiscount ,coupondiscount,expectedtotal})

    } catch (error) {
        console.log(error)
    }
}




const cancelOrder = async (req, res) => {
    try {


        const orderid = req.query.orderId
        const updated = await orderModel.findOneAndUpdate({ _id: orderid }, { $set: { status: "cancelled" } });



        console.log("----------", updated)
        res.json({ message: "order cancelled" })

    } catch (error) {
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const returnOrder = async (req, res) => {
    try {
        console.log("enteringggnnnnn")
        const orderid = req.query.orderId

        const updated = await orderModel.findOneAndUpdate({ _id: orderid }, { $set: { status: "return-pending" } })

        console.log("its updated -", updated)
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

        console.log("the user and admin",user,admin)

        if (user.length ==0 && admin.length==0) {

            console.log('coming here')
            req.session.errorMessage = "email not found.  Please try again." 
            
            res.redirect("/forgotpassword")
        } else {
            console.log("but coming here")
            if (user) {
                req.session.verifyuser = user
            } if (admin) {
                req.session.verifyadmin = admin
            }

            const otp = otpGenerator.generate(4, { digits: true, upperCase: false, specialChars: false, upperCaseAlphabets: false, lowerCaseAlphabets: false })
            req.session.otp = otp




            console.log("data added to database")
            req.session.email = req.body.email
            req.session.name = req.body.name
            req.session.password = req.body.password


            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "jinugg79@gmail.com",
                    pass: "hghszzjandqlqobr"
                }
            })

            const mailOption = {
                from: "jinugg79@gmail.com",
                to: req.body.email,
                subject: "OTP verficatiion",
                text: `your OTP is:${otp}`,
            }

            transporter.sendMail(mailOption, (error, info) => {
                if (error) {
                    console.log("error sending email:", error)
                } else {
                    console.log("email sent :", info.response)
                }
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
        console.log("-----user", user)
        console.log("-----wishlist", user.wishlist)
        console.log("-------product ", req.body.productId)
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

        console.log("adding to the cartt ");

        if (!req.session.email) {
            console.log("it comming here")
            return res.json({ noUser: true });
        }


        const useremail = req.session.email;
        console.log("any thing on the seesiionio ", req.session);

        console.log("in the api for add to cart ", useremail)
        const { productId, product_name, quantity, price } = req.body;


        const user = await usersModel.findOne({ email: useremail });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const produ = await productModel.findOne({ _id: productId }, {})
        console.log("--------------------produ", produ)
        const existingProduct = user.cart.find(item => item.product_id.toString() === productId);



        if (existingProduct) {
            existingProduct.quantity += quantity;
            existingProduct.totalPrice = existingProduct.quantity * existingProduct.price
            console.log("---quant", existingProduct.quantity)

            console.log("------totall", produ.totalPrice)
        } else {

            console.log("================>produ.price , produ.quantity", produ.price, produ.quantity)
            user.cart.push({
                product_id: productId,
                product_name,
                quantity,
                price: produ.price,
                totalPrice: produ.price * quantity
            });
        }



        console.log("============>", user.cart)

        const wishlistIndex = user.wishlist.findIndex(
            (item) => item.product_id.toString() === productId
        );
        if (wishlistIndex !== -1) {
            user.wishlist.splice(wishlistIndex, 1);
        }

        await user.save();

        console.log("latest user", user)



        res.json({ success: true });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const deletewishlist = async (req, res) => {
    try {

        console.log("entering to --------------")
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
        console.log("it coming to ordercheout post")

        console.log("--------th body", req.body)
       const user = await usersModel.findOne({email:req.session.email})
        const currentuser = req.body.cartValue


        if(currentuser.length != user.cart.length){
               return res.json({change:true})
        }

        for(let i=0;i < user.cart.length;i++){
             if(currentuser[i].quantity != user.cart[i].quantity){
                 return res.json({change:true})
             }
        }
       

        if (req.body.paymentMethod == "cod") {
            console.log("entering")
            res.status(200).send({
                CODsuccess: true,
            });


        } else {
            const amount = req.body.amount * 100;
            let randomNumber = Math.floor(Math.random() * 1000000); // Generate a random number
            let paddedRandomNumber = randomNumber.toString().padStart(6, '0'); // Ensure it's 6 digits long
            let receiptID = `RTN${paddedRandomNumber}`;
            console.log("entering  so its online payment")
            const options = {
                amount: amount,
                currency: "INR",
                receipt: "user@gmail.com",
            };

            var instance = new Razorpay({ key_id: RAXORPAY_ID_KEY, key_secret: RAXORPAY_SCRETE_KEY })

            console.log("---key_id", RAXORPAY_ID_KEY)
            console.log("------scer", RAXORPAY_SCRETE_KEY)

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
                    console.log("its and errror")
                    console.log(err)

                    res.status(400).send({ success: false, msg: 'Something went wrong!' })
                }
            });
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const applycoupn = async (req, res) => {
    try {
        const code = req.body.dataBody.couponCode;
        const amount = req.body.dataBody.amount;


        console.log("---code", code)
        console.log("----amoutn", amount)

        const coupon = await couponModel.findOne({ coupon_code: code })
         
        const currentDate = new Date();
        const couponExpireDate = new Date(coupon.expire_date);
        
        if (currentDate > couponExpireDate) {
            return res.json({ expired: true }); // Coupon has not expired
        } 
        console.log("currentdate",currentDate,"prevousedate",coupon.expire_date)

        
        if(coupon.min_amount > parseInt(amount) || coupon.max_amount < parseInt(amount)){
            return res.json({conditionnotmatched:true})
        }

        if (coupon) {
            console.log("-----min",coupon.min_amount)
            console.log("------max",coupon.max_amount)
             

            if (coupon.coupon_value) {
              let  totalprice 
              let discountamount 
                
              if(coupon.coupon_type == 'flate'){
                totalprice = parseFloat(amount) - parseFloat(coupon.coupon_value);
                discountamount = parseFloat(coupon.coupon_value);
              }else{
                  discountamount = parseFloat(amount)*(parseFloat(coupon.coupon_value)/100)
                  console.log("the amount",discountamount)
                totalprice = parseFloat(amount) - discountamount;
              }

              return res.json({ success: true, totalprice, discountamount });
            } else {
           
              console.log('Invalid coupon or no discount amount');
              return res.status(400).json({ invalidcoupon: true, error: 'Invalid coupon or no discount amount' });
            }
          } else {
       
            console.log('No coupon found');
            return res.json({ nocoupon: true });
          }
          

    } catch (error) {
        console.log("ots errpr ")
        console.log(error)
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const invoiceget = async (req, res) => {
    try {

        console.log("query ", req.query.productid)

        const order = await orderModel.findOne({ _id: req.query.productid }).populate("product.product_id")

        console.log("---invoice products", order)
        console.log("after ==", order.product[0].product_id.product_name)
        const user = await usersModel.find({ email: req.session.email })
        console.log("order---", order.product.name)
        console.log("user", user)
         let coupondiscount=0
         let subtotal =0
        for(let i=0;i < order.product.length;i++){
            coupondiscount += order.product[i].totalPrice
            subtotal += order.product[i].sellingprice
        }

        coupondiscount = coupondiscount - order.totalamount

         console.log("the user",user)
         console.log("the orders",order)
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
         console.log('entering here')

        const email = req.session.email 

        const user= await usersModel.findOne({email:email})

        console.log("---user",user)

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
    
        console.log("comming here")
        
     const code = req.body.userEnteredReferralCode

     console.log("the code",code)
     const user = await usersModel.findOne({'wallet.refferalcode': code});

     const currentUser = await usersModel.findOne({email:req.session.email})
      console.log("the uer",user)
     if(user){

        currentUser.wallet.balance += 100
        currentUser.wallet.reffered = true
        
        await currentUser.save() 

        console.log("coming here",currentUser)
        
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
      console.log("checking stock");
  
      const user = await usersModel.findOne({ email: req.session.email }).populate('cart.product_id');
      console.log("the user", user.cart[0].product_id.stock);
  
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
  
      console.log("after loop");
      res.json({});
    } catch (error) {
      res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
  };
  

module.exports = {checkingstock,refferalpost,passwordchangingpost,passwordchange, invoiceget, applycoupn, returnOrder, wallet, ordercheckout, deletewishlist, addingtocart, wishlist, addtoWishlist, verificationPassword, otpverifyPassword, forgotpasswordpost, forgotpassword, cancelOrder, userOrderdetails, ordersPage, checkoutaddressEdit, placeorder, addressEdit, deleteAddress, newaddress, checkoutView, quantityUpdate, edituserDetalis, addAdress, removeincart, addToCart, cart, verificatioinResend, productPageview, showCollection, landing, homepageview, profileView, profilePost, loginView, loginPost, userLogout, singupView, signupPost, verficatiionPost, verification }