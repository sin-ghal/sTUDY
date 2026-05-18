const { uploadToCloudinary } = require("../utils/uploadToCloudinary")

const Category = require("../models/category")
const User = require("../models/user")
const Course = require("../models/course")

const Section = require("../models/Section")
const { populate } = require("../models/Rating&Reviews")

exports.createCourse = async (req,res) =>{
    //data fetch 
    try{
      const {
        courseName, 
        courseDescription,
        whatYouWillLearn,
        price,
        category
    } = req.body
    console.log("line 20",req.body)

    //fetch thumbnail
    const thumbnail = req.files.thumbnailImage
    console.log("line 23",thumbnail)

    //validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !category ||
      !thumbnail
    ) {
      return res.status(400).json({
        success: false,
        message: "All Fields are Mandatory",
      })
    }

    //get instructors details //already present in req.user.id
    // const userId = req.user.id
    // const instructorDetails = await User.findById(userId)

    // if(!instructorDetails){
    //     return res.status(400).json({
    //     success: false,
    //     message: "Instructor details are necessary",
    //   })
    // }

    const categoryDetails = await Category.findOne({name : category})
    if(!categoryDetails){
        return res.status(400).json({
        success: false,
        message: "Category details not found",
      })
    }

    //upload to cloudinary
    const responseFromCloudinary = await uploadToCloudinary(thumbnail,process.env.FOLDER_NAME)
console.log("line 60", responseFromCloudinary)
    //if image url is not fetched from cloudinary
    if (!responseFromCloudinary?.secure_url) {
  throw new Error("Thumbnail upload failed");
}
    //create entry to db
    const newCourse = await Course.create({
        courseName, 
        courseDescription,
        whatYouWillLearn,
        price,
        category:categoryDetails._id,
        instructor:req.user.id,
        thumbnail:responseFromCloudinary.secure_url
    })

    //add the new course to the user schema of instructor
    await User.findByIdAndUpdate(
      req.user.id,
     {
      $push : {
      courses:newCourse._id
      }
    },
    {new:true}
  )

  //update category schema
  await Category.findByIdAndUpdate(
    categoryDetails._id,
    {
      $push:{
        courses:newCourse._id
      }
    }
  )
  
    
    return res.status(200).json({
    success: true,
    message: "Course created successfully",
    data: newCourse
})
}catch(e) {
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
}

//get All courses

exports.getAllCourses = async (req,res)=>{
  try{
    //fetch all courses
    const allCourses = await Course.find({})
    // .populate("instructor")
    // .populate("category")
    .populate([
      {
        path:"instructor"
      },
      {
        path:"category"
      }
    ])
    //check if courses are not found
    if (!allCourses.length) {
  return res.status(404).json({
    success: false,
    message: "No courses found",
  });
}
  //return response
    return res.status(200).json({
    success: true,
    message: "All courses are returned successfully",
    data: allCourses
    })
}catch(e) {
    return res.status(500).json({
      success: false,
      message: "Failed to get all course",
    });
  }
}

//get course details for a particular course
exports.getParticularCourseDetails = async (req,res)=>{
  try{
    const {courseId} = req.body

    const courseDetails = await Course.findById(
      courseId)
    .populate([
      {
        path:"instructor",select:"firstName lastName",
        populate:{path:"additionalDetails"}
      },
      {
        path:"courseContent",
          populate:{path:"subSection",select:"timeDuration videoUrl"}
      },
      {
        path:"ratingAndReviews",
      },
      {
        path:"studentsEnrolled",
        populate:{path:"additionalDetails"}
      }
    ])
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }
    
    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
      }
    })

  } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}