import mongoose from "mongoose";
import { tenantPlugin } from "../plugins/tenantPlugin.js";

const sharpQuestionSchema = new mongoose.Schema(
  {
    questionText: {
      // "How might we..." 形式の重要論点
      type: String,
      required: true,
    },
    tagLine: {
      type: String,
      required: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    sourceProblemIds: [
      {
        // (任意) この重要論点の生成に使用された `problems` のIDリスト
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],
    themeId: {
      // 追加：所属するテーマのID
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theme",
      required: true,
    },
    isVisible: {
      // 公開画面に表示するか。管理画面で切り替える。
      // 既存データにはこの項目が無いため、検索時は { $ne: false } で「表示」とみなす
      type: Boolean,
      default: true,
    },
    clusteringResults: {
      type: Map,
      of: Object,
      default: {},
    },
  },
  { timestamps: true }
); // createdAt, updatedAt を自動追加 (todo.md指示)

sharpQuestionSchema.plugin(tenantPlugin);

const SharpQuestion = mongoose.model("SharpQuestion", sharpQuestionSchema);

/** 公開画面に出す重要論点の検索条件（isVisible 未設定の既存データは表示扱い） */
export const VISIBLE_QUESTION_FILTER = { isVisible: { $ne: false } };

export default SharpQuestion;
