'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import NextLayout from '@/components/NextLayout';
import GroupCard from '@/components/group';
import MeetingModal from '@/components/MeetingModal';
import { useStudyGroups } from '@/hooks/useStudyGroups';
import { useStreamStudyTimeTracker } from '@/hooks/useStreamStudyTimeTracker';
import { useStreak } from '@/hooks/useStreak';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { useToast } from '@/hooks/use-toast';

const pastelColors = [
  'bg-thanodi-lightPeach',
  'bg-thanodi-blue',
  'bg-thanodi-peach',
  'bg-thanodi-yellow',
  'bg-thanodi-lightPeach',
  'bg-thanodi-blue',
];

const initialValues = {
    dateTime: new Date(),
    description: '',
    link: '',
  };

const StudyGroups = () => {
  const { dailyHours } = useStreamStudyTimeTracker();
  const { streakData, loading: streakLoading } = useStreak();
  const hoursGoal = 10; // Daily goal in hours
  const percent = Math.min((dailyHours / hoursGoal) * 100, 100);
  
  const [search, setSearch] = useState('');
  const router = useRouter();
  const [meetingState, setMeetingState] = useState< 'isJoiningMeeting' | undefined >(undefined);
  const [values, setValues] = useState(initialValues);
  const { user } = useKindeBrowserClient();
  const { toast } = useToast();
  
  const groups = useStudyGroups();
  const filteredGroups = groups.filter(g => g.roomName.toLowerCase().includes(search.toLowerCase()));

  // Check if user is blocked
  useEffect(() => {
    if (user?.id) {
      const checkBlockStatus = async () => {
        try {
          const res = await fetch(`/api/user/check-block?userId=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.isBlocked) {
              toast({
                title: 'Account Blocked',
                description: 'Your account has been blocked by an administrator. You cannot join or create study groups.',
                variant: 'destructive',
              });
              router.push('/');
            }
          }
        } catch (error) {
          console.error('Error checking block status:', error);
        }
      };
      
      checkBlockStatus();
    }
  }, [user?.id, router, toast]);

  return (
    <NextLayout>
      <div className="flex flex-col gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row items-center md:items-end justify-between gap-4 mb-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-7xl font-extrabold text-lightBlue-100 text-center md:text-left">
            Join a study group
          </h1>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for a study group..."
            className="w-full max-w-xs px-3 sm:px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-base sm:text-lg shadow-sm transition-colors"
          />
        </div>
        {/* Custom Progress Bar and Leaderboard Button */}
        <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-0">
          <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start mb-3 sm:mb-0">
            <div className="flex-shrink-0">
              <div
                className="button w-28 sm:w-36 lg:w-40 h-[40px] sm:h-[45px] lg:h-[50px] bg-yellow-300 rounded-lg cursor-pointer select-none
                  active:translate-y-2 active:[box-shadow:0_0px_0_0_#F7D379,0_0px_0_0_#F7D37941]
                  active:border-b-[0px]
                  transition-all duration-150 [box-shadow:0_10px_0_0_#F7D379,0_15px_0_0_#F7D37941]
                  border-b-[1px] border-yellow-400 shadow"
                tabIndex={0}
                role="button"
                onClick={() => router.push('/meetups/study-groups/leaderboard')}
              >
                <span className="flex flex-col justify-center items-center h-full text-gray-800 font-bold text-xs sm:text-base lg:text-lg">
                  Leaderboard
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div
                className="button w-28 sm:w-36 lg:w-40 h-[40px] sm:h-[45px] lg:h-[50px] bg-yellow-300 rounded-lg cursor-pointer select-none
                  active:translate-y-2 active:[box-shadow:0_0px_0_0_#F7D379,0_0px_0_0_#F7D37941]
                  active:border-b-[0px]
                  transition-all duration-150 [box-shadow:0_10px_0_0_#F7D379,0_15px_0_0_#F7D37941]
                  border-b-[1px] border-yellow-400 shadow"
                tabIndex={0}
                role="button"
                onClick={() => setMeetingState('isJoiningMeeting')}
              >
                <span className="flex flex-col justify-center items-center h-full text-gray-800 font-bold text-xs sm:text-base lg:text-lg">
                  Join a room
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div
                className="button w-28 sm:w-36 lg:w-40 h-[40px] sm:h-[45px] lg:h-[50px] bg-yellow-300 rounded-lg cursor-pointer select-none
                  active:translate-y-2 active:[box-shadow:0_0px_0_0_#F7D379,0_0px_0_0_#F7D37941]
                  active:border-b-[0px]
                  transition-all duration-150 [box-shadow:0_10px_0_0_#F7D379,0_15px_0_0_#F7D37941]
                  border-b-[1px] border-yellow-400 shadow"
                tabIndex={0}
                role="button"
                onClick={() => router.push('/meetups/study-groups/create-room')}
              >
                <span className="flex flex-col justify-center items-center h-full text-gray-800 font-bold text-xs sm:text-base lg:text-lg">
                  Create a room
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex justify-center sm:justify-end w-full sm:w-auto">
            <div className="relative w-full max-w-3xl h-[40px] sm:h-[45px] lg:h-[50px] bg-white rounded-[8px] overflow-hidden flex items-center">
              <div
                className="absolute left-0 top-0 h-full bg-thanodi-blue transition-all duration-500 rounded-[8px]"
                style={{ width: `${percent}%` }}
              />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700 font-semibold text-xs sm:text-sm lg:text-lg select-none pointer-events-none px-2 whitespace-nowrap">
                {dailyHours.toFixed(1)}h / {hoursGoal}h studied today
              </span>
            </div>
          </div>
        </div>
        
        {/* Streak Counter */}
        <div className="max-w-5xl mx-auto w-full flex justify-center mb-4">
          <div className="bg-gradient-to-r from-thanodi-blue to-thanodi-peach rounded-lg p-3 sm:p-4 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-[8px]">
                <span className="text-yellow-600 font-bold text-sm sm:text-lg">⚡</span>
              </div>
              <div className="text-center">
                {streakLoading ? (
                  <div className="text-white font-semibold text-sm sm:text-base">Loading streak...</div>
                ) : (
                  <>
                    <div className="text-white font-bold text-sm sm:text-base">
                      {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''} streak
                    </div>
                    <div className="text-white/80 text-xs sm:text-sm">
                      Best: {streakData.longestStreak} days • Total: {streakData.totalStudyDays} days
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {filteredGroups.length === 0 && (
            <p className="text-center text-gray-500 col-span-full">No rooms available</p>
          )}
          {filteredGroups.map((group, i) => (
            <GroupCard
              key={group.callId}
              title={group.roomName}
              peopleCount={group.members.length}
              profilePics={group.members}
              onJoin={() => router.push(`/meetups/study-groups/meeting/${group.callId}`)}
              color={pastelColors[i % pastelColors.length]}
            />
          ))}
        </div>

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={() => router.push(values.link)}
      >
        <Input
          placeholder="Meeting code"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="border-none text-gray-800 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[8px] text-center"
        />
      </MeetingModal>
      </div>
    </NextLayout>
  );
};

export default StudyGroups;
