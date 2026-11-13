import mongoose from "mongoose";
import { tenantPlugin } from "../plugins/tenantPlugin.js";

const reportExampleSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SharpQuestion",
      required: true,
    },
    introduction: {
      type: String,
      required: true,
    },
    issues: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
    version: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { timestamps: true }
); // createdAt, updatedAt を自動追加

reportExampleSchema.plugin(tenantPlugin);

const ReportExample = mongoose.model("ReportExample", reportExampleSchema);

export default ReportExample;
