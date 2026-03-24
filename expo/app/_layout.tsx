import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SummitProvider } from "@/contexts/SummitContext";
import { CustomMountainsProvider } from "@/contexts/CustomMountainsContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.text,
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
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.text,
        }}
      />
      <Stack.Screen
        name="summit-report"
        options={{
          title: "Summit Report",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.secondary },
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
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <CustomMountainsProvider>
          <SummitProvider>
            <RootLayoutNav />
          </SummitProvider>
        </CustomMountainsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
