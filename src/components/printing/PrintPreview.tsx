import React, { useState, useRef } from 'react';
import { Card, Deck } from '../../types';
import { Printer, Download, Settings, Grid, List } from 'lucide-react';

interface PrintPreviewProps {
  deck: Deck;
  cards: Card[];
  onClose: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ deck, cards, onClose }) => {
  const [printSettings, setPrintSettings] = useState({
    cardSize: deck.card_size,
    cardsPerPage: 6,
    includeBack: true,
    paperSize: 'letter',
    orientation: 'portrait',
    margins: 'normal'
  });
  const [viewMode, setViewMode] = useState<'preview' | 'settings'>('preview');
  const printRef = useRef<HTMLDivElement>(null);

  const cardSizes = {
    '3x5': { width: 216, height: 360 }, // 3x5 inches in points
    '4x6': { width: 288, height: 432 }, // 4x6 inches in points
    '5x8': { width: 360, height: 576 }, // 5x8 inches in points
    'custom': { width: deck.custom_width || 216, height: deck.custom_height || 360 }
  };

  const paperSizes = {
    letter: { width: 612, height: 792 },
    a4: { width: 595, height: 842 },
    legal: { width: 612, height: 1008 }
  };

  const calculateLayout = () => {
    const cardSize = cardSizes[printSettings.cardSize as keyof typeof cardSizes];
    const paperSize = paperSizes[printSettings.paperSize as keyof typeof paperSizes];
    const margin = printSettings.margins === 'normal' ? 36 : 18; // 0.5" or 0.25" margins
    
    const availableWidth = paperSize.width - (margin * 2);
    const availableHeight = paperSize.height - (margin * 2);
    
    const cardsPerRow = Math.floor(availableWidth / (cardSize.width + 18)); // 18pt spacing
    const rowsPerPage = Math.floor(availableHeight / (cardSize.height + 18));
    const cardsPerPage = cardsPerRow * rowsPerPage;
    
    return { cardsPerRow, rowsPerPage, cardsPerPage };
  };

  const generatePrintPages = () => {
    const { cardsPerPage } = calculateLayout();
    const pages = [];
    
    // Front sides
    for (let i = 0; i < cards.length; i += cardsPerPage) {
      pages.push({
        type: 'front',
        cards: cards.slice(i, i + cardsPerPage)
      });
    }
    
    // Back sides (if enabled)
    if (printSettings.includeBack) {
      for (let i = 0; i < cards.length; i += cardsPerPage) {
        pages.push({
          type: 'back',
          cards: cards.slice(i, i + cardsPerPage)
        });
      }
    }
    
    return pages;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // This would integrate with a PDF generation library like jsPDF or Puppeteer
    // For now, we'll use the browser's print to PDF functionality
    window.print();
  };

  const renderCard = (card: Card, side: 'front' | 'back') => {
    const content = side === 'front' ? card.front_content : card.back_content;
    const cardSize = cardSizes[printSettings.cardSize as keyof typeof cardSizes];
    
    return (
      <div
        className="border border-gray-300 bg-white relative overflow-hidden print-card"
        style={{
          width: `${cardSize.width / 4}px`, // Scale down for preview
          height: `${cardSize.height / 4}px`,
          backgroundColor: content.backgroundColor || '#ffffff'
        }}
      >
        {content.backgroundImage && (
          <img
            src={content.backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {content.elements.map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: `${element.x / 4}px`, // Scale down for preview
              top: `${element.y / 4}px`,
              width: `${(element.width || 100) / 4}px`,
              height: `${(element.height || 30) / 4}px`,
              transform: `rotate(${element.rotation || 0}deg)`,
              zIndex: element.zIndex || 1
            }}
          >
            {element.type === 'text' && (
              <div
                style={{
                  fontSize: `${(element.fontSize || 16) / 4}px`, // Scale down for preview
                  fontFamily: element.fontFamily,
                  fontWeight: element.fontWeight,
                  fontStyle: element.fontStyle,
                  color: element.color,
                  backgroundColor: element.backgroundColor,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1px'
                }}
              >
                {element.content}
              </div>
            )}
            
            {element.type === 'shape' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: element.backgroundColor,
                  borderRadius: element.content === 'circle' ? '50%' : '0'
                }}
              />
            )}
            
            {element.type === 'image' && element.content && (
              <img
                src={element.content}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const pages = generatePrintPages();
  const { cardsPerRow } = calculateLayout();

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-900">Print Preview</h2>
          <span className="text-sm text-gray-600">
            {deck.name} • {cards.length} cards
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'preview' ? 'settings' : 'preview')}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-1"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Panel */}
        {viewMode === 'settings' && (
          <div className="w-80 bg-gray-50 border-r p-6 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Print Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Size
                </label>
                <select
                  value={printSettings.cardSize}
                  onChange={(e) => setPrintSettings({ ...printSettings, cardSize: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="3x5">3" × 5"</option>
                  <option value="4x6">4" × 6"</option>
                  <option value="5x8">5" × 8"</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paper Size
                </label>
                <select
                  value={printSettings.paperSize}
                  onChange={(e) => setPrintSettings({ ...printSettings, paperSize: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="letter">Letter (8.5" × 11")</option>
                  <option value="a4">A4</option>
                  <option value="legal">Legal (8.5" × 14")</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <select
                  value={printSettings.orientation}
                  onChange={(e) => setPrintSettings({ ...printSettings, orientation: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margins
                </label>
                <select
                  value={printSettings.margins}
                  onChange={(e) => setPrintSettings({ ...printSettings, margins: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="normal">Normal (0.5")</option>
                  <option value="narrow">Narrow (0.25")</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeBack"
                  checked={printSettings.includeBack}
                  onChange={(e) => setPrintSettings({ ...printSettings, includeBack: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="includeBack" className="text-sm font-medium text-gray-700">
                  Include back sides
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div ref={printRef} className="max-w-4xl mx-auto">
            {pages.map((page, pageIndex) => (
              <div
                key={pageIndex}
                className="bg-white shadow-lg mb-8 p-8 print-page"
                style={{
                  width: '8.5in',
                  minHeight: '11in'
                }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {page.type === 'front' ? 'Front Sides' : 'Back Sides'} - Page {Math.floor(pageIndex / (printSettings.includeBack ? 2 : 1)) + 1}
                  </h3>
                </div>
                
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)`
                  }}
                >
                  {page.cards.map((card) => (
                    <div key={`${card.id}-${page.type}`}>
                      {renderCard(card, page.type as 'front' | 'back')}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print-page {
            page-break-after: always;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0.5in !important;
          }
          
          .print-card {
            width: ${cardSizes[printSettings.cardSize as keyof typeof cardSizes].width}px !important;
            height: ${cardSizes[printSettings.cardSize as keyof typeof cardSizes].height}px !important;
          }
          
          .print-card div {
            font-size: ${(16)}px !important; /* Reset font size for print */
          }
        }
      `}</style>
    </div>
  );
};