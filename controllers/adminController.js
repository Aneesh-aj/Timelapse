
const usersModel = require("../model/users-model")
const productModel = require("../model/product-model")
const watchTypeModel = require("../model/watchtypeModel")
const mongoose = require('mongoose');
const upload = require("../config/multer")
const brandModel = require("../model/brandModel")
const { query } = require("express");
const watchtypeModel = require("../model/watchtypeModel");
const orderModel = require("../model/orderModel")
const couponModel = require("../model/couponModel")
const bannerupload = require("../model/banner-Model");
const { render } = require("ejs");
const bannerModel = require("../model/banner-Model");
const { assuredworkloads } = require("googleapis/build/src/apis/assuredworkloads");




const adminpageView =  async (req, res) => {
 
  try{ 


  if (req.session.admin) {

    const orderData = await orderModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalamount" },
        },
      },
      {
        $sort: {
          "_id.year": -1, // Sort in descending order by year
          "_id.month": 1,
        },
      },
    ]);

    const allReports = {};

    const allYears = [];

    orderData.forEach(entry => {
      const year = entry._id.year;
      const month = entry._id.month;
      const count = entry.count;
      const totalAmount = entry.totalAmount;

      if (!allReports[year]) {
        allReports[year] = {
          monthlyOrders: Array(12).fill(0),
          monthlyAmounts: Array(12).fill(0),
        };
        allYears.push(year);
      }

      allReports[year].monthlyOrders[month - 1] = count;
      allReports[year].monthlyAmounts[month - 1] = totalAmount;
    });


    const users = await usersModel.find({block:"false"})
    const products = await productModel.find({})
    const totalorders = await orderModel.find({})

    const deliveredProductsAmount = await orderModel.aggregate([
      {
        $match: { status: "Delivered" },
      },
      {
        $group: {
          _id: null,
          totalDeliveredAmount: { $sum: "$totalamount" },
        },
      },
    ]);

    const totalDeliveredAmount = deliveredProductsAmount.length
      ? deliveredProductsAmount[0].totalDeliveredAmount
      : 0;

   
    res.render("adminpage",{allReports,allYears,users,totalorders,products,totalDeliveredAmount})
  } else {
    res.redirect("/home")
  }

     }catch(error){
      res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

     }

}

const adminLogout = (req, res) => {
  res.clearCookie("currentadmin")
  res.redirect("/home")
}




const productManagment = async (req, res) => {
  try {
   

    if (req.session.admin) {
      const product = await productModel.find({}).populate("watch_type").populate("brand")



      res.render("product-managment", { product });
    } else {
      // Handle the case when the user is not an admin
      res.status(403).send("Access forbidden. Admin privileges required.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
};

const userManagment = async (req, res) => {
  try {
    if (req.session.admin) {
      let database = [];

      if (req.query.searchvalue) {
        const searchvalue = req.query.searchvalue;

        const regex = new RegExp(searchvalue, 'i');

        database = await usersModel.find({
          $or: [
            { name: { $regex: regex } }, // Replace 'name' with the actual field name you want to search
            { email: { $regex: regex } }, // Replace 'email' with the actual field name you want to search
          ]
        });
      } else {
        database = await usersModel.find();
      }

      res.render("user-managment", { database });
    }
  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
  }
};

const addProduct = async (req, res) => {
  try{
     const product = await productModel.find({})
     const watchtype = await watchTypeModel.find({ list: true })
     const brands = await brandModel.find({ list: true })
     if (req.session.admin) {
       res.render("product-adding", { product, watchtype, brands })
     }
   }catch(error){
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
   }
}

const editProduct = async (req, res) => {
  try {
    if (req.session.admin) {
      const id = req.params.id

      const product = await productModel.findById(id).populate("brand").populate("watch_type")
      const brands = await brandModel.find({ list: true })
      const watchtype = await watchtypeModel.find({ list: true })
     
      res.render("editProduct", { product, brands, watchtype })
    }
  }
  catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
  }
}

const editedProduct = async (req, res) => {
  try {
    const productId = req.query.id;

    // Validate productId format
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: "Invalid product ID format." });
    }

    // Handle file upload using multer
    upload.array("filename")(req, res, async function (err) {
      if (err) {
        // Handle any multer errors here
        console.error(err);
        return res.status(400).json({ error: "File upload failed." });
      }

      try {
        const product = await productModel.findById(productId);

        if (!product) {
          return res.status(404).json({ error: "Product not found." });
        }

        const productImage = req.files.length > 0 ? req.files[0].filename : product.product_image;

        // Update product properties
        product.product_name = req.body.product_name;
        product.watch_type = req.body.watch_type;
        product.gender = req.body.gender;
        product.price = req.body.price;
        product.brand = req.body.brand;
        product.discription = req.body.discription; // Corrected field name
        product.display_type = req.body.display_type;
        product.dial_color = req.body.dial_color;
        product.shape = req.body.shape;
        product.strap_color = req.body.strap_color;
        product.watch_case = req.body.watch_case;
        product.product_image = productImage;
        product.stock = req.body.stock
        product.discountedprice = req.body.offer,
        product.sellingprice = req.body.price - req.body.offer

        // Save the updated product
        await product.save();


        const brands = await brandModel.findOne({_id:req.body.brand})
      
        const products = await productModel.find({brand:req.body.brand})
  
      for(let  i=0;i < products.length;i++){
         if(products[i].discountedprice < (products[i].price*(brands.offer/100))){
             products[i].sellingprice = products[i].price - (products[i].price*(brands.offer/100))
             await products[i].save()
         }
      }

        res.redirect("/admin/product-managment");
      } catch (error) {
        console.error(error);
        res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
  }
};


const productListing = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productModel.findById(productId);

    if (product.list === true) {
      await productModel.findByIdAndUpdate(productId, { list: false })
    } else {
      await productModel.findByIdAndUpdate(productId, { list: true })
    }
    res.redirect("/admin/product-managment");
  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }

}


const productAdding = async (req, res) => {
  try {


    upload.array("filename")(req, res, async function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: "File upload failed." });
      }



      const filenames = req.files.map((file) => file.filename);

      const newProduct = new productModel({
        product_name: req.body.product_name,
        watch_type: req.body.watch_type,
        gender: req.body.gender,
        list: true,
        price: req.body.price,
        brand: req.body.brand,
        discription: req.body.discription,
        display_type: req.body.display_type,
        product_image: filenames,
        dial_color: req.body.dial_color,
        shape: req.body.shape,
        stock: req.body.stock,
        strap_color: req.body.strap_color,
        watch_case: req.body.watch_case,
        discountedprice: req.body.offer,
        sellingprice:req.body.price - req.body.offer
      });
 

      await newProduct.save();

      const brands = await brandModel.findOne({_id:req.body.brand})
      
      const products = await productModel.find({brand:req.body.brand})

    for(let  i=0;i < products.length;i++){
       if(products[i].discountedprice < (products[i].price*(brands.offer/100))){
           products[i].sellingprice = products[i].price - (products[i].price*(brands.offer/100))
           await products[i].save()
       }
    }
    

      res.redirect("/admin/product-managment");
    });

  } catch (error) {
    console.error(error);
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
};

const categoryGet = async (req, res) => {

  if (req.session.admin) {

    const watchtype = await watchTypeModel.find({})
    const brands = await brandModel.find({})


    res.render("category", { watchtype, brands })
  } else {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }

}


const watchtypeAdding = async (req, res) => {
  try {
    
    const watchType = await watchTypeModel.findOne({ watch_type: req.body.watch_type })
   
    if (!watchType) {
      await watchTypeModel.create({ watch_type: req.body.watch_type, list: true })
      return  res.redirect("/admin/category")
    } else {
      res.redirect("/admin/category")
    }
  }
  catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
}

const watchtypeEdit = async (req, res) => {
  try {

    const id = req.body._id
   
    const watchType = await watchTypeModel.findOneAndUpdate(
      { _id: id },
      { $set: { watch_type: req.body.watch_type } },
      { new: true } 
    );
    
    res.redirect("/admin/category")

  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
}

const watchtypeList = async (req, res) => {

  try {
    const id = await watchTypeModel.findOne({ _id: req.query._id }, { list: 1 })

    if (id.list) {
      await watchTypeModel.updateOne({ _id: req.query._id }, { $set: { list: false } })
    } else {
      await watchTypeModel.updateOne({ _id: req.query._id }, { $set: { list: true } })
    }

    res.redirect("/admin/category")
  }
  catch (error) {
     res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
}

const brandsAdding = async (req, res) => {

  try {
    const offer = parseInt(req.body.offer)
    const brand = await brandModel.find({ brand_category: req.body.brand_category })
    if (brand.length === 0) {
      await brandModel.create({ brand_category: req.body.brand_category, list: true ,offer:offer})
     
       
    } else {
      res.redirect("admin/category")
    }
    res.redirect("/admin/category")
  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
}



const brandList = async (req, res) => {

  try {
    const isTrue = await brandModel.findOne({ _id: new mongoose.Types.ObjectId(req.query._id) }, { list: 1 });

    if (isTrue.list) {
      await brandModel.updateOne({ _id: new mongoose.Types.ObjectId(req.query._id) }, { $set: { list: false } });
    } else {
      await brandModel.updateOne({ _id: new mongoose.Types.ObjectId(req.query._id) }, { $set: { list: true } });
    }

    res.redirect("/admin/category");
  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
};



const userBlock = async (req, res) => {


  try {
    const id = await usersModel.findOne({ _id: req.query._id }, { block: 1 })

    if (id.block) {
      await usersModel.updateOne({ _id: req.query._id }, { $set: { block: false } })
    } else {
      await usersModel.updateOne({ _id: req.query._id }, { $set: { block: true } })
    }

    res.redirect("/admin/user-managment")
  }
  catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
  }
}

const orderpageview = async (req, res) => {

  try {
   
    if (!req.session.admin) {
      res.redirect("/login")
    }


    const order = await orderModel.find({})

    res.render("Adminorderview", { order })

  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
}

const adminorderDetails = async (req, res) => {
  
  
  try{
      
        if (!req.session.admin) {
          res.redirect("/login")
      
        }
        const id = req.query.id
        const product = await orderModel.findOne({ _id: id }, { product: 1, _id: 0 }).populate('product.product_id').exec()
        const order = await orderModel.findOne({ _id: id }, {}).populate('user_id').exec()
      
        let  productdiscount =0
        let  coupondiscount =0
        let expectedtotal =0

        for(let i=0;i < order.product.length;i++){
            productdiscount += (order.product[i].quantity*order.product[i].price) - order.product[i].totalPrice
            coupondiscount += order.product[i].totalPrice
            expectedtotal += order.product[i].quantity*order.product[i].price
        }
      
        res.render("orderDetails", { product, order,productdiscount ,coupondiscount,expectedtotal })

    }catch(error){
      res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const updateStatus = async (req, res) => {
  try {
    const orderid = req.body.orderId
    const newstatus = req.body.newStatus

    const updated = await orderModel.findOneAndUpdate({ _id: orderid }, { $set: { status: newstatus } });
    const user = await usersModel.findOne({ _id: updated.user_id })
    if (updated) {

      

        if (newstatus == "returned") {
          user.wallet.balance += updated.totalamount
          await user.save()
        }
      
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
}

const cancelOrder = async (req, res) => {
  try {


    const orderid = req.query.orderId
    const updated = await orderModel.findOneAndUpdate({ _id: orderid }, { $set: { status: "Cancelled" } });
    res.json({ message: "order cancelled" })

  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
}

const coupon = async (req, res) => {
  try {


    const coupon = await couponModel.find({})

    res.render("coupon", { coupon })

  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
}


const addingcoupon = async (req, res) => {
  try {

    const couponcode = req.body.coupon_code
    const coupondate = req.body.coupon_date
    const couponvalue = req.body.coupon_value
    const coupontype = req.body.coupon_type
    const min = req.body.min
    const max = req.body.max


    const coupon = await couponModel.create({
      coupon_code: couponcode,
      expire_date: coupondate,
      coupon_value: couponvalue,
      coupon_type: coupontype,
      min_amount: min,
      max_amount: max
    })

    res.redirect("/admin/coupon")

  } catch (error) {
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

  }
}

const bannerpageRendering = async (req, res) => {
  try {

    const banner = await bannerModel.find({})
    res.render("bannerpage", { banner});
  } catch (error) {
    console.error(error);
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
  }
}
const banneradding = async (req, res) => {
  try {
      if (!req.file.filename) {
          return res.status(400).send('No file uploaded.');
      }

      
      const { filename } = req.file;
      const { index } = req.body; // Assuming the index is sent in the request body

      const updatedBanner = await bannerModel.findOneAndUpdate(
          { index },
          { banner: filename, index },
          { upsert: true, new: true }
      );
      res.json({ success: true, message: 'Banner image uploaded successfully' });

  } catch (error) {
      console.error(error);
      res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
    }
};



const removeBannerImage = async (req, res) => {
  try {
    
    const { index } = req.body;
    const banner = await bannerModel.findOne({ index:index });
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    await bannerModel.findOneAndDelete({ index:index });


    res.status(200).json({ success: true, message: 'Banner image removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
  }
};

const chartreport = async (req, res) => {
  try {
    const orderData = await orderModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalOrders: { $sum: 1 },
          deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
          returnedOrders: { $sum: { $cond: [{ $eq: ["$status", "returned"] }, 1, 0] } },
          totalAmount: { $sum: "$totalamount" }, // Summing total amounts for all orders
          deliveredAmount: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, "$totalamount", 0] } }, // Summing amounts for delivered orders
        },
      },
      {
        $sort: {
          "_id.year": -1, // Sort in descending order by year
          "_id.month": 1,
        },
      },
    ]);

    const deliveredOrderAmountData = await orderModel.aggregate([
      {
        $match: {
          status: "Delivered"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          deliveredOrderAmount: { $sum: "$totalamount" },
        },
      },
    ]);

    const allReports = {};

    orderData.forEach(entry => {
      const year = entry._id.year;
      const month = entry._id.month;
      const totalOrders = entry.totalOrders;
      const deliveredOrders = entry.deliveredOrders;
      const returnedOrders = entry.returnedOrders;
      const totalAmount = entry.deliveredAmount; 

      if (!allReports[year]) {
        allReports[year] = {
          monthlyOrders: Array(12).fill(0),
          monthlyAmounts: Array(12).fill(0),
          monthlyOrdersCount: Array(12).fill(0),
          monthlyOrderReturned: Array(12).fill(0),
        };
      }

      allReports[year].monthlyOrders[month - 1] = totalOrders;
      allReports[year].monthlyAmounts[month - 1] = totalAmount;
      allReports[year].monthlyOrdersCount[month - 1] = deliveredOrders;
      allReports[year].monthlyOrderReturned[month - 1] = returnedOrders;
    });

    // Update the total amount for each month based on deliveredOrderAmountData
    deliveredOrderAmountData.forEach(deliveredEntry => {
      const year = deliveredEntry._id.year;
      const month = deliveredEntry._id.month;
      const deliveredOrderAmount = deliveredEntry.deliveredOrderAmount;

      if (allReports[year]) {
        allReports[year].monthlyAmounts[month - 1] = deliveredOrderAmount;
      }      
    });   
    res.json({ allReports });

  } catch (error) {
    console.error(error);
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
  }
};


const salesreport = async (req,res)=>{
    try{


      const order = await orderModel.find({})
        
      res.render("salesreport",{order})

    }catch(error){
      res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}

const watchtypechecking = async (req,res)=>{
   try{

    const inputvalue = req.body.inputvalue
    const watchtypes = await  watchTypeModel.find({})

    for(let i=0;i < watchtypes.length;i++){
         if(inputvalue == watchtypes[i].watch_type.toLowerCase().trim()){
              return res.json({Exist:true})
         }
    }

    res.json({NotExist:true})

   }catch(error){
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
   }
}



const brandexist = async (req,res)=>{
    try{

      const inputvalue = req.body.inputvalue  
      const brands = await  brandModel.find({})
  
      for(let i=0;i < brands.length;i++){
           if(inputvalue == brands[i].brand_category.toLowerCase().trim()){
                return res.json({Exist:true})
           }
      }
  
      res.json({NotExist:true})  

    }catch(error){
      res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

    }
}


const brandedit = async (req,res)=>{
   try{
      

    const id = req.body._id
    const offer = parseFloat(req.body.offer);
    const brands = await brandModel.updateOne({ _id: id }, { $set: { brand_category: req.body.brand_category,offer:offer } })
     
    const products = await productModel.find({brand:id})

    for(let  i=0;i < products.length;i++){
       if(products[i].discountedprice < (products[i].price*(offer/100))){
           products[i].sellingprice = products[i].price - (products[i].price*(offer/100))
           await products[i].save()
       }
    }
    
    res.redirect("/admin/category")
      
   }catch(error){
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

   }
}

const productimageedit = async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).send('No file uploaded.');
      }

      const { index } = req.body;

      const product = await productModel.findOne({_id:req.body.id}); // Use findOne instead of find to get a single document

      product.product_image[index] = req.file.filename;

      await product.save(); // Save the updated product object

      res.json({ success: true, message: 'Banner image uploaded successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
  }
};

const removepicture = async (req,res)=>{
   try{
    
      const product = await productModel.findOne({_id:req.body.id,})
      
      product.product_image[req.body.index] = ""
      product.save()

      res.status(200).json({ success: true, message: 'Banner image removed successfully' });


   }catch(error){
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));

   }
}

const downloadSalesReport = async (req, res) => {
  const { startDate, endDate } = req.query
  try {
      const salesResult = await orderModel.find({
          status: 'Delivered',
          createdAt: { $gte: startDate, $lte: endDate },
      }).populate('user_id')


      const data = salesResult.map((order) => ({
          date: order.createdAt.toISOString().substring(0, 10),
          orderId: order._id,
          username: order.user_id.name + order.user_id.second_name,
          paymentMethod: order.paymentMethod,
          totalAmount: order.totalamount,
      }));

      res.json(data);
  }
  catch (error) {
      res.send('Error at downloading sales report')
  }
}

const couponedit = async (req,res)=>{
  try{

    const id = req.body.id
    const coupon = await couponModel.findByIdAndUpdate({_id:id},
      {$set:{
        coupon_code:req.body.coupon_code,
        coupon_type:req.body.coupon_type,
        coupon_value:req.body.coupon_value,
        min_amount:req.body.min,
        max_amount:req.body.max
      }})

      if(req.body.coupon_date){
         coupon.expire_date = req.body.coupon_date
         coupon.save()
      }

      res.redirect("/admin/coupon")

  }catch(error){
    res.status(500).redirect('/internalerror?err=' + encodeURIComponent(error.message));
  }
}


module.exports = {couponedit,downloadSalesReport,removepicture,productimageedit,brandedit,brandexist,watchtypechecking,salesreport, chartreport,removeBannerImage,bannerpageRendering ,banneradding, addingcoupon, coupon, cancelOrder, updateStatus, adminorderDetails, orderpageview, userBlock, brandList, brandsAdding, watchtypeList, watchtypeEdit, categoryGet, watchtypeAdding, productAdding, productListing, adminpageView, adminLogout, productManagment, userManagment, addProduct, editProduct, editedProduct }