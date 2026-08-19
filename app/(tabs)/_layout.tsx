"use client";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon
} from "expo-router/unstable-native-tabs";
import { useEffect } from "react";
export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading, router]);

  return (
    <NativeTabs
      backgroundColor="rgba(255, 255, 255, 0.1)"
      iconColor={{
        default: "#8E8E93",
        selected: "#6C63FF",
      }}
      
      labelStyle={{
        default: {
          color: "#8E8E93",
          fontSize: 11,
        },
        selected: {
          color: "#6C63FF",
          fontSize: 11,
        },
      }}
      indicatorColor="#a4a0ed"
      blurEffect="systemMaterial"
      >
      <NativeTabs.Trigger name="index">
        <Icon
          src={
            <VectorIcon
              family={Ionicons}
              name="home"
            />
          }
        />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon
          src={
            <VectorIcon
              family={Ionicons}
              name="person"
            />
          }
        />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}