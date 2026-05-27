import { Flame, Heart, Dumbbell, Zap, type LucideIcon } from "lucide-react";

export type ClassItem = {
  id: string;
  time: string;
  name: string;
  trainer: string;
  trainerBio: string;
  duration: number;
  level: string;
  spots: number;
  studio: string;
  icon: LucideIcon;
  intensity: 1 | 2 | 3;
  focus: string;
  calories: number;
  equipment: string[];
  exercises: { name: string; detail: string; rounds?: string }[];
  notes: string;
};

export const DAYS = [
  { key: "mon", label: "Mon", date: "12" },
  { key: "tue", label: "Tue", date: "13" },
  { key: "wed", label: "Wed", date: "14" },
  { key: "thu", label: "Thu", date: "15" },
  { key: "fri", label: "Fri", date: "16" },
  { key: "sat", label: "Sat", date: "17" },
  { key: "sun", label: "Sun", date: "18" },
];

const baseExercises = {
  hiit: [
    { name: "Burpees", detail: "Explosive full body", rounds: "4 × 40s" },
    { name: "Kettlebell swings", detail: "16kg / 24kg", rounds: "4 × 20 reps" },
    { name: "Box jumps", detail: "60cm box", rounds: "4 × 12 reps" },
    { name: "Battle ropes", detail: "Alternating waves", rounds: "4 × 30s" },
    { name: "Mountain climbers", detail: "Fast tempo", rounds: "4 × 45s" },
  ],
  yoga: [
    { name: "Sun salutation A", detail: "Warm-up flow", rounds: "5 rounds" },
    { name: "Warrior series", detail: "I → II → reverse", rounds: "Both sides" },
    { name: "Hip openers", detail: "Pigeon, lizard", rounds: "2 min hold" },
    { name: "Spinal twists", detail: "Seated + supine", rounds: "1 min each" },
    { name: "Savasana", detail: "Guided breathwork", rounds: "8 min" },
  ],
  boxing: [
    { name: "Shadow boxing", detail: "Stance + footwork", rounds: "3 × 3 min" },
    { name: "Jab–cross combos", detail: "Pad work", rounds: "5 × 3 min" },
    { name: "Slip & weave drills", detail: "Defense", rounds: "4 × 2 min" },
    { name: "Heavy bag", detail: "Power output", rounds: "5 × 3 min" },
    { name: "Core finisher", detail: "Russian twists, planks", rounds: "3 × 1 min" },
  ],
  strength: [
    { name: "Back squat", detail: "Barbell, RPE 8", rounds: "5 × 5" },
    { name: "Deadlift", detail: "Conventional", rounds: "4 × 4" },
    { name: "Bench press", detail: "Pause reps", rounds: "4 × 6" },
    { name: "Pull-ups", detail: "Strict tempo", rounds: "4 × AMRAP" },
    { name: "Loaded carries", detail: "Farmer's walk 30m", rounds: "3 rounds" },
  ],
  light: [
    { name: "Mobility flow", detail: "Cat-cow, world's greatest", rounds: "10 min" },
    { name: "Goblet squats", detail: "Light kettlebell", rounds: "3 × 12" },
    { name: "Push-ups", detail: "Standard or incline", rounds: "3 × 10" },
    { name: "Plank holds", detail: "Front + side", rounds: "3 × 45s" },
  ],
};

const trainers = {
  maya: "Maya teaches breath-led flows with 9 years of Ashtanga and Vinyasa experience.",
  diego: "Diego is a former pro footballer turned conditioning coach. Loud music, louder energy.",
  alex: "Alex is a former amateur boxer (15-2) coaching footwork, defense, and combos.",
  sam: "Sam is a CSCS strength coach focused on raw barbell strength and longevity.",
};

function mk(
  id: string,
  time: string,
  name: string,
  trainerKey: keyof typeof trainers,
  trainer: string,
  duration: number,
  level: string,
  spots: number,
  studio: string,
  icon: LucideIcon,
  intensity: 1 | 2 | 3,
  type: keyof typeof baseExercises,
  focus: string,
  calories: number,
  equipment: string[],
  notes: string,
): ClassItem {
  return {
    id, time, name, trainer, trainerBio: trainers[trainerKey],
    duration, level, spots, studio, icon, intensity,
    focus, calories, equipment,
    exercises: baseExercises[type],
    notes,
  };
}

export const SCHEDULE: Record<string, ClassItem[]> = {
  mon: [
    mk("1", "06:30", "Sunrise Yoga", "maya", "Maya Chen", 60, "All", 8, "Studio A", Heart, 1, "yoga", "Mobility · breath", 220, ["Mat", "Block"], "Bring water. Arrive 5 min early to set up."),
    mk("2", "08:00", "HIIT Burn", "diego", "Diego Rivera", 45, "Inter.", 4, "Floor 2", Flame, 3, "hiit", "Conditioning · power", 520, ["Kettlebell", "Box", "Ropes"], "High intensity — bring a towel and electrolytes."),
    mk("3", "12:00", "Lunch Lift", "sam", "Sam Patel", 30, "All", 12, "Strength Lab", Dumbbell, 2, "light", "Full body · efficient", 280, ["Dumbbells"], "Express format — get in, get out, get back to work."),
    mk("4", "17:30", "Boxing 101", "alex", "Alex Kim", 60, "Beginner", 6, "Ring", Zap, 2, "boxing", "Footwork · combos", 480, ["Wraps", "Gloves"], "Wraps available at the front desk if you forget yours."),
    mk("5", "19:00", "Power Hour", "diego", "Diego Rivera", 60, "Advanced", 2, "Floor 2", Flame, 3, "hiit", "Max output", 620, ["Barbell", "KB"], "Advanced session — recent HIIT experience required."),
  ],
  tue: [
    mk("6", "07:00", "Mobility Flow", "maya", "Maya Chen", 45, "All", 10, "Studio A", Heart, 1, "yoga", "Recovery · range", 180, ["Mat", "Strap"], "Perfect after leg day."),
    mk("7", "12:30", "Express HIIT", "diego", "Diego Rivera", 30, "Inter.", 7, "Floor 2", Flame, 3, "hiit", "30-min burn", 380, ["KB", "Box"], "Fastest class on the schedule."),
    mk("8", "18:00", "Strength Lab", "sam", "Sam Patel", 75, "Advanced", 3, "Strength Lab", Dumbbell, 3, "strength", "Heavy compound lifts", 540, ["Barbell", "Rack"], "Programmed cycle — sign up for the full 8 weeks."),
    mk("9", "20:00", "Cool Down Yoga", "maya", "Maya Chen", 45, "All", 14, "Studio A", Heart, 1, "yoga", "Wind down · sleep", 160, ["Mat"], "Dim lights, calm music. Bring socks."),
  ],
  wed: [
    mk("10", "06:30", "Sunrise Yoga", "maya", "Maya Chen", 60, "All", 9, "Studio A", Heart, 1, "yoga", "Mobility · breath", 220, ["Mat", "Block"], "Same flow as Monday — great for building the habit."),
    mk("11", "10:00", "Boxing Drills", "alex", "Alex Kim", 60, "Inter.", 5, "Ring", Zap, 2, "boxing", "Defense · combos", 460, ["Wraps", "Gloves"], "Some boxing experience expected."),
    mk("12", "17:00", "HIIT Burn", "diego", "Diego Rivera", 45, "Inter.", 1, "Floor 2", Flame, 3, "hiit", "Conditioning", 520, ["KB", "Box"], "Last spot — going fast."),
    mk("13", "19:30", "Strength Lab", "sam", "Sam Patel", 75, "Advanced", 8, "Strength Lab", Dumbbell, 3, "strength", "Lower body focus", 540, ["Barbell", "Rack"], "Squat-day. Foam roller recommended."),
  ],
  thu: [
    mk("14", "07:30", "Power Yoga", "maya", "Maya Chen", 60, "Inter.", 6, "Studio A", Heart, 2, "yoga", "Strength · flow", 320, ["Mat"], "Faster pace — held arm balances."),
    mk("15", "12:00", "Lunch Lift", "sam", "Sam Patel", 30, "All", 11, "Strength Lab", Dumbbell, 2, "light", "Full body", 280, ["Dumbbells"], "Express format."),
    mk("16", "18:30", "Boxing 101", "alex", "Alex Kim", 60, "Beginner", 4, "Ring", Zap, 2, "boxing", "Fundamentals", 480, ["Wraps", "Gloves"], "First-timers welcome."),
  ],
  fri: [
    mk("17", "06:30", "Sunrise Yoga", "maya", "Maya Chen", 60, "All", 7, "Studio A", Heart, 1, "yoga", "Mobility · breath", 220, ["Mat"], "End the work week relaxed."),
    mk("18", "08:00", "Friday Burn", "diego", "Diego Rivera", 45, "Advanced", 2, "Floor 2", Flame, 3, "hiit", "AMRAP finisher", 560, ["KB", "Ropes"], "Send-off for the weekend."),
    mk("19", "17:30", "Strength Lab", "sam", "Sam Patel", 75, "Advanced", 5, "Strength Lab", Dumbbell, 3, "strength", "Upper body", 520, ["Barbell", "Rack"], "Push/pull day."),
    mk("20", "19:00", "Fight Night", "alex", "Alex Kim", 60, "Inter.", 3, "Ring", Zap, 3, "boxing", "Sparring drills", 540, ["Headgear", "Gloves"], "Light contact — headgear required."),
  ],
  sat: [
    mk("21", "09:00", "Weekend Flow", "maya", "Maya Chen", 75, "All", 12, "Studio A", Heart, 1, "yoga", "Long form flow", 280, ["Mat", "Block"], "Extended Saturday session."),
    mk("22", "10:30", "HIIT Burn", "diego", "Diego Rivera", 45, "Inter.", 6, "Floor 2", Flame, 3, "hiit", "Conditioning", 520, ["KB", "Box"], "Fuel up beforehand."),
    mk("23", "12:00", "Boxing 101", "alex", "Alex Kim", 60, "Beginner", 8, "Ring", Zap, 2, "boxing", "Fundamentals", 480, ["Wraps", "Gloves"], "Saturday social — stick around for coffee."),
  ],
  sun: [
    mk("24", "10:00", "Slow Flow", "maya", "Maya Chen", 60, "All", 15, "Studio A", Heart, 1, "yoga", "Reset · restore", 200, ["Mat", "Bolster"], "Sunday reset. Bring a blanket."),
    mk("25", "11:30", "Recovery Lift", "sam", "Sam Patel", 45, "All", 9, "Strength Lab", Dumbbell, 1, "light", "Light & technical", 240, ["Dumbbells"], "Deload day — focus on form."),
  ],
};

export function findClass(id: string): { item: ClassItem; dayKey: string } | null {
  for (const [dayKey, items] of Object.entries(SCHEDULE)) {
    const item = items.find((c) => c.id === id);
    if (item) return { item, dayKey };
  }
  return null;
}