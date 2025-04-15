
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Hash, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface XMLNode {
  type: 'element' | 'attribute' | 'text' | 'comment' | 'cdata';
  name?: string;
  value?: string;
  attributes?: { [key: string]: string };
  children?: XMLNode[];
  path?: string;
}

interface XMLTreeViewProps {
  xmlString: string;
  searchTerm?: string;
  selectedPath?: string;
  onNodeSelect?: (path: string) => void;
}

const XMLTreeView: React.FC<XMLTreeViewProps> = ({ 
  xmlString, 
  searchTerm = '', 
  selectedPath = '',
  onNodeSelect
}) => {
  const [xmlTree, setXmlTree] = useState<XMLNode | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [matchingNodes, setMatchingNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Parse XML string to tree structure
  useEffect(() => {
    if (!xmlString) {
      setXmlTree(null);
      return;
    }

    try {
      // Use browser's DOMParser to parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error(parserError.textContent || 'XML parsing error');
      }

      // Convert XML DOM to our tree structure
      const parseNode = (node: Node, path: string = ''): XMLNode => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const attributes: { [key: string]: string } = {};
          const newPath = path ? `${path}/${element.nodeName}` : element.nodeName;
          
          // Process attributes
          Array.from(element.attributes).forEach((attr) => {
            attributes[attr.name] = attr.value;
          });
          
          // Process child nodes
          const children: XMLNode[] = [];
          let hasTextContent = false;
          
          Array.from(element.childNodes).forEach((childNode, index) => {
            if (childNode.nodeType === Node.TEXT_NODE) {
              const text = childNode.textContent?.trim();
              if (text) {
                hasTextContent = true;
                children.push({
                  type: 'text',
                  value: text,
                  path: `${newPath}/text()[${index}]`
                });
              }
            } else if (childNode.nodeType === Node.COMMENT_NODE) {
              children.push({
                type: 'comment',
                value: childNode.textContent || '',
                path: `${newPath}/comment()[${index}]`
              });
            } else if (childNode.nodeType === Node.CDATA_SECTION_NODE) {
              children.push({
                type: 'cdata',
                value: childNode.textContent || '',
                path: `${newPath}/cdata()[${index}]`
              });
            } else {
              children.push(parseNode(childNode, newPath));
            }
          });
          
          // Pre-expand nodes with simple text content
          if (hasTextContent && children.length === 1) {
            setExpandedNodes(prev => {
              const newSet = new Set(prev);
              newSet.add(newPath);
              return newSet;
            });
          }
          
          return {
            type: 'element',
            name: element.nodeName,
            attributes,
            children: children.length > 0 ? children : undefined,
            path: newPath
          };
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (!text) return { type: 'text', value: '', path };
          return { type: 'text', value: text, path };
        } else if (node.nodeType === Node.COMMENT_NODE) {
          return {
            type: 'comment',
            value: node.textContent || '',
            path
          };
        } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
          return {
            type: 'cdata',
            value: node.textContent || '',
            path
          };
        }
        
        // Default for other node types
        return { type: 'text', value: '', path };
      };
      
      // Get the root element
      const rootElement = xmlDoc.documentElement;
      const tree = parseNode(rootElement);
      
      setXmlTree(tree);
      setValidationError(null);
      
      // Auto-expand the first level
      setExpandedNodes(new Set([rootElement.nodeName]));
    } catch (error) {
      console.error('XML parsing error:', error);
      setValidationError((error as Error).message);
      setXmlTree(null);
      
      toast({
        title: "XML Validation Error",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  }, [xmlString, toast]);

  // Update matching nodes when search term changes
  useEffect(() => {
    if (!searchTerm || !xmlTree) {
      setMatchingNodes(new Set());
      return;
    }

    const newMatchingNodes = new Set<string>();
    
    // Find all nodes that match the search term
    const findMatchingNodes = (node: XMLNode) => {
      const nodeText = node.name || node.value || '';
      const attributeText = node.attributes 
        ? Object.entries(node.attributes).map(([k, v]) => `${k}="${v}"`).join(' ')
        : '';
        
      const nodeContains = searchTerm && (
        nodeText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attributeText.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (nodeContains && node.path) {
        newMatchingNodes.add(node.path);
        
        // Add all parent paths to expanded nodes
        if (node.path) {
          let currentPath = node.path;
          const parts = currentPath.split('/');
          
          while (parts.length > 1) {
            parts.pop();
            currentPath = parts.join('/');
            if (currentPath) setExpandedNodes(prev => new Set([...prev, currentPath]));
          }
        }
      }
      
      // Recursively check children
      if (node.children) {
        node.children.forEach(findMatchingNodes);
      }
    };
    
    findMatchingNodes(xmlTree);
    setMatchingNodes(newMatchingNodes);
  }, [searchTerm, xmlTree]);

  // Toggle node expansion
  const toggleNode = useCallback((path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  // Handle node selection
  const handleNodeClick = useCallback((path: string) => {
    if (onNodeSelect) {
      onNodeSelect(path);
    }
  }, [onNodeSelect]);

  // Highlight text based on search term
  const highlightText = useCallback((text: string, term: string) => {
    if (!term || !text) return text;
    
    try {
      const regex = new RegExp(`(${term})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, i) => 
        regex.test(part) ? <span key={i} className="xml-highlight">{part}</span> : part
      );
    } catch (e) {
      // If regex is invalid, return original text
      return text;
    }
  }, []);

  // Recursive rendering of XML tree
  const renderNode = useCallback((node: XMLNode, level: number = 0) => {
    const isExpanded = node.path ? expandedNodes.has(node.path) : false;
    const isSelected = node.path === selectedPath;
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = node.path ? matchingNodes.has(node.path) : false;
    
    // Render the node based on its type
    switch (node.type) {
      case 'element': {
        const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0;
        
        return (
          <div key={node.path} className={`xml-tree-node ${isSelected ? 'bg-blue-50 rounded' : ''}`}>
            <div 
              className="flex items-start"
              onClick={() => node.path && handleNodeClick(node.path)}
            >
              {hasChildren && (
                <span 
                  className="xml-tree-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    node.path && toggleNode(node.path);
                  }}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              )}
              {!hasChildren && <span className="w-4 ml-1" />}
              
              <div className="flex-1">
                <span className="xml-element">
                  &lt;{highlightText(node.name || '', searchTerm)}
                  {hasAttributes && (
                    <>
                      {' '}
                      {Object.entries(node.attributes || {}).map(([key, value]) => (
                        <span key={key} className="whitespace-nowrap">
                          <span className="xml-attribute">{highlightText(key, searchTerm)}</span>
                          =
                          <span className="xml-attribute-value">"{highlightText(value, searchTerm)}"</span>
                          {' '}
                        </span>
                      ))}
                    </>
                  )}
                  {!hasChildren ? ' /' : ''}
                  &gt;
                </span>
                
                {matchesSearch && !isSelected && (
                  <Badge variant="outline" className="ml-2 bg-yellow-100">Match</Badge>
                )}
                                
                {hasChildren && isExpanded && (
                  <div className="xml-tree-node-expanded">
                    {node.children?.map(child => renderNode(child, level + 1))}
                    <span className="xml-element">&lt;/{node.name}&gt;</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
      
      case 'text':
        return (
          <div key={node.path} className={`xml-tree-node ${isSelected ? 'bg-blue-50 rounded' : ''}`}>
            <div 
              className="flex items-center gap-1"
              onClick={() => node.path && handleNodeClick(node.path)}
            >
              <span className="xml-text">{highlightText(node.value || '', searchTerm)}</span>
              {matchesSearch && !isSelected && (
                <Badge variant="outline" className="ml-2 bg-yellow-100">Match</Badge>
              )}
            </div>
          </div>
        );
        
      case 'comment':
        return (
          <div key={node.path} className={`xml-tree-node ${isSelected ? 'bg-blue-50 rounded' : ''}`}>
            <div 
              className="flex items-center"
              onClick={() => node.path && handleNodeClick(node.path)}
            >
              <span className="xml-comment">&lt;!-- {highlightText(node.value || '', searchTerm)} --&gt;</span>
              {matchesSearch && !isSelected && (
                <Badge variant="outline" className="ml-2 bg-yellow-100">Match</Badge>
              )}
            </div>
          </div>
        );
        
      case 'cdata':
        return (
          <div key={node.path} className={`xml-tree-node ${isSelected ? 'bg-blue-50 rounded' : ''}`}>
            <div 
              className="flex items-center"
              onClick={() => node.path && handleNodeClick(node.path)}
            >
              <span className="xml-cdata">&lt;![CDATA[ {highlightText(node.value || '', searchTerm)} ]]&gt;</span>
              {matchesSearch && !isSelected && (
                <Badge variant="outline" className="ml-2 bg-yellow-100">Match</Badge>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  }, [expandedNodes, selectedPath, matchingNodes, searchTerm, handleNodeClick, toggleNode, highlightText]);

  return (
    <Card className="w-full shadow-md h-full">
      <CardHeader className="bg-secondary/50">
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          XML Tree View
        </CardTitle>
        <CardDescription>
          Interactive visualization of XML structure
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[600px] p-4">
        {validationError ? (
          <Alert variant="destructive">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        ) : xmlTree ? (
          <TooltipProvider>
            <div className="xml-tree font-mono text-sm">
              {renderNode(xmlTree)}
            </div>
          </TooltipProvider>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Info className="h-12 w-12 mb-2" />
            <p>Upload or paste an XML document to view its structure</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XMLTreeView;
