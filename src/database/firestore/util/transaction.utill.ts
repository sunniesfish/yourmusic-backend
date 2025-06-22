import { Firestore } from '@google-cloud/firestore';

export class TransactionUtil {
  static async executeWithOptionalTransaction<T>(
    firestore: Firestore,
    transaction: FirebaseFirestore.Transaction | undefined,
    callback: (tx: FirebaseFirestore.Transaction) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return await callback(transaction);
    } else {
      return await firestore.runTransaction(callback);
    }
  }

  static async executeWithBatchOrTransaction<T>(
    firestore: Firestore,
    operations: (
      writer: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction,
    ) => Promise<T>,
    useTransaction: boolean = false,
  ): Promise<T> {
    if (useTransaction) {
      return await firestore.runTransaction(operations);
    } else {
      const batch = firestore.batch();
      const result = await operations(batch);
      await batch.commit();
      return result;
    }
  }
}
