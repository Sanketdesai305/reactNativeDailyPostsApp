"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function RootLayout() {
  function RouteGuard() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const [showOverlay, setShowOverlay] = useState(true);

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const inNotifications = segments[0] === "notifications";
    const inOnboarding = segments[0] === "onboarding";
    const inDetails = segments[0] === "details";
    useEffect(() => {
      if (isLoading) {
        setShowOverlay(true);
        return;
      }

      // ensure overlay stays visible at least until loading finishes
      setShowOverlay(false);

      if (!user && !inAuthGroup) {
        router.replace("/(auth)/login");
      } else if (user && !inTabsGroup && !inNotifications && !inOnboarding && !inDetails ) {
        router.replace("/(tabs)");
      }
    }, [user, isLoading, inAuthGroup, inTabsGroup, inNotifications,inOnboarding,inDetails, router]);

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
        </Stack>
        {showOverlay && (
          <View style={styles.overlay} pointerEvents="auto">
            <ActivityIndicator size="large" />
          </View>
        )}
      </>
    );
  }

  return (
    <AuthProvider>
      <RouteGuard />
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

