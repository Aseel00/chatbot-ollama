import { IconRefresh } from '@tabler/icons-react';
import { FC } from 'react';

import { useTranslation } from 'next-i18next';

interface Props {
  onRegenerate: () => void;
}

export const Regenerate: FC<Props> = ({ onRegenerate }) => {
  const { t } = useTranslation('chat');
  return (
    <div className="fixed bottom-4 left-0 right-0 ml-auto mr-auto w-full px-2 sm:absolute sm:bottom-8 sm:left-[280px] sm:w-1/2 lg:left-[200px]">
      <div className="mb-4 text-center text-red-500">
        {t('Sorry, there was an error.')}
      </div>
      <button
        className="flex h-12 gap-2 w-full items-center justify-center rounded-lg border border-b-neutral-300 bg-white shadow-sm hover:bg-neutral-50 transition-colors duration-200 text-sm font-semibold text-neutral-600 dark:border-none dark:bg-[#444654] dark:text-neutral-200 dark:hover:bg-[#4d4f5c]"
        onClick={onRegenerate}
      >
        <IconRefresh size={18} stroke={1.5} />
        <div>{t('Regenerate response')}</div>
      </button>
    </div>
  );
};
