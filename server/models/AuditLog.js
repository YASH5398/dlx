import { firestore } from '../firebaseAdmin.js';

const COLLECTION_NAME = 'audit_logs';

class AuditLog {
  constructor(data) {
    this.id = data.id;
    this.actor_id = data.actor_id;
    this.action = data.action;
    this.target_type = data.target_type;
    this.target_id = data.target_id;
    this.meta = data.meta;
    this.created_at = data.created_at || new Date();
  }

  static async create(data) {
    const docRef = firestore.collection(COLLECTION_NAME).doc();
    const newLog = new AuditLog({ ...data, id: docRef.id });
    await docRef.set(newLog.toFirestore());
    return newLog;
  }

  static async find(query = {}, options = {}) {
    let collectionRef = firestore.collection(COLLECTION_NAME);
    for (const key in query) {
      collectionRef = collectionRef.where(key, '==', query[key]);
    }
    if (options.sort) {
      for (const field in options.sort) {
        collectionRef = collectionRef.orderBy(field, options.sort[field] === 1 ? 'asc' : 'desc');
      }
    }
    if (options.limit) {
      collectionRef = collectionRef.limit(options.limit);
    }
    const snapshot = await collectionRef.get();
    return snapshot.docs.map(doc => new AuditLog({ id: doc.id, ...doc.data() }));
  }

  toFirestore() {
    return {
      actor_id: this.actor_id,
      action: this.action,
      target_type: this.target_type,
      target_id: this.target_id,
      meta: this.meta,
      created_at: this.created_at,
    };
  }
}

export default AuditLog;