import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

export default function AuthCallback() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/callback-transparent.png")}
        style={styles.logo}
        contentFit="contain"
      />
      <Text>Customize your job</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  logo: {
    width: 120,
    height: 120,
  },
});