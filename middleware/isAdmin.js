const express = require('express')
const mongoose = require('mongoose')
const adminsModel = require("../model/admin-model")

const isadmin = async (req, res, next) => {
    try {

        if (!req.session.admin) {
            res.redirect("/login")
        }else{
            next()
        }

    } catch (error) {

    }
}


module.exports = {isadmin}