import * as searchService from '../services/search.service.js';
import SearchHistory from '../models/SearchHistory.js';
import SavedSearch from '../models/SavedSearch.js';
import AppError from '../utils/AppError.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const results = await searchService.executeGlobalSearch(q, parseInt(limit, 10) || 5);

    // Save search to history if a query exists
    if (q && req.user) {
      await SearchHistory.create({
        user: req.user._id,
        keyword: q
      });
    }

    res.status(200).json({
      status: 'success',
      results
    });
  } catch (error) {
    next(error);
  }
};

export const searchResearchers = async (req, res, next) => {
  try {
    const { sort, page, limit, ...filters } = req.query;
    const data = await searchService.searchResearchers(
      filters,
      sort,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10
    );

    res.status(200).json({
      status: 'success',
      ...data
    });
  } catch (error) {
    next(error);
  }
};

export const searchPublications = async (req, res, next) => {
  try {
    const { sort, page, limit, ...filters } = req.query;
    const data = await searchService.searchPublications(
      filters,
      sort,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10
    );

    res.status(200).json({
      status: 'success',
      ...data
    });
  } catch (error) {
    next(error);
  }
};

export const searchInstitutions = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await searchService.searchInstitutions(
      filters,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10
    );

    res.status(200).json({
      status: 'success',
      ...data
    });
  } catch (error) {
    next(error);
  }
};

export const getSuggestions = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const suggestions = await searchService.getSearchSuggestions(q, parseInt(limit, 10) || 8);

    res.status(200).json({
      status: 'success',
      suggestions
    });
  } catch (error) {
    next(error);
  }
};

export const getSearchHistory = async (req, res, next) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      results: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};

export const clearSearchHistory = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.status(200).json({
      status: 'success',
      message: 'Search history cleared'
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedSearches = async (req, res, next) => {
  try {
    const saved = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      results: saved.length,
      saved
    });
  } catch (error) {
    next(error);
  }
};

export const saveSearch = async (req, res, next) => {
  try {
    const { name, query, filters, searchType } = req.body;
    if (!name) {
      return next(new AppError('Search name is required', 400));
    }

    const saved = await SavedSearch.create({
      user: req.user._id,
      name,
      query,
      filters: filters || {},
      searchType: searchType || 'all'
    });

    res.status(201).json({
      status: 'success',
      saved
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSavedSearch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await SavedSearch.findOneAndDelete({ _id: id, user: req.user._id });
    
    if (!deleted) {
      return next(new AppError('Saved search not found or unauthorized', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Saved search deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
