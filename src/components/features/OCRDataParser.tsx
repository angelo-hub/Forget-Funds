import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OneTimeExpense, RecurringExpense } from '@/types/budget';
import { Camera, FileImage, Loader2, Scan, Trash2, Upload } from 'lucide-react';
// import { Scanner } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { createWorker, type Worker } from 'tesseract.js';

interface ParsedAccountBalance {
  id: number;
  accountName: string;
  balance: number;
  accountType: 'checking' | 'savings' | 'retirement';
  lastFourDigits?: string;
  confidence: number;
  originalText: string;
}

interface OCRDataParserProps {
  onExpensesParsed: (expenses: (RecurringExpense | OneTimeExpense)[]) => void;
  onAccountsParsed: (accounts: ParsedAccountBalance[]) => void;
}

interface ParsedExpense {
  id: number;
  description: string;
  amount: number;
  category: string;
  type: 'recurring' | 'onetime';
  confidence: number;
  originalText: string;
}

interface OCRResult {
  text: string;
  confidence: number;
  expenses: ParsedExpense[];
  accounts: ParsedAccountBalance[];
  documentType: 'expense' | 'statement' | 'mixed';
}

export function OCRDataParser({ onExpensesParsed, onAccountsParsed }: OCRDataParserProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [parsedAccounts, setParsedAccounts] = useState<ParsedAccountBalance[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Prevent default drag behavior on the entire document
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('dragenter', preventDefaults, false);
    document.addEventListener('dragover', preventDefaults, false);
    document.addEventListener('dragleave', preventDefaults, false);
    document.addEventListener('drop', handleDocumentDrop, false);

    return () => {
      document.removeEventListener('dragenter', preventDefaults, false);
      document.removeEventListener('dragover', preventDefaults, false);
      document.removeEventListener('dragleave', preventDefaults, false);
      document.removeEventListener('drop', handleDocumentDrop, false);
    };
  }, []);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  }, []);

  const processImageFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, GIF, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select an image smaller than 10MB.');
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Clear previous results
    setOcrResult(null);
    setParsedExpenses([]);
    setParsedAccounts([]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      processImageFile(imageFile);
    } else {
      alert('Please drop a valid image file.');
    }
  }, [processImageFile]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('image-upload')?.click();
    }
  }, []);

  const parseFinancialData = (text: string): ParsedExpense[] => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const expenses: ParsedExpense[] = [];
    let idCounter = 1;

    for (const line of lines) {
      // Look for currency amounts (supports $, €, £, etc.)
      const amountMatch = line.match(/[\$€£¥₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        
        // Skip very small amounts (likely noise) or very large amounts (likely account balances)
        if (amount < 1 || amount > 10000) continue;

        // Extract description (text before or after the amount)
        const description = line
          .replace(amountMatch[0], '')
          .replace(/[\*\-\+\#]/g, '') // Remove common formatting characters
          .trim();

        if (description.length > 2) {
          // Categorize based on keywords
          const category = categorizeExpense(description);
          
          // Determine if it's recurring based on keywords
          const isRecurring = isRecurringExpense(description);
          
          expenses.push({
            id: idCounter++,
            description: description.substring(0, 50), // Limit description length
            amount,
            category,
            type: isRecurring ? 'recurring' : 'onetime',
            confidence: calculateConfidence(line, amountMatch[0]),
            originalText: line,
          });
        }
      }
    }

    // Sort by confidence (highest first) and limit to top 10
    return expenses
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  };

  const parseAccountBalances = (text: string): ParsedAccountBalance[] => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const accounts: ParsedAccountBalance[] = [];
    let idCounter = 1;

    for (const line of lines) {
      // Look for account patterns like "Checking ...1234 $1,234.56" or "401(k) ...5678 $45,000.00"
      const accountMatch = line.match(/(checking|savings|401\(?k\)?|ira|roth\s+ira|403\(?b\)?|sep[\-\s]?ira|simple\s+ira)[\s\w]*[\.\*]{2,4}(\d{4})\s*[\$€£¥₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
      
      if (accountMatch) {
        const accountTypeText = accountMatch[1].toLowerCase();
        const lastFour = accountMatch[2];
        const balance = parseFloat(accountMatch[3].replace(/,/g, ''));
        
        // Determine account type
        let accountType: 'checking' | 'savings' | 'retirement' = 'checking';
        if (accountTypeText.includes('savings')) {
          accountType = 'savings';
        } else if (accountTypeText.includes('401') || accountTypeText.includes('ira') || accountTypeText.includes('403')) {
          accountType = 'retirement';
        }

        // Extract account name
        const accountName = line
          .replace(accountMatch[0], '')
          .replace(/[\*\-\+\#]/g, '')
          .trim() || `${accountTypeText.charAt(0).toUpperCase() + accountTypeText.slice(1)} Account`;

        accounts.push({
          id: idCounter++,
          accountName: accountName.substring(0, 50),
          balance,
          accountType,
          lastFourDigits: lastFour,
          confidence: calculateAccountConfidence(line, accountMatch[0]),
          originalText: line,
        });
      }

      // Also look for balance patterns like "Current Balance: $1,234.56"
      const balanceMatch = line.match(/(current\s+balance|available\s+balance|account\s+balance)[\s:]*[\$€£¥₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
      if (balanceMatch && !accountMatch) {
        const balance = parseFloat(balanceMatch[2].replace(/,/g, ''));
        
        accounts.push({
          id: idCounter++,
          accountName: 'Account Balance',
          balance,
          accountType: 'checking',
          confidence: calculateAccountConfidence(line, balanceMatch[0]) - 20, // Lower confidence for generic balance
          originalText: line,
        });
      }
    }

    // Sort by confidence and remove duplicates
    return accounts
      .sort((a, b) => b.confidence - a.confidence)
      .filter((account, index, arr) => 
        index === arr.findIndex(a => 
          Math.abs(a.balance - account.balance) < 0.01 && 
          a.lastFourDigits === account.lastFourDigits
        )
      )
      .slice(0, 5);
  };

  const calculateAccountConfidence = (fullLine: string, matchText: string): number => {
    let confidence = 60; // Base confidence
    
    // Higher confidence for well-formatted lines
    if (fullLine.includes('$') || fullLine.includes('€') || fullLine.includes('£')) confidence += 10;
    if (fullLine.match(/\d{4}/)) confidence += 15; // Has 4-digit number (likely account digits)
    if (fullLine.toLowerCase().includes('balance')) confidence += 10;
    if (fullLine.toLowerCase().includes('current') || fullLine.toLowerCase().includes('available')) confidence += 5;
    if (matchText.includes(',')) confidence += 5; // Formatted number
    
    return Math.min(confidence, 95);
  };

  const categorizeExpense = (description: string): string => {
    const desc = description.toLowerCase();
    
    // Common categories based on keywords
    if (desc.includes('grocery') || desc.includes('food') || desc.includes('market') || desc.includes('walmart') || desc.includes('target')) {
      return 'Groceries';
    }
    if (desc.includes('gas') || desc.includes('fuel') || desc.includes('shell') || desc.includes('chevron')) {
      return 'Transportation';
    }
    if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('dining') || desc.includes('pizza')) {
      return 'Dining Out';
    }
    if (desc.includes('electric') || desc.includes('utility') || desc.includes('water') || desc.includes('internet')) {
      return 'Utilities';
    }
    if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('property')) {
      return 'Housing';
    }
    if (desc.includes('insurance') || desc.includes('medical') || desc.includes('health') || desc.includes('doctor')) {
      return 'Healthcare';
    }
    if (desc.includes('subscription') || desc.includes('netflix') || desc.includes('spotify') || desc.includes('streaming')) {
      return 'Entertainment';
    }
    if (desc.includes('amazon') || desc.includes('shopping') || desc.includes('store')) {
      return 'Shopping';
    }
    
    return 'Other';
  };

  const isRecurringExpense = (description: string): boolean => {
    const desc = description.toLowerCase();
    const recurringKeywords = [
      'subscription', 'monthly', 'rent', 'mortgage', 'insurance', 
      'utility', 'electric', 'water', 'internet', 'phone', 'netflix', 
      'spotify', 'gym', 'membership'
    ];
    
    return recurringKeywords.some(keyword => desc.includes(keyword));
  };

  const calculateConfidence = (fullLine: string, amountText: string): number => {
    let confidence = 60; // Base confidence
    
    // Higher confidence for well-formatted lines
    if (fullLine.includes('$') || fullLine.includes('€') || fullLine.includes('£')) confidence += 10;
    if (fullLine.match(/\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/)) confidence += 15; // Has date
    if (fullLine.length > 10 && fullLine.length < 80) confidence += 10; // Good length
    if (amountText.includes('.')) confidence += 5; // Has decimal
    
    return Math.min(confidence, 95);
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setParsedExpenses([]);
    setProgress(0);

    try {
      // Initialize Tesseract worker
      const worker: Worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Configure for better financial text recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$/€£¥₹-+ ',
      });

      // Process the image
      const { data } = await worker.recognize(selectedImage);
      
      // Parse financial data from OCR text
      const expenses = parseFinancialData(data.text);
      const accounts = parseAccountBalances(data.text);
      
      // Determine document type
      let documentType: 'expense' | 'statement' | 'mixed' = 'expense';
      if (accounts.length > 0 && expenses.length === 0) {
        documentType = 'statement';
      } else if (accounts.length > 0 && expenses.length > 0) {
        documentType = 'mixed';
      }
      
      setOcrResult({
        text: data.text,
        confidence: data.confidence,
        expenses,
        accounts,
        documentType,
      });
      
      setParsedExpenses(expenses);
      setParsedAccounts(accounts);

      await worker.terminate();
    } catch (error) {
      console.error('OCR processing error:', error);
      alert('Error processing image. Please try again with a clearer image.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const updateExpense = (id: number, field: keyof ParsedExpense, value: any) => {
    setParsedExpenses(prev => 
      (prev || []).map(expense => 
        expense.id === id ? { ...expense, [field]: value } : expense
      )
    );
  };

  const removeExpense = (id: number) => {
    setParsedExpenses(prev => (prev || []).filter(expense => expense.id !== id));
  };

  const applyExpenses = () => {
    const finalExpenses = (parsedExpenses || []).map(expense => {
      if (expense.type === 'recurring') {
        return {
          id: Math.max(Date.now(), Math.random() * 1000000),
          category: expense.description,
          amount: expense.amount,
        } as RecurringExpense;
      } else {
        return {
          id: Math.max(Date.now(), Math.random() * 1000000),
          description: expense.description,
          amount: expense.amount,
        } as OneTimeExpense;
      }
    });

    onExpensesParsed(finalExpenses);
    
    // Clear the form
    setSelectedImage(null);
    setImagePreview(null);
    setOcrResult(null);
    setParsedExpenses([]);
  };

  const clearAll = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setOcrResult(null);
    setParsedExpenses([]);
    setParsedAccounts([]);
    setProgress(0);
  };

  const updateAccount = (id: number, field: keyof ParsedAccountBalance, value: any) => {
    setParsedAccounts(prev => 
      (prev || []).map(account => 
        account.id === id ? { ...account, [field]: value } : account
      )
    );
  };

  const removeAccount = (id: number) => {
    setParsedAccounts(prev => (prev || []).filter(account => account.id !== id));
  };

  const applyAccounts = () => {
    onAccountsParsed(parsedAccounts || []);
    setParsedAccounts([]);
    alert(`${(parsedAccounts || []).length} account balance(s) have been parsed and are ready to be matched with your existing accounts.`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Scan className="h-5 w-5 text-indigo-600 mr-2" />
            OCR Data Parser
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload screenshots of bank statements, receipts, or expense reports to automatically extract financial data. All processing happens offline on your device.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Privacy Notice */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Camera className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-medium mb-1">100% Offline & Private</p>
                <p>All image processing happens locally on your device. No data is sent to external servers.</p>
              </div>
            </div>
          </div>

          {/* Drag and Drop Upload */}
          <div className="space-y-4">
            <Label>Upload Image</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="button"
              aria-label="Upload image file"
            >
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {!selectedImage ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Upload className={`h-12 w-12 ${isDragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="space-y-2">
                    <p className={`text-lg font-medium ${isDragOver ? 'text-indigo-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      {isDragOver ? 'Drop your image here' : 'Drag and drop your image here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports PNG, JPG, GIF, WebP (max 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <FileImage className="h-6 w-6 text-blue-600" />
                    <span className="text-sm font-medium">{selectedImage.name}</span>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="space-y-4">
              <Label>Image Preview</Label>
              <div className="border rounded-lg p-4 bg-muted/50">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="max-w-full max-h-64 mx-auto rounded"
                />
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="w-full max-w-xs"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing... {progress}%
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4 mr-2" />
                      Extract Data
                    </>
                  )}
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-center text-sm text-muted-foreground">
                    Analyzing image and extracting financial data...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* OCR Results */}
          {ocrResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>
                  Extracted Data ({(parsedExpenses || []).length} expenses, {(parsedAccounts || []).length} accounts)
                  <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {ocrResult.documentType === 'expense' ? 'Expense Document' : 
                     ocrResult.documentType === 'statement' ? 'Account Statement' : 'Mixed Document'}
                  </span>
                </Label>
                <div className="text-sm text-muted-foreground">
                  OCR Confidence: {Math.round(ocrResult.confidence)}%
                </div>
              </div>

              {(parsedExpenses || []).length === 0 && (parsedAccounts || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Scan className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No financial data detected in this image.</p>
                  <p className="text-sm mt-2">Try uploading a clearer image with visible amounts and descriptions.</p>
                </div>
              ) : (
                <Tabs defaultValue="expenses" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="expenses">
                      Expenses ({(parsedExpenses || []).length})
                    </TabsTrigger>
                    <TabsTrigger value="accounts">
                      Accounts ({(parsedAccounts || []).length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="expenses" className="space-y-4">
                    {(parsedExpenses || []).map(expense => (
                    <Card key={expense.id} className="border-l-4 border-l-indigo-500">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`desc-${expense.id}`}>Description</Label>
                            <Input
                              id={`desc-${expense.id}`}
                              value={expense.description}
                              onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`amount-${expense.id}`}>Amount</Label>
                            <Input
                              id={`amount-${expense.id}`}
                              type="number"
                              step="0.01"
                              value={expense.amount}
                              onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`type-${expense.id}`}>Type</Label>
                            <Select
                              value={expense.type}
                              onValueChange={(value) => updateExpense(expense.id, 'type', value)}
                            >
                              <SelectTrigger id={`type-${expense.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="recurring">Recurring</SelectItem>
                                <SelectItem value="onetime">One-time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-end justify-between">
                            <div className="text-xs text-muted-foreground">
                              Confidence: {expense.confidence}%
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExpense(expense.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                          Original: {expense.originalText}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={clearAll}>
                        Clear All
                      </Button>
                      <Button onClick={applyExpenses}>
                        Add {(parsedExpenses || []).length} Expense{(parsedExpenses || []).length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="accounts" className="space-y-4">
                    {(parsedAccounts || []).map(account => (
                      <Card key={account.id} className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`acc-name-${account.id}`}>Account Name</Label>
                              <Input
                                id={`acc-name-${account.id}`}
                                value={account.accountName}
                                onChange={(e) => updateAccount(account.id, 'accountName', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`acc-balance-${account.id}`}>Balance</Label>
                              <Input
                                id={`acc-balance-${account.id}`}
                                type="number"
                                step="0.01"
                                value={account.balance}
                                onChange={(e) => updateAccount(account.id, 'balance', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`acc-type-${account.id}`}>Type</Label>
                              <Select
                                value={account.accountType}
                                onValueChange={(value) => updateAccount(account.id, 'accountType', value)}
                              >
                                <SelectTrigger id={`acc-type-${account.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="checking">Checking</SelectItem>
                                  <SelectItem value="savings">Savings</SelectItem>
                                  <SelectItem value="retirement">Retirement</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`acc-digits-${account.id}`}>Last 4 Digits</Label>
                              <Input
                                id={`acc-digits-${account.id}`}
                                value={account.lastFourDigits || ''}
                                onChange={(e) => updateAccount(account.id, 'lastFourDigits', e.target.value)}
                                placeholder="1234"
                                maxLength={4}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                              Confidence: {account.confidence}%
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                            Original: {account.originalText}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={clearAll}>
                        Clear All
                      </Button>
                      <Button onClick={applyAccounts}>
                        Parse {(parsedAccounts || []).length} Account{(parsedAccounts || []).length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
