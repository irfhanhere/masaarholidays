import type {
  TransferRow,
  TransferType,
  TransferVehicleRow,
  TransferRouteRateRow,
} from "@/lib/types/database";

export type { TransferType };

export interface TransferCategoryMeta {
  id: TransferType;
  name: string;
  slug: string;
  badge: string;
  bannerImage: string;
  description: string;
}

export const TRANSFER_CATEGORIES: Record<TransferType, TransferCategoryMeta> = {
  airport: {
    id: "airport",
    name: "Airport Transfers",
    slug: "airport",
    badge: "Airport Transfers",
    bannerImage: "/brand/banners/Airport Banner.webp",
    description:
      "Private meet & greet transfers between King Abdulaziz Airport (Jeddah), Madinah Airport, and hotels in Makkah and Madinah.",
  },
  intercity: {
    id: "intercity",
    name: "Intercity Transfers",
    slug: "intercity",
    badge: "Intercity Transfers",
    bannerImage: "/brand/banners/Intercity Transfers.webp",
    description:
      "Comfortable door-to-door journeys connecting Makkah and Madinah with direct highway routes and historical stopovers.",
  },
  ziyarat: {
    id: "ziyarat",
    name: "Ziyarat",
    slug: "ziyarat",
    badge: "Ziyarat",
    bannerImage: "/brand/banners/Ziyarat Transfers.webp",
    description:
      "Private historical sightseeing tours to sacred Islamic landmarks across Makkah Al-Mukarramah and Madinah Al-Munawwarah.",
  },
  train: {
    id: "train",
    name: "Haramain Train Transfers",
    slug: "train",
    badge: "Train Station",
    bannerImage: "/brand/banners/Haramain Train Transfers.webp",
    description:
      "Seamless hotel connections to and from the Haramain High Speed Rail stations in Makkah, Madinah, and Jeddah.",
  },
  "day-trip": {
    id: "day-trip",
    name: "Day Trips",
    slug: "day-trip",
    badge: "Day Trips",
    bannerImage: "/brand/banners/Day Trips & Return Journeys.webp",
    description:
      "Full-day private excursions from Jeddah and Makkah to the cool mountain heights of Taif with dedicated chauffeur.",
  },
  other: {
    id: "other",
    name: "Other Transfers",
    slug: "other",
    badge: "Other Transfers",
    bannerImage: "/brand/banners/default.webp",
    description: "Custom point-to-point private transfers across Saudi Arabia.",
  },
};

export interface VehicleCatalogItem {
  id?: string;
  name: string;
  slug: string;
  vehicle_type: string;
  model_year: string;
  image_url: string;
  passenger_capacity: number;
  luggage_capacity: number;
  description: string;
  detailed_description: string;
  features: string[];
  spec_verified: boolean;
  display_order: number;
}

export const VERIFIED_VEHICLE_CATALOG: VehicleCatalogItem[] = [
  {
    name: "Toyota Camry",
    slug: "toyota-camry",
    vehicle_type: "Sedan",
    model_year: "2023 – 2026",
    image_url: "/vehicles/TOYOTA CAMERY.webp",
    passenger_capacity: 3,
    luggage_capacity: 3,
    description: "Comfortable sedan, ideal for small families and couples.",
    detailed_description:
      "Our Toyota Camry fleet provides smooth, quiet, and air-conditioned travel for couples and small families. Suitable for up to 3 passengers with 3 medium-sized suitcases.",
    features: ["Comfortable sedan", "Ideal for small families", "Air-conditioned", "Professional driver"],
    spec_verified: true,
    display_order: 1,
  },
  {
    name: "Hyundai Staria",
    slug: "hyundai-staria",
    vehicle_type: "Modern MPV",
    model_year: "2023 – 2026",
    image_url: "/vehicles/Hyundai Staria.webp",
    passenger_capacity: 7,
    luggage_capacity: 7,
    description: "Modern and spacious MPV, ideal for families and small groups.",
    detailed_description:
      "The futuristic Hyundai Staria features generous cabin space, wide panoramic windows, and comfortable seating for up to 7 passengers with luggage.",
    features: ["Modern & spacious MPV", "Ideal for families", "Smooth highway ride", "Professional driver"],
    spec_verified: true,
    display_order: 2,
  },
  {
    name: "GMC XL Yukon",
    slug: "gmc-xl-yukon",
    vehicle_type: "Luxury VIP SUV",
    model_year: "2023 – 2026",
    image_url: "/vehicles/gmc-yukon-suburban.webp",
    passenger_capacity: 6,
    luggage_capacity: 6,
    description: "Spacious and luxurious SUV, ideal for families seeking extra comfort.",
    detailed_description:
      "Our flagship GMC Yukon XL provides premium luxury leather seating, generous legroom, and unmatched comfort across long highway routes between Makkah and Madinah.",
    features: ["Luxury VIP SUV", "Premium leather seating", "Extra luggage room", "VIP comfort"],
    spec_verified: true,
    display_order: 3,
  },
  {
    name: "Hiace Grand Cabin",
    slug: "hiace-grand-cabin",
    vehicle_type: "High-Roof Van",
    model_year: "2023 – 2026",
    image_url: "/vehicles/Toyota Hiace Grand Cabin.webp",
    passenger_capacity: 12,
    luggage_capacity: 12,
    description: "Extra space and comfort, ideal for larger groups and extended families.",
    detailed_description:
      "The Toyota Hiace Grand Cabin high-roof van delivers spacious headroom, individual passenger seating, and dedicated luggage space for groups of up to 12.",
    features: ["High-roof cabin", "Large group capacity", "Ample luggage space", "Smooth highway ride"],
    spec_verified: true,
    display_order: 4,
  },
  {
    name: "Toyota Coaster",
    slug: "toyota-coaster",
    vehicle_type: "Minibus",
    model_year: "2023 – 2026",
    image_url: "/vehicles/Toyota Coaster.webp",
    passenger_capacity: 24,
    luggage_capacity: 24,
    description: "Ideal for large groups, Umrah delegations, and corporate travel.",
    detailed_description:
      "The Toyota Coaster minibus is built for group pilgrimage travel with 24 passenger seats, high-capacity air conditioning, and a dedicated luggage compartment.",
    features: ["24-seater minibus", "High-capacity A/C", "Group delegation transport", "Experienced driver"],
    spec_verified: true,
    display_order: 5,
  },
];

/** Supplied Rate Card from brief: route slug -> vehicle name -> price in AED */
export const SUPPLIED_RATE_CARD: Record<string, Record<string, number>> = {
  "jeddah-airport-to-makkah-hotel": {
    "Toyota Camry": 250,
    "Hyundai Staria": 300,
    "GMC XL Yukon": 500,
    "Hiace Grand Cabin": 350,
    "Toyota Coaster": 500,
  },
  "makkah-hotel-to-jeddah-airport": {
    "Toyota Camry": 200,
    "Hyundai Staria": 250,
    "GMC XL Yukon": 400,
    "Hiace Grand Cabin": 300,
    "Toyota Coaster": 450,
  },
  "jeddah-airport-to-madinah-hotel": {
    "Toyota Camry": 500,
    "Hyundai Staria": 550,
    "GMC XL Yukon": 950,
    "Hiace Grand Cabin": 650,
    "Toyota Coaster": 950,
  },
  "madinah-hotel-to-jeddah-airport": {
    "Toyota Camry": 450,
    "Hyundai Staria": 500,
    "GMC XL Yukon": 850,
    "Hiace Grand Cabin": 600,
    "Toyota Coaster": 850,
  },
  "madinah-airport-to-madinah-hotel": {
    "Toyota Camry": 125,
    "Hyundai Staria": 175,
    "GMC XL Yukon": 275,
    "Hiace Grand Cabin": 300,
    "Toyota Coaster": 400,
  },
  "madinah-hotel-to-madinah-airport": {
    "Toyota Camry": 100,
    "Hyundai Staria": 150,
    "GMC XL Yukon": 225,
    "Hiace Grand Cabin": 250,
    "Toyota Coaster": 350,
  },
  "makkah-hotel-to-madinah-hotel": {
    "Toyota Camry": 400,
    "Hyundai Staria": 450,
    "GMC XL Yukon": 800,
    "Hiace Grand Cabin": 550,
    "Toyota Coaster": 800,
  },
  "makkah-hotel-to-madinah-hotel-via-badr": {
    "Toyota Camry": 550,
    "Hyundai Staria": 650,
    "GMC XL Yukon": 1000,
    "Hiace Grand Cabin": 750,
    "Toyota Coaster": 1000,
  },
  "makkah-madinah-ziyarat": {
    "Toyota Camry": 200,
    "Hyundai Staria": 275,
    "GMC XL Yukon": 400,
    "Hiace Grand Cabin": 300,
    "Toyota Coaster": 450,
  },
  "makkah-madinah-train-station": {
    "Toyota Camry": 125,
    "Hyundai Staria": 175,
    "GMC XL Yukon": 300,
    "Hiace Grand Cabin": 250,
    "Toyota Coaster": 300,
  },
  "jeddah-taif-return": {
    "Toyota Camry": 575,
    "Hyundai Staria": 725,
    "GMC XL Yukon": 1100,
    "Hiace Grand Cabin": 850,
    "Toyota Coaster": 1100,
  },
  "makkah-taif-return": {
    "Toyota Camry": 425,
    "Hyundai Staria": 575,
    "GMC XL Yukon": 950,
    "Hiace Grand Cabin": 675,
    "Toyota Coaster": 950,
  },
};

export interface VerifiedRouteMeta {
  route_name: string;
  slug: string;
  transfer_type: TransferType;
  image_url: string;
  pickup_location: string;
  dropoff_location: string;
  route_type: "one-way" | "round-trip";
  duration: string;
  description: string;
  long_description: string;
  route_notes: string;
  featured: boolean;
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
}

export const VERIFIED_ROUTE_CATALOG: Record<string, VerifiedRouteMeta> = {
  "jeddah-airport-to-makkah-hotel": {
    route_name: "Jeddah Airport → Makkah Hotel",
    slug: "jeddah-airport-to-makkah-hotel",
    transfer_type: "airport",
    image_url: "/trips/private-transfers-card-home.webp",
    pickup_location: "King Abdulaziz International Airport (JED) Arrivals",
    dropoff_location: "Makkah Hotel (Haram / Aziziyah)",
    route_type: "one-way",
    duration: "1.5 to 2 hours",
    description:
      "Private transfer from King Abdulaziz International Airport (JED) to your hotel in Makkah, with meet & greet and luggage assistance.",
    long_description:
      "Begin your Umrah pilgrimage with absolute peace of mind. Our experienced chauffeur will meet you in the airport arrivals terminal with a personalized name board, assist with your luggage, and drive you smoothly to your hotel in Makkah in a private, air-conditioned vehicle.",
    route_notes:
      "Meet & greet inside the arrivals terminal. Flight arrival times are monitored automatically for delays. Complimentary waiting time included.",
    featured: true,
    seo_title: "Jeddah Airport to Makkah Hotel Transfer | Masaar Holidays",
    meta_description:
      "Book private transfer from Jeddah Airport to your Makkah hotel. Modern fleet, punctual drivers, and meet & greet service. Enquire on WhatsApp today.",
    focus_keyword: "Jeddah Airport to Makkah hotel transfer",
  },
  "makkah-hotel-to-jeddah-airport": {
    route_name: "Makkah Hotel → Jeddah Airport",
    slug: "makkah-hotel-to-jeddah-airport",
    transfer_type: "airport",
    image_url: "/trips/Makkah Hotel → Jeddah Airport.webp",
    pickup_location: "Makkah Hotel Lobby",
    dropoff_location: "King Abdulaziz International Airport (JED) Departures",
    route_type: "one-way",
    duration: "1.5 to 2 hours",
    description:
      "Comfortable and timely transfer from your Makkah hotel to Jeddah Airport, scheduled seamlessly for your flight departure.",
    long_description:
      "Ensure a tranquil and punctual conclusion to your Umrah journey. We pick you up directly from your Makkah hotel lobby and transfer you to King Abdulaziz International Airport with ample time for check-in and luggage procedures.",
    route_notes:
      "We recommend scheduling pickup at least 4 to 5 hours prior to international flights to ensure a relaxed check-in.",
    featured: false,
    seo_title: "Makkah Hotel to Jeddah Airport Transfer | Masaar Holidays",
    meta_description:
      "Reliable private transfer from your Makkah hotel to Jeddah Airport. Punctual departures with professional drivers and luggage care. Enquire now.",
    focus_keyword: "Makkah hotel to Jeddah Airport transfer",
  },
  "jeddah-airport-to-madinah-hotel": {
    route_name: "Jeddah Airport → Madinah Hotel",
    slug: "jeddah-airport-to-madinah-hotel",
    transfer_type: "airport",
    image_url: "/trips/Jeddah Airport → Madinah Hotel.webp",
    pickup_location: "King Abdulaziz International Airport (JED) Arrivals",
    dropoff_location: "Madinah Hotel (Central Area / Markaziyah)",
    route_type: "one-way",
    duration: "4 to 4.5 hours",
    description:
      "Direct private highway transfer from King Abdulaziz International Airport (JED) to your hotel in Madinah Al-Munawwarah.",
    long_description:
      "Travel comfortably on the modern Hijrah highway straight to the city of the Prophet (peace be upon him). Enjoy chilled air conditioning, refreshment stops, and spacious seating.",
    route_notes:
      "Includes rest break stopover at clean highway service stations along the Hijrah Highway. Chilled bottled water provided.",
    featured: false,
    seo_title: "Jeddah Airport to Madinah Hotel Transfer | Masaar Holidays",
    meta_description:
      "Private transfer from King Abdulaziz Airport (JED) to Madinah hotel. Spacious SUVs, vans, and sedans with courteous drivers. Enquire on WhatsApp.",
    focus_keyword: "Jeddah Airport to Madinah hotel transfer",
  },
  "madinah-hotel-to-jeddah-airport": {
    route_name: "Madinah Hotel → Jeddah Airport",
    slug: "madinah-hotel-to-jeddah-airport",
    transfer_type: "airport",
    image_url: "/trips/Madinah Hotel → Jeddah Airport.webp",
    pickup_location: "Madinah Hotel Lobby",
    dropoff_location: "King Abdulaziz International Airport (JED) Departures",
    route_type: "one-way",
    duration: "4 to 4.5 hours",
    description:
      "Scheduled private departure transfer from Madinah hotel directly to King Abdulaziz Airport (JED) for your return flight.",
    long_description:
      "Say farewell to Madinah in complete comfort. Our driver arrives at your hotel lobby on time, assists with your luggage and Zamzam water canisters, and transports you smoothly to Jeddah Airport.",
    route_notes:
      "Please plan pickup at least 6.5 to 7 hours prior to your scheduled flight departure time.",
    featured: false,
    seo_title: "Madinah Hotel to Jeddah Airport Transfer | Masaar Holidays",
    meta_description:
      "Seamless return transfer from Madinah hotels to Jeddah Airport. Clean vehicles, luggage assistance, and punctual service. Request a quote.",
    focus_keyword: "Madinah to Jeddah Airport transfer",
  },
  "madinah-airport-to-madinah-hotel": {
    route_name: "Madinah Airport → Madinah Hotel",
    slug: "madinah-airport-to-madinah-hotel",
    transfer_type: "airport",
    image_url: "/trips/Madinah Airport → Madinah Hotel.webp",
    pickup_location: "Prince Mohammad Bin Abdulaziz Airport (MED) Arrivals",
    dropoff_location: "Madinah Hotel (Markaziyah / Haram Area)",
    route_type: "one-way",
    duration: "25 to 35 minutes",
    description:
      "Quick and welcoming private transfer from Prince Mohammad Bin Abdulaziz International Airport to your Madinah hotel.",
    long_description:
      "Arrive at Prince Mohammad Bin Abdulaziz Airport and step straight into your reserved private transfer. Our driver greets you at arrivals and takes you swiftly to your hotel near the Prophet's Mosque.",
    route_notes:
      "Flight arrival time tracked live. Meet and greet at airport exit gate.",
    featured: false,
    seo_title: "Madinah Airport to Madinah Hotel Transfer | Masaar Holidays",
    meta_description:
      "Book private transfer from Madinah Airport (MED) to your hotel. 30-minute quick transfer with meet and greet. Enquire on WhatsApp.",
    focus_keyword: "Madinah Airport to hotel transfer",
  },
  "madinah-hotel-to-madinah-airport": {
    route_name: "Madinah Hotel → Madinah Airport",
    slug: "madinah-hotel-to-madinah-airport",
    transfer_type: "airport",
    image_url: "/trips/Madinah Hotel → Madinah Airport.webp",
    pickup_location: "Madinah Hotel Lobby",
    dropoff_location: "Prince Mohammad Bin Abdulaziz Airport (MED) Departures",
    route_type: "one-way",
    duration: "25 to 35 minutes",
    description:
      "Reliable and punctual private transfer from your Madinah hotel to Prince Mohammad Bin Abdulaziz Airport (MED).",
    long_description:
      "Conclude your stay in Madinah without departure rush. We collect you from your hotel lobby and deliver you directly to MED Airport departures terminal.",
    route_notes:
      "We recommend booking pickup 3 to 3.5 hours prior to your scheduled flight.",
    featured: false,
    seo_title: "Madinah Hotel to Madinah Airport Transfer | Masaar Holidays",
    meta_description:
      "Punctual transfer service from Madinah hotels to Prince Mohammad Bin Abdulaziz Airport. Stress-free departures with Masaar Holidays.",
    focus_keyword: "Madinah hotel to Madinah Airport transfer",
  },
  "makkah-hotel-to-madinah-hotel": {
    route_name: "Makkah Hotel ↔ Madinah Hotel",
    slug: "makkah-hotel-to-madinah-hotel",
    transfer_type: "intercity",
    image_url: "/trips/Makkah Hotel ↔ Madinah Hotel.webp",
    pickup_location: "Makkah Hotel Lobby",
    dropoff_location: "Madinah Hotel Lobby",
    route_type: "one-way",
    duration: "4.5 to 5 hours",
    description:
      "Direct intercity private transfer connecting your hotel in Makkah with your hotel in Madinah along the scenic Hijrah Highway.",
    long_description:
      "Travel between the Two Holy Mosques in complete privacy, serenity, and comfort. Our private intercity transfer takes you door-to-door from your Makkah accommodation to your Madinah hotel without transfers or train station luggage handling.",
    route_notes:
      "Door-to-door service without switching vehicles. Includes rest stop along the highway for refreshments and prayer.",
    featured: true,
    seo_title: "Makkah to Madinah Private Transfer | Masaar Holidays",
    meta_description:
      "Direct intercity private transfer between Makkah and Madinah hotels. Luxury SUVs, vans, and sedans. Travel door-to-door in comfort.",
    focus_keyword: "Makkah to Madinah private transfer",
  },
  "makkah-hotel-to-madinah-hotel-via-badr": {
    route_name: "Makkah Hotel → Madinah Hotel via Badr / Rawdah Well",
    slug: "makkah-hotel-to-madinah-hotel-via-badr",
    transfer_type: "intercity",
    image_url: "/trips/Makkah Hotel → Madinah Hotel (via Badr _ Roya Well).webp",
    pickup_location: "Makkah Hotel Lobby",
    dropoff_location: "Madinah Hotel Lobby (via Badr & Rawdah Well)",
    route_type: "one-way",
    duration: "6 to 7 hours (including historic stops)",
    description:
      "Spiritual and historic intercity journey from Makkah to Madinah, featuring guided stopovers at the historic Battlefield of Badr and Rawdah Well.",
    long_description:
      "Turn your intercity transfer into an unforgettable spiritual and historical experience. Journey along the historic route with stops at Ghazwah Badr (the Battlefield of Badr), the martyrs' memorial, and the historic Rawdah Well, before continuing to the City of the Prophet.",
    route_notes:
      "Includes 1 to 1.5 hours stopover at the historical Badr battlefield and memorial. Driver waits while you reflect and explore.",
    featured: false,
    seo_title: "Makkah to Madinah via Badr Private Transfer | Masaar Holidays",
    meta_description:
      "Private transfer from Makkah to Madinah via historic Badr battlefield and Rawdah well. Spiritual pilgrimage stopovers with dedicated chauffeur.",
    focus_keyword: "Makkah to Madinah transfer via Badr",
  },
  "makkah-madinah-ziyarat": {
    route_name: "Makkah / Madinah Ziyarat",
    slug: "makkah-madinah-ziyarat",
    transfer_type: "ziyarat",
    image_url: "/trips/makkah-madinah-ziyarat.webp",
    pickup_location: "Hotel Lobby (Makkah or Madinah)",
    dropoff_location: "Sacred Sites Tour & Return to Hotel",
    route_type: "round-trip",
    duration: "3 to 4 hours per city",
    description:
      "Private historical sightseeing tour of sacred Islamic heritage sites across Makkah (Jabal Al-Noor, Ghar Thowr, Mina, Arafat) or Madinah (Quba, Uhud, Qiblatayn).",
    long_description:
      "Visit the sacred landmarks of Islamic history in the comfort of a private, air-conditioned vehicle. In Makkah: Jabal Al-Noor (Cave of Hira), Cave of Thowr, Jabal Al-Rahmah (Arafat), Mina, and Muzdalifah. In Madinah: Masjid Quba, Mount Uhud and Martyrs' cemetery, Masjid Al-Qiblatayn, and the site of the Battle of Khandaq.",
    route_notes:
      "Private vehicle exclusively for your family. Flexible pacing at each holy site with ample time for prayer and contemplation.",
    featured: true,
    seo_title: "Makkah & Madinah Ziyarat Private Transport | Masaar Holidays",
    meta_description:
      "Private Ziyarat transport in Makkah and Madinah. Visit Cave Hira, Mount Uhud, Masjid Quba and sacred heritage sites in comfort. Enquire now.",
    focus_keyword: "Makkah and Madinah Ziyarat transport",
  },
  "makkah-madinah-train-station": {
    route_name: "Makkah / Madinah → Train Station",
    slug: "makkah-madinah-train-station",
    transfer_type: "train",
    image_url: "/trips/makkah-madinah-train-station.webp",
    pickup_location: "Hotel Lobby or Haramain High Speed Rail Station",
    dropoff_location: "Haramain Station or Hotel Lobby",
    route_type: "one-way",
    duration: "20 to 30 minutes",
    description:
      "Quick and coordinated hotel-to-station transfer for travelers taking the Haramain High Speed Railway between Makkah, Madinah, and Jeddah.",
    long_description:
      "Connect effortlessly with the Haramain High Speed Train. We pick you up from your hotel lobby and drop you directly at the departure drop-off area, or meet you as you exit the arrival gates.",
    route_notes:
      "Coordinated with your train departure schedule. Punctual pickup ensures plenty of time for ticket validation and boarding.",
    featured: false,
    seo_title: "Haramain Train Station Transfer Makkah & Madinah | Masaar Holidays",
    meta_description:
      "Private transfers to and from Haramain High Speed Train stations in Makkah and Madinah. Punctual, comfortable hotel connections. Request a quote.",
    focus_keyword: "Haramain train station transfers",
  },
  "jeddah-taif-return": {
    route_name: "Jeddah → Taif → Return",
    slug: "jeddah-taif-return",
    transfer_type: "day-trip",
    image_url: "/trips/Jeddah → Taif → Return.webp",
    pickup_location: "Jeddah Hotel / Residence",
    dropoff_location: "Taif Day Tour & Return to Jeddah",
    route_type: "round-trip",
    duration: "8 to 10 hours",
    description:
      "Private full-day round-trip journey from Jeddah to the cool mountain city of Taif, ascending via the dramatic Al Hada winding road.",
    long_description:
      "Experience the beauty and fresh mountain climate of Taif on a private day excursion from Jeddah. Ascend the panoramic Al Hada mountain highway, visit rose water factories, historic Shubra Palace, and fruit orchards before a relaxed evening drive back.",
    route_notes:
      "Full-day chauffeur service (up to 10 hours). Customizable stops including cable car, fruit markets, and local mountain restaurants.",
    featured: false,
    seo_title: "Jeddah to Taif Private Transfer & Day Trip | Masaar Holidays",
    meta_description:
      "Explore Taif from Jeddah with a private full-day chauffeur transfer. Experience Al Hada mountain pass and return in comfort. Enquire now.",
    focus_keyword: "Jeddah to Taif transfer",
  },
  "makkah-taif-return": {
    route_name: "Makkah → Taif → Return",
    slug: "makkah-taif-return",
    transfer_type: "day-trip",
    image_url: "/trips/Makkah → Taif → Return.webp",
    pickup_location: "Makkah Hotel Lobby",
    dropoff_location: "Taif Sightseeing & Return to Makkah",
    route_type: "round-trip",
    duration: "7 to 9 hours",
    description:
      "Scenic day excursion from Makkah to the cool mountain heights of Taif, visiting historic mosques and scenic viewpoints.",
    long_description:
      "Escape the desert heat with a refreshing private day journey from Makkah up the Al Hada mountains to historic Taif, returning comfortably before evening.",
    route_notes:
      "Includes scenic mountain drive, visit to fruit markets and rose farms, returning directly to your Makkah hotel.",
    featured: false,
    seo_title: "Makkah to Taif Private Transfer & Tour | Masaar Holidays",
    meta_description:
      "Private day trip from Makkah to Taif. Enjoy cool mountain air, historic sites, and scenic drives with dedicated chauffeur. Enquire on WhatsApp.",
    focus_keyword: "Makkah to Taif private transfer",
  },
};

export interface RouteVehicleOption {
  rateId: string;
  vehicleId: string;
  vehicleName: string;
  vehicleSlug: string;
  vehicleType: string;
  modelYear: string;
  imageUrl: string;
  passengerCapacity: number;
  luggageCapacity: number;
  description: string;
  detailedDescription: string;
  features: string[];
  priceAed: number;
  isActive: boolean;
  displayOrder: number;
}

export interface EnrichedTransferRoute extends TransferRow {
  pickupLocation: string;
  dropoffLocation: string;
  routeTypeKind: "one-way" | "round-trip";
  durationText: string;
  longDescriptionText: string;
  routeNotesText: string;
  isFeatured: boolean;
  startingPriceAed: number | null;
  activeVehiclesCount: number;
  availableVehicles: RouteVehicleOption[];
}

export const VERIFIED_TRANSFER_ROUTES = Object.values(VERIFIED_ROUTE_CATALOG);
export const VERIFIED_TRANSFER_VEHICLES = VERIFIED_VEHICLE_CATALOG;
export const TRANSFER_SUPPLIED_RATE_CARD = SUPPLIED_RATE_CARD;
export const ROUTE_VEHICLE_RATES = SUPPLIED_RATE_CARD;
