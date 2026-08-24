import { supabase } from "@/lib/supabase/client";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
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
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: (reason?: string) => Promise<void>;
}
interface AuthContextType {
  user: User | null;
  isLoading: boolean;

  signUp: (
    email: string,
    password: string
  ) => Promise<void>;

  signIn: (
    email: string,
    password: string
  ) => Promise<void>;

  signInWithGoogle: () => Promise<void>;

  updateUser: (
    userData: Partial<User>
  ) => Promise<void>;

  signOut: () => Promise<void>;

  refreshUser: () => Promise<void>;

  deleteAccount: (
    reason?: string
  ) => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);
const [user, setUser] = useState<User | null>(null);
const fetchUserProfile = async (
  userId: string
): Promise<User | null> => {
  try {
    // Get authenticated user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      console.error("No auth user found");
      return null;
    }

    // Google/user metadata
    const googleName =
      authUser.user_metadata?.full_name ??
      authUser.user_metadata?.name ??
      authUser.email?.split("@")[0] ??
      "User";

    const googlePicture =
      authUser.user_metadata?.avatar_url ??
      authUser.user_metadata?.picture ??
      "";

    // Get profile from your profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);

      // Fallback to Google/Auth information
      return {
        id: authUser.id,
        name: googleName,
        username: "",
        email: authUser.email ?? "",
        profileImage: googlePicture,
        onboardingCompleted: false,
      };
    }

    // Profile doesn't exist yet
    if (!data) {
      return {
        id: authUser.id,
        name: googleName,
        username: "",
        email: authUser.email ?? "",
        profileImage: googlePicture,
        onboardingCompleted: false,
      };
    }

    // Profile exists
    return {
      id: data.id,

      // Prefer your database value
      // Fall back to Google information
      name: data.name ?? googleName,

      // Username should be your app's username
      username: data.username ?? "",

      email: authUser.email ?? "",

      // Prefer your database image
      // Fall back to Google profile picture
      profileImage:
        data.profile_image_url ?? googlePicture,

      onboardingCompleted:
        data.onboarding_completed ?? false,
    };

  } catch (error) {
    console.error(
      "Error in fetchUserProfile:",
      error
    );

    return null;
  }
};
const signInWithGoogle = async () => {
  try {
    const redirectTo = makeRedirectUri({
      scheme: "kelsa",
      path: "auth/callback",
    });

    console.log("Google redirect URL:", redirectTo);

    const { data, error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

    if (error) {
      throw error;
    }

    if (!data?.url) {
      throw new Error(
        "No Google OAuth URL was returned."
      );
    }

    console.log("Opening Google OAuth...");

    const result =
      await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

    console.log("OAuth result:", result);

    if (result.type !== "success") {
      throw new Error(
        "Google authentication was cancelled."
      );
    }

    const { params, errorCode } =
      QueryParams.getQueryParams(result.url);

    if (errorCode) {
      throw new Error(errorCode);
    }

    const {
      access_token,
      refresh_token,
    } = params;

    if (!access_token || !refresh_token) {
      throw new Error(
        "Google authentication succeeded, but no session tokens were returned."
      );
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData.session?.user) {
      throw new Error(
        "No authenticated user returned from Google."
      );
    }

    console.log(
      "Google login successful:",
      sessionData.session.user.id
    );

    // Load your profile
    const profile = await fetchUserProfile(
      sessionData.session.user.id
    );

    if (profile) {
      setUser(profile);
    } else {
      // Fallback profile using Google metadata
      const googleUser =
        sessionData.session.user;

      const metadata =
        googleUser.user_metadata ?? {};

      setUser({
        id: googleUser.id,

        name:
          metadata.full_name ??
          metadata.name ??
          googleUser.email?.split("@")[0] ??
          "User",

        username:
          metadata.user_name ??
          googleUser.email?.split("@")[0] ??
          "user",

        email:
          googleUser.email ?? "",

        profileImage:
          metadata.avatar_url ??
          metadata.picture ??
          "",

        onboardingCompleted: false,
      });
    }

  } catch (error: any) {
    console.error(
      "Google sign in error:",
      error
    );

    Alert.alert(
      "Google Sign In Failed",
      error?.message ??
        "Unable to sign in with Google."
    );

    throw error;
  }
};
const resetPassword = async (email: string) => {
  if (!email.trim()) {
    throw new Error("Please enter your email address.");
  }

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: "nextjob://reset-password",
      }
    );

  if (error) {
    console.error(
      "Password reset error:",
      error
    );
    throw error;
  }
};
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
      value={{ user, signUp, updateUser, signIn, signOut, isLoading, refreshUser, deleteAccount,signInWithGoogle,resetPassword, }}
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