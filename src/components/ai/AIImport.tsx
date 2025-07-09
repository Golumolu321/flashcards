import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Upload, FileText, Image, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface AIImportProps {
  onImportComplete: (extractedContent: any) => void;
  onClose: () => void;
}

export const AIImport: React.FC<AIImportProps> = ({ onImportComplete, onClose }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
  };

  const processFile = async () => {
    if (!file || !user) return;

    setProcessing(true);
    setError(null);

    try {
      // Get user's Gemini API key
      const { data: profile } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('id', user.id)
        .single();

      if (!profile?.gemini_api_key) {
        throw new Error('Please add your Gemini API key in settings first');
      }

      // Convert file to base64
      const base64 = await fileToBase64(file);
      
      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${profile.gemini_api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Extract key information from this ${file.type.includes('image') ? 'image' : 'document'} and format it as study cards. Return a JSON array of objects with 'front' and 'back' properties for each card. Focus on important concepts, definitions, facts, or questions that would be useful for studying.`
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64.split(',')[1]
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process file with AI');
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content extracted from file');
      }

      // Try to parse JSON from the response
      let extractedCards;
      try {
        // Clean up the response to extract JSON
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          extractedCards = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: create cards from plain text
          extractedCards = [{
            front: 'Extracted Content',
            back: content
          }];
        }
      } catch {
        // If JSON parsing fails, create a single card with the content
        extractedCards = [{
          front: 'Extracted Content',
          back: content
        }];
      }

      // Save extraction to database
      await supabase
        .from('ai_extractions')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          extracted_content: extractedCards,
          cards_generated: extractedCards.length
        });

      setResult(extractedCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImport = () => {
    if (result) {
      onImportComplete(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-5/6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">AI Content Import</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {!file && (
            <div className="text-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 cursor-pointer transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload a file to extract content
                </h3>
                <p className="text-gray-600 mb-4">
                  Supports PDF documents and images (PNG, JPG, JPEG)
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Choose File
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}

          {file && !processing && !result && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                {file.type.includes('image') ? (
                  <Image className="w-12 h-12 text-blue-600" />
                ) : (
                  <FileText className="w-12 h-12 text-blue-600" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {file.name}
              </h3>
              <p className="text-gray-600 mb-6">
                Ready to extract content using AI
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setFile(null)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Choose Different File
                </button>
                <button
                  onClick={processFile}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Extract Content
                </button>
              </div>
            </div>
          )}

          {processing && (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Processing with AI...
              </h3>
              <p className="text-gray-600">
                This may take a few moments
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Processing Failed
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => setFile(null)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {result && (
            <div>
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Extracted {result.length} cards
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-4 mb-6">
                {result.map((card: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Front</h4>
                        <p className="text-sm text-gray-600">{card.front}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Back</h4>
                        <p className="text-sm text-gray-600">{card.back}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setFile(null)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Process Another File
                </button>
                <button
                  onClick={handleImport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Import Cards
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};