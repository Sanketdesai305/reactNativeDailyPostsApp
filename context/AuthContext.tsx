import { supabase } from "@/lib/supabase/client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  profileImage?: string;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: (reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const checkSession = async () => {
    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();


      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const profile = await fetchUserProfile(user.id);
      setUser(profile);
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };


  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        const authUser = await supabase.auth.getUser();
        if (authUser.data.user) {
          return {
            id: authUser.data.user.id,
            name: authUser.data.user.email?.split("@")[0] ?? "User",
            username: authUser.data.user.email?.split("@")[0] ?? "user",
            email: authUser.data.user.email ?? "",
            profileImage: "",
            onboardingCompleted: false,
          };
        }
        return null;
      }

      if (!data) {
        const authUser = await supabase.auth.getUser();
        if (authUser.data.user) {
          return {
            id: authUser.data.user.id,
            name: authUser.data.user.email?.split("@")[0] ?? "User",
            username: authUser.data.user.email?.split("@")[0] ?? "user",
            email: authUser.data.user.email ?? "",
            profileImage: "",
            onboardingCompleted: false,
          };
        }
        return null;
      }

      const authUser = await supabase.auth.getUser();
      if (!authUser.data.user) {
        console.error("No auth user found");
        return null;
      }

      return {
        id: data.id,
        name: data.name ?? authUser.data.user.email?.split("@")[0] ?? "User",
        username: data.username ?? authUser.data.user.email?.split("@")[0] ?? "user",
        email: authUser.data.user.email || "",
        profileImage: data.profile_image_url,
        onboardingCompleted: data.onboarding_completed,
      };
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Sign in failed. Please check your credentials.", error.message);
      throw error;
    }

    if (!data.user) {
      throw new Error("No authenticated user returned from Supabase.");
    }

    const profile = await fetchUserProfile(data.user.id);
    if (profile) {
      setUser(profile);
    } else {
      setUser({
        id: data.user.id,
        name: data.user.user_metadata?.name ?? data.user.email ?? "",
        email: data.user.email ?? "",
        username: data.user.email?.split("@")[0] ?? "",
        profileImage: "",
        onboardingCompleted: false,
      });
    }
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.username !== undefined)
        updateData.username = userData.username;
      if (userData.profileImage !== undefined)
        updateData.profile_image_url = userData.profileImage;
      if (userData.onboardingCompleted !== undefined)
        updateData.onboarding_completed = userData.onboardingCompleted;

      const { error, data } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;

      if (data) {
        console.log(data);
        const profile = await fetchUserProfile(data.id);
        setUser(profile);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  const deleteAccount = async (reason?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke(
        "delete-account",
        {
          body: {
            reason: reason?.trim() || null,
          },
        }
      );

      if (error) {
        throw error;
      }

      setUser(null);
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };
  return (
    <AuthContext.Provider
      value={{ user, signUp, updateUser, signIn, signOut, isLoading, refreshUser, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("must be inside the provider");
  }
  return context;
};