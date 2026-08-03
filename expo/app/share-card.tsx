import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Share as ShareIcon } from 'lucide-react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import qrcode from 'qrcode-generator';
import OxygenInfoButton from '@/components/OxygenInfoButton';
import Colors from '@/constants/colors';
import { useSummits, type SummitRecord } from '@/contexts/SummitContext';
import { useFindMountain } from '@/hooks/useAllMountains';
import { getMountainIconUrl } from '@/constants/mountainIcons';
import { getMountainImage } from '@/constants/mountainImages';
import type { Mountain } from '@/constants/mountains';

type CardStyle = 'stamp' | 'expedition' | 'photo' | 'story';
type FieldKey = 'date' | 'summitTime' | 'route' | 'timeToSummit' | 'roundTrip' | 'conditions' | 'accolade' | 'o2';

const SERIF_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = CARD_WIDTH * 5 / 4;
const STORY_WIDTH = CARD_HEIGHT * 9 / 16;

const APP_LINK = 'https://apps.apple.com/app/id6790620432';
const SHARE_CAPTION = `Climbed with PeakNab — ${APP_LINK}`;

// Facebook/Meta App ID for Instagram Stories deep-link sharing.
// Create one at https://developers.facebook.com/apps/ (select "Consumer" type,
// add the "Instagram Graph API" product). Enter the numeric App ID here.
// Without it, Instagram shows: "The app you shared from doesn't currently
// support sharing to Stories." The link sticker also requires this App ID
// to be associated with your Instagram Business/Creator account.
const FACEBOOK_APP_ID = '';

function getAccolade(mountain: Mountain): string | undefined {
  const accolades: Record<string, string> = {
    everest: 'One of the 7 Summits · Highest point on Earth',
    aconcagua: 'One of the 7 Summits · Highest point in South America',
    denali: 'One of the 7 Summits · Highest point in North America',
    kilimanjaro: 'One of the 7 Summits · Highest point in Africa',
    elbrus: 'One of the 7 Summits · Highest point in Europe',
    vinson: 'One of the 7 Summits · Highest point in Antarctica',
    carstensz: 'One of the 7 Summits · Highest point in Oceania',
  };
  if (accolades[mountain.id]) return accolades[mountain.id];
  if (mountain.elevation >= 8000) return 'One of the 14 eight-thousanders';
  if (mountain.tags?.includes('volcanic')) return 'One of the Volcanic 7 Summits';
  if (mountain.category === '14ers') return 'Colorado 14er';
  return undefined;
}

function getO2Percent(mountain: Mountain): number {
  return Math.round(Math.pow(1 - 2.25577e-5 * mountain.elevation, 5.25588) * 100);
}

function getO2Value(mountain: Mountain): string {
  return getO2Percent(mountain) + '% of sea level';
}

function formatStampDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.toUpperCase();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFirstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/);
  let sentence = match ? match[0] : text;
  sentence = sentence.trim();
  if (sentence.length > 60) sentence = sentence.substring(0, 59) + '…';
  return sentence;
}

function WaxSeal({ size = 54 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={10} fill="#C0392B" />
      <Circle cx={19.5} cy={7.5} r={3.2} fill="#C0392B" />
      <Circle cx={9} cy={20} r={2.6} fill="#C0392B" />
      <Circle cx={13} cy={13} r={7} fill="none" stroke="#8E2A1F" strokeWidth={1.2} />
      <Path d="M8.5 13.5 L11.5 16.5 L17.5 9.5" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function Wordmark({ color = Colors.text, size = 14 }: { color?: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color }}>
      <Text style={{ fontWeight: '800' as const }}>Peak</Text>
      <Text style={{ fontStyle: 'italic' as const }}>Nab</Text>
    </Text>
  );
}

function SnowOverlay({ width, height }: { width: number; height: number }) {
  const flakes = useMemo(() => {
    const result: { cx: number; cy: number; r: number; opacity: number }[] = [];
    for (let i = 0; i < 35; i++) {
      const xRand = Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453) % 1;
      const yRand = Math.abs(Math.sin((i + 1) * 78.233) * 43758.5453) % 1;
      result.push({
        cx: xRand * width,
        cy: yRand * height * 0.67,
        r: 0.8 + xRand * 1.2,
        opacity: 0.4 + yRand * 0.5,
      });
    }
    return result;
  }, [width, height]);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
      {flakes.map((f, i) => (
        <Circle key={i} cx={f.cx} cy={f.cy} r={f.r} fill="white" opacity={f.opacity} />
      ))}
    </Svg>
  );
}

function QRCode({ value, size, color = '#fff' }: { value: string; size: number; color?: string }) {
  const modules = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(value);
    q.make();
    const count = q.getModuleCount();
    const cells: { x: number; y: number }[] = [];
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (q.isDark(row, col)) {
          cells.push({ x: col, y: row });
        }
      }
    }
    return { cells, count };
  }, [value]);

  const moduleSize = size / modules.count;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {modules.cells.map((cell, i) => (
        <Rect
          key={i}
          x={cell.x * moduleSize}
          y={cell.y * moduleSize}
          width={moduleSize}
          height={moduleSize}
          fill={color}
        />
      ))}
    </Svg>
  );
}

function QRTile({ size = 44 }: { size?: number }) {
  return (
    <View style={styles.qrTile}>
      <QRCode value={APP_LINK} size={size} color="#fff" />
      <Text style={styles.qrTileCaption}>Get PeakNab</Text>
    </View>
  );
}

interface CardProps {
  mountain: Mountain;
  record: SummitRecord | undefined;
  enabled: Record<FieldKey, boolean>;
  showQR: boolean;
  width: number;
  height: number;
}

function StampCard({ mountain, record, enabled, showQR, width, height }: CardProps) {
  const iconUrl = getMountainIconUrl(mountain.id);
  const accolade = getAccolade(mountain);

  const statFields: { label: string; value: string }[] = [];
  if (enabled.summitTime && record?.summitTime) {
    statFields.push({ label: 'SUMMIT TIME', value: record.summitTime });
  }
  if (enabled.timeToSummit && record?.timeToSummit) {
    statFields.push({ label: 'TIME TO SUMMIT', value: record.timeToSummit });
  }
  if (enabled.route && record?.route) {
    statFields.push({ label: 'ROUTE', value: record.route });
  }

  const dateLine = enabled.summitTime && record?.summitTime
    ? `SUMMIT AT ${record.summitTime.toUpperCase()} · ${formatStampDate(record.date)}`
    : formatStampDate(record?.date ?? '');

  return (
    <View style={[styles.stampCard, { width, height }]}>
      <View style={styles.stampTopSection}>
        <LinearGradient
          colors={['#C9DCEE', '#EFF4FA']}
          style={StyleSheet.absoluteFillObject}
        />
        <Image
          source={{ uri: iconUrl }}
          style={styles.stampIcon}
          contentFit="contain"
        />
        <View style={styles.stampBadge}>
          <Text style={styles.stampBadgeText}>SUMMITED</Text>
        </View>
      </View>
      <View style={styles.stampBody}>
        <View style={styles.stampInfo}>
          <Text style={styles.stampPeakName}>{mountain.name}</Text>
          <Text style={styles.stampLocation}>
            {mountain.country} · {mountain.range} · {mountain.elevation.toLocaleString()}m / {mountain.elevationFt.toLocaleString()}ft
          </Text>
          {enabled.accolade && accolade && (
            <View style={styles.stampAccoladePill}>
              <Text style={styles.stampAccoladeText}>{'★'} {accolade.toUpperCase()}</Text>
            </View>
          )}
        </View>
        {statFields.length > 0 && (
          <View style={styles.stampStatRow}>
            {statFields.slice(0, 3).map((f, i) => (
              <View key={i} style={styles.stampStatCell}>
                <Text style={styles.stampStatValue}>{f.value}</Text>
                <Text style={styles.stampStatLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.stampFooter}>
          <Text style={styles.stampDateLine}>{dateLine}</Text>
          <View style={styles.stampFooterRight}>
            <Wordmark color={Colors.primary} size={13} />
            {showQR && (
              <View style={styles.stampQR}>
                <QRCode value={APP_LINK} size={24} color="#fff" />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function ExpeditionCard({ mountain, record, enabled, width, height }: CardProps) {
  const iconUrl = getMountainIconUrl(mountain.id);
  const accolade = getAccolade(mountain);

  const summitedValue = enabled.summitTime && record?.summitTime
    ? `${record.summitTime}, ${formatLongDate(record.date)}`
    : formatLongDate(record?.date ?? '');

  const rows: { label: string; value: string }[] = [
    { label: 'ELEVATION', value: `${mountain.elevation.toLocaleString()}m / ${mountain.elevationFt.toLocaleString()}ft` },
  ];
  if (enabled.date) {
    rows.push({ label: 'SUMMITED', value: summitedValue });
  }
  if (enabled.route && record?.route) {
    rows.push({ label: 'ROUTE', value: record.route });
  }
  if (enabled.timeToSummit && record?.timeToSummit) {
    rows.push({ label: 'TIME TO SUMMIT', value: record.timeToSummit });
  }
  if (enabled.roundTrip && record?.roundTrip) {
    rows.push({ label: 'SUMMIT DAY LENGTH', value: record.roundTrip });
  }
  if (enabled.conditions && record?.conditions) {
    rows.push({ label: 'CONDITIONS', value: record.conditions });
  }

  return (
    <View style={[styles.expeditionCard, { width, height }]}>
      <View style={styles.expeditionInner}>
        <Text style={styles.expeditionHeader}>SUMMIT RECORD</Text>
        <Text style={styles.expeditionPeakName}>{mountain.name}</Text>
        <Text style={styles.expeditionLocation}>
          {mountain.country} · {mountain.range} · {mountain.elevation.toLocaleString()}m
        </Text>
        {enabled.accolade && accolade && (
          <Text style={styles.expeditionAccolade}>{accolade}</Text>
        )}
        <View style={styles.expeditionDivider} />
        {rows.map((row, i) => (
          <View key={i} style={styles.expeditionRow}>
            <Text style={styles.expeditionRowLabel}>{row.label}</Text>
            <Text style={styles.expeditionRowValue} numberOfLines={2}>{row.value}</Text>
          </View>
        ))}
        <View style={styles.expeditionIconWrap}>
          <Image
            source={{ uri: iconUrl }}
            style={styles.expeditionIcon}
            contentFit="contain"
          />
        </View>
        <View style={styles.expeditionFooter}>
          <Text style={styles.expeditionFooterText}>Charted with PeakNab</Text>
          <WaxSeal size={54} />
        </View>
      </View>
    </View>
  );
}

function PhotoCard({ mountain, record, enabled, showQR, width, height }: CardProps) {
  const photoSource = record?.photoUri ?? getMountainImage(mountain.id);
  const accolade = getAccolade(mountain);

  const chips: { text: string; gold?: boolean }[] = [];
  if (enabled.accolade && accolade) {
    chips.push({ text: `★ ${accolade}`, gold: true });
  }
  if (enabled.date && record?.date) {
    chips.push({ text: formatShortDate(record.date) });
  }
  if (enabled.summitTime && record?.summitTime) {
    chips.push({ text: `Summit at ${record.summitTime}` });
  }
  if (enabled.timeToSummit && record?.timeToSummit) {
    chips.push({ text: record.timeToSummit });
  }
  if (enabled.route && record?.route) {
    chips.push({ text: record.route });
  }
  if (enabled.roundTrip && record?.roundTrip) {
    chips.push({ text: record.roundTrip });
  }
  if (enabled.conditions && record?.conditions) {
    chips.push({ text: record.conditions });
  }
  if (enabled.o2) {
    chips.push({ text: `O2 ~${getO2Percent(mountain)}%` });
  }

  return (
    <View style={[styles.photoCard, { width, height }]}>
      <Image
        source={{ uri: photoSource }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(8,16,26,0)', 'rgba(8,16,26,0)', 'rgba(8,16,26,0.72)']}
        locations={[0, 0.66, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.photoTopBar}>
        <Wordmark color="#fff" size={15} />
        <View style={styles.photoBadge}>
          <Text style={styles.photoBadgeText}>SUMMITED</Text>
        </View>
      </View>
      <View style={[styles.photoBottom, showQR && styles.photoBottomWithQR]}>
        <Text style={styles.photoPeakName}>{mountain.name}</Text>
        <Text style={styles.photoLocationDate}>
          {mountain.country} · {mountain.range} · {mountain.elevation.toLocaleString()}m
          {enabled.date && record?.date ? ` · ${formatShortDate(record.date)}` : ''}
        </Text>
        {chips.length > 0 && (
          <View style={styles.photoChips}>
            {chips.map((chip, i) => (
              <View
                key={i}
                style={[styles.photoChip, chip.gold && styles.photoChipGold]}
              >
                <Text style={[styles.photoChipText, chip.gold && styles.photoChipTextGold]}>
                  {chip.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {showQR && (
        <View style={styles.photoQRTile}>
          <QRTile size={44} />
        </View>
      )}
    </View>
  );
}

function StoryCard({ mountain, record, enabled, showQR, width, height }: CardProps) {
  const photoSource = record?.photoUri ?? getMountainImage(mountain.id);
  const accolade = getAccolade(mountain);

  const gridFields: { label: string; value: string; subValue?: string }[] = [];
  if (enabled.date && record?.date) {
    gridFields.push({
      label: 'DATE',
      value: formatShortDate(record.date),
      subValue: enabled.summitTime && record?.summitTime ? record.summitTime : undefined,
    });
  }
  if (enabled.route && record?.route) {
    gridFields.push({ label: 'ROUTE', value: record.route });
  }
  if (enabled.timeToSummit && record?.timeToSummit) {
    gridFields.push({ label: 'TIME', value: record.timeToSummit });
  }
  if (enabled.roundTrip && record?.roundTrip) {
    gridFields.push({ label: 'SUMMIT DAY LENGTH', value: record.roundTrip });
  }
  if (enabled.conditions && record?.conditions) {
    gridFields.push({ label: 'CONDITIONS', value: record.conditions });
  }
  if (enabled.o2) {
    gridFields.push({ label: 'O2', value: `${getO2Percent(mountain)}%` });
  }

  const fieldsToShow = gridFields.slice(0, 6);
  const gridRows: typeof fieldsToShow[] = [];
  for (let i = 0; i < fieldsToShow.length; i += 3) {
    gridRows.push(fieldsToShow.slice(i, i + 3));
  }

  const reportSentence = record?.report ? getFirstSentence(record.report) : '';

  return (
    <View style={[styles.storyCard, { width, height }]}>
      <Image
        source={{ uri: photoSource }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(72,128,196,0.14)' }]} />
      <LinearGradient
        colors={['rgba(9,26,54,0.62)', 'rgba(13,34,68,0.24)', 'rgba(7,20,46,0.68)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <SnowOverlay width={width} height={height} />

      <View style={styles.storyContent}>
        <View style={styles.storyHeader}>
          <View style={styles.storyHeaderRow}>
            <View style={styles.storyHeaderRule} />
            <Text style={styles.storyHeaderTitle}>PEAKNAB</Text>
            <View style={styles.storyHeaderRule} />
          </View>
          <Text style={styles.storyHeaderSub}>{'·'} SUMMIT LOG {'·'}</Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={[styles.storyPanel, showQR && styles.storyPanelWithQR]}>
          <Text style={styles.storySummittedLabel}>SUMMITED</Text>
          <Text style={styles.storyPeakName}>{mountain.name}</Text>
          <Text style={styles.storyElevationLine}>
            {'◆'} {mountain.elevation.toLocaleString()} M {'·'} {mountain.elevationFt.toLocaleString()} FT {'◆'}
          </Text>
          {enabled.accolade && accolade && (
            <View style={styles.storyAccoladePill}>
              <Text style={styles.storyAccoladeText}>{accolade.toUpperCase()}</Text>
            </View>
          )}
          {fieldsToShow.length > 0 && (
            <View style={styles.storyGrid}>
              {gridRows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.storyGridRow}>
                  {row.map((field, colIdx) => (
                    <View
                      key={colIdx}
                      style={[
                        styles.storyGridCell,
                        colIdx < 2 && styles.storyGridCellBorder,
                      ]}
                    >
                      <Text style={styles.storyGridLabel}>{field.label}</Text>
                      <Text style={styles.storyGridValue} numberOfLines={2}>{field.value}</Text>
                      {field.subValue && (
                        <Text style={styles.storyGridSubValue}>{field.subValue}</Text>
                      )}
                    </View>
                  ))}
                  {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
                    <View
                      key={`empty-${i}`}
                      style={[styles.storyGridCell, i < 3 - row.length - 1 && styles.storyGridCellBorder]}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
          {reportSentence && (
            <Text style={styles.storyReportQuote}>"{reportSentence}"</Text>
          )}
          <Text style={styles.storyDiamond}>{'◆'}</Text>
        </View>
      </View>
      {showQR && (
        <View style={styles.storyQRTile}>
          <QRTile size={44} />
        </View>
      )}
    </View>
  );
}

export default function ShareCardScreen() {
  const { mountainId, createdAt } = useLocalSearchParams<{
    mountainId: string;
    createdAt: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getSummitByCreatedAt } = useSummits();
  const cardRef = useRef<View>(null);

  const mountain = useFindMountain(mountainId);
  const record = useMemo(() => {
    if (!mountainId || !createdAt) return undefined;
    return getSummitByCreatedAt(mountainId, createdAt);
  }, [mountainId, createdAt, getSummitByCreatedAt]);

  const [cardStyle, setCardStyle] = useState<CardStyle>('stamp');
  const [showQR, setShowQR] = useState(true);

  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({
    date: true,
    summitTime: false,
    route: false,
    timeToSummit: false,
    roundTrip: false,
    conditions: false,
    accolade: false,
    o2: true,
  });

  const initializedRef = useRef(false);
  useEffect(() => {
    if (record && !initializedRef.current) {
      initializedRef.current = true;
      setEnabled({
        date: true,
        summitTime: !!record.summitTime,
        route: !!record.route,
        timeToSummit: !!record.timeToSummit,
        roundTrip: !!record.roundTrip,
        conditions: !!record.conditions,
        accolade: !!(mountain ? getAccolade(mountain) : undefined),
        o2: true,
      });
    }
  }, [record, mountain]);

  const availableFields = useMemo(() => {
    const fields: { key: FieldKey; label: string }[] = [];
    if (record?.date) fields.push({ key: 'date', label: 'Date' });
    if (record?.summitTime) fields.push({ key: 'summitTime', label: 'Summit time' });
    if (record?.route) fields.push({ key: 'route', label: 'Route' });
    if (record?.timeToSummit) fields.push({ key: 'timeToSummit', label: 'Time to summit' });
    if (record?.roundTrip) fields.push({ key: 'roundTrip', label: 'Summit day length' });
    if (record?.conditions) fields.push({ key: 'conditions', label: 'Conditions' });
    if (mountain && getAccolade(mountain)) fields.push({ key: 'accolade', label: 'Accolade' });
    if (mountain) fields.push({ key: 'o2', label: 'O2' });
    return fields;
  }, [record, mountain]);

  const toggleField = (key: FieldKey) => {
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!cardRef.current) return;

    try {
      if (Platform.OS === 'web') {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          result: 'data-uri',
          width: 1080,
          height: cardStyle === 'story' ? 1920 : 1350,
        });
        const link = document.createElement('a');
        link.href = uri as string;
        link.download = 'peaknab-summit.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Native: capture the card image
      const uri = (await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: 1080,
        height: cardStyle === 'story' ? 1920 : 1350,
      })) as string;

      // Story format on iOS: try Instagram Stories deep link
      if (cardStyle === 'story' && Platform.OS === 'ios') {
        const canOpenInstagram = await Linking.canOpenURL('instagram-stories://share');

        if (canOpenInstagram && FACEBOOK_APP_ID) {
          // Open Instagram Stories with the source_application param.
          // In Expo Go we cannot write custom pasteboard items with the
          // com.instagram.sharedSticker.backgroundImage UTI key, so the
          // user selects the image from their share sheet / Photos manually.
          // The link sticker URL is copied to the clipboard for pasting.
          await Linking.openURL(
            `instagram-stories://share?source_application=${FACEBOOK_APP_ID}`,
          );

          await Clipboard.setStringAsync(APP_LINK);
          Alert.alert(
            'Add to your story',
            'In Instagram:\n\n' +
            '1. Select your summit card from the share sheet\n' +
            '2. Tap the sticker icon, add a Link sticker, and paste:\n\n' +
            APP_LINK,
          );
          return;
        }

        if (!FACEBOOK_APP_ID) {
          console.log('[Share] No FACEBOOK_APP_ID — Instagram Stories deep link unavailable');
        }
      }

      // Standard share: image + tappable App Store link
      if (Platform.OS === 'ios') {
        // iOS: Share.share with url (file) + message (caption with link) —
        // both the image and the tappable link appear in Messages, WhatsApp,
        // Mail, X, etc.
        await Share.share({
          url: uri,
          message: SHARE_CAPTION,
          title: 'Share your summit',
        });
      } else {
        // Android: Sharing.shareAsync for the image; clipboard for the link
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your summit',
        });
      }

      await Clipboard.setStringAsync(SHARE_CAPTION);
      Alert.alert(
        'Link copied',
        Platform.OS === 'ios'
          ? 'The App Store link was included in your share and copied to your clipboard.'
          : 'Caption with App Store link copied — paste it with your post.',
      );
    } catch (e) {
      console.log('Share cancelled or failed', e);
    }
  }, [cardStyle]);

  if (!mountain) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mountain not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.errorBack}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const cardDimensions = cardStyle === 'story'
    ? { width: STORY_WIDTH, height: CARD_HEIGHT }
    : { width: CARD_WIDTH, height: CARD_HEIGHT };

  const renderCard = () => {
    const props: CardProps = { mountain, record, enabled, showQR, ...cardDimensions };
    switch (cardStyle) {
      case 'stamp': return <StampCard {...props} />;
      case 'expedition': return <ExpeditionCard {...props} />;
      case 'photo': return <PhotoCard {...props} />;
      case 'story': return <StoryCard {...props} />;
    }
  };

  const styleOptions: CardStyle[] = ['stamp', 'expedition', 'photo', 'story'];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share your summit</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewContainer}>
          <View ref={cardRef} collapsable={false}>
            {renderCard()}
          </View>
        </View>

        <View style={styles.styleSwitcher}>
          {styleOptions.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.pill, cardStyle === s && styles.pillActive]}
              onPress={() => setCardStyle(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, cardStyle === s && styles.pillTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.toggleSection}>
          <Text style={styles.toggleSectionLabel}>Include on card</Text>
          <View style={styles.toggleChips}>
            {availableFields.map(f => (
              <View key={f.key} style={styles.toggleChipWrap}>
                <TouchableOpacity
                  style={[styles.toggleChip, enabled[f.key] && styles.toggleChipActive]}
                  onPress={() => toggleField(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleChipText, enabled[f.key] && styles.toggleChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
                {f.key === 'o2' && <OxygenInfoButton />}
              </View>
            ))}
            <TouchableOpacity
              style={[styles.toggleChip, showQR && styles.toggleChipActive]}
              onPress={() => setShowQR(prev => !prev)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleChipText, showQR && styles.toggleChipTextActive]}>
                App QR
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
          <ShareIcon color="#fff" size={18} />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.snow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleSwitcher: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#fff',
  },
  toggleSection: {
    gap: 10,
  },
  toggleSectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  toggleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleChipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  toggleChipTextActive: {
    color: '#fff',
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  errorBack: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600' as const,
  },

  // Stamp card
  stampCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  stampTopSection: {
    flex: 0.42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampIcon: {
    width: 110,
    height: 110,
  },
  stampBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    borderWidth: 2.5,
    borderColor: '#C0392B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '7deg' }],
  },
  stampBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#C0392B',
    letterSpacing: 1.6,
  },
  stampBody: {
    flex: 0.58,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  stampInfo: {
    alignItems: 'center',
    gap: 4,
  },
  stampPeakName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  stampLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stampAccoladePill: {
    marginTop: 6,
    backgroundColor: 'rgba(212,168,67,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stampAccoladeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 1,
    color: '#8A6D1F',
  },
  stampStatRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  stampStatCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  stampStatValue: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  stampStatLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
  },
  stampFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stampDateLine: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
    flex: 1,
    flexWrap: 'wrap',
  },

  // Expedition card
  expeditionCard: {
    backgroundColor: '#f3ecd8',
    borderRadius: 8,
    overflow: 'hidden',
  },
  expeditionInner: {
    flex: 1,
    margin: 8,
    borderWidth: 2,
    borderColor: '#8a7a5c',
    borderRadius: 8,
    padding: 18,
  },
  expeditionHeader: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: '#8a7a5c',
    fontFamily: SERIF_FONT,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  expeditionPeakName: {
    fontSize: 26,
    fontFamily: SERIF_FONT,
    color: '#3a2e12',
    marginBottom: 2,
  },
  expeditionLocation: {
    fontStyle: 'italic' as const,
    fontFamily: SERIF_FONT,
    fontSize: 13,
    color: '#5c503b',
  },
  expeditionAccolade: {
    fontStyle: 'italic' as const,
    fontFamily: SERIF_FONT,
    fontSize: 11,
    color: '#9A7B26',
    marginTop: 4,
  },
  expeditionDivider: {
    height: 1,
    backgroundColor: '#c8a24a',
    marginVertical: 10,
  },
  expeditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 3,
  },
  expeditionRowLabel: {
    fontSize: 9.5,
    fontWeight: '600' as const,
    color: '#8a7a5c',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    fontFamily: SERIF_FONT,
  },
  expeditionRowValue: {
    fontSize: 12,
    fontFamily: SERIF_FONT,
    color: '#3a2e12',
    flex: 1,
    textAlign: 'right',
  },
  expeditionIconWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expeditionIcon: {
    width: 92,
    height: 92,
    opacity: 0.92,
  },
  expeditionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  expeditionFooterText: {
    fontFamily: SERIF_FONT,
    fontStyle: 'italic' as const,
    fontSize: 11,
    color: '#8a7a5c',
  },

  // Photo card
  photoCard: {
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoTopBar: {
    position: 'absolute' as const,
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  photoBadge: {
    backgroundColor: '#C0392B',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    transform: [{ rotate: '4deg' }],
  },
  photoBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1.4,
  },
  photoBottom: {
    position: 'absolute' as const,
    bottom: 16,
    left: 16,
    right: 16,
    gap: 6,
    zIndex: 10,
  },
  photoPeakName: {
    fontSize: 23,
    fontWeight: '800' as const,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photoLocationDate: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.92)',
  },
  photoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  photoChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoChipText: {
    fontSize: 10.5,
    fontWeight: '700' as const,
    color: '#fff',
  },
  photoChipGold: {
    backgroundColor: 'rgba(212,168,67,0.88)',
    borderColor: 'rgba(212,168,67,1)',
  },
  photoChipTextGold: {
    color: '#2A1F05',
  },

  // Story card
  storyCard: {
    backgroundColor: '#0a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  storyContent: {
    flex: 1,
    paddingTop: 24,
  },
  storyHeader: {
    alignItems: 'center',
    gap: 4,
  },
  storyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyHeaderRule: {
    width: 30,
    height: 1,
    backgroundColor: '#D4A843',
  },
  storyHeaderTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 6,
    color: '#D4A843',
  },
  storyHeaderSub: {
    fontSize: 11,
    letterSpacing: 5,
    color: 'rgba(255,255,255,0.85)',
  },
  storyPanel: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.55)',
    backgroundColor: 'rgba(11,28,58,0.52)',
    borderRadius: 8,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  storySummittedLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 6,
    color: '#fff',
  },
  storyPeakName: {
    fontSize: 44,
    fontFamily: SERIF_FONT,
    color: '#F5F1E6',
    textAlign: 'center',
  },
  storyElevationLine: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#D4A843',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  storyAccoladePill: {
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.6)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  storyAccoladeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    color: '#D4A843',
    textTransform: 'uppercase' as const,
    textAlign: 'center',
  },
  storyGrid: {
    marginTop: 6,
    width: '100%',
  },
  storyGridRow: {
    flexDirection: 'row',
  },
  storyGridCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 2,
  },
  storyGridCellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(212,168,67,0.35)',
  },
  storyGridLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  storyGridValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
  },
  storyGridSubValue: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#D4A843',
  },
  storyReportQuote: {
    fontSize: 16,
    fontFamily: SERIF_FONT,
    fontStyle: 'italic' as const,
    color: '#F5F1E6',
    textAlign: 'center',
    marginTop: 4,
  },
  storyDiamond: {
    fontSize: 12,
    color: '#D4A843',
    marginTop: 4,
  },
  // QR tile styles
  qrTile: {
    backgroundColor: 'rgba(11, 28, 58, 0.85)',
    borderRadius: 6,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrTileCaption: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '600' as const,
  },
  stampFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stampQR: {
    backgroundColor: 'rgba(11, 28, 58, 0.85)',
    borderRadius: 4,
    padding: 3,
  },
  photoQRTile: {
    position: 'absolute' as const,
    bottom: 16,
    right: 16,
    zIndex: 15,
  },
  storyQRTile: {
    position: 'absolute' as const,
    bottom: 16,
    right: 16,
    zIndex: 15,
  },
  photoBottomWithQR: {
    right: 72,
  },
  storyPanelWithQR: {
    marginBottom: 70,
  },
});
