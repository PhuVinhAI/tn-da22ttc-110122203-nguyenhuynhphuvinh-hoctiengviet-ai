import { defaultLang, type Lang } from './config';

// Strings used inside SVG art components.
// Vietnamese-language SAMPLES (con mèo, Em uống cà phê không?, Chợ rau · Sài Gòn…)
// stay hard-coded in the SVGs — they are the learning material, not UI chrome.
// Everything in this dictionary is UI/meta text that should follow the page locale.

type ArtDict = {
	// Compass — A1 → C2 curriculum
	'compass.title': string;
	'compass.tiers': string;
	'compass.hierarchy': string;
	'compass.l.a1': string;
	'compass.l.a2': string;
	'compass.l.b1': string;
	'compass.l.b2': string;
	'compass.l.c1': string;
	'compass.l.c2': string;

	// LevelPicker — Pick your level
	'picker.title': string;
	'picker.tiers': string;
	'picker.quick': string;
	'picker.selected': string;
	'picker.autoUnlock': string;

	// WovenLesson — Learn with AI (4 skills woven)
	'woven.title': string;
	'woven.vocab': string;
	'woven.vocabSample': string;
	'woven.grammar': string;
	'woven.grammarSample': string;
	'woven.listening': string;
	'woven.listeningCaption': string;
	'woven.speaking': string;
	'woven.weave': string;

	// StreakFlame — Practice & build a streak
	'streak.today': string;
	'streak.questions': string;
	'streak.simulations': string;
	'streak.lessons': string;
	'streak.streak': string;
	'streak.longest': string;
	'streak.dayAbbr': string;

	// SoundWave — AI tutor that sees your screen
	'tutor.title': string;
	'tutor.lessonMeta': string;
	'tutor.typing': string;
	'tutor.hint': string;
	'tutor.hintText': string;
	'tutor.camera': string;

	// ScriptDuet — Bilingual grammar
	'duet.title': string;
	'duet.vnLabel': string;
	'duet.enLabel': string;
	'duet.enSentence': string;

	// WordCloud — Vocabulary depth
	'word.pos': string;
	'word.translation': string;
	'word.dialectN': string;
	'word.dialectC': string;
	'word.dialectS': string;

	// CheckGrid — Six exercise types
	'ex.multi': string;
	'ex.fill': string;
	'ex.match': string;
	'ex.order': string;
	'ex.translate': string;
	'ex.listen': string;
	'ex.matchShirt': string;
	'ex.matchNoodle': string;
	'ex.matchCoffee': string;
	'ex.transHello': string;

	// Roleplay — simulations
	'role.title': string;
	'role.difficulty': string;
	'role.you': string;
	'role.aiFix': string;
	'role.toneNote': string;
	'role.score': string;
	'role.vocab': string;
	'role.grammar': string;
};

export type ArtKey = keyof ArtDict;

const en: ArtDict = {
	'compass.title': 'CEFR · ROUTE',
	'compass.tiers': '06 TIERS',
	'compass.hierarchy': 'COURSE → TOPIC → LESSON',
	'compass.l.a1': 'Beginner',
	'compass.l.a2': 'Elementary',
	'compass.l.b1': 'Intermediate',
	'compass.l.b2': 'Upper Inter.',
	'compass.l.c1': 'Advanced',
	'compass.l.c2': 'Mastery',

	'picker.title': 'PLACEMENT · PICK LEVEL',
	'picker.tiers': '06 TIERS',
	'picker.quick': 'QUICK CHECK',
	'picker.selected': 'SELECTED',
	'picker.autoUnlock': 'A1 · A2 AUTO-CLEAR',

	'woven.title': "TODAY · 04 SKILLS",
	'woven.vocab': 'VOCAB',
	'woven.vocabSample': 'delicious · adj.',
	'woven.grammar': 'GRAMMAR',
	'woven.grammarSample': 'yes/no question',
	'woven.listening': 'LISTEN',
	'woven.listeningCaption': '0:04 · native voice',
	'woven.speaking': 'SPEAK',
	'woven.weave': 'WEAVE 04 SKILLS · 1 LESSON',

	'streak.today': 'TODAY · DAILY GOALS',
	'streak.questions': 'QUESTIONS',
	'streak.simulations': 'SIMULATIONS',
	'streak.lessons': 'LESSONS',
	'streak.streak': 'STREAK',
	'streak.longest': 'Longest 89 days',
	'streak.dayAbbr': 'd',

	'tutor.title': 'AI TUTOR · ON-SCREEN CONTEXT',
	'tutor.lessonMeta': 'LESSON 03 · Q 02',
	'tutor.typing': 'TYPING',
	'tutor.hint': 'HINT',
	'tutor.hintText': 'think about question particles',
	'tutor.camera': 'SNAP · DISCOVER OUTSIDE',

	'duet.title': 'RULE · QUESTION FORM',
	'duet.vnLabel': 'VIETNAMESE',
	'duet.enLabel': 'ENGLISH',
	'duet.enSentence': 'Do you drink coffee?',

	'word.pos': 'NOUN · CLF: con',
	'word.translation': 'cat',
	'word.dialectN': 'NORTH',
	'word.dialectC': 'CENTRAL',
	'word.dialectS': 'SOUTH',

	'ex.multi': 'MULTI CHOICE',
	'ex.fill': 'FILL BLANK',
	'ex.match': 'MATCHING',
	'ex.order': 'ORDERING',
	'ex.translate': 'TRANSLATION',
	'ex.listen': 'LISTENING',
	'ex.matchShirt': 'shirt',
	'ex.matchNoodle': 'noodle',
	'ex.matchCoffee': 'coffee',
	'ex.transHello': 'Hello',

	'role.title': 'ROLEPLAY · SCENARIO',
	'role.difficulty': 'B1 · HARD',
	'role.you': 'YOU',
	'role.aiFix': 'AI FIX',
	'role.toneNote': 'falling tone',
	'role.score': 'SCORE · 02 CRITERIA',
	'role.vocab': 'VOCAB',
	'role.grammar': 'GRAMMAR',
};

const vi: ArtDict = {
	'compass.title': 'CEFR · LỘ TRÌNH',
	'compass.tiers': '06 BẬC',
	'compass.hierarchy': 'KHOÁ → CHỦ ĐỀ → BÀI',
	'compass.l.a1': 'Bắt đầu',
	'compass.l.a2': 'Sơ cấp',
	'compass.l.b1': 'Trung cấp',
	'compass.l.b2': 'Trên trung',
	'compass.l.c1': 'Cao cấp',
	'compass.l.c2': 'Thông thạo',

	'picker.title': 'ĐÁNH GIÁ · CHỌN CẤP',
	'picker.tiers': '06 BẬC',
	'picker.quick': 'ĐÁNH GIÁ NHANH',
	'picker.selected': 'ĐÃ CHỌN',
	'picker.autoUnlock': 'A1 · A2 TỰ MỞ KHOÁ',

	'woven.title': 'BÀI HÔM NAY · 04 KỸ NĂNG',
	'woven.vocab': 'TỪ MỚI',
	'woven.vocabSample': 'ngon · tính từ',
	'woven.grammar': 'NGỮ PHÁP',
	'woven.grammarSample': 'câu nghi vấn',
	'woven.listening': 'NGHE',
	'woven.listeningCaption': '0:04 · giọng bản xứ',
	'woven.speaking': 'NÓI',
	'woven.weave': 'DỆT 4 KỸ NĂNG · 1 BÀI',

	'streak.today': 'HÔM NAY · MỤC TIÊU NGÀY',
	'streak.questions': 'BÀI TẬP',
	'streak.simulations': 'MÔ PHỎNG',
	'streak.lessons': 'BÀI HỌC',
	'streak.streak': 'CHUỖI',
	'streak.longest': 'Dài nhất 89 ngày',
	'streak.dayAbbr': 'ng',

	'tutor.title': 'TRỢ LÝ AI · NGỮ CẢNH MÀN HÌNH',
	'tutor.lessonMeta': 'BÀI 03 · CÂU 02',
	'tutor.typing': 'ĐANG GÕ',
	'tutor.hint': 'GỢI Ý',
	'tutor.hintText': 'nghĩ về tiểu từ nghi vấn',
	'tutor.camera': 'CHỤP ẢNH · KHÁM PHÁ NGOÀI ĐỜI',

	'duet.title': 'QUY TẮC · NGHI VẤN',
	'duet.vnLabel': 'TIẾNG VIỆT',
	'duet.enLabel': 'TIẾNG ANH',
	'duet.enSentence': 'Do you drink coffee?',

	'word.pos': 'DANH TỪ · LOẠI TỪ: con',
	'word.translation': 'con mèo',
	'word.dialectN': 'BẮC',
	'word.dialectC': 'TRUNG',
	'word.dialectS': 'NAM',

	'ex.multi': 'TRẮC NGHIỆM',
	'ex.fill': 'ĐIỀN TỪ',
	'ex.match': 'GHÉP ĐÔI',
	'ex.order': 'SẮP XẾP',
	'ex.translate': 'DỊCH',
	'ex.listen': 'NGHE',
	'ex.matchShirt': 'áo sơ mi',
	'ex.matchNoodle': 'phở',
	'ex.matchCoffee': 'cà phê',
	'ex.transHello': 'Xin chào',

	'role.title': 'MÔ PHỎNG · TÌNH HUỐNG',
	'role.difficulty': 'B1 · KHÓ',
	'role.you': 'BẠN',
	'role.aiFix': 'AI SỬA',
	'role.toneNote': 'thanh ngã',
	'role.score': 'ĐIỂM · 02 TIÊU CHÍ',
	'role.vocab': 'TỪ VỰNG',
	'role.grammar': 'NGỮ PHÁP',
};

const de: ArtDict = {
	'compass.title': 'CEFR · ROUTE',
	'compass.tiers': '06 STUFEN',
	'compass.hierarchy': 'KURS → THEMA → LEKTION',
	'compass.l.a1': 'Anfänger',
	'compass.l.a2': 'Grundkenntn.',
	'compass.l.b1': 'Mittelstufe',
	'compass.l.b2': 'Obere Mitte',
	'compass.l.c1': 'Fortgeschr.',
	'compass.l.c2': 'Meisterschaft',

	'picker.title': 'EINSTUFUNG · NIVEAU WÄHLEN',
	'picker.tiers': '06 STUFEN',
	'picker.quick': 'SCHNELLTEST',
	'picker.selected': 'GEWÄHLT',
	'picker.autoUnlock': 'A1 · A2 AUTO-FREI',

	'woven.title': 'HEUTE · 04 FERTIGKEITEN',
	'woven.vocab': 'VOKABEL',
	'woven.vocabSample': 'lecker · Adj.',
	'woven.grammar': 'GRAMMATIK',
	'woven.grammarSample': 'Ja/Nein-Frage',
	'woven.listening': 'HÖREN',
	'woven.listeningCaption': '0:04 · Muttersprachler',
	'woven.speaking': 'SPRECHEN',
	'woven.weave': '04 FERTIGKEITEN · 1 LEKTION',

	'streak.today': 'HEUTE · TAGESZIELE',
	'streak.questions': 'ÜBUNGEN',
	'streak.simulations': 'SZENARIEN',
	'streak.lessons': 'LEKTIONEN',
	'streak.streak': 'SERIE',
	'streak.longest': 'Längste 89 Tage',
	'streak.dayAbbr': 'T',

	'tutor.title': 'KI-TUTOR · BILDSCHIRMKONTEXT',
	'tutor.lessonMeta': 'LEKTION 03 · F 02',
	'tutor.typing': 'TIPPT',
	'tutor.hint': 'TIPP',
	'tutor.hintText': 'Denk an Fragepartikeln',
	'tutor.camera': 'FOTO · IM ALLTAG ENTDECKEN',

	'duet.title': 'REGEL · FRAGEFORM',
	'duet.vnLabel': 'VIETNAMESISCH',
	'duet.enLabel': 'ENGLISCH',
	'duet.enSentence': 'Do you drink coffee?',

	'word.pos': 'SUBSTANTIV · KLF: con',
	'word.translation': 'die Katze',
	'word.dialectN': 'NORD',
	'word.dialectC': 'MITTE',
	'word.dialectS': 'SÜD',

	'ex.multi': 'MULTIPLE CHOICE',
	'ex.fill': 'LÜCKENTEXT',
	'ex.match': 'ZUORDNEN',
	'ex.order': 'ORDNEN',
	'ex.translate': 'ÜBERSETZEN',
	'ex.listen': 'HÖREN',
	'ex.matchShirt': 'Hemd',
	'ex.matchNoodle': 'Nudeln',
	'ex.matchCoffee': 'Kaffee',
	'ex.transHello': 'Hallo',

	'role.title': 'ROLLENSPIEL · SZENARIO',
	'role.difficulty': 'B1 · SCHWER',
	'role.you': 'DU',
	'role.aiFix': 'KI-KORR.',
	'role.toneNote': 'fallender Ton',
	'role.score': 'PUNKTE · 02 KRITERIEN',
	'role.vocab': 'VOKABEL',
	'role.grammar': 'GRAMMATIK',
};

const es: ArtDict = {
	'compass.title': 'CEFR · RUTA',
	'compass.tiers': '06 NIVELES',
	'compass.hierarchy': 'CURSO → TEMA → LECCIÓN',
	'compass.l.a1': 'Inicial',
	'compass.l.a2': 'Básico',
	'compass.l.b1': 'Intermedio',
	'compass.l.b2': 'Inter. alto',
	'compass.l.c1': 'Avanzado',
	'compass.l.c2': 'Maestría',

	'picker.title': 'NIVEL · ELIGE',
	'picker.tiers': '06 NIVELES',
	'picker.quick': 'TEST RÁPIDO',
	'picker.selected': 'ELEGIDO',
	'picker.autoUnlock': 'A1 · A2 AUTO',

	'woven.title': 'HOY · 04 DESTREZAS',
	'woven.vocab': 'VOCAB',
	'woven.vocabSample': 'delicioso · adj.',
	'woven.grammar': 'GRAMÁTICA',
	'woven.grammarSample': 'pregunta sí/no',
	'woven.listening': 'ESCUCHAR',
	'woven.listeningCaption': '0:04 · voz nativa',
	'woven.speaking': 'HABLAR',
	'woven.weave': '04 DESTREZAS · 1 LECCIÓN',

	'streak.today': 'HOY · METAS DIARIAS',
	'streak.questions': 'EJERCICIOS',
	'streak.simulations': 'ROLEPLAY',
	'streak.lessons': 'LECCIONES',
	'streak.streak': 'RACHA',
	'streak.longest': 'Récord 89 días',
	'streak.dayAbbr': 'd',

	'tutor.title': 'TUTOR IA · CONTEXTO PANTALLA',
	'tutor.lessonMeta': 'LECCIÓN 03 · P 02',
	'tutor.typing': 'ESCRIBIENDO',
	'tutor.hint': 'PISTA',
	'tutor.hintText': 'piensa en partículas interrogativas',
	'tutor.camera': 'FOTO · DESCUBRE EN LA CALLE',

	'duet.title': 'REGLA · INTERROGACIÓN',
	'duet.vnLabel': 'VIETNAMITA',
	'duet.enLabel': 'INGLÉS',
	'duet.enSentence': 'Do you drink coffee?',

	'word.pos': 'SUST. · CLF: con',
	'word.translation': 'gato',
	'word.dialectN': 'NORTE',
	'word.dialectC': 'CENTRO',
	'word.dialectS': 'SUR',

	'ex.multi': 'OPCIÓN MÚLT.',
	'ex.fill': 'RELLENAR',
	'ex.match': 'EMPAREJAR',
	'ex.order': 'ORDENAR',
	'ex.translate': 'TRADUCIR',
	'ex.listen': 'ESCUCHAR',
	'ex.matchShirt': 'camisa',
	'ex.matchNoodle': 'fideos',
	'ex.matchCoffee': 'café',
	'ex.transHello': 'Hola',

	'role.title': 'ROLEPLAY · ESCENARIO',
	'role.difficulty': 'B1 · DIFÍCIL',
	'role.you': 'TÚ',
	'role.aiFix': 'IA CORR.',
	'role.toneNote': 'tono descendente',
	'role.score': 'PUNTOS · 02 CRITERIOS',
	'role.vocab': 'VOCAB',
	'role.grammar': 'GRAMÁTICA',
};

const fr: ArtDict = {
	'compass.title': 'CEFR · PARCOURS',
	'compass.tiers': '06 NIVEAUX',
	'compass.hierarchy': 'COURS → THÈME → LEÇON',
	'compass.l.a1': 'Débutant',
	'compass.l.a2': 'Élémentaire',
	'compass.l.b1': 'Intermédiaire',
	'compass.l.b2': 'Inter. sup.',
	'compass.l.c1': 'Avancé',
	'compass.l.c2': 'Maîtrise',

	'picker.title': 'TEST · CHOISIR NIVEAU',
	'picker.tiers': '06 NIVEAUX',
	'picker.quick': 'TEST RAPIDE',
	'picker.selected': 'CHOISI',
	'picker.autoUnlock': 'A1 · A2 AUTO',

	'woven.title': 'AUJOURD’HUI · 04 COMP.',
	'woven.vocab': 'VOCAB',
	'woven.vocabSample': 'délicieux · adj.',
	'woven.grammar': 'GRAMMAIRE',
	'woven.grammarSample': 'question oui/non',
	'woven.listening': 'ÉCOUTER',
	'woven.listeningCaption': '0:04 · voix native',
	'woven.speaking': 'PARLER',
	'woven.weave': '04 COMP. · 1 LEÇON',

	'streak.today': 'AUJOURD’HUI · OBJECTIFS',
	'streak.questions': 'EXERCICES',
	'streak.simulations': 'ROLEPLAY',
	'streak.lessons': 'LEÇONS',
	'streak.streak': 'SÉRIE',
	'streak.longest': 'Record 89 jours',
	'streak.dayAbbr': 'j',

	'tutor.title': 'TUTEUR IA · CONTEXTE ÉCRAN',
	'tutor.lessonMeta': 'LEÇON 03 · Q 02',
	'tutor.typing': 'EN SAISIE',
	'tutor.hint': 'INDICE',
	'tutor.hintText': 'pense aux particules interrogatives',
	'tutor.camera': 'PHOTO · DÉCOUVRIR DEHORS',

	'duet.title': 'RÈGLE · INTERROGATIVE',
	'duet.vnLabel': 'VIETNAMIEN',
	'duet.enLabel': 'ANGLAIS',
	'duet.enSentence': 'Do you drink coffee?',

	'word.pos': 'NOM · CLF: con',
	'word.translation': 'chat',
	'word.dialectN': 'NORD',
	'word.dialectC': 'CENTRE',
	'word.dialectS': 'SUD',

	'ex.multi': 'QCM',
	'ex.fill': 'À TROUS',
	'ex.match': 'APPARIER',
	'ex.order': 'ORDONNER',
	'ex.translate': 'TRADUIRE',
	'ex.listen': 'ÉCOUTER',
	'ex.matchShirt': 'chemise',
	'ex.matchNoodle': 'nouilles',
	'ex.matchCoffee': 'café',
	'ex.transHello': 'Bonjour',

	'role.title': 'ROLEPLAY · SCÉNARIO',
	'role.difficulty': 'B1 · DIFFICILE',
	'role.you': 'TOI',
	'role.aiFix': 'IA CORR.',
	'role.toneNote': 'ton descendant',
	'role.score': 'SCORE · 02 CRITÈRES',
	'role.vocab': 'VOCAB',
	'role.grammar': 'GRAMMAIRE',
};

const ja: ArtDict = {
	'compass.title': 'CEFR · ルート',
	'compass.tiers': '06段階',
	'compass.hierarchy': 'コース → トピック → レッスン',
	'compass.l.a1': '入門',
	'compass.l.a2': '初級',
	'compass.l.b1': '中級',
	'compass.l.b2': '中上級',
	'compass.l.c1': '上級',
	'compass.l.c2': '熟達',

	'picker.title': '診断 · レベル選択',
	'picker.tiers': '06段階',
	'picker.quick': 'クイック診断',
	'picker.selected': '選択中',
	'picker.autoUnlock': 'A1 · A2 自動解除',

	'woven.title': '今日 · 04技能',
	'woven.vocab': '語彙',
	'woven.vocabSample': 'おいしい · 形',
	'woven.grammar': '文法',
	'woven.grammarSample': 'はい/いいえ疑問',
	'woven.listening': '聞く',
	'woven.listeningCaption': '0:04 · 母語話者',
	'woven.speaking': '話す',
	'woven.weave': '4技能 · 1レッスン',

	'streak.today': '今日 · デイリー目標',
	'streak.questions': '演習',
	'streak.simulations': 'ロールプレイ',
	'streak.lessons': 'レッスン',
	'streak.streak': '連続',
	'streak.longest': '最長89日',
	'streak.dayAbbr': '日',

	'tutor.title': 'AIチューター · 画面コンテキスト',
	'tutor.lessonMeta': 'レッスン 03 · 問 02',
	'tutor.typing': '入力中',
	'tutor.hint': 'ヒント',
	'tutor.hintText': '疑問助詞を考えて',
	'tutor.camera': '撮影 · 街でベトナム語発見',

	'duet.title': 'ルール · 疑問形',
	'duet.vnLabel': 'ベトナム語',
	'duet.enLabel': '英語',
	'duet.enSentence': 'Do you drink coffee?',

	'word.pos': '名詞 · CLF: con',
	'word.translation': '猫',
	'word.dialectN': '北部',
	'word.dialectC': '中部',
	'word.dialectS': '南部',

	'ex.multi': '選択式',
	'ex.fill': '穴埋め',
	'ex.match': 'マッチング',
	'ex.order': '並び替え',
	'ex.translate': '翻訳',
	'ex.listen': '聞き取り',
	'ex.matchShirt': 'シャツ',
	'ex.matchNoodle': '麺',
	'ex.matchCoffee': 'コーヒー',
	'ex.transHello': 'こんにちは',

	'role.title': 'ロールプレイ · シナリオ',
	'role.difficulty': 'B1 · 難',
	'role.you': 'あなた',
	'role.aiFix': 'AI訂正',
	'role.toneNote': '下声',
	'role.score': 'スコア · 02項目',
	'role.vocab': '語彙',
	'role.grammar': '文法',
};

const ko: ArtDict = {
	'compass.title': 'CEFR · 경로',
	'compass.tiers': '06 단계',
	'compass.hierarchy': '코스 → 주제 → 수업',
	'compass.l.a1': '입문',
	'compass.l.a2': '초급',
	'compass.l.b1': '중급',
	'compass.l.b2': '중상급',
	'compass.l.c1': '상급',
	'compass.l.c2': '숙달',

	'picker.title': '진단 · 레벨 선택',
	'picker.tiers': '06 단계',
	'picker.quick': '빠른 진단',
	'picker.selected': '선택됨',
	'picker.autoUnlock': 'A1 · A2 자동 해제',

	'woven.title': '오늘 · 04 영역',
	'woven.vocab': '어휘',
	'woven.vocabSample': '맛있다 · 형',
	'woven.grammar': '문법',
	'woven.grammarSample': '예/아니오 의문',
	'woven.listening': '듣기',
	'woven.listeningCaption': '0:04 · 원어민',
	'woven.speaking': '말하기',
	'woven.weave': '4영역 · 1수업',

	'streak.today': '오늘 · 일일 목표',
	'streak.questions': '연습',
	'streak.simulations': '롤플레이',
	'streak.lessons': '수업',
	'streak.streak': '연속',
	'streak.longest': '최장 89일',
	'streak.dayAbbr': '일',

	'tutor.title': 'AI 튜터 · 화면 컨텍스트',
	'tutor.lessonMeta': '수업 03 · 문 02',
	'tutor.typing': '입력 중',
	'tutor.hint': '힌트',
	'tutor.hintText': '의문 첨사를 생각해 보세요',
	'tutor.camera': '사진 · 실생활에서 발견',

	'duet.title': '규칙 · 의문형',
	'duet.vnLabel': '베트남어',
	'duet.enLabel': '영어',
	'duet.enSentence': 'Do you drink coffee?',

	'word.pos': '명사 · CLF: con',
	'word.translation': '고양이',
	'word.dialectN': '북부',
	'word.dialectC': '중부',
	'word.dialectS': '남부',

	'ex.multi': '객관식',
	'ex.fill': '빈칸 채우기',
	'ex.match': '짝짓기',
	'ex.order': '순서 정렬',
	'ex.translate': '번역',
	'ex.listen': '듣기',
	'ex.matchShirt': '셔츠',
	'ex.matchNoodle': '국수',
	'ex.matchCoffee': '커피',
	'ex.transHello': '안녕하세요',

	'role.title': '롤플레이 · 시나리오',
	'role.difficulty': 'B1 · 어려움',
	'role.you': '당신',
	'role.aiFix': 'AI 교정',
	'role.toneNote': '하강 성조',
	'role.score': '점수 · 02 기준',
	'role.vocab': '어휘',
	'role.grammar': '문법',
};

const th: ArtDict = {
	'compass.title': 'CEFR · เส้นทาง',
	'compass.tiers': '06 ระดับ',
	'compass.hierarchy': 'คอร์ส → หัวข้อ → บทเรียน',
	'compass.l.a1': 'เริ่มต้น',
	'compass.l.a2': 'พื้นฐาน',
	'compass.l.b1': 'กลาง',
	'compass.l.b2': 'กลางสูง',
	'compass.l.c1': 'สูง',
	'compass.l.c2': 'เชี่ยวชาญ',

	'picker.title': 'ทดสอบ · เลือกระดับ',
	'picker.tiers': '06 ระดับ',
	'picker.quick': 'ทดสอบเร็ว',
	'picker.selected': 'เลือกแล้ว',
	'picker.autoUnlock': 'A1 · A2 ปลดอัตโนมัติ',

	'woven.title': 'วันนี้ · 04 ทักษะ',
	'woven.vocab': 'คำศัพท์',
	'woven.vocabSample': 'อร่อย · คุณ',
	'woven.grammar': 'ไวยากรณ์',
	'woven.grammarSample': 'คำถามใช่/ไม่',
	'woven.listening': 'ฟัง',
	'woven.listeningCaption': '0:04 · เจ้าของภาษา',
	'woven.speaking': 'พูด',
	'woven.weave': '4 ทักษะ · 1 บท',

	'streak.today': 'วันนี้ · เป้าหมาย',
	'streak.questions': 'แบบฝึก',
	'streak.simulations': 'สวมบทบาท',
	'streak.lessons': 'บทเรียน',
	'streak.streak': 'สตรีค',
	'streak.longest': 'สูงสุด 89 วัน',
	'streak.dayAbbr': 'วัน',

	'tutor.title': 'ติวเตอร์ AI · บริบทหน้าจอ',
	'tutor.lessonMeta': 'บท 03 · ข้อ 02',
	'tutor.typing': 'กำลังพิมพ์',
	'tutor.hint': 'คำใบ้',
	'tutor.hintText': 'นึกถึงคำลงท้ายคำถาม',
	'tutor.camera': 'ถ่ายภาพ · ค้นพบในชีวิตจริง',

	'duet.title': 'กฎ · รูปคำถาม',
	'duet.vnLabel': 'เวียดนาม',
	'duet.enLabel': 'อังกฤษ',
	'duet.enSentence': 'Do you drink coffee?',

	'word.pos': 'นาม · CLF: con',
	'word.translation': 'แมว',
	'word.dialectN': 'เหนือ',
	'word.dialectC': 'กลาง',
	'word.dialectS': 'ใต้',

	'ex.multi': 'เลือกตอบ',
	'ex.fill': 'เติมคำ',
	'ex.match': 'จับคู่',
	'ex.order': 'เรียง',
	'ex.translate': 'แปล',
	'ex.listen': 'ฟัง',
	'ex.matchShirt': 'เสื้อ',
	'ex.matchNoodle': 'ก๋วยเตี๋ยว',
	'ex.matchCoffee': 'กาแฟ',
	'ex.transHello': 'สวัสดี',

	'role.title': 'สวมบทบาท · สถานการณ์',
	'role.difficulty': 'B1 · ยาก',
	'role.you': 'คุณ',
	'role.aiFix': 'AI แก้',
	'role.toneNote': 'เสียงตก',
	'role.score': 'คะแนน · 02 เกณฑ์',
	'role.vocab': 'คำศัพท์',
	'role.grammar': 'ไวยากรณ์',
};

const zh: ArtDict = {
	'compass.title': 'CEFR · 路线',
	'compass.tiers': '06 级',
	'compass.hierarchy': '课程 → 主题 → 课时',
	'compass.l.a1': '入门',
	'compass.l.a2': '初级',
	'compass.l.b1': '中级',
	'compass.l.b2': '中高级',
	'compass.l.c1': '高级',
	'compass.l.c2': '精通',

	'picker.title': '测评 · 选级',
	'picker.tiers': '06 级',
	'picker.quick': '快速测评',
	'picker.selected': '已选',
	'picker.autoUnlock': 'A1 · A2 自动解锁',

	'woven.title': '今日 · 04 项技能',
	'woven.vocab': '词汇',
	'woven.vocabSample': '好吃 · 形',
	'woven.grammar': '语法',
	'woven.grammarSample': '是非问句',
	'woven.listening': '听',
	'woven.listeningCaption': '0:04 · 母语者',
	'woven.speaking': '说',
	'woven.weave': '4 项技能 · 1 课',

	'streak.today': '今日 · 每日目标',
	'streak.questions': '练习',
	'streak.simulations': '角色扮演',
	'streak.lessons': '课时',
	'streak.streak': '连续',
	'streak.longest': '最长 89 天',
	'streak.dayAbbr': '天',

	'tutor.title': 'AI 导师 · 屏幕语境',
	'tutor.lessonMeta': '课 03 · 题 02',
	'tutor.typing': '输入中',
	'tutor.hint': '提示',
	'tutor.hintText': '想想疑问助词',
	'tutor.camera': '拍照 · 在生活中发现',

	'duet.title': '规则 · 疑问句',
	'duet.vnLabel': '越南语',
	'duet.enLabel': '英语',
	'duet.enSentence': 'Do you drink coffee?',

	'word.pos': '名词 · CLF: con',
	'word.translation': '猫',
	'word.dialectN': '北部',
	'word.dialectC': '中部',
	'word.dialectS': '南部',

	'ex.multi': '选择题',
	'ex.fill': '填空',
	'ex.match': '配对',
	'ex.order': '排序',
	'ex.translate': '翻译',
	'ex.listen': '听力',
	'ex.matchShirt': '衬衫',
	'ex.matchNoodle': '面',
	'ex.matchCoffee': '咖啡',
	'ex.transHello': '你好',

	'role.title': '角色扮演 · 场景',
	'role.difficulty': 'B1 · 难',
	'role.you': '你',
	'role.aiFix': 'AI 纠正',
	'role.toneNote': '降调',
	'role.score': '得分 · 02 项标准',
	'role.vocab': '词汇',
	'role.grammar': '语法',
};

export const art: Record<Lang, ArtDict> = {
	en,
	vi,
	de,
	es,
	fr,
	ja,
	ko,
	th,
	zh,
};

export function useArtTranslations(lang: Lang) {
	return function t(key: ArtKey): string {
		return art[lang][key] ?? art[defaultLang][key];
	};
}
