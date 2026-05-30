const profile = require("../models/profile")
const User = require("../models/user")
const Course = require("../models/course")
const { uploadToCloudinary } = require("../utils/uploadToCloudinary")
const cloudinary = require("cloudinary").v2


exports.updateProfile = async (req, res) => {

    try {
        // const {gender,dateOfBirth,about} = req.body
        const { firstName, lastName, gender, dateOfBirth, about, contactNumber } = req.body
        const userID = req.user.id

        if (!userID) {
            return res.status(400).json({
                success: false,
                message: "User id is required",
            })
        }

        const existingUser = await User.findById(userID)
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            })
        }
        const profileID = existingUser.additionalDetails
        await profile.findByIdAndUpdate(profileID,
            {
                gender: gender,
                dateOfBirth: dateOfBirth,
                about: about,
                contactNumber
            },
            { new: true }
        )
        const updatedUserDetails = await User.findByIdAndUpdate(
            userID,
            {
                firstName,
                lastName,
            },
            { new: true }
        )
            .populate("additionalDetails")
            .exec()

        return res.status(200).json({
            success: true,
            message: "profile updated successfully",
            data: updatedUserDetails
        })

    } catch (e) {
        res.status(500).json({
            success: false,
            message: "error in updating profile"
        })
    }

}


exports.updateDisplayPicture = async (req, res) => {
    try {
        const userId = req.user.id
        const displayPicture = req.files?.displayPicture

        if (!displayPicture) {
            return res.status(400).json({
                success: false,
                message: "Please select an image to upload",
            })
        }

        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        if (existingUser.image) {
            if (displayPicture) {
                if (existingUser.publicIdForImage) {
                    try {
                        await cloudinary.uploader.destroy(existingUser.publicIdForImage,
                            {
                                resource_type: "image"
                            }
                        )
                    } catch (e) {
                        console.error("Failed to delete old image:", e);
                    }
                }
            }
        }
        const cloudinaryInfo = await uploadToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        )

        const updatedUserDetails = await User.findByIdAndUpdate(
            userId,
            {
                image: cloudinaryInfo.secure_url,
                publicIdForImage: cloudinaryInfo.public_id
            },
            { new: true }
        )
            .populate("additionalDetails")
            .exec()

        return res.status(200).json({
            success: true,
            message: "Image updated successfully",
            data: updatedUserDetails,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: error.message || "Could not update display picture",
        })
    }
}

exports.getAllUserDetails = async (req, res) => {
    try {
        const userId = req.user.id

        const userDetails = await User.findById(userId)
            .select("-password")
            .populate("additionalDetails")
            .exec()

        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        return res.status(200).json({
            success: true,
            message: "User details fetched successfully",
            data: userDetails,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: error.message || "Could not fetch user details",
        })
    }
}

exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id

        const userDetails = await User.findById(userId)
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: {
                    path: "courseContent",
                    populate: {
                        path: "subSection",
                    },
                },
            })
            .exec()

        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        return res.status(200).json({
            success: true,
            message: "Enrolled courses fetched successfully",
            data: userDetails.courses || [],
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: error.message || "Could not fetch enrolled courses",
        })
    }
}

exports.instructorDashboard = async (req, res) => {
    try {
        const instructorId = req.user.id

        const courses = await Course.find({ instructor: instructorId })
            .populate("studentsEnrolled")
            .exec()

        const courseData = courses.map((course) => ({
            _id: course._id,
            courseName: course.courseName,
            courseDescription: course.courseDescription,
            thumbnail: course.thumbnail,
            totalStudentsEnrolled: course.studentsEnrolled.length,
            totalAmountGenerated: course.studentsEnrolled.length * course.price,
        }))

        return res.status(200).json({
            success: true,
            message: "Instructor dashboard data fetched successfully",
            courses: courseData,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: error.message || "Could not fetch instructor dashboard data",
        })
    }
}
