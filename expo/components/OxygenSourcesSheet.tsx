import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { ExternalLink, X, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import {
  OXYGEN_SOURCES,
  OXYGEN_EXPLAINER,
  OXYGEN_DISCLAIMER,
} from '@/constants/altitudeSources';

interface OxygenSourcesSheetProps {
  visible: boolean;
  onClose: () => void;
}

function OxygenSourcesSheet({ visible, onClose }: OxygenSourcesSheetProps) {
  const handleOpenURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.log('Failed to open URL', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Info color={Colors.primary} size={18} />
              <Text style={styles.title}>About the oxygen figure</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <X color={Colors.textSecondary} size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.explainer}>{OXYGEN_EXPLAINER}</Text>
            <Text style={styles.disclaimer}>{OXYGEN_DISCLAIMER}</Text>

            <Text style={styles.sourcesHeading}>Sources</Text>
            <View style={styles.sourcesList}>
              {OXYGEN_SOURCES.map((source, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sourceRow}
                  onPress={() => handleOpenURL(source.url)}
                  activeOpacity={0.7}
                  accessibilityRole="link"
                  accessibilityLabel={`${source.title}. Opens in browser.`}
                >
                  <View style={styles.sourceText}>
                    <Text style={styles.sourceTitle}>{source.title}</Text>
                    <Text style={styles.sourceDetail}>{source.detail}</Text>
                  </View>
                  <ExternalLink
                    color={Colors.primary}
                    size={16}
                    style={styles.sourceIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 12,
  },
  explainer: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  sourcesHeading: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  sourcesList: {
    gap: 0,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sourceText: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  sourceDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  sourceIcon: {
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

export default OxygenSourcesSheet;
