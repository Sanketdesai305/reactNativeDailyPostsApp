import { useAuth } from "@/context/AuthContext";
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from "react-native-svg";
export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();


  const handleSignUp = async () => {
    // Implement sign-up logic here
    if (!email || !password || !confirmPassword) {
      Alert.alert("Please enter email and both passwords.");
      return;
    }


    if (password.length < 6) {
      Alert.alert(
        "Invalid password",
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords don't match",
        "Please make sure both passwords are the same."
      );
      return;
    }
    try {
      setLoading(true);
      await signUp(email, password);
      router.push("/onboarding");
    } catch (error) {
      console.error("Sign up error:", error);
      Alert.alert("Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <Text style={styles.title}>
          Create Account
        </Text>

        <Text style={styles.subtitle}>
          Create your Kelsa account
        </Text>

        {/* GOOGLE */}

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={loading || googleLoading}
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
                Continue with Google
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

        {/* EMAIL/PASSWORD */}

        <View style={styles.inputWrapper}>

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
            placeholder="Email"
            autoComplete="email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            autoCapitalize="none"
            placeholderTextColor="#999"
            placeholder="Password"
            secureTextEntry
            autoComplete="new-password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            autoCapitalize="none"
            placeholderTextColor="#999"
            placeholder="Re-enter password"
            secureTextEntry
            autoComplete="new-password"
            style={[
              styles.input,
              confirmPassword &&
              password !== confirmPassword &&
              styles.inputError,
            ]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {confirmPassword.length > 0 &&
            password !== confirmPassword && (
              <Text style={styles.errorText}>
                Passwords do not match
              </Text>
            )}

          {confirmPassword.length > 0 &&
            password === confirmPassword && (
              <Text style={styles.successText}>
                Passwords match ✓
              </Text>
            )}

        </View>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={handleSignUp}
          disabled={loading || googleLoading}
        >
          {loading ? (
            <ActivityIndicator
              size={24}
              color="#fff"
            />
          ) : (
            <Text style={styles.signupButtonText}>
              Sign Up
            </Text>
          )}
        </TouchableOpacity>

        {/* LOGIN */}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.linkButtonText}>
            Already have an account?{" "}
            <Text style={styles.linkButtonTextBold}>
              Sign In
            </Text>
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
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

  inputWrapper: {
    marginTop: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
     color: "#111",
  },

  signupButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },

  signupButtonText: {
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
  inputError: {
    borderColor: "#e53935",
  },

  errorText: {
    color: "#e53935",
    fontSize: 13,
    marginTop: -5,
    marginBottom: 10,
  },

  successText: {
    color: "#2e7d32",
    fontSize: 13,
    marginTop: -5,
    marginBottom: 10,
  },
});