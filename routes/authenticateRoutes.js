/**
 * Created by Yash 1300 on 07-01-2018.
 */

var mongoose = require('mongoose');
var express = require('express');
var bcrypt = require('bcrypt-nodejs');
var Member = require('../models/member');
var Transaction = require('../models/transaction');
var authenticate = require('../authenticate');
var router = express.Router();
var jwt = require('jsonwebtoken');

//Route for registering a user
router.post('/register', function(req, res){
    var newMember = new Member({
        name: req.body.name,
        regno: req.body.regno,
        email: req.body.email,
        password: req.body.password,
        phoneno: req.body.phoneno
    });

    newMember.save(function(err){
        if (err){
            console.log(err);
            if (err.code == 11000)      // Error code 11000 means that error occured due to duplication of some value
                res.json({success: false, message: "A user with same email or reg num already exists"});
            else
                res.json({success: false, message: "An error occured"});
        } else {
            res.json({success: true, message: "Registered successfully"});
        }
    });
});

//Route for authenticating a user
router.post('/login', function(req, res){
    var email = req.body.email; // Email of the user
    var pass = req.body.password; //Password entered by the user

    Member.findOne({email: email}, function(err, outputMember){
        if (err){
            console.log(err);
            res.json({success: false, message: "An error occured"});
        } else {
            if (!outputMember)
                res.json({success: false, message:"No user exists with such details"});
            else {
                if (!bcrypt.compareSync(pass, outputMember.password))
                    res.json({success: false, message: "Wrong password entered"});
                else{
                    var token = jwt.sign(JSON.parse(JSON.stringify(outputMember)), 'secret');
                    res.header("Set-Cookie","x-access-token="+token);

                    //Finding all the transactions with returned != "1"
                    Transaction.find({memberId: outputMember._id, returned:{$ne:"1"}}, function(err, outputTransactions){
                        if (err){
                            console.log(err);
                            res.json({success: false, message: "An error occured"});
                        } else {
                            var issued = 0;
                            var requested = 0;
                            for (var i=0;i<outputTransactions.length;i++){
                                if (outputTransactions[i].returned === '0')
                                    issued += parseInt(outputTransactions[i].quantity);
                                else
                                    requested += parseInt(outputTransactions[i].quantity);
                            }
                            setTimeout(function(){
                                res.json({success: true, message:"User authenticated successfully", name: outputMember.name, regno: outputMember.regno, email: outputMember.email, phoneno: outputMember.phoneno, isAdmin: outputMember.isAdmin, issuedComponents:issued, requestedComponents: requested, token: token});
                            }, 200);
                        }
                    });
                }
            }
        }
    });
});

module.exports = router;
