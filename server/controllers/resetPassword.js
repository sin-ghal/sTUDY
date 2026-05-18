const User = require("../models/user")
const { mailSender } = require("../utils/mailSender")
const bcrypt = require("bcrypt")
const crypto = require("crypto")

//reset password token
exports.resetPasswordToken = async (req, res) => {
    try {
        // get email from req
        const { email } = req.body

        //email validation
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Enter the email first"
            })
        }
        const user = await User.findOne({ email })

        //user existence
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            })
        }

        //generate token
        const token = crypto.randomUUID();

        //update user by adding token and expiry time
        await User.findOneAndUpdate({ email },
            {
                token: token,
                resetPasswordExpire: Date.now() + 5 * 60 * 1000
            },
            { new: true }
        )
        //updated the user schema

        const url = `http://localhost:3000/update-password/${token}`

        //send mail containing the url
        await mailSender(email,
            "Password Reset Link",
            `Click here to reset your password: ${url}`
        )
        //email sent

        //return response
        return res.status(200).json({
            success: true,
            message: "Email sent successfully",
             token:token
        })
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Something went while resetting the password",
           
        })
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const {password, confirmPassword, token} = req.body

        if(!password || !confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Enter the required details first"
            })
        }
        if(password != confirmPassword){
             return res.status(400).json({
                success: false,
                message: "password and confirm password not matched"
            })
        }
        const user = await User.findOne({token})

//if no entry is found using token        
        if(!user){
            return res.status(400).json({
                success: false,
                message: "token invalid"
            })
        }

//if token is expired
        if(user.resetPasswordExpire < Date.now()){
             return res.status(400).json({
                success: false,
                message: "token is expired"
            })
        }
    //hash the password
    const hashedPass = await bcrypt.hash(password,10)

//update the password
await User.findOneAndUpdate({token},
    {
        password:hashedPass,
        token:"",
        resetPasswordExpire:"",
    },
    {new:true}
);
return res.status(200).json({
            success: true,
            message: "password changed successfully"
            })

    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Something went wrong while resetting the password"
        })
    }
}