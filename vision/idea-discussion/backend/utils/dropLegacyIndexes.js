import mongoose from "mongoose";

// 以前のビルドは、models/*.ts（移行途中の古いスキーマ）を models/*.js の代わりに使っていた。
// そのスキーマは themes の title と slug に、テナントをまたいで一意のインデックスを作る。
// 今のスキーマはテナントごとに一意（tenantId + title、tenantId + slug）なので、古いほうは消す。
const LEGACY_INDEXES = {
  themes: ["title_1", "slug_1"],
};

export async function dropLegacyIndexes() {
  for (const [collectionName, indexNames] of Object.entries(LEGACY_INDEXES)) {
    const collection = mongoose.connection.collection(collectionName);
    let indexes;
    try {
      indexes = await collection.indexes();
    } catch (error) {
      // コレクションがまだ無いときは消すものも無い
      if (error?.codeName === "NamespaceNotFound") continue;
      throw error;
    }
    for (const name of indexNames) {
      if (!indexes.some((index) => index.name === name)) continue;
      await collection.dropIndex(name);
      console.log(`[dropLegacyIndexes] Dropped ${collectionName}.${name}`);
    }
  }
}
