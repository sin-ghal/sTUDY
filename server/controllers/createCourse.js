const { uploadToCloudinary } = require("../utils/uploadToCloudinary")

const Category = require("../models/category")
const User = require("../models/user")
const Course = require("../models/course")

const Section = require("../models/Section")
const SubSection = require("../models/subSection")
const RatingAndReview = require("../models/Rating&Reviews")
const CourseProgress = require("../models/courseProgress")
const cloudinary = require("cloudinary").v2

exports.createCourse = async (req,res) =>{
    //data fetch 
    try{
    //   const {
    //     courseName, 
    //     courseDescription,
    //     whatYouWillLearn,
    //     price,
    //     category,
    //     tag,
    //     instructions
    // } = req.body
    const {
  courseName,
  courseDescription,
  whatYouWillLearn,
  price,
  category,
  tag,
  instructions,
  status,
} = req.body
    console.log("line 20",req.body)

    //fetch thumbnail
    const thumbnail = req.files?.thumbnailImage
    console.log("line 23",thumbnail)

    //validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !category ||
      !tag ||
      !instructions ||
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

    const parsedTags = typeof tag === "string" ? JSON.parse(tag) : tag
    const parsedInstructions =
      typeof instructions === "string" ? JSON.parse(instructions) : instructions

    const categoryDetails = await Category.findById(category).catch(() => null)
      || await Category.findOne({ name: category })
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
  tag: parsedTags,
  instructions: parsedInstructions,
  category: categoryDetails._id,
  instructor: req.user.id,
  thumbnail: responseFromCloudinary.secure_url,
  status: status || "Draft",
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
    console.error(e)
    return res.status(500).json({
      success: false,
      message: e.message || "Failed to create course",
    });
  }
}

//get All courses

exports.getAllCourses = async (req,res)=>{
  try{
    //fetch all courses
    const allCourses = await Course.find({ status: "Published" })
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
      return res.status(200).json({
        success: true,
        message: "No courses found",
        data: [],
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
        path:"instructor",select:"firstName lastName image",
        populate:{path:"additionalDetails"}
      },
      // {
      //   path:"courseContent",
      //     populate:{path:"subSection",select:"timeDuration videoUrl"}
      // },
      {
  path: "courseContent",
  populate: {
    path: "subSection",
    select: "title description timeDuration videoUrl",
  },
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

exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id

    const instructorCourses = await Course.find({ instructor: instructorId })
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      message: "Instructor courses fetched successfully",
      data: instructorCourses,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: error.message || "Could not fetch instructor courses",
    })
  }
}

exports.editCourse = async (req, res) => {
  try {
    const {
      courseId,
      courseName,
      courseDescription,
      price,
      tag,
      whatYouWillLearn,
      category,
      instructions,
      status,
    } = req.body

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      })
    }

    if (status && !["Draft", "Published"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course status",
      })
    }

    const existingCourse = await Course.findById(courseId)
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    if (
      existingCourse.instructor?.toString() !== req.user.id &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own course",
      })
    }

    const updateData = {}

    if (courseName) updateData.courseName = courseName
    if (courseDescription) updateData.courseDescription = courseDescription
    if (price) updateData.price = price
    if (whatYouWillLearn) updateData.whatYouWillLearn = whatYouWillLearn
    if (tag) updateData.tag = typeof tag === "string" ? JSON.parse(tag) : tag
    if (instructions) {
      updateData.instructions =
        typeof instructions === "string" ? JSON.parse(instructions) : instructions
    }
    if (category) {
      const categoryDetails =
        (await Category.findById(category).catch(() => null)) ||
        (await Category.findOne({ name: category }))

      if (!categoryDetails) {
        return res.status(400).json({
          success: false,
          message: "Category details not found",
        })
      }

      updateData.category = categoryDetails._id
    }
    if (req.files?.thumbnailImage) {
      const responseFromCloudinary = await uploadToCloudinary(
        req.files.thumbnailImage,
        process.env.FOLDER_NAME
      )

      if (!responseFromCloudinary?.secure_url) {
        throw new Error("Thumbnail upload failed")
      }

      updateData.thumbnail = responseFromCloudinary.secure_url
    }
    if (status) {
      updateData.status = status
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: error.message || "Could not update course",
    })
  }
}

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      })
    }

    const courseDetails = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    if (
      courseDetails.instructor?.toString() !== req.user.id &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own course",
      })
    }

    const sectionIds = courseDetails.courseContent.map((section) => section._id)
    const subSections = courseDetails.courseContent.flatMap(
      (section) => section.subSection || []
    )
    const subSectionIds = subSections.map((subSection) => subSection._id)
    const videoPublicIds = subSections
      .map((subSection) => subSection.publicIdforCloudinary)
      .filter(Boolean)

    await Promise.allSettled(
      videoPublicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, { resource_type: "video" })
      )
    )

    await SubSection.deleteMany({ _id: { $in: subSectionIds } })
    await Section.deleteMany({ _id: { $in: sectionIds } })
    await RatingAndReview.deleteMany({ course: courseId })
    await CourseProgress.deleteMany({ courseID: courseId })

    await User.updateMany(
      { courses: courseId },
      { $pull: { courses: courseId } }
    )
    await Category.updateMany(
      { courses: courseId },
      { $pull: { courses: courseId } }
    )

    await Course.findByIdAndDelete(courseId)

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: error.message || "Could not delete course",
    })
  }
}
