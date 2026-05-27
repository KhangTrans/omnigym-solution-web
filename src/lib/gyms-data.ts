export type Gym = {
  id: string;
  brandId: string;
  name: string;
  city: string;
  address: string;
  hours: string;
  phone: string;
  image: string;
  amenities: string[];
  packIds: string[];
  trainerIds: string[];
  reviews: Review[];
  rating: number;
  facilities: Facility[];
};

export type Brand = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  ownerEmail: string;
  /**
   * "system" = multi-branch chain (can add many branches across cities)
   * "standalone" = single-location gym (one branch only, can upgrade later)
   */
  type: "system" | "standalone";
};

export const BRANDS: Brand[] = [
  {
    id: "omnigym",
    name: "OmniGym",
    tagline: "Train hard. Live stronger.",
    description:
      "Premium full-service gyms across NYC with strength labs, group classes and recovery zones.",
    logo: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80",
    ownerEmail: "partner@omnigym.fit",
    type: "system",
  },
  {
    id: "flexfit",
    name: "FlexFit Studio",
    tagline: "Boutique strength, one studio.",
    description:
      "A single-location boutique strength studio focused on small-group coaching.",
    logo: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&q=80",
    ownerEmail: "hello@flexfit.studio",
    type: "standalone",
  },
];

export function getBrand(id: string) {
  return BRANDS.find((b) => b.id === id);
}

export type Facility = {
  name: string;
  image: string;
  description: string;
  gallery?: string[];
  highlights?: string[];
};

export function facilitySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getFacility(gymId: string, slug: string) {
  const gym = GYMS.find((g) => g.id === gymId);
  if (!gym) return undefined;
  const facility = gym.facilities.find((f) => facilitySlug(f.name) === slug);
  if (!facility) return undefined;
  return { gym, facility };
}

export type Review = {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  text: string;
};

export type Trainer = {
  id: string;
  name: string;
  title: string;
  photo: string;
  yearsExperience: number;
  specialties: string[];
  bio: string;
  certifications: { name: string; issuer: string; year: number }[];
  rating: number;
  reviews: Review[];
  hourlyRate: number;
};

export const TRAINERS: Trainer[] = [
  {
    id: "diego",
    name: "Diego Rivera",
    title: "HIIT & Conditioning Coach",
    photo:
      "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=800&q=80",
    yearsExperience: 8,
    specialties: ["HIIT", "Fat Loss", "Boxing"],
    bio: "Former competitive boxer with a passion for high-intensity training. Diego designs programs that get measurable results in 8-week cycles.",
    certifications: [
      { name: "NASM Certified Personal Trainer", issuer: "NASM", year: 2017 },
      { name: "Precision Nutrition L1", issuer: "Precision Nutrition", year: 2019 },
      { name: "USA Boxing Coach", issuer: "USA Boxing", year: 2020 },
    ],
    rating: 4.9,
    hourlyRate: 85,
    reviews: [
      { id: "tr1", author: "Marcus L.", rating: 5, date: "2 weeks ago", text: "Lost 12 lbs in 6 weeks following Diego's plan. Tough but fair." },
      { id: "tr2", author: "Priya S.", rating: 5, date: "1 month ago", text: "Best coach I've had. He pushes you exactly the right amount." },
    ],
  },
  {
    id: "maya",
    name: "Maya Chen",
    title: "Yoga & Mobility Specialist",
    photo:
      "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=800&q=80",
    yearsExperience: 10,
    specialties: ["Yoga", "Mobility", "Recovery"],
    bio: "Maya blends classical Hatha yoga with modern mobility science. Her clients move better and recover faster — at any age.",
    certifications: [
      { name: "RYT-500 Yoga Teacher", issuer: "Yoga Alliance", year: 2015 },
      { name: "FRC Mobility Specialist", issuer: "Functional Range Conditioning", year: 2021 },
    ],
    rating: 4.8,
    hourlyRate: 75,
    reviews: [
      { id: "tr3", author: "Jordan L.", rating: 5, date: "3 days ago", text: "Helped me fix chronic back pain. Patient and incredibly knowledgeable." },
      { id: "tr4", author: "Ava T.", rating: 4, date: "3 weeks ago", text: "Calming and skilled. Great for early-morning sessions." },
    ],
  },
  {
    id: "sam",
    name: "Sam Patel",
    title: "Strength & Powerlifting",
    photo:
      "https://images.unsplash.com/photo-1583500178690-f7fd39a85a12?w=800&q=80",
    yearsExperience: 12,
    specialties: ["Powerlifting", "Strength", "Hypertrophy"],
    bio: "USAPL-tested powerlifter with a 600+ lb squat. Sam coaches lifters from first deadlift to first meet.",
    certifications: [
      { name: "NSCA-CSCS", issuer: "NSCA", year: 2014 },
      { name: "Starting Strength Coach", issuer: "Starting Strength", year: 2018 },
    ],
    rating: 5.0,
    hourlyRate: 95,
    reviews: [
      { id: "tr5", author: "Noor H.", rating: 5, date: "1 week ago", text: "Added 80 lbs to my deadlift in 4 months. Incredible programming." },
      { id: "tr6", author: "Marco B.", rating: 5, date: "2 months ago", text: "Sam knows his stuff. Fixed my squat form in one session." },
    ],
  },
  {
    id: "alex",
    name: "Alex Kim",
    title: "Boxing & Combat Conditioning",
    photo:
      "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&q=80",
    yearsExperience: 6,
    specialties: ["Boxing", "Footwork", "Conditioning"],
    bio: "Golden Gloves finalist turned coach. Alex teaches technique-first boxing for all skill levels.",
    certifications: [
      { name: "USA Boxing Coach Level 2", issuer: "USA Boxing", year: 2020 },
      { name: "ACE Certified Personal Trainer", issuer: "ACE", year: 2019 },
    ],
    rating: 4.7,
    hourlyRate: 70,
    reviews: [
      { id: "tr7", author: "Sofia R.", rating: 5, date: "5 days ago", text: "Made boxing approachable for a total beginner. So much fun." },
      { id: "tr8", author: "Liam P.", rating: 4, date: "1 month ago", text: "Sharp coach, great energy in the ring." },
    ],
  },
  {
    id: "nora",
    name: "Nora Lindgren",
    title: "Functional & Pre/Post-Natal",
    photo:
      "https://images.unsplash.com/photo-1609899537878-88d5ba429bdf?w=800&q=80",
    yearsExperience: 9,
    specialties: ["Functional", "Pre/Post-Natal", "Rehab"],
    bio: "Nora specializes in safe, effective programming for new parents and clients returning from injury.",
    certifications: [
      { name: "NASM-CPT", issuer: "NASM", year: 2016 },
      { name: "Pre/Post-Natal Performance", issuer: "Girls Gone Strong", year: 2020 },
    ],
    rating: 4.9,
    hourlyRate: 80,
    reviews: [
      { id: "tr9", author: "Hannah K.", rating: 5, date: "1 week ago", text: "Got me back to lifting safely after my pregnancy. Game changer." },
    ],
  },
];

export function getTrainer(id: string) {
  return TRAINERS.find((t) => t.id === id);
}

const r = (id: string, author: string, rating: number, date: string, text: string): Review => ({ id, author, rating, date, text });

export const GYMS: Gym[] = [
  {
    id: "downtown",
    brandId: "omnigym",
    name: "OmniGym Downtown",
    city: "New York, NY",
    address: "120 Broadway, Manhattan",
    hours: "Mon–Sun · 5:00 – 23:00",
    phone: "+1 (212) 555-0142",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80",
    amenities: ["Strength Lab", "Boxing Ring", "Sauna", "Open 18h"],
    packIds: ["pk1", "pk2"],
    trainerIds: ["diego", "sam", "alex"],
    rating: 4.8,
    reviews: [
      r("d1", "Marcus L.", 5, "1 week ago", "Best gym in Manhattan. Equipment is always clean and the boxing ring is a treat."),
      r("d2", "Priya S.", 5, "2 weeks ago", "Open early, never crowded at 6am. Staff are incredibly welcoming."),
      r("d3", "Hannah K.", 4, "1 month ago", "Love the strength lab. Wish the sauna was bigger but otherwise perfect."),
    ],
    facilities: [
      { name: "Strength Lab", description: "Olympic platforms, racks, and free weights for serious lifting.", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80" },
      { name: "Boxing Ring", description: "Full-size ring with heavy bags and speed bags for combat training.", image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80" },
      { name: "Cardio Floor", description: "Treadmills, bikes, and rowers facing skyline views.", image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80" },
      { name: "Sauna & Recovery", description: "Cedar sauna and cold plunge for post-session recovery.", image: "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=1200&q=80" },
    ],
  },
  {
    id: "brooklyn",
    brandId: "omnigym",
    name: "OmniGym Brooklyn",
    city: "Brooklyn, NY",
    address: "88 Wythe Ave, Williamsburg",
    hours: "Mon–Sun · 6:00 – 22:00",
    phone: "+1 (718) 555-0188",
    image:
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=80",
    amenities: ["Yoga Studio", "Functional Floor", "Showers"],
    packIds: ["pk1", "pk3"],
    trainerIds: ["maya", "nora", "sam"],
    rating: 4.7,
    reviews: [
      r("b1", "Jordan L.", 5, "3 days ago", "The yoga studio is gorgeous, light-filled and quiet. My happy place."),
      r("b2", "Ava T.", 4, "2 weeks ago", "Functional floor has everything I need. Friendly community."),
      r("b3", "Sofia R.", 5, "1 month ago", "Trainers actually care. Booking is easy through the app."),
    ],
    facilities: [
      { name: "Yoga Studio", description: "Sun-lit studio with bamboo floors for yoga, pilates, and mobility.", image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80" },
      { name: "Functional Floor", description: "Open turf with sleds, ropes, and rigs for functional training.", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=80" },
      { name: "Locker Rooms", description: "Spacious lockers with rainfall showers and premium amenities.", image: "https://images.unsplash.com/photo-1591291621164-2c6367723315?w=1200&q=80" },
      { name: "Lounge", description: "Coffee bar and co-working nook to unwind after class.", image: "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=1200&q=80" },
    ],
  },
  {
    id: "soho",
    brandId: "omnigym",
    name: "OmniGym SoHo",
    city: "New York, NY",
    address: "212 Mercer St, SoHo",
    hours: "Mon–Sun · 6:00 – 22:00",
    phone: "+1 (212) 555-0177",
    image:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1200&q=80",
    amenities: ["HIIT Zone", "Cycling Studio", "Cafe"],
    packIds: ["pk2", "pk3"],
    trainerIds: ["diego", "alex", "maya"],
    rating: 4.9,
    reviews: [
      r("s1", "Liam P.", 5, "5 days ago", "Cycling classes are world-class. The cafe smoothies are unreal."),
      r("s2", "Marco B.", 5, "3 weeks ago", "HIIT zone is well-designed. Never had to wait for equipment."),
      r("s3", "Noor H.", 5, "2 months ago", "Premium feel without being pretentious. Highly recommend."),
    ],
    facilities: [
      { name: "HIIT Zone", description: "Turf lanes, plyo boxes, and battle ropes for high-intensity sessions.", image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1200&q=80" },
      { name: "Cycling Studio", description: "Immersive indoor cycling room with stadium lighting and sound.", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80" },
      { name: "Cafe", description: "Smoothie and espresso bar serving organic, post-workout fuel.", image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&q=80" },
      { name: "Stretch Lounge", description: "Quiet recovery area with mats, foam rollers, and massage guns.", image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&q=80" },
    ],
  },
  {
    id: "queens",
    brandId: "omnigym",
    name: "OmniGym Queens",
    city: "Queens, NY",
    address: "45-12 Vernon Blvd, LIC",
    hours: "Mon–Sun · 5:30 – 23:00",
    phone: "+1 (718) 555-0123",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80",
    amenities: ["Strength Lab", "Pool", "Sauna", "Parking"],
    packIds: ["pk1", "pk2", "pk3"],
    trainerIds: ["sam", "nora", "maya", "alex"],
    rating: 4.6,
    reviews: [
      r("q1", "Hannah K.", 5, "1 week ago", "The pool is fantastic and parking makes it so convenient with kids."),
      r("q2", "Marcus L.", 4, "3 weeks ago", "Great variety of equipment. Can get busy after work but worth it."),
      r("q3", "Jordan L.", 5, "2 months ago", "Strength lab is huge. Best value membership in Queens."),
    ],
    facilities: [
      { name: "Strength Lab", description: "Two levels of racks, dumbbells up to 50kg, and dedicated deadlift platforms.", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80" },
      { name: "Indoor Pool", description: "Six-lane heated pool for laps, aqua classes, and family swim.", image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=80" },
      { name: "Sauna", description: "Finnish sauna with eucalyptus steam for deep recovery.", image: "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=1200&q=80" },
      { name: "Group Fitness Studio", description: "Mirrored studio with sprung floors hosting 40+ weekly classes.", image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1200&q=80" },
    ],
  },
  {
    id: "flexfit-loft",
    brandId: "flexfit",
    name: "FlexFit Loft",
    city: "New York, NY",
    address: "210 W 14th St, Chelsea",
    hours: "Mon–Sat · 6:30 – 21:00",
    phone: "+1 (212) 555-0199",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80",
    amenities: ["Small-group coaching", "Open floor", "Showers"],
    packIds: ["pk1"],
    trainerIds: ["sam"],
    rating: 4.9,
    reviews: [
      r("f1", "Iris Tan", 5, "1 week ago", "Tiny studio, huge attention to detail. Coaches know everyone by name."),
      r("f2", "Owen R.", 5, "2 weeks ago", "The only place I've actually stuck with a program for a full year."),
    ],
    facilities: [
      { name: "Open Floor", description: "Single-room studio with racks, dumbbells and turf strip.", image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80" },
      { name: "Recovery Nook", description: "Foam rollers, bands and a stretch corner by the windows.", image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&q=80" },
    ],
  },
];

export function getGym(id: string) {
  return GYMS.find((g) => g.id === id);
}

export function getBranches(brandId: string) {
  return GYMS.filter((g) => g.brandId === brandId);
}

export function getBrandForGym(gymId: string) {
  const g = getGym(gymId);
  return g ? getBrand(g.brandId) : undefined;
}