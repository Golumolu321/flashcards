import React, { useState, useEffect } from 'react';
import { Deck, Folder, Collaborator } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Share2, Copy, Mail, UserPlus, Trash2, Crown, Edit, Eye } from 'lucide-react';

interface ShareModalProps {
  resource: Deck | Folder;
  resourceType: 'deck' | 'folder';
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ resource, resourceType, onClose }) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<(Collaborator & { profiles: { email: string; full_name?: string } })[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    fetchCollaborators();
    generateShareLink();
  }, []);

  const fetchCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('resource_type', resourceType)
        .eq('resource_id', resource.id);

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/shared/${resourceType}/${resource.id}`);
  };

  const inviteCollaborator = async () => {
    if (!inviteEmail.trim() || !user) return;

    setLoading(true);
    try {
      // First, check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim())
        .single();

      if (!existingUser) {
        alert('User not found. They need to create an account first.');
        return;
      }

      // Check if already a collaborator
      const { data: existingCollaborator } = await supabase
        .from('collaborators')
        .select('id')
        .eq('resource_type', resourceType)
        .eq('resource_id', resource.id)
        .eq('user_id', existingUser.id)
        .single();

      if (existingCollaborator) {
        alert('User is already a collaborator');
        return;
      }

      // Add collaborator
      const { error } = await supabase
        .from('collaborators')
        .insert({
          resource_type: resourceType,
          resource_id: resource.id,
          user_id: existingUser.id,
          permission: invitePermission,
          invited_by: user.id
        });

      if (error) throw error;

      setInviteEmail('');
      fetchCollaborators();
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      alert('Failed to invite collaborator');
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (collaboratorId: string, newPermission: 'view' | 'edit' | 'admin') => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .update({ permission: newPermission })
        .eq('id', collaboratorId);

      if (error) throw error;
      fetchCollaborators();
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
      fetchCollaborators();
    } catch (error) {
      console.error('Error removing collaborator:', error);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    // You could add a toast notification here
  };

  const togglePublicSharing = async () => {
    try {
      const { error } = await supabase
        .from(resourceType === 'deck' ? 'decks' : 'folders')
        .update({ is_shared: !resource.is_shared })
        .eq('id', resource.id);

      if (error) throw error;
      
      // Update local resource state
      resource.is_shared = !resource.is_shared;
    } catch (error) {
      console.error('Error toggling public sharing:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-5/6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Share2 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Share {resourceType}</h2>
              <p className="text-sm text-gray-600">{resource.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Public Sharing */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">Public Access</h3>
                <p className="text-sm text-gray-600">
                  Anyone with the link can {resource.is_shared ? 'view' : 'access'} this {resourceType}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={resource.is_shared}
                  onChange={togglePublicSharing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {resource.is_shared && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyShareLink}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-1"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            )}
          </div>

          {/* Invite Collaborators */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Invite People</h3>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={invitePermission}
                onChange={(e) => setInvitePermission(e.target.value as 'view' | 'edit')}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>
              <button
                onClick={inviteCollaborator}
                disabled={loading || !inviteEmail.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite</span>
              </button>
            </div>
          </div>

          {/* Current Collaborators */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">People with access</h3>
            <div className="space-y-2">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">You</p>
                    <p className="text-sm text-gray-600">Owner</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Owner</span>
              </div>

              {/* Collaborators */}
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {collaborator.profiles.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {collaborator.profiles.full_name || collaborator.profiles.email}
                      </p>
                      <p className="text-sm text-gray-600">{collaborator.profiles.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={collaborator.permission}
                      onChange={(e) => updatePermission(collaborator.id, e.target.value as any)}
                      className="px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="view">Can view</option>
                      <option value="edit">Can edit</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => removeCollaborator(collaborator.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No collaborators yet. Invite people to start collaborating!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};