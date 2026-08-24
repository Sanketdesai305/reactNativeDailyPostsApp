import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={26}
            color="#222"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Privacy Policy
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Privacy Policy
        </Text>

        <Text style={styles.updated}>
          Last updated: August 24, 2026
        </Text>

        <Text style={styles.intro}>
          Kelsa respects your privacy. This Privacy
          Policy explains what information we collect,
          how we use it, and how you can manage your
          information when using the Kelsa app.
        </Text>

        {/* 1 */}
        <SectionTitle title="1. Information We Collect" />

        <SectionText>
          When you use Kelsa, we may collect information
          such as:
        </SectionText>

        <Bullet text="Your email address" />
        <Bullet text="Name and username" />
        <Bullet text="Profile picture" />
        <Bullet text="Job posts and descriptions" />
        <Bullet text="Job requirements, budget, duration, and location" />
        <Bullet text="Images uploaded with job posts" />
        <Bullet text="Requests sent or received" />
        <Bullet text="Messages exchanged through the app" />

        {/* 2 */}
        <SectionTitle title="2. How We Use Your Information" />

        <SectionText>
          We use your information to provide and improve
          Kelsa's services, including:
        </SectionText>

        <Bullet text="Creating and managing your account" />
        <Bullet text="Displaying your profile and job posts" />
        <Bullet text="Allowing users to send and receive job requests" />
        <Bullet text="Providing messaging functionality" />
        <Bullet text="Sending important account-related communications" />
        <Bullet text="Providing customer support" />
        <Bullet text="Maintaining the security and functionality of the app" />

        {/* 3 */}
        <SectionTitle title="3. Information You Share" />

        <SectionText>
          Information you include in your profile or job
          posts may be visible to other Kelsa users.
        </SectionText>

        <SectionText>
          Please avoid sharing sensitive information such
          as passwords, financial information, government
          identification numbers, or other confidential
          information in your profile, job posts, or
          messages.
        </SectionText>

        {/* 4 */}
        <SectionTitle title="4. Photos and Images" />

        <SectionText>
          Kelsa allows you to upload profile pictures and
          images related to job posts. These images are
          stored using our cloud storage provider and are
          used to provide the corresponding features of
          the application.
        </SectionText>

        {/* 5 */}
        <SectionTitle title="5. Messages and Requests" />

        <SectionText>
          Kelsa stores job requests and messages so that
          users can communicate and manage their
          interactions through the application.
        </SectionText>

        <SectionText>
          Please use reasonable care when sharing personal
          information with other users.
        </SectionText>

        {/* 6 */}
        <SectionTitle title="6. Third-Party Services" />

        <SectionText>
          Kelsa uses third-party services to provide
          certain features, including:
        </SectionText>

        <Bullet
          text="Supabase — authentication, database services, and file storage."
        />

        <Bullet
          text="Resend — sending certain email communications."
        />

        <SectionText>
          These providers may process information as
          necessary to provide their services.
        </SectionText>

        {/* 7 */}
        <SectionTitle title="7. Account Deletion" />

        <SectionText>
          You can delete your Kelsa account through the
          application.
        </SectionText>

        <SectionText>
          When you delete your account, we will delete
          your account and associated application data
          where applicable, including your profile, job
          posts, requests, messages, and uploaded images.
        </SectionText>

        <SectionText>
          Some information may be retained where
          necessary for legal, security, or legitimate
          operational purposes.
        </SectionText>

        {/* 8 */}
        <SectionTitle title="8. Data Security" />

        <SectionText>
          We take reasonable measures to protect your
          information. However, no internet-based service
          can guarantee that information will always be
          completely secure.
        </SectionText>

        {/* 9 */}
        <SectionTitle title="9. Changes to This Policy" />

        <SectionText>
          We may update this Privacy Policy from time to
          time. If we make changes, the updated policy
          will be made available within the Kelsa
          application.
        </SectionText>

        {/* 10 */}
        <SectionTitle title="10. Contact Us" />

        <SectionText>
          If you have questions about this Privacy Policy
          or how your information is handled, please
          contact us:
        </SectionText>

        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#6C63FF"
            />

            <View>
              <Text style={styles.contactLabel}>
                Email
              </Text>

              <Text style={styles.contactValue}>
                desai.sanket9233@gmail.com
              </Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#6C63FF"
            />

            <View>
              <Text style={styles.contactLabel}>
                Phone
              </Text>

              <Text style={styles.contactValue}>
                +91 8123359912
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          © 2026 Kelsa. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------- */
/* Reusable components              */
/* -------------------------------- */

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <Text style={styles.sectionTitle}>
      {title}
    </Text>
  );
}

function SectionText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text style={styles.sectionText}>
      {children}
    </Text>
  );
}

function Bullet({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>
        {"•"}
      </Text>

      <Text style={styles.bulletText}>
        {text}
      </Text>
    </View>
  );
}

/* -------------------------------- */
/* Styles                            */
/* -------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
    marginLeft: 15,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },

  updated: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
  },

  intro: {
    fontSize: 15,
    lineHeight: 23,
    color: "#555",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginTop: 26,
    marginBottom: 10,
  },

  sectionText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#555",
    marginBottom: 12,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingRight: 8,
  },

  bullet: {
    fontSize: 18,
    lineHeight: 22,
    color: "#6C63FF",
    marginRight: 8,
  },

  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
  },

  contactCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    padding: 16,
    marginTop: 5,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  contactLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
    marginLeft: 12,
  },

  contactValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginLeft: 12,
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginTop: 30,
  },
});