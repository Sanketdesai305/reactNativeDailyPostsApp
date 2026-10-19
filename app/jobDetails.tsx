import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type Job = {
  id: string;
  title: string;
  description: string;
  budget: number;
  duration_hours: number | null;
  requirements: string | null;
  location: string | null;
  image_url: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  poster_completion_status: "pending" | "completed" | "disputed";
  worker_completion_status: "pending" | "completed" | "disputed";
  completed_at: string | null;
  disputed_at: string | null;
  user_id: string;
};

type Request = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  accepted_at: string | null;
};

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  profile_image_url: string | null;
};

type Payment = {
  id: string;
  amount: number;
  platform_fee: number;
  worker_amount: number;
  status: string;
  request_id: string | null;
  payer_id: string;
  worker_id: string | null;
};

type AcceptedWorker = {
  request: Request;
  profile: Profile | null;
};

export default function JobDetails() {
  const router = useRouter();
  const { user } = useAuth();
  const { postId } = useLocalSearchParams<{
    postId: string;
  }>();

  const [job, setJob] = useState<Job | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [poster, setPoster] = useState<Profile | null>(null);
  const [worker, setWorker] = useState<Profile | null>(null);
  const [acceptedWorkers, setAcceptedWorkers] = useState<AcceptedWorker[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // --------------------------------------------------
  // LOAD JOB
  // --------------------------------------------------

  const loadJobDetails = async () => {
    if (!postId) {
      return;
    }

    try {
      setIsLoading(true);

      // ------------------------------------------
      // CURRENT USER
      // ------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      setUserId(user.id);

      // ------------------------------------------
      // JOB
      // ------------------------------------------

      const { data: jobData, error: jobError } =
        await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .single();

      if (jobError) {
        throw jobError;
      }

      setJob(jobData);

      // ------------------------------------------
      // POSTER PROFILE
      // ------------------------------------------

      const { data: posterData, error: posterError } =
        await supabase
          .from("profiles")
          .select(
            "id, name, username, profile_image_url"
          )
          .eq("id", jobData.user_id)
          .single();

      if (!posterError) {
        setPoster(posterData);
      }

      // ------------------------------------------
      // PAYMENT
      // ------------------------------------------

      const {
        data: paymentData,
        error: paymentError,
      } = await supabase
        .from("payments")
        .select(
          "id, amount, platform_fee, worker_amount, status, request_id, payer_id, worker_id"
        )
        .eq("post_id", postId)
        .maybeSingle();

      if (!paymentError && paymentData) {
        setPayment(paymentData);
      } else if (paymentError) {
        console.error("Error loading job payment:", paymentError);
      }

      // ------------------------------------------
      // ACCEPTED WORKERS
      // ------------------------------------------

      const {
        data: acceptedRequestData,
        error: acceptedRequestError,
      } = await supabase
        .from("requests")
        .select("id, sender_id, receiver_id, status, accepted_at")
        .eq("post_id", postId)
        .eq("status", "accepted")
        .order("accepted_at", { ascending: false });

      if (acceptedRequestError) {
        throw acceptedRequestError;
      }

      const acceptedRequests: Request[] = acceptedRequestData ?? [];
      const acceptedWorkerIds = [
        ...new Set(acceptedRequests.map((item) => item.sender_id)),
      ];

      const { data: acceptedWorkerProfiles, error: workerProfilesError } =
        acceptedWorkerIds.length > 0
          ? await supabase
              .from("profiles")
              .select("id, name, username, profile_image_url")
              .in("id", acceptedWorkerIds)
          : { data: [], error: null };

      if (workerProfilesError) {
        throw workerProfilesError;
      }

      setAcceptedWorkers(
        acceptedRequests.map((acceptedRequest) => ({
          request: acceptedRequest,
          profile:
            acceptedWorkerProfiles?.find(
              (profile) => profile.id === acceptedRequest.sender_id
            ) ?? null,
        }))
      );

      const assignedRequest =
        acceptedRequests.find(
          (acceptedRequest) =>
            acceptedRequest.id === paymentData?.request_id
        ) ??
        acceptedRequests.find(
          (acceptedRequest) =>
            acceptedRequest.sender_id === paymentData?.worker_id
        ) ??
        null;

      setRequest(assignedRequest);
      const assignedWorkerId =
        paymentData?.worker_id ?? assignedRequest?.sender_id;

      if (assignedWorkerId) {
        const assignedProfile =
          acceptedWorkerProfiles?.find(
            (profile) => profile.id === assignedWorkerId
          );
        setWorker(assignedProfile ?? null);
      } else {
        setWorker(null);
      }
    } catch (error) {
      console.error(
        "Error loading job details:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load job details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobDetails();
  }, [postId]);

  // --------------------------------------------------
  // DETERMINE USER ROLE
  // --------------------------------------------------

  const isPoster =
    !!job && !!userId && job.user_id === userId;

  const isWorker =
    !!request &&
    !!userId &&
    request.sender_id === userId;

  // --------------------------------------------------
  // COMPLETION STATUS
  // --------------------------------------------------

  const myCompletionStatus = isPoster
    ? job?.poster_completion_status
    : isWorker
      ? job?.worker_completion_status
      : null;

  const otherCompletionStatus = isPoster
    ? job?.worker_completion_status
    : isWorker
      ? job?.poster_completion_status
      : null;

  const assignAcceptedWorker = async (requestId: string) => {
    if (!isPoster || payment?.status !== "held") {
      Alert.alert(
        "Reassignment unavailable",
        "A worker can only be assigned while the job payment is on hold."
      );
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase.rpc("assign_accepted_worker", {
        p_request_id: requestId,
      });

      if (error) {
        console.error("Error assigning accepted worker:", error);
        Alert.alert("Unable to assign worker", error.message);
        return;
      }

      await loadJobDetails();
      Alert.alert("Worker assigned", "The job payment is assigned to this worker.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --------------------------------------------------
  // MARK COMPLETED
  // --------------------------------------------------

const markCompleted = async () => {
  if (!user || !job?.id) return;

  setIsUpdating(true);

  try {
    const { data, error } = await supabase.functions.invoke(
      "complete-job",
      {
        body: {
          postId: job.id,
          completionStatus: "completed",
        },
      }
    );

    if (error) {
      console.error("Complete job error:", error);
      throw error;
    }

    console.log("COMPLETE JOB RESPONSE:", data);

    Alert.alert(
      "Job Completed",
      data?.message || "Your completion status has been recorded."
    );

     // ------------------------------------------
    // WORKER NEEDS PAYMENT SETUP
    // ------------------------------------------

    if (data?.paymentSetupRequired) {
      Alert.alert(
        "Payment Details Required",
        "Your completion has been recorded. Please add your payment details so you can receive your payment.",
        [
          {
            text: "Set Up Now",
            onPress: () => {
              router.push({
                pathname: "./paymentSetup",
                params: {
                  postId: job.id,
                },
              });
            },
          },
          {
            text: "Later",
            style: "cancel",
          },
        ]
      );
    await loadJobDetails();
    return;
    }

  } catch (error) {
    console.error("Error marking job completed:", error);

    Alert.alert(
      "Error",
      "Unable to mark the job as completed. Please try again."
    );
  } finally {
    setIsUpdating(false);
  }
};

  // --------------------------------------------------
  // DISPUTE
  // --------------------------------------------------

const markDispute = async () => {
  if (!user || !job?.id) return;

  Alert.alert(
    "Dispute Job",
    "Are you sure you want to dispute this job?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Dispute",
        style: "destructive",
        onPress: async () => {
          setIsUpdating(true);

          try {
            const { data, error } =
              await supabase.functions.invoke(
                "complete-job",
                {
                  body: {
                    postId: job.id,
                    completionStatus: "disputed",
                  },
                }
              );

            if (error) {
              console.error("Dispute job error:", error);
              throw error;
            }

            console.log("DISPUTE RESPONSE:", data);

            Alert.alert(
              "Job Disputed",
              data?.message ||
                "The job has been marked as disputed."
            );

            await loadJobDetails();

          } catch (error) {
            console.error(
              "Error disputing job:",
              error
            );

            Alert.alert(
              "Error",
              "Unable to submit the dispute. Please try again."
            );
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]
  );
};

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading job...
        </Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Job not found.
        </Text>
      </View>
    );
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <SafeAreaView style={{flex:1}}>
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Job Details
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* IMAGE */}

        {job.image_url && (
          <Image
            source={{
              uri: job.image_url,
            }}
            style={styles.jobImage}
          />
        )}

        {/* TITLE */}

        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {job.title}
            </Text>

            <Text style={styles.budget}>
              ₹{job.budget}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {job.status
                ?.replace("_", " ")
                .toUpperCase()}
            </Text>
          </View>
        </View>

        {/* DESCRIPTION */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Description
          </Text>

          <Text style={styles.description}>
            {job.description}
          </Text>
        </View>

        {/* JOB INFORMATION */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Job Information
          </Text>

          <InfoRow
            icon="cash-outline"
            label="Budget"
            value={`₹${job.budget}`}
          />

          <InfoRow
            icon="time-outline"
            label="Duration"
            value={
              job.duration_hours
                ? `${job.duration_hours} hours`
                : "Not specified"
            }
          />

          <InfoRow
            icon="location-outline"
            label="Location"
            value={
              job.location || "Not specified"
            }
          />
        </View>

        {/* REQUIREMENTS */}

        {job.requirements && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Requirements
            </Text>

            <Text style={styles.description}>
              {job.requirements}
            </Text>
          </View>
        )}

        {/* POSTER */}

        {poster && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Poster
            </Text>

            <ProfileRow profile={poster} />
          </View>
        )}

        {/* WORKER */}

        {worker && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Assigned worker
            </Text>

            <ProfileRow profile={worker} />
          </View>
        )}

        {isPoster && acceptedWorkers.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Accepted workers
            </Text>

            {acceptedWorkers.map(({ request: acceptedRequest, profile }) => {
              const isAssigned =
                payment?.request_id === acceptedRequest.id ||
                (!payment?.request_id &&
                  payment?.worker_id === acceptedRequest.sender_id);

              return (
                <View key={acceptedRequest.id} style={styles.acceptedWorkerRow}>
                  <View style={styles.acceptedWorkerProfile}>
                    {profile ? (
                      <ProfileRow profile={profile} />
                    ) : (
                      <Text style={styles.profileName}>Worker</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.assignButton,
                      (isAssigned ||
                        isUpdating ||
                        payment?.status !== "held") &&
                        styles.assignButtonDisabled,
                    ]}
                    disabled={
                      isAssigned ||
                      isUpdating ||
                      payment?.status !== "held"
                    }
                    onPress={() =>
                      void assignAcceptedWorker(acceptedRequest.id)
                    }
                  >
                    <Text style={styles.assignButtonText}>
                      {isAssigned
                        ? "Assigned"
                        : payment?.worker_id
                          ? "Reassign"
                          : "Assign"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {payment?.status !== "held" && (
              <Text style={styles.reassignmentNote}>
                Reassignment is unavailable because the payment is no longer on hold.
              </Text>
            )}
          </View>
        )}

        {/* PAYMENT */}

        {payment && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Payment
            </Text>

            <InfoRow
              icon="card-outline"
              label="Job amount"
              value={`₹${payment.amount}`}
            />

            <InfoRow
              icon="remove-circle-outline"
              label="Platform fee"
              value={`₹${payment.platform_fee}`}
            />

            <InfoRow
              icon="wallet-outline"
              label="Worker receives"
              value={`₹${payment.worker_amount}`}
            />

            <InfoRow
              icon="information-circle-outline"
              label="Payment status"
              value={payment.status.toUpperCase()}
            />
          </View>
        )}

        {/* CHAT */}

        {poster && userId !== poster.id && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => {
              router.push({
                pathname: "/chat/[userId]",
                params: {
                  userId: poster.id,
                  postId: job.id,
                },
              });
            }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color="#fff"
            />

            <Text style={styles.chatButtonText}>
              Chat
            </Text>
          </TouchableOpacity>
        )}

        {/* COMPLETION STATUS */}

        {isPoster || isWorker ? (
          <View style={styles.completionCard}>
            <Text style={styles.sectionTitle}>
              Job Completion
            </Text>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>
                Your status
              </Text>

              <StatusText
                status={
                  myCompletionStatus || "pending"
                }
              />
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>
                Other party
              </Text>

              <StatusText
                status={
                  otherCompletionStatus || "pending"
                }
              />
            </View>

            {/* WAITING */}

            {myCompletionStatus ===
              "completed" &&
              otherCompletionStatus ===
                "pending" && (
                <View style={styles.infoBox}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                  />

                  <Text style={styles.infoText}>
                    You marked the job as completed.
                    Waiting for the other party.
                  </Text>
                </View>
              )}

            {/* BOTH COMPLETED */}

            {myCompletionStatus ===
              "completed" &&
              otherCompletionStatus ===
                "completed" && (
                <View style={styles.successBox}>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                  />

                  <Text style={styles.infoText}>
                    Both parties marked the job
                    completed. Payment can now be
                    released.
                  </Text>
                </View>
              )}

            {/* DISPUTED */}

            {(myCompletionStatus ===
              "disputed" ||
              otherCompletionStatus ===
                "disputed") && (
              <View style={styles.disputeBox}>
                <Ionicons
                  name="warning-outline"
                  size={22}
                />

                <Text style={styles.infoText}>
                  This job is currently disputed.
                  Payment will remain on hold.
                </Text>
              </View>
            )}

            {/* ACTION BUTTONS */}

            {myCompletionStatus === "pending" &&
              job.status === "in_progress" && (
                <>
                  <TouchableOpacity
                    style={styles.completedButton}
                    onPress={markCompleted}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={21}
                          color="#fff"
                        />

                        <Text
                          style={
                            styles.actionButtonText
                          }
                        >
                          Completed
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.disputeButton}
                    onPress={markDispute}
                    disabled={isUpdating}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={21}
                      color="#fff"
                    />

                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      Dispute
                    </Text>
                  </TouchableOpacity>
                </>
              )}
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

// --------------------------------------------------
// INFO ROW
// --------------------------------------------------

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon}
        size={20}
        color="#666"
      />

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

// --------------------------------------------------
// PROFILE ROW
// --------------------------------------------------

function ProfileRow({
  profile,
}: {
  profile: Profile;
}) {
  return (
    <View style={styles.profileRow}>
      {profile.profile_image_url ? (
        <Image
          source={{
            uri: profile.profile_image_url,
          }}
          style={styles.profileImage}
        />
      ) : (
        <View style={styles.profilePlaceholder}>
          <Ionicons
            name="person"
            size={24}
            color="#777"
          />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.profileName}>
          {profile.name || "User"}
        </Text>

        {profile.username && (
          <Text style={styles.username}>
            @{profile.username}
          </Text>
        )}
      </View>
    </View>
  );
}

// --------------------------------------------------
// STATUS
// --------------------------------------------------

function StatusText({
  status,
}: {
  status: string;
}) {
  let text = "Pending";

  if (status === "completed") {
    text = "✓ Completed";
  }

  if (status === "disputed") {
    text = "⚠ Disputed";
  }

  return (
    <Text style={styles.completionStatus}>
      {text}
    </Text>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f8",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f8",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#666",
  },

  errorText: {
    fontSize: 16,
    color: "#555",
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  jobImage: {
    width: "100%",
    height: 230,
    backgroundColor: "#ddd",
  },

  section: {
    padding: 18,
    backgroundColor: "#fff",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
  },

  budget: {
    fontSize: 21,
    fontWeight: "800",
    color: "#6C63FF",
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#eee",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },

  card: {
    marginTop: 12,
    padding: 18,
    backgroundColor: "#fff",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginBottom: 14,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: "#555",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 42,
    gap: 10,
  },

  infoLabel: {
    fontSize: 14,
    color: "#777",
    flex: 1,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    maxWidth: "50%",
    textAlign: "right",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  profilePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },

  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  username: {
    marginTop: 3,
    fontSize: 13,
    color: "#777",
  },

  acceptedWorkerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  acceptedWorkerProfile: {
    flex: 1,
  },

  assignButton: {
    minWidth: 88,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#6C63FF",
    alignItems: "center",
  },

  assignButtonDisabled: {
    backgroundColor: "#aaa",
  },

  assignButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  reassignmentNote: {
    marginTop: 10,
    fontSize: 13,
    color: "#777",
  },

  chatButton: {
    marginHorizontal: 18,
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6C63FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  chatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  completionCard: {
    marginTop: 16,
    marginHorizontal: 18,
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  statusLabel: {
    fontSize: 14,
    color: "#666",
  },

  completionStatus: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  infoBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f1f1f1",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  successBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#e9f8ee",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  disputeBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff0f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },

  completedButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 13,
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  disputeButton: {
    marginTop: 10,
    height: 52,
    borderRadius: 13,
    backgroundColor: "#dc3545",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});