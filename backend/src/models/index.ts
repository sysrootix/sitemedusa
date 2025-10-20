import sequelize from '@/config/database';
import User from './User';
import PhoneAuthCode from './PhoneAuthCode';
import StatusConfig from './StatusConfig';

// Article system models
import Article from './Article';
import ArticleCategory from './ArticleCategory';
import ArticleTag from './ArticleTag';
import ArticleTagRelation from './ArticleTagRelation';
import ArticleComment from './ArticleComment';
import ArticleLike from './ArticleLike';
import ArticleView from './ArticleView';
import ArticleAttachment from './ArticleAttachment';
import ArticleDraft from './ArticleDraft';
import ArticleRevision from './ArticleRevision';
import FeedbackSite from './FeedbackSite';
import Vacancy from './Vacancy';
import VacancyResponse from './VacancyResponse';
import Promotion from './Promotion';
import ShopLocation from './ShopLocation';
import CatalogProduct from './CatalogProduct';
import CatalogExclusion from './CatalogExclusion';
import CatalogSyncLog from './CatalogSyncLog';
import CatalogCategory from './CatalogCategory';
import CatalogItem from './CatalogItem';
import CartItem from './CartItem';
import FavoriteItem from './FavoriteItem';

import logger from '@/utils/logger';

// Import all models here
const models = {
  User,
  PhoneAuthCode,
  StatusConfig,
  // Article system models
  Article,
  ArticleCategory,
  ArticleTag,
  ArticleTagRelation,
  ArticleComment,
  ArticleLike,
  ArticleView,
  ArticleAttachment,
  ArticleDraft,
  ArticleRevision,
  // Feedback system models
  FeedbackSite,
  // Vacancy system models
  Vacancy,
  VacancyResponse,
  // Promotion system models
  Promotion,
  // Shop system models
  ShopLocation,
  // Catalog system models
  CatalogProduct,
  CatalogExclusion,
  CatalogSyncLog,
  CatalogCategory,
  CatalogItem,
  // Cart and Favorites
  CartItem,
  FavoriteItem,
};

// Set up associations
const setupAssociations = () => {
  // Existing associations - statusConfig is already defined in User.ts
  // User.belongsTo(StatusConfig, {
  //   foreignKey: 'status',
  //   targetKey: 'status_name',
  //   as: 'statusConfig'
  // });

  // StatusConfig.hasMany(User, {
  //   foreignKey: 'status',
  //   sourceKey: 'status_name',
  //   as: 'users'
  // });

  // =============================================================================
  // ARTICLE SYSTEM ASSOCIATIONS
  // =============================================================================

  // Article associations
  Article.belongsTo(User, {
    foreignKey: 'author_id',
    as: 'articleAuthor',
    onDelete: 'CASCADE',
  });

  Article.belongsTo(ArticleCategory, {
    foreignKey: 'category_id',
    as: 'category',
    onDelete: 'SET NULL',
  });

  User.hasMany(Article, {
    foreignKey: 'author_id',
    as: 'articles',
    onDelete: 'CASCADE',
  });

  ArticleCategory.hasMany(Article, {
    foreignKey: 'category_id',
    as: 'articles',
    onDelete: 'SET NULL',
  });

// Article category hierarchical associations
ArticleCategory.belongsTo(ArticleCategory, {
  foreignKey: 'parent_id',
  as: 'parentCategory',
  onDelete: 'SET NULL',
});

ArticleCategory.hasMany(ArticleCategory, {
  foreignKey: 'parent_id',
  as: 'childCategories',
  onDelete: 'SET NULL',
});

  // Article tags many-to-many associations
  Article.belongsToMany(ArticleTag, {
    through: ArticleTagRelation,
    foreignKey: 'article_id',
    otherKey: 'tag_id',
    as: 'tags',
    onDelete: 'CASCADE',
  });

  ArticleTag.belongsToMany(Article, {
    through: ArticleTagRelation,
    foreignKey: 'tag_id',
    otherKey: 'article_id',
    as: 'articles',
    onDelete: 'CASCADE',
  });

  // Article comments associations
  Article.hasMany(ArticleComment, {
    foreignKey: 'article_id',
    as: 'comments',
    onDelete: 'CASCADE',
  });

  ArticleComment.belongsTo(Article, {
    foreignKey: 'article_id',
    as: 'article',
    onDelete: 'CASCADE',
  });

  ArticleComment.belongsTo(User, {
    foreignKey: 'author_id',
    as: 'commentAuthor',
    onDelete: 'CASCADE',
  });

  User.hasMany(ArticleComment, {
    foreignKey: 'author_id',
    as: 'articleComments',
    onDelete: 'CASCADE',
  });

// Threaded comments associations
ArticleComment.belongsTo(ArticleComment, {
  foreignKey: 'parent_id',
  as: 'parentComment',
  onDelete: 'CASCADE',
});

ArticleComment.hasMany(ArticleComment, {
  foreignKey: 'parent_id',
  as: 'commentReplies',
  onDelete: 'CASCADE',
});

  // Article likes associations
  Article.hasMany(ArticleLike, {
    foreignKey: 'article_id',
    as: 'likes',
    onDelete: 'CASCADE',
  });

  ArticleLike.belongsTo(Article, {
    foreignKey: 'article_id',
    as: 'article',
    onDelete: 'CASCADE',
  });

ArticleLike.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'likeUser',
  onDelete: 'CASCADE',
});

  User.hasMany(ArticleLike, {
    foreignKey: 'user_id',
    as: 'articleLikes',
    onDelete: 'CASCADE',
  });

  // Article views associations
  Article.hasMany(ArticleView, {
    foreignKey: 'article_id',
    as: 'views',
    onDelete: 'CASCADE',
  });

  ArticleView.belongsTo(Article, {
    foreignKey: 'article_id',
    as: 'article',
    onDelete: 'CASCADE',
  });

ArticleView.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'viewUser',
  onDelete: 'SET NULL',
});

  User.hasMany(ArticleView, {
    foreignKey: 'user_id',
    as: 'articleViews',
    onDelete: 'SET NULL',
  });

  // Article attachments associations
  Article.hasMany(ArticleAttachment, {
    foreignKey: 'article_id',
    as: 'attachments',
    onDelete: 'CASCADE',
  });

  ArticleAttachment.belongsTo(Article, {
    foreignKey: 'article_id',
    as: 'article',
    onDelete: 'CASCADE',
  });

  ArticleAttachment.belongsTo(User, {
    foreignKey: 'uploaded_by',
    as: 'uploader',
    onDelete: 'CASCADE',
  });

  User.hasMany(ArticleAttachment, {
    foreignKey: 'uploaded_by',
    as: 'uploadedAttachments',
    onDelete: 'CASCADE',
  });

  // Article drafts associations
  Article.hasMany(ArticleDraft, {
    foreignKey: 'article_id',
    as: 'drafts',
    onDelete: 'CASCADE',
  });

  ArticleDraft.belongsTo(Article, {
    foreignKey: 'article_id',
    as: 'article',
    onDelete: 'CASCADE',
  });

  ArticleDraft.belongsTo(User, {
    foreignKey: 'author_id',
    as: 'draftAuthor',
    onDelete: 'CASCADE',
  });

  ArticleDraft.belongsTo(ArticleCategory, {
    foreignKey: 'category_id',
    as: 'category',
    onDelete: 'SET NULL',
  });

  User.hasMany(ArticleDraft, {
    foreignKey: 'author_id',
    as: 'articleDrafts',
    onDelete: 'CASCADE',
  });

  ArticleCategory.hasMany(ArticleDraft, {
    foreignKey: 'category_id',
    as: 'drafts',
    onDelete: 'SET NULL',
  });

  // Article revisions associations
  Article.hasMany(ArticleRevision, {
    foreignKey: 'article_id',
    as: 'revisions',
    onDelete: 'CASCADE',
  });

  ArticleRevision.belongsTo(Article, {
    foreignKey: 'article_id',
    as: 'article',
    onDelete: 'CASCADE',
  });

  ArticleRevision.belongsTo(User, {
    foreignKey: 'author_id',
    as: 'revisionAuthor',
    onDelete: 'CASCADE',
  });

  ArticleRevision.belongsTo(ArticleCategory, {
    foreignKey: 'category_id',
    as: 'category',
    onDelete: 'SET NULL',
  });

  User.hasMany(ArticleRevision, {
    foreignKey: 'author_id',
    as: 'articleRevisions',
    onDelete: 'CASCADE',
  });

  ArticleCategory.hasMany(ArticleRevision, {
    foreignKey: 'category_id',
    as: 'revisions',
    onDelete: 'SET NULL',
  });

  // =============================================================================
  // CART ASSOCIATIONS
  // =============================================================================
  
  User.hasMany(CartItem, {
    foreignKey: 'user_id',
    as: 'cartItems',
    onDelete: 'CASCADE',
  });

  CartItem.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
  });

  // =============================================================================
  // FAVORITES ASSOCIATIONS
  // =============================================================================
  
  User.hasMany(FavoriteItem, {
    foreignKey: 'user_id',
    as: 'favorites',
    onDelete: 'CASCADE',
  });

  FavoriteItem.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
  });

  logger.info('✅ Model associations set up successfully');
};

// Initialize all models and associations
const initializeModels = async (): Promise<void> => {
  try {
    // Set up associations
    setupAssociations();
    
    // Skip sync - using existing database structure
    logger.info('✅ Using existing database structure');
    
    logger.info('✅ Models initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize models:', error);
    throw error;
  }
};

export {
  sequelize,
  User,
  PhoneAuthCode,
  StatusConfig,
  // Article system models
  Article,
  ArticleCategory,
  ArticleTag,
  ArticleTagRelation,
  ArticleComment,
  ArticleLike,
  ArticleView,
  ArticleAttachment,
  ArticleDraft,
  ArticleRevision,
  // Feedback system models
  FeedbackSite,
  // Vacancy system models
  Vacancy,
  VacancyResponse,
  // Promotion system models
  Promotion,
  // Shop system models
  ShopLocation,
  // Catalog system models
  CatalogProduct,
  CatalogExclusion,
  CatalogSyncLog,
  CatalogCategory,
  CatalogItem,
  // Cart and Favorites
  CartItem,
  FavoriteItem,
  initializeModels,
  setupAssociations,
};

export default models;
