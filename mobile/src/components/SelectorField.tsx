import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native'
import { useTheme } from '@/theme'

// ── Types ─────────────────────────────────────────────────────────────────

export interface SelectorOption {
  id: string
  label: string
  subtitle?: string
}

interface SelectorFieldProps {
  label: string
  placeholder: string
  options: SelectorOption[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  disabled?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────

export function SelectorField({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  disabled = false,
}: SelectorFieldProps) {
  const { colors, spacing, typography } = useTheme()
  const [modalVisible, setModalVisible] = useState(false)
  const [search, setSearch] = useState('')

  const selectedOption = selectedId
    ? options.find((o) => o.id === selectedId)
    : null

  const openModal = useCallback(() => {
    if (!disabled) {
      setSearch('')
      setModalVisible(true)
    }
  }, [disabled])

  const filtered = search.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.subtitle?.toLowerCase().includes(search.toLowerCase()) ?? false),
      )
    : options

  const handleSelect = useCallback(
    (option: SelectorOption) => {
      onSelect(option.id)
      setModalVisible(false)
    },
    [onSelect],
  )

  const handleClear = useCallback(() => {
    onSelect(null)
  }, [onSelect])

  return (
    <View style={[styles.container, { marginBottom: spacing.lg }]}>
      <Text
        style={[
          typography.labelBold,
          { color: colors.textSecondary, marginBottom: spacing.xs },
        ]}
        accessibilityRole="none"
      >
        {label}
      </Text>

      {/* Trigger button */}
      <TouchableOpacity
        onPress={openModal}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            typography.body,
            {
              color: selectedOption ? colors.text : colors.textTertiary,
              flex: 1,
            },
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={[typography.body, { color: colors.textTertiary }]}>
          ▼
        </Text>
      </TouchableOpacity>

      {/* Clear button */}
      {selectedOption ? (
        <TouchableOpacity
          onPress={handleClear}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Clear ${label}`}
          style={{ marginTop: spacing.xs, alignSelf: 'flex-end' }}
        >
          <Text
            style={[typography.label, { color: colors.danger }]}
          >
            Clear
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                paddingTop: spacing.lg,
                maxHeight: '70%',
              },
            ]}
            // Prevent press-through on the modal itself
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                {
                  paddingHorizontal: spacing.lg,
                  paddingBottom: spacing.md,
                  borderBottomColor: colors.border,
                  borderBottomWidth: 1,
                },
              ]}
            >
              <Text style={[typography.h3, { color: colors.text }]}>
                Select {label}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={[typography.bodyBold, { color: colors.primary }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search..."
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.searchInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
                accessibilityLabel={`Search ${label}`}
              />
            </View>

            {/* List */}
            {filtered.length === 0 ? (
              <View
                style={[
                  styles.emptyContainer,
                  { padding: spacing.xl },
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    { color: colors.textTertiary, textAlign: 'center' },
                  ]}
                >
                  No {label.toLowerCase()} found.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    style={[
                      styles.optionRow,
                      {
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        borderBottomColor: colors.borderLight,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[typography.body, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.textSecondary, marginTop: 2 },
                          ]}
                          numberOfLines={1}
                        >
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {selectedId === item.id ? (
                      <Text
                        style={[
                          typography.bodyBold,
                          { color: colors.primary },
                        ]}
                      >
                        ✓
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: spacing.lg }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {},
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 44,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchInput: {
    borderWidth: 1,
    minHeight: 44,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
  },
})
