import { collection, deleteDoc, doc, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

// Deletes expired messages older than now. Intended to be called on app start and periodically.
export async function deleteExpiredMessages(): Promise<void> {
  const nowTs = Timestamp.fromDate(new Date());
  try {
    // Query for messages whose expire_at <= now
    const q = query(collection(db, 'messages'), where('expire_at', '<=', nowTs));
    const snap = await getDocs(q);
    const deletions: Promise<void>[] = [];
    snap.forEach((d) => {
      deletions.push(deleteDoc(doc(db, 'messages', d.id)) as unknown as Promise<void>);
    });
    await Promise.allSettled(deletions);
  } catch (err) {
    console.error('Error deleting expired messages:', err);
  }
}


