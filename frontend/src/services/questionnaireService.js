import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export async function saveQuestionnaire(data) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, {
      questionnaireComplete: true,
      questionnaire: data,
    });
  } catch (error) {
    console.warn("Firestore questionnaire skipped:", error?.message || error);
  }

  try {
    await user.getIdToken(true);
  } catch {}
}
