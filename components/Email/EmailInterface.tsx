import React, { useState, useRef, useContext } from 'react';
import { IconSend, IconEye, IconEdit } from '@tabler/icons-react';
import HomeContext from '@/pages/api/home/home.context';
import { EmailPreview } from './EmailPreview';

interface EmailFormData {
  subject: string;
  recipient: string;
  sender: string;
  body: string;
}

export const EmailInterface: React.FC = () => {
  const [formData, setFormData] = useState<EmailFormData>({
    subject: '',
    recipient: '',
    sender: '',
    body: ''
  });
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { state: { messageIsStreaming, selectedConversation }, handleUpdateConversation } = useContext(HomeContext);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (selectedConversation) {
      // Add the email as a message in the conversation
      const emailContent = `
Subject: ${formData.subject}
To: ${formData.recipient}
From: ${formData.sender}

${formData.body}`;

      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [
          ...selectedConversation.messages,
          { role: 'user', content: emailContent }
        ]
      });

      // Clear the form
      setFormData({
        subject: '',
        recipient: '',
        sender: '',
        body: ''
      });
    }
  };

  if (isPreview) {
    return (
      <div className="flex flex-col h-full">
        <EmailPreview {...formData} />
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsPreview(false)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 
                     bg-white border border-gray-300 rounded-md hover:bg-gray-50
                     dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                     dark:hover:bg-gray-600"
          >
            <IconEdit className="w-4 h-4 mr-2" />
            Back to Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Compose Professional Email
        </h2>
      </div>

      {/* Email Form */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Subject Line */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter email subject..."
            />
          </div>

          {/* Recipient */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To
            </label>
            <input
              type="email"
              name="recipient"
              value={formData.recipient}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="recipient@example.com"
            />
          </div>

          {/* Sender */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From
            </label>
            <input
              type="email"
              name="sender"
              value={formData.sender}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="your@email.com"
            />
          </div>

          {/* Email Body */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white
                         resize-none"
                placeholder="Write your email message here..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 
                       bg-white border border-gray-300 rounded-md hover:bg-gray-50
                       dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                       dark:hover:bg-gray-600"
            >
              <IconEye className="w-4 h-4 mr-2" />
              Preview
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={messageIsStreaming}
            className="flex items-center px-4 py-2 text-sm font-medium text-white 
                     bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none 
                     focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconSend className="w-4 h-4 mr-2" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}; 