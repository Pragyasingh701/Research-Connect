import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Sparkles, 
  Layers, 
  Info, 
  Folder, 
  FolderOpen, 
  Tag,
  BookOpen
} from 'lucide-react';
import api from '../../../services/api';

// Recursive Component to Render Taxonomy Nodes
function TaxonomyNode({ node, activePath, onSelect, expandedNodes, toggleExpand, depth = 0 }) {
  const isExpanded = expandedNodes[node._id];
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = activePath.some(n => n._id === node._id);
  const isDirectlySelected = activePath.length > 0 && activePath[activePath.length - 1]._id === node._id;

  return (
    <div className="my-1" style={{ marginLeft: depth > 0 ? '16px' : '0px' }}>
      <div 
        className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 group border cursor-pointer ${
          isDirectlySelected 
            ? 'bg-brand-light-blue/45 border-brand-blue/20 text-brand-blue shadow-sm' 
            : isSelected
              ? 'bg-brand-light-blue/15 border-transparent text-brand-blue font-medium'
              : 'bg-transparent border-transparent text-brand-text-secondary hover:bg-slate-100 hover:text-brand-text-primary'
        }`}
        onClick={() => onSelect(node)}
      >
        {/* Expand / Collapse Button or Spacer */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Don't trigger select on expand toggle
              toggleExpand(node._id);
            }}
            className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-brand-blue/10 text-slate-400 group-hover:text-brand-blue hover:text-brand-blue transition-all cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-5 h-5 flex items-center justify-center text-slate-350">
            <Tag className="w-3 h-3" />
          </span>
        )}
        
        {/* Node Icon */}
        <span className={`${isSelected ? 'text-brand-blue' : 'text-slate-400 group-hover:text-slate-500'}`}>
          {hasChildren ? (
            isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />
          ) : null}
        </span>
        
        {/* Node Name */}
        <span className={`text-sm font-medium transition-colors ${isDirectlySelected ? 'font-semibold' : ''}`}>
          {node.name}
        </span>
        
        {/* Hover Description (Subtle) */}
        {node.description && (
          <span className="text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 italic truncate max-w-[150px] sm:max-w-xs">
            — {node.description}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l border-brand-border/60 ml-2.5 pl-1.5 mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <TaxonomyNode
              key={child._id}
              node={child}
              activePath={activePath}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaxonomyBrowser() {
  const [treeData, setTreeData] = useState([]);
  const [flatNodes, setFlatNodes] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchTaxonomyTree();
  }, []);

  const fetchTaxonomyTree = async () => {
    setLoading(true);
    try {
      const res = await api.get('/taxonomy');
      const data = res.data;
      if (data.status === 'success') {
        const tree = data.tree || [];
        setTreeData(tree);
        
        // Flatten tree for path calculations
        const flat = [];
        const flatten = (nodes) => {
          nodes.forEach(n => {
            flat.push(n);
            if (n.children) flatten(n.children);
          });
        };
        flatten(tree);
        setFlatNodes(flat);

        // Select root by default if available
        if (tree.length > 0) {
          setSelectedNode(tree[0]);
          setActivePath([tree[0]]);
        }
      }
    } catch (err) {
      console.error('Error fetching taxonomy:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const expandAll = () => {
    const expansions = {};
    const recurse = (nodes) => {
      nodes.forEach(n => {
        if (n.children && n.children.length > 0) {
          expansions[n._id] = true;
          recurse(n.children);
        }
      });
    };
    recurse(treeData);
    setExpandedNodes(expansions);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
    
    // Calculate breadcrumb path using the current flatNodes array
    const path = [];
    let current = node;
    
    while (current) {
      path.unshift(current);
      const parentId = current.parent;
      current = flatNodes.find(n => n._id === parentId);
    }
    
    setActivePath(path);
  };

  // Taxonomy Search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get(`/taxonomy/search?q=${encodeURIComponent(searchQuery)}`);
        const data = res.data;
        if (data.status === 'success') {
          setSearchResults(data.matches || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchResultClick = (match) => {
    // Expand all parents of this node
    const expansions = { ...expandedNodes };
    let current = match;
    while (current && current.parent) {
      const parentId = current.parent._id || current.parent;
      expansions[parentId] = true;
      current = flatNodes.find(n => n._id === parentId);
    }
    setExpandedNodes(expansions);
    
    // Select the node
    const fullNode = flatNodes.find(n => n._id === match._id);
    if (fullNode) {
      handleSelectNode(fullNode);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm w-full my-6 grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Left 2 Columns: Tree Browser */}
      <div className="md:col-span-2 flex flex-col md:border-r border-brand-border/60 md:pr-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
          <div className="text-left">
            <h3 className="text-lg font-bold font-display text-brand-text-primary flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-blue" /> Research Taxonomy Tree
            </h3>
            <p className="text-xs text-brand-text-secondary mt-0.5">Explore standard disciplines and topics hierarchy</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={expandAll} 
              className="text-xs px-3 py-1.5 bg-brand-light-blue/50 text-brand-blue border border-brand-blue/15 hover:bg-brand-blue hover:text-white font-bold rounded-xl transition-all duration-200 cursor-pointer"
            >
              Expand All
            </button>
            <button 
              onClick={collapseAll} 
              className="text-xs px-3 py-1.5 bg-slate-50 text-brand-text-secondary border border-brand-border hover:bg-slate-200 hover:text-brand-text-primary font-bold rounded-xl transition-all duration-200 cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4 relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary/50" />
            <input
              type="text"
              placeholder="Search taxonomy nodes (e.g. CNN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-brand-bg border border-brand-border focus:border-brand-blue focus:ring-2 focus:ring-brand-light-blue rounded-xl text-sm text-brand-text-primary outline-none placeholder-slate-400 transition-colors"
            />
            {searching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-brand-border rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto overflow-hidden">
              {searchResults.map((match) => (
                <button
                  key={match._id}
                  onClick={() => handleSearchResultClick(match)}
                  className="w-full text-left px-4 py-2.5 hover:bg-brand-bg text-sm transition-colors duration-150 border-b border-brand-border/40 last:border-0 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-brand-blue">{match.name}</span>
                    {match.parent && (
                      <span className="text-xs text-brand-text-secondary ml-1.5 font-normal">
                        under <span className="font-medium text-brand-text-primary">{match.parent.name}</span>
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          )}
          {searchQuery && !searching && searchResults.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-brand-border rounded-xl p-4 shadow-lg z-20 text-center text-xs text-brand-text-secondary">
              No matching taxonomy nodes found for "{searchQuery}".
            </div>
          )}
        </div>

        {/* Scrollable Tree Container */}
        <div className="flex-1 overflow-y-auto max-h-[400px] min-h-[300px] bg-brand-bg/35 border border-brand-border/80 rounded-2xl p-4 text-left">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-brand-text-secondary">Loading taxonomy hierarchy...</span>
            </div>
          ) : treeData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-brand-text-secondary text-sm gap-2">
              <BookOpen className="w-8 h-8 text-slate-355" />
              <span>No taxonomy data available.</span>
            </div>
          ) : (
            <div className="space-y-1">
              {treeData.map((node) => (
                <TaxonomyNode
                  key={node._id}
                  node={node}
                  activePath={activePath}
                  onSelect={handleSelectNode}
                  expandedNodes={expandedNodes}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Node Details & Breadcrumbs */}
      <div className="flex flex-col justify-between text-left h-full min-h-[380px]">
        <div className="space-y-5">
          <h3 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-4 h-4 text-brand-blue" /> Taxonomy Inspector
          </h3>
          
          {selectedNode ? (
            <div className="bg-brand-bg/40 border border-brand-border/80 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
              {/* Breadcrumb path */}
              <div className="flex flex-wrap items-center text-xs text-brand-text-secondary gap-1">
                {activePath.map((pathNode, idx) => {
                  const isLast = idx === activePath.length - 1;
                  return (
                    <React.Fragment key={pathNode._id}>
                      <span 
                        onClick={() => handleSelectNode(pathNode)}
                        className={`cursor-pointer transition-colors ${
                          isLast 
                            ? 'text-brand-blue font-bold' 
                            : 'hover:text-brand-blue font-medium'
                        }`}
                      >
                        {pathNode.name}
                      </span>
                      {!isLast && <ChevronRight className="w-3 h-3 text-slate-350 shrink-0" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Node Title & Description */}
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-brand-text-primary">{selectedNode.name}</h4>
                <p className="text-xs text-brand-text-secondary leading-relaxed bg-white border border-brand-border/40 rounded-xl p-3 shadow-inner">
                  {selectedNode.description || 'No description available for this taxonomy node.'}
                </p>
              </div>

              {/* Node Meta Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-brand-border/60 rounded-xl shadow-sm text-center">
                  <span className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-wider block">Hierarchy Level</span>
                  <span className="text-sm font-extrabold text-brand-text-primary mt-1 block">Level {selectedNode.level ?? 0}</span>
                </div>
                <div className="p-3 bg-white border border-brand-border/60 rounded-xl shadow-sm text-center">
                  <span className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-wider block">Sub-categories</span>
                  <span className="text-sm font-extrabold text-brand-text-primary mt-1 block">
                    {selectedNode.children?.length ?? 0}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center py-12 px-6 text-center text-brand-text-secondary text-sm gap-2.5">
              <Info className="w-7 h-7 text-slate-300" />
              <span>Select a node in the taxonomy tree to view its hierarchy details.</span>
            </div>
          )}
        </div>

        {/* Tip Box */}
        <div className="bg-brand-light-blue/35 border border-brand-blue/10 text-brand-text-secondary rounded-2xl p-4 text-xs flex gap-3 items-start mt-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-brand-blue shrink-0 mt-0.5 animate-pulse" />
          <p className="leading-relaxed">
            <strong>Taxonomy Classification</strong> helps organize publications and improves matching algorithms for collaboration.
          </p>
        </div>
      </div>
    </div>
  );
}
