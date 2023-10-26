const express = require('express')
const mongoose = require('mongoose')
const usersModel = require("../model/users-model")

const checkUserStatus = async (req, res, next) => {
    try {
          console.log("entering 1")

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
}

const currentuser = async (req,res,next)=>{
    try{
        if (!req.session.email) { 
            return res.redirect("/login")
        }else{
            console.log("coming to next")
            next()
        }

    }catch(error){
           
    }
}




module.exports = {checkUserStatus,currentuser}

