const express = require("express")
const session = require("express-session")
const mongoose = require("mongoose")
const nocache = require('nocache')


const app = express()

mongoose.connect("mongodb+srv://rajuaneeshp2020:EaLqElGc0ZDaomZO@cluster0.fqviskg.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("Connected to the database");
})
.catch((error) => {
    console.error("Error connecting to the database:", error);
});


app.use(session({
    secret:"your-secret-key",
    resave:false,
    saveUninitialized:true,
}))


const cookieParser = require("cookie-parser");
const upload = require("./config/multer");

app.set("view engine","ejs")
app.set("views","./views")
app.use(express.static("public"))
app.use(express.json())
app.use(express.urlencoded({extended:true}))


app.use(nocache())
app.use((req, res, next) => {
    res.set("Cache-control", "no-store,no-cache")
    next()
})

// const { admin } = require("googleapis/build/src/apis/admin");
app.use(cookieParser())
app.use("/",require("./Router/router"))

app.use("/admin", require("./Router/adminRouter"))



app.use("/internalerror",(req,res)=>{
    console.log("getting here")
    
    const error = req.query.err;
    res.status(500)
    res.render("500errorpage")
})

app.use((req,res)=>{
    res.status(404)
    res.render("errorpage")
})





app.listen(3000,()=>console.log("http://localhost:3000"))