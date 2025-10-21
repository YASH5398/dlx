import { firestore } from '../firebaseAdmin.js';

const COLLECTION_NAME = 'agents';

class Agent {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.status = data.status || 'offline';
    this.assignedChats = data.assignedChats || [];
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(data) {
    const docRef = firestore.collection(COLLECTION_NAME).doc();
    const newAgent = new Agent({ ...data, id: docRef.id });
    await docRef.set(newAgent.toFirestore());
    return newAgent;
  }

  static async findByUserId(userId) {
    const snapshot = await firestore.collection(COLLECTION_NAME).where('userId', '==', userId).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return new Agent({ id: doc.id, ...doc.data() });
  }

  static async findById(id) {
    const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return null;
    return new Agent({ id: doc.id, ...doc.data() });
  }

  async save() {
    this.updated_at = new Date();
    await firestore.collection(COLLECTION_NAME).doc(this.id).set(this.toFirestore(), { merge: true });
    return this;
  }

  toFirestore() {
    return {
      userId: this.userId,
      name: this.name,
      status: this.status,
      assignedChats: this.assignedChats,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export default Agent;