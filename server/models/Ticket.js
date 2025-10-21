import { firestore } from '../firebaseAdmin.js';

const COLLECTION_NAME = 'tickets';

class Ticket {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.subject = data.subject;
    this.description = data.description;
    this.category = data.category;
    this.priority = data.priority;
    this.status = data.status || 'Pending';
    this.file_path = data.file_path || null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.assign_to = data.assign_to || null;
  }

  static async create(data) {
    const docRef = firestore.collection(COLLECTION_NAME).doc();
    const newTicket = new Ticket({ ...data, id: docRef.id });
    await docRef.set(newTicket.toFirestore());
    return newTicket;
  }

  static async find(query = {}) {
    let collectionRef = firestore.collection(COLLECTION_NAME);
    for (const key in query) {
      collectionRef = collectionRef.where(key, '==', query[key]);
    }
    const snapshot = await collectionRef.orderBy('created_at', 'desc').get();
    return snapshot.docs.map(doc => new Ticket({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return null;
    return new Ticket({ id: doc.id, ...doc.data() });
  }

  static async count() {
    const snapshot = await firestore.collection(COLLECTION_NAME).get();
    return snapshot.size;
  }

  async save() {
    this.updated_at = new Date();
    await firestore.collection(COLLECTION_NAME).doc(this.id).set(this.toFirestore(), { merge: true });
    return this;
  }

  toFirestore() {
    return {
      user_id: this.user_id,
      subject: this.subject,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: this.status,
      file_path: this.file_path,
      created_at: this.created_at,
      updated_at: this.updated_at,
      assign_to: this.assign_to,
    };
  }
}

export default Ticket;