// In-memory admin data store
// Replace with API calls / database integration as needed

export type Photo = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string; // URL or base64
};

export type Video = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
};

export type Block = {
  id: string;
  title: string;
  category: string;
  description: string;
  username: string;
  publishDate: string;
  image: string;
};

export type TeamMember = {
  id: string;
  name: string;
  designation: string;
  description: string;
  image: string;
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export type Review = {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number; // 1–5
  description: string;
  images: string[]; // max 5
  allowed: boolean; // whether the review is publicly visible
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string;
};

// Seed data
export const seedPhotos: Photo[] = [
  { id: "1", title: "Modern Living Room", category: "Living Room", description: "A bright and airy modern living space.", image: "" },
  { id: "2", title: "Luxury Kitchen", category: "Kitchen", description: "Elegant kitchen with marble counters.", image: "" },
  { id: "3", title: "Master Bedroom", category: "Bedroom", description: "Serene and cozy master suite.", image: "" },
];

export const seedVideos: Video[] = [
  { id: "1", title: "Interior Showcase 2024", description: "Our top projects of the year.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "2", title: "Design Process", description: "How we transform spaces.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
];

export const seedBlocks: Block[] = [
  { id: "1", title: "Top Interior Trends 2025", category: "Design Trends", description: "Explore what's hot in interior design.", username: "Admin", publishDate: "2025-01-15", image: "" },
  { id: "2", title: "Minimalist Living Guide", category: "Lifestyle", description: "How to embrace minimalism at home.", username: "Admin", publishDate: "2025-02-10", image: "" },
];

export const seedTeam: TeamMember[] = [
  { id: "1", name: "Sarah Johnson", designation: "Lead Designer", description: "10 years experience in luxury interiors.", image: "" },
  { id: "2", name: "Michael Chen", designation: "Project Manager", description: "Ensures every project is delivered on time.", image: "" },
];

export const seedFAQs: FAQ[] = [
  { id: "1", question: "How long does a typical project take?", answer: "Most residential projects take 4–12 weeks depending on scope." },
  { id: "2", question: "Do you offer 3D visualization?", answer: "Yes, we provide full 3D renders before any work begins." },
  { id: "3", question: "What is your pricing structure?", answer: "We offer fixed-price packages and hourly consultation rates." },
];

export const seedReviews: Review[] = [
  { id: "1", name: "Emily Ross", email: "emily@example.com", phone: "555-0101", rating: 5, description: "Absolutely transformed our home. Highly recommend!", images: [], allowed: true },
  { id: "2", name: "David Kim", email: "david@example.com", phone: "555-0102", rating: 4, description: "Professional and creative team.", images: [], allowed: true },
];

export const seedContacts: ContactMessage[] = [
  { id: "1", name: "Alice Brown", email: "alice@example.com", phone: "555-0201", message: "I'd love to get a quote for my living room.", date: "2025-02-20" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", phone: "555-0202", message: "Are you available for a kitchen renovation?", date: "2025-02-22" },
];
