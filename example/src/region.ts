export type Region = "cn-hz" | "us-sv" | "in-mum" | "eu" | "sg";

interface RegionData {
  region: Region;
  name: string;
  emoji: string;
}

export const regions: RegionData[] = [
  { region: "cn-hz", name: "China", emoji: "🇨🇳" },
  { region: "us-sv", name: "America", emoji: "🇺🇸" },
  { region: "in-mum", name: "India", emoji: "🇮🇳" },
  { region: "eu", name: "Europe", emoji: "🇪🇺" },
  { region: "sg", name: "Singapore", emoji: "🇸🇬" },
];

export function getDefaultRegion(): Region {
  if (navigator.language.startsWith("zh")) {
    return "cn-hz";
  }
  return "us-sv";
}
