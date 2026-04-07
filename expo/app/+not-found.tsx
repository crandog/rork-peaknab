import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!", headerStyle: { backgroundColor: Colors.white }, headerTintColor: Colors.text }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🏔️</Text>
        <Text style={styles.title}>Trail not found</Text>
        <Text style={styles.subtitle}>This path doesn't lead anywhere</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to base camp</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.snow,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: "600",
  },
});
