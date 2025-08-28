import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixImports(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix relative imports by adding .js extension
      content = content.replace(
        /from ['"](\.[^'"]*)['"]/g,
        (match, importPath) => {
          if (!importPath.endsWith('.js')) {
            return `from '${importPath}.js'`;
          }
          return match;
        }
      );
      
      // Fix @shared path alias
      content = content.replace(
        /from ['"]@shared\/([^'"]*)['"]/g,
        (match, importPath) => {
          return `from '../shared/${importPath}.js'`;
        }
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed imports in: ${filePath}`);
    }
  }
}

const distServerDir = path.join(__dirname, 'dist', 'server');
if (fs.existsSync(distServerDir)) {
  fixImports(distServerDir);
  console.log('Import fixes completed!');
} else {
  console.log('dist/server directory not found');
}
