const Category = require("../models/category")
const Course = require("../models/course")

const DEFAULT_CATEGORIES = [
    {
        name: "Data Science",
        description: "Learn data analysis, statistics, machine learning, and practical data workflows.",
    },
]

const ensureDefaultCategories = async () => {
    for (const category of DEFAULT_CATEGORIES) {
        const existingCategory = await Category.findOne({
            name: { $regex: `^${category.name}$`, $options: "i" },
        })

        if (!existingCategory) {
            await Category.create(category)
        }
    }
}

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

        const existingCategory = await Category.findOne({
            name: { $regex: `^${name}$`, $options: "i" },
        })

        if (existingCategory) {
            return res.status(200).json({
                success: true,
                message: "Category already exists",
                data: existingCategory,
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
        await ensureDefaultCategories()

        const allCategories = await Category.find({})

        if (allCategories.length == 0) {
            return res.status(200).json({
                success: true,
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
                match: { status: "Published" },
                populate: [
                    { path: "instructor" },
                    { path: "ratingAndReviews" },
                ],
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
                match: { status: "Published" },
                populate: [
                    { path: "instructor" },
                    { path: "ratingAndReviews" },
                ],

            })

        //get top 10 selling courses
        const topSellingCourses = await Course.find({ status: "Published" })
            .populate("instructor")
            .populate("ratingAndReviews")
            .sort({ studentsEnrolled: -1 })
            .limit(10)

        return res.status(200).json(({
            success: true,
            message: "courses are returned for particular category",
            data: {
                selectedCategory: existingCategory,
                differentCategory:
                    diffCategories?.find((category) => category.courses?.length) ||
                    diffCategories?.[0] ||
                    null,
                mostSellingCourses: topSellingCourses,
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
