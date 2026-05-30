// Import the required modules
const express = require("express")
const router = express.Router()

// Import the Controllers

// Course Controllers Import
const {
  createCourse,
  getAllCourses,
  getParticularCourseDetails,
  // getFullCourseDetails,
  editCourse,
  getInstructorCourses,
  deleteCourse,
} = require("../controllers/createCourse")


// Categories Controllers Import
const {
  getAllCategories,
  createCategory,
  particularCategoryDetails,
} = require("../controllers/Category")

// Sections Controllers Import
const {
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/createSection")

// Sub-Sections Controllers Import
const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
} = require("../controllers/createSubSection")

// Rating Controllers Import
const {
  createRatingAndReview,
  avgRating,
  getAllRating,
} = require("../controllers/RatingAndReview")

// const {
//   updateCourseProgress
// } = require("../controllers/courseProgress");

// Importing Middlewares
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth")

// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

// Courses can Only be Created by Instructors
router.post("/createCourse", auth, isInstructor, createCourse)

// Get all Registered Courses
router.get("/getAllCourses", getAllCourses)

// Get Details for a Specific Courses
router.post("/getParticularCourseDetails", getParticularCourseDetails)
router.post("/getCourseDetails", getParticularCourseDetails)

//Add a Section to a Course
router.post("/createSection", auth, isInstructor, createSection)

// Update a Section
router.post("/updateSection", auth, isInstructor, updateSection)

// Delete a Section
router.delete("/deleteSection", auth, isInstructor, deleteSection)

// Add a Sub Section to a Section
router.post("/createSubSection", auth, isInstructor, createSubSection)

// Edit Sub Section
router.post("/updateSubSection", auth, isInstructor, updateSubSection)

// Delete Sub Section
router.delete("/deleteSubSection", auth, isInstructor, deleteSubSection)




// Get Details for a Specific Course in the instructor edit flow
router.post("/getFullCourseDetails", auth, getParticularCourseDetails)

// Edit Course routes
router.post("/editCourse", auth, isInstructor, editCourse)
router.post("/updateCourseStatus", auth, isInstructor, editCourse)

// Get all Courses Under a Specific Instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)

// Delete a Course
router.delete("/deleteCourse", auth, isInstructor, deleteCourse)

// router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin
// TODO: Put IsAdmin Middleware here
router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/getAllCategories", getAllCategories)
router.get("/showAllCategories", getAllCategories)
router.post("/getCategoryPageDetails", particularCategoryDetails)

// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
router.post("/createRating", auth, isStudent, createRatingAndReview)
router.get("/getAverageRating", avgRating)
router.get("/getReviews", getAllRating)

module.exports = router
