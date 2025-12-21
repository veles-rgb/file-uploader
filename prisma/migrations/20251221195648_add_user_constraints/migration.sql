-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "username" VARCHAR(20) NOT NULL,
    "hashedPassword" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Username constraints
ALTER TABLE "User"
ADD CONSTRAINT "User_username_valid_check"
CHECK (
  char_length("username") BETWEEN 3 AND 20
  AND btrim("username") <> ''
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
