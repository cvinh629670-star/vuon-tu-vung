import { readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const source = process.argv[2];
if (!source) throw new Error('Supply the path to the upstream dict-en-vi directory.');

const starters = [
  ['hello', '/həˈloʊ/', 'thán từ', 'xin chào', 'Hello, nice to meet you!'],
  ['friend', '/frɛnd/', 'danh từ', 'bạn, người bạn', 'She is my best friend.'],
  ['happy', '/ˈhæpi/', 'tính từ', 'vui vẻ, hạnh phúc', 'I’m happy to see you.'],
  ['learn', '/lɜːrn/', 'động từ', 'học, học hỏi', 'I learn a new word every day.'],
  ['water', '/ˈwɔːtər/', 'danh từ', 'nước', 'Can I have some water?'],
  ['home', '/hoʊm/', 'danh từ', 'nhà, nơi ở', 'I’m going home now.'],
  ['apple', '/ˈæpəl/', 'danh từ', 'quả táo', 'She eats an apple every morning.'],
  ['school', '/skuːl/', 'danh từ', 'trường học', 'We walk to school together.'],
  ['garden', '/ˈɡɑːrdən/', 'danh từ', 'khu vườn', 'There are flowers in the garden.'],
  ['beautiful', '/ˈbjuːtɪfəl/', 'tính từ', 'đẹp, xinh đẹp', 'It’s a beautiful day.'],
];

const functionWords = [
  ['the', '/ðə/', 'mạo từ', 'dùng trước danh từ đã xác định', 'Close the door, please.'],
  ['a', '/ə/', 'mạo từ', 'một (trước âm phụ âm)', 'I have a dog.'],
  ['an', '/ən/', 'mạo từ', 'một (trước âm nguyên âm)', 'She is an artist.'],
  ['i', '/aɪ/', 'đại từ', 'tôi, mình', 'I like tea.'],
  ['you', '/juː/', 'đại từ', 'bạn, các bạn', 'Do you live here?'],
  ['he', '/hiː/', 'đại từ', 'anh ấy, ông ấy', 'He likes music.'],
  ['she', '/ʃiː/', 'đại từ', 'cô ấy, bà ấy', 'She is a doctor.'],
  ['it', '/ɪt/', 'đại từ', 'nó', 'It is on the table.'],
  ['we', '/wiː/', 'đại từ', 'chúng tôi, chúng ta', 'We are ready.'],
  ['they', '/ðeɪ/', 'đại từ', 'họ, chúng', 'They are my friends.'],
  ['and', '/ænd/', 'liên từ', 'và', 'I like tea and coffee.'],
  ['or', '/ɔːr/', 'liên từ', 'hoặc, hay', 'Tea or coffee?'],
  ['but', '/bʌt/', 'liên từ', 'nhưng', 'It’s small but useful.'],
  ['in', '/ɪn/', 'giới từ', 'trong, ở trong', 'The keys are in my bag.'],
  ['on', '/ɑːn/', 'giới từ', 'trên, vào (ngày)', 'The book is on the desk.'],
  ['at', '/æt/', 'giới từ', 'ở, tại, vào (giờ)', 'Meet me at the station.'],
  ['to', '/tuː/', 'giới từ', 'đến, tới', 'I go to work by bus.'],
  ['of', '/ʌv/', 'giới từ', 'của, thuộc về', 'A cup of tea, please.'],
  ['for', '/fɔːr/', 'giới từ', 'cho, dành cho', 'This gift is for you.'],
  ['with', '/wɪð/', 'giới từ', 'với, cùng với', 'Come with me.'],
  ['by', '/baɪ/', 'giới từ', 'bằng, bởi, cạnh', 'We travel by train.'],
  ['from', '/frʌm/', 'giới từ', 'từ', 'I’m from Vietnam.'],
  ['about', '/əˈbaʊt/', 'giới từ', 'về, liên quan đến', 'This book is about plants.'],
  ['as', '/æz/', 'liên từ', 'như, khi', 'Do as I say.'],
  ['if', '/ɪf/', 'liên từ', 'nếu', 'Call me if you need help.'],
  ['because', '/bɪˈkʌz/', 'liên từ', 'bởi vì', 'I stayed home because it rained.'],
  ['can', '/kæn/', 'động từ khuyết thiếu', 'có thể, biết làm gì', 'I can swim.'],
  ['will', '/wɪl/', 'động từ khuyết thiếu', 'sẽ', 'I will call you tomorrow.'],
  ['would', '/wʊd/', 'động từ khuyết thiếu', 'sẽ (giả định), muốn (lịch sự)', 'Would you like some tea?'],
  ['should', '/ʃʊd/', 'động từ khuyết thiếu', 'nên', 'You should get some rest.'],
  ['could', '/kʊd/', 'động từ khuyết thiếu', 'có thể', 'Could you open the window?'],
  ['may', '/meɪ/', 'động từ khuyết thiếu', 'có thể, được phép', 'It may rain later.'],
  ['must', '/mʌst/', 'động từ khuyết thiếu', 'phải', 'You must wear a helmet.'],
  ['me', '/miː/', 'đại từ', 'tôi, mình (tân ngữ)', 'Wait for me!'],
  ['who', '/huː/', 'đại từ', 'ai, người mà', 'Who is at the door?'],
  ['what', '/wʌt/', 'đại từ', 'cái gì, điều gì', 'What do you want?'],
  ['which', '/wɪtʃ/', 'từ để hỏi', 'cái nào, người nào', 'Which one do you like?'],
  ['when', '/wɛn/', 'trạng từ', 'khi nào', 'When does the class start?'],
  ['where', '/wɛr/', 'trạng từ', 'ở đâu, nơi mà', 'Where do you live?'],
  ['why', '/waɪ/', 'trạng từ', 'tại sao', 'Why are you laughing?'],
  ['how', '/haʊ/', 'trạng từ', 'thế nào, bằng cách nào', 'How did you get here?'],
  ['out', '/aʊt/', 'trạng từ', 'ra ngoài', 'Let’s go out for lunch.'],
  ['time', '/taɪm/', 'danh từ', 'thời gian, lần', 'Do you have time today?'],
  ['read', '/riːd/', 'động từ', 'đọc', 'I read before bed.'],
  ['please', '/pliːz/', 'trạng từ', 'xin, làm ơn', 'Please sit down.'],
  ['might', '/maɪt/', 'động từ khuyết thiếu', 'có thể, có lẽ', 'It might rain today.'],
  ['right', '/raɪt/', 'tính từ', 'đúng, phải', 'That is the right answer.'],
  ['too', '/tuː/', 'trạng từ', 'cũng, quá', 'I like it too.'],
  ['take', '/teɪk/', 'động từ', 'lấy, mang, đưa', 'Take an umbrella with you.'],
  ['while', '/waɪl/', 'liên từ', 'trong khi', 'I read while I wait.'],
  ['both', '/boʊθ/', 'từ hạn định', 'cả hai', 'I like both colors.'],
  ['such', '/sʌtʃ/', 'từ hạn định', 'như vậy, như thế', 'It was such a nice day.'],
];

const overrides = [...starters, ...functionWords];
const reserved = new Set(overrides.map(([word]) => word));
const omit = new Set('am are is was were been being had has does did done went gone got gotten said made took taken came saw seen knew known thought found told became began begun gave given ran written wrote brought bought sold felt heard held kept left led lost met paid read stood understood won us uk mr dr st co pm tv ad al st rd th re ca de el la ma aa ac com inc ltd llc washington england america american british european french german chinese japanese english vietnamese china japan india canada australia africa asia europe california texas york john james david george michael peter mary god jesus christ islam christian fuck fucking shit bitch asshole cunt damn bastard bullshit slut dick cock porn rape'.split(' '));
const labels = { n: 'danh từ', v: 'động từ', adj: 'tính từ', adv: 'trạng từ' };
const entriesDir = join(source, 'data', 'entries');
const best = new Map();

for (const filename of readdirSync(entriesDir).filter(name => name.endsWith('.jsonl'))) {
  for (const line of readFileSync(join(entriesDir, filename), 'utf8').trim().split('\n')) {
    const entry = JSON.parse(line);
    const word = entry.headword.toLowerCase();
    if (!/^[a-z]{2,}$/.test(word) || entry.headword !== word || reserved.has(word) || omit.has(word)) continue;
    if (!labels[entry.pos] || !entry.pron || !entry.freq || !entry.senses_vi?.[0]?.trim()) continue;
    const score = (entry.extra?.tag ?? 0) + (entry.source.includes('wiktionary') ? 0.5 : 0);
    if (!best.has(word) || score > best.get(word).score) best.set(word, { ...entry, score });
  }
}

const duplicateForms = new Set(['years', 'going', 'things', 'days', 'weeks', 'months', 'times']);
const ranked = [...best.values()].filter(entry => !duplicateForms.has(entry.headword))
  .sort((a, b) => b.freq - a.freq || b.score - a.score || a.headword.localeCompare(b.headword));
const rows = [...starters, ...ranked.slice(0, 20).map(toRow), ...functionWords, ...ranked.slice(20, 3000 - overrides.length).map(toRow)];
if (rows.length !== 3000) throw new Error('Expected exactly 3,000 words.');
writeFileSync('data/words.json', '[\n' + rows.map(row => '  ' + JSON.stringify(row)).join(',\n') + '\n]\n');
copyFileSync(join(source, 'LICENSE-DATA'), 'data/ATTRIBUTION.txt');

function toRow(entry) {
  return [entry.headword, entry.pron, labels[entry.pos], entry.senses_vi[0].trim()];
}
