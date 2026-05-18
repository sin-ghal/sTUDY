const Category = require("../models/category")
const Course = require("../models/course")

//create categories
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        const categoryDetails = await Category.create({
            name,
            description
        })
        console.log(categoryDetails)

        return res.status(200).json({
            success: true,
            message: "Categories created Successfully"
        })

    } catch (e) {
        return res.status(500).json({
            message: e.message,
            success: false
        })
    }
}

//get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const allCategories = await Category.find({})

        if (allCategories.length == 0) {
            return res.status(404).json({
                success: false,
                message: "No categories found",
                data: allCategories
            });
        }

        console.log("All categories ->", allCategories)

       return res.status(200).json({
    success: true,
    message: "All categories returned successfully",
    data: allCategories
})
    } catch (e) {
        return res.status(500).json({
            message: e.message,
            success: false
        })
    }
}

//get details for particular category
exports.particularCategoryDetails = async (req, res) => {
    try {
        const { categoryId } = req.body

        const existingCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                select: "courseName"
            })

        if (!existingCategory) {
            return res.status(400).json({
                success: false,
                message: `Could not find category`,
            })
        }

        //get courses with different id also
        const diffCategories = await Category.find({ _id: { $ne: categoryId } })
            .populate({
                path: "courses",
                select: "courseName"

            })

        //get top 10 selling courses
        const topSellingCourses = await Course.aggregate([
            {
                $addFields: {
                    totalStudents: { $size: "$studentsEnrolled" }
                }
            },
            {
                $sort: { totalStudents: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    courseName: 1,
                    price: 1,
                    totalStudents: 1
                }
            }
        ]);
        return res.status(200).json(({
            success: true,
            message: "courses are returned for particular category",
            data: {
                existingCategory: existingCategory,
                diffCategories: diffCategories,
                topSellingCourses   :topSellingCourses   
            }
        }))
    } catch (e) {
        return res.status(500).json({
            message: e.message,
            success: false
        })
    }
}
//done