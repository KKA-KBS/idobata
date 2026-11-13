import fs from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import StorageServiceInterface from "./storageServiceInterface.js";

/**
 * S3 でのストレージサービス実装
 * ブラウザには S3 の URL を渡さず、API が中継する。Cognito とテナントの確認を通したまま画像を返すため。
 */
export default class S3StorageService extends StorageServiceInterface {
  constructor(bucket, prefix) {
    super();
    this.bucket = bucket;
    this.prefix = prefix.replace(/\/+$/, "");
    this.client = new S3Client({
      region: process.env.AWS_REGION || "ap-northeast-1",
    });
  }

  /**
   * ファイルを保存する
   * @param {Object} file - Multerのファイルオブジェクト
   * @param {string} destination - 保存先のプレフィックス（prefix の下）
   * @returns {Promise<string>} 保存したオブジェクトのキー
   */
  async saveFile(file, destination) {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const key = `${this.prefix}/${destination}/${uuidv4()}${fileExt}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: await fs.readFile(file.path),
          ContentType: file.mimetype,
        })
      );
    } finally {
      await fs.unlink(file.path).catch(() => {});
    }

    return key;
  }

  /**
   * ファイルを削除する
   * @param {string} key - 削除するオブジェクトのキー
   * @returns {Promise<boolean>} 削除成功したかどうか
   */
  async deleteFile(key) {
    if (!this.owns(key)) return false;
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
      );
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * ファイルのURLを取得する
   * @param {string} key - オブジェクトのキー
   * @param {string} userId - 画像の持ち主
   * @returns {string} API 経由で画像を返す URL。v はキャッシュを切り替えるためのファイル名
   */
  getFileUrl(key, userId) {
    if (!key || !this.owns(key)) return null;
    const version = encodeURIComponent(path.posix.basename(key));
    return `/api/users/${encodeURIComponent(userId)}/profile-image?v=${version}`;
  }

  /**
   * ファイルを読み出す
   * @param {string} key - オブジェクトのキー
   * @returns {Promise<{body: ReadableStream, contentType: string} | null>}
   */
  async readFile(key) {
    if (!this.owns(key)) return null;
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      return {
        body: result.Body,
        contentType: result.ContentType || "application/octet-stream",
      };
    } catch (error) {
      if (error?.name === "NoSuchKey") return null;
      throw error;
    }
  }

  // ローカル保存だった頃の絶対パスなど、このバケットのキーでない値は扱わない。
  owns(key) {
    return typeof key === "string" && key.startsWith(`${this.prefix}/`);
  }
}
