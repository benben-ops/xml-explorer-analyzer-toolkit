import React, { useState } from 'react';
import { FileDown, Filter, CheckCircle, Circle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

interface XMLExtractorProps {
  xmlString: string;
  filename: string;
}

const XMLExtractor: React.FC<XMLExtractorProps> = ({ xmlString, filename }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [extractionType, setExtractionType] = useState('element');
  const [specificElement, setSpecificElement] = useState('');
  const [specificAttribute, setSpecificAttribute] = useState('');
  const [includeParents, setIncludeParents] = useState(true);
  const [keepStructure, setKeepStructure] = useState(true);
  const [extractedXML, setExtractedXML] = useState<string | null>(null);
  const { toast } = useToast();

  const extractData = () => {
    if (!xmlString || !searchTerm) {
      toast({
        title: "Extraction Failed",
        description: "Please provide an XML document and search criteria.",
        variant: "destructive"
      });
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error(parserError.textContent || 'XML parsing error');
      }
      
      // Create a new XML document for the extraction result
      const resultDoc = document.implementation.createDocument(null, 'extraction-results', null);
      const rootNode = resultDoc.documentElement;
      
      // Add metadata
      rootNode.setAttribute('source', filename);
      rootNode.setAttribute('extracted', new Date().toISOString());
      rootNode.setAttribute('search-term', searchTerm);
      
      let matchedNodes: Element[] = [];
      
      // Extract based on criteria
      if (extractionType === 'element') {
        // Search in element names
        const elementName = specificElement || '*';
        const elements = xmlDoc.getElementsByTagName(elementName);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i] as Element;
          
          // Check if the element or its content contains the search term
          if (
            element.nodeName.includes(searchTerm) || 
            element.textContent?.includes(searchTerm)
          ) {
            matchedNodes.push(element);
          }
        }
      } else if (extractionType === 'attribute') {
        // Search in attribute names/values
        const allElements = xmlDoc.getElementsByTagName('*');
        
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i] as Element;
          
          // If specific attribute provided, only check that one
          if (specificAttribute) {
            if (element.hasAttribute(specificAttribute)) {
              const attrValue = element.getAttribute(specificAttribute);
              if (attrValue && attrValue.includes(searchTerm)) {
                matchedNodes.push(element);
              }
            }
          } else {
            // Check all attributes
            const attributes = element.attributes;
            for (let j = 0; j < attributes.length; j++) {
              const attr = attributes[j];
              if (
                attr.name.includes(searchTerm) || 
                attr.value.includes(searchTerm)
              ) {
                matchedNodes.push(element);
                break; // Only add the element once
              }
            }
          }
        }
      } else if (extractionType === 'content') {
        // Search in element content/values
        const allElements = xmlDoc.getElementsByTagName('*');
        
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i] as Element;
          // Check if the content contains the search term
          // and the element doesn't have child elements (only text)
          let hasOnlyTextContent = true;
          for (let j = 0; j < element.childNodes.length; j++) {
            if (element.childNodes[j].nodeType === Node.ELEMENT_NODE) {
              hasOnlyTextContent = false;
              break;
            }
          }
          
          if (
            hasOnlyTextContent && 
            element.textContent && 
            element.textContent.includes(searchTerm)
          ) {
            matchedNodes.push(element);
          }
        }
      }
      
      // If we need to include parent context and keep structure
      if (includeParents && keepStructure) {
        const processedPaths = new Set<string>();
        const newMatchedNodes: Element[] = [];
        
        matchedNodes.forEach(node => {
          // Build a path to identify this node
          let currentNode: Node | null = node;
          let path = '';
          while (currentNode && currentNode.nodeName !== '#document') {
            path = `/${currentNode.nodeName}${path}`;
            currentNode = currentNode.parentNode;
          }
          
          // If we haven't processed this path yet
          if (!processedPaths.has(path)) {
            processedPaths.add(path);
            
            // Include the node with its full parent structure
            let targetNode = node;
            if (targetNode.parentNode && targetNode.parentNode.nodeType === Node.ELEMENT_NODE) {
              // Clone the parent structure
              const clonedParent = (targetNode.parentNode as Element).cloneNode(false) as Element;
              const parentResult = cloneParentStructure(targetNode.parentNode as Element, resultDoc);
              
              if (parentResult) {
                newMatchedNodes.push(parentResult);
              } else {
                // If we couldn't build parent structure, just add the node
                newMatchedNodes.push(node);
              }
            } else {
              newMatchedNodes.push(node);
            }
          }
        });
        
        // Replace with the structured nodes
        if (newMatchedNodes.length > 0) {
          matchedNodes = newMatchedNodes;
        }
      }
      
      // Add results to output document
      matchedNodes.forEach(node => {
        const importedNode = resultDoc.importNode(
          includeParents ? cloneWithParents(node) : node, 
          true
        );
        rootNode.appendChild(importedNode);
      });
      
      // Convert to string
      const serializer = new XMLSerializer();
      let xmlString = serializer.serializeToString(resultDoc);
      
      // Format the XML (simple indentation)
      xmlString = formatXML(xmlString);
      
      setExtractedXML(xmlString);
      
      toast({
        title: "Extraction Complete",
        description: `Found ${matchedNodes.length} matching elements.`,
      });
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };
  
  // Helper function to recursively clone parent structure
  const cloneParentStructure = (node: Element, doc: Document): Element | null => {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
    
    // Create a new element with the same name
    const newElement = doc.createElement(node.nodeName);
    
    // Copy attributes
    Array.from(node.attributes).forEach(attr => {
      newElement.setAttribute(attr.name, attr.value);
    });
    
    // If this node has a parent, create that too
    if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
      const parentElement = cloneParentStructure(node.parentNode as Element, doc);
      if (parentElement) {
        parentElement.appendChild(newElement);
        return parentElement;
      }
    }
    
    return newElement;
  };
  
  // Clone a node with its full parent structure
  const cloneWithParents = (node: Element): Element => {
    const clone = node.cloneNode(true) as Element;
    
    // If we want to retain parent elements
    if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
      const parentClone = (node.parentNode as Element).cloneNode(false) as Element;
      parentClone.appendChild(clone);
      return parentClone;
    }
    
    return clone;
  };
  
  // Function to format XML with indentation
  const formatXML = (xml: string): string => {
    let formatted = '';
    let indent = '';
    const tab = '  '; // 2 spaces
    
    xml.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) {
        // Closing tag
        indent = indent.substring(tab.length);
      }
      
      formatted += indent + '<' + node + '>\n';
      
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.match(/^<?\w[^>]*\/>/)) {
        // Opening tag and not self-closing
        indent += tab;
      }
    });
    
    return formatted.substring(1, formatted.length - 2);
  };

  const downloadExtractedXML = () => {
    if (!extractedXML) return;
    
    const blob = new Blob([extractedXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-${filename || 'data.xml'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Your extracted XML file is being downloaded.",
    });
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-secondary/50">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          XML Data Extractor
        </CardTitle>
        <CardDescription>
          Extract and filter XML data based on search criteria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="search-term">Search Term</Label>
          <Input
            id="search-term"
            placeholder="Enter search term..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!xmlString}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Extract Based On</Label>
          <RadioGroup
            value={extractionType}
            onValueChange={setExtractionType}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="element" id="extract-element" />
              <Label htmlFor="extract-element">Element Name</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="attribute" id="extract-attribute" />
              <Label htmlFor="extract-attribute">Attribute</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="content" id="extract-content" />
              <Label htmlFor="extract-content">Element Content</Label>
            </div>
          </RadioGroup>
        </div>
        
        {extractionType === 'element' && (
          <div className="space-y-2">
            <Label htmlFor="specific-element">Specific Element (optional)</Label>
            <Input
              id="specific-element"
              placeholder="Enter element name or leave empty for any"
              value={specificElement}
              onChange={(e) => setSpecificElement(e.target.value)}
            />
          </div>
        )}
        
        {extractionType === 'attribute' && (
          <div className="space-y-2">
            <Label htmlFor="specific-attribute">Specific Attribute (optional)</Label>
            <Input
              id="specific-attribute"
              placeholder="Enter attribute name or leave empty for any"
              value={specificAttribute}
              onChange={(e) => setSpecificAttribute(e.target.value)}
            />
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-parents" 
              checked={includeParents}
              onCheckedChange={(checked) => setIncludeParents(checked as boolean)}
            />
            <Label htmlFor="include-parents">Include parent elements</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="keep-structure" 
              checked={keepStructure}
              onCheckedChange={(checked) => setKeepStructure(checked as boolean)}
            />
            <Label htmlFor="keep-structure">Preserve XML structure</Label>
          </div>
        </div>
        
        <Button 
          onClick={extractData} 
          disabled={!xmlString || !searchTerm}
          className="w-full"
        >
          <Filter className="mr-2 h-4 w-4" />
          Extract Data
        </Button>
        
        {extractedXML && (
          <div className="space-y-2">
            <Label htmlFor="extracted-xml">Extracted XML</Label>
            <Textarea
              id="extracted-xml"
              className="font-mono text-sm h-60"
              value={extractedXML}
              readOnly
            />
          </div>
        )}
      </CardContent>
      
      {extractedXML && (
        <CardFooter className="bg-secondary/30 flex justify-end">
          <Button onClick={downloadExtractedXML} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Download Extracted XML
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default XMLExtractor;
