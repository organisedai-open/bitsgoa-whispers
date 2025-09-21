const adjectives = [
  "Anonymous", "Silent", "Mysterious", "Hidden", "Secret",
  "Quiet", "Invisible", "Unknown", "Masked", "Veiled",
  "Curious", "Thoughtful", "Wandering", "Dreaming", "Wondering",
  "Midnight", "Dawn", "Twilight", "Moonlit", "Starlit",
  "Gentle", "Kind", "Brave", "Bold", "Caring",
  "Whispering", "Floating", "Drifting", "Roaming", "Searching"
];

const nouns = [
  "Eagle", "Owl", "Phoenix", "Raven", "Sparrow",
  "Tiger", "Lion", "Wolf", "Fox", "Bear",
  "Ocean", "River", "Mountain", "Valley", "Forest",
  "Storm", "Thunder", "Lightning", "Rain", "Cloud",
  "Comet", "Star", "Moon", "Sun", "Galaxy",
  "Shadow", "Echo", "Whisper", "Dream", "Thought",
  "Student", "Scholar", "Seeker", "Traveler", "Explorer"
];

export function generateUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  
  return `${adjective}${noun}${number}`;
}