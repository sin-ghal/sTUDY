const mongoose = require("mongoose");


const courseSchema = new mongoose.Schema({
   courseName: { 
    type: String 
},
	courseDescription: { 
        type: String 
    },
	instructor: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "user",
	},
	whatYouWillLearn: {
		type: String,
	},
	courseContent: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Section",
		},
	],
	ratingAndReviews: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "RatingAndReview",
		},
	],
	price: {
		type: Number,
	},
	tag: {
		type: [String],
		required: true,
	},
	instructions: {
		type: [String],
	},
    studentsEnrolled: [
		{
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "user",
		},
	],
	thumbnail: {
		type: String,
	},
	category: {
		type: mongoose.Schema.Types.ObjectId,
		// required: true,
		ref: "category",
	},
	status: {
  type: String,
  enum: ["Draft", "Published"],
  default: "Draft",
},

}, { timestamps: true });

module.exports = mongoose.model("course", courseSchema);
