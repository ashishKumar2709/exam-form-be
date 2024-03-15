import express from "express";
import {
  saveFormData,
  getAllExamFormData,
  editExamData,
  deleteUserExamData,
} from "../controller/formController.js";

const router = express.Router();
router.post("/save-form-data", saveFormData);
router.get("/get-all-form-data", getAllExamFormData);
router.put("/edit-form-data", editExamData);
router.delete("/delete-form-data", deleteUserExamData);

export default router;
