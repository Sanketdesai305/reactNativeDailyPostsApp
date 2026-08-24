import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Details() {
  const router = useRouter();
  const { user } = useAuth();

  const { userId } = useLocalSearchParams<{
    userId?: string;
  }>();

  const [profile, setProfile] = useState<any>(null);

  const profileUserId = userId || user?.id;
  const isOwnProfile = profileUserId === user?.id;
  useEffect(() => {
    if (!profileUserId) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          username,
          profile_image_url,
          bio,
          location,
          skills,
          experience
        `)
        .eq("id", profileUserId)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setProfile(data);
    };

    loadProfile();
  }, [profileUserId]);
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons
              name="arrow-back"
              size={26}
              color="#333"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Profile
          </Text>
        </View>

        {/* PROFILE HEADER */}
        <View style={styles.profileSection}>

          {profile?.profile_image_url ? (
            <Image
              source={{ uri: profile?.profile_image_url }}
              style={styles.profileImage}
              cachePolicy="none"
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitial}>
                {profile?.name?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
          )}

          <Text style={styles.name}>
            {profile?.name || "User"}
          </Text>

          <Text style={styles.username}>
            @{profile?.username || "username"}
          </Text>
        </View>

        {/* INFORMATION CARD */}
        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Personal Information
          </Text>

          {/* FULL NAME */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="person-outline"
                size={22}
                color="#6C63FF"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                Full Name
              </Text>

              <Text style={styles.value}>
                {profile?.name || ""}
              </Text>
            </View>
          </View>

          {/* USERNAME */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="at-outline"
                size={22}
                color="#6C63FF"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                Username
              </Text>

              <Text style={styles.value}>
                @{profile?.username || ""}
              </Text>
            </View>
          </View>
                  {/* EMAIL */}
        {isOwnProfile && (
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="mail-outline"
                size={22}
                color="#6C63FF"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                Email
              </Text>

              <Text style={styles.value}>
                {user?.email || ""}
              </Text>
            </View>
          </View>
        )}
        </View>
        {/* ABOUT */}

        {(profile?.bio ||
          profile?.location ||
          profile?.skills ||
          profile?.experience) && (
            <View style={styles.card}>

              <Text style={styles.sectionTitle}>
                About
              </Text>

              {/* BIO */}

              {profile?.bio && (
                <View style={styles.aboutSection}>
                  <View style={styles.aboutHeader}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="person-circle-outline"
                        size={22}
                        color="#6C63FF"
                      />
                    </View>

                    <Text style={styles.label}>
                      About Me
                    </Text>
                  </View>

                  <Text style={styles.aboutText}>
                    {profile.bio}
                  </Text>
                </View>
              )}

              {/* LOCATION */}

              {profile?.location && (
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="location-outline"
                      size={22}
                      color="#6C63FF"
                    />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.label}>
                      Location
                    </Text>

                    <Text style={styles.value}>
                      {profile.location}
                    </Text>
                  </View>
                </View>
              )}

              {/* SKILLS */}

              {profile?.skills && (
                <View style={styles.aboutSection}>
                  <View style={styles.aboutHeader}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="construct-outline"
                        size={22}
                        color="#6C63FF"
                      />
                    </View>

                    <Text style={styles.label}>
                      Skills
                    </Text>
                  </View>

                  <View style={styles.skillsContainer}>
                    {profile.skills
                      .split(",")
                      .map(
                        (
                          skill: string,
                          index: number
                        ) => (
                          <View
                            key={index}
                            style={styles.skillChip}
                          >
                            <Text style={styles.skillText}>
                              {skill.trim()}
                            </Text>
                          </View>
                        )
                      )}
                  </View>
                </View>
              )}

              {/* EXPERIENCE */}

              {profile?.experience && (
                <View style={styles.aboutSection}>
                  <View style={styles.aboutHeader}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="briefcase-outline"
                        size={22}
                        color="#6C63FF"
                      />
                    </View>

                    <Text style={styles.label}>
                      Experience
                    </Text>
                  </View>

                  <Text style={styles.aboutText}>
                    {profile.experience}
                  </Text>
                </View>
              )}

            </View>
          )}



        {/* ACCOUNT CARD */}
        {isOwnProfile && (
          <View style={styles.card}>

            <Text style={styles.sectionTitle}>
              Account
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#6C63FF"
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.label}>
                  Account Status
                </Text>

                <Text style={styles.value}>
                  {user?.onboardingCompleted
                    ? "Profile completed"
                    : "Profile incomplete"}
                </Text>
              </View>
            </View>

          </View>
        )}



        {/* EDIT BUTTON */}
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/onboarding")}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color="#fff"
            />

            <Text style={styles.editButtonText}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f9",
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backButton: {
    padding: 5,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 15,
    color: "#222",
  },

  profileSection: {
    alignItems: "center",
    paddingVertical: 25,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },

  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e5e5ea",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  profileInitial: {
    fontSize: 48,
    fontWeight: "600",
    color: "#666",
  },

  name: {
    fontSize: 25,
    fontWeight: "700",
    color: "#222",
  },
  aboutSection: {
    marginBottom: 20,
  },

  aboutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  aboutText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#555",
    marginLeft: 56,
  },

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginLeft: 56,
  },

  skillChip: {
    backgroundColor: "#f0efff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  skillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6C63FF",
  },
  username: {
    fontSize: 16,
    color: "#777",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: 16,
    padding: 20,

    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 18,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f0efff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  infoContent: {
    flex: 1,
  },

  label: {
    fontSize: 13,
    color: "#888",
    marginBottom: 3,
  },

  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
  },

  editButton: {
    marginHorizontal: 18,
    marginBottom: 30,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6C63FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});