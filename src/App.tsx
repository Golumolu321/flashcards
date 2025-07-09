import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { CardEditor } from './components/cards/CardEditor';
import { TemplateLibrary } from './components/templates/TemplateLibrary';
import { AIImport } from './components/ai/AIImport';
import { ShareModal } from './components/collaboration/ShareModal';
import { PrintPreview } from './components/printing/PrintPreview';
import { Settings } from './components/settings/Settings';
import { Card, Deck, Folder, Template } from './types';

function App() {
  const { user, loading } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedResource, setSelectedResource] = useState<{ resource: Deck | Folder; type: 'deck' | 'folder' } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading StudyCard Creator...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const handleOpenCardEditor = (card: Card) => {
    setSelectedCard(card);
    setActiveModal('cardEditor');
  };

  const handleOpenTemplateLibrary = () => {
    setActiveModal('templateLibrary');
  };

  const handleOpenAIImport = () => {
    setActiveModal('aiImport');
  };

  const handleOpenShare = (resource: Deck | Folder, type: 'deck' | 'folder') => {
    setSelectedResource({ resource, type });
    setActiveModal('share');
  };

  const handleOpenPrintPreview = (deck: Deck, cards: Card[]) => {
    setSelectedDeck(deck);
    setActiveModal('printPreview');
  };

  const handleOpenSettings = () => {
    setActiveModal('settings');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedCard(null);
    setSelectedDeck(null);
    setSelectedFolder(null);
    setSelectedResource(null);
  };

  const handleSelectTemplate = (template: Template) => {
    // This would be handled by the Dashboard component
    console.log('Selected template:', template);
    closeModal();
  };

  const handleAIImportComplete = (extractedContent: any) => {
    // This would be handled by the Dashboard component
    console.log('AI import complete:', extractedContent);
    closeModal();
  };

  const handleCardSave = (card: Card) => {
    // This would trigger a refresh in the Dashboard
    console.log('Card saved:', card);
    closeModal();
  };

  return (
    <Layout onOpenSettings={handleOpenSettings}>
      <Routes>
        <Route 
          path="/" 
          element={
            <Dashboard 
              onOpenCardEditor={handleOpenCardEditor}
              onOpenTemplateLibrary={handleOpenTemplateLibrary}
              onOpenAIImport={handleOpenAIImport}
              onOpenShare={handleOpenShare}
              onOpenPrintPreview={handleOpenPrintPreview}
            />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Modals */}
      {activeModal === 'cardEditor' && selectedCard && (
        <CardEditor
          card={selectedCard}
          onSave={handleCardSave}
          onClose={closeModal}
        />
      )}

      {activeModal === 'templateLibrary' && (
        <TemplateLibrary
          onSelectTemplate={handleSelectTemplate}
          onClose={closeModal}
        />
      )}

      {activeModal === 'aiImport' && (
        <AIImport
          onImportComplete={handleAIImportComplete}
          onClose={closeModal}
        />
      )}

      {activeModal === 'share' && selectedResource && (
        <ShareModal
          resource={selectedResource.resource}
          resourceType={selectedResource.type}
          onClose={closeModal}
        />
      )}

      {activeModal === 'printPreview' && selectedDeck && (
        <PrintPreview
          deck={selectedDeck}
          cards={[]} // This would be passed from Dashboard
          onClose={closeModal}
        />
      )}

      {activeModal === 'settings' && (
        <Settings onClose={closeModal} />
      )}
    </Layout>
  );
}

export default App;