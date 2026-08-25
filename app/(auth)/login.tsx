import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    signIn,
    signInWithGoogle,
  } = useAuth();

  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        "Error",
        "Please fill in all fields"
      );
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);

      router.replace("/(tabs)");
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Failed to sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google login error:", error);

      Alert.alert(
        "Google Sign In Failed",
        "Unable to continue with Google."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={styles.container}
    >
      <View style={styles.content}>

        <Text style={styles.title}>
          Welcome Back
        </Text>

        <Text style={styles.subtitle}>
          Sign In to Continue
        </Text>

        <View style={styles.form}>

          {/* GOOGLE */}

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={isLoading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator
                size="small"
                color="#4285F4"
              />
            ) : (
              <>
                <Svg
                  width={20}
                  height={20}
                  viewBox="0 0 48 48"
                >
                  <Path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.61 0 6.55 5.38 2.6 13.22l7.98 6.2C12.5 13.18 17.79 9.5 24 9.5z"
                  />

                  <Path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.65c-.55 2.9-2.2 5.35-4.68 7.02l7.57 5.88C43.9 37.5 46.5 31.5 46.5 24.5z"
                  />

                  <Path
                    fill="#FBBC05"
                    d="M10.58 28.42A14.4 14.4 0 0 1 9.5 24c0-1.54.26-3.03.72-4.42l-7.98-6.2A24 24 0 0 0 0 24c0 3.86.92 7.52 2.56 10.62l8.02-6.2z"
                  />

                  <Path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.57-5.88c-2.1 1.41-4.78 2.25-8.32 2.25-6.2 0-11.49-3.68-13.42-8.92l-8.02 6.2C6.55 42.62 14.61 48 24 48z"
                  />
                </Svg>

                <Text style={styles.googleButtonText}>
                  <Text style={styles.googleIcon}></Text>Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* DIVIDER */}

          <View style={styles.dividerContainer}>

            <View style={styles.divider} />

            <Text style={styles.orText}>
              OR
            </Text>

            <View style={styles.divider} />

          </View>

          {/* EMAIL */}

          <TextInput
            placeholder="Email..."
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          {/* PASSWORD */}

          <TextInput
            placeholder="Password..."
            placeholderTextColor="#999"
            autoComplete="password"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            
          />

          {/* Forgot password */}

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("./forgotPassword")}
          >
            <Text style={styles.forgotPasswordText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* SIGN IN */}

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={
              isLoading || googleLoading
            }
          >
            {isLoading ? (
              <ActivityIndicator
                size={24}
                color="#fff"
              />
            ) : (
              <Text style={styles.buttonText}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* SIGN UP */}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              router.push("/signup")
            }
          >
            <Text style={styles.linkButtonText}>
              Don't have an account?{" "}
              <Text
                style={
                  styles.linkButtonTextBold
                }
              >
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: "#666",
  },

  form: {
    width: "100%",
  },

  googleButton: {
    height: 52,
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",

    // subtle Android elevation
    elevation: 1,
  },

  googleIcon: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 10,
  },

  googleButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#3c4043",
    marginLeft: 12,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },

  orText: {
    marginHorizontal: 12,
    color: "#999",
    fontSize: 13,
  },

  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
     color: "#111",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -5,
    marginBottom: 18,
  },

  forgotPasswordText: {
    color: "#6C63FF",
    fontSize: 14,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  linkButton: {
    marginTop: 24,
    alignItems: "center",
  },

  linkButtonText: {
    color: "#666",
    fontSize: 14,
  },

  linkButtonTextBold: {
    fontWeight: "600",
    color: "#000",
  },
});