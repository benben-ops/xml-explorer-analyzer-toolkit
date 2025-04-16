
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import XMLUploader from '@/components/XMLUploader';
import XMLTreeView from '@/components/XMLTreeView';
import XMLSearch from '@/components/XMLSearch';
import XMLAnalyzer from '@/components/XMLAnalyzer';
import XMLExtractor from '@/components/XMLExtractor';
import { SearchOptions } from '@/components/XMLSearch';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Github, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Index = () => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<string>('');
  const { toast } = useToast();

  const handleXMLLoaded = (content: string, name: string) => {
    setXmlContent(content);
    setFilename(name);
    setSearchTerm('');
    setSelectedNode('');
  };

  const handleSearch = (term: string, options: SearchOptions) => {
    if (!term.trim()) {
      toast({
        title: "Invalid search",
        description: "Please enter a search term.",
        variant: "destructive"
      });
      return;
    }

    // Process search based on options
    let processedTerm = term;
    
    if (!options.caseSensitive) {
      // For case-insensitive search, we don't modify the term
      // The highlighting will handle case-insensitivity
    }
    
    if (options.wholeWord) {
      // For whole word search, we should use word boundaries
      // but since this is XML, we'll handle it in the tree view
    }
    
    if (options.useRegex) {
      try {
        // Test if the regex is valid
        new RegExp(term);
      } catch (e) {
        toast({
          title: "Invalid regular expression",
          description: "Please enter a valid regular expression.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setSearchTerm(processedTerm);
    
    toast({
      title: "Search started",
      description: `Searching for "${term}" in ${options.searchIn} parts of the XML.`,
    });
  };

  const handleNodeSelect = (path: string) => {
    setSelectedNode(path);
  };

  return (
    <div className="container mx-auto py-6 px-4 min-h-screen">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">BenBen XML Processing Tools</h1>
          </div>
          <a
            href="https://github.com/benben-ops/xml-explorer-analyzer-toolkit"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
          >
            <Github className="h-5 w-5" />
            <span className="hidden md:inline">View on GitHub</span>
          </a>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Upload, visualize, analyze, and process XML files with this interactive toolkit. 
          Explore the structure, search for content, and extract specific data.
        </p>
      </header>

      <main className="space-y-6">
        <XMLUploader onXMLLoaded={handleXMLLoaded} />

        {xmlContent && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <XMLSearch 
                onSearch={handleSearch} 
                isXmlLoaded={!!xmlContent}
              />
              <XMLAnalyzer xmlString={xmlContent} />
            </div>

            <Tabs defaultValue="tree" className="w-full">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="tree">Tree View</TabsTrigger>
                <TabsTrigger value="extract">Data Extraction</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tree" className="pt-4">
                <XMLTreeView 
                  xmlString={xmlContent} 
                  searchTerm={searchTerm}
                  selectedPath={selectedNode}
                  onNodeSelect={handleNodeSelect}
                />
              </TabsContent>
              
              <TabsContent value="extract" className="pt-4">
                <XMLExtractor 
                  xmlString={xmlContent}
                  filename={filename}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <footer className="mt-12 py-6 text-center text-gray-500 text-sm">
        <p>© 2025 XML Processing Tools. Built with React and Tailwind CSS.</p>
        <p className="mt-1">This is a client-side application. Your XML files are processed locally in your browser.</p>
        <div className="mt-2 flex justify-center gap-4">
          <a 
            href="https://benben.sk/" 
            target="_blank" 
            rel="noreferrer" 
            className="text-primary hover:underline"
          >
            BENBEN.SK
          </a>
          <a 
            href="https://github.com/benben-ops/xml-explorer-analyzer-toolkit#readme" 
            target="_blank" 
            rel="noreferrer" 
            className="text-primary hover:underline"
          >
            What is it for?
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
