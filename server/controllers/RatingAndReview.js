const RatingAndReview = require("../models/Rating&Reviews")
const User = require("../models/user")
const Course = require("../models/course")
const { default: mongoose } = require("mongoose")
const course = require("../models/course")

exports.createRatingAndReview = async (req, res) => {
    try {
        const { courseId, rating, review } = req.body
        const userId = req.user.id

        //valid course or not
        const existingCourse = await Course.findById(courseId)
        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: "course not found",
            });
        }
        //valid user or not
        const existingUser = await User.findById(userId)
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "user not found",
            });
        }

        //check if user paid for the course or not
        const checkAlreadyEnrolled = await Course.findOne({ _id: courseId, studentsEnrolled: userId })
        if (!checkAlreadyEnrolled) {
            return res.status(400).json({
                success: false,
                message: "first purchase the course"
            })
        }

        //check if user already rated
        const existingRating = await RatingAndReview.findOne({ user: userId, course: courseId })
        if (existingRating) {
            return res.status(400).json({
                success: false,
                message: "user already rated"
            })
        }

        //create review
        const newRating = await RatingAndReview.create({
            user: userId,
            course: courseId,
            rating,
            review
        })

        //update rating and reviews in course       
        const updatedCourse = await Course.findByIdAndUpdate(courseId,
            {
                $push: {
                    ratingAndReviews: newRating._id
                }
            },
            { new: true }
        )
        return res.status(200).json({
            success: true,
            message: "User rated successfully",
            data: updatedCourse
        })

    } catch (e) {
        return res.status(500).json({
            message: e.message,
            success: false
        })
    }
}

//get average rating

exports.avgRating = async (req, res) => {
    try {
        const { courseId } = req.body

        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId)
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" }
                }
            }
        ])

        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Average rating calculated",
                averageRating: result[0].averageRating
            })
        }
        else {
            return res.status(200).json({
                success: true,
                message: 'Average Rating is 0, no ratings given till now',
                averageRating: 0,
            })
        }

    } catch (e) {
        return res.status(500).json({
            message: e.message,
            success: false
        })
    }
}

//getAllRatingAndReviews
exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: -1 })
            .populate(
                {
                    path: "user",
                    select: "firstName lastName email image"
                })
                .populate(
                {
                    path: "course",
                    select: "courseName"
                })
            
        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            data: allReviews,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}