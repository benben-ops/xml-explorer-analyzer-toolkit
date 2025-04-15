
import React, { useState } from 'react';
import { Upload, FileUp, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

interface XMLUploaderProps {
  onXMLLoaded: (xmlString: string, filename: string) => void;
}

const XMLUploader: React.FC<XMLUploaderProps> = ({ onXMLLoaded }) => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an XML file smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an XML file (.xml extension).",
        variant: "destructive"
      });
      return;
    }

    setFilename(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
      onXMLLoaded(content, file.name);
    };
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Could not read the uploaded file.",
        variant: "destructive"
      });
    };
    reader.readAsText(file);
  };

  const handlePasteContent = () => {
    if (!xmlContent.trim()) {
      toast({
        title: "No content",
        description: "Please enter some XML content.",
        variant: "destructive"
      });
      return;
    }
    
    onXMLLoaded(xmlContent, filename || 'pasted-content.xml');
    toast({
      title: "XML content loaded",
      description: "XML content has been loaded successfully.",
    });
  };

  const loadSampleXML = () => {
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">Harry Potter and the Philosopher's Stone</title>
    <author>J.K. Rowling</author>
    <year>1997</year>
    <price>24.99</price>
  </book>
  <book category="fiction">
    <title lang="en">The Lord of the Rings</title>
    <author>J.R.R. Tolkien</author>
    <year>1954</year>
    <price>29.99</price>
  </book>
  <book category="technical">
    <title lang="en">XML Processing with Python</title>
    <author>John Smith</author>
    <year>2018</year>
    <price>49.95</price>
  </book>
  <book category="technical">
    <title lang="en">Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>`;
    
    setXmlContent(sampleXML);
    setFilename('sample-bookstore.xml');
    onXMLLoaded(sampleXML, 'sample-bookstore.xml');
    toast({
      title: "Sample XML loaded",
      description: "Sample XML content has been loaded.",
    });
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-secondary/50">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          XML Input
        </CardTitle>
        <CardDescription>
          Upload an XML file or paste XML content directly
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste XML</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-4">
            <div className="flex flex-col gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                  id="xml-file"
                  type="file"
                  accept=".xml"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="paste" className="pt-4">
            <div className="flex flex-col gap-4">
              <Textarea 
                placeholder="Paste your XML content here..." 
                className="min-h-[200px] font-mono text-sm"
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
              />
              <Button onClick={handlePasteContent}>
                <Code className="mr-2 h-4 w-4" />
                Process XML Content
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between bg-secondary/30">
        <div className="text-sm text-muted-foreground">
          {filename ? `File: ${filename}` : 'No file loaded'}
        </div>
        <Button variant="outline" size="sm" onClick={loadSampleXML}>
          <FileUp className="mr-2 h-4 w-4" />
          Load Sample
        </Button>
      </CardFooter>
    </Card>
  );
};

export default XMLUploader;
