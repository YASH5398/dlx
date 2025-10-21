import { firestore } from '../firebaseAdmin.js';

const COLLECTION_NAME = 'admin_users';

class AdminUser {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name || '';
    this.password_hash = data.password_hash;
    this.role = data.role || 'admin';
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.last_login_at = data.last_login_at;
    this.promoted_from_user_id = data.promoted_from_user_id;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(data) {
    const docRef = firestore.collection(COLLECTION_NAME).doc();
    const newUser = new AdminUser({ ...data, id: docRef.id });
    await docRef.set(newUser.toFirestore());
    return newUser;
  }

  static async findByEmail(email) {
    const snapshot = await firestore.collection(COLLECTION_NAME).where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return new AdminUser({ id: doc.id, ...doc.data() });
  }

  static async findById(id) {
    const doc = await firestore.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return null;
    return new AdminUser({ id: doc.id, ...doc.data() });
  }

  static async count() {
    const snapshot = await firestore.collection(COLLECTION_NAME).get();
    return snapshot.size;
  }

  static async findAll() {
    const snapshot = await firestore.collection(COLLECTION_NAME).get();
    return snapshot.docs.map(doc => new AdminUser({ id: doc.id, ...doc.data() }));
  }

  async save() {
    this.updated_at = new Date();
    await firestore.collection(COLLECTION_NAME).doc(this.id).set(this.toFirestore(), { merge: true });
    return this;
  }

  toFirestore() {
    return {
      email: this.email,
      name: this.name,
      password_hash: this.password_hash,
      role: this.role,
      is_active: this.is_active,
      last_login_at: this.last_login_at,
      promoted_from_user_id: this.promoted_from_user_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export default AdminUser;