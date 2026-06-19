import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";

const UserContext = createContext();

const normalizeUser = (userdata) => {
  if (!userdata) return null;
  const userId = userdata._id || userdata.id;
  return {
    ...userdata,
    _id: userId,
    id: userId,
  };
};

const buildFirebaseProfile = (firebaseuser) => ({
  id: firebaseuser.uid,
  _id: firebaseuser.uid,
  firebaseUid: firebaseuser.uid,
  email: firebaseuser.email,
  name: firebaseuser.displayName || firebaseuser.email?.split("@")[0] || "Google User",
  displayName: firebaseuser.displayName || firebaseuser.email?.split("@")[0] || "Google User",
  image: firebaseuser.photoURL || "https://github.com/shadcn.png",
  authMethod: "google",
});

const syncGoogleUserToBackend = async (firebaseuser) => {
  const payload = {
    firebaseUid: firebaseuser.uid,
    email: firebaseuser.email,
    name: firebaseuser.displayName || firebaseuser.email?.split("@")[0] || "Google User",
    displayName: firebaseuser.displayName || firebaseuser.email?.split("@")[0] || "Google User",
    image: firebaseuser.photoURL || "https://github.com/shadcn.png",
  };

  try {
    const response = await axiosInstance.post("/user/login", payload);
    return response.data.result;
  } catch {
    return buildFirebaseProfile(firebaseuser);
  }
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const hasNonGoogleStoredUser = () => {
    try {
      const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!stored) {
        return false;
      }

      const parsed = JSON.parse(stored);
      return parsed?.authMethod && parsed.authMethod !== "google";
    } catch {
      return false;
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (stored) {
        setUser(normalizeUser(JSON.parse(stored)));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const login = (userdata) => {
    const normalizedUser = normalizeUser(userdata);
    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    sessionStorage.setItem("user", JSON.stringify(normalizedUser));
    if (normalizedUser?.sessionToken) {
      localStorage.setItem("sessionToken", normalizedUser.sessionToken);
      sessionStorage.setItem("sessionToken", normalizedUser.sessionToken);
    }
  };
  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    localStorage.removeItem("sessionToken");
    sessionStorage.removeItem("sessionToken");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };
  const handlegooglesignin = async () => {
    try {
      await signOut(auth).catch(() => {});
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;
      login(buildFirebaseProfile(firebaseuser));
      void syncGoogleUserToBackend(firebaseuser).then((syncedUser) => {
        if (syncedUser) {
          login(syncedUser);
        }
      });
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        if (hasNonGoogleStoredUser()) {
          return;
        }

        try {
          login(buildFirebaseProfile(firebaseuser));
          void syncGoogleUserToBackend(firebaseuser).then((syncedUser) => {
            if (syncedUser) {
              login(syncedUser);
            }
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, handlegooglesignin }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
