const mongoose = require("mongoose")
const { mailSender } = require("../utils/mailSender")

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5,
    },
})


async function sendVerificationEmail(email, otp) {
    try {
        await mailSender(
            email,
            "Verification Email From StudyNotion",
            `<h2>Your OTP is ${otp}</h2>`
        )
    } catch (error) {
        console.log("Error occurred while sending email", error)
        throw error
    }
}

OTPSchema.pre("save", async function () {
    await sendVerificationEmail(this.email, this.otp)
})

module.exports = mongoose.model("OTP", OTPSchema)
