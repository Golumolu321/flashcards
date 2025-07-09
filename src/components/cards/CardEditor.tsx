import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardElement } from '../../types';
import { supabase } from '../../lib/supabase';
import { 
  Type, 
  Image, 
  Square, 
  Circle, 
  Save, 
  Undo, 
  Redo, 
  Trash2,
  Copy,
  RotateCw,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';

interface CardEditorProps {
  card: Card;
  onSave: (card: Card) => void;
  onClose: () => void;
}

export const CardEditor: React.FC<CardEditorProps> = ({ card, onSave, onClose }) => {
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<Card[]>([card]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentContent = currentSide === 'front' ? card.front_content : card.back_content;

  const addToHistory = (newCard: Card) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCard);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousCard = history[historyIndex - 1];
      Object.assign(card, previousCard);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextCard = history[historyIndex + 1];
      Object.assign(card, nextCard);
    }
  };

  const addElement = (type: 'text' | 'image' | 'shape', shapeType?: string) => {
    const newElement: CardElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text' : type === 'image' ? '' : shapeType || 'rectangle',
      x: 50,
      y: 50,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 30 : 100,
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#000000',
      backgroundColor: type === 'shape' ? '#e5e7eb' : 'transparent',
      rotation: 0,
      zIndex: currentContent.elements.length + 1
    };

    const updatedCard = {
      ...card,
      [currentSide === 'front' ? 'front_content' : 'back_content']: {
        ...currentContent,
        elements: [...currentContent.elements, newElement]
      }
    };

    addToHistory(updatedCard);
    Object.assign(card, updatedCard);
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<CardElement>) => {
    const updatedElements = currentContent.elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );

    const updatedCard = {
      ...card,
      [currentSide === 'front' ? 'front_content' : 'back_content']: {
        ...currentContent,
        elements: updatedElements
      }
    };

    Object.assign(card, updatedCard);
  };

  const deleteElement = (elementId: string) => {
    const updatedElements = currentContent.elements.filter(el => el.id !== elementId);
    
    const updatedCard = {
      ...card,
      [currentSide === 'front' ? 'front_content' : 'back_content']: {
        ...currentContent,
        elements: updatedElements
      }
    };

    addToHistory(updatedCard);
    Object.assign(card, updatedCard);
    setSelectedElement(null);
  };

  const duplicateElement = (elementId: string) => {
    const element = currentContent.elements.find(el => el.id === elementId);
    if (element) {
      const newElement = {
        ...element,
        id: `element-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
        zIndex: currentContent.elements.length + 1
      };

      const updatedCard = {
        ...card,
        [currentSide === 'front' ? 'front_content' : 'back_content']: {
          ...currentContent,
          elements: [...currentContent.elements, newElement]
        }
      };

      addToHistory(updatedCard);
      Object.assign(card, updatedCard);
      setSelectedElement(newElement.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const element = currentContent.elements.find(el => el.id === elementId);
    if (element) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - element.x,
          y: e.clientY - rect.top - element.y
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedElement) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const newX = e.clientX - rect.left - dragOffset.x;
        const newY = e.clientY - rect.top - dragOffset.y;
        
        updateElement(selectedElement, { x: newX, y: newY });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      addToHistory(card);
    }
  };

  const saveCard = async () => {
    try {
      const { error } = await supabase
        .from('cards')
        .update({
          front_content: card.front_content,
          back_content: card.back_content,
          title: card.title
        })
        .eq('id', card.id);

      if (error) throw error;
      onSave(card);
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const selectedElementData = selectedElement 
    ? currentContent.elements.find(el => el.id === selectedElement)
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={card.title || ''}
              onChange={(e) => updateElement('title', { content: e.target.value })}
              placeholder="Card Title"
              className="text-lg font-semibold bg-transparent border-none outline-none"
            />
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentSide('front')}
                className={`px-3 py-1 rounded ${
                  currentSide === 'front' ? 'bg-white shadow' : ''
                }`}
              >
                Front
              </button>
              <button
                onClick={() => setCurrentSide('back')}
                className={`px-3 py-1 rounded ${
                  currentSide === 'back' ? 'bg-white shadow' : ''
                }`}
              >
                Back
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <Redo className="w-4 h-4" />
            </button>
            <button
              onClick={saveCard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
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
          {/* Toolbar */}
          <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Add Elements */}
              <div>
                <h3 className="font-semibold mb-2">Add Elements</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addElement('text')}
                    className="p-3 border rounded-lg hover:bg-gray-100 flex flex-col items-center"
                  >
                    <Type className="w-5 h-5 mb-1" />
                    <span className="text-xs">Text</span>
                  </button>
                  <button
                    onClick={() => addElement('image')}
                    className="p-3 border rounded-lg hover:bg-gray-100 flex flex-col items-center"
                  >
                    <Image className="w-5 h-5 mb-1" />
                    <span className="text-xs">Image</span>
                  </button>
                  <button
                    onClick={() => addElement('shape', 'rectangle')}
                    className="p-3 border rounded-lg hover:bg-gray-100 flex flex-col items-center"
                  >
                    <Square className="w-5 h-5 mb-1" />
                    <span className="text-xs">Rectangle</span>
                  </button>
                  <button
                    onClick={() => addElement('shape', 'circle')}
                    className="p-3 border rounded-lg hover:bg-gray-100 flex flex-col items-center"
                  >
                    <Circle className="w-5 h-5 mb-1" />
                    <span className="text-xs">Circle</span>
                  </button>
                </div>
              </div>

              {/* Element Properties */}
              {selectedElementData && (
                <div>
                  <h3 className="font-semibold mb-2">Properties</h3>
                  <div className="space-y-3">
                    {selectedElementData.type === 'text' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Content</label>
                          <textarea
                            value={selectedElementData.content}
                            onChange={(e) => updateElement(selectedElement!, { content: e.target.value })}
                            className="w-full p-2 border rounded text-sm"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Font Size</label>
                          <input
                            type="number"
                            value={selectedElementData.fontSize || 16}
                            onChange={(e) => updateElement(selectedElement!, { fontSize: parseInt(e.target.value) })}
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateElement(selectedElement!, { 
                              fontWeight: selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold' 
                            })}
                            className={`p-2 border rounded ${
                              selectedElementData.fontWeight === 'bold' ? 'bg-gray-200' : ''
                            }`}
                          >
                            <Bold className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateElement(selectedElement!, { 
                              fontStyle: selectedElementData.fontStyle === 'italic' ? 'normal' : 'italic' 
                            })}
                            className={`p-2 border rounded ${
                              selectedElementData.fontStyle === 'italic' ? 'bg-gray-200' : ''
                            }`}
                          >
                            <Italic className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">Color</label>
                      <input
                        type="color"
                        value={selectedElementData.color || '#000000'}
                        onChange={(e) => updateElement(selectedElement!, { color: e.target.value })}
                        className="w-full h-8 border rounded"
                      />
                    </div>

                    {selectedElementData.type === 'shape' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Background</label>
                        <input
                          type="color"
                          value={selectedElementData.backgroundColor || '#e5e7eb'}
                          onChange={(e) => updateElement(selectedElement!, { backgroundColor: e.target.value })}
                          className="w-full h-8 border rounded"
                        />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => duplicateElement(selectedElement!)}
                        className="flex-1 p-2 border rounded hover:bg-gray-100 flex items-center justify-center"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteElement(selectedElement!)}
                        className="flex-1 p-2 border rounded hover:bg-red-50 text-red-600 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-8 bg-gray-100 overflow-auto">
            <div className="flex justify-center">
              <div
                ref={canvasRef}
                className="relative bg-white shadow-lg"
                style={{
                  width: '400px',
                  height: '300px',
                  backgroundColor: currentContent.backgroundColor || '#ffffff'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {currentContent.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute cursor-move select-none ${
                      selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      transform: `rotate(${element.rotation || 0}deg)`,
                      zIndex: element.zIndex || 1
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                  >
                    {element.type === 'text' && (
                      <div
                        style={{
                          fontSize: element.fontSize,
                          fontFamily: element.fontFamily,
                          fontWeight: element.fontWeight,
                          fontStyle: element.fontStyle,
                          color: element.color,
                          backgroundColor: element.backgroundColor,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};