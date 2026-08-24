import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function HelpSupport() {
  const openEmail = () => {
    Linking.openURL(
      "mailto:desai.sanket9233@gmail.com?subject=Kelsa Support"
    );
  };

  const callSupport = () => {
    Linking.openURL("tel:+918123359912");
  };

  return (
    <View style={styles.container}>
        
      <Text style={styles.title}>
        Help & Support
      </Text>

      <Text style={styles.subtitle}>
        Need help with Kelsa? We're here to help.
      </Text>

      {/* EMAIL */}

      <TouchableOpacity
        style={styles.contactCard}
        onPress={openEmail}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="mail-outline"
            size={24}
            color="#6C63FF"
          />
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>
            Email Support
          </Text>

          <Text style={styles.contactValue}>
            desai.sanket9233@gmail.com
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#999"
        />
      </TouchableOpacity>

      {/* PHONE */}

      <TouchableOpacity
        style={styles.contactCard}
        onPress={callSupport}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="call-outline"
            size={24}
            color="#6C63FF"
          />
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>
            Support Call
          </Text>

          <Text style={styles.contactValue}>
            +91 8123359912
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#999"
        />
      </TouchableOpacity>

      {/* INFORMATION */}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          How can we help?
        </Text>

        <Text style={styles.infoText}>
          For account issues, job posting problems,
          requests, messaging, or other questions,
          contact us using the options above.
        </Text>

        <Text style={styles.infoText}>
          When contacting support, please include
          enough information about the issue so we
          can help you resolve it quickly.
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 28,
    lineHeight: 22,
  },

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    marginBottom: 12,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eeeaff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  contactInfo: {
    flex: 1,
  },

  contactTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },

  contactValue: {
    fontSize: 14,
    color: "#666",
  },

  infoCard: {
    marginTop: 16,
    padding: 18,
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 10,
  },

  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#666",
    marginBottom: 8,
  },
});