import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

// Application collection reference
export const applicationsCollection = collection(db, "applications");
export const documentsCollection = collection(db, "documents");

// User applications collection
export const getUserApplicationsRef = (userId: string) =>
  collection(db, "users", userId, "applications");

// Save application data
export async function saveApplication(userId: string, applicationData: any) {
  try {
    const applicationId = `APP-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const applicationRef = doc(getUserApplicationsRef(userId), applicationId);

    const application = {
      id: applicationId,
      userId,
      ...applicationData,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(applicationRef, application);
    return { success: true, applicationId };
  } catch (error) {
    console.error("Error saving application:", error);
    return { success: false, error };
  }
}

// Save draft application
export async function saveDraft(userId: string, applicationData: any) {
  try {
    const applicationId =
      applicationData.id ||
      `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const applicationRef = doc(getUserApplicationsRef(userId), applicationId);

    const application = {
      id: applicationId,
      userId,
      ...applicationData,
      status: "draft",
      updatedAt: new Date().toISOString(),
    };

    await setDoc(applicationRef, application, { merge: true });
    return { success: true, applicationId };
  } catch (error) {
    console.error("Error saving draft:", error);
    return { success: false, error };
  }
}

// Get user applications
export async function getUserApplications(userId: string) {
  try {
    const q = query(getUserApplicationsRef(userId));
    const querySnapshot = await getDocs(q);

    const applications: any[] = [];
    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, applications };
  } catch (error) {
    console.error("Error getting applications:", error);
    return { success: false, error, applications: [] };
  }
}

// Get single application
export async function getApplication(userId: string, applicationId: string) {
  try {
    const applicationRef = doc(getUserApplicationsRef(userId), applicationId);
    const docSnap = await getDoc(applicationRef);

    if (docSnap.exists()) {
      return {
        success: true,
        application: { id: docSnap.id, ...docSnap.data() },
      };
    } else {
      return { success: false, error: "Application not found" };
    }
  } catch (error) {
    console.error("Error getting application:", error);
    return { success: false, error };
  }
}
