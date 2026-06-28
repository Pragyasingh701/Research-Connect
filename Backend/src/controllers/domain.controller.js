import ResearchDomain from '../models/ResearchDomain.js';
import AppError from '../utils/AppError.js';

export const getAllDomains = async (req, res, next) => {
  try {
    const { parent, search, isPopular, isTrending } = req.query;
    const filter = {};

    if (parent !== undefined) {
      filter.parentDomain = parent === 'null' ? null : parent;
    }
    if (search) {
      filter.name = new RegExp(search, 'i');
    }
    if (isPopular) {
      filter.isPopular = isPopular === 'true';
    }
    if (isTrending) {
      filter.isTrending = isTrending === 'true';
    }

    const domains = await ResearchDomain.find(filter)
      .populate('parentDomain', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: domains.length,
      domains,
    });
  } catch (error) {
    next(error);
  }
};

export const getPopularDomains = async (req, res, next) => {
  try {
    const domains = await ResearchDomain.find({ isPopular: true })
      .sort({ popularityScore: -1 })
      .limit(12);

    res.status(200).json({
      status: 'success',
      results: domains.length,
      domains,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingDomains = async (req, res, next) => {
  try {
    const domains = await ResearchDomain.find({ isTrending: true })
      .sort({ popularityScore: -1 })
      .limit(12);

    res.status(200).json({
      status: 'success',
      results: domains.length,
      domains,
    });
  } catch (error) {
    next(error);
  }
};

export const getDomainById = async (req, res, next) => {
  try {
    const domain = await ResearchDomain.findById(req.params.id).populate('parentDomain');
    if (!domain) {
      return next(new AppError('Domain not found', 404));
    }
    res.status(200).json({
      status: 'success',
      domain,
    });
  } catch (error) {
    next(error);
  }
};

export const createDomain = async (req, res, next) => {
  try {
    const { name, description, parentDomain, isPopular, isTrending, popularityScore } = req.body;

    const domain = await ResearchDomain.create({
      name,
      description,
      parentDomain: parentDomain || null,
      isPopular,
      isTrending,
      popularityScore,
    });

    res.status(201).json({
      status: 'success',
      domain,
    });
  } catch (error) {
    next(error);
  }
};
