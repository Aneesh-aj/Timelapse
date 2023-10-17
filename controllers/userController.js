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

        res.render("forgotpassword")

    } catch (error) {

    }
}

const homepageview =async (req, res) => {
    
    try{
        
        const product = await productModel.find({}).limit(4)

         console.log("the products",product)
         
        res.render("homePage",{product})
    }catch(error){
         console.log(error)
    }



}

const profileView = async (req, res) => {

    if (!req.session.email) {
        return res.redirect("/login")
    }



    if (req.session.email) {
        console.log("==============in profile =========")
        console.log("========enter token=========", req.session.enter_token)
        console.log("======================session full ==========", req.session)
        console.log("session email :", req.session.email)



        console.log("======== after enter token=========", req.session.enter_token)
        console.log("======================after session full ==========", req.session)

        const userid = await usersModel.findOne({ email: req.session.email }, { _id: 1 })
        const user = await usersModel.findOne({ email: req.session.email })

        const address = await usersModel.findOne({ email: req.session.email }, { address: 1 })

        console.log(" the address form the user ", address)

        console.log("email --->", req.session.email)
        console.log(" in the profile the user id", userid)

        console.log("the address ", address)
        res.render("profile", { userid, address, user })
    } else {

        res.redirect("/login")
    }
}


const profilePost = (req, res) => {

    if (!req.session.email) {
        return res.redirect("/login")
    }

    if (req.session.email) {

        res.redirect("/profile")
    } else {
        res.redirect("/login")
    }
}

const loginView = (req, res) => {

    console.log("entering to the login page")

    if (!req.session.email) {
        return res.render("login")
    }

    if (req.session.email) {
        console.log("if there is cookie ")
        return res.redirect("/profile")
    }
    else if (req.cookies.currentadmin) {

        return res.redirect("/admin")
    }

}

const loginPost = async (req, res) => {

    try {
        let user = await usersModel.findOne({ email: req.body.email, password: req.body.password })
        const admin = await adminsModel.findOne({ email: req.body.email, password: req.body.password })

        if (admin) {
            req.session.admin = req.body.email

            const admintoken = req.session.admin
            res.cookie("currentadmin", admintoken)

            console.log("----------------cookie", req.cookies.currentadmin)
            res.redirect("/admin")

        }
        else if (user) {

        

            req.session.email = req.body.email
            req.session.user_name = user.name
            const Token = req.session.email
            console.log("------ in pat of login : req.session.email after assin", req.session.email)
            console.log("log the toke ", Token)







            console.log("user", user)


            res.redirect("/home")
        } else {
            res.render("login", { errorMessage: "Incorrect email or password. Please try again." })
        }
    } catch (error) {
        console.error("Error in /login route:", error);
        res.redirect("/home"); // Handle the error gracefully
    }
}

const userLogout = (req, res) => {

    req.session.destroy()
    res.clearCookie("currentUser")
    res.redirect("/home")
}

const singupView = (req, res) => {
    try {
        console.log("entered to signup")
        if (req.session.email) {
            res.redirect("/profile")
        } else {
            res.render("sign-up")
        }
    } catch (error) {
        console.log(error)
    }
}

const signupPost = async (req, res) => {

    console.log("singup post route")

    try {
        const user = await usersModel.find({ name: req.body.name, email: req.body.email, password: req.body.password })


        if (user.length > 0) {
            // User already exists, redirect with an error message
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
    console.log("verification get")
    if (req.session.enter_token) {

        console.log("otp :--  ", req.session.otp)
        res.render("otp-sent", { error: false })
    }
}

const verficatiionPost = async (req, res) => {


    console.log("consoling the req.session.otp", req.session.otp)
    if (req.session.otp === req.body.otp) {
        console.log("the otp is correct")
        await usersModel.create({
            name: req.session.name,
            email: req.session.email,
            password: req.session.password,
            block: false
        })
        const Token = req.session.email
        res.cookie("currentUser", Token)
        res.redirect("/home")
    } else {


        delete req.session.otp


        console.log("the otp is wrong")
        res.render("otp-sent", { error: 'Invalid OTP. Please try again.' })
    }
}

// Example route for OTP resend
const verificatioinResend = (async (req, res) => {
    try {
        // Generate a new OTP
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

        const database = await productModel.find(filterQuery).populate("watch_type").limit(8);
        const totalItems = database.length;
        const totalPages = Math.ceil(totalItems / 8);
        const skip = (page - 1) * 8;
        const slicedData = database.slice(skip, skip + 8);

        if (watchType.length != 0) {
            var watch = await watchtypeModel.findOne({ _id: watchType }, { watch_type: 1 });
        }

        res.render("productCollection", { database: slicedData, watchtype, watch, totalPages, currentPage: page, pr1, pr2, gender, watchType, searchvalue, message });
    } catch (error) {
        console.error("Error in showCollection route:", error);
        res.status(500).render("errorPage");
    }
};


const wallet = async (req, res) => {
    try {

        const user = await usersModel.findOne({ email: req.session.email })

        res.render("wallet", user)
    } catch (error) {

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
        res.redirect("/home")
    }
}


const checkUserStatus = async (req, res, next) => {
    try {

        if (req.session.email) {
            const user = await usersModel.findOne({ email: req.session.email });



            if (user && user.block) {

                return res.render("blockedPage");
            }
        }


        next();
    } catch (error) {
        console.error('Error in checkUserBlockStatus middleware:', error);
        res.status(500).render('errorPage');
    }
};

const isuser = (req, res) => {

    console.log("------ in the user checking api")
    console.log(req.session.email)
    if (!req.sessioin.email) {

        return res.redirect("/login")
    }
    next()
}

const cart = async (req, res) => {


    try {



        if (!req.session.email) {
            return res.redirect("/login")
        }

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
        for (let i = 0; i < user.cart.length; i++) {
            user.cart[i].totalPrice = user.cart[i].price * user.cart[i].quantity
            console.log(user.cart[i].totalPrice);
            totalprice += user.cart[i].totalPrice
        }




        res.render("cart", { user, totalprice })

    } catch (error) {
        console.log(error)
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


        await user.save();

        console.log("============>", user.cart)


        res.json({ success: true });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, error: 'Failed to add to cart' });
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
        res.status(500).json({ message: "Internal Server Error" });
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
        res.status(500).json({ error: 'Internal server error' });
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
        console.log(error)
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


        // if (!user || !user.cart[index]) {
        //     return res.status(404).json({ error: 'User or cart item not found.' });
        // }



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
                user.cart[i].totalPrice = user.cart[i].price * user.cart[i].quantity
                totalprice += user.cart[i].totalPrice
            }
            console.log("toal price ", totalprice)
        } else {
            console.log("it is came to else")
            const product = await productModel.findOne({ _id: productid }, {})
            totalprice += product.price * parsedQuantity

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
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const checkoutView = async (req, res) => {



    try {

        if (!req.session.email) {
            return res.redirect("/login")
        }


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
        console.log("befroe  the condition ", totalprice)
        if (!singleproductid) {
            for (let i = 0; i < user.cart.length; i++) {
                totalprice += user.cart[i].price * user.cart[i].quantity
            }
            console.log("total price from the cart products", totalprice)
        } else {
            if (req.session.quantity) {
                totalprice += singleproduct.price * req.session.quantity

                console.log("total price form session", totalprice)
            } else {
                totalprice += singleproduct.price
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
        res.render("checkoutpage", { user, qnt, coupon,totalprice, address, singleproduct, singleproductid })

    } catch (error) {
        console.log(error)
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
        console.log(error)
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
        return res.status(500).json({ message: 'Internal server error' });
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
        return res.status(500).send("Internal server error.");
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
        return res.status(500).send("Internal server error.");
    }
};


const placeorder = async (req, res) => {

    try {



        console.log("it entered to the route for placing order");
        console.log("-------------------------------------------")
        console.log("the body", req.body)

        const paymentMethod = req.body.paymentMethod
        const addressId = req.body.addressId
        const productid = req.session.singleproductid
        const totalamount = req.body.alltotal
        const user = await usersModel.findOne({ email: req.session.email })

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }


        if (paymentMethod === "online") {
            if (req.body.alltotal > req.body.amount) {
                let minus = req.body.alltotal - req.body.amount

                user.wallet.balance = user.wallet.balance - minus
                await user.save()
            }
        }



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

            let totalprice = qnt * product.price
            const singlePrd = {
                product_id: product._id,
                quantity: qnt,
                price: product.price,
                totalPrice: totalprice
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
                totalamount: totalamount,
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
                totalamount: totalamount,
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
        res.status(500).json({ error: 'Internal server error' });
    }
}


const ordersPage = async (req, res) => {
    try {

        if (!req.session.email) {
            return res.redirect("/login")
        }


        const user = await usersModel.findOne({ email: req.session.email }).populate("order").exec()


        console.log("the orderrs  ", user)

        res.render("userOrderpage", { user })


    } catch (error) {
        console.log(error)
    }
}

const userOrderdetails = async (req, res) => {
    try {

        const id = req.query.id

        const product = await orderModel.findOne({ _id: id }).populate("product.product_id").exec()
        const order = await orderModel.findOne({ _id: id }, {}).populate('user_id').exec()

        res.render("userOrderDetails", { product, order })

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
        console.log(error)
    }
}

const returnOrder = async (req, res) => {
    try {
        console.log("enteringggnnnnn")
        const orderid = req.query.orderId

        const updated = await orderModel.findOneAndUpdate({ _id: orderid }, { $set: { status: "return-pending" } })

        console.log("its updated -",updated)
        res.json({ message: "order return request sented" })

    } catch (error) {
        console.log(error)
    }
}

const forgotpasswordpost = async (req, res) => {

    try {

        const email = req.body.email

        const user = await usersModel.find({ email: req.body.email })
        const admin = await adminsModel.find({ email: req.body.email })

        if (!user && !admin) {
            if (user) {
                req.session.verifyuser = user
            } if (admin) {
                req.session.verifyadmin = admin
            }
            res.render("login", { errorMessage: "email not found.  Please try again." })
        } else {
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
        console.log(error)
    }
}

const verificationPassword = (req, res) => {
    res.render("forgotPasswordotp")
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
            res.redirect("/home")
        } else {
            res.render("forgotPasswordotp", { errorMessage: 'otp not matchding' })
        }

    } catch (error) {
        console.log(error)
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
        console.log(error)
    }
}

const wishlist = async (req, res) => {
    try {

        const user = await usersModel.findOne({ email: req.session.email }).populate('wishlist.product_id').exec()

        res.render("wishlist", { user })

    } catch (error) {
        console.log(error)
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
        res.status(500).json({ success: false, error: 'Failed to add to cart' });
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
        console.log(error)
    }
}


const ordercheckout = async (req, res) => {
    try {
        console.log("it coming to ordercheout post")

        console.log("--------th body", req.body)

     

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
        res.render('error', { error: error.message })
    }
}


const applycoupn = async (req,res)=>{
    try{
        const code = req.body.dataBody.couponCode;
    const amount = req.body.dataBody.amount;


        console.log("---code",code)
        console.log("----",amount)
        
                const coupon = await couponModel.findOne({coupon_code:code})
                console.log("its coupn",coupon.coupon_value)

       if(coupon && coupon.coupon_value){
         
        const totalprice = parseFloat(amount) - parseFloat(coupon.coupon_value);
         console.log("the total",totalprice)  
      
        res.json({totalprice})
       }else{
        console.log('Invalid coupon or no discount amount');
        res.status(400).json({ error: 'Invalid coupon or no discount amount' });
       }

    }catch(error){
        console.log(error)
    }
}





module.exports = {applycoupn,returnOrder,wallet, ordercheckout, deletewishlist, addingtocart, wishlist, addtoWishlist, verificationPassword, otpverifyPassword, forgotpasswordpost, forgotpassword, cancelOrder, userOrderdetails, isuser, ordersPage, checkoutaddressEdit, placeorder, addressEdit, deleteAddress, newaddress, checkoutView, quantityUpdate, edituserDetalis, addAdress, removeincart, addToCart, cart, checkUserStatus, verificatioinResend, productPageview, showCollection, landing, homepageview, profileView, profilePost, loginView, loginPost, userLogout, singupView, signupPost, verficatiionPost, verification }