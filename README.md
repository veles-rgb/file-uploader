# File Uploader

## Veles Files

![Veles Files Logo](/public/icons/logo.svg)

A full-stack file management web app that allows users to upload, organize, preview, and share files and folders. Built with Node.js, Express, Prisma, and PostgreSQL, with Cloudinary for file storage.

Created for [The Odin Project](https://www.theodinproject.com/lessons/nodejs-file-uploader)

---

## Features

- Session based user authentication (login required)
- User accounts (login / register)
- Folder & nested folder structure
- File upload with size limits (10MB)
- Image, video, audio, and PDF previews
- Downloadable files
- CRUD folders / delete files (recursive)
- Public share links for folders (read-only)
- Share expiration support
- Breadcrumb navigation
- Cloudinary integration for file storage

---

## Tech Stack

**Backend**

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/) ([Neon](https://neon.com/))
- [Passport.js](https://www.passportjs.org/) (authentication)
- [Multer](https://www.npmjs.com/package/multer) (file uploads)
- [Railway](https://railway.com/) (web hosting / deployment)

**Storage**

- [Cloudinary](https://cloudinary.com/) (images, videos, PDFs, raw files)

**Frontend**

- EJS templates
- Vanilla CSS
- Minimal JavaScript

**Deployment**

- [Railway](https://railway.com/)
- [Neon Database](https://neon.com/)

---

## Packages Used

- **[@prisma/adapter-pg](https://www.npmjs.com/package/@prisma/adapter-pg)** – PostgreSQL adapter for Prisma
- **[@prisma/client](https://www.npmjs.com/package/@prisma/client)** – Prisma ORM client
- **[@quixo3/prisma-session-store](https://www.npmjs.com/package/@quixo3/prisma-session-store)** – Store Express sessions in Prisma
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** – Password hashing
- **[cloudinary](https://www.npmjs.com/package/cloudinary)** – Cloud file storage and delivery
- **[connect-pg-simple](https://www.npmjs.com/package/connect-pg-simple)** – PostgreSQL session store for Express
- **[dotenv](https://www.npmjs.com/package/dotenv)** – Environment variable management
- **[ejs](https://www.npmjs.com/package/ejs)** – Server-side templating
- **[express](https://www.npmjs.com/package/express)** – Web framework
- **[express-session](https://www.npmjs.com/package/express-session)** – Session management
- **[express-validator](https://www.npmjs.com/package/express-validator)** – Request validation and sanitization
- **[multer](https://www.npmjs.com/package/multer)** – File uploads
- **[passport](https://www.npmjs.com/package/passport)** – Authentication middleware
- **[passport-local](https://www.npmjs.com/package/passport-local)** – Username/password authentication strategy
- **[pg](https://www.npmjs.com/package/pg)** – PostgreSQL client
- **[uuid](https://www.npmjs.com/package/uuid)** – Unique ID generation

## Project Structure (Simplified)

```
└── 📁file-uploader
  ├── 📁controllers
  ├── 📁lib
  ├── 📁middleware
  ├── 📁prisma
  │ ├── 📁migrations
  │ └── schema.prisma
  ├── 📁public
  │ ├── 📁icons
  │ ├── 📁js
  │ └── styles.css
  ├── 📁routers
  ├── 📁uploads
  ├── 📁utils
  ├── 📁validators
  ├── 📁views
  │ └── 📁partials
  ├── .env
  ├── .gitignore
  ├── app.js
  ├── prisma.config.js
  └── script.js
```

---

## Database Schema

The project uses **[PostgreSQL](https://www.postgresql.org/)** with **[Prisma ORM](https://www.prisma.io/)**.

### User

Represents an authenticated account.

- `id` – unique user ID
- `email` – login email (unique)
- `username` – display name (unique)
- `hashedPassword` – securely stored password hash
- `createdAt` – account creation timestamp

**Relations**

- Has many **Folders**
- Has many **Files**
- Has many **Shares**

### Folder

Represents a directory in the file system.  
Folders can be nested infinitely.

- `id` – unique folder ID
- `name` – folder name
- `ownerId` – owner (User)
- `parentId` – parent folder (nullable)
- `createdAt` – creation timestamp

**Relations**

- Belongs to a **User**
- May have a parent **Folder**
- May have many child **Folders**
- Contains many **Files**
- Can be shared via **Share**

**Constraints**

- Folder names are unique per parent folder per user

### File

Represents an uploaded file.

- `id` – unique file ID
- `ownerId` – owner (User)
- `folderId` – parent folder (nullable)
- `originalName` – original filename
- `storagePath` – Cloudinary URL or storage path
- `mimeType` – file type
- `sizeBytes` – file size
- `cloudinaryPublicId` – Cloudinary identifier (if uploaded)
- `createdAt` – upload timestamp

**Relations**

- Belongs to a **User**
- Optionally belongs to a **Folder**

### Share

Represents a public shareable link for a folder.

- `id` – unique share ID
- `token` – public share token
- `ownerId` – owner (User)
- `folderId` – shared folder
- `createdAt` – creation timestamp
- `expiresAt` – optional expiration date

**Behavior**

- Only folders (not root) can be shared
- Public users can browse folders and files inside the shared folder
- Share links can expire or be revoked

### Session

Used for authentication sessions.

- `id` – session ID
- `sid` – unique session identifier
- `data` – session data
- `expiresAt` – expiration timestamp

## Environment Variables

The following environment variables are required:

```env
DATABASE_URL=
PORT=
SESSION_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET_KEY=
CLOUDINARY_URL=
```
