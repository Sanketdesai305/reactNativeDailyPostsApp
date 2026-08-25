import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
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

export default function ResetPassword() {
  const router = useRouter();
  const { completePasswordRecovery } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(
        "Missing information",
        "Please enter your new password and confirm it."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid password",
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "Please make sure both passwords are the same."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      await completePasswordRecovery();

      Alert.alert(
        "Password updated",
        "Your password has been changed successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(auth)/login");
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Update password error:",
        error
      );

      Alert.alert(
        "Unable to update password",
        "Something went wrong while updating your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* BACK */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#6C63FF"
          />

          <Text style={styles.backText}>
            Back
          </Text>
        </TouchableOpacity>

        {/* TITLE */}

        <Text style={styles.title}>
          Reset Password
        </Text>

        <Text style={styles.subtitle}>
          Enter a new password for your account.
        </Text>

        {/* PASSWORD */}

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={21}
            color="#777"
          />

          <TextInput
            placeholder="New password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={() =>
              setShowPassword((current) => !current)
            }
          >
            <Ionicons
              name={
                showPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={21}
              color="#777"
            />
          </TouchableOpacity>
        </View>

        {/* CONFIRM PASSWORD */}

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={21}
            color="#777"
          />

          <TextInput
            placeholder="Confirm password"
            placeholderTextColor="#999"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={() =>
              setShowConfirmPassword(
                (current) => !current
              )
            }
          >
            <Ionicons
              name={
                showConfirmPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={21}
              color="#777"
            />
          </TouchableOpacity>
        </View>

        {/* PASSWORD REQUIREMENT */}

        <Text style={styles.requirement}>
          Password must contain at least 6 characters.
        </Text>

        {/* BUTTON */}

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
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
              Update Password
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  backText: {
    fontSize: 16,
    color: "#6C63FF",
    fontWeight: "600",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: "#666",
    marginBottom: 25,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 15,
    marginBottom: 14,
  },

  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#111",
  },

  requirement: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});