#!/usr/bin/env node
/**
 * Adds 15 HYROX exercises (8 standard + 7 training variations) to exercises.json
 * and Spanish translations to i18n/es/exercises_015.json
 *
 * IDs: 5202–5216
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'src', 'data')

// ─── HYROX Exercises ───────────────────────────────────────────────────────────

const hyroxExercises = [
  // ── Standard HYROX Competition Exercises (8) ──
  {
    bodyPart: 'cardio',
    equipment: 'skierg machine',
    id: '5202',
    name: 'skierg',
    target: 'cardiovascular system',
    secondaryMuscles: ['lats', 'triceps', 'abs'],
    instructions: [
      'Stand facing the SkiErg machine with feet shoulder-width apart.',
      'Reach up and grab both handles with an overhand grip.',
      'Initiate the pull by hinging at the hips and driving your arms down simultaneously.',
      'Follow through by pulling the handles past your hips, bending your knees slightly.',
      'Allow your arms to rise back up as you extend your hips to return to the starting position.',
      'Maintain a rhythmic pace, coordinating your arm pull with the hip hinge.',
      'Continue for the target distance.'
    ],
    description:
      'The SkiErg is a full-body cardio exercise performed on a ski ergometer machine. It simulates the double-pole motion of cross-country skiing, primarily targeting the cardiovascular system while engaging the lats, triceps, and core. Used in HYROX competitions for 1,000m segments.',
    difficulty: 'intermediate',
    category: 'cardio',
    measurementType: 'distance'
  },
  {
    bodyPart: 'upper legs',
    equipment: 'sled machine',
    id: '5203',
    name: 'sled push',
    target: 'quads',
    secondaryMuscles: ['glutes', 'calves', 'hamstrings', 'abs'],
    instructions: [
      'Load the sled with the appropriate weight.',
      'Position yourself behind the sled with hands on the high or low handles.',
      'Lean forward at a 45-degree angle with arms extended.',
      'Drive through your legs, pushing off with the balls of your feet.',
      'Take short, powerful steps, keeping your core braced and back flat.',
      'Maintain a low body position throughout the push.',
      'Continue pushing for the target distance.'
    ],
    description:
      'The sled push is a compound lower-body exercise that targets the quads, glutes, and calves. It involves pushing a weighted sled across a surface for a set distance. A staple in HYROX competitions (50m segments), it builds leg strength, power, and cardiovascular endurance.',
    difficulty: 'intermediate',
    category: 'strength',
    measurementType: 'distance'
  },
  {
    bodyPart: 'back',
    equipment: 'sled machine',
    id: '5204',
    name: 'sled pull',
    target: 'upper back',
    secondaryMuscles: ['biceps', 'forearms', 'hamstrings', 'glutes'],
    instructions: [
      'Attach a rope to the sled and load it with the appropriate weight.',
      'Stand facing the sled at the end of the rope.',
      'Grab the rope with both hands using a hand-over-hand grip.',
      'Sit back slightly into a quarter squat position for stability.',
      'Pull the rope hand over hand, driving with your back and arms.',
      'Keep your core braced and maintain a stable base throughout.',
      'Continue pulling until the sled reaches you, covering the target distance.'
    ],
    description:
      'The sled pull is a compound upper-body exercise targeting the upper back, biceps, and forearms. It involves pulling a weighted sled toward you using a rope in a hand-over-hand motion. Used in HYROX competitions (50m segments), it develops pulling strength and grip endurance.',
    difficulty: 'intermediate',
    category: 'strength',
    measurementType: 'distance'
  },
  {
    bodyPart: 'cardio',
    equipment: 'body weight',
    id: '5205',
    name: 'burpee broad jumps',
    target: 'cardiovascular system',
    secondaryMuscles: ['quads', 'glutes', 'hamstrings', 'abs', 'pectorals'],
    instructions: [
      'Stand with feet shoulder-width apart.',
      'Drop into a burpee: place your hands on the ground, jump your feet back into a push-up position.',
      'Perform a push-up (chest to the ground in HYROX standard).',
      'Jump your feet forward toward your hands.',
      'Explosively jump forward as far as possible, swinging your arms for momentum.',
      'Land softly with knees slightly bent.',
      'Immediately transition into the next burpee.',
      'Continue for the target distance.'
    ],
    description:
      'Burpee broad jumps combine a full burpee with a forward broad jump, creating a demanding full-body exercise. They target the cardiovascular system while engaging the quads, glutes, chest, and core. A HYROX competition staple (80m segments), they test both strength and aerobic capacity.',
    difficulty: 'advanced',
    category: 'plyometrics',
    measurementType: 'distance'
  },
  {
    bodyPart: 'back',
    equipment: 'leverage machine',
    id: '5206',
    name: 'rowing (hyrox)',
    target: 'upper back',
    secondaryMuscles: ['biceps', 'quads', 'hamstrings', 'abs'],
    instructions: [
      'Sit on the rowing machine and secure your feet on the footrests.',
      'Grab the handle with an overhand grip, arms extended.',
      'Push off with your legs first, extending your knees.',
      'Once your legs are nearly extended, lean back slightly and pull the handle to your lower chest.',
      'Reverse the motion: extend your arms, lean forward, then bend your knees to slide back to the start.',
      'Maintain a fluid, rhythmic stroke at a sustainable pace.',
      'Continue for the target distance.'
    ],
    description:
      'HYROX rowing is performed on an indoor rowing ergometer for 1,000m segments. It targets the upper back, biceps, and legs in a coordinated full-body movement. The rowing machine provides both cardiovascular and muscular endurance challenge, making it a key component of HYROX race fitness.',
    difficulty: 'intermediate',
    category: 'cardio',
    measurementType: 'distance'
  },
  {
    bodyPart: 'lower arms',
    equipment: 'kettlebell',
    id: '5207',
    name: 'farmers carry',
    target: 'forearms',
    secondaryMuscles: ['traps', 'abs', 'quads', 'glutes'],
    instructions: [
      'Place two kettlebells (or dumbbells) on the ground at your sides.',
      'Hinge at the hips and grip each weight firmly.',
      'Stand tall, engaging your core and pulling your shoulders back and down.',
      'Walk forward with controlled, even steps.',
      'Keep your posture upright — avoid leaning to either side.',
      'Maintain a firm grip throughout the carry.',
      'Continue walking for the target distance.'
    ],
    description:
      'The farmers carry is a loaded carry exercise that targets grip strength and the forearms while engaging the traps, core, and lower body for stability. In HYROX competitions (200m segments with 2x24kg kettlebells), it tests grip endurance and full-body conditioning under fatigue.',
    difficulty: 'intermediate',
    category: 'strength',
    measurementType: 'distance'
  },
  {
    bodyPart: 'upper legs',
    equipment: 'weighted',
    id: '5208',
    name: 'sandbag lunges',
    target: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings', 'abs', 'traps'],
    instructions: [
      'Clean the sandbag up and position it across your shoulders, behind your neck.',
      'Stand tall with feet hip-width apart and core braced.',
      'Step forward with one leg and lower your back knee toward the ground.',
      'Descend until your front thigh is approximately parallel to the ground.',
      'Push through your front heel to stand up and bring your feet together.',
      'Alternate legs with each step, walking forward.',
      'Continue lunging for the target distance.'
    ],
    description:
      'Sandbag lunges are a weighted lunge variation where a sandbag is carried across the shoulders while performing walking lunges. They target the quads, glutes, and hamstrings. In HYROX competitions (200m segments with a 20kg sandbag), they challenge leg strength, balance, and endurance under fatigue.',
    difficulty: 'intermediate',
    category: 'strength',
    measurementType: 'distance'
  },
  {
    bodyPart: 'upper legs',
    equipment: 'medicine ball',
    id: '5209',
    name: 'wall balls',
    target: 'quads',
    secondaryMuscles: ['glutes', 'delts', 'triceps', 'abs'],
    instructions: [
      'Stand facing a wall about an arm\'s length away, holding a medicine ball at chest height.',
      'Perform a full squat, keeping the ball at your chest and your weight on your heels.',
      'Drive up explosively from the bottom of the squat.',
      'As you reach full extension, throw the ball upward to hit a target on the wall (3m for men, 2.7m for women).',
      'Catch the ball on the rebound and immediately descend into the next squat.',
      'Maintain a fluid rhythm — the catch transitions directly into the squat.',
      'Repeat for the target number of repetitions.'
    ],
    description:
      'Wall balls are a compound exercise combining a front squat with an overhead throw using a medicine ball. They target the quads, glutes, shoulders, and core. In HYROX competitions (75-100 repetitions with a 6-9kg ball), they are one of the most demanding stations, testing leg endurance and coordination.',
    difficulty: 'intermediate',
    category: 'strength',
    measurementType: 'reps'
  },

  // ── Training Variations (7) — shorter intervals for workout programming ──
  {
    bodyPart: 'cardio',
    equipment: 'skierg machine',
    id: '5210',
    name: 'skierg intervals',
    target: 'cardiovascular system',
    secondaryMuscles: ['lats', 'triceps', 'abs'],
    instructions: [
      'Stand facing the SkiErg machine with feet shoulder-width apart.',
      'Reach up and grab both handles with an overhand grip.',
      'Pull the handles down explosively, hinging at the hips.',
      'Follow through past your hips, bending your knees slightly.',
      'Return to the start position and repeat at high intensity.',
      'Perform intervals of 250m or 500m with rest between sets.',
      'Focus on maintaining consistent power output per interval.'
    ],
    description:
      'SkiErg intervals are a training variation of the full SkiErg distance, performed in shorter 250m or 500m segments with rest between sets. They target the cardiovascular system, lats, and triceps. Ideal for building the power and pacing needed for HYROX competition SkiErg segments.',
    difficulty: 'intermediate',
    category: 'cardio',
    measurementType: 'distance'
  },
  {
    bodyPart: 'upper legs',
    equipment: 'sled machine',
    id: '5211',
    name: 'sled push intervals',
    target: 'quads',
    secondaryMuscles: ['glutes', 'calves', 'hamstrings', 'abs'],
    instructions: [
      'Load the sled with the appropriate weight.',
      'Position yourself behind the sled with hands on the handles.',
      'Lean forward and drive through your legs with short, powerful steps.',
      'Push the sled for 12.5m or 25m at maximum effort.',
      'Rest at the end of each interval before pushing back.',
      'Maintain a low body position and braced core throughout.',
      'Repeat for the programmed number of sets.'
    ],
    description:
      'Sled push intervals are a training variation using shorter distances (12.5m or 25m) to build the leg strength and power needed for HYROX sled push segments. They target the quads, glutes, and calves with high-intensity effort and programmed rest periods.',
    difficulty: 'intermediate',
    category: 'strength',
    measurementType: 'distance'
  },
  {
    bodyPart: 'back',
    equipment: 'sled machine',
    id: '5212',
    name: 'sled pull intervals',
    target: 'upper back',
    secondaryMuscles: ['biceps', 'forearms', 'hamstrings', 'glutes'],
    instructions: [
      'Attach a rope to the sled and load it with the appropriate weight.',
      'Stand at the end of the rope facing the sled.',
      'Pull hand over hand in a controlled, powerful motion.',
      'Pull the sled the full 12.5m or 25m interval distance.',
      'Reset the sled and rest before the next set.',
      'Focus on maintaining proper posture — quarter squat, core braced.',
      'Repeat for the programmed number of sets.'
    ],
    description:
      'Sled pull intervals are a training variation using shorter distances (12.5m or 25m) to develop the pulling strength and grip endurance needed for HYROX sled pull segments. They target the upper back, biceps, and forearms with focused, high-intensity work.',
    difficulty: 'intermediate',
    category: 'strength',
    measurementType: 'distance'
  },
  {
    bodyPart: 'cardio',
    equipment: 'body weight',
    id: '5213',
    name: 'burpee broad jump intervals',
    target: 'cardiovascular system',
    secondaryMuscles: ['quads', 'glutes', 'hamstrings', 'abs', 'pectorals'],
    instructions: [
      'Mark out a distance of 20m or 40m.',
      'Perform a full burpee with chest to the ground.',
      'Jump your feet forward and explosively broad jump ahead.',
      'Land softly and immediately drop into the next burpee.',
      'Continue for the marked distance.',
      'Rest between intervals as programmed.',
      'Focus on consistent jump distance and smooth transitions.'
    ],
    description:
      'Burpee broad jump intervals are a training variation performed over shorter distances (20m or 40m) to build the explosive power and aerobic capacity needed for HYROX competition. They combine the full burpee with a maximal forward jump, targeting the cardiovascular system and full-body musculature.',
    difficulty: 'advanced',
    category: 'plyometrics',
    measurementType: 'distance'
  },
  {
    bodyPart: 'back',
    equipment: 'leverage machine',
    id: '5214',
    name: 'rowing intervals',
    target: 'upper back',
    secondaryMuscles: ['biceps', 'quads', 'hamstrings', 'abs'],
    instructions: [
      'Sit on the rowing machine and secure your feet.',
      'Grab the handle and set the damper to your preferred resistance.',
      'Row at high intensity for 250m or 500m intervals.',
      'Focus on a powerful leg drive followed by the arm pull.',
      'Rest between intervals as programmed.',
      'Maintain proper form — drive with legs first, then lean and pull.',
      'Repeat for the programmed number of sets.'
    ],
    description:
      'Rowing intervals are a training variation performed in shorter 250m or 500m segments to build the pacing strategy and rowing power needed for HYROX 1,000m segments. They target the upper back, biceps, and legs in an efficient full-body movement.',
    difficulty: 'intermediate',
    category: 'cardio',
    measurementType: 'distance'
  },
  {
    bodyPart: 'lower arms',
    equipment: 'kettlebell',
    id: '5215',
    name: 'farmers carry intervals',
    target: 'forearms',
    secondaryMuscles: ['traps', 'abs', 'quads', 'glutes'],
    instructions: [
      'Pick up two kettlebells and stand tall with a braced core.',
      'Walk forward for 25m or 50m with controlled, steady steps.',
      'Set the weights down at the end of the interval.',
      'Rest as programmed, then pick up the weights and walk back.',
      'Focus on maintaining an upright posture throughout.',
      'Grip the kettlebells firmly — do not let them swing.',
      'Repeat for the programmed number of sets.'
    ],
    description:
      'Farmers carry intervals are a training variation performed over shorter distances (25m or 50m) to build the grip endurance and core stability required for HYROX 200m farmers carry segments. They target the forearms, traps, and core with focused interval work.',
    difficulty: 'intermediate',
    category: 'strength',
    measurementType: 'distance'
  },
  {
    bodyPart: 'upper legs',
    equipment: 'weighted',
    id: '5216',
    name: 'sandbag lunge intervals',
    target: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings', 'abs', 'traps'],
    instructions: [
      'Clean the sandbag to your shoulders and secure it behind your neck.',
      'Perform walking lunges for 25m or 50m.',
      'Focus on controlled, full-depth lunges with each step.',
      'Set the sandbag down at the end of the interval.',
      'Rest as programmed before the next set.',
      'Keep your torso upright and core tight throughout.',
      'Repeat for the programmed number of sets.'
    ],
    description:
      'Sandbag lunge intervals are a training variation performed over shorter distances (25m or 50m) to build the leg endurance and stability required for HYROX 200m sandbag lunge segments. They target the quads, glutes, and hamstrings with controlled interval sets.',
    difficulty: 'intermediate',
    category: 'strength',
    measurementType: 'distance'
  }
]

// ─── Add exercises to exercises.json ────────────────────────────────────────────

const exercisesPath = join(dataDir, 'exercises.json')
const exercises = JSON.parse(readFileSync(exercisesPath, 'utf-8'))

// Check for duplicate IDs
const existingIds = new Set(exercises.map(e => e.id))
const newIds = hyroxExercises.map(e => e.id)
const duplicates = newIds.filter(id => existingIds.has(id))
if (duplicates.length > 0) {
  console.error(`❌ Duplicate IDs found: ${duplicates.join(', ')}`)
  process.exit(1)
}

exercises.push(...hyroxExercises)
writeFileSync(exercisesPath, JSON.stringify(exercises, null, 2) + '\n')
console.log(`✅ Added ${hyroxExercises.length} HYROX exercises to exercises.json (IDs ${newIds[0]}–${newIds[newIds.length - 1]})`)
console.log(`   Total exercises: ${exercises.length}`)

// ─── Add Spanish translations ───────────────────────────────────────────────────

const spanishTranslations = {
  '5202': {
    name: 'skierg',
    description:
      'El SkiErg es un ejercicio cardiovascular de cuerpo completo realizado en una máquina de esquí ergométrica. Simula el movimiento de doble bastón del esquí de fondo, trabajando principalmente el sistema cardiovascular mientras involucra dorsales, tríceps y core. Se utiliza en competiciones HYROX en segmentos de 1.000m.',
    instructions: [
      'Colócate de pie frente a la máquina SkiErg con los pies al ancho de hombros.',
      'Estira los brazos y agarra ambas asas con agarre prono.',
      'Inicia la tracción flexionando las caderas y tirando los brazos hacia abajo simultáneamente.',
      'Continúa el movimiento pasando las asas por las caderas, flexionando ligeramente las rodillas.',
      'Deja que los brazos vuelvan a subir mientras extiendes las caderas para volver a la posición inicial.',
      'Mantén un ritmo fluido coordinando la tracción de brazos con la flexión de cadera.',
      'Continúa hasta completar la distancia objetivo.'
    ]
  },
  '5203': {
    name: 'empuje de trineo',
    description:
      'El empuje de trineo es un ejercicio compuesto de tren inferior que trabaja cuádriceps, glúteos y pantorrillas. Consiste en empujar un trineo con peso a lo largo de una superficie durante una distancia determinada. Es un ejercicio fundamental en competiciones HYROX (segmentos de 50m), desarrollando fuerza de piernas, potencia y resistencia cardiovascular.',
    instructions: [
      'Carga el trineo con el peso adecuado.',
      'Colócate detrás del trineo con las manos en los agarres altos o bajos.',
      'Inclínate hacia adelante a unos 45 grados con los brazos extendidos.',
      'Impulsa con las piernas, empujando con la punta de los pies.',
      'Da pasos cortos y potentes, manteniendo el core activado y la espalda recta.',
      'Mantén una posición corporal baja durante todo el empuje.',
      'Continúa empujando hasta completar la distancia objetivo.'
    ]
  },
  '5204': {
    name: 'tirón de trineo',
    description:
      'El tirón de trineo es un ejercicio compuesto de tren superior que trabaja la espalda alta, bíceps y antebrazos. Consiste en tirar de un trineo con peso hacia ti usando una cuerda con movimiento mano sobre mano. Se utiliza en competiciones HYROX (segmentos de 50m), desarrollando fuerza de tracción y resistencia de agarre.',
    instructions: [
      'Ata una cuerda al trineo y cárgalo con el peso adecuado.',
      'Colócate de pie frente al trineo al final de la cuerda.',
      'Agarra la cuerda con ambas manos usando agarre mano sobre mano.',
      'Siéntate ligeramente en posición de cuarto de sentadilla para mayor estabilidad.',
      'Tira de la cuerda mano sobre mano, impulsando con la espalda y los brazos.',
      'Mantén el core activado y una base estable durante todo el movimiento.',
      'Continúa tirando hasta que el trineo llegue a ti, cubriendo la distancia objetivo.'
    ]
  },
  '5205': {
    name: 'burpee con salto largo',
    description:
      'Los burpees con salto largo combinan un burpee completo con un salto hacia adelante, creando un ejercicio exigente de cuerpo completo. Trabajan el sistema cardiovascular mientras involucran cuádriceps, glúteos, pecho y core. Un ejercicio fundamental de HYROX (segmentos de 80m), ponen a prueba tanto la fuerza como la capacidad aeróbica.',
    instructions: [
      'Colócate de pie con los pies al ancho de hombros.',
      'Baja a posición de burpee: coloca las manos en el suelo, salta los pies hacia atrás a posición de flexión.',
      'Realiza una flexión completa (pecho al suelo en el estándar HYROX).',
      'Salta los pies hacia las manos.',
      'Salta explosivamente hacia adelante lo más lejos posible, usando los brazos para impulso.',
      'Aterriza suavemente con las rodillas ligeramente flexionadas.',
      'Transiciona inmediatamente al siguiente burpee.',
      'Continúa hasta completar la distancia objetivo.'
    ]
  },
  '5206': {
    name: 'remo (hyrox)',
    description:
      'El remo HYROX se realiza en un ergómetro de remo indoor durante segmentos de 1.000m. Trabaja la espalda alta, bíceps y piernas en un movimiento coordinado de cuerpo completo. La máquina de remo proporciona un desafío tanto cardiovascular como de resistencia muscular, siendo un componente clave de la preparación para HYROX.',
    instructions: [
      'Siéntate en la máquina de remo y asegura los pies en los reposapiés.',
      'Agarra el mango con agarre prono y los brazos extendidos.',
      'Inicia empujando con las piernas, extendiendo las rodillas.',
      'Una vez las piernas estén casi extendidas, inclínate ligeramente hacia atrás y tira del mango hacia la parte baja del pecho.',
      'Invierte el movimiento: extiende los brazos, inclínate hacia adelante y flexiona las rodillas para volver al inicio.',
      'Mantén una remada fluida y rítmica a un ritmo sostenible.',
      'Continúa hasta completar la distancia objetivo.'
    ]
  },
  '5207': {
    name: 'paseo del granjero',
    description:
      'El paseo del granjero es un ejercicio de acarreo con carga que trabaja la fuerza de agarre y los antebrazos, mientras involucra trapecios, core y tren inferior para la estabilidad. En competiciones HYROX (segmentos de 200m con 2x24kg en pesas rusas), pone a prueba la resistencia del agarre y el acondicionamiento de cuerpo completo bajo fatiga.',
    instructions: [
      'Coloca dos pesas rusas (o mancuernas) en el suelo a tus lados.',
      'Flexiona las caderas y agarra cada peso firmemente.',
      'Ponte de pie erguido, activando el core y tirando los hombros hacia atrás y abajo.',
      'Camina hacia adelante con pasos controlados y regulares.',
      'Mantén la postura erguida — evita inclinarte hacia los lados.',
      'Mantén un agarre firme durante todo el recorrido.',
      'Continúa caminando hasta completar la distancia objetivo.'
    ]
  },
  '5208': {
    name: 'zancadas con saco de arena',
    description:
      'Las zancadas con saco de arena son una variación de zancada con peso donde se lleva un saco de arena sobre los hombros mientras se realizan zancadas caminando. Trabajan cuádriceps, glúteos e isquiotibiales. En competiciones HYROX (segmentos de 200m con saco de 20kg), desafían la fuerza de piernas, el equilibrio y la resistencia bajo fatiga.',
    instructions: [
      'Levanta el saco de arena y colócalo sobre tus hombros, detrás del cuello.',
      'Ponte de pie con los pies al ancho de cadera y el core activado.',
      'Da un paso adelante con una pierna y baja la rodilla trasera hacia el suelo.',
      'Desciende hasta que el muslo delantero esté aproximadamente paralelo al suelo.',
      'Empuja con el talón delantero para ponerte de pie y junta los pies.',
      'Alterna las piernas con cada paso, caminando hacia adelante.',
      'Continúa las zancadas hasta completar la distancia objetivo.'
    ]
  },
  '5209': {
    name: 'wall balls',
    description:
      'Los wall balls son un ejercicio compuesto que combina una sentadilla frontal con un lanzamiento por encima de la cabeza usando un balón medicinal. Trabajan cuádriceps, glúteos, hombros y core. En competiciones HYROX (75-100 repeticiones con balón de 6-9kg), son una de las estaciones más exigentes, poniendo a prueba la resistencia de piernas y la coordinación.',
    instructions: [
      'Colócate frente a una pared a una distancia de un brazo, sosteniendo un balón medicinal a la altura del pecho.',
      'Realiza una sentadilla completa, manteniendo el balón en el pecho y el peso en los talones.',
      'Sube explosivamente desde el fondo de la sentadilla.',
      'Al llegar a la extensión completa, lanza el balón hacia arriba para golpear un objetivo en la pared (3m hombres, 2.7m mujeres).',
      'Atrapa el balón en el rebote e inmediatamente desciende a la siguiente sentadilla.',
      'Mantén un ritmo fluido — la recepción transiciona directamente a la sentadilla.',
      'Repite durante el número objetivo de repeticiones.'
    ]
  },
  // ── Training Variations (7) ──
  '5210': {
    name: 'intervalos de skierg',
    description:
      'Los intervalos de SkiErg son una variación de entrenamiento del SkiErg a distancia completa, realizados en segmentos cortos de 250m o 500m con descanso entre series. Trabajan el sistema cardiovascular, dorsales y tríceps. Ideales para desarrollar la potencia y ritmo necesarios para los segmentos de SkiErg en competiciones HYROX.',
    instructions: [
      'Colócate de pie frente a la máquina SkiErg con los pies al ancho de hombros.',
      'Estira los brazos y agarra ambas asas con agarre prono.',
      'Tira de las asas hacia abajo explosivamente, flexionando las caderas.',
      'Continúa el movimiento pasando las caderas, flexionando ligeramente las rodillas.',
      'Vuelve a la posición inicial y repite a alta intensidad.',
      'Realiza intervalos de 250m o 500m con descanso entre series.',
      'Enfócate en mantener una potencia constante por intervalo.'
    ]
  },
  '5211': {
    name: 'intervalos de empuje de trineo',
    description:
      'Los intervalos de empuje de trineo son una variación de entrenamiento que usa distancias más cortas (12.5m o 25m) para desarrollar la fuerza y potencia de piernas necesarias para los segmentos de empuje de trineo en HYROX. Trabajan cuádriceps, glúteos y pantorrillas con esfuerzo de alta intensidad y períodos de descanso programados.',
    instructions: [
      'Carga el trineo con el peso adecuado.',
      'Colócate detrás del trineo con las manos en los agarres.',
      'Inclínate hacia adelante e impulsa con las piernas con pasos cortos y potentes.',
      'Empuja el trineo durante 12.5m o 25m a máximo esfuerzo.',
      'Descansa al final de cada intervalo antes de empujar de vuelta.',
      'Mantén una posición corporal baja y el core activado durante todo el movimiento.',
      'Repite durante el número programado de series.'
    ]
  },
  '5212': {
    name: 'intervalos de tirón de trineo',
    description:
      'Los intervalos de tirón de trineo son una variación de entrenamiento que usa distancias más cortas (12.5m o 25m) para desarrollar la fuerza de tracción y resistencia de agarre necesarias para los segmentos de tirón de trineo en HYROX. Trabajan la espalda alta, bíceps y antebrazos con trabajo enfocado de alta intensidad.',
    instructions: [
      'Ata una cuerda al trineo y cárgalo con el peso adecuado.',
      'Colócate al final de la cuerda frente al trineo.',
      'Tira mano sobre mano con un movimiento controlado y potente.',
      'Tira del trineo la distancia completa del intervalo de 12.5m o 25m.',
      'Recoloca el trineo y descansa antes de la siguiente serie.',
      'Enfócate en mantener la postura correcta — cuarto de sentadilla, core activado.',
      'Repite durante el número programado de series.'
    ]
  },
  '5213': {
    name: 'intervalos de burpee con salto largo',
    description:
      'Los intervalos de burpee con salto largo son una variación de entrenamiento realizados en distancias más cortas (20m o 40m) para desarrollar la potencia explosiva y capacidad aeróbica necesarias para la competición HYROX. Combinan el burpee completo con un salto largo máximo, trabajando el sistema cardiovascular y la musculatura de cuerpo completo.',
    instructions: [
      'Marca una distancia de 20m o 40m.',
      'Realiza un burpee completo con el pecho al suelo.',
      'Salta los pies hacia adelante y salta explosivamente hacia adelante.',
      'Aterriza suavemente e inmediatamente baja al siguiente burpee.',
      'Continúa durante la distancia marcada.',
      'Descansa entre intervalos según lo programado.',
      'Enfócate en mantener una distancia de salto constante y transiciones fluidas.'
    ]
  },
  '5214': {
    name: 'intervalos de remo',
    description:
      'Los intervalos de remo son una variación de entrenamiento realizados en segmentos más cortos de 250m o 500m para desarrollar la estrategia de ritmo y potencia de remo necesarias para los segmentos de 1.000m en HYROX. Trabajan la espalda alta, bíceps y piernas en un movimiento eficiente de cuerpo completo.',
    instructions: [
      'Siéntate en la máquina de remo y asegura los pies.',
      'Agarra el mango y ajusta la resistencia a tu preferencia.',
      'Rema a alta intensidad durante intervalos de 250m o 500m.',
      'Enfócate en un impulso potente de piernas seguido de la tracción de brazos.',
      'Descansa entre intervalos según lo programado.',
      'Mantén la técnica correcta — impulsa primero con las piernas, luego inclínate y tira.',
      'Repite durante el número programado de series.'
    ]
  },
  '5215': {
    name: 'intervalos de paseo del granjero',
    description:
      'Los intervalos de paseo del granjero son una variación de entrenamiento realizados en distancias más cortas (25m o 50m) para desarrollar la resistencia de agarre y estabilidad de core necesarias para los segmentos de 200m de paseo del granjero en HYROX. Trabajan antebrazos, trapecios y core con trabajo enfocado por intervalos.',
    instructions: [
      'Levanta dos pesas rusas y ponte de pie erguido con el core activado.',
      'Camina hacia adelante durante 25m o 50m con pasos controlados y estables.',
      'Deja los pesos en el suelo al final del intervalo.',
      'Descansa según lo programado, luego levanta los pesos y camina de vuelta.',
      'Enfócate en mantener una postura erguida durante todo el recorrido.',
      'Agarra las pesas rusas firmemente — no las dejes balancear.',
      'Repite durante el número programado de series.'
    ]
  },
  '5216': {
    name: 'intervalos de zancadas con saco de arena',
    description:
      'Los intervalos de zancadas con saco de arena son una variación de entrenamiento realizados en distancias más cortas (25m o 50m) para desarrollar la resistencia de piernas y estabilidad necesarias para los segmentos de 200m de zancadas con saco en HYROX. Trabajan cuádriceps, glúteos e isquiotibiales con series controladas por intervalos.',
    instructions: [
      'Levanta el saco de arena hasta los hombros y asegúralo detrás del cuello.',
      'Realiza zancadas caminando durante 25m o 50m.',
      'Enfócate en zancadas controladas y de profundidad completa con cada paso.',
      'Deja el saco de arena en el suelo al final del intervalo.',
      'Descansa según lo programado antes de la siguiente serie.',
      'Mantén el torso erguido y el core activado durante todo el movimiento.',
      'Repite durante el número programado de series.'
    ]
  }
}

const translationsPath = join(dataDir, 'i18n', 'es', 'exercises_015.json')
writeFileSync(translationsPath, JSON.stringify(spanishTranslations, null, 2) + '\n')
console.log(`✅ Added ${Object.keys(spanishTranslations).length} Spanish translations to exercises_015.json`)

// ─── Validate ───────────────────────────────────────────────────────────────────

// Re-parse to validate JSON
try {
  JSON.parse(readFileSync(exercisesPath, 'utf-8'))
  console.log('✅ exercises.json is valid JSON')
} catch (e) {
  console.error('❌ exercises.json is INVALID JSON:', e.message)
  process.exit(1)
}

try {
  JSON.parse(readFileSync(translationsPath, 'utf-8'))
  console.log('✅ exercises_015.json is valid JSON')
} catch (e) {
  console.error('❌ exercises_015.json is INVALID JSON:', e.message)
  process.exit(1)
}
