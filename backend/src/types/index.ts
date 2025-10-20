import { Request } from 'express';

// User roles enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

// User status enum
export enum UserStatus {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum'
}

// Telegram user data interface
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// User interface for database (matching your existing table)
export interface User {
  id: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  language_code?: string;
  is_premium?: boolean;
  role?: UserRole;
  is_active?: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  phone?: string;
  birthdate?: Date;
  consent_personal_data?: boolean;
  consent_marketing?: boolean;
  photo_url?: string;
  allows_write_to_pm?: boolean;
  bonus?: number;
  status?: UserStatus;
  total_spent?: number;
  bonus_easter_egg?: boolean;
  has_seen_tour?: boolean;
  referral_code?: string;
  referred_by?: string;
  referral_bonus_received?: boolean;
  total_referrals?: number;
  gender?: string;
  registration_ip?: string;
  utm_campaign_id?: string;
  normalized_phone?: string;
  position?: string;
  age?: number;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  telegramId: number | undefined;
  role: UserRole | undefined;
  iat?: number;
  exp?: number;
}

// Extended Request interface with user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Telegram auth verification data
export interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

// User registration data
export interface UserRegistrationData {
  telegram_id: number;
  first_name?: string;
  last_name?: string;
  username: string | undefined;
  photo_url: string | undefined;
  language_code: string;
  phone?: string;
  registration_ip?: string;
}

// User update data
export interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  username?: string;
  phone?: string;
  photo_url?: string;
  language_code?: string;
  birthdate?: Date;
  gender?: string;
  position?: string;
  age?: number;
  consent_personal_data?: boolean;
  consent_marketing?: boolean;
  allows_write_to_pm?: boolean;
  email?: string;
}

// Database connection status
export interface DatabaseStatus {
  connected: boolean;
  host: string;
  database: string;
  uptime?: number;
}

// API Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  database: DatabaseStatus;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

// Error response interface
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  stack?: string; // Only in development
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// =============================================================================
// ARTICLE SYSTEM TYPES
// =============================================================================

// Article status enum
export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled'
}

// Article category interface
export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  children?: ArticleCategory[];
  parent?: ArticleCategory;
}

// Article tag interface
export interface ArticleTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  usage_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Article interface
export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  author_id: string;
  category_id?: string;
  status: ArticleStatus;
  published_at?: Date;
  scheduled_at?: Date;
  is_featured: boolean;
  is_pinned: boolean;
  allow_comments: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  reading_time?: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  meta_tags?: object;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  author?: User;
  category?: ArticleCategory;
  tags?: ArticleTag[];
  comments?: ArticleComment[];
  attachments?: ArticleAttachment[];
}

// Article comment interface
export interface ArticleComment {
  id: string;
  article_id: string;
  author_id: string;
  parent_id?: string;
  content: string;
  is_approved: boolean;
  is_spam: boolean;
  like_count: number;
  reply_count: number;
  depth: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  author?: User;
  replies?: ArticleComment[];
  parent?: ArticleComment;
}

// Article like interface
export interface ArticleLike {
  id: string;
  article_id: string;
  user_id: string;
  created_at: Date;
  user?: User;
}

// Article view interface
export interface ArticleView {
  id: string;
  article_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  viewed_at: Date;
  session_id?: string;
  user?: User;
}

// Article attachment interface
export interface ArticleAttachment {
  id: string;
  article_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
  caption?: string;
  sort_order: number;
  is_featured: boolean;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
  uploader?: User;
}

// Article draft interface
export interface ArticleDraft {
  id: string;
  article_id?: string;
  author_id: string;
  title?: string;
  content?: string;
  excerpt?: string;
  category_id?: string;
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  meta_tags?: object;
  auto_saved: boolean;
  last_modified: Date;
  created_at: Date;
  expires_at?: Date;
  author?: User;
  category?: ArticleCategory;
}

// Article revision interface
export interface ArticleRevision {
  id: string;
  article_id: string;
  author_id: string;
  title?: string;
  content?: string;
  excerpt?: string;
  category_id?: string;
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  meta_tags?: object;
  revision_number: number;
  change_summary?: string;
  created_at: Date;
  author?: User;
  category?: ArticleCategory;
}

// Article tag relation interface
export interface ArticleTagRelation {
  id: string;
  article_id: string;
  tag_id: string;
  created_at: Date;
}

// =============================================================================
// ARTICLE API TYPES
// =============================================================================

// Article creation data
export interface ArticleCreateData {
  title: string;
  content: string;
  excerpt?: string;
  category_id?: string;
  featured_image?: string;
  status?: ArticleStatus;
  published_at?: Date;
  scheduled_at?: Date;
  is_featured?: boolean;
  is_pinned?: boolean;
  allow_comments?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  meta_tags?: object;
  tag_ids?: string[];
}

// Article update data
export interface ArticleUpdateData {
  title?: string;
  content?: string;
  excerpt?: string;
  category_id?: string;
  featured_image?: string;
  status?: ArticleStatus;
  published_at?: Date;
  scheduled_at?: Date;
  is_featured?: boolean;
  is_pinned?: boolean;
  allow_comments?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  meta_tags?: object;
  tag_ids?: string[];
}

// Article search/filter options
export interface ArticleSearchOptions {
  query?: string;
  category_id?: string;
  tag_ids?: string[];
  author_id?: string;
  status?: ArticleStatus;
  is_featured?: boolean;
  date_from?: Date;
  date_to?: Date;
  sort_by?: 'created_at' | 'published_at' | 'title' | 'view_count' | 'like_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Article comment creation data
export interface ArticleCommentCreateData {
  content: string;
  parent_id?: string;
}

// Article comment update data
export interface ArticleCommentUpdateData {
  content?: string;
  is_approved?: boolean;
  is_spam?: boolean;
}

// Article statistics
export interface ArticleStatistics {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  popular_categories: Array<{
    category: ArticleCategory;
    article_count: number;
  }>;
  popular_tags: Array<{
    tag: ArticleTag;
    usage_count: number;
  }>;
}

// Article analytics data
export interface ArticleAnalytics {
  article_id: string;
  views_over_time: Array<{
    date: string;
    views: number;
  }>;
  top_referrers: Array<{
    referrer: string;
    views: number;
  }>;
  device_types: Array<{
    device: string;
    percentage: number;
  }>;
  geographic_data: Array<{
    country: string;
    views: number;
  }>;
}

