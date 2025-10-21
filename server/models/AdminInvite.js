import { firestore } from '../firebaseAdmin.js';

const COLLECTION_NAME = 'admin_invites';

class AdminInvite {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.token = data.token;
    this.expires_at = data.expires_at;
    this.created_by = data.created_by;
    this.used = data.used || false;
    this.used_at = data.used_at;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(data) {
    const docRef = firestore.collection(COLLECTION_NAME).doc();
    const newInvite = new AdminInvite({ ...data, id: docRef.id });
    await docRef.set(newInvite.toFirestore());
    return newInvite;
  }

  static async findByToken(token) {
    const snapshot = await firestore.collection(COLLECTION_NAME).where('token', '==', token).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return new AdminInvite({ id: doc.id, ...doc.data() });
  }

  static async findById(id) {
    const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return null;
    return new AdminInvite({ id: doc.id, ...doc.data() });
  }

  async save() {
    this.updated_at = new Date();
    await firestore.collection(COLLECTION_NAME).doc(this.id).set(this.toFirestore(), { merge: true });
    return this;
  }

  toFirestore() {
    return {
      email: this.email,
      token: this.token,
      expires_at: this.expires_at,
      created_by: this.created_by,
      used: this.used,
      used_at: this.used_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export default AdminInvite;