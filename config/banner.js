const multer = require("multer")

const path = require("path")

const storage = multer.diskStorage({
    destination:((req,file,cb)=>{
        cb(null, path.join(__dirname,"../public/banner"))
    }),
   filename:((req,file,cb)=>{
       const name = Date.now()+"-"+file.originalname
       cb(null,name)
   })

})

const bannerupload = multer({storage:storage})


module.exports = bannerupload