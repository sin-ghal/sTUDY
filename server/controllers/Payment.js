const mongoose = require("mongoose");
const {instance} = require("../config/razorpay")
const Course = require("../models/course")
const User = require("../models/user")
const {mailSender} = require("../utils/mailSender")
const crypto = require("crypto")


exports.capturePayment = async (req,res)=>{
    try{
        const {courseId} = req.body;
        const userId = req.user.id;
//validation
        if(!courseId || !userId){
            return res.status(400).json({
                success: false,
                message: "course id and userid are required",
            });
        }
//valid course or not
            const existingCourse = await Course.findById(courseId)
            if(!existingCourse){
                 return res.status(404).json({
                success: false,
                message: "course not found",
            });
            }
//valid user or not
            const existingUser = await User.findById(userId)
            if(!existingUser){
                 return res.status(404).json({
                success: false,
                message: "user not found",
            });
            }
//check if user already enrolled
            const userIdToObjectId = new mongoose.Types.ObjectId(userId)
        if(existingCourse.studentsEnrolled.includes(userIdToObjectId)){
             return res.status(400).json({
                success: false,
                message: "user already paid for this",
            });
        }

// //create order   
//         const amount = existingCourse.price
//         const currency = "INR"

       const paymentResp = await instance.orders.create({
        amount : (existingCourse.price) * 100,
        currency:"INR",
         notes:{
            courseId,
            userId
         },
         receipt:Math.random(Date.now().toString())
        })

        return res.status(200).json({
            success:true,
            data:paymentResp
        })

    }catch (e) {
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

//verify signature of razorpay and server
exports.verifySignature = async(req,res)=>{
    try{
        const webhooksecret = "123456"

        const signature = req.headers["x-razorpay-signature"]

        //3 steps to encrypt webhooksecret

        const shasum = crypto.createHmac("sha256",webhooksecret)
        shasum.update(JSON.stringify(req.body))   //json to string convert
        const digest  = shasum.digest("hex") //digest generates the final hash and returns in a hex format

        if(signature === digest){
            console.log("payment is authorised")

            const {courseId,userId} = req.body.payload.payment.entity.notes

                    
//valid course or not
            const existingCourse = await Course.findById(courseId)
            if(!existingCourse){
                 return res.status(404).json({
                success: false,
                message: "course not found",
            });
            }
//valid user or not
            const existingUser = await User.findById(userId)
            if(!existingUser){
                 return res.status(404).json({
                success: false,
                message: "user not found",
            });
            }

//create an entry in course
            await Course.findByIdAndUpdate(courseId,
                {
                    $push:{
                        studentsEnrolled:userId
                    }
                },
                {new:true}
            )   
//create an entry in user            
             await User.findByIdAndUpdate(userId,
                {
                    $push:{
                        courses:courseId
                    }
                },
                {new:true}
            )
//mail send
            const emailResp = await mailSender(
                                            existingUser.email,
                                            "congratulations !!",
                                            "you are finally onboarded to the new course"
            )           
            return res.status(200).json({
                success:true,
                message:"signatue verified and course added successfully"
            })
        }else{
            return res.status(400).json({
                success:false,
                message:"some error in verifying the signature"
            })
        }

    }catch (e) {
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
    
}