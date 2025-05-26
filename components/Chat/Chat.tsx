import { IconClearAll, IconSettings } from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { getEndpoint } from '@/utils/app/api';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from './SystemPrompt';
import { TemperatureSlider } from './Temperature';
import { MemoizedChatMessage } from './MemoizedChatMessage';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}


const assistantQuestions = [
  "👋 Hi Art Medical",
  "📧 Who will be receiving this email?",
  "👤 What name should I use as the sender?",
  "📝 What's the main purpose or subject of this email?",
  "📋 What key points or details should we include?",
  "📏 How long should the email be? (short, medium, or detailed)",
  "🎯 What tone should we use? (formal, semi-formal, or casual)",
];

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');
  const {
    state: {
      selectedConversation,
      conversations,
      models,
      messageIsStreaming,
      modelError,
      loading,
      prompts,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);

  const handleSend = useCallback(
    async (message: Message, deleteCount = 0) => {
      if (selectedConversation) {
        let updatedConversation: Conversation;
        if (deleteCount) {
          const updatedMessages = [...selectedConversation.messages];
          for (let i = 0; i < deleteCount; i++) {
            updatedMessages.pop();
          }
          updatedConversation = {
            ...selectedConversation,
            messages: [...updatedMessages, message],
          };
        } else {
          updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          };
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });

        // Handle confirmation state first
        if (questionIndex === -2) {
          if (message.content.toLowerCase() === 'yes') {
            // Generate email with stored answers
            const emailPrompt = `Write a professional email with the following details:
- Recipient: ${answers[1]}
- Sender: ${answers[2]}
- Purpose: ${answers[3]}
- Important Details: ${answers[4]}
- Length: ${answers[5]}
- Tone/Formality: ${answers[6]}

Please format it as a proper email with subject line, greeting, body, and signature. The email should be ${answers[5].toLowerCase()} in length.`;

            // Make the API call to generate the email without adding the prompt to conversation
            homeDispatch({ field: 'loading', value: true });
            homeDispatch({ field: 'messageIsStreaming', value: true });

            try {
              const chatBody: ChatBody = {
                model: updatedConversation.model?.name,
                system: updatedConversation.prompt,
                prompt: emailPrompt,
                options: { temperature: updatedConversation.temperature },
              };

              const endpoint = getEndpoint();
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(chatBody),
              });

              if (!response.ok) {
                throw new Error(response.statusText);
              }

              const data = response.body;
              if (!data) {
                throw new Error('No data received');
              }

              const reader = data.getReader();
              const decoder = new TextDecoder();
              let text = '';

              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                text += chunk;

                // Update the conversation with the current text
                const messagesWithResponse: Message[] = [
                  ...updatedConversation.messages,
                  { role: 'assistant' as const, content: text }
                ];

                const conversationWithResponse = {
                  ...updatedConversation,
                  messages: messagesWithResponse,
                };

                homeDispatch({
                  field: 'selectedConversation',
                  value: conversationWithResponse,
                });
              }

              // Save the final conversation state
              const finalMessages: Message[] = [
                ...updatedConversation.messages,
                { role: 'assistant' as const, content: text }
              ];

              const finalConversation = {
                ...updatedConversation,
                messages: finalMessages,
              };

              homeDispatch({
                field: 'selectedConversation',
                value: finalConversation,
              });
              saveConversation(finalConversation);

              // Update conversations list
              const updatedConversations = conversations.map((conversation) =>
                conversation.id === selectedConversation.id ? finalConversation : conversation
              );
              
              homeDispatch({ field: 'conversations', value: updatedConversations });
              saveConversations(updatedConversations);
              setQuestionIndex(-1); // Reset question index after email generation
              setAnswers([]); // Clear answers after email generation

            } catch (error) {
              console.error('Error generating email:', error);
              toast.error('Failed to generate email. Please try again.');
            } finally {
              homeDispatch({ field: 'loading', value: false });
              homeDispatch({ field: 'messageIsStreaming', value: false });
            }
          } else if (message.content.toLowerCase() === 'no') {
            // Reset the conversation to start over
            setQuestionIndex(0);
            setAnswers([]);
            
            // Add the first question back
            const updatedMessages: Message[] = [
              ...updatedConversation.messages,
              { role: 'assistant', content: assistantQuestions[0] },
            ];

            const newConversation: Conversation = {
              ...updatedConversation,
              messages: updatedMessages,
            };

            homeDispatch({
              field: 'selectedConversation',
              value: newConversation,
            });

            saveConversation(newConversation);
          } else {
            // Invalid response, ask again
            const updatedMessages: Message[] = [
              ...updatedConversation.messages,
              { role: 'assistant', content: "Please respond with 'yes' to generate the email, or 'no' to start over." },
            ];

            const newConversation: Conversation = {
              ...updatedConversation,
              messages: updatedMessages,
            };

            homeDispatch({
              field: 'selectedConversation',
              value: newConversation,
            });

            saveConversation(newConversation);
          }
          return;
        }

        if (questionIndex >= 0) setAnswers(prev => [...prev, message.content]);

        // Add next assistant question, if available
        if (questionIndex + 1 < assistantQuestions.length) {
          const nextQuestion = assistantQuestions[questionIndex + 1];

          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: nextQuestion },
          ];

          const newConversation: Conversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };

          homeDispatch({
            field: 'selectedConversation',
            value: newConversation,
          });

          saveConversation(newConversation);
          setQuestionIndex((prev) => prev + 1);
          return;
        }
        else if (questionIndex + 1 === assistantQuestions.length) {
          const allAnswers = [...answers, message.content];
          
          // Show summary and ask for confirmation
          const summary = `Here's a summary of your email preferences:
📧 Recipient: ${allAnswers[1]}
👤 Sender: ${allAnswers[2]}
📝 Purpose: ${allAnswers[3]}
📋 Key Details: ${allAnswers[4]}
📏 Length: ${allAnswers[5]}
🎯 Tone: ${allAnswers[6]}

Is this correct? Please respond with 'yes' to generate the email, or 'no' to start over.`;

          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: summary },
          ];

          const newConversation: Conversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };

          homeDispatch({
            field: 'selectedConversation',
            value: newConversation,
          });

          saveConversation(newConversation);
          
          // Store answers for use after confirmation
          setAnswers(allAnswers);
          setQuestionIndex(-2); // Use -2 to indicate waiting for confirmation
          return;
        }

        // Continue with regular chat handling
        homeDispatch({ field: 'loading', value: true });
        homeDispatch({ field: 'messageIsStreaming', value: true });
        const chatBody: ChatBody = {
          model: updatedConversation.model?.name,
          system: updatedConversation.prompt,
          prompt: updatedConversation.messages.map(message => message.content).join(' '),
          //messages: updatedConversation.messages,
          options: { temperature: updatedConversation.temperature },
        };
        const endpoint = getEndpoint();
        let body;
        body = JSON.stringify({
          ...chatBody,
        });
        const controller = new AbortController();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal,
          body,
        });
        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          toast.error(response.statusText);
          return;
        }
        const data = response.body;
        if (!data) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          return;
        }
        if (!false) {
          if (updatedConversation.messages.length === 1) {
            const { content } = message;
            const customName =
              content.length > 30 ? content.substring(0, 30) + '...' : content;
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            };
          }
          homeDispatch({ field: 'loading', value: false });
          const reader = data.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let isFirst = true;
          let text = '';
          while (!done) {
          if (stopConversationRef.current === true) {
            controller.abort();
            done = true;
            break;
          }
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunkValue = decoder.decode(value);
          text += chunkValue;
          if (isFirst) {
            isFirst = false;
            const updatedMessages: Message[] = [
              ...updatedConversation.messages,
              { role: 'assistant', content: chunkValue },
            ];
            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            };
            homeDispatch({
              field: 'selectedConversation',
              value: updatedConversation,
            });
            } else {
              const updatedMessages: Message[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: text,
                    };
                  }
                  return message;
                });
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            }
          } 
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'messageIsStreaming', value: false });
        } else {
          const { answer } = await response.json();
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: answer },
          ];
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: 'selectedConversation',
            value: updateConversation,
          });
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
        }
      }
    },
    [
      conversations,
      selectedConversation,
      stopConversationRef,
      homeDispatch,
    ],
  );

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      });
      setQuestionIndex(0);
      setAnswers([]); // Clear answers when clearing conversation
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);

  useEffect(() => {
  throttledScrollDown();

  if (selectedConversation) {
    const numMessages = selectedConversation.messages.length;

    if (numMessages === 0 ) {
      // New conversation, inject first assistant question
      const firstQuestion = assistantQuestions[0];
      const updatedConversation: Conversation = {
        ...selectedConversation,
        messages: [{ role: 'assistant', content: firstQuestion }],
      };

      homeDispatch({
        field: 'selectedConversation',
        value: updatedConversation,
      });

      saveConversation(updatedConversation);
      setQuestionIndex(0);
      setAnswers([]); // Clear answers when starting new conversation
    } else {
      setCurrentMessage(
        selectedConversation.messages[numMessages - 2]
      );
    }
  }
}, [selectedConversation, throttledScrollDown]);



  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#1e293b]">
      <div className="max-h-full overflow-x-hidden email-typography">
        <div
          className="max-w-[800px] mx-auto px-4 email-theme"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {selectedConversation?.messages.map((message, index) => (
            <MemoizedChatMessage
              key={index}
              message={message}
              messageIndex={index}
              onEdit={(editedMessage) => {
                setCurrentMessage(editedMessage);
                // Implement edit functionality
              }}
            />
          ))}

          {loading && <ChatLoader />}

          <div
            className="h-[162px] bg-white dark:bg-[#1e293b]"
            ref={messagesEndRef}
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full border-t bg-white dark:border-white/20 dark:bg-[#1e293b] email-theme">
        <div className="max-w-[800px] mx-auto mt-2 px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <button
                className="email-button p-2 rounded-md hover:opacity-80"
                onClick={onClearAll}
              >
                <IconClearAll size={20} />
              </button>
            </div>

            <div className="flex items-center">
              <button
                className="email-button p-2 rounded-md hover:opacity-80 ml-2"
                onClick={handleSettings}
              >
                <IconSettings size={20} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={textareaRef}
              onSend={(message, deleteCount) => {
                handleSend(message, deleteCount);
              }}
              onScrollDownClick={handleScrollDown}
              onRegenerate={() => {
                if (currentMessage) {
                  handleSend(currentMessage, 2);
                }
              }}
              showScrollDownButton={showScrollDownButton}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
Chat.displayName = 'Chat';
