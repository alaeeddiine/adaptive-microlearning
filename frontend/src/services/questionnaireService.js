import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export async function saveQuestionnaire(data) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const ref = doc(db, "users", user.uid);
    // setDoc + merge : crée le document s'il n'existe pas encore
    // (updateDoc échouait silencieusement dans ce cas, réponses perdues).
    await setDoc(
      ref,
      {
        questionnaireComplete: true,
        questionnaire: data,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Firestore questionnaire skipped:", error?.message || error);
  }

  try {
    await user.getIdToken(true);
  } catch {}
}
