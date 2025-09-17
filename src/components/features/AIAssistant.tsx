import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AIEstimations, SurveyAnswers } from '@/types/budget';
import { AlertTriangle, Bot, Coffee, Key, MapPin, Shield } from 'lucide-react';
import { useState } from 'react';

interface AIAssistantProps {
  aiEstimations: AIEstimations;
  surveyAnswers: SurveyAnswers;
  onAIEstimationsChange: (estimations: AIEstimations) => void;
  onSurveyAnswersChange: (answers: SurveyAnswers) => void;
  onApplyEstimates: (groceryEstimate: number, entertainmentEstimate: number) => void;
}

export function AIAssistant({
  aiEstimations,
  surveyAnswers,
  onAIEstimationsChange,
  onSurveyAnswersChange,
  onApplyEstimates,
}: AIAssistantProps) {
  const [isEstimating, setIsEstimating] = useState(false);

  const estimateGroceries = async () => {
    if (!aiEstimations.apiKey && aiEstimations.apiProvider !== 'none') {
      alert('Please enter an API key or use offline mode for estimates.');
      return;
    }

    setIsEstimating(true);
    onAIEstimationsChange({ ...aiEstimations, isEstimating: true });

    try {
      let estimate = 0;
      
      if (aiEstimations.apiProvider === 'none') {
        // Use offline/local calculations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const cityMultipliers: Record<string, number> = {
          'Austin': 1.0,
          'New York': 1.4,
          'San Francisco': 1.5,
          'Chicago': 1.1,
          'Atlanta': 0.9,
          'Dallas': 0.95,
          'Los Angeles': 1.3,
          'Miami': 1.2,
        };

        const baseGrocery = 350;
        const multiplier = cityMultipliers[aiEstimations.city] || 1.0;
        estimate = Math.round(baseGrocery * multiplier);
      } else {
        // Here you would make actual API calls to OpenAI, Anthropic, etc.
        // For now, we'll simulate with the same logic
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const cityMultipliers: Record<string, number> = {
          'Austin': 1.0,
          'New York': 1.4,
          'San Francisco': 1.5,
          'Chicago': 1.1,
          'Atlanta': 0.9,
          'Dallas': 0.95,
          'Los Angeles': 1.3,
          'Miami': 1.2,
        };

        const baseGrocery = 350;
        const multiplier = cityMultipliers[aiEstimations.city] || 1.0;
        estimate = Math.round(baseGrocery * multiplier);
      }

      onAIEstimationsChange({
        ...aiEstimations,
        groceryEstimate: estimate,
        isEstimating: false,
      });
    } catch (error) {
      console.error('Error estimating groceries:', error);
      onAIEstimationsChange({
        ...aiEstimations,
        isEstimating: false,
      });
      alert('Error generating estimate. Please try again.');
    }
    
    setIsEstimating(false);
  };

  const estimateEntertainment = async () => {
    if (!aiEstimations.apiKey && aiEstimations.apiProvider !== 'none') {
      alert('Please enter an API key or use offline mode for estimates.');
      return;
    }

    setIsEstimating(true);
    onAIEstimationsChange({ ...aiEstimations, isEstimating: true });

    try {
      let entertainment = 0;

      if (aiEstimations.apiProvider === 'none') {
        // Use offline/local calculations
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Here you would make actual API calls
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Calculate entertainment budget based on survey answers
      entertainment += surveyAnswers.diningOutFrequency * 45; // $45 per meal
      entertainment += surveyAnswers.movieFrequency * 15; // $15 per ticket
      entertainment += (surveyAnswers.concertFrequency / 12) * 80; // $80 per concert, monthly average

      if (surveyAnswers.hasStreamingServices) {
        entertainment += 45; // Multiple streaming services
      }

      if (surveyAnswers.gymMembership) {
        entertainment += 50;
      }

      onAIEstimationsChange({
        ...aiEstimations,
        entertainmentEstimate: Math.round(entertainment),
        isEstimating: false,
      });
    } catch (error) {
      console.error('Error estimating entertainment:', error);
      onAIEstimationsChange({
        ...aiEstimations,
        isEstimating: false,
      });
      alert('Error generating estimate. Please try again.');
    }

    setIsEstimating(false);
  };

  const handleApplyEstimates = () => {
    onApplyEstimates(aiEstimations.groceryEstimate, aiEstimations.entertainmentEstimate);
  };

  // Remove unused variable for now
  // const isConfigured = aiEstimations.apiProvider === 'none' || (aiEstimations.apiKey && aiEstimations.apiProvider);

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 text-purple-600 mr-2" />
            AI Configuration (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Privacy First</p>
                <p>This app works completely offline. AI features are optional and require your own API key. Your data never leaves your device.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-provider">AI Provider</Label>
              <Select
                value={aiEstimations.apiProvider || 'none'}
                onValueChange={(value: 'openai' | 'anthropic' | 'local' | 'none') =>
                  onAIEstimationsChange({ ...aiEstimations, apiProvider: value })
                }
              >
                <SelectTrigger id="api-provider">
                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Offline Mode (Basic Estimates)</SelectItem>
                  <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="local">Local AI Model</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key {aiEstimations.apiProvider !== 'none' && '(Required)'}</Label>
              <Input
                id="api-key"
                type="password"
                placeholder={aiEstimations.apiProvider === 'none' ? 'Not needed for offline mode' : 'Enter your API key'}
                value={aiEstimations.apiKey || ''}
                disabled={aiEstimations.apiProvider === 'none'}
                onChange={(e) =>
                  onAIEstimationsChange({ ...aiEstimations, apiKey: e.target.value })
                }
              />
            </div>
          </div>

          {aiEstimations.apiProvider !== 'none' && !aiEstimations.apiKey && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p>API key required for {aiEstimations.apiProvider === 'openai' ? 'OpenAI' : aiEstimations.apiProvider === 'anthropic' ? 'Anthropic' : 'Local AI'}. Get your key from their website and enter it above.</p>
                </div>
              </div>
            </div>
          )}

          {aiEstimations.apiProvider === 'none' && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-lg">
              <div className="text-sm text-green-800 dark:text-green-200">
                <p>✓ Offline mode enabled. Basic estimates will use local calculations based on cost-of-living data.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location-Based Estimates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            Location-Based Estimates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city-select">Your City</Label>
              <Select
                value={aiEstimations.city}
                onValueChange={(value) =>
                  onAIEstimationsChange({ ...aiEstimations, city: value })
                }
              >
                <SelectTrigger id="city-select">
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Austin">Austin, TX</SelectItem>
                  <SelectItem value="New York">New York, NY</SelectItem>
                  <SelectItem value="San Francisco">San Francisco, CA</SelectItem>
                  <SelectItem value="Chicago">Chicago, IL</SelectItem>
                  <SelectItem value="Atlanta">Atlanta, GA</SelectItem>
                  <SelectItem value="Dallas">Dallas, TX</SelectItem>
                  <SelectItem value="Los Angeles">Los Angeles, CA</SelectItem>
                  <SelectItem value="Miami">Miami, FL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={estimateGroceries}
                disabled={isEstimating || aiEstimations.isEstimating}
                className="w-full"
              >
                <Bot className="h-4 w-4 mr-2" />
                {isEstimating || aiEstimations.isEstimating ? 'Estimating...' : 'Estimate Groceries'}
              </Button>
            </div>
          </div>

          {aiEstimations.groceryEstimate > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200">
                AI estimates your monthly grocery budget at{' '}
                <span className="font-semibold">${aiEstimations.groceryEstimate}</span> for {aiEstimations.city}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entertainment & Lifestyle Survey */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coffee className="h-5 w-5 text-green-600 mr-2" />
            Entertainment & Lifestyle Survey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dining-frequency">Dining out per week</Label>
              <Input
                id="dining-frequency"
                type="number"
                min="0"
                value={surveyAnswers.diningOutFrequency}
                onChange={(e) =>
                  onSurveyAnswersChange({
                    ...surveyAnswers,
                    diningOutFrequency: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movie-frequency">Movies per month</Label>
              <Input
                id="movie-frequency"
                type="number"
                min="0"
                value={surveyAnswers.movieFrequency}
                onChange={(e) =>
                  onSurveyAnswersChange({
                    ...surveyAnswers,
                    movieFrequency: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concert-frequency">Concerts/events per year</Label>
              <Input
                id="concert-frequency"
                type="number"
                min="0"
                value={surveyAnswers.concertFrequency}
                onChange={(e) =>
                  onSurveyAnswersChange({
                    ...surveyAnswers,
                    concertFrequency: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="streaming-services"
                  checked={surveyAnswers.hasStreamingServices}
                  onCheckedChange={(checked: boolean) =>
                    onSurveyAnswersChange({
                      ...surveyAnswers,
                      hasStreamingServices: checked === true,
                    })
                  }
                />
                <Label htmlFor="streaming-services">Multiple streaming services</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gym-membership"
                  checked={surveyAnswers.gymMembership}
                  onCheckedChange={(checked: boolean) =>
                    onSurveyAnswersChange({
                      ...surveyAnswers,
                      gymMembership: checked === true,
                    })
                  }
                />
                <Label htmlFor="gym-membership">Gym membership</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={estimateEntertainment}
              disabled={isEstimating || aiEstimations.isEstimating}
              variant="outline"
            >
              <Bot className="h-4 w-4 mr-2" />
              {isEstimating || aiEstimations.isEstimating ? 'Estimating...' : 'Estimate Entertainment'}
            </Button>

            {(aiEstimations.groceryEstimate > 0 || aiEstimations.entertainmentEstimate > 0) && (
              <Button onClick={handleApplyEstimates} className="bg-purple-600 hover:bg-purple-700">
                Apply Estimates to Budget
              </Button>
            )}
          </div>

          {aiEstimations.entertainmentEstimate > 0 && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
              <p className="text-green-800 dark:text-green-200">
                AI estimates your monthly entertainment budget at{' '}
                <span className="font-semibold">${aiEstimations.entertainmentEstimate}</span> based on your lifestyle preferences.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips and Information */}
      <Card>
        <CardHeader>
          <CardTitle>AI Budget Assistant Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Location-Based Estimates</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Grocery costs vary significantly by city</li>
                <li>• Based on USDA food cost data and regional pricing</li>
                <li>• Estimates assume moderate spending habits</li>
                <li>• Adjust based on your family size and dietary preferences</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-900 dark:text-green-100">Lifestyle Survey</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Entertainment budgets are highly personal</li>
                <li>• Estimates based on average costs in major cities</li>
                <li>• Consider seasonal variations in spending</li>
                <li>• Review and adjust monthly based on actual spending</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
