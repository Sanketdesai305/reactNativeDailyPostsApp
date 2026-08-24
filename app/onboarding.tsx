import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { uploadProfileImage } from "@/lib/supabase/storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function EditProfile() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            name,
            username,
            bio,
            location,
            skills,
            experience,
            profile_image_url
          `)
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setName(data?.name ?? "");
        setUsername(data?.username ?? "");
        setBio(data?.bio ?? "");
        setLocation(data?.location ?? "");
        setSkills(data?.skills ?? "");
        setExperience(data?.experience ?? "");
        setProfileImage(data?.profile_image_url ?? null);
      } catch (error) {
        console.error(
          "Error loading profile:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photos to change your profile picture."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (!result.canceled) {
      setProfileImage(
        result.assets[0].uri
      );
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (!name.trim()) {
      Alert.alert(
        "Missing Name",
        "Please enter your name."
      );
      return;
    }
    let profileImageUrl = profileImage;

    if (
      profileImage &&
      !profileImage.startsWith("http")
    ) {
      profileImageUrl =
        await uploadProfileImage(
          user.id,
          profileImage
        );
    }

    if (!username.trim()) {
      Alert.alert(
        "Missing Username",
        "Please enter a username."
      );
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          username: username.trim(),
          bio: bio.trim() || null,
          location: location.trim() || null,
          skills: skills.trim() || null,
          experience: experience.trim() || null,
          profile_image_url: profileImageUrl,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "Error updating profile:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
        "Failed to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#6C63FF"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color="#222"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Edit Profile
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* PROFILE IMAGE */}

        <TouchableOpacity
          style={styles.imageContainer}
          onPress={pickImage}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
              cachePolicy="none"
            />
          ) : (
            <View
              style={styles.profilePlaceholder}
            >
              <Text style={styles.profileInitial}>
                {name?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
          )}

          <View style={styles.cameraButton}>
            <Ionicons
              name="camera"
              size={18}
              color="#fff"
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.changePhotoText}>
          Change Profile Photo
        </Text>

        {/* NAME */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Full Name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        {/* USERNAME */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Username
          </Text>

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            placeholderTextColor="#999"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* BIO */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            About Me
          </Text>

          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people a little about yourself..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            maxLength={300}
            textAlignVertical="top"
            style={[
              styles.input,
              styles.textArea,
            ]}
          />

          <Text style={styles.characterCount}>
            {bio.length}/300
          </Text>
        </View>

        {/* LOCATION */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Location
          </Text>

          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Bengaluru, Karnataka"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        {/* SKILLS */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Skills
          </Text>

          <TextInput
            value={skills}
            onChangeText={setSkills}
            placeholder="e.g. Driving, Pet Care, Delivery"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <Text style={styles.helperText}>
            Separate multiple skills with commas.
          </Text>
        </View>

        {/* EXPERIENCE */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Experience
          </Text>

          <TextInput
            value={experience}
            onChangeText={setExperience}
            placeholder="e.g. 2 years of pet care experience"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[
              styles.input,
              styles.textAreaSmall,
            ]}
          />
        </View>

        {/* SAVE */}

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <>
              <Ionicons
                name="checkmark"
                size={21}
                color="#fff"
              />

              <Text style={styles.saveButtonText}>
                Save Changes
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f9",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#f7f7f9",
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

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  imageContainer: {
    alignSelf: "center",
    position: "relative",
    marginTop: 10,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e5e5ea",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    fontSize: 46,
    fontWeight: "600",
    color: "#666",
  },

  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#f7f7f9",
  },

  changePhotoText: {
    textAlign: "center",
    marginTop: 10,
    marginBottom: 25,
    color: "#6C63FF",
    fontSize: 14,
    fontWeight: "600",
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    color: "#222",
  },

  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },

  textAreaSmall: {
    minHeight: 80,
    paddingTop: 14,
  },

  characterCount: {
    textAlign: "right",
    color: "#999",
    fontSize: 12,
    marginTop: 5,
  },

  helperText: {
    color: "#999",
    fontSize: 12,
    marginTop: 5,
  },

  saveButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6C63FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});