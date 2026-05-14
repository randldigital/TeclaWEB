import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';

const sqlite = new Database('teclaweb.db');

// Gallery images data
const galleryImages = [
  {
    title: "Teatro Claret - Representación 1",
    description: "Una de nuestras mejores representaciones teatrales",
    imageUrl: "/attached_assets/teclagaleria1.jpg",
    type: "IMAGE",
    visibility: "PUBLIC"
  },
  {
    title: "Teatro Claret - Representación 2", 
    description: "Momentos únicos en el escenario",
    imageUrl: "/attached_assets/teclagaleria2.jpg",
    type: "IMAGE",
    visibility: "PUBLIC"
  },
  {
    title: "Teatro Claret - Representación 3",
    description: "El arte del teatro en su máxima expresión",
    imageUrl: "/attached_assets/teclagaleria3.jpg",
    type: "IMAGE", 
    visibility: "PUBLIC"
  },
  {
    title: "Teatro Claret - Representación 4",
    description: "Emociones y talento en cada actuación",
    imageUrl: "/attached_assets/teclagaleria4.jpg",
    type: "IMAGE",
    visibility: "PUBLIC"
  },
  {
    title: "Teatro Claret - Representación 5",
    description: "La magia del teatro cobra vida",
    imageUrl: "/attached_assets/teclagaleria5.jpg",
    type: "IMAGE",
    visibility: "PUBLIC"
  }
];

// Get admin user ID
const adminUser = sqlite.prepare('SELECT id FROM users WHERE role = "ADMIN" LIMIT 1').get();
if (!adminUser) {
  console.error('No admin user found');
  process.exit(1);
}

// Insert gallery images
const insertGalleryItem = sqlite.prepare(`
  INSERT INTO gallery_items (id, title, description, image_url, type, visibility, created_by, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

galleryImages.forEach((image, index) => {
  const id = nanoid();
  const now = new Date().toISOString();
  
  try {
    insertGalleryItem.run(
      id,
      image.title,
      image.description,
      image.imageUrl,
      image.type,
      image.visibility,
      adminUser.id,
      now
    );
    console.log(`✅ Added gallery image ${index + 1}: ${image.title}`);
  } catch (error) {
    console.error(`❌ Error adding image ${index + 1}:`, error.message);
  }
});

console.log('\n🎭 Gallery images added successfully!');
console.log('📸 You can now view them in the gallery section');

sqlite.close();
