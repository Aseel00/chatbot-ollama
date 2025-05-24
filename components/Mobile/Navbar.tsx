import { IconPlus, IconMail } from '@tabler/icons-react';
import { FC } from 'react';

import { Conversation } from '@/types/chat';

interface Props {
  selectedConversation: Conversation;
  onNewConversation: () => void;
}

export const Navbar: FC<Props> = ({
  selectedConversation,
  onNewConversation,
}) => {
  return (
    <nav className="flex w-full justify-between items-center bg-[#1e293b] py-3 px-4">
      <div className="flex items-center">
        <IconMail size={24} className="text-blue-500 mr-2" />
        <span className="text-lg font-semibold text-white">Email Assistant</span>
      </div>

      <div className="max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap text-gray-300">
        {selectedConversation.name}
      </div>

      <button
        className="email-button p-2 rounded-md hover:opacity-80 flex items-center"
        onClick={onNewConversation}
      >
        <IconPlus size={20} />
      </button>
    </nav>
  );
};
