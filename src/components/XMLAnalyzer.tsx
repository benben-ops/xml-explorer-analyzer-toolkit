
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, ListTree, FileBadge } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface XMLAnalyzerProps {
  xmlString: string;
}

interface ElementStat {
  name: string;
  count: number;
}

interface DepthStat {
  level: number;
  count: number;
}

interface AttributeStat {
  name: string;
  count: number;
}

const XMLAnalyzer: React.FC<XMLAnalyzerProps> = ({ xmlString }) => {
  const [elementStats, setElementStats] = useState<ElementStat[]>([]);
  const [attributeStats, setAttributeStats] = useState<AttributeStat[]>([]);
  const [depthStats, setDepthStats] = useState<DepthStat[]>([]);
  const [maxDepth, setMaxDepth] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalAttributes, setTotalAttributes] = useState(0);

  useEffect(() => {
    if (!xmlString) return;

    try {
      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error('XML parsing error:', parserError.textContent);
        return;
      }

      // Analyze elements
      const elementCounts: Record<string, number> = {};
      const attributeCounts: Record<string, number> = {};
      const depthCounts: Record<number, number> = {};
      let maxLevel = 0;
      let elemTotal = 0;
      let attrTotal = 0;

      // Recursive function to analyze nodes
      const analyzeNode = (node: Node, level: number = 0) => {
        if (level > maxLevel) maxLevel = level;
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const nodeName = element.nodeName;
          
          // Count element
          elementCounts[nodeName] = (elementCounts[nodeName] || 0) + 1;
          elemTotal++;
          
          // Count depth
          depthCounts[level] = (depthCounts[level] || 0) + 1;
          
          // Count attributes
          Array.from(element.attributes).forEach(attr => {
            attributeCounts[attr.name] = (attributeCounts[attr.name] || 0) + 1;
            attrTotal++;
          });
          
          // Process children
          Array.from(node.childNodes).forEach(child => {
            analyzeNode(child, level + 1);
          });
        }
      };
      
      // Start analysis from the root element
      analyzeNode(xmlDoc.documentElement);
      
      // Convert to arrays for charts
      const elementArray = Object.entries(elementCounts).map(([name, count]) => ({ name, count }));
      const attributeArray = Object.entries(attributeCounts).map(([name, count]) => ({ name, count }));
      const depthArray = Object.entries(depthCounts).map(([level, count]) => ({ 
        level: parseInt(level), 
        count 
      }));
      
      // Sort by count (descending)
      elementArray.sort((a, b) => b.count - a.count);
      attributeArray.sort((a, b) => b.count - a.count);
      depthArray.sort((a, b) => a.level - b.level);
      
      // Update state
      setElementStats(elementArray);
      setAttributeStats(attributeArray);
      setDepthStats(depthArray);
      setMaxDepth(maxLevel);
      setTotalElements(elemTotal);
      setTotalAttributes(attrTotal);
      
    } catch (error) {
      console.error('Error analyzing XML:', error);
    }
  }, [xmlString]);

  if (!xmlString) {
    return null;
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-secondary/50">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          XML Analysis
        </CardTitle>
        <CardDescription>
          Statistical analysis of the XML document structure
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {totalElements > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-secondary/30 p-3 rounded-md text-center">
                <div className="text-sm text-muted-foreground">Elements</div>
                <div className="text-2xl font-bold">{totalElements}</div>
              </div>
              <div className="bg-secondary/30 p-3 rounded-md text-center">
                <div className="text-sm text-muted-foreground">Attributes</div>
                <div className="text-2xl font-bold">{totalAttributes}</div>
              </div>
              <div className="bg-secondary/30 p-3 rounded-md text-center">
                <div className="text-sm text-muted-foreground">Max Depth</div>
                <div className="text-2xl font-bold">{maxDepth}</div>
              </div>
            </div>

            <Tabs defaultValue="elements">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="elements">Elements</TabsTrigger>
                <TabsTrigger value="attributes">Attributes</TabsTrigger>
                <TabsTrigger value="structure">Structure</TabsTrigger>
              </TabsList>
              
              <TabsContent value="elements" className="pt-4">
                <div className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={elementStats.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="bg-secondary/20 p-3 rounded-md">
                    <div className="font-medium mb-2 flex items-center gap-1">
                      <ListTree className="h-4 w-4" />
                      Elements List
                    </div>
                    <ScrollArea className="h-40">
                      <div className="flex flex-wrap gap-2">
                        {elementStats.map((stat) => (
                          <Badge key={stat.name} variant="outline" className="flex gap-1 items-center">
                            <span>{stat.name}</span>
                            <span className="bg-primary/10 text-primary-foreground px-1 rounded text-xs">
                              {stat.count}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="attributes" className="pt-4">
                <div className="space-y-4">
                  {attributeStats.length > 0 ? (
                    <>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={attributeStats.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="bg-secondary/20 p-3 rounded-md">
                        <div className="font-medium mb-2 flex items-center gap-1">
                          <FileBadge className="h-4 w-4" />
                          Attributes List
                        </div>
                        <ScrollArea className="h-40">
                          <div className="flex flex-wrap gap-2">
                            {attributeStats.map((stat) => (
                              <Badge key={stat.name} variant="outline" className="flex gap-1 items-center">
                                <span>{stat.name}</span>
                                <span className="bg-primary/10 text-primary-foreground px-1 rounded text-xs">
                                  {stat.count}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No attributes found in the XML document
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="structure" className="pt-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={depthStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" label={{ value: 'Depth Level', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Elements Count', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#0ea5e9" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Showing distribution of elements by depth level in the XML tree
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Load an XML document to see analysis
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XMLAnalyzer;
