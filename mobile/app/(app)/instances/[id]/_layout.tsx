import { Stack, useLocalSearchParams } from 'expo-router'

/**
 * Instance-scoped layout.
 * Renders a Stack with the tab group and recipe detail screens as pushed routes.
 * Instance ID is available via useLocalSearchParams in child screens.
 */
export default function InstanceLayout() {
  // Route params are consumed by child screens; destructure to keep the contract visible.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _instanceId } = useLocalSearchParams<{ id: string }>()
  void _instanceId

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="recipes/[recipeId]"
        options={{
          headerShown: true,
          title: 'Recipe',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="recipes/create"
        options={{
          headerShown: true,
          title: 'Create Recipe',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="recipes/edit/[recipeId]"
        options={{
          headerShown: true,
          title: 'Edit Recipe',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="recipes/cook/[recipeId]"
        options={{
          headerShown: false,
          // Full-screen cooking mode — no header, gestures disabled to prevent accidental exit
          gestureEnabled: false,
        }}
      />

      {/* Wines */}
      <Stack.Screen
        name="wines/[wineId]"
        options={{
          headerShown: true,
          title: 'Wine',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="wines/create"
        options={{
          headerShown: true,
          title: 'Add Wine',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="wines/edit/[wineId]"
        options={{
          headerShown: true,
          title: 'Edit Wine',
          headerBackTitle: 'Back',
        }}
      />

      {/* Media */}
      <Stack.Screen
        name="media/[mediaId]"
        options={{
          headerShown: true,
          title: 'Media',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="media/create"
        options={{
          headerShown: true,
          title: 'Add Media',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="media/edit/[mediaId]"
        options={{
          headerShown: true,
          title: 'Edit Media',
          headerBackTitle: 'Back',
        }}
      />

      {/* Nights */}
      <Stack.Screen
        name="nights/[nightId]"
        options={{
          headerShown: true,
          title: 'Night',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="nights/create"
        options={{
          headerShown: true,
          title: 'Plan Night',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="nights/edit/[nightId]"
        options={{
          headerShown: true,
          title: 'Edit Night',
          headerBackTitle: 'Back',
        }}
      />

      {/* AI */}
      <Stack.Screen
        name="ai/[sessionId]"
        options={{
          headerShown: true,
          title: 'Chat',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="ai/generate-recipe"
        options={{
          headerShown: true,
          title: 'Generate Recipe',
          headerBackTitle: 'Back',
        }}
      />

      {/* Spin the Night */}
      <Stack.Screen
        name="spin"
        options={{
          headerShown: true,
          title: 'Spin the Night',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  )
}
