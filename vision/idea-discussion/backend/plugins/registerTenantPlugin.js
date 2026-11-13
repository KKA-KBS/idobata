import mongoose from "mongoose";
import { tenantPlugin } from "./tenantPlugin.js";

mongoose.plugin(tenantPlugin);
