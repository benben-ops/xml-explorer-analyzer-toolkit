
import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface XMLSearchProps {
  onSearch: (term: string, options: SearchOptions) => void;
  isXmlLoaded: boolean;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  searchIn: 'all' | 'elements' | 'attributes' | 'values';
  useRegex: boolean;
}

const XMLSearch: React.FC<XMLSearchProps> = ({ onSearch, isXmlLoaded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    searchIn: 'all',
    useRegex: false,
  });

  const handleSearch = () => {
    onSearch(searchTerm, options);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const updateOption = <K extends keyof SearchOptions>(
    key: K,
    value: SearchOptions[K]
  ) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-secondary/50">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search XML
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isXmlLoaded}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!searchTerm.trim() || !isXmlLoaded}
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        <Collapsible
          open={advancedOpen}
          onOpenChange={setAdvancedOpen}
          className="mt-4"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex gap-1">
              <Filter className="h-4 w-4" />
              {advancedOpen ? "Hide Advanced Options" : "Show Advanced Options"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="case-sensitive"
                    checked={options.caseSensitive}
                    onCheckedChange={(checked) =>
                      updateOption("caseSensitive", checked)
                    }
                  />
                  <Label htmlFor="case-sensitive">Case sensitive</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="whole-word"
                    checked={options.wholeWord}
                    onCheckedChange={(checked) =>
                      updateOption("wholeWord", checked)
                    }
                  />
                  <Label htmlFor="whole-word">Match whole word</Label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-regex"
                    checked={options.useRegex}
                    onCheckedChange={(checked) =>
                      updateOption("useRegex", checked)
                    }
                  />
                  <Label htmlFor="use-regex">Use regular expression</Label>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="search-in">Search in</Label>
                  <Select
                    value={options.searchIn}
                    onValueChange={(value) =>
                      updateOption(
                        "searchIn",
                        value as "all" | "elements" | "attributes" | "values"
                      )
                    }
                  >
                    <SelectTrigger id="search-in">
                      <SelectValue placeholder="Search in..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="elements">Element names</SelectItem>
                      <SelectItem value="attributes">Attributes</SelectItem>
                      <SelectItem value="values">Values</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default XMLSearch;
