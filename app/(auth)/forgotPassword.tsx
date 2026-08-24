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

export default function ForgotPassword() {
  const router = useRouter();

  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Email required",
        "Please enter your email address."
      );
      return;
    }

    try {
      setLoading(true);

      await resetPassword(email);

      Alert.alert(
        "Check your email",
        "If an account exists with this email, you will receive a password reset link.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      Alert.alert(
        "Something went wrong",
        "Unable to send the password reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Forgot Password?
        </Text>

        <Text style={styles.subtitle}>
          Enter your email and we'll send you
          a link to reset your password.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              size={24}
              color="#fff"
            />
          ) : (
            <Text style={styles.buttonText}>
              Send Reset Link
            </Text>
          )}
        </TouchableOpacity>

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
    padding: 24,
    justifyContent: "center",
  },

  backButton: {
    position: "absolute",
    top: 20,
    left: 24,
  },

  backText: {
    fontSize: 16,
    color: "#6C63FF",
    fontWeight: "600",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: "#666",
    marginBottom: 25,
  },

  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 16,
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
});