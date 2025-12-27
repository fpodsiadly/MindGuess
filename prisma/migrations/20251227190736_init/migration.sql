-- CreateEnum
CREATE TYPE "TraitValue" AS ENUM ('TRUE', 'FALSE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonTrait" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "traitId" TEXT NOT NULL,
    "value" "TraitValue" NOT NULL,

    CONSTRAINT "PersonTrait_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trait_key_key" ON "Trait"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE INDEX "PersonTrait_traitId_idx" ON "PersonTrait"("traitId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonTrait_personId_traitId_key" ON "PersonTrait"("personId", "traitId");

-- AddForeignKey
ALTER TABLE "PersonTrait" ADD CONSTRAINT "PersonTrait_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonTrait" ADD CONSTRAINT "PersonTrait_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "Trait"("id") ON DELETE CASCADE ON UPDATE CASCADE;
