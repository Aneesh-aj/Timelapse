const express = require("express")
const session = require("express-session")
const mongoose = require("mongoose")



const app = express()

mongoose.connect("mongodb://127.0.0.1:27017/watches", {
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



// const { admin } = require("googleapis/build/src/apis/admin");
app.use(cookieParser())
app.use("/",require("./Router/router"))

app.use("/admin", require("./Router/adminRouter"))



app.listen(3000,()=>console.log("http://localhost:3000"))