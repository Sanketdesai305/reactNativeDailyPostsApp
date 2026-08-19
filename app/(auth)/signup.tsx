import { useAuth } from "@/context/AuthContext";
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const {signUp} = useAuth();

 
  const handleSignUp = async () => {
    // Implement sign-up logic here
    if (!email || !password) {
      Alert.alert("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password);
      router.push("/onboarding");
    }catch(error){
      console.error("Sign up error:", error);
      Alert.alert("Sign up failed.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Get started to Get Started</Text>
        <View style={styles.inputWrapper}>
          <TextInput autoCapitalize='none' placeholderTextColor="#999" placeholder="Email..." autoComplete="email" style={styles.input} value={email} onChangeText={setEmail} />
          <TextInput autoCapitalize='none' placeholderTextColor="#999" placeholder="Password..." secureTextEntry autoComplete="password" style={styles.input} value={password} onChangeText={setPassword} />
        </View>
        <TouchableOpacity style={styles.ButtonText} onPress={handleSignUp}>
            {loading?(<ActivityIndicator size={24} color="#fff"/>):(<Text style={{color:"#fff"}}>Sign Up</Text>)}
        </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton}
                onPress={()=>router.push("/login")}>
                    <Text style={styles.linkButtonText}>
                        Already have an account ? <Text style={styles.linkButtonTextBold}>Sign In</Text>
                    </Text>
                </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  inputWrapper: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom:10,
  },
  ButtonText:{
    backgroundColor:"#000",
    borderRadius:12,
    padding:16,
    alignItems:"center"
  },
  linkButton:{
    marginTop:24,
    alignItems:"center"
  },
  linkButtonText:{
    color:"#666",
    fontSize:14,
  },
  linkButtonTextBold:{
    fontWeight:600,
    color:"#000"
  }
})