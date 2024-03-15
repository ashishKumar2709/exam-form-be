import mongoose from "mongoose";

const Schema = mongoose.Schema;

const examFormSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
  },
  emailId: {
    type: String,
    unique: true,
    required: [true, "Email Id is required"],
  },
  examName: {
    type: String,
    required: [true, "Exam name is required"],
  },
  examDate: {
    type: Date,
    required: [true, "Exam date is required"],
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
  },
  candidateImage: {
    type: String,
    required: [true, "Candidate image is required"],
  },
  candidateSign: {
    type: String,
    required: [true, "Candidate signature is required"],
  },
  editCount: {
    type: Number,
    default: 0,
  },
});

export const examFormModel = mongoose.model("examFormData", examFormSchema);
