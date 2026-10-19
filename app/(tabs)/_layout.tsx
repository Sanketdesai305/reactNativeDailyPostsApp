"use client";
import { useAuth } from "@/context/AuthContext";
import { useRequests } from "@/context/RequestContext";
import { useSearch } from "@/context/SearchContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import {
  Badge,
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBar from "../components/SearchBar";
export default function TabsLayout() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const drawerWidth = Dimensions.get("window").width * 0.7;
  const drawerAnimation = useRef(new Animated.Value(-drawerWidth)).current;
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
  } = useSearch();
  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(drawerAnimation, {
      toValue: -drawerWidth,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const { user, isLoading, signOut } = useAuth();
  const { requestCount, unreadMessageCount } = useRequests();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    closeMenu();
    await signOut();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={styles.container}>

        {/* TOP NAVIGATION BAR */}
        <View style={styles.topBar}>

          {/* HAMBURGER */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={openMenu}
          >
            <Ionicons
              name="menu"
              size={28}
              color="#333"
            />
          </TouchableOpacity>

          {/* HAMBURGER MENU */}
          <Modal
            visible={menuVisible}
            transparent
            animationType="none"
            onRequestClose={closeMenu}
          >
            <View style={styles.menuOverlay}>
              <TouchableOpacity
                style={styles.menuBackdrop}
                onPress={closeMenu}
              />

              <Animated.View
                style={[
                  styles.sideMenu,
                  { transform: [{ translateX: drawerAnimation }] },
                ]}
              >
                <View style={styles.menuHeader}>
                  <TouchableOpacity
                    onPress={closeMenu}
                    style={styles.backButton}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={28}
                      color="#333"
                    />
                  </TouchableOpacity>

                  <Text style={styles.menuTitle}>Menu</Text>
                </View>

                <Link href="/details" asChild>
                  <TouchableOpacity>
                    <View style={styles.menuProfile}>
                      {user?.profileImage ? (
                        <Image
                          source={{ uri: user.profileImage }}
                          style={styles.menuProfileImage}
                          cachePolicy="none"
                        />
                      ) : (
                        <View
                          style={[
                            styles.menuProfileImage,
                            styles.menuProfilePlaceholder,
                          ]}
                        >
                          <Text style={styles.menuProfileInitial}>
                            {user?.name?.[0]?.toUpperCase() || "U"}
                          </Text>
                        </View>
                      )}

                      <Text style={styles.menuProfileName}>
                        {user?.name || "User"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    router.push("/(tabs)");
                  }}
                >
                  <Ionicons
                    name="home-outline"
                    size={23}
                    color="#333"
                  />
                  <Text style={styles.menuItemText}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    router.push("/notifications");
                  }}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.menuItemText}>Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    router.push("/chat");
                  }}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.menuItemText}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    router.push("/onboarding");
                  }}
                >
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.menuItemText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogout}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.menuItemText}>Logout</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Modal>
          {/* TITLE */}
          {searchOpen ? (
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClose={() => {
                clearSearch();
                setSearchOpen(false);
              }}
            />
          ) : (
            <>
              <Link href="/(tabs)">
                <Text style={styles.title}>
                  <Image
                    source={require("@/assets/images/android-icon-monochrome.png")}
                    style={{
                      width: 25,
                      height: 16,
                    }}
                    contentFit="contain"
                  />{" "}
                  kelsa
                </Text>
              </Link>

              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => setSearchOpen(true)}
              >
                <Ionicons
                  name="search"
                  size={24}
                  color="#333"
                />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={25}
              color="#333"
            />

            {requestCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {requestCount > 99
                    ? "99+"
                    : requestCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* BOTTOM TABS */}
        <View style={styles.tabsContainer}>
          <NativeTabs
            backgroundColor="rgba(255, 255, 255, 0.1)"
            badgeBackgroundColor="#FF3B30"
            badgeTextColor="#fff"
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

            {/* HOME */}
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

            {/* CHAT */}
            <NativeTabs.Trigger name="chat">
              <Icon
                src={
                  <VectorIcon
                    family={Ionicons}
                    name="chatbubble"
                  />
                }
              />
              {unreadMessageCount > 0 && (
                <Badge>
                  {unreadMessageCount > 99
                    ? "99+"
                    : String(unreadMessageCount)}
                </Badge>
              )}
              <Label>Chat</Label>
            </NativeTabs.Trigger>

            {/* PROFILE */}
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
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    backgroundColor: "#fff",

    // optional shadow
    elevation: 3,
  },

  menuButton: {
    padding: 5,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 15,
  },

  tabsContainer: {
    flex: 1,
  },

  // =========================
  // DRAWER
  // =========================

  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },

  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#fff",

    paddingTop: 60,
    paddingHorizontal: 20,

    elevation: 10,

    shadowOffset: {
      width: 4,
      height: 0,
    },

    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingBottom: 25,

    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  drawerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 18,
  },

  menuText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#333",
  },
  menuOverlay: {
    flex: 1,
    flexDirection: "row",
  },

  sideMenu: {
    width: "70%",
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 0 },
    elevation: 10,
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 1,
  },

  menuProfile: {
    alignItems: "flex-start",
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 15,
  },

  menuProfileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },

  menuProfilePlaceholder: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationButton: {
    position: "relative",
    padding: 7,
    marginLeft: 4,
  },

  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  notificationBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  menuProfileInitial: {
    fontSize: 36,
    fontWeight: "600",
    color: "#777",
  },

  menuProfileName: {
    fontSize: 20,
    fontWeight: "600",
  },

  menuItemText: {
    fontSize: 16,
    marginLeft: 5
  },

  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    padding: 5,
  },

  menuTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 15,
  },
  searchButton: {
    marginLeft: "auto",
    padding: 6,
  },
});