const profile =  require("../models/profile")
const User = require("../models/user") 

exports.updateProfile = async (req,res)=>{

    try{
        const {gender,dateOfBirth,about} = req.body
    const userID = req.user.id

    if(!userID){
         return res.status(400).json({
        success: false,
        message: "User id is required",
      })
    }

const existingUser = await User.findById(userID)
if(!existingUser){
     return res.status(400).json({
        success: false,
        message: "User not found",
      })
}
    const profileID = existingUser.additionalDetails

const updatedProfile = await profile.findByIdAndUpdate(profileID,
    {
    gender:gender,
    dateOfBirth:dateOfBirth,
    about:about
    },
    {new:true}
)

return res.status(200).json({
        success: true,
        message: "profile updated successfully",
        data:updatedProfile
      })

}catch(e){
    res.status(500).json({
        success:false,
        message:"error in updating profile"
    })
}


}