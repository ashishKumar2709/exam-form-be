import { examFormModel } from "../schemas/formschema.js";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const saveFormData = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      emailId,
      examName,
      examDate,
      subject,
      candidateImage,
      candidateSign,
    } = req.body;

    const existingCandidate = await examFormModel.findOne({
      emailId: emailId?.toLowerCase(),
    });

    if (existingCandidate) {
      res.json({
        status: 0,
        message: "Email Id already registered.",
      });

      return;
    }

    // Convert base64-encoded images to files and save to folder
    const candidateImageName = `${nanoid()}_img.png`;
    const candidateSignName = `${nanoid()}_sign.png`;

    const uploadDir = path.join(__dirname, "../../public/images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const saveImage = (base64Data, imageName) => {
      const base64DataWithoutPrefix = base64Data.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      fs.writeFileSync(
        path.join(uploadDir, imageName),
        base64DataWithoutPrefix,
        "base64"
      );
    };

    saveImage(candidateImage, candidateImageName);
    saveImage(candidateSign, candidateSignName);

    // Create a new exam form object with binary image data
    const examForm = new examFormModel({
      firstName: firstName,
      lastName: lastName,
      emailId: emailId,
      examName: examName,
      examDate: examDate,
      subject: subject,
      candidateImage: `/images/${candidateImageName}`,
      candidateSign: `/images/${candidateSignName}`,
      editCount: 0,
    });

    // Save the exam form data to MongoDB
    const savedForm = await examForm.save();

    res.json({
      status: 1,
      message: "Exam details saved successfully",
      data: savedForm,
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

export const editExamData = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      emailId,
      examName,
      examDate,
      subject,
      candidateImage,
      candidateSign,
      userId,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !emailId ||
      !examName ||
      !examDate ||
      !subject ||
      !candidateImage ||
      !candidateSign ||
      !userId
    ) {
      res.json({ status: 0, message: "Please enter all details." });
      return;
    }

    const currentUserId = mongoose.Types.ObjectId.createFromHexString(userId);
    const userOtherThanCurrent = await examFormModel.findOne({
      _id: { $ne: currentUserId },
      emailId: emailId.toLowerCase(),
    });

    if (userOtherThanCurrent) {
      res.json({ status: 0, message: "User already exists." });
      return;
    }

    const existingUserExamData = await examFormModel.findOne({
      _id: currentUserId,
    });

    if (existingUserExamData.editCount >= 2) {
      res.json({
        status: 0,
        message: "User has reached the maximum edit limit.",
      });
      return;
    }

    existingUserExamData.firstName = firstName;
    existingUserExamData.lastName = lastName;
    existingUserExamData.emailId = emailId;
    existingUserExamData.examName = examName;
    existingUserExamData.examDate = examDate;
    existingUserExamData.subject = subject;
    existingUserExamData.editCount += 1;

    let updatedData;

    if (
      existingUserExamData.candidateImage !== req.body.candidateImage ||
      existingUserExamData.candidateSign !== req.body.candidateSign
    ) {
      const candidateImageName = `${nanoid()}_img.png`;
      const candidateSignName = `${nanoid()}_sign.png`;

      const uploadDir = path.join(__dirname, "../../public/images");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const saveImage = (base64Data, imageName) => {
        const base64DataWithoutPrefix = base64Data.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        fs.writeFileSync(
          path.join(uploadDir, imageName),
          base64DataWithoutPrefix,
          "base64"
        );
      };

      saveImage(candidateImage, candidateImageName);
      saveImage(candidateSign, candidateSignName);

      existingUserExamData.candidateImage = `/images/${candidateImageName}`;
      existingUserExamData.candidateSign = `/images/${candidateSignName}`;
    } else {
      existingUserExamData.candidateImage = candidateImage;
      existingUserExamData.candidateSign = candidateSign;
    }
    updatedData = await existingUserExamData.save();
    res.json({
      status: 1,
      message: "Data updated successfully.",
      data: updatedData,
    });
  } catch (error) {
    console.error(error);
    res.json({ status: 0, message: error.message });
  }
};

export const getAllExamFormData = async (req, res) => {
  try {
    const allExamData = await examFormModel.find();
    // if (allExamData.length === 0) {
    //   res.json({
    //       status: 0,
    //       message: "No data found.",
    //     }
    //   );

    //   return;
    // }

    res.json({
      message: "All data fetched successfully",
      data: allExamData,
    });
  } catch (error) {
    res.json({
      message: error.message,
      status: 0,
    });
  }
};

export const deleteUserExamData = async (req, res) => {
  try {
    const userId = await req.query.userId;
    const currentUserId = mongoose.Types.ObjectId.createFromHexString(userId);
    // Find the user data by ID
    const user = await examFormModel.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ status: 0, message: "User not found." });
    }

    // Remove associated image files from the file system
    const deleteImageFile = (imageName) => {
      const imagePath = path.join(__dirname, "../../public/images", imageName);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    };

    deleteImageFile(user.candidateImage);
    deleteImageFile(user.candidateSign);

    // Delete the user data from the database
    await examFormModel.findByIdAndDelete(currentUserId);

    return res
      .status(200)
      .json({
        status: 1,
        message: "User data and associated images deleted successfully.",
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: 0, message: "Internal server error." });
  }
};
