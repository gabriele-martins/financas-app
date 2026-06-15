// ════════════════════════════════════════════════
// src/components/Icon.tsx
// Wrapper sobre @hugeicons/react-native (stroke-rounded).
// Centraliza o mapeamento nome → ícone do Hugeicons, então
// o resto do app só usa nomes curtos ("home", "cash"…).
// ════════════════════════════════════════════════

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  // navegação / UI
  Home01Icon, Menu01Icon, ArrowLeft01Icon, ArrowRight01Icon,
  ArrowDown01Icon, Cancel01Icon, PlusSignIcon, Edit02Icon,
  DashboardSquare01Icon, LeftToRightListBulletIcon, CheckmarkCircle02Icon,
  ArrowDownRight01Icon, ArrowUpRight01Icon,
  // financeiro / categorias
  Wallet02Icon, CreditCardIcon, PiggyBankIcon, BankIcon, MoneyBag02Icon,
  ShoppingCart01Icon, ShoppingBag01Icon, Tag01Icon,
  Restaurant01Icon, Coffee01Icon, Fire02Icon, DropletIcon,
  IdeaIcon, WifiConnected01Icon, SmartPhone01Icon, Tv01Icon,
  FilmRoll01Icon, MusicNote01Icon, GameController01Icon, Book02Icon,
  MortarboardIcon, CatIcon, FavouriteIcon, HealthIcon, BodyPartMuscleIcon,
  Car01Icon, Bus01Icon, Airplane01Icon, GiftIcon, StarIcon,
  // extras
  Train01Icon, Bicycle01Icon, FuelStationIcon, Taxi02Icon, Motorbike01Icon,
  Hospital01Icon, Medicine01Icon, DentalToothIcon, Dumbbell01Icon, Yoga01Icon,
  Pizza01Icon, Hamburger02Icon, BottleWineIcon, BeerIcon, IceCream01Icon,
  Shirt01Icon, RunningShoesIcon, Watch01Icon, Diamond01Icon, Camera01Icon,
  HeadphonesIcon, LaptopIcon, GameboyIcon, FootballIcon, TennisRacketIcon,
  PlantIcon, Sun01Icon, Moon01Icon, CloudIcon, UmbrellaIcon,
  Baby01Icon, GraduationCapIcon, Briefcase01Icon, Building01Icon, ChurchIcon,
} from "@hugeicons/core-free-icons";

// Mapa nome curto → componente do Hugeicons
const MAP = {
  // UI
  home: Home01Icon, menu: Menu01Icon, chevL: ArrowLeft01Icon, chevR: ArrowRight01Icon,
  chevD: ArrowDown01Icon, close: Cancel01Icon, plus: PlusSignIcon, edit: Edit02Icon,
  grid: DashboardSquare01Icon, list: LeftToRightListBulletIcon, check: CheckmarkCircle02Icon,
  expense: ArrowUpRight01Icon, income: ArrowDownRight01Icon,
  // categorias selecionáveis (30)
  cash: MoneyBag02Icon, wallet: Wallet02Icon, card: CreditCardIcon, pig: PiggyBankIcon,
  bank: BankIcon, cart: ShoppingCart01Icon, bag: ShoppingBag01Icon, tag: Tag01Icon,
  food: Restaurant01Icon, coffee: Coffee01Icon, fire: Fire02Icon, water: DropletIcon,
  bulb: IdeaIcon, wifi: WifiConnected01Icon, phone2: SmartPhone01Icon, tv: Tv01Icon,
  movie: FilmRoll01Icon, music: MusicNote01Icon, game: GameController01Icon, book: Book02Icon,
  school: MortarboardIcon, pet: CatIcon, heart: FavouriteIcon, health: HealthIcon,
  fitness: BodyPartMuscleIcon, car: Car01Icon, bus: Bus01Icon, plane: Airplane01Icon,
  gift: GiftIcon, star: StarIcon,
  // extras
  train: Train01Icon, bike: Bicycle01Icon, fuel: FuelStationIcon, taxi: Taxi02Icon, moto: Motorbike01Icon,
  hospital: Hospital01Icon, medicine: Medicine01Icon, dental: DentalToothIcon, dumbbell: Dumbbell01Icon, yoga: Yoga01Icon,
  pizza: Pizza01Icon, burger: Hamburger02Icon, wine: BottleWineIcon, beer: BeerIcon, icecream: IceCream01Icon,
  shirt: Shirt01Icon, shoes: RunningShoesIcon, watch: Watch01Icon, diamond: Diamond01Icon, camera: Camera01Icon,
  headphone: HeadphonesIcon, laptop: LaptopIcon, gameboy: GameboyIcon, football: FootballIcon, tennis: TennisRacketIcon,
  plant: PlantIcon, sun: Sun01Icon, moon: Moon01Icon, cloud: CloudIcon, umbrella: UmbrellaIcon,
  baby: Baby01Icon, graduation: GraduationCapIcon, briefcase: Briefcase01Icon, building: Building01Icon, church: ChurchIcon,
} as const;

export type IconName = keyof typeof MAP;

/** Lista de ícones de categoria oferecidos no seletor do formulário */
export const ICON_CHOICES: IconName[] = [
  "home", "cash", "wallet", "card", "pig", "bank", "cart", "bag",
  "food", "coffee", "fire", "water", "bulb", "wifi", "phone2", "tv",
  "movie", "music", "game", "book", "school", "pet", "heart", "health",
  "fitness", "car", "bus", "plane", "gift", "star",
  "train", "bike", "fuel", "taxi", "moto",
  "hospital", "medicine", "dental", "dumbbell", "yoga",
  "pizza", "burger", "wine", "beer", "icecream",
  "shirt", "shoes", "watch", "diamond", "camera",
  "headphone", "laptop", "gameboy", "football", "tennis",
  "plant", "sun", "moon", "cloud", "umbrella",
  "baby", "graduation", "briefcase", "building", "church",
];

interface IconProps {
  name: string;     // aceita string p/ tolerar dados antigos; cai em "tag" se desconhecido
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color = "#000", strokeWidth = 1.8 }: IconProps) {
  const icon = MAP[name as IconName] ?? Tag01Icon;
  return (
    <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={strokeWidth} />
  );
}