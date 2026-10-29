import mongoose from "mongoose";
import { tenantPlugin } from "../plugins/tenantPlugin.js";

const siteConfigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    aboutMessage: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

siteConfigSchema.plugin(tenantPlugin);

const SiteConfig = mongoose.model("SiteConfig", siteConfigSchema);

export default SiteConfig;
