'use client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

const EndCallButton = () => {
  const call = useCall();
  const router = useRouter();

  if (!call)
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );

  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#participant-state-3
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    await call.endCall();
    try {
        await fetch(`/api/study-groups/${call.id}`, { method: 'PUT' });
      } catch (err) {
        console.error('Failed to mark study group ended', err);
      }
    router.push('/meetups/study-groups');
  };

  return (
    <Button onClick={endCall} className="bg-red-500 px-2 sm:px-4 py-2 text-xs sm:text-sm">
      <span className="hidden sm:inline md:hidden lg:inline xl:hidden">End call for everyone</span>
      <span className="sm:hidden md:inline lg:hidden xl:inline">End</span>
    </Button>
  );
};

export default EndCallButton;
