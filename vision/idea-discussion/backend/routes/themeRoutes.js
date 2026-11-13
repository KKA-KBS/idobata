import express from "express";
import {
  createTheme,
  deleteTheme,
  getAllThemes,
  getThemeById,
  getThemeDetail,
  updateTheme,
} from "../controllers/themeController.js";
import { admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllThemes);

router.get("/:themeId", getThemeById);

router.get("/:themeId/detail", getThemeDetail);

router.post("/", admin, createTheme);

router.put("/:themeId", admin, updateTheme);

router.delete("/:themeId", admin, deleteTheme);

export default router;
