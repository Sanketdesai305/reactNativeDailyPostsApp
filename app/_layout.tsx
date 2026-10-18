"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RequestProvider } from "@/context/RequestContext";
import { SearchProvider } from "@/context/SearchContext";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import KelsaSplash from "./components/KelsaSplash";

export default function RootLayout() {
  function RouteGuard() {
    const router = useRouter();
    const {
      user,
      isLoading,
      isPasswordRecovery,
      isAuthProcessing,
    } = useAuth();
    const segments = useSegments();
    const [showOverlay, setShowOverlay] = useState(true);

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const inNotifications = segments[0] === "notifications";
    const inOnboarding = segments[0] === "onboarding";
    const inDetails = segments[0] === "details";
    const inChat = segments[0] === "chat";
    const inHelpSupport = segments[0] === "help-support";
    const inPrivacyPolicy = segments[0] === "privacy-policy";
    const inResetPassword = segments[0] === "reset-password";
    const inJobDetails = segments[0] === "jobDetails";
    useEffect(() => {
      if (isLoading || isAuthProcessing) {
        setShowOverlay(true);
        return;
      }

      // ensure overlay stays visible at least until loading finishes
      setShowOverlay(false);

      if (isPasswordRecovery && !inResetPassword) {
        router.replace("/reset-password");
      } else if (
        !user &&
        !inAuthGroup &&
        !inResetPassword &&
        !isPasswordRecovery &&
        !isAuthProcessing 
      ) {
        router.replace("/(auth)/login");

      } else if (user && !inTabsGroup && !inResetPassword && !inJobDetails && !inNotifications && !inOnboarding && !inDetails && !inChat && !inHelpSupport && !inPrivacyPolicy) {
        router.replace("/(tabs)");
      }
    }, [user, isLoading, isAuthProcessing, inAuthGroup, isPasswordRecovery, inResetPassword, inTabsGroup, inNotifications, inOnboarding, inDetails, router, inChat, inHelpSupport, inPrivacyPolicy]);

    return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="notifications"
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              animation: "slide_from_right",
            }}
          />
           <Stack.Screen
            name="jobDetails"
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen name="reset-password" />
        </Stack>
        {showOverlay && (
          <View style={styles.overlay} pointerEvents="auto">
            <KelsaSplash />
          </View>
        )}
      </>
    );
  }

  return (
    <AuthProvider>
      <SearchProvider>
        <RequestProvider>
          <RouteGuard />
        </RequestProvider>
      </SearchProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
});

