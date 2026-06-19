import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export async function saveQuestionnaire(data) {
  const user = auth.currentUser;

  if (!user) return;

  const ref = doc(db, "users", user.uid);

  await updateDoc(ref, {
    questionnaireComplete: true,
    questionnaire: data,
  });

  // on force juste la synchro auth (optionnel mais utile)
  await user.getIdToken(true);
}