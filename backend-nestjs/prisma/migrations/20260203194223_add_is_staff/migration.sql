-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auth_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_auth_user" ("createdAt", "email", "firstName", "id", "lastName", "password", "updatedAt", "username") SELECT "createdAt", "email", "firstName", "id", "lastName", "password", "updatedAt", "username" FROM "auth_user";
DROP TABLE "auth_user";
ALTER TABLE "new_auth_user" RENAME TO "auth_user";
CREATE UNIQUE INDEX "auth_user_email_key" ON "auth_user"("email");
CREATE UNIQUE INDEX "auth_user_username_key" ON "auth_user"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
