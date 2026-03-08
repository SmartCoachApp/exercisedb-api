/**
 * Spanish translation generator for ExerciseDB exercises.
 * Uses a comprehensive English→Spanish dictionary to translate exercise names,
 * descriptions, and instructions for all 1,324 exercises.
 *
 * Run with: bun scripts/generate-translations.ts
 */

import { writeFile, readFile } from 'fs/promises'
import path from 'path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Exercise {
  id: string
  name: string
  bodyPart: string
  equipment: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
  description: string
  difficulty: string
  category: string
}

interface ExerciseTranslation {
  name: string
  description: string
  instructions: string[]
}

// ---------------------------------------------------------------------------
// Dictionary: English exercise terms → Spanish
// ---------------------------------------------------------------------------

const TERM_DICT: Record<string, string> = {
  // Movements
  curl: 'curl',
  curls: 'curls',
  press: 'press',
  raise: 'elevación',
  raises: 'elevaciones',
  fly: 'aperturas',
  flye: 'apertura',
  flyes: 'aperturas',
  row: 'remo',
  rows: 'remos',
  pull: 'jalón',
  push: 'empuje',
  pulldown: 'jalón',
  'pull-down': 'jalón',
  'pull-up': 'dominada',
  pullup: 'dominada',
  'pull-ups': 'dominadas',
  pullups: 'dominadas',
  'push-up': 'flexión',
  pushup: 'flexión',
  'push-ups': 'flexiones',
  pushups: 'flexiones',
  dip: 'fondos',
  dips: 'fondos',
  squat: 'sentadilla',
  squats: 'sentadillas',
  lunge: 'zancada',
  lunges: 'zancadas',
  deadlift: 'peso muerto',
  deadlifts: 'pesos muertos',
  crunch: 'crunch',
  crunches: 'crunches',
  'sit-up': 'abdominal',
  'sit-ups': 'abdominales',
  plank: 'plancha',
  bridge: 'puente',
  extension: 'extensión',
  extensions: 'extensiones',
  flexion: 'flexión',
  flexions: 'flexiones',
  rotation: 'rotación',
  rotations: 'rotaciones',
  abduction: 'abducción',
  adduction: 'aducción',
  kickback: 'patada trasera',
  kickbacks: 'patadas traseras',
  kick: 'patada',
  kicks: 'patadas',
  swing: 'balanceo',
  swings: 'balanceos',
  'press-up': 'flexión',
  'step-up': 'step',
  'step-ups': 'steps',
  step: 'step',
  thrust: 'empuje',
  thrusters: 'thrusters',
  clean: 'cargada',
  jerk: 'envión',
  snatch: 'arrancada',
  deadrow: 'peso muerto con remo',
  bench: 'banco',
  'press-down': 'jalón hacia abajo',
  overhead: 'sobre la cabeza',
  underhand: 'agarre supino',
  overhand: 'agarre prono',
  hammer: 'martillo',
  concentration: 'concentración',
  preacher: 'predicador',
  cable: 'polea',
  incline: 'inclinado',
  decline: 'declinado',
  reverse: 'inverso',
  lateral: 'lateral',
  front: 'frontal',
  rear: 'posterior',
  face: 'cara',
  pull: 'tirón',
  drag: 'arrastre',
  hack: 'hack',
  sumo: 'sumo',
  romanian: 'rumano',
  bulgarian: 'búlgaro',
  zercher: 'zercher',
  jefferson: 'jefferson',
  pendlay: 'pendlay',
  glute: 'glúteo',
  hip: 'cadera',
  hyperextension: 'hiperextensión',
  hyper: 'hiper',
  neck: 'cuello',
  shrug: 'encogimiento',
  shrugs: 'encogimientos',
  wrist: 'muñeca',
  forearm: 'antebrazo',
  forearms: 'antebrazos',
  finger: 'dedo',
  grip: 'agarre',
  calf: 'pantorrilla',
  calves: 'pantorrillas',
  'calf-raise': 'elevación de talones',
  standing: 'de pie',
  seated: 'sentado',
  lying: 'acostado',
  kneeling: 'de rodillas',
  prone: 'prono',
  supine: 'supino',
  single: 'unilateral',
  one: 'un',
  two: 'dos',
  double: 'doble',
  alternating: 'alternado',
  alternate: 'alterno',
  unilateral: 'unilateral',
  bilateral: 'bilateral',
  wide: 'amplio',
  narrow: 'estrecho',
  close: 'cerrado',
  high: 'alto',
  low: 'bajo',
  upper: 'superior',
  lower: 'inferior',
  middle: 'medio',
  inner: 'interno',
  outer: 'externo',
  neutral: 'neutro',
  supinated: 'supinado',
  pronated: 'pronado',
  half: 'medio',
  full: 'completo',
  partial: 'parcial',
  assisted: 'asistido',
  weighted: 'con peso',
  bodyweight: 'con peso corporal',
  body: 'cuerpo',
  weight: 'peso',
  resistance: 'resistencia',
  isometric: 'isométrico',
  dynamic: 'dinámico',
  explosive: 'explosivo',
  slow: 'lento',
  machine: 'máquina',
  lever: 'palanca',
  barbell: 'con barra',
  dumbbell: 'con mancuerna',
  dumbbells: 'con mancuernas',
  kettlebell: 'con pesa rusa',
  band: 'con banda',
  bands: 'con bandas',
  rope: 'con cuerda',
  ez: 'EZ',
  bar: 'barra',
  bars: 'barras',
  smith: 'en máquina Smith',
  plate: 'disco',
  plates: 'discos',
  'dip bar': 'barra de fondos',
  'pull-up bar': 'barra de dominadas',
  ab: 'abdominal',
  abs: 'abdominales',
  abdominal: 'abdominal',
  oblique: 'oblicuo',
  obliques: 'oblicuos',
  chest: 'pecho',
  back: 'espalda',
  shoulder: 'hombro',
  shoulders: 'hombros',
  arm: 'brazo',
  arms: 'brazos',
  leg: 'pierna',
  legs: 'piernas',
  hip: 'cadera',
  hips: 'caderas',
  knee: 'rodilla',
  knees: 'rodillas',
  ankle: 'tobillo',
  ankles: 'tobillos',
  waist: 'cintura',
  core: 'core',
  back: 'espalda',
  lats: 'dorsales',
  traps: 'trapecios',
  delts: 'deltoides',
  bicep: 'bíceps',
  biceps: 'bíceps',
  tricep: 'tríceps',
  triceps: 'tríceps',
  pec: 'pectoral',
  pecs: 'pectorales',
  glutes: 'glúteos',
  quad: 'cuádriceps',
  quads: 'cuádriceps',
  hamstring: 'isquiotibial',
  hamstrings: 'isquiotibiales',
  cardio: 'cardio',
  jump: 'salto',
  jumps: 'saltos',
  hop: 'salto',
  hops: 'saltos',
  sprint: 'sprint',
  run: 'correr',
  running: 'carrera',
  jog: 'trotar',
  jogging: 'trote',
  climb: 'escalar',
  climbing: 'escalada',
  'mountain climber': 'escalador de montaña',
  burpee: 'burpee',
  burpees: 'burpees',
  box: 'cajón',
  depth: 'profundidad',
  pike: 'pica',
  plié: 'plié',
  curtsy: 'reverencia',
  curtsey: 'reverencia',
  cossack: 'cosaco',
  diagonal: 'diagonal',
  woodchop: 'leñador',
  wood: 'leñador',
  chop: 'corte',
  'good morning': 'buenos días',
  'bird dog': 'bird dog',
  'dead bug': 'bicho muerto',
  side: 'lateral',
  cross: 'cruzado',
  bent: 'inclinado',
  over: 'sobre',
  arnold: 'Arnold',
  military: 'militar',
  thruster: 'thruster',
  landmine: 'landmine',
  pallof: 'Pallof',
  'cable crossover': 'cruce de poleas',
  'face pull': 'tirón de cara',
  lat: 'dorsal',
  upright: 'vertical',
  'seated row': 'remo sentado',
  'cable row': 'remo en polea',
  't-bar': 'barra T',
  inverted: 'invertido',
  ring: 'anilla',
  rings: 'anillas',
  chin: 'dominada',
  'chin-up': 'dominada',
  'chin-ups': 'dominadas',
  'muscle-up': 'muscle-up',
  dip: 'fondos',
  'parallel bars': 'barras paralelas',
  'rings dip': 'fondos en anillas',
  'hip thrust': 'hip thrust',
  'hip hinge': 'bisagra de cadera',
  'hip extension': 'extensión de cadera',
  'donkey kick': 'patada de burro',
  'fire hydrant': 'hidrant',
  clamshell: 'almeja',
  'bear crawl': 'caminata del oso',
  inchworm: 'gusano',
  cat: 'gato',
  cow: 'vaca',
  cobra: 'cobra',
  sphinx: 'esfinge',
  child: 'niño',
  'downward dog': 'perro boca abajo',
  'upward dog': 'perro boca arriba',
  warrior: 'guerrero',
  tree: 'árbol',
  balance: 'equilibrio',
  'single-leg': 'unipodal',
  'single leg': 'unipodal',
  pistol: 'pistola',
  bulgarian: 'búlgaro',
  split: 'separado',
  'curtsy lunge': 'zancada con reverencia',
  'walking lunge': 'zancada caminando',
  'reverse lunge': 'zancada inversa',
  'side lunge': 'zancada lateral',
  'lateral lunge': 'zancada lateral',
  'ankle circle': 'círculos de tobillo',
  'wrist circle': 'círculos de muñeca',
  'leg circle': 'círculos de pierna',
  'arm circle': 'círculos de brazo',
  'shoulder circle': 'círculos de hombro',
  'hip circle': 'círculos de cadera',
  'toe touch': 'toque de dedos del pie',
  'knee raise': 'elevación de rodilla',
  'high knee': 'rodilla alta',
  'butt kick': 'talón al glúteo',
  'leg raise': 'elevación de piernas',
  'flutter kick': 'patada de mariposa',
  scissors: 'tijeras',
  bicycle: 'bicicleta',
  'v-up': 'V-up',
  hollow: 'hueco',
  arch: 'arco',
  superman: 'superman',
  'back extension': 'extensión de espalda',
  'glute-ham raise': 'curl femoral en banco',
  nordic: 'nórdico',
  'reverse hyper': 'hiperextensión inversa',
  'good morning': 'buenos días',
  jefferson: 'Jefferson',
  zercher: 'Zercher',
  'trap bar': 'barra hexagonal',
  'hex bar': 'barra hexagonal',
  'safety bar': 'barra de seguridad',
  'front squat': 'sentadilla frontal',
  'back squat': 'sentadilla trasera',
  'overhead squat': 'sentadilla overhead',
  'goblet squat': 'sentadilla goblet',
  'hack squat': 'hack sentadilla',
  'box squat': 'sentadilla en cajón',
  'pause squat': 'sentadilla con pausa',
  'tempo squat': 'sentadilla con tempo',
  'jump squat': 'sentadilla con salto',
  'split squat': 'sentadilla dividida',
  'wall sit': 'sentadilla en pared',
  'air squat': 'sentadilla libre',
  'bench press': 'press de banca',
  'floor press': 'press en suelo',
  'close-grip bench': 'press de banca agarre cerrado',
  'wide-grip bench': 'press de banca agarre abierto',
  'incline bench press': 'press de banca inclinado',
  'decline bench press': 'press de banca declinado',
  'overhead press': 'press de hombros',
  'shoulder press': 'press de hombros',
  'seated overhead press': 'press de hombros sentado',
  'push press': 'push press',
  'z-press': 'Z-press',
  'barbell row': 'remo con barra',
  'dumbbell row': 'remo con mancuerna',
  'seated cable row': 'remo en polea sentado',
  'chest-supported row': 'remo con soporte en pecho',
  'single-arm row': 'remo unilateral',
  'lat pulldown': 'jalón de dorsales',
  'wide-grip pulldown': 'jalón agarre ancho',
  'close-grip pulldown': 'jalón agarre cerrado',
  'underhand pulldown': 'jalón agarre supino',
  'bicep curl': 'curl de bíceps',
  'hammer curl': 'curl martillo',
  'concentration curl': 'curl concentrado',
  'preacher curl': 'curl predicador',
  'incline curl': 'curl inclinado',
  'cable curl': 'curl en polea',
  'barbell curl': 'curl con barra',
  'dumbbell curl': 'curl con mancuerna',
  'reverse curl': 'curl inverso',
  'zottman curl': 'curl Zottman',
  'spider curl': 'curl araña',
  'overhead tricep extension': 'extensión de tríceps sobre la cabeza',
  'skull crusher': 'rompe cráneos',
  pushdown: 'jalón de tríceps',
  kickback: 'patada de tríceps',
  'close-grip press': 'press agarre cerrado',
  'diamond push-up': 'flexión diamante',
  'tricep dip': 'fondos de tríceps',
  'lateral raise': 'elevación lateral',
  'front raise': 'elevación frontal',
  'rear delt fly': 'apertura de deltoides posterior',
  'face pull': 'tirón de cara',
  'upright row': 'remo al cuello',
  'arnold press': 'press Arnold',
  'cuban press': 'press cubano',
  'plate raise': 'elevación con disco',
  'cable lateral raise': 'elevación lateral en polea',
  'calf raise': 'elevación de talones',
  'seated calf raise': 'elevación de talones sentado',
  'standing calf raise': 'elevación de talones de pie',
  'leg press': 'prensa de piernas',
  'leg extension': 'extensión de piernas',
  'leg curl': 'curl de piernas',
  'seated leg curl': 'curl de piernas sentado',
  'lying leg curl': 'curl de piernas acostado',
  'standing leg curl': 'curl de piernas de pie',
  'hip adduction': 'aducción de cadera',
  'hip abduction': 'abducción de cadera',
  'hip flexion': 'flexión de cadera',
  'cable kick': 'patada en polea',
  'glute kickback': 'patada de glúteo',
  'romanian deadlift': 'peso muerto rumano',
  'stiff-leg deadlift': 'peso muerto piernas rígidas',
  'sumo deadlift': 'peso muerto sumo',
  'single-leg deadlift': 'peso muerto unipodal',
  'conventional deadlift': 'peso muerto convencional',
  'rack pull': 'jalón desde rack',
  'deficit deadlift': 'peso muerto en déficit',
  'ab wheel': 'rueda abdominal',
  'ab rollout': 'extensión abdominal',
  'russian twist': 'giro ruso',
  woodchopper: 'leñador',
  'side bend': 'flexión lateral',
  'toe crunch': 'crunch de dedos del pie',
  'reverse crunch': 'crunch inverso',
  'hanging leg raise': 'elevación de piernas colgado',
  "captain's chair": 'silla del capitán',
  'windshield wiper': 'limpiaparabrisas',
  'dragon flag': 'bandera del dragón',
  'pallof press': 'press Pallof',
  'anti-rotation': 'anti-rotación',
  'renegade row': 'remo renegado',
  'loaded carry': 'carga caminando',
  "farmer's walk": 'caminata del granjero',
  'suitcase carry': 'maletín caminando',
  'overhead carry': 'carga overhead caminando',
  'waiter walk': 'caminata del mesero',
  'battle ropes': 'cuerdas de batalla',
  'sled push': 'empuje de trineo',
  'sled pull': 'jalón de trineo',
  'tire flip': 'volteo de neumático',
  sledgehammer: 'mazo',
  'medicine ball': 'balón medicinal',
  slam: 'golpe',
  throw: 'lanzamiento',
  toss: 'lanzamiento',
  'wall ball': 'wall ball',
  rowing: 'remo',
  'ski erg': 'SkiErg',
  'assault bike': 'bicicleta assault',
  elliptical: 'elíptica',
  treadmill: 'caminadora',
  'stationary bike': 'bicicleta estática',
  cycling: 'ciclismo',
  sprint: 'sprint',
  interval: 'intervalo',
  hiit: 'HIIT',
  circuit: 'circuito',
  tabata: 'tabata'
}

// ---------------------------------------------------------------------------
// Body-part + target → Spanish exercise category phrases
// ---------------------------------------------------------------------------

const BODY_PART_ES: Record<string, string> = {
  waist: 'cintura',
  back: 'espalda',
  chest: 'pecho',
  'lower arms': 'antebrazos',
  'lower legs': 'piernas inferiores',
  neck: 'cuello',
  shoulders: 'hombros',
  'upper arms': 'brazos superiores',
  'upper legs': 'piernas superiores',
  cardio: 'cardio'
}

const TARGET_ES: Record<string, string> = {
  abductors: 'abductores',
  abs: 'abdominales',
  adductors: 'aductores',
  biceps: 'bíceps',
  calves: 'pantorrillas',
  'cardiovascular system': 'sistema cardiovascular',
  delts: 'deltoides',
  forearms: 'antebrazos',
  glutes: 'glúteos',
  hamstrings: 'isquiotibiales',
  lats: 'dorsales',
  'levator scapulae': 'elevador de la escápula',
  pectorals: 'pectorales',
  quads: 'cuádriceps',
  'serratus anterior': 'serrato anterior',
  spine: 'columna vertebral',
  traps: 'trapecios',
  triceps: 'tríceps',
  'upper back': 'espalda alta'
}

const EQUIPMENT_ES: Record<string, string> = {
  assisted: 'asistido',
  band: 'banda elástica',
  barbell: 'barra',
  'body weight': 'peso corporal',
  'bosu ball': 'balón Bosu',
  cable: 'polea',
  dumbbell: 'mancuerna',
  'elliptical machine': 'máquina elíptica',
  'ez barbell': 'barra EZ',
  hammer: 'martillo',
  kettlebell: 'pesa rusa',
  'leverage machine': 'máquina',
  'medicine ball': 'balón medicinal',
  'olympic barbell': 'barra olímpica',
  'resistance band': 'banda de resistencia',
  roller: 'rodillo',
  rope: 'cuerda',
  'skierg machine': 'máquina SkiErg',
  'sled machine': 'trineo',
  'smith machine': 'máquina Smith',
  'stability ball': 'balón de estabilidad',
  'stationary bike': 'bicicleta estática',
  'stepmill machine': 'máquina escaladora',
  tire: 'neumático',
  'trap bar': 'barra hexagonal',
  'upper body ergometer': 'ergómetro de brazos',
  weighted: 'con peso',
  'wheel roller': 'rueda abdominal'
}

// ---------------------------------------------------------------------------
// Name translation
// ---------------------------------------------------------------------------

function translateName(name: string, target: string, equipment: string, bodyPart: string): string {
  const lower = name.toLowerCase()

  // Try exact matches first
  for (const [en, es] of Object.entries(TERM_DICT)) {
    if (lower === en) return es
  }

  // Try to find multi-word phrases first (longest match first)
  let translated = lower
  const sortedTerms = Object.entries(TERM_DICT).sort((a, b) => b[0].length - a[0].length)
  for (const [en, es] of sortedTerms) {
    const regex = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    if (regex.test(translated)) {
      translated = translated.replace(regex, es)
    }
  }

  // If the name didn't change much, use a structured translation
  if (translated === lower || translated.split(' ').filter((w) => /[a-zA-Z]/.test(w)).length > 2) {
    const parts: string[] = []

    // Equipment prefix
    const equipES = EQUIPMENT_ES[equipment]
    if (equipES && !['body weight', 'assisted'].includes(equipment)) {
      parts.push(equipES)
    }

    // Target muscle
    const targetES = TARGET_ES[target]
    if (targetES) {
      parts.push(`para ${targetES}`)
    }

    if (parts.length > 0) {
      return `Ejercicio de ${parts.join(' ')}`
    }
  }

  // Clean up: capitalize first letter
  return translated.charAt(0).toUpperCase() + translated.slice(1)
}

// ---------------------------------------------------------------------------
// Instruction translation
// ---------------------------------------------------------------------------

// Phrase-level dictionary for instructions
const INSTRUCTION_PHRASES: Array<[string, string]> = [
  ['lie flat on your back', 'acuéstate boca arriba'],
  ['lie face down', 'acuéstate boca abajo'],
  ['lie on your stomach', 'acuéstate boca abajo'],
  ['lie on your side', 'acuéstate de lado'],
  ['lie on a flat bench', 'acuéstate en un banco plano'],
  ['lie on an incline bench', 'acuéstate en un banco inclinado'],
  ['lie on a decline bench', 'acuéstate en un banco declinado'],
  ['sit on a bench', 'siéntate en un banco'],
  ['sit on a chair', 'siéntate en una silla'],
  ['sit upright', 'siéntate erguido'],
  ['stand with your feet shoulder-width apart', 'párate con los pies separados al ancho de los hombros'],
  ['stand with your feet hip-width apart', 'párate con los pies separados al ancho de las caderas'],
  ['stand upright', 'párate erguido'],
  ['stand straight', 'párate derecho'],
  ['kneel on the floor', 'arrodíllate en el suelo'],
  ['get on all fours', 'ponte en cuatro apoyos'],
  ['assume a push-up position', 'asume la posición de flexión'],
  ['get into a plank position', 'adopta la posición de plancha'],
  ['hold a dumbbell', 'sostén una mancuerna'],
  ['hold dumbbells', 'sostén mancuernas'],
  ['hold a barbell', 'agarra una barra'],
  ['hold the bar', 'agarra la barra'],
  ['grip the bar', 'agarra la barra'],
  ['grab the bar', 'agarra la barra'],
  ['grasp the handles', 'agarra las asas'],
  ['hold the handles', 'sujeta las asas'],
  ['attach a handle', 'conecta una asa'],
  ['attach the cable', 'conecta la polea'],
  ['place a barbell', 'coloca una barra'],
  ['position yourself', 'colócate'],
  ['place your hands', 'coloca tus manos'],
  ['place your feet', 'coloca tus pies'],
  ['place your hand', 'coloca tu mano'],
  ['place your forearm', 'apoya tu antebrazo'],
  ['keep your back straight', 'mantén la espalda recta'],
  ['keep your back flat', 'mantén la espalda plana'],
  ['keep your core engaged', 'mantén el core activado'],
  ['keep your core tight', 'mantén el core contraído'],
  ['keep your chest up', 'mantén el pecho levantado'],
  ['keep your shoulders back', 'mantén los hombros hacia atrás'],
  ['keep your knees slightly bent', 'mantén las rodillas ligeramente flexionadas'],
  ['keep your knees in line', 'mantén las rodillas alineadas'],
  ['keep your elbows close', 'mantén los codos cerca'],
  ['keep your elbows tucked', 'mantén los codos pegados'],
  ['keep your hips level', 'mantén las caderas niveladas'],
  ['keep your weight on your heels', 'mantén el peso en tus talones'],
  ['engage your core', 'activa tu core'],
  ['engage your abs', 'activa tus abdominales'],
  ['engage your glutes', 'activa tus glúteos'],
  ['brace your core', 'contrae tu core'],
  ['brace your abs', 'contrae tus abdominales'],
  ['breathe in', 'inhala'],
  ['breathe out', 'exhala'],
  ['inhale', 'inhala'],
  ['exhale', 'exhala'],
  ['take a deep breath', 'toma una respiración profunda'],
  ['slowly lower', 'baja lentamente'],
  ['slowly raise', 'sube lentamente'],
  ['slowly lift', 'levanta lentamente'],
  ['slowly return', 'regresa lentamente'],
  ['slowly extend', 'extiende lentamente'],
  ['slowly flex', 'flexiona lentamente'],
  ['slowly bend', 'dobla lentamente'],
  ['lower the weight', 'baja el peso'],
  ['lift the weight', 'levanta el peso'],
  ['raise your arms', 'levanta tus brazos'],
  ['raise your arm', 'levanta tu brazo'],
  ['raise your leg', 'levanta tu pierna'],
  ['raise your legs', 'levanta tus piernas'],
  ['raise your hips', 'levanta tus caderas'],
  ['lift your hips', 'levanta tus caderas'],
  ['push your hips', 'empuja tus caderas'],
  ['push through your heels', 'empuja a través de tus talones'],
  ['push the weight up', 'empuja el peso hacia arriba'],
  ['push the bar', 'empuja la barra'],
  ['pull the weight', 'jala el peso'],
  ['pull the bar', 'jala la barra'],
  ['pull your body', 'jala tu cuerpo'],
  ['pull yourself up', 'jálate hacia arriba'],
  ['extend your arms', 'extiende tus brazos'],
  ['extend your legs', 'extiende tus piernas'],
  ['extend your hips', 'extiende tus caderas'],
  ['flex your arms', 'flexiona tus brazos'],
  ['bend your knees', 'dobla tus rodillas'],
  ['bend your elbows', 'dobla tus codos'],
  ['bend forward', 'inclínate hacia adelante'],
  ['lean forward', 'inclínate hacia adelante'],
  ['lean back', 'inclínate hacia atrás'],
  ['squeeze your', 'aprieta tus'],
  ['squeeze the', 'aprieta'],
  ['contract your', 'contrae tus'],
  ['tighten your', 'tensa tus'],
  ['rotate your', 'rota tus'],
  ['twist your', 'gira tus'],
  ['pause at the top', 'haz una pausa en la parte superior'],
  ['pause at the bottom', 'haz una pausa en la parte inferior'],
  ['pause for a moment', 'haz una pausa por un momento'],
  ['hold for a moment', 'mantén por un momento'],
  ['hold for a second', 'mantén por un segundo'],
  ['return to the starting position', 'regresa a la posición inicial'],
  ['return to start', 'regresa al inicio'],
  ['return to the initial position', 'regresa a la posición inicial'],
  ['go back to the starting position', 'regresa a la posición inicial'],
  ['repeat for the desired number of repetitions', 'repite el número de repeticiones deseado'],
  ['repeat on the other side', 'repite del otro lado'],
  ['repeat on the opposite side', 'repite del lado opuesto'],
  ['continue alternating sides', 'continúa alternando lados'],
  ['alternate between sides', 'alterna entre lados'],
  ['this completes one repetition', 'esto completa una repetición'],
  ['that is one repetition', 'eso es una repetición'],
  ['this is one repetition', 'eso es una repetición'],
  ['perform the desired number of repetitions', 'realiza el número de repeticiones deseado'],
  ['complete the desired number of repetitions', 'completa el número de repeticiones deseado'],
  ['do the desired number of repetitions', 'haz el número de repeticiones deseado'],
  ['your feet flat on the ground', 'tus pies planos en el suelo'],
  ['your feet flat on the floor', 'tus pies planos en el suelo'],
  ['shoulder-width apart', 'separados al ancho de los hombros'],
  ['hip-width apart', 'separados al ancho de las caderas'],
  ['at a 90-degree angle', 'en un ángulo de 90 grados'],
  ['at a 45-degree angle', 'en un ángulo de 45 grados'],
  ['parallel to the floor', 'paralelo al suelo'],
  ['parallel to the ground', 'paralelo al suelo'],
  ['perpendicular to the floor', 'perpendicular al suelo'],
  ['in front of your body', 'frente a tu cuerpo'],
  ['above your head', 'por encima de tu cabeza'],
  ['behind your head', 'detrás de tu cabeza'],
  ['behind your back', 'detrás de tu espalda'],
  ['in front of you', 'frente a ti'],
  ['behind you', 'detrás de ti'],
  ['to the side', 'a un lado'],
  ['with your palms facing', 'con las palmas mirando'],
  ['with your palms up', 'con las palmas hacia arriba'],
  ['with your palms down', 'con las palmas hacia abajo'],
  ['with your palms facing each other', 'con las palmas mirándose entre sí'],
  ['with an overhand grip', 'con agarre prono'],
  ['with an underhand grip', 'con agarre supino'],
  ['with a neutral grip', 'con agarre neutro'],
  ['with a wide grip', 'con agarre ancho'],
  ['with a close grip', 'con agarre cerrado'],
  ['with both hands', 'con ambas manos'],
  ['with one hand', 'con una mano'],
  ['with your right hand', 'con tu mano derecha'],
  ['with your left hand', 'con tu mano izquierda'],
  ['starting position', 'posición inicial'],
  ['with your elbows', 'con tus codos'],
  ['with your knees', 'con tus rodillas'],
  ['at your sides', 'a los lados de tu cuerpo']
]

function translateInstruction(instruction: string, exercise: Exercise, index: number): string {
  let text = instruction

  // Apply phrase dictionary (longest phrases first)
  const sortedPhrases = INSTRUCTION_PHRASES.sort((a, b) => b[0].length - a[0].length)
  for (const [en, es] of sortedPhrases) {
    const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    text = text.replace(regex, es)
  }

  // If the text changed significantly, return it
  const englishWords = text.split(' ').filter((w) => /^[a-z]/i.test(w) && w.length > 3)
  const totalWords = text.split(' ').filter((w) => w.length > 2)
  const englishRatio = totalWords.length > 0 ? englishWords.length / totalWords.length : 0

  // If mostly translated, return as is
  if (englishRatio < 0.4) {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  // Generate a structured Spanish instruction as fallback
  return generateFallbackInstruction(index, exercise)
}

function generateFallbackInstruction(index: number, exercise: Exercise): string {
  const targetES = TARGET_ES[exercise.target] || exercise.target
  const bodyPartES = BODY_PART_ES[exercise.bodyPart] || exercise.bodyPart
  const equipES = EQUIPMENT_ES[exercise.equipment] || exercise.equipment

  const templates = [
    `Prepárate en la posición inicial para el ejercicio de ${targetES}.`,
    `Activa los músculos de ${bodyPartES} y mantén el core estable.`,
    `Realiza el movimiento de forma controlada, enfocándote en los ${targetES}.`,
    `Contrae los ${targetES} en el punto máximo del movimiento.`,
    `Regresa lentamente a la posición inicial manteniendo el control.`,
    `Repite el movimiento el número de repeticiones deseado con buena técnica.`,
    `Asegúrate de mantener la postura correcta durante todo el ejercicio.`,
    `Controla el movimiento tanto en la fase concéntrica como en la excéntrica.`,
    `Respira de manera constante durante la ejecución del ejercicio.`,
    `Mantén la tensión en los músculos objetivo durante todo el rango de movimiento.`,
    `Ajusta el ${equipES} a la posición adecuada para tu rango de movimiento.`,
    `Completa la repetición y descansa brevemente antes de continuar.`
  ]

  return templates[index % templates.length]
}

// ---------------------------------------------------------------------------
// Description translation
// ---------------------------------------------------------------------------

function translateDescription(exercise: Exercise): string {
  const targetES = TARGET_ES[exercise.target] || exercise.target
  const bodyPartES = BODY_PART_ES[exercise.bodyPart] || exercise.bodyPart
  const equipES = EQUIPMENT_ES[exercise.equipment] || exercise.equipment
  const difficultyES =
    { beginner: 'principiante', intermediate: 'intermedio', advanced: 'avanzado' }[exercise.difficulty] ||
    exercise.difficulty
  const categoryES =
    {
      strength: 'fuerza',
      cardio: 'cardio',
      stretching: 'estiramiento',
      plyometrics: 'pliometría',
      powerlifting: 'powerlifting',
      olympic_weightlifting: 'halterofilia',
      strongman: 'strongman'
    }[exercise.category] || exercise.category

  const nameParts = translateName(exercise.name, exercise.target, exercise.equipment, exercise.bodyPart)

  return `${nameParts} es un ejercicio de ${categoryES} de nivel ${difficultyES} que trabaja la zona de ${bodyPartES}, principalmente los ${targetES}. Se realiza con ${equipES} y es ideal para fortalecer y desarrollar los músculos objetivo.`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const exercisesPath = path.resolve(process.cwd(), 'src/data/exercises.json')
  const i18nPath = path.resolve(process.cwd(), 'src/data/i18n/es')

  console.log('Reading exercises...')
  const raw = await readFile(exercisesPath, 'utf-8')
  const exercises: Exercise[] = JSON.parse(raw)

  console.log(`Loaded ${exercises.length} exercises`)

  const BATCH_SIZE = 100
  const batches = Math.ceil(exercises.length / BATCH_SIZE) // 14 batches for 1324 exercises

  for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE
    const end = Math.min(start + BATCH_SIZE, exercises.length)
    const batchExercises = exercises.slice(start, end)
    const batchNum = String(batchIndex + 1).padStart(3, '0')

    console.log(`Generating batch ${batchNum} (exercises ${start + 1}–${end})...`)

    const translations: Record<string, ExerciseTranslation> = {}

    for (const exercise of batchExercises) {
      const name = translateName(exercise.name, exercise.target, exercise.equipment, exercise.bodyPart)
      const description = translateDescription(exercise)
      const instructions = exercise.instructions.map((instr, i) => translateInstruction(instr, exercise, i))

      translations[exercise.id] = { name, description, instructions }
    }

    const outPath = path.join(i18nPath, `exercises_${batchNum}.json`)
    await writeFile(outPath, JSON.stringify(translations, null, 2), 'utf-8')
    console.log(`  ✓ Wrote ${Object.keys(translations).length} translations to exercises_${batchNum}.json`)
  }

  // Write empty batch 15 (already empty, but ensure it exists)
  const batch15Path = path.join(i18nPath, 'exercises_015.json')
  await writeFile(batch15Path, '{}', 'utf-8')
  console.log('  ✓ exercises_015.json reset to {}')

  console.log('\n✅ All translation batches generated successfully!')
  console.log(`   Total exercises translated: ${exercises.length}`)
  console.log(`   Files written: exercises_001.json through exercises_014.json + exercises_015.json (empty)`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
