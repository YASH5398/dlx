import { firestore } from '../firebaseAdmin.js';

const COLLECTION_NAME = 'messages';

class Message {
  constructor(data) {
    this.id = data.id;
    this.chat_id = data.chat_id;
    this.sender_type = data.sender_type;
    this.content = data.content;
    this.timestamp = data.timestamp || new Date();
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(data) {
    const docRef = firestore.collection(COLLECTION_NAME).doc();
    const newMessage = new Message({ ...data, id: docRef.id });
    await docRef.set(newMessage.toFirestore());
    return newMessage;
  }

  static async find(query = {}) {
    let collectionRef = firestore.collection(COLLECTION_NAME);
    for (const key in query) {
      collectionRef = collectionRef.where(key, '==', query[key]);
    }
    const snapshot = await collectionRef.orderBy('timestamp', 'asc').get();
    return snapshot.docs.map(doc => new Message({ id: doc.id, ...doc.data() }));
  }

  toFirestore() {
    return {
      chat_id: this.chat_id,
      sender_type: this.sender_type,
      content: this.content,
      timestamp: this.timestamp,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export default Message;