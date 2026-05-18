const Section = require("../models/Section")
const Course = require("../models/course");
const subSection = require("../models/subSection");

exports.createSection = async (req, res) => {
    try {

        const { sectionName, courseId } = req.body

        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const newSection = await Section.create({sectionName,courseId})
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $push:{
                    courseContent:newSection._id
                }
            },
            {new:true}
        )
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection"
            }
        })


    return res.status(200).json({
            success:true,
            message:"Section created Successfully",
            data:updatedCourse
        })
    }catch(e){
        return res.status(500).json({
            message: "unable to create section",
            success: false
        })
    }
}

exports.updateSection = async (req, res) => {
    try {

        const { sectionName, sectionId } = req.body

        if (!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
       const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            {sectionName:sectionName},
            {new:true}
        )
        .populate("subSection")

    return res.status(200).json({
            success:true,
            message:"Section updated Successfully",
            data:updatedSection
        })
    }catch(e){
        return res.status(500).json({
            message: "unable to update section",
            success: false
        })
    }
}

//delete section
exports.deleteSection = async (req,res)=>{
    try{
        //get id - sending id in params
        const {sectionId,courseId} = req.body

        const existingSection = await Section.findById(sectionId)
        if(!existingSection){
            return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        }

        const existingCourse = await Course.findById(courseId)
        if(!existingCourse){
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        await Section.findByIdAndDelete(sectionId)

        const newCourse = await Course.findByIdAndUpdate(courseId,
            {
                $pull:{
                    courseContent:sectionId
                }
            },
            {new:true}
        )
        .populate({path:"courseContent",
            populate:{path : "subSection"}
        }
        )
        
        return res.status(200).json({
            success:true,
            message:"Section deleted Successfully",
            data:newCourse
        })

    }catch(e){
        return res.status(500).json({
            message: "unable to delete",
            success: false
        })
    }
}
