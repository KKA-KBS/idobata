import mongoose from "mongoose";
import { tenantPlugin } from "../plugins/tenantPlugin.js";

const themeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    slug: {
      // URLなどで使用するための識別子。一意性はテナント内。
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    customPrompt: {
      type: String,
      required: false,
    },
    disableNewComment: {
      type: Boolean,
      default: false,
    },
    clusteringResults: {
      type: Map,
      of: Object,
      default: {},
    },
  },
  { timestamps: true }
);

themeSchema.plugin(tenantPlugin);

themeSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
themeSchema.index({ tenantId: 1, title: 1 }, { unique: true });

const Theme = mongoose.model("Theme", themeSchema);

export default Theme;
