import { firestore } from '../firebaseAdmin.js';

const COLLECTION_NAME = 'live_chats';

class LiveChat {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.agent_id = data.agent_id || null;
    this.status = data.status || 'requested';
    this.started_at = data.started_at || new Date();
    this.ended_at = data.ended_at || null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(data) {
    const docRef = firestore.collection(COLLECTION_NAME).doc();
    const newChat = new LiveChat({ ...data, id: docRef.id });
    await docRef.set(newChat.toFirestore());
    return newChat;
  }

  static async find(query = {}) {
    let collectionRef = firestore.collection(COLLECTION_NAME);
    for (const key in query) {
      collectionRef = collectionRef.where(key, '==', query[key]);
    }
    const snapshot = await collectionRef.orderBy('started_at', 'desc').get();
    return snapshot.docs.map(doc => new LiveChat({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return null;
    return new LiveChat({ id: doc.id, ...doc.data() });
  }

  async save() {
    this.updated_at = new Date();
    await firestore.collection(COLLECTION_NAME).doc(this.id).set(this.toFirestore(), { merge: true });
    return this;
  }

  toFirestore() {
    return {
      user_id: this.user_id,
      agent_id: this.agent_id,
      status: this.status,
      started_at: this.started_at,
      ended_at: this.ended_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export default LiveChat;