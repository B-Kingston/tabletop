import { Tabs, useLocalSearchParams } from 'expo-router'
import { TabBarIcon } from '@/components/TabBarIcon'
import { useTheme } from '@/theme'

/**
 * Instance tab navigator.
 * Six tabs for the core instance features.
 */
export default function InstanceTabLayout() {
  // Route params are consumed by child screens; destructure to keep the contract visible.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _instanceId } = useLocalSearchParams<{ id: string }>()
  void _instanceId

  const { colors } = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="media"
        options={{
          tabBarLabel: 'Media',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="M" label="Media" />
          ),
          tabBarAccessibilityLabel: 'Media tab',
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          tabBarLabel: 'Recipes',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="R" label="Recipes" />
          ),
          tabBarAccessibilityLabel: 'Recipes tab',
        }}
      />
      <Tabs.Screen
        name="wines"
        options={{
          tabBarLabel: 'Wines',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="W" label="Wines" />
          ),
          tabBarAccessibilityLabel: 'Wines tab',
        }}
      />
      <Tabs.Screen
        name="nights"
        options={{
          tabBarLabel: 'Nights',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="N" label="Nights" />
          ),
          tabBarAccessibilityLabel: 'Game nights tab',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="C" label="Chat" />
          ),
          tabBarAccessibilityLabel: 'Chat tab',
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          tabBarLabel: 'AI',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="AI" label="AI" />
          ),
          tabBarAccessibilityLabel: 'AI assistant tab',
        }}
      />
    </Tabs>
  )
}
