import React from 'react';
import { format } from 'date-fns';

interface EmailPreviewProps {
  subject: string;
  recipient: string;
  sender: string;
  body: string;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  subject,
  recipient,
  sender,
  body,
}) => {
  const currentDate = format(new Date(), 'PPP');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Email Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="w-16 font-medium">Date:</span>
            <span>{currentDate}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="w-16 font-medium">From:</span>
            <span>{sender}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="w-16 font-medium">To:</span>
            <span>{recipient}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="w-16 font-medium">Subject:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {subject}
            </span>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="prose dark:prose-invert max-w-none">
        {body.split('\n').map((paragraph, index) => (
          <p key={index} className="text-gray-800 dark:text-gray-200 mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}; 