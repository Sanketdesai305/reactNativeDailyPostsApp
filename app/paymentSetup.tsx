"use client";

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";

export default function PaymentSetup() {
  const router = useRouter();
  const { user } = useAuth();

  const { postId } = useLocalSearchParams<{
    postId?: string;
  }>();

  const [accountHolderName, setAccountHolderName] =
    useState("");

  const [accountNumber, setAccountNumber] =
    useState("");

  const [confirmAccountNumber, setConfirmAccountNumber] =
    useState("");

  const [ifscCode, setIfscCode] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!user) {
      Alert.alert(
        "Error",
        "You must be logged in to set up payments."
      );
      return;
    }

    // ------------------------------------------
    // VALIDATE ACCOUNT HOLDER NAME
    // ------------------------------------------

    const trimmedName =
      accountHolderName.trim();

    if (!trimmedName) {
      Alert.alert(
        "Required",
        "Please enter the account holder name."
      );
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert(
        "Invalid Name",
        "Please enter a valid account holder name."
      );
      return;
    }

    // ------------------------------------------
    // VALIDATE ACCOUNT NUMBER
    // ------------------------------------------

    const trimmedAccountNumber =
      accountNumber.trim();

    const trimmedConfirmAccountNumber =
      confirmAccountNumber.trim();

    if (!trimmedAccountNumber) {
      Alert.alert(
        "Required",
        "Please enter your bank account number."
      );
      return;
    }

    if (!/^\d+$/.test(trimmedAccountNumber)) {
      Alert.alert(
        "Invalid Account Number",
        "Bank account number should contain numbers only."
      );
      return;
    }

    if (
      trimmedAccountNumber.length < 9 ||
      trimmedAccountNumber.length > 18
    ) {
      Alert.alert(
        "Invalid Account Number",
        "Please enter a valid bank account number."
      );
      return;
    }

    // ------------------------------------------
    // CONFIRM ACCOUNT NUMBER
    // ------------------------------------------

    if (!trimmedConfirmAccountNumber) {
      Alert.alert(
        "Required",
        "Please confirm your bank account number."
      );
      return;
    }

    if (
      trimmedAccountNumber !==
      trimmedConfirmAccountNumber
    ) {
      Alert.alert(
        "Account Number Mismatch",
        "The account numbers do not match."
      );
      return;
    }

    // ------------------------------------------
    // VALIDATE IFSC
    // ------------------------------------------

    const normalizedIfsc =
      ifscCode.trim().toUpperCase();

    if (!normalizedIfsc) {
      Alert.alert(
        "Required",
        "Please enter your IFSC code."
      );
      return;
    }

    const ifscRegex =
      /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!ifscRegex.test(normalizedIfsc)) {
      Alert.alert(
        "Invalid IFSC",
        "Please enter a valid 11-character IFSC code."
      );
      return;
    }

    // ------------------------------------------
    // SUBMIT
    // ------------------------------------------

    try {
      setIsSubmitting(true);

      console.log(
        "SETTING UP WORKER PAYMENT ACCOUNT"
      );

      const { data, error } =
        await supabase.functions.invoke(
          "setup-worker-payout",
          {
            body: {
              accountHolderName:
                trimmedName,

              accountNumber:
                trimmedAccountNumber,

              ifscCode:
                normalizedIfsc,

              // Useful for processing any
              // payout_pending payment after setup.
              postId: postId ?? null,
            },
          }
        );

      if (error) {
        console.error(
          "setup-worker-payout error:",
          error
        );

        throw new Error(
          error.message ||
            "Unable to set up your payment account."
        );
      }

      console.log(
        "SETUP WORKER PAYOUT RESPONSE:",
        data
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to set up your payment account."
        );
      }

      // ----------------------------------------
      // SUCCESS
      // ----------------------------------------

      Alert.alert(
        "Payment Setup Complete",
        data?.message ||
          "Your payment account has been successfully set up.",
        [
          {
            text: "Continue",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Payment setup failed:",
        error
      );

      Alert.alert(
        "Payment Setup Failed",
        error instanceof Error
          ? error.message
          : "Something went wrong while setting up your payment account."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------- */}
        {/* HEADER */}
        {/* ---------------------------------- */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.backIcon}>
              ‹
            </Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Payment Setup
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* ---------------------------------- */}
        {/* INTRO */}
        {/* ---------------------------------- */}

        <View style={styles.introSection}>
          <Text style={styles.title}>
            Set up your payment account
          </Text>

          <Text style={styles.subtitle}>
            Add your bank details so you can
            receive payments for jobs you
            complete on Kelsa.
          </Text>
        </View>

        {/* ---------------------------------- */}
        {/* SECURITY CARD */}
        {/* ---------------------------------- */}

        <View style={styles.securityCard}>
          <View style={styles.securityIconContainer}>
            <Text style={styles.securityIcon}>
              🔒
            </Text>
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Your information is secure
            </Text>

            <Text style={styles.securityText}>
              Your bank details are securely
              processed for payout setup and
              are not displayed on your public
              profile.
            </Text>
          </View>
        </View>

        {/* ---------------------------------- */}
        {/* FORM */}
        {/* ---------------------------------- */}

        <View style={styles.form}>
          {/* Account Holder Name */}

          <Text style={styles.label}>
            Account Holder Name
          </Text>

          <TextInput
            style={styles.input}
            value={accountHolderName}
            onChangeText={
              setAccountHolderName
            }
            placeholder="Enter account holder name"
            placeholderTextColor="#999"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          {/* Account Number */}

          <Text style={styles.label}>
            Bank Account Number
          </Text>

          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={(value) =>
              setAccountNumber(
                value.replace(/\D/g, "")
              )
            }
            placeholder="Enter bank account number"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            secureTextEntry
            editable={!isSubmitting}
            maxLength={18}
          />

          {/* Confirm Account Number */}

          <Text style={styles.label}>
            Confirm Bank Account Number
          </Text>

          <TextInput
            style={styles.input}
            value={confirmAccountNumber}
            onChangeText={(value) =>
              setConfirmAccountNumber(
                value.replace(/\D/g, "")
              )
            }
            placeholder="Re-enter bank account number"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            secureTextEntry
            editable={!isSubmitting}
            maxLength={18}
          />

          {/* IFSC */}

          <Text style={styles.label}>
            IFSC Code
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.ifscInput,
            ]}
            value={ifscCode}
            onChangeText={(value) =>
              setIfscCode(
                value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
              )
            }
            placeholder="e.g. HDFC0001234"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={11}
            editable={!isSubmitting}
          />

          <Text style={styles.helperText}>
            Enter the 11-character IFSC code
            associated with your bank account.
          </Text>
        </View>

        {/* ---------------------------------- */}
        {/* SUBMIT BUTTON */}
        {/* ---------------------------------- */}

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator
                size="small"
                color="#fff"
              />

              <Text
                style={styles.submitText}
              >
                Setting up...
              </Text>
            </>
          ) : (
            <Text
              style={styles.submitText}
            >
              Set Up Payment Account
            </Text>
          )}
        </TouchableOpacity>

        {/* ---------------------------------- */}
        {/* FOOTER */}
        {/* ---------------------------------- */}

        <Text style={styles.footerText}>
          You only need to complete payment
          setup once. Once your account is
          active, future eligible job payments
          can be sent to your account.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  backIcon: {
    fontSize: 38,
    lineHeight: 40,
    fontWeight: "300",
    color: "#111111",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },

  headerSpacer: {
    width: 40,
  },

  introSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666666",
  },

  securityCard: {
    marginHorizontal: 24,
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#F5F7FA",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  securityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 12,
  },

  securityIcon: {
    fontSize: 18,
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 5,
  },

  securityText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#666666",
  },

  form: {
    paddingHorizontal: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginTop: 18,
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#111111",
  },

  ifscInput: {
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  helperText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    color: "#888888",
  },

  submitButton: {
    marginHorizontal: 24,
    marginTop: 30,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  footerText: {
    marginHorizontal: 30,
    marginTop: 16,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#888888",
  },
});