import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Animated, AppState, BackHandler, FlatList, Image,
  Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useFonts } from 'expo-font';
import { Tinos_400Regular } from '@expo-google-fonts/tinos/400Regular';
import { Tinos_700Bold } from '@expo-google-fonts/tinos/700Bold';
import deck from './data/words.json';
import { dateKey, dailyGoal, grades, interval, intervalLabel, review, studyQueue } from './srs.mjs';

const c = {
  canvas: '#F0EEE4', page: '#FAF8EF', white: '#FFFDF8', ink: '#233A2C', muted: '#526155',
  green: '#234E39', mint: '#E2EBCF', edge: '#E7E3D6', purple: '#EEE7F5', purpleInk: '#5C4573',
  peach: '#F6EBDA', peachInk: '#784A25',
};
const type = Platform.select({
  ios: {
    regular: { fontFamily: 'TimesNewRomanPSMT' },
    bold: { fontFamily: 'TimesNewRomanPS-BoldMT' },
  },
  web: {
    regular: { fontFamily: '"Times New Roman", Tinos_400Regular, serif' },
    bold: { fontFamily: '"Times New Roman", Tinos_700Bold, serif', fontWeight: '700' },
  },
  default: {
    regular: { fontFamily: 'Tinos_400Regular' },
    bold: { fontFamily: 'Tinos_700Bold' },
  },
});
const tabs = [
  { id: 'home', label: 'Vườn học', icon: 'home' },
  { id: 'words', label: 'Từ vựng', icon: 'book-open' },
  { id: 'progress', label: 'Tiến độ', icon: 'bar-chart-2' },
];
const storageKey = 'vuon-tu-vung.progress.v1';
const formatCount = value => value.toLocaleString('vi-VN');
const showWord = word => word === 'i' ? 'I' : word;
const searchable = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const searchTerms = deck.map(([word, , , meaning]) => searchable(`${word} ${meaning}`));

function Label({ children, style, ...props }) {
  return <Text {...props} style={[styles.text, style]}>{children}</Text>;
}

function Icon({ name, size = 20, color = c.ink }) {
  return <Feather name={name} size={size} color={color} accessibilityElementsHidden
    importantForAccessibility="no" aria-hidden />;
}

function IconButton({ icon, label, onPress, style }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [styles.iconButton, style, pressed && styles.pressed]}><Icon name={icon} /></Pressable>;
}

function Button({ label, icon, onPress, disabled, secondary, busy }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, busy: !!busy }}
    disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, pressed && styles.pressed]}>
    {busy ? <ActivityIndicator color={c.white} /> : <>
      <Label style={[styles.buttonText, secondary && { color: c.green }]}>{label}</Label>
      {icon && <Icon name={icon} size={18} color={secondary ? c.green : c.white} />}
    </>}
  </Pressable>;
}

function ProgressBar({ value, max, label, onDark }) {
  return <View style={[styles.track, onDark && styles.trackDark]} accessibilityRole="progressbar" accessibilityLabel={label}
    aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
    <View style={[styles.fill, onDark && styles.fillLight, { width: `${value / max * 100}%` }]} />
  </View>;
}

function Metric({ icon, value, label, lavender }) {
  return <View style={[styles.metric, lavender && styles.metricLavender]}>
    <View style={styles.metricTop}>
      <View style={styles.metricIcon}>
        <Icon name={icon} size={17} color={lavender ? c.purpleInk : c.peachInk} />
      </View>
      <Label style={[styles.metricNumber, lavender && { color: c.purpleInk }]}>{formatCount(value)}</Label>
    </View>
    <Label style={styles.metricLabel}>{label}</Label>
  </View>;
}

function SproutMark() {
  return <View style={styles.brandIcon} accessible={false} aria-hidden>
    <View style={styles.sproutStem} />
    <View style={[styles.sproutLeaf, styles.sproutLeft]} />
    <View style={[styles.sproutLeaf, styles.sproutRight]} />
  </View>;
}

function GardenHero() {
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 370;
  const largeText = fontScale >= 1.4;
  return <View style={styles.hero}>
    {!largeText && <>
      <View style={styles.heroHalo} pointerEvents="none" aria-hidden />
      <Image source={require('./assets/garden-reader.png')} style={[styles.heroArt, compact && styles.heroArtCompact]} resizeMode="contain"
        pointerEvents="none" accessible={false} aria-hidden accessibilityIgnoresInvertColors />
    </>}
    <View style={[styles.heroCopy, compact && styles.heroCopyCompact, largeText && styles.heroCopyWide]}>
      <View style={styles.heroDash} aria-hidden />
      <Label style={[styles.heroTitle, compact && styles.heroTitleCompact]} accessibilityRole="header">Học từ mới{'\n'}mỗi ngày</Label>
      <Label style={styles.heroText}>3.000 từ tiếng Anh{largeText ? ' ' : '\n'}thông dụng</Label>
    </View>
  </View>;
}

function Home({ queue, count, introduced, onStart }) {
  const total = queue.due.length + queue.fresh.length;
  const canLearnMore = introduced >= dailyGoal && count < deck.length;
  return <ScrollView contentContainerStyle={styles.content}>
    <GardenHero />
    <Label style={styles.sectionTitle} accessibilityRole="header">Kế hoạch hôm nay</Label>
    <View style={styles.row}>
      <Metric icon="clock" value={queue.due.length} label="Đến hạn ôn" />
      <Metric icon="layers" value={queue.fresh.length} label="Từ mới trong lượt" lavender />
    </View>
    {total > 0 && <Button label="Bắt đầu học" icon="arrow-right" onPress={() => onStart()} />}
    {canLearnMore && <Button label="Học thêm từ mới" icon="plus" secondary={total > 0} onPress={() => onStart(true)} />}
    {!total && !canLearnMore && <Label style={styles.small}>Bạn đã học hết bộ từ. Hãy quay lại khi có thẻ đến hạn ôn.</Label>}
    <View style={styles.panel}>
      <View style={styles.spread}>
        <View style={styles.inlineTitle}>
          <Icon name="target" color={c.green} size={17} />
          <Label style={[styles.panelTitle, styles.flex]}>Mục tiêu hôm nay</Label>
        </View>
        <Label style={styles.count}>{introduced}/{dailyGoal}</Label>
      </View>
      <ProgressBar value={Math.min(introduced, dailyGoal)} max={dailyGoal} label="Mục tiêu từ mới hôm nay" />
      <Label style={styles.small}>Đã học {formatCount(count)} trên {formatCount(deck.length)} từ</Label>
    </View>
  </ScrollView>;
}

function Words({ query, setQuery, onWord }) {
  const filtered = useMemo(() => {
    const term = searchable(query.trim());
    return term ? deck.filter((_, index) => searchTerms[index].includes(term)) : deck;
  }, [query]);

  return <>
    <View style={styles.listHeader}>
      <View style={styles.spread}>
        <Label style={[styles.pageTitle, styles.flex]} accessibilityRole="header">Từ vựng</Label>
        <View style={styles.resultBadge}><Label style={styles.count}>{formatCount(filtered.length)} từ</Label></View>
      </View>
      <View style={styles.search}>
        <Icon name="search" size={20} color={c.muted} />
        <TextInput accessibilityLabel="Tìm từ vựng" placeholder="Tìm từ Anh hoặc Việt…" value={query}
          onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} placeholderTextColor={c.muted}
          style={styles.searchInput} />
        {query !== '' && <Pressable accessibilityRole="button" accessibilityLabel="Xóa tìm kiếm" onPress={() => setQuery('')}
          style={styles.clearSearch}><Icon name="x" size={18} /></Pressable>}
      </View>
    </View>
    <FlatList data={filtered} keyboardShouldPersistTaps="handled" keyExtractor={item => item[0]}
      contentContainerStyle={styles.wordList}
      ListEmptyComponent={<View style={styles.emptySearch}>
        <Icon name="search" color={c.muted} size={24} />
        <Label style={styles.small}>Không tìm thấy từ phù hợp.</Label>
      </View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => onWord(item)}
        style={({ pressed }) => [styles.wordRow, pressed && styles.pressed]}>
        <View style={styles.flex}>
          <Label style={styles.wordTitle}>{showWord(item[0])}</Label>
          <Label numberOfLines={1} style={styles.small}>{item[3]}</Label>
        </View>
        <View style={styles.wordChevron}><Icon name="chevron-right" color={c.green} size={17} /></View>
      </Pressable>} />
  </>;
}

function Progress({ count, queue, cards, now }) {
  const upcoming = Object.values(cards)
    .reduce((earliest, card) => card.due > now ? Math.min(earliest, card.due) : earliest, Infinity);
  const nextReview = Number.isFinite(upcoming) ? new Date(upcoming).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
  }) : 'Chưa có lịch ôn tiếp theo';
  return <ScrollView contentContainerStyle={styles.content}>
    <Label style={styles.pageTitle} accessibilityRole="header">Tiến độ</Label>
    <View style={[styles.panel, styles.progressPanel]}>
      <View style={styles.spread}>
        <View style={styles.flex}>
          <Label style={styles.progressLabel}>Từ đã học</Label>
          <Label style={styles.progressNumber}>{formatCount(count)}<Label style={styles.progressTotal}> / {formatCount(deck.length)}</Label></Label>
        </View>
        <View style={styles.progressIcon}><Icon name="trending-up" color="#DFEBC7" size={27} /></View>
      </View>
      <ProgressBar value={count} max={deck.length} label="Tổng số từ đã học" onDark />
    </View>
    <View style={styles.row}>
      <Metric icon="clock" value={queue.due.length} label="Đến hạn ôn" />
      <Metric icon="calendar" value={count - queue.due.length} label="Đã lên lịch ôn" lavender />
    </View>
    <View style={[styles.panel, styles.reviewPanel]}>
      <View style={styles.reviewIcon}><Icon name="calendar" color={c.green} size={19} /></View>
      <View style={styles.flex}>
        <Label style={styles.panelTitle}>Lượt ôn sắp tới</Label>
        <Label style={styles.small}>{nextReview}</Label>
      </View>
    </View>
  </ScrollView>;
}

function WordFace({ word, flipped, onFlip }) {
  const [term, pronunciation, part, meaning, example] = word;
  const transition = useRef(new Animated.Value(1)).current;
  const reducedMotion = useRef(true);
  const previousFace = useRef(flipped);

  useEffect(() => {
    let active = true;
    const onPreference = value => { if (active) reducedMotion.current = value; };
    AccessibilityInfo.isReduceMotionEnabled().then(onPreference).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', onPreference);
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (previousFace.current === flipped) return;
    previousFace.current = flipped;
    if (reducedMotion.current) {
      transition.setValue(1);
      return;
    }
    transition.setValue(0);
    const animation = Animated.timing(transition, { toValue: 1, duration: 185, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [flipped, transition]);

  const FaceBody = onFlip ? Pressable : View;
  return <View style={onFlip && styles.cardStack}>
    {onFlip && <>
      <View style={[styles.stackBase, styles.stackLower]} pointerEvents="none" aria-hidden />
      <View style={[styles.stackBase, styles.stackUpper]} pointerEvents="none" aria-hidden />
    </>}
    <View style={[styles.flash, flipped && styles.flashBack, !onFlip && styles.previewFlash]}>
      <View style={styles.flashTop}>
        <View style={[styles.pill, flipped && styles.pillBack]}><Label style={[styles.pillText, flipped && styles.pillTextBack]}>{part}</Label></View>
        <IconButton icon="volume-2" label={`Nghe phát âm ${showWord(term)}`} style={styles.soundButton}
          onPress={() => Speech.speak(showWord(term), { language: 'en-US' })} />
      </View>
      <FaceBody onPress={onFlip} accessibilityRole={onFlip ? 'button' : undefined}
        accessibilityHint={onFlip ? flipped ? 'Lật về mặt tiếng Anh' : 'Lật thẻ để xem nghĩa tiếng Việt' : undefined}
        style={styles.flashBody}>
        <Animated.View style={[styles.flashContent, {
          opacity: transition.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] }),
          transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
        }]}>
          {flipped ? <>
            <Label style={styles.answerWord}>{showWord(term)} · {pronunciation}</Label>
            <Label style={styles.meaning}>{meaning}</Label>
            {example && <View style={styles.examplePaper}><Label style={styles.example}>{example}</Label></View>}
          </> : <>
            <View style={styles.flashMark}><Icon name="book-open" size={21} color={c.green} /></View>
            <Label style={styles.english}>{showWord(term)}</Label>
            <Label style={styles.pronunciation}>{pronunciation}</Label>
          </>}
        </Animated.View>
      </FaceBody>
    </View>
  </View>;
}

function Session({ session, cards, flipped, setFlipped, onGrade, onExit, onMore, saving, error }) {
  const { fontScale } = useWindowDimensions();
  const word = session.words[session.index];
  const total = session.words.length;
  const reviewing = session.index < session.dueCount;
  if (!word) return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.done}>
      <View style={styles.doneHalo} pointerEvents="none" aria-hidden />
      <Image source={require('./assets/sprout.png')} style={styles.doneMascot} resizeMode="contain" accessible={false} aria-hidden />
      <Label style={styles.pageTitle} accessibilityRole="header">Hoàn thành!</Label>
      <Label style={[styles.small, styles.doneText]}>Bạn vừa luyện {total} thẻ. App đã lưu lịch ôn cho từng từ.</Label>
    </View>
    {onMore && <Button label="Học thêm từ mới" icon="plus" onPress={onMore} />}
    <Button label="Về vườn học" icon="home" onPress={onExit} secondary={!!onMore} />
  </ScrollView>;

  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.spread}>
      <Label style={styles.panelTitle} accessibilityRole="header">Thẻ {session.index + 1} / {total}</Label>
      <View style={[styles.sessionBadge, reviewing && styles.sessionBadgeReview]}>
        <Icon name={reviewing ? 'clock' : 'layers'} color={reviewing ? c.peachInk : c.purpleInk} size={15} />
        <Label style={[styles.sessionBadgeText, reviewing && styles.sessionBadgeTextReview]}>{reviewing ? 'Ôn tập' : 'Từ mới'}</Label>
      </View>
    </View>
    <ProgressBar value={session.index} max={total} label="Tiến độ buổi học" />
    <WordFace key={word[0]} word={word} flipped={flipped} onFlip={() => setFlipped(value => !value)} />
    {flipped ? <>
      <Label style={styles.panelTitle}>Bạn nhớ từ này đến đâu?</Label>
      <View style={styles.gradeRow}>{grades.map(grade => <Pressable key={grade.id}
        accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }}
        disabled={saving} onPress={() => onGrade(word, grade.id)}
        style={({ pressed }) => [styles.grade, fontScale > 1.2 && styles.gradeWide, { backgroundColor: grade.background },
          saving && styles.disabled, pressed && styles.pressed]}>
        <View style={styles.gradeIcon}><Icon name={grade.icon} color={grade.text} size={17} /></View>
        <Label style={[styles.gradeTitle, { color: grade.text }]}>{grade.title}</Label>
        <Label style={[styles.gradeTime, { color: grade.text }]}>{intervalLabel(interval(cards[word[0]], grade.id))}</Label>
      </Pressable>)}</View>
    </> : <Button label="Lật thẻ" icon="repeat" onPress={() => setFlipped(true)} />}
    {!!error && <Label accessibilityRole="alert" style={styles.error}>{error}</Label>}
  </ScrollView>;
}

function Main() {
  const [cards, setCards] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now);
  const [tab, setTab] = useState('home');
  const [session, setSession] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(null);
  const [credits, setCredits] = useState(false);
  const saveLock = useRef(false);

  async function load() {
    setLoadError(false);
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      setCards(stored ? JSON.parse(stored) : {});
    } catch {
      setLoadError(true);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    const listener = AppState.addEventListener('change', status => {
      if (status === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, []);

  const queue = useMemo(() => cards ? studyQueue(deck, cards, now) : null, [cards, now]);
  const count = cards ? Object.keys(cards).length : 0;
  const introduced = cards ? Object.values(cards).filter(card => card.firstDay === dateKey(now)).length : 0;

  function start(extra = false) {
    const current = Date.now();
    const { due, fresh } = studyQueue(deck, cards, current, extra);
    if (!due.length && !fresh.length) {
      setNow(current);
      return;
    }
    setError('');
    setFlipped(false);
    setSession({ words: [...due, ...fresh], dueCount: due.length, index: 0 });
  }

  async function grade([word], rating) {
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setError('');
    const current = Date.now();
    const previous = Object.hasOwn(cards, word) ? cards[word] : undefined;
    const updated = { ...cards, [word]: review(previous, rating, current) };
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      setCards(updated);
      setNow(current);
      setFlipped(false);
      setSession(value => ({ ...value, index: value.index + 1 }));
    } catch {
      setError('Chưa lưu được tiến độ. Hãy thử lại.');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function exit() {
    if (!saveLock.current) {
      setSession(null);
      setNow(Date.now());
    }
  }

  useEffect(() => {
    if (!session) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      exit();
      return true;
    });
    return () => listener.remove();
  }, [session]);

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={styles.shell} aria-hidden={credits || !!preview}
      importantForAccessibility={credits || preview ? 'no-hide-descendants' : 'auto'}>
      <View style={styles.header}>
        {session ? <>
          <IconButton icon="arrow-left" label="Về vườn học" onPress={exit} />
          <Label style={styles.brand}>Buổi học</Label>
          <View style={styles.headerSpacer} />
        </> : <>
          <SproutMark />
          <Label style={styles.brand}>Vườn Từ Vựng</Label>
          <IconButton icon="info" label="Giới thiệu và nguồn dữ liệu" onPress={() => setCredits(true)} />
        </>}
      </View>
      <View style={styles.flex}>
        {!cards ? <View style={styles.loading}>
          {loadError ? <>
            <Label accessibilityRole="alert" style={styles.error}>Chưa mở được tiến độ đã lưu.</Label>
            <Button label="Thử lại" onPress={load} />
          </> : <ActivityIndicator accessibilityLabel="Đang tải" color={c.green} />}
        </View> : session ? <Session {...{ session, cards, flipped, setFlipped, saving, error }} onGrade={grade} onExit={exit}
          onMore={introduced >= dailyGoal && count < deck.length ? () => start(true) : undefined} />
          : tab === 'home' ? <Home {...{ queue, count, introduced }} onStart={start} />
          : tab === 'words' ? <Words {...{ query, setQuery }} onWord={setPreview} />
          : <Progress {...{ count, queue, cards, now }} />}
      </View>
      {!session && cards && <View style={styles.tabBar} accessibilityRole="tablist">
        {tabs.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }}
          onPress={() => setTab(item.id)} style={({ pressed }) => [styles.tab, tab === item.id && styles.tabActive, pressed && styles.pressed]}>
          <Icon name={item.icon} size={20} color={tab === item.id ? c.green : c.muted} />
          <Label style={[styles.tabLabel, tab === item.id && styles.tabLabelActive]}>{item.label}</Label>
        </Pressable>)}
      </View>}
    </View>
    <Modal visible={credits || !!preview} transparent animationType="fade" onRequestClose={() => { setCredits(false); setPreview(null); }}>
      <View style={styles.scrim}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.spread}>
            <Label style={styles.panelTitle} accessibilityRole="header">{credits ? 'Về Vườn Từ Vựng' : 'Chi tiết từ'}</Label>
            <IconButton icon="x" label="Đóng" onPress={() => { setCredits(false); setPreview(null); }} />
          </View>
          <ScrollView>
            {credits ? <View style={styles.creditBody}>
              <Label style={styles.small}>Dữ liệu từ điển: Từ điển Anh–Việt thichhoc.com (thichhoc-dict), giấy phép CC BY-SA 4.0.</Label>
              <Label style={styles.small}>Nguồn gốc: WordNet 3.1 (Princeton), CMUdict (CMU), Wiktionary. Đã chỉnh sửa dữ liệu.</Label>
              <Label style={styles.small}>WordNet 3.1 Copyright 2011 The Trustees of Princeton University. All rights reserved.</Label>
              <Button label="Nguồn từ điển" icon="external-link" secondary onPress={() => Linking.openURL('https://github.com/thichhoc-org/thichhoc-dict')} />
              <Button label="Giấy phép dữ liệu" icon="external-link" secondary onPress={() => Linking.openURL('https://creativecommons.org/licenses/by-sa/4.0/')} />
            </View> : preview && <WordFace word={preview} flipped />}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </SafeAreaView>;
}

export default function App() {
  const [loaded, failed] = useFonts(Platform.OS === 'ios' ? {} : { Tinos_400Regular, Tinos_700Bold });
  if (!loaded && !failed) return <View style={styles.loading}><ActivityIndicator color={c.green} /></View>;
  return <SafeAreaProvider><Main /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.canvas },
  shell: { flex: 1, width: '100%', maxWidth: 510, alignSelf: 'center', backgroundColor: c.page },
  flex: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', gap: 16, padding: 24, backgroundColor: c.page },
  text: { color: c.ink, ...type.regular, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20, paddingVertical: 10, minHeight: 69 },
  headerSpacer: { width: 44 },
  brandIcon: { width: 41, height: 41, borderRadius: 15, backgroundColor: c.green },
  sproutStem: { position: 'absolute', width: 3, height: 14, top: 17, left: 19, borderRadius: 2, backgroundColor: '#DCEB9F' },
  sproutLeaf: { position: 'absolute', width: 13, height: 8, backgroundColor: '#DCEB9F' },
  sproutLeft: { top: 15, left: 8, borderTopLeftRadius: 9, borderBottomRightRadius: 9, transform: [{ rotate: '30deg' }] },
  sproutRight: { top: 11, left: 19, borderTopRightRadius: 9, borderBottomLeftRadius: 9, transform: [{ rotate: '-30deg' }] },
  brand: { flex: 1, fontSize: 19, ...type.bold, letterSpacing: -0.35 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.white, borderColor: c.edge, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.76 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 22, gap: 15 },
  hero: {
    borderRadius: 28, minHeight: 207, justifyContent: 'center', backgroundColor: '#E4EDCC', overflow: 'hidden',
    borderColor: '#D8E3BB', borderWidth: 1, position: 'relative',
  },
  heroCopy: { width: '63%', paddingLeft: 22, paddingVertical: 20 },
  heroCopyCompact: { width: '65%', paddingLeft: 19 },
  heroCopyWide: { width: '100%', paddingRight: 20 },
  heroHalo: {
    position: 'absolute', right: -54, bottom: -78, width: '74%', height: 253,
    borderRadius: 180, backgroundColor: '#D8E6BA', transform: [{ rotate: '-20deg' }],
  },
  heroArt: { position: 'absolute', width: '49%', height: '96%', right: 0, bottom: 1 },
  heroArtCompact: { width: '47%' },
  heroDash: { width: 29, height: 4, borderRadius: 4, backgroundColor: '#9EAD54', marginBottom: 12 },
  heroTitle: { ...type.bold, fontSize: 38, lineHeight: 41, letterSpacing: -1.7 },
  heroTitleCompact: { fontSize: 29, lineHeight: 34, letterSpacing: -1.15 },
  heroText: { ...type.bold, fontSize: 14, lineHeight: 19, color: c.green, marginTop: 8 },
  sectionTitle: { fontSize: 21, ...type.bold, marginTop: 3, letterSpacing: -0.45 },
  pageTitle: { fontSize: 34, lineHeight: 42, ...type.bold, letterSpacing: -1.1 },
  row: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, minWidth: 0, backgroundColor: c.peach, borderWidth: 1, borderColor: '#EDE1CE', borderRadius: 19, padding: 12, gap: 5 },
  metricLavender: { backgroundColor: c.purple, borderColor: '#E8DFF1' },
  metricTop: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 9 },
  metricIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#FFFFFF91', alignItems: 'center', justifyContent: 'center' },
  metricNumber: { ...type.bold, fontSize: 27, lineHeight: 35, letterSpacing: -0.55, color: c.peachInk },
  metricLabel: { ...type.bold, color: c.ink, fontSize: 13, lineHeight: 18 },
  small: { ...type.regular, color: c.muted, fontSize: 14, lineHeight: 20 },
  button: {
    minHeight: 54, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: c.green,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 3,
    boxShadow: '0px 3px 0px #153827',
  },
  buttonText: { color: c.white, ...type.bold, fontSize: 17, textAlign: 'center', flexShrink: 1 },
  secondary: { backgroundColor: c.mint, boxShadow: '0px 3px 0px #CFDCBA' },
  disabled: { opacity: 0.56 },
  panel: { gap: 10, backgroundColor: c.white, borderWidth: 1, borderColor: c.edge, borderRadius: 20, padding: 15 },
  panelTitle: { ...type.bold, fontSize: 16 },
  inlineTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  count: { ...type.bold, color: c.green, fontSize: 14 },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  track: { height: 9, backgroundColor: '#ECEBDD', borderRadius: 10, overflow: 'hidden' },
  trackDark: { backgroundColor: '#54735E' },
  fill: { height: '100%', borderRadius: 10, backgroundColor: '#659257' },
  fillLight: { backgroundColor: '#DCEB9F' },
  tabBar: {
    flexDirection: 'row', gap: 5, backgroundColor: c.white, borderColor: c.edge, borderWidth: 1,
    marginHorizontal: 20, marginBottom: 8, padding: 5, borderRadius: 21, boxShadow: '0px 3px 12px #233A2C0C',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 2, gap: 2, borderRadius: 16, minHeight: 49 },
  tabActive: { backgroundColor: c.mint },
  tabLabel: { color: c.muted, ...type.bold, fontSize: 12, textAlign: 'center' },
  tabLabelActive: { color: c.green, ...type.bold },
  listHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, gap: 13 },
  resultBadge: { backgroundColor: c.mint, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 },
  search: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, backgroundColor: c.white, borderWidth: 1, borderColor: c.edge, borderRadius: 16 },
  searchInput: { color: c.ink, flex: 1, paddingVertical: 10, ...type.regular, fontSize: 16 },
  clearSearch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
  wordList: { paddingHorizontal: 20, paddingBottom: 18 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8, backgroundColor: c.white, borderColor: c.edge, borderWidth: 1, borderRadius: 17 },
  wordTitle: { fontSize: 18, ...type.bold, letterSpacing: -0.35 },
  wordChevron: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: c.mint },
  emptySearch: { alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 128, borderRadius: 18, borderColor: c.edge, borderWidth: 1, backgroundColor: c.white },
  progressPanel: { backgroundColor: c.green, borderColor: '#153827', padding: 20, gap: 14 },
  progressLabel: { color: '#E4EDCC', ...type.bold, fontSize: 16 },
  progressNumber: { ...type.bold, fontSize: 44, color: c.white, letterSpacing: -1.2 },
  progressTotal: { ...type.bold, color: '#D9E6D2', fontSize: 18, letterSpacing: 0 },
  progressIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#396049', alignItems: 'center', justifyContent: 'center' },
  reviewPanel: { flexDirection: 'row', alignItems: 'center' },
  reviewIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center' },
  sessionBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.purple, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  sessionBadgeReview: { backgroundColor: c.peach },
  sessionBadgeText: { fontSize: 13, ...type.bold, color: c.purpleInk },
  sessionBadgeTextReview: { color: c.peachInk },
  cardStack: { marginBottom: 12, position: 'relative' },
  stackBase: { position: 'absolute', borderWidth: 1, borderRadius: 26, height: 48 },
  stackLower: { left: 16, right: 16, bottom: -12, backgroundColor: '#D8E6C9', borderColor: '#CADBB9' },
  stackUpper: { left: 8, right: 8, bottom: -6, backgroundColor: '#E9EEDC', borderColor: '#D7E2CB' },
  flash: { minHeight: 283, padding: 14, borderRadius: 26, backgroundColor: c.white, borderWidth: 1, borderColor: '#E3E3D2' },
  flashBack: { backgroundColor: '#F2EDF7', borderColor: '#E6D9EF' },
  previewFlash: { minHeight: 0 },
  flashTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  pill: { alignSelf: 'center', flexShrink: 1, backgroundColor: c.mint, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 11 },
  pillBack: { backgroundColor: '#E7DDF1' },
  pillText: { color: c.green, ...type.bold, fontSize: 13 },
  pillTextBack: { color: c.purpleInk },
  soundButton: { backgroundColor: c.white, borderColor: '#DFE4D5' },
  flashBody: { flexGrow: 1, justifyContent: 'center', paddingVertical: 14 },
  flashContent: { alignItems: 'center', gap: 6 },
  flashMark: { width: 44, height: 44, borderRadius: 16, backgroundColor: c.mint, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  english: { width: '100%', fontSize: 44, ...type.bold, letterSpacing: -1, textAlign: 'center' },
  pronunciation: { fontSize: 19, color: c.muted, ...type.regular, textAlign: 'center' },
  answerWord: { fontSize: 17, color: c.purpleInk, ...type.bold, textAlign: 'center' },
  meaning: { fontSize: 29, ...type.bold, textAlign: 'center', letterSpacing: -0.6 },
  examplePaper: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FFFCF999', borderRadius: 10 },
  example: { color: c.muted, ...type.regular, textAlign: 'center' },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grade: { flexBasis: '20%', flexGrow: 1, flexShrink: 0, paddingVertical: 9, paddingHorizontal: 3, alignItems: 'center', borderRadius: 15, gap: 2, borderWidth: 1, borderColor: '#233A2C0C' },
  gradeWide: { flexBasis: '45%' },
  gradeIcon: { width: 29, height: 29, borderRadius: 10, backgroundColor: '#FFFFFF76', alignItems: 'center', justifyContent: 'center' },
  gradeTitle: { ...type.bold, fontSize: 15, textAlign: 'center' },
  gradeTime: { ...type.bold, fontSize: 12, textAlign: 'center' },
  error: { color: '#993956', ...type.bold },
  done: { alignItems: 'center', gap: 8, backgroundColor: c.mint, borderRadius: 26, padding: 22, overflow: 'hidden' },
  doneHalo: { position: 'absolute', top: 11, width: 154, height: 154, borderRadius: 78, backgroundColor: '#D8E5BA' },
  doneMascot: { width: 120, height: 129, marginBottom: 5 },
  doneText: { textAlign: 'center' },
  scrim: { flex: 1, backgroundColor: '#20362BA1', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 440, maxHeight: '85%', backgroundColor: c.page, borderRadius: 24, padding: 15, gap: 12 },
  creditBody: { gap: 10 },
});
