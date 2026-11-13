import mongoose from "mongoose";
import { tenantPlugin } from "../plugins/tenantPlugin.js";

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["question", "problem", "solution"], // Support for problems and solutions
    },
  },
  { timestamps: true }
);

likeSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

likeSchema.plugin(tenantPlugin);

const Like = mongoose.model("Like", likeSchema);

export default Like;
