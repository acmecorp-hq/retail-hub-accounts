import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import argon2 from 'argon2';

export interface DbUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  given_name: string | null;
  family_name: string | null;
  avatar_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiUserProfileAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ApiUserProfile {
  givenName?: string;
  familyName?: string;
  avatarUrl?: string;
  address?: ApiUserProfileAddress;
}

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  profile?: ApiUserProfile;
  createdAt: string;
  updatedAt: string;
}

export function mapDbToApi(u: DbUser): ApiUser {
  const profile: ApiUserProfile = {};
  if (u.given_name) profile.givenName = u.given_name;
  if (u.family_name) profile.familyName = u.family_name;
  if (u.avatar_url) profile.avatarUrl = u.avatar_url;
  if (
    u.address_line1 ||
    u.address_line2 ||
    u.address_city ||
    u.address_state ||
    u.address_postal_code ||
    u.address_country
  ) {
    profile.address = {
      line1: u.address_line1 || undefined,
      line2: u.address_line2 || undefined,
      city: u.address_city || undefined,
      state: u.address_state || undefined,
      postalCode: u.address_postal_code || undefined,
      country: u.address_country || undefined
    };
  }
  const hasProfileFields = Object.keys(profile).length > 0;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    profile: hasProfileFields ? profile : undefined,
    createdAt: u.created_at,
    updatedAt: u.updated_at
  };
}

export async function createUser(db: Knex, input: {
  username: string;
  email: string;
  password: string;
  profile?: ApiUserProfile;
}): Promise<ApiUser> {
  const now = new Date().toISOString();
  const id = `usr_${uuidv4()}`;
  const password_hash = await argon2.hash(input.password);

  const profile = input.profile || {};
  const row: DbUser = {
    id,
    username: input.username,
    email: input.email,
    password_hash,
    given_name: profile.givenName || null,
    family_name: profile.familyName || null,
    avatar_url: profile.avatarUrl || null,
    address_line1: profile.address?.line1 || null,
    address_line2: profile.address?.line2 || null,
    address_city: profile.address?.city || null,
    address_state: profile.address?.state || null,
    address_postal_code: profile.address?.postalCode || null,
    address_country: profile.address?.country || null,
    created_at: now,
    updated_at: now
  };

  await db('users').insert(row);
  return mapDbToApi(row);
}

export async function findUserByUsernameOrEmail(db: Knex, usernameOrEmail: string): Promise<DbUser | undefined> {
  return db<DbUser>('users')
    .where({ username: usernameOrEmail })
    .orWhere({ email: usernameOrEmail })
    .first();
}

export async function getUserById(db: Knex, id: string): Promise<DbUser | undefined> {
  return db<DbUser>('users').where({ id }).first();
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export async function updateUser(db: Knex, id: string, updates: {
  username?: string;
  email?: string;
  profile?: ApiUserProfile;
}): Promise<ApiUser | null> {
  const existing = await getUserById(db, id);
  if (!existing) return null;

  const next: Partial<DbUser> = {};
  if (typeof updates.username === 'string') next.username = updates.username;
  if (typeof updates.email === 'string') next.email = updates.email;
  if (updates.profile) {
    const p = updates.profile;
    if (p.givenName !== undefined) next.given_name = p.givenName || null;
    if (p.familyName !== undefined) next.family_name = p.familyName || null;
    if (p.avatarUrl !== undefined) next.avatar_url = p.avatarUrl || null;
    if (p.address) {
      const a = p.address;
      if (a.line1 !== undefined) next.address_line1 = a.line1 || null;
      if (a.line2 !== undefined) next.address_line2 = a.line2 || null;
      if (a.city !== undefined) next.address_city = a.city || null;
      if (a.state !== undefined) next.address_state = a.state || null;
      if (a.postalCode !== undefined) next.address_postal_code = a.postalCode || null;
      if (a.country !== undefined) next.address_country = a.country || null;
    }
  }

  next.updated_at = new Date().toISOString();

  await db('users').where({ id }).update(next);
  const updated = await getUserById(db, id);
  return updated ? mapDbToApi(updated) : null;
}
