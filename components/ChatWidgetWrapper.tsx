'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const ChatWidget = dynamic(() => import('./chatwidget'), {
  ssr: false,
  loading: () => null,
});

interface ChatWidgetWrapperProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export default function ChatWidgetWrapper({ open, onOpenChange, hideTrigger }: ChatWidgetWrapperProps = {}) {
  const pathname = usePathname();

  if (pathname.startsWith('/owner') || pathname.startsWith('/admin')) {
    return null;
  }

  return <ChatWidget open={open} onOpenChange={onOpenChange} hideTrigger={hideTrigger} />;
}
