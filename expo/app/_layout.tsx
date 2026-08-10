import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Image as ExpoImage } from "expo-image";
import { SummitProvider } from "@/contexts/SummitContext";
import { CustomMountainsProvider } from "@/contexts/CustomMountainsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { mountainImages, defaultMountainImage } from "@/constants/mountainImages";
import Colors from "@/constants/colors";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' as const },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="mountain/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="o2-equivalent"
        options={{
          title: "O₂ Equivalent",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.text,
        }}
      />
      <Stack.Screen
        name="summit-report"
        options={{
          title: "Summit Report",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.text,
        }}
      />
      <Stack.Screen
        name="add-mountain"
        options={{
          title: "Add Peak",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth"
        options={{
          title: "Sign In",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          title: "Welcome",
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: "Edit Profile",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="share-card"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  // Prefetch all hero/detail images so they're cached on disk after first launch.
  // Peak icons are bundled locally and need no prefetch.
  useEffect(() => {
    const urls = Object.values(mountainImages);
    urls.push(defaultMountainImage);
    // Also prefetch static UI background images
    urls.push(
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h9lsc5acg9fa3uka6bwlz",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ce56ixcq6dwvfeks1eq19",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/e154lkqvikg84q9a05bjl",
      "https://r2-pub.rork.com/attachments/37ju8kn02uoq9cuh159tp",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    );
    ExpoImage.prefetch(urls).catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ProfileProvider>
            <CustomMountainsProvider>
              <SummitProvider>
                <RootLayoutNav />
              </SummitProvider>
            </CustomMountainsProvider>
          </ProfileProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
