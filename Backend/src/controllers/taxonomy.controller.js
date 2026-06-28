import ResearchTaxonomy from '../models/ResearchTaxonomy.js';
import AppError from '../utils/AppError.js';

// Recursive helper to build tree
const buildTree = (nodes, parentId = null) => {
  const branch = [];
  const filterNodes = nodes.filter(node => {
    if (parentId === null) {
      return node.parent === null || !node.parent;
    }
    return node.parent && node.parent.toString() === parentId.toString();
  });

  for (const node of filterNodes) {
    const children = buildTree(nodes, node._id);
    const nodeObj = node.toObject ? node.toObject() : node;
    if (children.length) {
      nodeObj.children = children;
    } else {
      nodeObj.children = [];
    }
    branch.push(nodeObj);
  }

  return branch;
};

export const getTaxonomyTree = async (req, res, next) => {
  try {
    const nodes = await ResearchTaxonomy.find({}).sort({ level: 1, name: 1 });
    const tree = buildTree(nodes);

    res.status(200).json({
      status: 'success',
      results: tree.length,
      tree,
    });
  } catch (error) {
    next(error);
  }
};

export const searchTaxonomy = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return next(new AppError('Search query is required', 400));
    }

    const matches = await ResearchTaxonomy.find({
      name: new RegExp(q, 'i')
    }).populate('parent');

    res.status(200).json({
      status: 'success',
      results: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

export const createTaxonomyNode = async (req, res, next) => {
  try {
    const { name, parent, description } = req.body;

    const node = await ResearchTaxonomy.create({
      name,
      parent: parent || null,
      description: description || ''
    });

    res.status(201).json({
      status: 'success',
      node,
    });
  } catch (error) {
    next(error);
  }
};
