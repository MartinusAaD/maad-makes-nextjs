"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, database } from "@/lib/firestoreConfig";

// Email action configuration for custom domain
const actionCodeSettings = {
  url: "https://maadmakes.no/verify-email?verified=true",
  handleCodeInApp: false,
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sign in
  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  // Sign up
  const signup = async (email, password, userData = {}) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Send verification email
    await sendEmailVerification(user, actionCodeSettings);

    // Get and increment customer counter
    const counterRef = doc(database, "metadata", "customerCounter");
    const counterDoc = await getDoc(counterRef);
    const customerNumber = counterDoc.exists() ? counterDoc.data().value : 1;

    // Increment counter for next customer
    await setDoc(counterRef, { value: customerNumber + 1 }, { merge: true });

    // Create user document in Firestore with customer number
    await setDoc(doc(database, "users", user.uid), {
      email: user.email,
      customerNumber,
      createdAt: new Date(),
      isAdmin: false,
      ...userData,
    });

    return userCredential;
  };

  // Sign out
  const logout = async () => {
    return await signOut(auth);
  };

  // Password reset
  const resetPassword = async (email) => {
    return await sendPasswordResetEmail(auth, email, actionCodeSettings);
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch user data from Firestore to check admin status
        try {
          const userDocRef = doc(database, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.isAdmin || false);

            // Assign customer number if user doesn't have one (for existing users)
            if (!userData.customerNumber) {
              const counterRef = doc(database, "metadata", "customerCounter");
              const counterDoc = await getDoc(counterRef);
              const customerNumber = counterDoc.exists()
                ? counterDoc.data().value
                : 1;

              await updateDoc(counterRef, { value: customerNumber + 1 });
              await updateDoc(userDocRef, { customerNumber });
            }
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    login,
    signup,
    logout,
    resetPassword,
    loading,
    sendEmailVerification: () =>
      sendEmailVerification(currentUser, actionCodeSettings),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
