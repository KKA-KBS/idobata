import path from "node:path";
import User from "../models/User.js";
import { participantId } from "../utils/participantId.js";
import { createStorageService } from "../services/storage/storageServiceFactory.js";
import { generateRandomDisplayName } from "../utils/displayNameGenerator.js";

// IMAGES_BUCKET があれば S3。User はテナントをまたいで 1 人 1 件なので、テナントの代わりに _users の下に置く。
// テナント ID は英小文字、数字、ハイフンだけなので _users とは重ならない。
const storageService = process.env.IMAGES_BUCKET
  ? createStorageService("s3", {
      bucket: process.env.IMAGES_BUCKET,
      prefix: "idobata/_users/uploads",
    })
  : createStorageService("local", {
      baseUrl: process.env.API_BASE_URL || "http://localhost:3000",
    });

function profileImageUrl(user) {
  if (!user.profileImagePath) return null;
  return storageService.getFileUrl(user.profileImagePath, user.userId);
}

const inMemoryUsers = new Map();

/**
 * Get user from database or in-memory store
 * @param {string} userId - User ID
 * @returns {Object} User object
 */
export const getUser = async (userId) => {
  try {
    let user = await User.findOne({ userId });
    if (user) return user;

    const defaultDisplayName = generateRandomDisplayName();
    user = new User({
      userId,
      displayName: defaultDisplayName,
      profileImagePath: null,
    });
    await user.save();
    return user;
  } catch (error) {
    console.warn("MongoDB not available, using in-memory store");
  }

  if (!inMemoryUsers.has(userId)) {
    const defaultDisplayName = generateRandomDisplayName();
    inMemoryUsers.set(userId, {
      userId,
      displayName: defaultDisplayName,
      profileImagePath: null,
    });
  }

  return inMemoryUsers.get(userId);
};

/**
 * Save user to database or in-memory store
 * @param {Object} user - User object
 */
const saveUser = async (user) => {
  try {
    if (user.save) {
      await user.save();
      return;
    }
  } catch (error) {
    console.warn("MongoDB not available, using in-memory store");
  }

  inMemoryUsers.set(user.userId, user);
};

/**
 * Get user information by userId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserInfo = async (req, res) => {
  try {
    const userId = participantId(req, req.params.userId);
    const user = await getUser(userId);

    return res.status(200).json({
      displayName: user.displayName,
      profileImagePath: profileImageUrl(user),
    });
  } catch (error) {
    console.error("Error getting user info:", error);
    return res.status(500).json({
      error: "Failed to get user information",
    });
  }
};

/**
 * Update user display name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateUserDisplayName = async (req, res) => {
  try {
    const userId = participantId(req, req.params.userId);
    const { displayName } = req.body;

    if (!displayName) {
      return res.status(400).json({
        error: "Display name is required",
      });
    }

    const user = await getUser(userId);
    user.displayName = displayName;
    await saveUser(user);

    return res.status(200).json({
      success: true,
      message: "Display name updated successfully",
    });
  } catch (error) {
    console.error("Error updating display name:", error);
    return res.status(500).json({
      error: "Failed to update display name",
    });
  }
};

/**
 * Upload profile image
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadProfileImage = async (req, res) => {
  try {
    const userId = participantId(req, req.params.userId);
    const file = req.file;
    console.log("Upload request:", {
      params: req.params,
      file: req.file,
      body: req.body,
    });

    if (!file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const user = await getUser(userId);
    const previousPath = user.profileImagePath;

    const uploadDir = process.env.IMAGES_BUCKET
      ? "profile-images"
      : path.join(process.cwd(), "uploads/profile-images");
    const filePath = await storageService.saveFile(file, uploadDir);

    user.profileImagePath = filePath;
    await saveUser(user);

    // 新しい画像を保存してから古い画像を消す。途中で失敗しても画像が無い状態にしない。
    if (previousPath) {
      await storageService.deleteFile(previousPath);
    }

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      profileImageUrl: profileImageUrl(user),
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return res.status(500).json({
      error: "Failed to upload profile image",
    });
  }
};

/**
 * Get profile image
 * S3 に置いた画像を API が中継して返す。ローカル保存のときは /uploads から配信するのでここは使わない。
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfileImage = async (req, res) => {
  try {
    if (typeof storageService.readFile !== "function") {
      return res.status(404).json({ error: "Profile image not found" });
    }

    const userId = participantId(req, req.params.userId);
    const user = await User.findOne({ userId });
    const image = user?.profileImagePath
      ? await storageService.readFile(user.profileImagePath)
      : null;
    if (!image) {
      return res.status(404).json({ error: "Profile image not found" });
    }

    res.setHeader("Content-Type", image.contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    // URL の v は画像を替えるたびに変わるので、同じ URL は長くキャッシュしてよい。
    res.setHeader("Cache-Control", "private, max-age=86400");
    image.body.on("error", (error) => {
      console.error("Error streaming profile image:", error);
      res.destroy(error);
    });
    image.body.pipe(res);
  } catch (error) {
    console.error("Error getting profile image:", error);
    return res.status(500).json({
      error: "Failed to get profile image",
    });
  }
};
