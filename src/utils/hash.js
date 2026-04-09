import argon2 from "argon2";

const pepper = process.env.PEPPER;
// Hash password
export async function hashPassword(password) {
    // Argon2: laver automatisk salt, er langsom (god mod brute force) og gemmer alt i hash stringen
    return await argon2.hash(password + pepper);
};

// Verify password (bruges til login)
export async function verifyPassword(password, hash) {
    return await argon2.verify(hash, password + pepper);
};