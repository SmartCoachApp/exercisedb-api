<div align="center">
  <img src="https://cdn.exercisedb.dev/exercisedb/exercisedb_banner.png" alt="ExerciseDB API Banner" width="100%" height="600px" />
  
  <br />
  <br />
  <img src="https://cdn.exercisedb.dev/exercisedb/android-chrome-512x512.png" alt="ExerciseDB Logo" width="120" height="120" />

  <h3>🏋️‍♂️ Comprehensive Fitness Exercise Database API</h3>
  
  <p>
    <strong>5,000+ structured exercises</strong> • <strong>Fast & Modern</strong> • <strong>Developer-Friendly</strong>
  </p>
  
  <p>
    <span style="margin-right: 10px;">
      <a href="https://dub.sh/exercisedb-api">
        <img src="https://img.shields.io/badge/Get%20Started-2D2D2D?style=for-the-badge&logo=rocket&logoColor=white" alt="Get Started" />
      </a>
    </span>
    <span style="margin-right: 10px;">
      <a href="https://docs.exercisedb.dev">
        <img src="https://img.shields.io/badge/Documentation-404040?style=for-the-badge&logo=book&logoColor=white" alt="Documentation" />
      </a>
    </span>
    <span>
      <a href="#examples">
        <img src="https://img.shields.io/badge/Examples-5A5A5A?style=for-the-badge&logo=code&logoColor=white" alt="Examples" />
      </a>
    </span>
  </p>

</div>

## 🏋🏼‍♀️ ExerciseDB API

ExerciseDB API is a **comprehensive and developer-friendly database** featuring over **5,000 structured, high-quality fitness exercises**. It delivers fast, modern, and scalable access to detailed exercise data—including targeted muscle groups, required equipment, visual aids (images and videos), and step-by-step instructions. Ideal for developers, fitness startups, and health platforms, ExerciseDB empowers the creation of smart workout apps, personalized training plans, and interactive fitness tools.

**Perfect for:**

- 💪 Fitness app developers
- 🏃‍♀️ Health & wellness platforms
- 🎯 Personal training applications
- 📱 Workout planning tools
- 🔬 Fitness research projects

<br>

## 🔄 Syncing Exercise Data Locally

To run the API fully offline, you need to download all exercises and GIF animations from the external ExerciseDB RapidAPI.

**Prerequisites:** A RapidAPI key with access to the ExerciseDB API.

1. Copy `.env.example` to `.env` and set your key:
   ```bash
   cp .env.example .env
   # Edit .env and replace `your_key_here` with your RAPIDAPI_KEY
   ```

2. Run the sync script:
   ```bash
   bun run sync
   ```

The script downloads ~1,300 exercises and their GIF animations in 4 resolutions (180px, 360px, 720px, 1080px), storing them under `media/` and updating `src/data/exercises.json`. If interrupted, it resumes automatically from a checkpoint at `scripts/.sync-checkpoint.json`.

> **Note:** `RAPIDAPI_KEY` environment variable must be set before running `bun run sync`.

---

## 🚀 Deploy Your Own API (V1)

Want to self-host the open-source ExerciseDB API (V1)?

You can instantly deploy it to **Vercel** with just one click and have your own version running in seconds — no backend setup needed.

<div align="left">

[![Deploy with Vercel](https://vercel.com/button)](https://dub.sh/DeployNow)

</div>

## 🔗 Useful Links

<div align="left">

### 📚 **Documentation & Plans**

<a href="https://dub.sh/JTgJoq2" target="_blank">
  <img src="https://img.shields.io/badge/Full%20Documentation-2D2D2D?style=for-the-badge&logo=notion&logoColor=white" alt="Full Documentation" />
</a>
<a href="https://dub.sh/JTgJoq2" target="_blank">
  <img src="https://img.shields.io/badge/Pricing%20Plans-404040?style=for-the-badge&logo=credit-card&logoColor=white" alt="Pricing Plans" />
</a>
<a href="https://dub.sh/exercisedb-api-tos" target="_blank">
  <img src="https://img.shields.io/badge/Terms%20Of%20Use-2D2D2D?style=for-the-badge&logo=notion&logoColor=white" alt="Terms of use" />
</a>
<br>

### 🧪 **API Playground**

<strong>Test our datasets and explore API endpoints</strong><br>
<em>⚠️ These endpoints are for exploration only and <strong>not recommended for production integration</strong> — strict rate limits and potential instability may apply.</em>
<br><br>
<strong style="color: red;">**Note:** V1 and V2 refer to different datasets.</strong>
<br>

  <p>
    <a href="https://dub.sh/exercisedb_v2" target="_blank">
      <img src="https://img.shields.io/badge/v2%20Playground-5A5A5A?style=for-the-badge&logo=play&logoColor=white" alt="v2 Playground" />
    </a>
    <a href="https://dub.sh/exercisedb_v1" target="_blank">
      <img src="https://img.shields.io/badge/v1%20Playground-5A5A5A?style=for-the-badge&logo=play&logoColor=white" alt="v1 Playground" />
    </a>
  </p>

</div>

## 📬 Support & Contact

<div align="left">

<p><strong>Need help or have questions? We're here to assist!</strong></p>

<table>
  <tr>
    <td align="left">
      <a href="mailto:hello@exercisedb.dev">
        <img src="https://img.shields.io/badge/General%20Inquiries-2D2D2D?style=for-the-badge&logo=mail&logoColor=white" alt="General Inquiries" />
      </a>
      <br>
      <small>✉️ Partnerships & General Questions</small>
    </td>
    <td align="left">
      <a href="mailto:support@exercisedb.dev">
        <img src="https://img.shields.io/badge/Technical%20Support-404040?style=for-the-badge&logo=wrench&logoColor=white" alt="Technical Support" />
      </a>
      <br>
      <small>🛠️ API Help & Technical Issues</small>
    </td>
    <td align="left">
      <a href="https://t.me/exercisedb" target="_blank">
        <img src="https://img.shields.io/badge/Chat%20With%20Us-5A5A5A?style=for-the-badge&logo=message-circle&logoColor=white" alt="Chat With Us" />
      </a>
      <br>
      <small>💬 Live Chat Support (Fast Response)</small>
    </td>
  </tr>
</table>

</div>

<br>

## 🏋️‍♂️ V2 Exercise Sample

```json
{
  "exerciseId": "K6NnTv0",
  "name": "Bench Press",
  "imageUrl": "Barbell-Bench-Press_Chest.png",
  "equipments": ["Barbell"],
  "bodyParts": ["Chest"],
  "exerciseType": "weight_reps",
  "targetMuscles": ["Pectoralis Major Clavicular Head"],
  "secondaryMuscles": ["Deltoid Anterior", "Pectoralis Major Clavicular Head", "Triceps Brachii"],
  "videoUrl": "Barbell-Bench-Press_Chest_.mp4",
  "keywords": [
    "Chest workout with barbell",
    "Barbell bench press exercise",
    "Strength training for chest",
    "Upper body workout with barbell",
    "Barbell chest exercises",
    "Bench press for chest muscles",
    "Building chest muscles with bench press",
    "Chest strengthening with barbell",
    "Bench press workout routine",
    "Barbell exercises for chest muscle growth"
  ],
  "overview": "The Bench Press is a classic strength training exercise that primarily targets the chest, shoulders, and triceps, contributing to upper body muscle development. It is suitable for anyone, from beginners to professional athletes, looking to improve their upper body strength and muscular endurance. Individuals may want to incorporate bench press into their routine for its effectiveness in enhancing physical performance, promoting bone health, and improving body composition.",
  "instructions": [
    "Grip the barbell with your hands slightly wider than shoulder-width apart, palms facing your feet, and lift it off the rack, holding it straight over your chest with your arms fully extended.",
    "Slowly lower the barbell down to your chest while keeping your elbows at a 90-degree angle.",
    "Once the barbell touches your chest, push it back up to the starting position while keeping your back flat on the bench.",
    "Repeat this process for the desired number of repetitions, always maintaining control of the barbell and ensuring your form is correct."
  ],
  "exerciseTips": [
    "Avoid Arching Your Back: One common mistake is excessively arching the back during the lift. This can lead to lower back injuries. Your lower back should have a natural arch, but it should not be overly exaggerated. Your butt, shoulders, and head should maintain contact with the bench at all times.",
    "Controlled Movement: Avoid the temptation to lift the barbell too quickly. A controlled, steady lift is more effective and reduces the risk of injury. Lower the bar to your mid-chest slowly, pause briefly, then push it back up without locking your elbows at the top.",
    "Don't Lift Alone:"
  ],
  "variations": [
    "Decline Bench Press: This variation is performed on a decline bench to target the lower part of the chest.",
    "Close-Grip Bench Press: This variation focuses on the triceps and the inner part of the chest by placing the hands closer together on the bar.",
    "Dumbbell Bench Press: This variation uses dumbbells instead of a barbell, allowing for a greater range of motion and individual arm movement.",
    "Reverse-Grip Bench Press: This variation is performed by flipping your grip so that your palms face towards you, targeting the upper chest and triceps."
  ],
  "relatedExerciseIds": [
    "U0uPZBq",
    "QD32SbB",
    "pdm4AfV",
    "SebLXCG",
    "T3JogV7",
    "hiWPEs1",
    "Y5ppDdt",
    "C8OV7Pv",
    "r3tQt3U",
    "dCSgT7N"
  ]
}
```

### 🖼️ Sample Image

![Bench Press Exercise](https://ucarecdn.com/c12bb487-7390-4fc7-903c-a1c2298e70ad/K6NnTv0__BarbellBenchPress_Chest.png)

### 🎥 Sample Video

[Watch Bench Press Video Sample](https://github.com/user-attachments/assets/6845a963-4d80-4dfd-b602-e49616a9483f)

---

<em>💪 Now that you’ve bench pressed through the sample… go lift the rest of the v2 dataset like a champ! 😄<em>
