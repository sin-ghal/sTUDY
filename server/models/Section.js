const mongoose = require("mongoose");
const course = require("./course");

// Define the Section schema
const sectionSchema = new mongoose.Schema({
	sectionName: {
		type: String,
	},
	subSection: [
		{
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "SubSection",
		},
	],
	courseId:{
		type:mongoose.Schema.Types.ObjectId,
		ref:"Course"
	}
});

// Export the Section model
module.exports = mongoose.model("Section", sectionSchema);