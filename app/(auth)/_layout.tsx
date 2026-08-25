"use client";

import { useAuth } from "@/context/AuthContext";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from 'react';

export default function AuthLayout() {
  const { user, isLoading, isAuthProcessing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, router]);

  if (isAuthProcessing) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}