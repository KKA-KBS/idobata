import LocalStorageService from "./localStorageService.js";
import S3StorageService from "./s3StorageService.js";

/**
 * 設定に基づいて適切なストレージサービスを作成する
 * @param {string} type - ストレージのタイプ（'local', 's3'など）
 * @param {Object} config - 設定オブジェクト
 * @returns {StorageServiceInterface} ストレージサービスのインスタンス
 */
export function createStorageService(type = "local", config = {}) {
  switch (type) {
    case "local":
      return new LocalStorageService(config.baseUrl || "");
    case "s3":
      return new S3StorageService(config.bucket, config.prefix || "");
    default:
      throw new Error(`Unsupported storage type: ${type}`);
  }
}
