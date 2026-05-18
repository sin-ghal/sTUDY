const {mailSender} = require("../utils/mailSender")

exports.contactUsController = async (req,res) =>{
    try{
    const {
        email,
        firstName,
        lastName,
        message,
        phone,
        countryCode
    } = req.body

     if (
      !email ||
      !firstName ||
      !lastName ||
      !message ||
      !phone ||
      !countryCode
    ) {
      return res.status(400).json({
        success: false,
        message: "All Fields are Mandatory",
      })
    }

    const mailSend = await mailSender(
        email,
        "Your Data sent successfully",
        `You will be contacted from us shortly`
    )

     return res.json({
      success: true,
      message: "Email send successfully",
    })

}catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

}