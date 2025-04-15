
import React, { useState } from 'react';
import { Upload, FileUp, Code, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface XMLUploaderProps {
  onXMLLoaded: (xmlString: string, filename: string) => void;
}

const XMLUploader: React.FC<XMLUploaderProps> = ({ onXMLLoaded }) => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [largeFile, setLargeFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Increased to 20MB (20 * 1024 * 1024 bytes)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const WARNING_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an XML file (.xml extension).",
        variant: "destructive"
      });
      return;
    }

    // Check file size (limit to 20MB)
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload an XML file smaller than 20MB.",
        variant: "destructive"
      });
      return;
    }

    // Show warning for large files (over 10MB)
    if (file.size > WARNING_FILE_SIZE) {
      setLargeFile(file);
      setShowWarning(true);
      return;
    }

    processFile(file);
  };

  const processFile = (file: File) => {
    setFilename(file.name);
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
      onXMLLoaded(content, file.name);
      setIsLoading(false);
    };
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Could not read the uploaded file.",
        variant: "destructive"
      });
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleConfirmLargeFile = () => {
    if (largeFile) {
      processFile(largeFile);
    }
    setShowWarning(false);
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
    <>
      <Card className="w-full shadow-md">
        <CardHeader className="bg-secondary/50">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            XML Input
          </CardTitle>
          <CardDescription>
            Upload an XML file (up to 20MB) or paste XML content directly
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
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle>File size limit</AlertTitle>
                  <AlertDescription>
                    You can upload XML files up to 20MB. For larger files, consider splitting them or using the paste option.
                  </AlertDescription>
                </Alert>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    id="xml-file"
                    type="file"
                    accept=".xml"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </div>
                {isLoading && (
                  <div className="text-sm text-muted-foreground">
                    Loading file... This may take a moment for larger files.
                  </div>
                )}
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

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Large File Warning</DialogTitle>
            <DialogDescription>
              You're about to process a large XML file ({largeFile?.size ? Math.round(largeFile.size / (1024 * 1024)) : 0}MB). 
              This might cause your browser to slow down or become unresponsive temporarily.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLargeFile}>
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default XMLUploader;
