import Keyword from '../models/Keyword.js';
import UserKeyword from '../models/UserKeyword.js';
import ResearchInterest from '../models/ResearchInterest.js';
import * as keywordService from '../services/keyword.service.js';
import AppError from '../utils/AppError.js';

export const getKeywords = async (req, res, next) => {
  try {
    const { search, category, isTrending } = req.query;
    const filter = {};

    if (search) {
      filter.keyword = new RegExp(search, 'i');
    }
    if (category) {
      filter.category = category;
    }
    if (isTrending) {
      filter.isTrending = isTrending === 'true';
    }

    const keywords = await Keyword.find(filter)
      .populate('parentKeyword', 'keyword')
      .sort({ keyword: 1 });

    res.status(200).json({
      status: 'success',
      results: keywords.length,
      keywords,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyKeywords = async (req, res, next) => {
  try {
    const userKeywords = await UserKeyword.find({ user: req.user._id })
      .populate('keyword')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: userKeywords.length,
      keywords: userKeywords.map(uk => uk.keyword).filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};

export const addKeyword = async (req, res, next) => {
  try {
    const { keyword, category, description, synonyms } = req.body;
    const normalized = keyword.trim().toLowerCase();

    // 1. Find or create global keyword
    let dbKeyword = await Keyword.findOne({ keyword: normalized });
    if (!dbKeyword) {
      dbKeyword = await Keyword.create({
        keyword: normalized,
        category: category || 'General',
        description: description || '',
        synonyms: synonyms || [],
        popularityScore: 1
      });
    }

    // 2. Associate with user
    let userKeyword = await UserKeyword.findOne({ user: req.user._id, keyword: dbKeyword._id });
    if (!userKeyword) {
      userKeyword = await UserKeyword.create({
        user: req.user._id,
        keyword: dbKeyword._id,
        source: 'manual'
      });
      
      // Update counts
      dbKeyword.numberOfResearchers = (dbKeyword.numberOfResearchers || 0) + 1;
      dbKeyword.popularityScore = (dbKeyword.popularityScore || 0) + 2;
      await dbKeyword.save();

      // Update ResearchInterest helper
      await ResearchInterest.findOneAndUpdate(
        { user: req.user._id },
        { $addToSet: { keywords: dbKeyword._id } },
        { upsert: true }
      );
    }

    res.status(201).json({
      status: 'success',
      keyword: dbKeyword,
    });
  } catch (error) {
    next(error);
  }
};

export const removeKeyword = async (req, res, next) => {
  try {
    const { id } = req.params; // Keyword ID

    const userKeyword = await UserKeyword.findOneAndDelete({ user: req.user._id, keyword: id });
    if (userKeyword) {
      const dbKeyword = await Keyword.findById(id);
      if (dbKeyword) {
        dbKeyword.numberOfResearchers = Math.max(0, (dbKeyword.numberOfResearchers || 1) - 1);
        await dbKeyword.save();
      }

      // Remove from ResearchInterest
      await ResearchInterest.findOneAndUpdate(
        { user: req.user._id },
        { $pull: { keywords: id } }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Keyword removed from profile',
    });
  } catch (error) {
    next(error);
  }
};

export const getPopularKeywords = async (req, res, next) => {
  try {
    const keywords = await Keyword.find({})
      .sort({ popularityScore: -1, numberOfResearchers: -1 })
      .limit(15);

    res.status(200).json({
      status: 'success',
      results: keywords.length,
      keywords,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingKeywords = async (req, res, next) => {
  try {
    const keywords = await Keyword.find({ isTrending: true })
      .sort({ popularityScore: -1 })
      .limit(15);

    res.status(200).json({
      status: 'success',
      results: keywords.length,
      keywords,
    });
  } catch (error) {
    next(error);
  }
};

export const getSuggestedKeywords = async (req, res, next) => {
  try {
    const suggestions = await keywordService.suggestKeywordsForResearcher(req.user._id);
    res.status(200).json({
      status: 'success',
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

export const extractKeywords = async (req, res, next) => {
  try {
    const { title, abstract } = req.body;
    if (!title || !abstract) {
      return next(new AppError('Title and abstract are required for keyword extraction', 400));
    }

    const extraction = await keywordService.extractKeywordsFromPublication(title, abstract);
    res.status(200).json({
      status: 'success',
      extraction,
    });
  } catch (error) {
    next(error);
  }
};

export const exportKeywords = async (req, res, next) => {
  try {
    const userKeywords = await UserKeyword.find({ user: req.user._id }).populate('keyword');
    const list = userKeywords.map(uk => uk.keyword?.keyword).filter(Boolean);

    res.status(200).json({
      status: 'success',
      keywords: list,
    });
  } catch (error) {
    next(error);
  }
};

export const importKeywords = async (req, res, next) => {
  try {
    const { keywords } = req.body; // Array of strings
    if (!Array.isArray(keywords)) {
      return next(new AppError('Keywords must be an array of strings', 400));
    }

    const imported = [];
    for (const kw of keywords) {
      const normalized = kw.trim().toLowerCase();
      if (!normalized) continue;

      let dbKeyword = await Keyword.findOne({ keyword: normalized });
      if (!dbKeyword) {
        dbKeyword = await Keyword.create({
          keyword: normalized,
          category: 'Imported',
          popularityScore: 1
        });
      }

      let userKeyword = await UserKeyword.findOne({ user: req.user._id, keyword: dbKeyword._id });
      if (!userKeyword) {
        await UserKeyword.create({ user: req.user._id, keyword: dbKeyword._id });
        dbKeyword.numberOfResearchers = (dbKeyword.numberOfResearchers || 0) + 1;
        await dbKeyword.save();
      }

      imported.push(dbKeyword);
    }

    // Sync to ResearchInterest
    await ResearchInterest.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { keywords: { $each: imported.map(k => k._id) } } },
      { upsert: true }
    );

    res.status(200).json({
      status: 'success',
      message: `${imported.length} keywords imported successfully`,
      keywords: imported,
    });
  } catch (error) {
    next(error);
  }
};
