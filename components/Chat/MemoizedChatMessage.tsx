import { IconCheck, IconCopy, IconEdit, IconRobot, IconUser } from '@tabler/icons-react';
import { FC, memo, useEffect, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { Message } from '@/types/chat';

interface Props {
  message: Message;
  messageIndex: number;
  onEdit?: (editedMessage: Message) => void;
}

export const MemoizedChatMessage: FC<Props> = memo(
  ({ message, messageIndex, onEdit }) => {
    const { t } = useTranslation('chat');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [messageContent, setMessageContent] = useState(message.content);
    const [messagedCopied, setMessageCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(message.content);
      setMessageCopied(true);
    };

    useEffect(() => {
      if (messagedCopied) {
        const timeout = setTimeout(() => {
          setMessageCopied(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }, [messagedCopied]);

    return (
      <div
        className={`${
          message.role === 'assistant'
            ? 'assistant-message'
            : 'user-message'
        } group md:px-4 email-typography`}
      >
        <div className="relative flex items-start md:gap-6 md:py-6">
          <div className="min-w-[40px] text-right font-bold">
            {message.role === 'assistant' ? (
              <IconRobot size={30} className="mr-2" />
            ) : (
              <IconUser size={30} className="mr-2" />
            )}
          </div>

          <div className="prose mt-[-2px] w-full dark:prose-invert">
            {message.role === 'assistant' ? (
              <div className="flex w-full">
                {isEditing ? (
                  <div className="flex w-full flex-col">
                    <textarea
                      className="w-full resize-none rounded-lg border border-neutral-300 px-4 py-3 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600 dark:border-neutral-600 dark:bg-[#343541] dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={5}
                    />

                    <div className="mt-10 flex justify-center space-x-4">
                      <button
                        className="h-[40px] rounded-md bg-blue-500 px-4 py-1 text-sm font-medium text-white enabled:hover:bg-blue-600 disabled:opacity-50"
                        onClick={() => {
                          if (onEdit) {
                            onEdit({
                              ...message,
                              content: messageContent,
                            });
                          }
                          setIsEditing(false);
                        }}
                      >
                        {t('Save & Submit')}
                      </button>

                      <button
                        className="h-[40px] rounded-md border border-neutral-300 px-4 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        onClick={() => {
                          setMessageContent(message.content);
                          setIsEditing(false);
                        }}
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose whitespace-pre-wrap dark:prose-invert flex-1">
                    {message.content}
                  </div>
                )}

                {!isEditing && (
                  <div className="md:-mr-8 ml-1 md:ml-0 flex flex-col md:flex-row gap-4 md:gap-1 items-center md:items-start">
                    <button
                      className="invisible group-hover:visible focus:visible text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={handleCopy}
                    >
                      {messagedCopied ? (
                        <IconCheck size={20} />
                      ) : (
                        <IconCopy size={20} />
                      )}
                    </button>

                    {onEdit && (
                      <button
                        className="invisible group-hover:visible focus:visible text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        onClick={() => setIsEditing(true)}
                      >
                        <IconEdit size={20} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="prose whitespace-pre-wrap dark:prose-invert">
                {message.content}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
