const cloudinary = require("cloudinary").v2

exports.uploadToCloudinary= async (file,folder,height,quality)=>{
    
    try{
        const options = {
        folder,
        resource_type:"auto"
    }
    if(height) options.height = height
    if(quality) options.quality = quality

    return await cloudinary.uploader.upload(file.tempFilePath,options)
}catch(e){
    console.error(e)
    throw e
}
}
