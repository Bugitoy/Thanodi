"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

import NextLayout from "@/components/NextLayout";
import GroupCard from "@/components/group";
import MeetingModal from "@/components/MeetingModal";
import { useCompeteRooms } from "@/hooks/useCompeteRooms";
import { useToast } from '@/hooks/use-toast';

const pastelColors = [
  "bg-thanodi-lightPeach",
  "bg-thanodi-blue",
  "bg-thanodi-peach",
  "bg-thanodi-yellow",
  "bg-thanodi-lightPeach",
  "bg-thanodi-blue",
];

const initialValues = {
  dateTime: new Date(),
  description: "",
  link: "/meetups/compete/room/",
};

const Compete = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (isSetupComplete: boolean) => void;
}) => {
  const [search, setSearch] = useState("");

  const router = useRouter();
  const [meetingState, setMeetingState] = useState<"isJoiningMeeting" | undefined>(undefined);
  const [values, setValues] = useState(initialValues);
  const rooms = useCompeteRooms();
  const { user } = useKindeBrowserClient();
  const { toast } = useToast();

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
                description: 'Your account has been blocked by an administrator. You cannot join or create compete rooms.',
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

  const filteredRooms = rooms.filter((room) => {
    return room.roomName.toLowerCase().includes(search.toLowerCase());
  });

  const joinRandomRoom = () => {
    if (filteredRooms.length === 0) return;
    const randomRoom = filteredRooms[Math.floor(Math.random() * filteredRooms.length)];
    router.push(`/meetups/compete/room/${randomRoom.callId}`);
  };

  return (
    <NextLayout>
      <div className="flex flex-col gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">

        <div className="max-w-5xl mx-auto w-full flex flex-col lg:flex-row items-center lg:items-end justify-between gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-7xl font-extrabold text-lightBlue-100 text-center lg:text-left">
            Compete with people on various topics
          </h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a study group..."
            className="w-full max-w-xs px-3 sm:px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-base sm:text-lg shadow-sm transition-colors"
          />
        </div>

        {/* Custom Progress Bar and Leaderboard Button */}
        <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center mb-4 gap-3 sm:gap-4">
          <div className="flex flex-row w-full gap-2 sm:gap-4 lg:gap-8">
            <div
              className="flex-grow h-[60px] sm:h-[70px] lg:h-[80px] bg-yellow-300 rounded-lg cursor-pointer select-none
                        active:translate-y-2 active:[box-shadow:0_0px_0_0_#F7D379,0_0px_0_0_#F7D37941]
                        active:border-b-[0px]
                        transition-all duration-150 [box-shadow:0_10px_0_0_#F7D379,0_15px_0_0_#F7D37941]
                        border-b-[1px] border-yellow-400 shadow"
                        tabIndex={0}
                        role="button"
                         onClick={joinRandomRoom}
                      >
              <span className="flex flex-col justify-center items-center h-full text-gray-800 font-bold text-xs sm:text-base lg:text-lg">
                Random room
              </span>
            </div>

            <div
              className="flex-grow h-[60px] sm:h-[70px] lg:h-[80px] bg-yellow-300 rounded-lg cursor-pointer select-none
                  active:translate-y-2 active:[box-shadow:0_0px_0_0_#F7D379,0_0px_0_0_#F7D37941]
                  active:border-b-[0px]
                  transition-all duration-150 [box-shadow:0_10px_0_0_#F7D379,0_15px_0_0_#F7D37941]
                  border-b-[1px] border-yellow-400 shadow"
                  tabIndex={0}
                  role="button"
                  onClick={() => setMeetingState("isJoiningMeeting")}
                >
                  <span className="flex flex-col justify-center items-center h-full text-gray-800 font-bold text-xs sm:text-base lg:text-lg">
                    Join a room
                  </span>
                </div>
    
                <div
                  className="flex-grow h-[60px] sm:h-[70px] lg:h-[80px] bg-yellow-300 rounded-lg cursor-pointer select-none
                  active:translate-y-2 active:[box-shadow:0_0px_0_0_#F7D379,0_0px_0_0_#F7D37941]
                  active:border-b-[0px]
                  transition-all duration-150 [box-shadow:0_10px_0_0_#F7D379,0_15px_0_0_#F7D37941]
                  border-b-[1px] border-yellow-400 shadow"
                  tabIndex={0}
                  role="button"
                  onClick={() => router.push("/meetups/compete/create-room")}
                >
                  <span className="flex flex-col justify-center items-center h-full text-gray-800 font-bold text-xs sm:text-base lg:text-lg">
                    Create a room
                  </span>
                </div>
              </div>
            </div>
    
            <div className="max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {filteredRooms.length === 0 && (
                <p className="text-center text-gray-500 col-span-full">
                  No public rooms available
                </p>
              )}
              {filteredRooms.map((room, i) => (
                <GroupCard
                  key={room.callId}
                  title={room.roomName}
                  peopleCount={room.members.length}
                  profilePics={room.members}
                  onJoin={() => router.push(`/meetups/compete/room/${room.callId}`)}
                  color={pastelColors[i % pastelColors.length]}
                />
              ))}
            </div>
    
            <MeetingModal
              isOpen={meetingState === "isJoiningMeeting"}
              onClose={() => setMeetingState(undefined)}
              title="Type the link here"
              className="text-center"
              buttonText="Join Meeting"
              handleClick={() => {
                router.push(values.link);
              }}
            >
              <Input
                placeholder="Meeting Link"
                onChange={(e) => setValues({ ...values, link: e.target.value })}
                className="border-none text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[8px] text-center"
              />
            </MeetingModal>
      </div>
    </NextLayout>
  );
};

export default Compete;
