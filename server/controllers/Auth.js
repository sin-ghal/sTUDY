const User = require("../models/user")
const OTP = require("../models/otp")
const otpGenerator = require("otp-generator")
const bcrypt = require("bcrypt")
const Profile = require("../models/profile")
const jwt = require("jsonwebtoken")
const cookie = require("cookie-parser")
const user = require("../models/user")

require("dotenv").config()


exports.generateOtp = async (req, res) => {
    try {
        const { email } = req.body

        // const userExists = await User.findOne({email})
        // if(userExists){
        //     return res.status(409).json({
        //         message:"User already exists",
        //         success:false
        //     })
        // }

        //email validation
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }
         //email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

if (!emailRegex.test(email)) {
    return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
    })
}

//limit for the user to send one otp in 1 min 
        const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 })
        if (recentOtp && (Date.now() - recentOtp.createdAt < 60 * 1000)) {
            return res.status(429).json({
                message: "Wait 1 minute"
            })
        }
//limit for the user to send one otp in 1 min  done


        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        })
        let result = await OTP.findOne({ otp })  //duplicate milaa

        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            })
            result = await OTP.findOne({ otp })
        }

        const response = await OTP.create({ email, otp })

        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp:`${otp}`
        })

    } catch (e) {
        return res.status(500).json({
            message: e.message,
            success: false
        })
    }
}

//signup page
exports.signup = async (req, res) => {
    try {
        // Destructure fields from the request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body
        // Check if All Details are there or not
        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !confirmPassword ||
            !otp
        ) {
            return res.status(403).send({
                success: false,
                message: "All Fields are required",
            })
        }
        // Check if password and confirm password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Password and Confirm Password do not match. Please try again.",
            })
        }
       


        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists. Please sign in to continue.",
            })
        }
        // Find the most recent OTP for the email and compare with in input otp
        // const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 })
        if (!recentOtp) {
            return res.status(400).json({
                success: false,
                message: "otp not found"
            })
        }

         //manually check the expiry 
        const timediff = Date.now() - recentOtp.createdAt
        if (timediff > 5 * 60 * 1000) {
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            })
        }
        //manually checked the expiry
        if (otp !== recentOtp.otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid otp"
            })
        }
        //otp validation done

//delete after verification
const deleteOtp = await OTP.deleteMany({ email })
//deleted after verification

        //hash password
        const hashedPass = await bcrypt.hash(password, 10)
        //hashing done

        //create an entry in database
        const profile = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: contactNumber
        })

        const response = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPass,
            accountType,
            additionalDetails: profile._id
        })
        
        return res.status(200).json({
            success: true,
            message: "User registered successfully",
            user:response
        });

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "User cannot be registered. Please try again.",
        })
    }
}

//login
exports.login = async (req,res)=>{
    try{
        const {email,password} = req.body

//data validation        
        if(!email || !password){
             return res.status(400).send({
                success: false,
                message: "All Fields are required",
            })
        }
//data validation done  

//user existence
        const user = await User.findOne({email})
        if(!user){
            return res.status(404).send({
                success: false,
                message: "user not found",
            })
        }
//user existence done
console.log("208line is running");

//password match and generate jwt token
if(await bcrypt.compare(password,user.password)){
    const token = jwt.sign(
        {
            email:user.email,
            id:user._id,
            role:user.accountType
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "3d"
        }
    )
    user.token = token 
    user.password = undefined

// Set cookie for token and return success response 
    const options = {
        expires: new Date(Date.now() + 3*24*60*60*1000),
        httpOnly:true,
    }

//password matched and generated jwt token

//token ko browser me bhejna...token is stored in browser
res.cookie("token",token,options).status(200).json({
        success: true,
        token,
        user,
        message: `User Login Success`,
      })
}else {
      return res.status(401).json({
        success: false,
        message: `Password is incorrect`,
      })
    }

    }catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            // message: "User cannot login. Please try again.",
            message:error.message
        })
    }
}

exports.deleteAccount = async (req,res)=>{
    try{
        const userId = req.user.id;

        await User.findByIdAndDelete(userId);
        await Profile
        return res.status(200).json({
            success:true,
            message:"Account deleted successfully"
        })
    }catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message:error.message
        })
    }
}