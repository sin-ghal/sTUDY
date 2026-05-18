const subSection = require("../models/subSection")
const { uploadToCloudinary } = require("../utils/uploadToCloudinary")
const Section = require("../models/Section")
const cloudinary = require("cloudinary").v2

exports.createSubSection = async (req, res) => {
    try {
        //fetch the data
        const { title, timeDuration, description, sectionId } = req.body

        //fetch the video
        const videofile = req.files?.video

        //validation
        if (!title || !timeDuration || !description || !videofile || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        const existingSection = await Section.findById(sectionId)
        if(!existingSection){
             return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        }

        //upload video to cloudinary
        const cloudinaryInfo = await uploadToCloudinary(videofile, process.env.FOLDER_NAME)

        const newSubSection = await subSection.create({
            title,
            timeDuration,
            description,
            videoUrl: cloudinaryInfo.secure_url,
            publicIdforCloudinary: cloudinaryInfo.public_id , //for deleting the video in future
        })

        const updatedSection = await Section.findByIdAndUpdate(sectionId,
            {
                $push: {
                    subSection: newSubSection._id
                }
            },
            { new: true }
        ).populate({ path: "subSection" })
        
        //return response
        return res.status(200).json({
            success: true,
            message: "subSection created Successfully",
            data: updatedSection
        })

    } catch (e) {
        console.log("FULL ERROR => ", e)
        return res.status(500).json({
            message: "Internal server error",
            message:e,
            // success: false
        })
    }
}

//update subsection
exports.updateSubSection = async (req, res) => {

    try {
        //fetch the data
        const { title, timeDuration, description, subSectionId } = req.body

        //fetch the video
        const videofile = req.files?.video

        //validation
        if (!title || !timeDuration || !description || !subSectionId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

//get the data
        const existingSubSection  = await subSection.findById(subSectionId)
        if(!existingSubSection){
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            });
        }
//delete old video and then update to the database
        let videoUrl
        let publicIdforCloudinary   //In Cloudinary, every uploaded file gets a unique public_id.
        if(videofile){
            if(existingSubSection.publicIdforCloudinary){
                //delte the old video
                try
                {
                    await cloudinary.uploader.destroy(existingSubSection.publicIdforCloudinary,
                    {
                        resource_type:"video"
                    }
                )
            }catch(e){
            console.error("Failed to delete old video:", e);
            }
            }
            //add the new video
            const cloudinaryInfo = await uploadToCloudinary(videofile,process.env.FOLDER_NAME)
            videoUrl=cloudinaryInfo.secure_url
            publicIdforCloudinary=cloudinaryInfo.public_id
        }


        const updatedSubSection = await subSection.findByIdAndUpdate(subSectionId,
            {
            title, 
            timeDuration, 
            description,
           ...(videoUrl && {videoUrl:videoUrl}),
            ...(publicIdforCloudinary && {publicIdforCloudinary:publicIdforCloudinary})
        },
        {new:true}
        )
        
        return res.status(200).json({
            success: true,
            message: "subSection updated Successfully",
            data: updatedSubSection
        })
        
    } catch (e) {
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

//delete subsection
exports.deleteSubSection = async (req,res)=>{
    try{
        const {subSectionId , sectionId} = req.body

         let existingSubSection  = await subSection.findById(subSectionId)

         //check existence for existingSubSection
        if(!existingSubSection){
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            });
        }

        let existingSection  = await Section.findById(sectionId)
        //check existence for existingSection
        if(!existingSection){
            return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        }

          //delete the video from cloudinary
        let public_id = existingSubSection.publicIdforCloudinary
        if(public_id){
            try{
                await cloudinary.uploader.destroy(public_id,
                    {
                        resource_type:"video"
                    }
                )
            }catch(e){
                console.log("failed to delete the video",e)
            }
        }
        

        //delete the subsection
        await subSection.findByIdAndDelete(subSectionId)

        //update the section
        const newSection = await Section.findByIdAndUpdate(sectionId,
            {
                $pull:{
                    subSection:subSectionId
                }
            },
            {new:true}
        ).populate({path:"subSection"})

        //return response
        return res.status(200).json({
            success: true,
            message: "subSection deleted Successfully",
            data: newSection
        })

    }catch(e){
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}