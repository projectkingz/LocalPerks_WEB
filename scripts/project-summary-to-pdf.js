const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '[File not found]';
  }
}

function listDirTree(dir, prefix = '') {
  let result = '';
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    result += `${prefix}${item.isDirectory() ? '📁' : '📄'} ${item.name}\n`;
    if (item.isDirectory()) {
      result += listDirTree(path.join(dir, item.name), prefix + '  ');
    }
  }
  return result;
}

const doc = new PDFDocument({ margin: 40 });
doc.pipe(fs.createWriteStream('project-summary.pdf'));

doc.fontSize(22).text('MyRewardsWebsiteV1 - Project Summary', { underline: true });
doc.moveDown();

doc.fontSize(14).text('Description:', { underline: true });
doc.fontSize(12).text(
  'A modern rewards program for local businesses and customers. Built with Next.js, Prisma, PostgreSQL, NextAuth, and Tailwind CSS.'
);
doc.moveDown();

doc.fontSize(14).text('Tech Stack:', { underline: true });
doc.fontSize(12).text('- Next.js 14 (App Router)\n- TypeScript\n- Tailwind CSS\n- Prisma ORM\n- PostgreSQL\n- NextAuth.js\n- Framer Motion');
doc.moveDown();

doc.fontSize(14).text('Main Features:', { underline: true });
doc.fontSize(12).text('- Customer rewards with points system\n- Business partner dashboard\n- QR code-based point collection\n- Customizable rewards\n- Real-time transaction tracking\n- Modern, responsive design\n- Password reset and 2FA');
doc.moveDown();

doc.fontSize(14).text('Directory Structure:', { underline: true });
doc.fontSize(10).text(listDirTree('.', ''));
doc.moveDown();

doc.fontSize(14).text('Key Configuration Files:', { underline: true });
doc.fontSize(12).text('package.json:');
doc.fontSize(9).text(readFileSafe('package.json').slice(0, 1500) + '\n...');
doc.moveDown();
doc.fontSize(12).text('next.config.js:');
doc.fontSize(9).text(readFileSafe('next.config.js').slice(0, 1000) + '\n...');
doc.moveDown();
doc.fontSize(12).text('vercel.json:');
doc.fontSize(9).text(readFileSafe('vercel.json').slice(0, 500) + '\n...');
doc.moveDown();

doc.fontSize(14).text('Prisma Schema Models:', { underline: true });
doc.fontSize(9).text(readFileSafe('prisma/schema.prisma').slice(0, 2000) + '\n...');
doc.moveDown();

doc.fontSize(14).text('Deployment Readiness & Issues:', { underline: true });
doc.fontSize(11).text(
  '- TypeScript: No errors.\n' +
  '- ESLint: Warnings for unused variables, any types, and JSX best practices.\n' +
  '- Prisma: Local generate error (file lock/permission).\n' +
  '- .env: Must be created with all required secrets.\n' +
  '- All pages, API routes, and assets present.\n' +
  '- Ready for Vercel deployment after fixing above.'
);

doc.end();
console.log('PDF summary generated: project-summary.pdf'); 