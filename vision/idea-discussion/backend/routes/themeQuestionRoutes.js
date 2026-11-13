import express from "express";
import {
  getQuestionDetails,
  getQuestionsByTheme,
  getVisualReport,
  triggerDebateAnalysisGeneration,
  triggerDigestGeneration,
  triggerPolicyGeneration,
  triggerReportGeneration,
  triggerVisualReportGeneration,
  updateQuestionVisibility,
} from "../controllers/questionController.js";
import { admin } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", getQuestionsByTheme);

router.patch("/:questionId/visibility", admin, updateQuestionVisibility);

router.get("/:questionId/details", getQuestionDetails);

router.post("/:questionId/generate-policy", triggerPolicyGeneration);

router.post("/:questionId/generate-digest", triggerDigestGeneration);

router.post(
  "/:questionId/generate-visual-report",
  triggerVisualReportGeneration
);
router.post("/:questionId/generate-report", triggerReportGeneration);
router.post(
  "/:questionId/generate-debate-analysis",
  triggerDebateAnalysisGeneration
);

router.get("/:questionId/visual-report", getVisualReport);

export default router;
