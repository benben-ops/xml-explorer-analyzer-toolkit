import React, { useState } from 'react';
import { FileDown, Filter, CheckCircle, Eye, BarChart, List } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

interface XMLExtractorProps {
  xmlString: string;
  filename: string;
}

const XMLExtractor: React.FC<XMLExtractorProps> = ({ xmlString: inputXmlString, filename }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [extractionType, setExtractionType] = useState('element');
  const [specificElement, setSpecificElement] = useState('');
  const [specificAttribute, setSpecificAttribute] = useState('');
  const [includeParents, setIncludeParents] = useState(true);
  const [keepStructure, setKeepStructure] = useState(true);
  const [extractedXML, setExtractedXML] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    matchCount: number;
    samples: Element[];
    stats: {
      elementCounts: Record<string, number>;
      attributeCounts: Record<string, number>;
    };
  } | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const { toast } = useToast();

  const generatePreview = () => {
    if (!inputXmlString || !searchTerm) {
      toast({
        title: "Preview Failed",
        description: "Please provide an XML document and search criteria.",
        variant: "destructive"
      });
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(inputXmlString, 'text/xml');
      
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error(parserError.textContent || 'XML parsing error');
      }
      
      let matchedNodes: Element[] = [];
      
      if (extractionType === 'element') {
        const elementName = specificElement || '*';
        const elements = xmlDoc.getElementsByTagName(elementName);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i] as Element;
          
          if (
            element.nodeName.includes(searchTerm) || 
            element.textContent?.includes(searchTerm)
          ) {
            matchedNodes.push(element);
          }
        }
      } else if (extractionType === 'attribute') {
        const allElements = xmlDoc.getElementsByTagName('*');
        
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i] as Element;
          
          if (specificAttribute) {
            if (element.hasAttribute(specificAttribute)) {
              const attrValue = element.getAttribute(specificAttribute);
              if (attrValue && attrValue.includes(searchTerm)) {
                matchedNodes.push(element);
              }
            }
          } else {
            const attributes = element.attributes;
            for (let j = 0; j < attributes.length; j++) {
              const attr = attributes[j];
              if (
                attr.name.includes(searchTerm) || 
                attr.value.includes(searchTerm)
              ) {
                matchedNodes.push(element);
                break;
              }
            }
          }
        }
      } else if (extractionType === 'content') {
        const allElements = xmlDoc.getElementsByTagName('*');
        
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i] as Element;
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

      const elementCounts: Record<string, number> = {};
      const attributeCounts: Record<string, number> = {};
      
      matchedNodes.forEach(node => {
        elementCounts[node.nodeName] = (elementCounts[node.nodeName] || 0) + 1;
        
        for (let i = 0; i < node.attributes.length; i++) {
          const attrName = node.attributes[i].name;
          attributeCounts[attrName] = (attributeCounts[attrName] || 0) + 1;
        }
      });

      const samples = matchedNodes.slice(0, 5);
      
      setPreviewData({
        matchCount: matchedNodes.length,
        samples,
        stats: {
          elementCounts,
          attributeCounts
        }
      });
      
      setPreviewDialogOpen(true);
      
      toast({
        title: "Preview Generated",
        description: `Found ${matchedNodes.length} matching elements.`,
      });
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const extractData = () => {
    if (!inputXmlString || !searchTerm) {
      toast({
        title: "Extraction Failed",
        description: "Please provide an XML document and search criteria.",
        variant: "destructive"
      });
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(inputXmlString, 'text/xml');
      
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error(parserError.textContent || 'XML parsing error');
      }
      
      const resultDoc = document.implementation.createDocument(null, 'extraction-results', null);
      const rootNode = resultDoc.documentElement;
      
      rootNode.setAttribute('source', filename);
      rootNode.setAttribute('extracted', new Date().toISOString());
      rootNode.setAttribute('search-term', searchTerm);
      
      let matchedNodes: Element[] = [];
      
      if (extractionType === 'element') {
        const elementName = specificElement || '*';
        const elements = xmlDoc.getElementsByTagName(elementName);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i] as Element;
          
          if (
            element.nodeName.includes(searchTerm) || 
            element.textContent?.includes(searchTerm)
          ) {
            matchedNodes.push(element);
          }
        }
      } else if (extractionType === 'attribute') {
        const allElements = xmlDoc.getElementsByTagName('*');
        
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i] as Element;
          
          if (specificAttribute) {
            if (element.hasAttribute(specificAttribute)) {
              const attrValue = element.getAttribute(specificAttribute);
              if (attrValue && attrValue.includes(searchTerm)) {
                matchedNodes.push(element);
              }
            }
          } else {
            const attributes = element.attributes;
            for (let j = 0; j < attributes.length; j++) {
              const attr = attributes[j];
              if (
                attr.name.includes(searchTerm) || 
                attr.value.includes(searchTerm)
              ) {
                matchedNodes.push(element);
                break;
              }
            }
          }
        }
      } else if (extractionType === 'content') {
        const allElements = xmlDoc.getElementsByTagName('*');
        
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i] as Element;
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
      
      if (includeParents && keepStructure) {
        const processedPaths = new Set<string>();
        const newMatchedNodes: Element[] = [];
        
        matchedNodes.forEach(node => {
          let currentNode: Node | null = node;
          let path = '';
          while (currentNode && currentNode.nodeName !== '#document') {
            path = `/${currentNode.nodeName}${path}`;
            currentNode = currentNode.parentNode;
          }
          
          if (!processedPaths.has(path)) {
            processedPaths.add(path);
            
            let targetNode = node;
            if (targetNode.parentNode && targetNode.parentNode.nodeType === Node.ELEMENT_NODE) {
              const parentElement = cloneParentStructure(targetNode.parentNode as Element, resultDoc);
              if (parentElement) {
                newMatchedNodes.push(parentElement);
              } else {
                newMatchedNodes.push(node);
              }
            } else {
              newMatchedNodes.push(node);
            }
          }
        });
        
        if (newMatchedNodes.length > 0) {
          matchedNodes = newMatchedNodes;
        }
      }
      
      matchedNodes.forEach(node => {
        const importedNode = resultDoc.importNode(
          includeParents ? cloneWithParents(node) : node, 
          true
        );
        rootNode.appendChild(importedNode);
      });
      
      const serializer = new XMLSerializer();
      let xmlString = serializer.serializeToString(resultDoc);
      
      xmlString = formatXML(xmlString);
      
      setExtractedXML(xmlString);
      
      toast({
        title: "Extraction Complete",
        description: `Extracted ${matchedNodes.length} matching elements.`,
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
  
  const cloneParentStructure = (node: Element, doc: Document): Element | null => {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
    
    const newElement = doc.createElement(node.nodeName);
    
    Array.from(node.attributes).forEach(attr => {
      newElement.setAttribute(attr.name, attr.value);
    });
    
    if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
      const parentElement = cloneParentStructure(node.parentNode as Element, doc);
      if (parentElement) {
        parentElement.appendChild(newElement);
        return parentElement;
      }
    }
    
    return newElement;
  };
  
  const cloneWithParents = (node: Element): Element => {
    const clone = node.cloneNode(true) as Element;
    
    if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
      const parentClone = (node.parentNode as Element).cloneNode(false) as Element;
      parentClone.appendChild(clone);
      return parentClone;
    }
    
    return clone;
  };
  
  const formatXML = (xml: string): string => {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    
    xml.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) {
        indent = indent.substring(tab.length);
      }
      
      formatted += indent + '<' + node + '>\n';
      
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.match(/^<?\w[^>]*\/>/)) {
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

  const formatElementPreview = (element: Element): string => {
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(element);
    
    if (xmlString.length > 300) {
      xmlString = xmlString.substring(0, 297) + '...';
    }
    
    return xmlString;
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
            disabled={!inputXmlString}
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
        
        <div className="flex gap-2">
          <Button 
            onClick={generatePreview}
            disabled={!inputXmlString || !searchTerm}
            variant="outline"
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview Results
          </Button>
          
          <Button 
            onClick={extractData} 
            disabled={!inputXmlString || !searchTerm}
            className="flex-1"
          >
            <Filter className="mr-2 h-4 w-4" />
            Extract Data
          </Button>
        </div>
        
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

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> 
              Extraction Preview
            </DialogTitle>
            <DialogDescription>
              Preview of data that will be extracted from {filename}
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="summary" className="flex items-center gap-1">
                  <BarChart className="h-4 w-4" /> Summary
                </TabsTrigger>
                <TabsTrigger value="samples" className="flex items-center gap-1">
                  <List className="h-4 w-4" /> Sample Data
                </TabsTrigger>
                <TabsTrigger value="elements" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Elements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="p-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-secondary/20">
                    <p className="text-lg font-medium">
                      <span className="text-2xl font-bold">{previewData.matchCount}</span> matching elements found
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Based on your search criteria, these elements will be extracted from the XML file.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Element Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {Object.entries(previewData.stats.elementCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([element, count], index) => (
                              <li key={index} className="flex justify-between">
                                <span className="font-mono text-sm">{element}</span>
                                <span className="badge bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                                  {count}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Attributes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {Object.entries(previewData.stats.attributeCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([attribute, count], index) => (
                              <li key={index} className="flex justify-between">
                                <span className="font-mono text-sm">{attribute}</span>
                                <span className="badge bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                                  {count}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="samples" className="p-4">
                <div className="space-y-2">
                  {previewData.samples.length > 0 ? (
                    previewData.samples.map((sample, index) => (
                      <div key={index} className="p-3 border rounded-md font-mono text-xs overflow-x-auto whitespace-pre">
                        {formatElementPreview(sample)}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No samples available.</p>
                  )}
                  {previewData.matchCount > previewData.samples.length && (
                    <p className="text-sm text-muted-foreground">
                      Showing {previewData.samples.length} of {previewData.matchCount} matched elements.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="elements" className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Element Name</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(previewData.stats.elementCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([element, count], index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{element}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button onClick={() => setPreviewDialogOpen(false)} variant="outline">
              Close Preview
            </Button>
            <Button onClick={extractData}>
              <Filter className="mr-2 h-4 w-4" />
              Extract Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default XMLExtractor;
