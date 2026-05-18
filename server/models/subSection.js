const mongoose = require("mongoose");

const SubSectionSchema = new mongoose.Schema({
	title: { type: String },
	timeDuration: { type: String },
	description: { type: String },
	videoUrl: { type: String },
	publicIdforCloudinary:{ type: String },
	// courseId:{
	// 	type:mongoose.Schema.Types.ObjectId,
	// 	ref:"Course"
	// }
});

module.exports = mongoose.model("SubSection", SubSectionSchema);